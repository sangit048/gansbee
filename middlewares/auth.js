// // // function checkLogin(req, res, next) {
// // //   if (!req.session.user) {
// // //     return res.redirect("/login");
// // //   }
// // //   next();
// // // }

// // // module.exports = { checkLogin };
// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// function checkLogin(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ message: "Không có token" });

//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: "Token không hợp lệ" });
//     req.user = user; // user: { id, ... }
//     next();
//   });
// }

// module.exports = { checkLogin };
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

function checkLogin(req, res, next) {
  // Kiểm tra session trước
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Nếu không có session, kiểm tra token trong header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Không có token" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }
    req.user = user; // user: { id, name, email, role }
    // Lưu user vào session để sử dụng cho các yêu cầu tiếp theo
    req.session.user = user;
    next();
  });
}

module.exports = { checkLogin };
