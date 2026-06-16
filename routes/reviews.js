const express = require("express");
const Review = require("../models/Review");

const router = express.Router();

// Thêm review
router.post("/", async (req, res) => {
  const review = new Review(req.body);
  await review.save();
  res.json(review);
});

// Lấy review theo product
router.get("/:productId", async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).populate(
    "user"
  );
  res.json(reviews);
});

module.exports = router;
