// const express = require("express");
// const ProductVariant = require("../models/ProductVariant");
// const multer = require("multer");
// const path = require("path");

// const router = express.Router();

// const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "../public/images/variants"));
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // 👉 API: Thêm variant (có hình, kiểm tra trùng, trả về image đầy đủ)
// router.post("/", upload.single("image"), async (req, res) => {
//   try {
//     const { product, size, color, price, discountPrice, stock } = req.body;
//     const image = req.file ? "/images/variants/" + req.file.filename : null;

//     // Kiểm tra trùng biến thể (cùng product, size, color)
//     const existed = await ProductVariant.findOne({ product, size, color });
//     if (existed) {
//       return res.status(400).json({ error: "Biến thể này đã tồn tại!" });
//     }

//     const variant = await ProductVariant.create({
//       product,
//       size,
//       color,
//       price,
//       discountPrice,
//       stock,
//       image,
//     });

//     // Trả về image đầy đủ BASE_URL
//     const variantObj = variant.toObject();
//     variantObj.image = variantObj.image
//       ? variantObj.image.startsWith("http")
//         ? variantObj.image
//         : BASE_URL + variantObj.image
//       : null;

//     res.json(variantObj);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Sửa variant (có hình, trả về image đầy đủ)
// router.put("/:id", upload.single("image"), async (req, res) => {
//   try {
//     const updateData = { ...req.body };
//     if (req.file) {
//       updateData.image = "/images/variants/" + req.file.filename;
//     }
//     const variant = await ProductVariant.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     );
//     if (!variant)
//       return res.status(404).json({ error: "Không tìm thấy variant" });

//     // Trả về image đầy đủ BASE_URL
//     const variantObj = variant.toObject();
//     variantObj.image = variantObj.image
//       ? variantObj.image.startsWith("http")
//         ? variantObj.image
//         : BASE_URL + variantObj.image
//       : null;

//     res.json(variantObj);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Xóa variant
// router.delete("/:id", async (req, res) => {
//   try {
//     const variant = await ProductVariant.findByIdAndDelete(req.params.id);
//     if (!variant)
//       return res.status(404).json({ error: "Không tìm thấy variant" });
//     res.json({ message: "Xóa variant thành công", variant });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Lấy tất cả variant của 1 sản phẩm (trả về image đầy đủ)
// router.get("/product/:productId", async (req, res) => {
//   try {
//     const variants = await ProductVariant.find({
//       product: req.params.productId,
//     }).lean();
//     const variantsWithFullImage = variants.map((v) => ({
//       ...v,
//       image: v.image
//         ? v.image.startsWith("http")
//           ? v.image
//           : BASE_URL + v.image
//         : null,
//     }));
//     res.json(variantsWithFullImage);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { Readable } = require("stream");
const { getBucket } = require("../config/gridfs");
const ProductVariant = require("../models/ProductVariant");

const router = express.Router();

// Dùng memoryStorage thay vì diskStorage — không ghi file ra ổ đĩa
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper: build BASE_URL đúng (https + /api), giống products.js
function getBaseUrl(req) {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : req.protocol;
  return `${protocol}://${req.get("host")}/api`;
}

// Helper: build URL ảnh đầy đủ — TÁI SỬ DỤNG route /api/products/images/:filename
// vì cùng chung 1 GridFS bucket với ảnh sản phẩm
function buildImageUrl(baseUrl, filename) {
  if (!filename) return null;
  const cleanName = filename.replace(/^\/?(images\/)?(variants\/)?/, "");
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

// Helper: xóa file cũ khỏi GridFS
async function deleteFromGridFS(filename) {
  if (!filename) return;
  const bucket = getBucket();
  const cleanName = filename.replace(/^\/?(images\/)?(variants\/)?/, "");
  const files = await bucket.find({ filename: cleanName }).toArray();
  for (const file of files) {
    await bucket.delete(file._id);
  }
}

// ─────────────────────────────────────────────
// POST / — Thêm variant (có hình, kiểm tra trùng, trả về image đầy đủ)
// ─────────────────────────────────────────────
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { product, size, color, price, discountPrice, stock } = req.body;

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
      image,
    });

    const BASE_URL = getBaseUrl(req);
    const variantObj = variant.toObject();
    variantObj.image = buildImageUrl(BASE_URL, variantObj.image);

    res.json(variantObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /:id — Sửa variant (có hình, trả về image đầy đủ)
// ─────────────────────────────────────────────
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      // Xóa ảnh cũ khỏi GridFS trước khi lưu ảnh mới
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
// DELETE /:id — Xóa variant + ảnh GridFS
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
