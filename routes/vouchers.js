const express = require("express");
const Voucher = require("../models/Voucher");

const router = express.Router();

// Thêm voucher
router.post("/", async (req, res) => {
  const voucher = new Voucher(req.body);
  await voucher.save();
  res.json(voucher);
});

// Lấy voucher
router.get("/", async (req, res) => {
  const vouchers = await Voucher.find();
  res.json(vouchers);
});

module.exports = router;
