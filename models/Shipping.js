const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  provider: { type: String }, // GHN, GHTK, Viettel Post...
  trackingNumber: String,
  fee: Number,
  status: {
    type: String,
    enum: ["pending", "shipped", "delivered"],
    default: "pending",
  },
});

module.exports = mongoose.model("Shipping", shippingSchema);
