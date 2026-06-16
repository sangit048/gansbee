const express = require("express");
const router = express.Router();
const Address = require("../models/Address");
const { checkLogin } = require("../middlewares/auth");

// Lấy tất cả địa chỉ của user
router.get("/", checkLogin, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy danh sách địa chỉ" });
  }
});

// Thêm địa chỉ mới
router.post("/", checkLogin, async (req, res) => {
  try {
    const { fullName, phone, address, city, country, isDefault } = req.body;
    if (!fullName || !phone || !address || !city || !country) {
      return res.status(400).json({ error: "Thiếu thông tin địa chỉ" });
    }
    // Nếu là địa chỉ mặc định, bỏ mặc định các địa chỉ khác
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
    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ error: "Không thể thêm địa chỉ" });
  }
});

// Sửa địa chỉ
router.put("/:id", checkLogin, async (req, res) => {
  try {
    const { fullName, phone, address, city, country, isDefault } = req.body;
    const addressDoc = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!addressDoc) {
      return res.status(404).json({ error: "Không tìm thấy địa chỉ" });
    }
    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }
    addressDoc.fullName = fullName || addressDoc.fullName;
    addressDoc.phone = phone || addressDoc.phone;
    addressDoc.address = address || addressDoc.address;
    addressDoc.city = city || addressDoc.city;
    addressDoc.country = country || addressDoc.country;
    addressDoc.isDefault = !!isDefault;
    await addressDoc.save();
    res.json(addressDoc);
  } catch (err) {
    res.status(500).json({ error: "Không thể cập nhật địa chỉ" });
  }
});

// Xóa địa chỉ
router.delete("/:id", checkLogin, async (req, res) => {
  try {
    const addressDoc = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!addressDoc) {
      return res.status(404).json({ error: "Không tìm thấy địa chỉ" });
    }
    res.json({ message: "Đã xóa địa chỉ thành công" });
  } catch (err) {
    res.status(500).json({ error: "Không thể xóa địa chỉ" });
  }
});

module.exports = router;
