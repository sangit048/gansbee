const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const methodOverride = require("method-override");

// ===== Load env =====
dotenv.config();
const app = express();

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());
// app.use(
//   cors({
//     origin: "http://localhost:3001", // FE domain/port
//     credentials: true,
//   }),
// );
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://gansbee.onrender.com",
    ],
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static("public"));
app.use(methodOverride("_method"));
// ===== Multer config (upload ảnh sản phẩm) =====
const imageDir = path.join(__dirname, "public/images");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname),
    ),
});
const upload = multer({ storage });

// ===== Session (MongoStore) =====
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 ngày
  }),
);

// ===== View engine (EJS + Layouts) =====
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

// ===== MongoDB connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// ===== Import Routes =====
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const voucherRoutes = require("./routes/vouchers");
const reviewRoutes = require("./routes/reviews");
const categoryRoutes = require("./routes/category");
const productVariantRoutes = require("./routes/productVariants"); // <-- thêm dòng này
const addressRoutes = require("./routes/address");
const cartRoutes = require("./routes/cart");

// ===== Models =====
const Product = require("./models/Product");
const Order = require("./models/Order");
const Voucher = require("./models/Voucher");
const Review = require("./models/Review");
const Category = require("./models/Category");
const ProductVariant = require("./models/ProductVariant");

// ===== Middleware check login =====
const { checkLogin } = require("./middlewares/auth");

// ===== API routes (/api/...) =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/productVariants", productVariantRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/cart", cartRoutes);

// ===== Admin Frontend (views) =====
// Root -> dashboard (require login)
app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.redirect("/dashboard");
});

app.get("/login", (req, res) =>
  res.render("auth/login", { title: "Đăng nhập", user: null }),
);
app.get("/register", (req, res) =>
  res.render("auth/register", { title: "Đăng ký", user: null }),
);
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Dashboard
app.get("/dashboard", checkLogin, async (req, res) => {
  const [
    productsCount,
    ordersCount,
    pendingOrdersCount,
    vouchersCount,
    reviewsCount,
  ] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    Voucher.countDocuments(),
    Review.countDocuments(),
  ]);

  res.render("dashboard/index", {
    title: "Dashboard",
    user: req.user, // Sử dụng req.user từ middleware
    productsCount,
    ordersCount,
    pendingOrdersCount,
    vouchersCount,
    reviewsCount,
  });
});

// Products list
app.get("/products/view", checkLogin, async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find().populate("category"),
      Category.find(),
    ]);
    res.render("products/list", {
      title: "Products",
      user: req.session.user,
      products,
      categories,
    });
  } catch (err) {
    console.error("❌ Error fetching products or categories:", err);
    res.status(500).send("Có lỗi xảy ra khi tải danh sách sản phẩm");
  }
});
app.get("/products/:id/variants", checkLogin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  const variants = await ProductVariant.find({ product: req.params.id });
  res.render("productVariants/list", {
    title: "Quản lý biến thể",
    user: req.session.user,
    product,
    variants,
  });
});
// Products add (form)
app.get("/products/add", checkLogin, async (req, res) => {
  const categories = await Category.find();
  res.render("products/add", {
    title: "Thêm sản phẩm",
    user: req.session.user,
    categories,
  });
});

// Products add (POST) – cho phép nhiều ảnh
// app.post(
//   "/products/add",
//   checkLogin,
//   upload.array("images", 5),
//   async (req, res) => {
//     try {
//       const { name, price, discountPrice, category } = req.body;
//       if (!name || !price) {
//         return res.status(400).send("Tên và giá sản phẩm là bắt buộc");
//       }

//       const imagePaths = req.files
//         ? req.files.map((f) => "/images/" + f.filename)
//         : [];

//       await Product.create({
//         name,
//         price,
//         discountPrice,
//         category,
//         images: imagePaths,
//       });

//       res.redirect("/products/view");
//     } catch (err) {
//       console.error("❌ Add Product Error:", err);
//       res.status(500).send("Có lỗi xảy ra khi thêm sản phẩm");
//     }
//   }
// );
app.post(
  "/products/add",
  checkLogin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { name, description, category } = req.body;
      if (!name) {
        return res.status(400).send("Tên sản phẩm là bắt buộc");
      }

      const imagePaths = req.files
        ? req.files.map((f) => "/images/" + f.filename)
        : [];

      await Product.create({
        name,
        description,
        category,
        images: imagePaths,
      });

      res.redirect("/products/view");
    } catch (err) {
      console.error("❌ Add Product Error:", err);
      res.status(500).send("Có lỗi xảy ra khi thêm sản phẩm");
    }
  },
);
// Orders list (updated)
app.get("/orders", checkLogin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("products.product")
      .populate("products.variant")
      .sort({ createdAt: -1 })
      .lean();
    res.render("orders/list", {
      title: "Danh sách đơn hàng",
      user: req.session.user,
      orders,
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).send("Có lỗi xảy ra khi tải danh sách đơn hàng");
  }
});

// Orders detail (new)
app.get("/orders/:id", checkLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("products.product")
      .populate("products.variant")
      .populate("voucher")
      .populate("shippingAddress")
      .populate("payment")
      .populate("shipping")
      .lean();

    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng");
    }

    res.render("orders/detail", {
      title: "Chi tiết đơn hàng",
      user: req.session.user,
      order,
    });
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).send("Có lỗi xảy ra khi lấy chi tiết đơn hàng");
  }
});

// Approve order (new)
app.post("/orders/:id/approve", checkLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("shipping")
      .populate("payment");
    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng");
    }
    if (order.status !== "pending") {
      return res.status(400).send("Đơn hàng không ở trạng thái pending");
    }
    order.status = "shipped";
    order.shipping.status = "shipped"; // Cập nhật trạng thái shipping
    if (order.payment.method === "bank_transfer") {
      order.payment.status = "success";
    }
    await order.shipping.save();
    await order.payment.save();
    await order.save();
    res.redirect("/orders/" + req.params.id);
  } catch (err) {
    console.error("❌ Approve Error:", err);
    res.status(500).send("Có lỗi xảy ra khi duyệt đơn hàng");
  }
});

// Cancel order (new)
app.post("/orders/:id/cancel", checkLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("shipping")
      .populate("payment");
    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng");
    }
    if (order.status === "cancelled" || order.status === "completed") {
      return res.status(400).send("Không thể hủy đơn hàng này");
    }
    order.status = "cancelled";
    order.shipping.status = "cancelled";
    order.payment.status = "cancelled";
    await order.shipping.save();
    await order.payment.save();
    await order.save();
    res.redirect("/orders/" + req.params.id);
  } catch (err) {
    console.error("❌ Cancel Error:", err);
    res.status(500).send("Có lỗi xảy ra khi hủy đơn hàng");
  }
});

// Complete order (new)
app.post("/orders/:id/complete", checkLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("shipping")
      .populate("payment");
    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng");
    }
    if (order.status !== "shipped") {
      return res.status(400).send("Đơn hàng không ở trạng thái shipped");
    }
    order.status = "completed";
    order.shipping.status = "delivered";
    order.payment.status = "success";
    await order.shipping.save();
    await order.payment.save();
    await order.save();
    res.redirect("/orders/" + req.params.id);
  } catch (err) {
    console.error("❌ Complete Error:", err);
    res.status(500).send("Có lỗi xảy ra khi hoàn thành đơn hàng");
  }
});

// Vouchers list
app.get("/vouchers", checkLogin, async (req, res) => {
  const vouchers = await Voucher.find();
  res.render("vouchers/list", {
    title: "Vouchers",
    user: req.session.user,
    vouchers,
  });
});

// Categories list
app.get("/categories", checkLogin, async (req, res) => {
  const categories = await Category.find();
  res.render("category/list", {
    title: "Categories",
    user: req.session.user,
    categories,
  });
});

// Reviews list
app.get("/reviews", checkLogin, async (req, res) => {
  const reviews = await Review.find().populate("user").populate("product");
  res.render("reviews/list", {
    title: "Reviews",
    user: req.session.user,
    reviews,
  });
});

module.exports = app;
