// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose");
// const Order = require("../models/Order");
// const Address = require("../models/Address");
// const Payment = require("../models/Payment");
// const Shipping = require("../models/Shipping");
// const { checkLogin } = require("../middlewares/auth");

// const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// // GET all orders of the logged-in user
// router.get("/", checkLogin, async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user.id })
//       .populate("user")
//       .populate("products.product")
//       .populate("products.variant")
//       .populate("voucher")
//       .populate("shippingAddress")
//       .populate("payment")
//       .populate("shipping")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.status(200).json(orders);
//   } catch (err) {
//     res.status(500).json({ error: "Có lỗi xảy ra khi lấy danh sách đơn hàng" });
//   }
// });

// // GET single order by ID
// router.get("/:id", checkLogin, async (req, res) => {
//   try {
//     const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
//       .populate("user")
//       .populate("products.product")
//       .populate("products.variant")
//       .populate("voucher")
//       .populate("shippingAddress")
//       .populate("payment")
//       .populate("shipping")
//       .lean();

//     if (!order) {
//       return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
//     }

//     res.status(200).json(order);
//   } catch (err) {
//     res.status(500).json({ error: "Có lỗi xảy ra khi lấy thông tin đơn hàng" });
//   }
// });

// // POST create a new order (có payment & shipping)
// router.post("/", checkLogin, async (req, res) => {
//   try {
//     const {
//       products,
//       totalPrice,
//       status,
//       voucher,
//       shippingAddress,
//       newShippingAddress,
//       paymentMethod, // "cash" hoặc "bank_transfer"
//     } = req.body;

//     if (
//       !req.user.id ||
//       !products ||
//       !totalPrice ||
//       (!shippingAddress && !newShippingAddress) ||
//       !paymentMethod
//     ) {
//       return res.status(400).json({
//         error:
//           "Vui lòng cung cấp đầy đủ thông tin: user, products, totalPrice, shippingAddress, paymentMethod",
//       });
//     }

//     if (!["cash", "bank_transfer"].includes(paymentMethod)) {
//       return res
//         .status(400)
//         .json({ error: "Phương thức thanh toán không hợp lệ" });
//     }

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ error: "Danh sách sản phẩm không hợp lệ" });
//     }
//     for (const item of products) {
//       if (!item.product || !item.variant || !item.quantity) {
//         return res
//           .status(400)
//           .json({ error: "Thiếu thông tin sản phẩm, biến thể hoặc số lượng" });
//       }
//     }

//     let addressId;
//     if (newShippingAddress) {
//       const { fullName, phone, address, city, country, isDefault } =
//         newShippingAddress;
//       if (!fullName || !phone || !address || !city || !country) {
//         return res.status(400).json({ error: "Thiếu thông tin địa chỉ mới" });
//       }
//       const phoneRegex = /^[0-9]{10,11}$/;
//       if (!phoneRegex.test(phone)) {
//         return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
//       }
//       if (isDefault) {
//         await Address.updateMany({ user: req.user.id }, { isDefault: false });
//       }
//       const newAddress = await Address.create({
//         user: req.user.id,
//         fullName,
//         phone,
//         address,
//         city,
//         country,
//         isDefault: !!isDefault,
//       });
//       addressId = newAddress._id;
//     } else if (shippingAddress) {
//       if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
//         return res.status(400).json({ error: "ID địa chỉ không hợp lệ" });
//       }
//       const existingAddress = await Address.findOne({
//         _id: shippingAddress,
//         user: req.user.id,
//       });
//       if (!existingAddress) {
//         return res
//           .status(404)
//           .json({ error: "Địa chỉ không tồn tại hoặc không thuộc user" });
//       }
//       addressId = shippingAddress;
//     } else {
//       const defaultAddress = await Address.findOne({
//         user: req.user.id,
//         isDefault: true,
//       });
//       if (!defaultAddress) {
//         return res
//           .status(400)
//           .json({ error: "Không có địa chỉ nào, vui lòng cung cấp" });
//       }
//       addressId = defaultAddress._id;
//     }

//     // Tạo order trước
//     const order = new Order({
//       user: req.user.id,
//       products,
//       totalPrice,
//       status: status || "pending",
//       voucher: voucher || null,
//       shippingAddress: addressId,
//       paymentMethod,
//     });

//     await order.save();

//     // Tạo payment
//     const payment = await Payment.create({
//       order: order._id,
//       method: paymentMethod,
//       amount: totalPrice,
//       status: paymentMethod === "cash" ? "pending" : "success", // COD thì pending, chuyển khoản thì success
//     });
//     order.payment = payment._id;

//     // Tạo shipping
//     const shipping = await Shipping.create({
//       order: order._id,
//       provider: "GHN",
//       trackingNumber: "",
//       fee: 0,
//       status: "pending",
//     });
//     order.shipping = shipping._id;

//     await order.save();

//     const populatedOrder = await Order.findById(order._id)
//       .populate("user")
//       .populate("products.product")
//       .populate("products.variant")
//       .populate("voucher")
//       .populate("shippingAddress")
//       .populate("payment")
//       .populate("shipping");

//     res.status(201).json(populatedOrder);
//   } catch (err) {
//     console.error("Lỗi tạo đơn hàng:", err);
//     res
//       .status(500)
//       .json({ error: `Có lỗi xảy ra khi tạo đơn hàng: ${err.message}` });
//   }
// });

// // PUT update order status (giữ nguyên)
// router.put("/:id", checkLogin, async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!status) {
//       return res
//         .status(400)
//         .json({ error: "Vui lòng cung cấp trạng thái đơn hàng" });
//     }

//     const validStatuses = [
//       "pending",
//       "paid",
//       "shipped",
//       "completed",
//       "cancelled",
//     ];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ error: "Trạng thái không hợp lệ" });
//     }

//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
//     }

//     order.status = status;
//     await order.save();

//     const updatedOrder = await Order.findById(order._id)
//       .populate("user")
//       .populate("products.product")
//       .populate("products.variant")
//       .populate("voucher")
//       .populate("shippingAddress")
//       .populate("payment")
//       .populate("shipping");

//     res.status(200).json(updatedOrder);
//   } catch (err) {
//     res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật đơn hàng" });
//   }
// });

// // DELETE order (giữ nguyên)
// router.delete("/:id", checkLogin, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
//     }

//     await Order.deleteOne({ _id: req.params.id });
//     res.status(200).json({ message: "Đơn hàng đã được xóa thành công" });
//   } catch (err) {
//     res.status(500).json({ error: "Có lỗi xảy ra khi xóa đơn hàng" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Address = require("../models/Address");
const Payment = require("../models/Payment");
const Shipping = require("../models/Shipping");
const { checkLogin } = require("../middlewares/auth");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// GET all orders of the logged-in user
router.get("/", checkLogin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("user")
      .populate("products.product")
      .populate("products.variant")
      .populate("voucher")
      .populate("shippingAddress")
      .populate("payment")
      .populate("shipping")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Có lỗi xảy ra khi lấy danh sách đơn hàng" });
  }
});

// GET single order by ID
router.get("/:id", checkLogin, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate("user")
      .populate("products.product")
      .populate("products.variant")
      .populate("voucher")
      .populate("shippingAddress")
      .populate("payment")
      .populate("shipping")
      .lean();

    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "Có lỗi xảy ra khi lấy thông tin đơn hàng" });
  }
});

// POST create a new order (có payment & shipping)
router.post("/", checkLogin, async (req, res) => {
  try {
    const {
      products,
      totalPrice,
      status,
      voucher,
      shippingAddress,
      newShippingAddress,
      paymentMethod, // "cash" hoặc "bank_transfer"
    } = req.body;

    if (
      !req.user.id ||
      !products ||
      !totalPrice ||
      (!shippingAddress && !newShippingAddress) ||
      !paymentMethod
    ) {
      return res.status(400).json({
        error:
          "Vui lòng cung cấp đầy đủ thông tin: user, products, totalPrice, shippingAddress, paymentMethod",
      });
    }

    if (!["cash", "bank_transfer"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ error: "Phương thức thanh toán không hợp lệ" });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Danh sách sản phẩm không hợp lệ" });
    }
    for (const item of products) {
      if (!item.product || !item.variant || !item.quantity) {
        return res
          .status(400)
          .json({ error: "Thiếu thông tin sản phẩm, biến thể hoặc số lượng" });
      }
    }

    let addressId;
    if (newShippingAddress) {
      const { fullName, phone, address, city, country, isDefault } =
        newShippingAddress;
      if (!fullName || !phone || !address || !city || !country) {
        return res.status(400).json({ error: "Thiếu thông tin địa chỉ mới" });
      }
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
      }
      if (isDefault) {
        await Address.updateMany({ user: req.user.id }, { isDefault: false });
      }
      const newAddress = await Address.create({
        user: req.user.id,
        fullName,
        phone,
        address,
        city,
        country,
        isDefault: !!isDefault,
      });
      addressId = newAddress._id;
    } else if (shippingAddress) {
      if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
        return res.status(400).json({ error: "ID địa chỉ không hợp lệ" });
      }
      const existingAddress = await Address.findOne({
        _id: shippingAddress,
        user: req.user.id,
      });
      if (!existingAddress) {
        return res
          .status(404)
          .json({ error: "Địa chỉ không tồn tại hoặc không thuộc user" });
      }
      addressId = shippingAddress;
    } else {
      const defaultAddress = await Address.findOne({
        user: req.user.id,
        isDefault: true,
      });
      if (!defaultAddress) {
        return res
          .status(400)
          .json({ error: "Không có địa chỉ nào, vui lòng cung cấp" });
      }
      addressId = defaultAddress._id;
    }

    // Tạo order trước
    const order = new Order({
      user: req.user.id,
      products,
      totalPrice,
      status: status || "pending",
      voucher: voucher || null,
      shippingAddress: addressId,
      paymentMethod,
    });

    await order.save();

    // Tạo payment
    const payment = await Payment.create({
      order: order._id,
      method: paymentMethod,
      amount: totalPrice,
      status: paymentMethod === "cash" ? "pending" : "success", // COD thì pending, chuyển khoản thì success
    });
    order.payment = payment._id;

    // Tạo shipping
    const shipping = await Shipping.create({
      order: order._id,
      provider: "GHN",
      trackingNumber: "",
      fee: 0,
      status: "pending",
    });
    order.shipping = shipping._id;

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user")
      .populate("products.product")
      .populate("products.variant")
      .populate("voucher")
      .populate("shippingAddress")
      .populate("payment")
      .populate("shipping");

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error("Lỗi tạo đơn hàng:", err);
    res
      .status(500)
      .json({ error: `Có lỗi xảy ra khi tạo đơn hàng: ${err.message}` });
  }
});

// PUT update order status (giữ nguyên)
router.put("/:id", checkLogin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp trạng thái đơn hàng" });
    }

    const validStatuses = [
      "pending",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("user")
      .populate("products.product")
      .populate("products.variant")
      .populate("voucher")
      .populate("shippingAddress")
      .populate("payment")
      .populate("shipping");

    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật đơn hàng" });
  }
});

// DELETE order (giữ nguyên)
router.delete("/:id", checkLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    await Order.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Đơn hàng đã được xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: "Có lỗi xảy ra khi xóa đơn hàng" });
  }
});

module.exports = router;
