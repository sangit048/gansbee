// // // const express = require("express");
// // // const Category = require("../models/Category");
// // // const router = express.Router();

// // // // Create a new category
// // // router.post("/", async (req, res) => {
// // //   try {
// // //     const { name, description } = req.body;
// // //     const slug = name
// // //       .toLowerCase()
// // //       .replace(/ /g, "-")
// // //       .replace(/[^\w-]+/g, "");
// // //     const category = new Category({
// // //       name,
// // //       slug,
// // //       description,
// // //     });
// // //     await category.save();
// // //     res.json(category);
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Get all categories
// // // router.get("/", async (req, res) => {
// // //   try {
// // //     const categories = await Category.find();
// // //     res.json(categories);
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Get single category
// // // router.get("/:id", async (req, res) => {
// // //   try {
// // //     const category = await Category.findById(req.params.id);
// // //     if (!category) {
// // //       return res.status(404).json({ error: "Category not found" });
// // //     }
// // //     res.json(category);
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Update category
// // // router.put("/:id", async (req, res) => {
// // //   try {
// // //     const { name, description } = req.body;
// // //     const slug = name
// // //       .toLowerCase()
// // //       .replace(/ /g, "-")
// // //       .replace(/[^\w-]+/g, "");
// // //     const category = await Category.findByIdAndUpdate(
// // //       req.params.id,
// // //       { name, slug, description },
// // //       { new: true }
// // //     );
// // //     if (!category) {
// // //       return res.status(404).json({ error: "Category not found" });
// // //     }
// // //     res.json(category);
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Delete category
// // // router.delete("/:id", async (req, res) => {
// // //   try {
// // //     const category = await Category.findByIdAndDelete(req.params.id);
// // //     if (!category) {
// // //       return res.status(404).json({ error: "Category not found" });
// // //     }
// // //     res.json({ message: "Category deleted successfully" });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // module.exports = router;
// // const express = require("express");
// // const Category = require("../models/Category");
// // const multer = require("multer");
// // const path = require("path");

// // const router = express.Router();

// // // Multer config cho upload ảnh category
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, path.join(__dirname, "../public/images/categories"));
// //   },
// //   filename: function (req, file, cb) {
// //     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
// //     cb(null, uniqueSuffix + path.extname(file.originalname));
// //   },
// // });
// // const upload = multer({ storage });

// // // Create a new category
// // router.post("/", upload.single("image"), async (req, res) => {
// //   try {
// //     const { name, description } = req.body;
// //     const slug = name
// //       .toLowerCase()
// //       .replace(/ /g, "-")
// //       .replace(/[^\w-]+/g, "");
// //     const image = req.file ? "/images/categories/" + req.file.filename : null;

// //     const category = new Category({
// //       name,
// //       slug,
// //       description,
// //       image,
// //     });
// //     await category.save();
// //     res.json(category);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // Update category
// // router.put("/:id", upload.single("image"), async (req, res) => {
// //   try {
// //     const { name, description } = req.body;
// //     const slug = name
// //       .toLowerCase()
// //       .replace(/ /g, "-")
// //       .replace(/[^\w-]+/g, "");
// //     const image = req.file
// //       ? "/images/categories/" + req.file.filename
// //       : undefined;

// //     const updateData = { name, slug, description };
// //     if (image) updateData.image = image;

// //     const category = await Category.findByIdAndUpdate(
// //       req.params.id,
// //       updateData,
// //       {
// //         new: true,
// //       }
// //     );
// //     if (!category) {
// //       return res.status(404).json({ error: "Category not found" });
// //     }
// //     res.json(category);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// // module.exports = router;
// const express = require("express");
// const Category = require("../models/Category");
// const multer = require("multer");
// const path = require("path");

// const router = express.Router();

// // Multer config cho upload ảnh category
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "../public/images/categories"));
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // 👉 GET all categories
// router.get("/", async (req, res) => {
//   try {
//     const categories = await Category.find();
//     res.json(categories);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 GET single category
// router.get("/:id", async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }
//     res.json(category);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 POST create
// router.post("/", upload.single("image"), async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const slug = name
//       .toLowerCase()
//       .replace(/ /g, "-")
//       .replace(/[^\w-]+/g, "");
//     const image = req.file ? "/images/categories/" + req.file.filename : null;

//     const category = new Category({
//       name,
//       slug,
//       description,
//       image,
//     });
//     await category.save();
//     res.json(category);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 PUT update
// router.put("/:id", upload.single("image"), async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const slug = name
//       .toLowerCase()
//       .replace(/ /g, "-")
//       .replace(/[^\w-]+/g, "");
//     const image = req.file
//       ? "/images/categories/" + req.file.filename
//       : undefined;

//     const updateData = { name, slug, description };
//     if (image) updateData.image = image;

//     const category = await Category.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     );
//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }
//     res.json(category);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 DELETE
// router.delete("/:id", async (req, res) => {
//   try {
//     const category = await Category.findByIdAndDelete(req.params.id);
//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }
//     res.json({ message: "Category deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const Category = require("../models/Category");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Multer config cho upload ảnh category
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/categories"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 👉 GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    // Thêm BASE_URL vào image nếu có
    const categoriesWithFullImage = categories.map((cat) => ({
      ...cat.toObject(),
      image: cat.image
        ? cat.image.startsWith("http")
          ? cat.image
          : BASE_URL + cat.image
        : null,
    }));
    res.json(categoriesWithFullImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 GET single category
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    // Thêm BASE_URL vào image nếu có
    const catObj = category.toObject();
    catObj.image = catObj.image
      ? catObj.image.startsWith("http")
        ? catObj.image
        : BASE_URL + catObj.image
      : null;
    res.json(catObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 POST create
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    const image = req.file ? "/images/categories/" + req.file.filename : null;

    const category = new Category({
      name,
      slug,
      description,
      image,
    });
    await category.save();
    // Trả về image đầy đủ BASE_URL
    const catObj = category.toObject();
    catObj.image = catObj.image
      ? catObj.image.startsWith("http")
        ? catObj.image
        : BASE_URL + catObj.image
      : null;
    res.json(catObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 PUT update
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    const image = req.file
      ? "/images/categories/" + req.file.filename
      : undefined;

    const updateData = { name, slug, description };
    if (image) updateData.image = image;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    // Trả về image đầy đủ BASE_URL
    const catObj = category.toObject();
    catObj.image = catObj.image
      ? catObj.image.startsWith("http")
        ? catObj.image
        : BASE_URL + catObj.image
      : null;
    res.json(catObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 DELETE
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
