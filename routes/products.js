const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ProductVariant = require("../models/ProductVariant");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("category").lean();

    const productsWithVariants = await Promise.all(
      products.map(async (p) => {
        const variants = await ProductVariant.find({ product: p._id }).lean();
        // Map lại image của từng variant
        const variantsWithFullImage = variants.map((v) => ({
          ...v,
          image: v.image
            ? v.image.startsWith("http")
              ? v.image
              : BASE_URL + v.image
            : null,
        }));

        const images = (p.images || []).map((img) =>
          img.startsWith("http") ? img : BASE_URL + img
        );

        let category = p.category;
        if (category && category.image) {
          category = {
            ...category,
            image: category.image.startsWith("http")
              ? category.image
              : BASE_URL + category.image,
          };
        }

        return {
          ...p,
          images,
          category,
          variants: variantsWithFullImage, // dùng mảng đã xử lý
        };
      })
    );

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 API: Lấy chi tiết 1 sản phẩm kèm variants
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .lean();
    if (!product)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    const variants = await ProductVariant.find({ product: product._id }).lean();
    // Map lại image của từng variant
    const variantsWithFullImage = variants.map((v) => ({
      ...v,
      image: v.image
        ? v.image.startsWith("http")
          ? v.image
          : BASE_URL + v.image
        : null,
    }));

    const images = (product.images || []).map((img) =>
      img.startsWith("http") ? img : BASE_URL + img
    );
    let category = product.category;
    if (category && category.image) {
      category = {
        ...category,
        image: category.image.startsWith("http")
          ? category.image
          : BASE_URL + category.image,
      };
    }

    res.json({
      ...product,
      images,
      category,
      variants: variantsWithFullImage, // dùng mảng đã xử lý
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 👉 API: Thêm sản phẩm (chỉ thêm product cơ bản)
// router.post("/", upload.array("images", 5), async (req, res) => {
//   try {
//     const { name, description, category } = req.body;

//     const imagePaths = req.files
//       ? req.files.map((f) => "/images/" + f.filename)
//       : [];

//     const product = new Product({
//       name,
//       description,
//       category,
//       images: imagePaths,
//     });

//     await product.save();
//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tên sản phẩm là bắt buộc" });
    }

    const imagePaths = req.files
      ? req.files.map((f) => "/images/" + f.filename)
      : [];

    const product = new Product({
      name,
      description,
      category,
      images: imagePaths,
    });

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 👉 API: Sửa sản phẩm
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const updateData = {
      name,
      description,
      category,
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((f) => "/images/" + f.filename);
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

// 👉 API: Xóa sản phẩm
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    // Xóa luôn variants của product này
    await ProductVariant.deleteMany({ product: product._id });

    res.json({ message: "Xóa sản phẩm và các variants thành công", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
