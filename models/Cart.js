// const mongoose = require("mongoose");
// const cartSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   items: [
//     {
//       product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//       variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" }, // phải có dòng này
//       quantity: { type: Number, default: 1 },
//     },
//   ],
// });
// module.exports = mongoose.model("Cart", cartSchema);

const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Cho phép chuỗi để hỗ trợ guestId
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
      quantity: { type: Number, default: 1, min: 1 },
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema);
