// // const express = require("express");
// // const Product = require("../models/Product");
// // const Category = require("../models/Category");
// // const ProductVariant = require("../models/ProductVariant");
// // const multer = require("multer");
// // const path = require("path");

// // const router = express.Router();

// // const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// // // Multer config
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, path.join(__dirname, "../public/images"));
// //   },
// //   filename: function (req, file, cb) {
// //     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
// //     cb(null, uniqueSuffix + path.extname(file.originalname));
// //   },
// // });
// // const upload = multer({ storage });

// // router.get("/", async (req, res) => {
// //   try {
// //     const products = await Product.find().populate("category").lean();

// //     const productsWithVariants = await Promise.all(
// //       products.map(async (p) => {
// //         const variants = await ProductVariant.find({ product: p._id }).lean();
// //         // Map lại image của từng variant
// //         const variantsWithFullImage = variants.map((v) => ({
// //           ...v,
// //           image: v.image
// //             ? v.image.startsWith("http")
// //               ? v.image
// //               : BASE_URL + v.image
// //             : null,
// //         }));

// //         const images = (p.images || []).map((img) =>
// //           img.startsWith("http") ? img : BASE_URL + img,
// //         );

// //         let category = p.category;
// //         if (category && category.image) {
// //           category = {
// //             ...category,
// //             image: category.image.startsWith("http")
// //               ? category.image
// //               : BASE_URL + category.image,
// //           };
// //         }

// //         return {
// //           ...p,
// //           images,
// //           category,
// //           variants: variantsWithFullImage, // dùng mảng đã xử lý
// //         };
// //       }),
// //     );

// //     res.json(productsWithVariants);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // 👉 API: Lấy chi tiết 1 sản phẩm kèm variants
// // router.get("/:id", async (req, res) => {
// //   try {
// //     const product = await Product.findById(req.params.id)
// //       .populate("category")
// //       .lean();
// //     if (!product)
// //       return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

// //     const variants = await ProductVariant.find({ product: product._id }).lean();
// //     // Map lại image của từng variant
// //     const variantsWithFullImage = variants.map((v) => ({
// //       ...v,
// //       image: v.image
// //         ? v.image.startsWith("http")
// //           ? v.image
// //           : BASE_URL + v.image
// //         : null,
// //     }));

// //     const images = (product.images || []).map((img) =>
// //       img.startsWith("http") ? img : BASE_URL + img,
// //     );
// //     let category = product.category;
// //     if (category && category.image) {
// //       category = {
// //         ...category,
// //         image: category.image.startsWith("http")
// //           ? category.image
// //           : BASE_URL + category.image,
// //       };
// //     }

// //     res.json({
// //       ...product,
// //       images,
// //       category,
// //       variants: variantsWithFullImage, // dùng mảng đã xử lý
// //     });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// // // 👉 API: Thêm sản phẩm (chỉ thêm product cơ bản)
// // // router.post("/", upload.array("images", 5), async (req, res) => {
// // //   try {
// // //     const { name, description, category } = req.body;

// // //     const imagePaths = req.files
// // //       ? req.files.map((f) => "/images/" + f.filename)
// // //       : [];

// // //     const product = new Product({
// // //       name,
// // //       description,
// // //       category,
// // //       images: imagePaths,
// // //     });

// // //     await product.save();
// // //     res.json(product);
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });
// // router.post("/", upload.array("images", 5), async (req, res) => {
// //   try {
// //     const { name, description, category } = req.body;

// //     if (!name) {
// //       return res.status(400).json({ error: "Tên sản phẩm là bắt buộc" });
// //     }

// //     const imagePaths = req.files
// //       ? req.files.map((f) => "/images/" + f.filename)
// //       : [];

// //     const product = new Product({
// //       name,
// //       description,
// //       category,
// //       images: imagePaths,
// //     });

// //     await product.save();
// //     res.json(product);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// // // 👉 API: Lấy tất cả sản phẩm - đường dẫn khác (/all)
// // router.get("/all", async (req, res) => {
// //   try {
// //     const products = await Product.find().populate("category").lean();

// //     const productsWithVariants = await Promise.all(
// //       products.map(async (p) => {
// //         const variants = await ProductVariant.find({ product: p._id }).lean();

// //         // Xử lý image cho variant
// //         const variantsWithFullImage = variants.map((v) => ({
// //           ...v,
// //           image: v.image
// //             ? v.image.startsWith("http")
// //               ? v.image
// //               : BASE_URL + v.image
// //             : null,
// //         }));

// //         // Xử lý images của product
// //         const images = (p.images || []).map((img) =>
// //           img.startsWith("http") ? img : BASE_URL + img,
// //         );

// //         // Xử lý image của category
// //         let category = p.category;
// //         if (category && category.image) {
// //           category = {
// //             ...category,
// //             image: category.image.startsWith("http")
// //               ? category.image
// //               : BASE_URL + category.image,
// //           };
// //         }

// //         return {
// //           ...p,
// //           images,
// //           category,
// //           variants: variantsWithFullImage,
// //         };
// //       }),
// //     );

// //     res.json(productsWithVariants);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// // // 👉 API: Sửa sản phẩm
// // router.put("/:id", upload.array("images", 5), async (req, res) => {
// //   try {
// //     const { name, description, category } = req.body;

// //     const updateData = {
// //       name,
// //       description,
// //       category,
// //     };

// //     if (req.files && req.files.length > 0) {
// //       updateData.images = req.files.map((f) => "/images/" + f.filename);
// //     }

// //     const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
// //       new: true,
// //     });

// //     if (!product)
// //       return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

// //     res.json(product);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // 👉 API: Xóa sản phẩm
// // router.delete("/:id", async (req, res) => {
// //   try {
// //     const product = await Product.findByIdAndDelete(req.params.id);

// //     if (!product)
// //       return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

// //     // Xóa luôn variants của product này
// //     await ProductVariant.deleteMany({ product: product._id });

// //     res.json({ message: "Xóa sản phẩm và các variants thành công", product });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // module.exports = router;

// const express = require("express");
// const Product = require("../models/Product");
// const Category = require("../models/Category");
// const ProductVariant = require("../models/ProductVariant");
// const multer = require("multer");
// const path = require("path");

// const router = express.Router();

// // 👉 Tự động lấy đúng domain đang chạy:
// //    - Local dev   -> http://localhost:3000
// //    - Trên Render -> https://gansbee.onrender.com
// // Nếu set biến môi trường BASE_URL thì sẽ ưu tiên dùng giá trị đó (override).
// function getBaseUrl(req) {
//   return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
// }

// // Multer config
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "../public/images"));
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// router.get("/", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
//     const products = await Product.find().populate("category").lean();

//     const productsWithVariants = await Promise.all(
//       products.map(async (p) => {
//         const variants = await ProductVariant.find({ product: p._id }).lean();
//         // Map lại image của từng variant
//         const variantsWithFullImage = variants.map((v) => ({
//           ...v,
//           image: v.image
//             ? v.image.startsWith("http")
//               ? v.image
//               : BASE_URL + v.image
//             : null,
//         }));

//         const images = (p.images || []).map((img) =>
//           img.startsWith("http") ? img : BASE_URL + img,
//         );

//         let category = p.category;
//         if (category && category.image) {
//           category = {
//             ...category,
//             image: category.image.startsWith("http")
//               ? category.image
//               : BASE_URL + category.image,
//           };
//         }

//         return {
//           ...p,
//           images,
//           category,
//           variants: variantsWithFullImage, // dùng mảng đã xử lý
//         };
//       }),
//     );

//     res.json(productsWithVariants);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Lấy chi tiết 1 sản phẩm kèm variants
// router.get("/:id", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
//     const product = await Product.findById(req.params.id)
//       .populate("category")
//       .lean();
//     if (!product)
//       return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

//     const variants = await ProductVariant.find({ product: product._id }).lean();
//     // Map lại image của từng variant
//     const variantsWithFullImage = variants.map((v) => ({
//       ...v,
//       image: v.image
//         ? v.image.startsWith("http")
//           ? v.image
//           : BASE_URL + v.image
//         : null,
//     }));

//     const images = (product.images || []).map((img) =>
//       img.startsWith("http") ? img : BASE_URL + img,
//     );
//     let category = product.category;
//     if (category && category.image) {
//       category = {
//         ...category,
//         image: category.image.startsWith("http")
//           ? category.image
//           : BASE_URL + category.image,
//       };
//     }

//     res.json({
//       ...product,
//       images,
//       category,
//       variants: variantsWithFullImage, // dùng mảng đã xử lý
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Thêm sản phẩm (chỉ thêm product cơ bản)
// router.post("/", upload.array("images", 5), async (req, res) => {
//   try {
//     const { name, description, category } = req.body;

//     if (!name) {
//       return res.status(400).json({ error: "Tên sản phẩm là bắt buộc" });
//     }

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

// // 👉 API: Lấy tất cả sản phẩm - đường dẫn khác (/all)
// router.get("/all", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
//     const products = await Product.find().populate("category").lean();

//     const productsWithVariants = await Promise.all(
//       products.map(async (p) => {
//         const variants = await ProductVariant.find({ product: p._id }).lean();

//         // Xử lý image cho variant
//         const variantsWithFullImage = variants.map((v) => ({
//           ...v,
//           image: v.image
//             ? v.image.startsWith("http")
//               ? v.image
//               : BASE_URL + v.image
//             : null,
//         }));

//         // Xử lý images của product
//         const images = (p.images || []).map((img) =>
//           img.startsWith("http") ? img : BASE_URL + img,
//         );

//         // Xử lý image của category
//         let category = p.category;
//         if (category && category.image) {
//           category = {
//             ...category,
//             image: category.image.startsWith("http")
//               ? category.image
//               : BASE_URL + category.image,
//           };
//         }

//         return {
//           ...p,
//           images,
//           category,
//           variants: variantsWithFullImage,
//         };
//       }),
//     );

//     res.json(productsWithVariants);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Sửa sản phẩm
// router.put("/:id", upload.array("images", 5), async (req, res) => {
//   try {
//     const { name, description, category } = req.body;

//     const updateData = {
//       name,
//       description,
//       category,
//     };

//     if (req.files && req.files.length > 0) {
//       updateData.images = req.files.map((f) => "/images/" + f.filename);
//     }

//     const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//     });

//     if (!product)
//       return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 API: Xóa sản phẩm
// router.delete("/:id", async (req, res) => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);

//     if (!product)
//       return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

//     // Xóa luôn variants của product này
//     await ProductVariant.deleteMany({ product: product._id });

//     res.json({ message: "Xóa sản phẩm và các variants thành công", product });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { Readable } = require("stream");
const { getBucket } = require("../config/gridfs");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

const router = express.Router();

// Dùng memoryStorage, tự upload vào GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper: upload 1 file vào GridFS, trả về filename
function uploadToGridFS(file) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const readableStream = Readable.from(file.buffer);

    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });

    readableStream.pipe(uploadStream);

    uploadStream.on("finish", () => resolve(file.originalname));
    uploadStream.on("error", reject);
  });
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
// GET / — Lấy tất cả sản phẩm
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const products = await Product.find().populate("category").lean();

    const productsWithVariants = await Promise.all(
      products.map(async (p) => {
        const variants = await ProductVariant.find({ product: p._id }).lean();
        const images = (p.images || []).map(
          (filename) => `${BASE_URL}/products/images/${filename}`,
        );
        return { ...p, images, variants };
      }),
    );

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /all
router.get("/all", async (req, res) => {
  try {
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const products = await Product.find().populate("category").lean();

    const productsWithVariants = await Promise.all(
      products.map(async (p) => {
        const variants = await ProductVariant.find({ product: p._id }).lean();
        const images = (p.images || []).map(
          (filename) => `${BASE_URL}/products/images/${filename}`,
        );
        return { ...p, images, variants };
      }),
    );

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  try {
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const product = await Product.findById(req.params.id)
      .populate("category")
      .lean();

    if (!product)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    const variants = await ProductVariant.find({ product: product._id }).lean();
    const images = (product.images || []).map(
      (filename) => `${BASE_URL}/products/images/${filename}`,
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

    // Upload từng file vào GridFS
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

    // Xóa ảnh khỏi GridFS
    const bucket = getBucket();
    for (const filename of product.images || []) {
      const files = await bucket.find({ filename }).toArray();
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
