// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     products: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//         variant: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "ProductVariant",
//         }, // Thêm dòng này
//         quantity: { type: Number, default: 1 },
//       },
//     ],
//     totalPrice: { type: Number, required: true },
//     status: {
//       type: String,
//       enum: ["pending", "paid", "shipped", "completed", "cancelled"],
//       default: "pending",
//     },
//     voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
//     shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariant",
        },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalPrice: { type: Number, required: true },
    // status: {
    //   type: String,
    //   enum: ["pending", "paid", "shipped", "completed", "cancelled"],
    //   default: "pending",
    // },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "paid",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" }, // liên kết payment
    shipping: { type: mongoose.Schema.Types.ObjectId, ref: "Shipping" }, // liên kết shipping
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer"],
      default: "cash",
    }, // COD hoặc chuyển khoản
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
