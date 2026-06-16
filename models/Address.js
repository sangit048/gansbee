// const mongoose = require("mongoose");

// const addressSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   fullName: String,
//   phone: String,
//   address: String,
//   city: String,
//   country: String,
//   isDefault: { type: Boolean, default: false },
// });

// module.exports = mongoose.model("Address", addressSchema);
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullName: String,
  phone: String,
  address: String,
  city: String,
  country: String,
  isDefault: { type: Boolean, default: false },
});

module.exports = mongoose.model("Address", addressSchema);
