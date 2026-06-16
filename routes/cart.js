// const express = require("express");
// const Cart = require("../models/Cart");
// const Product = require("../models/Product");
// const ProductVariant = require("../models/ProductVariant");

// const router = express.Router();

// const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// // Hàm xử lý ảnh: nếu chưa có http thì thêm BASE_URL
// function formatImage(img) {
//   if (!img) return null;
//   return img.startsWith("http") ? img : BASE_URL + img;
// }

// // Hàm xử lý product + variants
// async function populateVariantsAndImages(product) {
//   if (!product || !product._id) return product;

//   const variants = await ProductVariant.find({ product: product._id }).lean();
//   const variantsWithImage = variants.map((v) => ({
//     ...v,
//     image: formatImage(v.image),
//   }));

//   return {
//     ...product,
//     images: (product.images || []).map((img) => formatImage(img)),
//     variants: variantsWithImage,
//   };
// }

// // 👉 Lấy giỏ hàng của user
// router.get("/:userId", async (req, res) => {
//   try {
//     let cart = await Cart.findOne({ user: req.params.userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();

//     if (!cart) return res.json({ user: req.params.userId, items: [] });

//     for (let item of cart.items) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 Thêm sản phẩm vào giỏ
// router.post("/add", async (req, res) => {
//   try {
//     const { userId, productId, variantId, quantity } = req.body;
//     let cart = await Cart.findOne({ user: userId });

//     if (!cart) {
//       cart = await Cart.create({
//         user: userId,
//         items: [
//           {
//             product: productId,
//             variant: variantId || undefined,
//             quantity: quantity || 1,
//           },
//         ],
//       });
//     } else {
//       const item = cart.items.find(
//         (i) =>
//           i.product.toString() === productId &&
//           ((variantId && i.variant && i.variant.toString() === variantId) ||
//             (!variantId && !i.variant))
//       );
//       if (item) {
//         item.quantity += quantity || 1;
//       } else {
//         cart.items.push({
//           product: productId,
//           variant: variantId || undefined,
//           quantity: quantity || 1,
//         });
//       }
//       await cart.save();
//     }

//     // Populate lại giỏ hàng
//     cart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();

//     for (let item of cart.items) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// router.post("/merge", async (req, res) => {
//   const { guestId, userId } = req.body;
//   if (!guestId || !userId)
//     return res.status(400).json({ error: "Thiếu guestId hoặc userId" });

//   const guestCart = await Cart.findOne({ user: guestId });
//   let userCart = await Cart.findOne({ user: userId });

//   if (guestCart && guestCart.items.length > 0) {
//     if (!userCart) {
//       // Nếu user chưa có cart, chuyển cart guest sang user
//       guestCart.user = userId;
//       await guestCart.save();
//       await Cart.deleteOne({ user: guestId });
//     } else {
//       // Merge từng item
//       for (const guestItem of guestCart.items) {
//         const exist = userCart.items.find(
//           (item) =>
//             item.product.toString() === guestItem.product.toString() &&
//             ((item.variant &&
//               guestItem.variant &&
//               item.variant.toString() === guestItem.variant.toString()) ||
//               (!item.variant && !guestItem.variant))
//         );
//         if (exist) {
//           exist.quantity += guestItem.quantity;
//         } else {
//           userCart.items.push(guestItem);
//         }
//       }
//       await userCart.save();
//       await Cart.deleteOne({ user: guestId });
//     }
//   }
//   res.json({ success: true });
// });
// router.post("/remove", async (req, res) => {
//   try {
//     const { userId, productId, variantId } = req.body;
//     let cart = await Cart.findOne({ user: userId });
//     if (!cart)
//       return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });

//     cart.items = cart.items.filter(
//       (i) =>
//         !(
//           i.product.toString() === productId &&
//           ((variantId && i.variant && i.variant.toString() === variantId) ||
//             (!variantId && !i.variant))
//         )
//     );
//     await cart.save();

//     cart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();

//     for (let item of cart.items) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 👉 Cập nhật số lượng
// router.post("/update", async (req, res) => {
//   try {
//     const { userId, productId, variantId, quantity } = req.body;
//     let cart = await Cart.findOne({ user: userId });
//     if (!cart)
//       return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });

//     const item = cart.items.find(
//       (i) =>
//         i.product.toString() === productId &&
//         ((variantId && i.variant && i.variant.toString() === variantId) ||
//           (!variantId && !i.variant))
//     );

//     if (!item)
//       return res
//         .status(404)
//         .json({ error: "Không tìm thấy sản phẩm trong giỏ" });

//     item.quantity = quantity;
//     await cart.save();

//     cart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();

//     for (let item of cart.items) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Hàm xử lý ảnh: Thêm BASE_URL nếu ảnh không có http
function formatImage(img) {
  if (!img) return null;
  return img.startsWith("http") ? img : `${BASE_URL}${img}`;
}

// Hàm xử lý product và variants
async function populateVariantsAndImages(product) {
  if (!product || !product._id) return product;

  const variants = await ProductVariant.find({ product: product._id }).lean();
  const variantsWithImage = variants.map((v) => ({
    ...v,
    image: formatImage(v.image),
  }));

  return {
    ...product,
    images: (product.images || []).map((img) => formatImage(img)),
    variants: variantsWithImage,
  };
}

// Lấy giỏ hàng của user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Lấy giỏ hàng cho userId:", userId);
    let cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();

    if (!cart) {
      console.log("Không tìm thấy giỏ hàng, trả về giỏ rỗng");
      return res.json({ user: userId, items: [] });
    }

    for (let item of cart.items) {
      if (item.product) {
        item.product = await populateVariantsAndImages(item.product);
      }
      if (item.variant) {
        item.variant.image = formatImage(item.variant.image);
      }
    }

    res.json(cart);
  } catch (err) {
    console.error("Lỗi khi lấy giỏ hàng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể lấy giỏ hàng" });
  }
});

// Thêm sản phẩm vào giỏ
router.post("/add", async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;
    if (!userId || !productId || !quantity) {
      console.log("Thiếu thông tin:", { userId, productId, quantity });
      return res
        .status(400)
        .json({ error: "Thiếu userId, productId hoặc quantity" });
    }
    console.log("Thêm vào giỏ:", { userId, productId, variantId, quantity });

    // Kiểm tra sản phẩm và biến thể tồn tại
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }
    if (variantId) {
      const variant = await ProductVariant.findById(variantId).lean();
      if (!variant) {
        return res.status(404).json({ error: "Biến thể không tồn tại" });
      }
      if (quantity > variant.stock) {
        return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
      }
    } else if (quantity > product.stock) {
      return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [
          { product: productId, variant: variantId || undefined, quantity },
        ],
      });
      console.log("Tạo giỏ hàng mới cho userId:", userId);
    } else {
      const item = cart.items.find(
        (i) =>
          i.product.toString() === productId &&
          ((variantId && i.variant && i.variant.toString() === variantId) ||
            (!variantId && !i.variant))
      );
      if (item) {
        item.quantity += quantity;
        console.log("Cập nhật số lượng mặt hàng:", item);
      } else {
        cart.items.push({
          product: productId,
          variant: variantId || undefined,
          quantity,
        });
        console.log("Thêm mặt hàng mới:", { productId, variantId, quantity });
      }
      await cart.save();
    }

    const updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    for (let item of updatedCart.items) {
      if (item.product) {
        item.product = await populateVariantsAndImages(item.product);
      }
      if (item.variant) {
        item.variant.image = formatImage(item.variant.image);
      }
    }

    res.json(updatedCart);
  } catch (err) {
    console.error("Lỗi khi thêm vào giỏ:", err);
    res.status(500).json({ error: "Lỗi server: Không thể thêm vào giỏ hàng" });
  }
});

// Hợp nhất giỏ hàng
router.post("/merge", async (req, res) => {
  try {
    const { guestId, userId } = req.body;
    if (!guestId || !userId) {
      console.log("Thiếu thông tin:", { guestId, userId });
      return res.status(400).json({ error: "Thiếu guestId hoặc userId" });
    }
    console.log("Hợp nhất giỏ hàng - GuestId:", guestId, "UserId:", userId);

    const guestCart = await Cart.findOne({ user: guestId });
    let userCart = await Cart.findOne({ user: userId });

    if (guestCart?.items?.length) {
      if (!userCart) {
        guestCart.user = userId;
        await guestCart.save();
        console.log("Chuyển giỏ hàng khách sang userId:", userId);
      } else {
        for (const guestItem of guestCart.items) {
          const exist = userCart.items.find(
            (item) =>
              item.product.toString() === guestItem.product.toString() &&
              ((item.variant &&
                guestItem.variant &&
                item.variant.toString() === guestItem.variant.toString()) ||
                (!item.variant && !guestItem.variant))
          );
          if (exist) {
            exist.quantity += guestItem.quantity;
            console.log("Cập nhật số lượng mặt hàng:", exist);
          } else {
            userCart.items.push(guestItem);
            console.log("Thêm mặt hàng mới vào giỏ người dùng:", guestItem);
          }
        }
        await userCart.save();
      }
      await Cart.deleteOne({ user: guestId });
      console.log("Xóa giỏ hàng khách thành công");
    } else {
      console.log("Không tìm thấy giỏ hàng khách hoặc giỏ trống");
    }

    const updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    for (let item of updatedCart?.items || []) {
      if (item.product) {
        item.product = await populateVariantsAndImages(item.product);
      }
      if (item.variant) {
        item.variant.image = formatImage(item.variant.image);
      }
    }

    res.json(updatedCart || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi hợp nhất giỏ hàng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể hợp nhất giỏ hàng" });
  }
});

// Xóa sản phẩm khỏi giỏ
router.post("/remove", async (req, res) => {
  try {
    const { userId, productId, variantId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ error: "Thiếu userId hoặc productId" });
    }
    console.log("Xóa khỏi giỏ:", { userId, productId, variantId });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
    }

    cart.items = cart.items.filter(
      (i) =>
        !(
          i.product.toString() === productId &&
          ((variantId && i.variant && i.variant.toString() === variantId) ||
            (!variantId && !i.variant))
        )
    );
    await cart.save();
    console.log("Xóa mặt hàng thành công");

    const updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    for (let item of updatedCart?.items || []) {
      if (item.product) {
        item.product = await populateVariantsAndImages(item.product);
      }
      if (item.variant) {
        item.variant.image = formatImage(item.variant.image);
      }
    }

    res.json(updatedCart || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi xóa khỏi giỏ:", err);
    res.status(500).json({ error: "Lỗi server: Không thể xóa sản phẩm" });
  }
});

// Cập nhật số lượng
router.post("/update", async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;
    if (!userId || !productId || !quantity) {
      return res
        .status(400)
        .json({ error: "Thiếu userId, productId hoặc quantity" });
    }
    console.log("Cập nhật số lượng:", {
      userId,
      productId,
      variantId,
      quantity,
    });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
    }

    const item = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        ((variantId && i.variant && i.variant.toString() === variantId) ||
          (!variantId && !i.variant))
    );
    if (!item) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm trong giỏ" });
    }

    // Kiểm tra tồn kho
    const product = await Product.findById(productId).lean();
    if (variantId) {
      const variant = await ProductVariant.findById(variantId).lean();
      if (!variant || quantity > variant.stock) {
        return res
          .status(400)
          .json({
            error: "Số lượng vượt quá tồn kho hoặc biến thể không tồn tại",
          });
      }
    } else if (quantity > product.stock) {
      return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
    }

    item.quantity = quantity;
    await cart.save();
    console.log("Cập nhật số lượng thành công:", item);

    const updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    for (let item of updatedCart?.items || []) {
      if (item.product) {
        item.product = await populateVariantsAndImages(item.product);
      }
      if (item.variant) {
        item.variant.image = formatImage(item.variant.image);
      }
    }

    res.json(updatedCart || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi cập nhật số lượng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể cập nhật số lượng" });
  }
});

module.exports = router;
