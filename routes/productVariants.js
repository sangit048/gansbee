const express = require("express");
const ProductVariant = require("../models/ProductVariant");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/variants"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 👉 API: Thêm variant (có hình, kiểm tra trùng, trả về image đầy đủ)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { product, size, color, price, discountPrice, stock } = req.body;
    const image = req.file ? "/images/variants/" + req.file.filename : null;

    // Kiểm tra trùng biến thể (cùng product, size, color)
    const existed = await ProductVariant.findOne({ product, size, color });
    if (existed) {
      return res.status(400).json({ error: "Biến thể này đã tồn tại!" });
    }

    const variant = await ProductVariant.create({
      product,
      size,
      color,
      price,
      discountPrice,
      stock,
      image,
    });

    // Trả về image đầy đủ BASE_URL
    const variantObj = variant.toObject();
    variantObj.image = variantObj.image
      ? variantObj.image.startsWith("http")
        ? variantObj.image
        : BASE_URL + variantObj.image
      : null;

    res.json(variantObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 API: Sửa variant (có hình, trả về image đầy đủ)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = "/images/variants/" + req.file.filename;
    }
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!variant)
      return res.status(404).json({ error: "Không tìm thấy variant" });

    // Trả về image đầy đủ BASE_URL
    const variantObj = variant.toObject();
    variantObj.image = variantObj.image
      ? variantObj.image.startsWith("http")
        ? variantObj.image
        : BASE_URL + variantObj.image
      : null;

    res.json(variantObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 API: Xóa variant
router.delete("/:id", async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndDelete(req.params.id);
    if (!variant)
      return res.status(404).json({ error: "Không tìm thấy variant" });
    res.json({ message: "Xóa variant thành công", variant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 API: Lấy tất cả variant của 1 sản phẩm (trả về image đầy đủ)
router.get("/product/:productId", async (req, res) => {
  try {
    const variants = await ProductVariant.find({
      product: req.params.productId,
    }).lean();
    const variantsWithFullImage = variants.map((v) => ({
      ...v,
      image: v.image
        ? v.image.startsWith("http")
          ? v.image
          : BASE_URL + v.image
        : null,
    }));
    res.json(variantsWithFullImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
