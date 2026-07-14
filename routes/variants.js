const express = require("express");
const multer = require("multer");
const path = require("path");
const { Readable } = require("stream");
const { getBucket } = require("../config/gridfs");
const ProductVariant = require("../models/ProductVariant");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper: build BASE_URL đúng (https + /api) — đồng bộ với products.js
function getBaseUrl(req) {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : req.protocol;
  return `${protocol}://${req.get("host")}/api`;
}

// Helper: build full image URL từ filename lưu trong DB
function buildImageUrl(baseUrl, filename) {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  const cleanName = filename.replace(/^\/?(images\/)?/, "");
  return `${baseUrl}/products/images/${cleanName}`;
}

// Helper: upload 1 file vào GridFS, trả về filename thuần
function uploadToGridFS(file) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const readableStream = Readable.from(file.buffer);
    const uniqueFilename = `${Date.now()}-${path.basename(file.originalname)}`;

    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      contentType: file.mimetype,
    });

    readableStream.pipe(uploadStream);
    uploadStream.on("finish", () => resolve(uniqueFilename));
    uploadStream.on("error", reject);
  });
}

// Helper: xoá 1 file khỏi GridFS theo filename
async function deleteFromGridFS(filename) {
  if (!filename) return;
  const bucket = getBucket();
  const cleanName = filename.replace(/^\/?(images\/)?/, "");
  const files = await bucket.find({ filename: cleanName }).toArray();
  for (const file of files) {
    await bucket.delete(file._id);
  }
}

// ─────────────────────────────────────────────
// POST / — Thêm variant
// ─────────────────────────────────────────────
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { product, size, color, price, discountPrice, stock } = req.body;

    if (!product || !size || !color || !price) {
      return res
        .status(400)
        .json({
          error: "Thiếu thông tin bắt buộc (product, size, color, price)",
        });
    }

    const existed = await ProductVariant.findOne({ product, size, color });
    if (existed) {
      return res.status(400).json({ error: "Biến thể này đã tồn tại!" });
    }

    const image = req.file ? await uploadToGridFS(req.file) : null;

    const variant = await ProductVariant.create({
      product,
      size,
      color,
      price,
      discountPrice,
      stock,
      image, // chỉ lưu filename thuần trong DB, KHÔNG lưu full URL
    });

    const BASE_URL = getBaseUrl(req);
    const variantObj = variant.toObject();
    variantObj.image = buildImageUrl(BASE_URL, variantObj.image);

    res.status(201).json(variantObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /:id — Sửa variant
// ─────────────────────────────────────────────
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const oldVariant = await ProductVariant.findById(req.params.id);
      if (oldVariant?.image) {
        await deleteFromGridFS(oldVariant.image);
      }
      updateData.image = await uploadToGridFS(req.file);
    }

    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!variant)
      return res.status(404).json({ error: "Không tìm thấy variant" });

    const BASE_URL = getBaseUrl(req);
    const variantObj = variant.toObject();
    variantObj.image = buildImageUrl(BASE_URL, variantObj.image);

    res.json(variantObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /:id — Xóa variant (+ xoá ảnh GridFS)
// ─────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndDelete(req.params.id);
    if (!variant)
      return res.status(404).json({ error: "Không tìm thấy variant" });

    if (variant.image) {
      await deleteFromGridFS(variant.image);
    }

    res.json({ message: "Xóa variant thành công", variant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /product/:productId — Lấy tất cả variant của 1 sản phẩm
// ─────────────────────────────────────────────
router.get("/product/:productId", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const variants = await ProductVariant.find({
      product: req.params.productId,
    }).lean();

    const variantsWithFullImage = variants.map((v) => ({
      ...v,
      image: buildImageUrl(BASE_URL, v.image),
    }));

    res.json(variantsWithFullImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
