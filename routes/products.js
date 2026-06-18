const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { Readable } = require("stream");
const { getBucket } = require("../config/gridfs");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper: tạo unique filename, upload vào GridFS, trả về tên file thuần
function uploadToGridFS(file) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const readableStream = Readable.from(file.buffer);

    // Unique filename để tránh trùng
    const uniqueFilename = `${Date.now()}-${path.basename(file.originalname)}`;

    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      contentType: file.mimetype,
    });

    readableStream.pipe(uploadStream);

    uploadStream.on("finish", () => resolve(uniqueFilename)); // ✅ chỉ lưu tên file
    uploadStream.on("error", reject);
  });
}

// Helper: build image URL sạch
function buildImageUrl(baseUrl, filename) {
  // Normalize: bỏ prefix thừa nếu data cũ lưu "/images/..." hoặc "images/..."
  const cleanName = filename.replace(/^\/?(images\/)?/, "");
  return `${baseUrl}/products/images/${cleanName}`;
}

// ─────────────────────────────────────────────
// GET /products/images/:filename — Trả ảnh ra FE
// ─────────────────────────────────────────────
router.get("/images/:filename", async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket
      .find({ filename: req.params.filename })
      .toArray();

    if (!files || files.length === 0)
      return res.status(404).json({ error: "Không tìm thấy ảnh" });

    res.set("Content-Type", files[0].contentType || "image/jpeg");
    bucket.openDownloadStreamByName(req.params.filename).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /debug-images — Liệt kê tất cả file trong GridFS
// PHẢI đặt trước /:id
// ─────────────────────────────────────────────
router.get("/debug-images", async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({}).toArray();
    res.json({ total: files.length, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET / — Lấy tất cả sản phẩm
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const products = await Product.find().populate("category").lean();

    const productsWithVariants = await Promise.all(
      products.map(async (p) => {
        const variants = await ProductVariant.find({ product: p._id }).lean();
        const images = (p.images || []).map((filename) =>
          buildImageUrl(BASE_URL, filename),
        );
        return { ...p, images, variants };
      }),
    );

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /all
// ─────────────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const products = await Product.find().populate("category").lean();

    const productsWithVariants = await Promise.all(
      products.map(async (p) => {
        const variants = await ProductVariant.find({ product: p._id }).lean();
        const images = (p.images || []).map((filename) =>
          buildImageUrl(BASE_URL, filename),
        );
        return { ...p, images, variants };
      }),
    );

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /:id — PHẢI đặt sau tất cả route tĩnh
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const product = await Product.findById(req.params.id)
      .populate("category")
      .lean();

    if (!product)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    const variants = await ProductVariant.find({ product: product._id }).lean();
    const images = (product.images || []).map((filename) =>
      buildImageUrl(BASE_URL, filename),
    );

    res.json({ ...product, images, variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST / — Thêm sản phẩm
// ─────────────────────────────────────────────
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name)
      return res.status(400).json({ error: "Tên sản phẩm là bắt buộc" });

    const images = req.files
      ? await Promise.all(req.files.map((f) => uploadToGridFS(f)))
      : [];

    const product = new Product({ name, description, category, images });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /:id — Sửa sản phẩm
// ─────────────────────────────────────────────
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const updateData = { name, description, category };

    if (req.files && req.files.length > 0) {
      // Xóa ảnh cũ trước
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct) {
        const bucket = getBucket();
        for (const filename of oldProduct.images || []) {
          const cleanName = filename.replace(/^\/?(images\/)?/, "");
          const files = await bucket.find({ filename: cleanName }).toArray();
          for (const file of files) {
            await bucket.delete(file._id);
          }
        }
      }

      updateData.images = await Promise.all(
        req.files.map((f) => uploadToGridFS(f)),
      );
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!product)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /:id — Xóa sản phẩm + variants + ảnh GridFS
// ─────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    const bucket = getBucket();
    for (const filename of product.images || []) {
      const cleanName = filename.replace(/^\/?(images\/)?/, "");
      const files = await bucket.find({ filename: cleanName }).toArray();
      for (const file of files) {
        await bucket.delete(file._id);
      }
    }

    await ProductVariant.deleteMany({ product: product._id });

    res.json({ message: "Xóa sản phẩm và các variants thành công", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
