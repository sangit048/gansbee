const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Secret key JWT (đặt trong .env)
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Đăng ký
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role = "user" } = req.body;
//     const exist = await User.findOne({ email });
//     if (exist) return res.status(400).json({ message: "Email đã tồn tại" });

//     const hashed = await bcrypt.hash(password, 10);
//     const user = new User({ name, email, password: hashed, role });
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, name: user.name, email: user.email, role: user.role },
//       JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.json({
//       message: "Đăng ký thành công",
//       user: { id: user._id, name, email, role },
//       token,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email đã tồn tại" });

    // Bỏ dòng hash thủ công, lưu password gốc, model sẽ tự hash
    const user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Đăng ký thành công",
      user: { id: user._id, name, email, role },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Đăng nhập
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid)
//       return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

//     const token = jwt.sign(
//       { id: user._id, name: user.name, email: user.email, role: user.role },
//       JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.json({
//       message: "Đăng nhập thành công",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//       token,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    // Lưu user vào session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Đăng nhập thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Middleware kiểm tra token và role admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Không có token" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token không hợp lệ" });
    if (user.role !== "admin")
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    req.user = user;
    next();
  });
};

router.get("/me", authenticateAdmin, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
