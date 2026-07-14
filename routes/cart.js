// const express = require("express");
// const Cart = require("../models/Cart");
// const Product = require("../models/Product");
// const ProductVariant = require("../models/ProductVariant");

// const router = express.Router();

// const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// // Hàm xử lý ảnh: Thêm BASE_URL nếu ảnh không có http
// function formatImage(img) {
//   if (!img) return null;
//   return img.startsWith("http") ? img : `${BASE_URL}${img}`;
// }

// // Hàm xử lý product và variants
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

// // Lấy giỏ hàng của user
// router.get("/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     console.log("Lấy giỏ hàng cho userId:", userId);
//     let cart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();

//     if (!cart) {
//       console.log("Không tìm thấy giỏ hàng, trả về giỏ rỗng");
//       return res.json({ user: userId, items: [] });
//     }

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
//     console.error("Lỗi khi lấy giỏ hàng:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể lấy giỏ hàng" });
//   }
// });

// // Thêm sản phẩm vào giỏ
// router.post("/add", async (req, res) => {
//   try {
//     const { userId, productId, variantId, quantity } = req.body;
//     if (!userId || !productId || !quantity) {
//       console.log("Thiếu thông tin:", { userId, productId, quantity });
//       return res
//         .status(400)
//         .json({ error: "Thiếu userId, productId hoặc quantity" });
//     }
//     console.log("Thêm vào giỏ:", { userId, productId, variantId, quantity });

//     // Kiểm tra sản phẩm và biến thể tồn tại
//     const product = await Product.findById(productId).lean();
//     if (!product) {
//       return res.status(404).json({ error: "Sản phẩm không tồn tại" });
//     }
//     if (variantId) {
//       const variant = await ProductVariant.findById(variantId).lean();
//       if (!variant) {
//         return res.status(404).json({ error: "Biến thể không tồn tại" });
//       }
//       if (quantity > variant.stock) {
//         return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
//       }
//     } else if (quantity > product.stock) {
//       return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
//     }

//     let cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       cart = await Cart.create({
//         user: userId,
//         items: [
//           { product: productId, variant: variantId || undefined, quantity },
//         ],
//       });
//       console.log("Tạo giỏ hàng mới cho userId:", userId);
//     } else {
//       const item = cart.items.find(
//         (i) =>
//           i.product.toString() === productId &&
//           ((variantId && i.variant && i.variant.toString() === variantId) ||
//             (!variantId && !i.variant)),
//       );
//       if (item) {
//         item.quantity += quantity;
//         console.log("Cập nhật số lượng mặt hàng:", item);
//       } else {
//         cart.items.push({
//           product: productId,
//           variant: variantId || undefined,
//           quantity,
//         });
//         console.log("Thêm mặt hàng mới:", { productId, variantId, quantity });
//       }
//       await cart.save();
//     }

//     const updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     for (let item of updatedCart.items) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(updatedCart);
//   } catch (err) {
//     console.error("Lỗi khi thêm vào giỏ:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể thêm vào giỏ hàng" });
//   }
// });

// // Hợp nhất giỏ hàng
// router.post("/merge", async (req, res) => {
//   try {
//     const { guestId, userId } = req.body;
//     if (!guestId || !userId) {
//       console.log("Thiếu thông tin:", { guestId, userId });
//       return res.status(400).json({ error: "Thiếu guestId hoặc userId" });
//     }
//     console.log("Hợp nhất giỏ hàng - GuestId:", guestId, "UserId:", userId);

//     const guestCart = await Cart.findOne({ user: guestId });
//     let userCart = await Cart.findOne({ user: userId });

//     if (guestCart?.items?.length) {
//       if (!userCart) {
//         guestCart.user = userId;
//         await guestCart.save();
//         console.log("Chuyển giỏ hàng khách sang userId:", userId);
//       } else {
//         for (const guestItem of guestCart.items) {
//           const exist = userCart.items.find(
//             (item) =>
//               item.product.toString() === guestItem.product.toString() &&
//               ((item.variant &&
//                 guestItem.variant &&
//                 item.variant.toString() === guestItem.variant.toString()) ||
//                 (!item.variant && !guestItem.variant)),
//           );
//           if (exist) {
//             exist.quantity += guestItem.quantity;
//             console.log("Cập nhật số lượng mặt hàng:", exist);
//           } else {
//             userCart.items.push(guestItem);
//             console.log("Thêm mặt hàng mới vào giỏ người dùng:", guestItem);
//           }
//         }
//         await userCart.save();
//       }
//       await Cart.deleteOne({ user: guestId });
//       console.log("Xóa giỏ hàng khách thành công");
//     } else {
//       console.log("Không tìm thấy giỏ hàng khách hoặc giỏ trống");
//     }

//     const updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     for (let item of updatedCart?.items || []) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(updatedCart || { user: userId, items: [] });
//   } catch (err) {
//     console.error("Lỗi khi hợp nhất giỏ hàng:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể hợp nhất giỏ hàng" });
//   }
// });

// // Xóa sản phẩm khỏi giỏ
// router.post("/remove", async (req, res) => {
//   try {
//     const { userId, productId, variantId } = req.body;
//     if (!userId || !productId) {
//       return res.status(400).json({ error: "Thiếu userId hoặc productId" });
//     }
//     console.log("Xóa khỏi giỏ:", { userId, productId, variantId });

//     let cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
//     }

//     cart.items = cart.items.filter(
//       (i) =>
//         !(
//           i.product.toString() === productId &&
//           ((variantId && i.variant && i.variant.toString() === variantId) ||
//             (!variantId && !i.variant))
//         ),
//     );
//     await cart.save();
//     console.log("Xóa mặt hàng thành công");

//     const updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     for (let item of updatedCart?.items || []) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(updatedCart || { user: userId, items: [] });
//   } catch (err) {
//     console.error("Lỗi khi xóa khỏi giỏ:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể xóa sản phẩm" });
//   }
// });

// // Cập nhật số lượng
// router.post("/update", async (req, res) => {
//   try {
//     const { userId, productId, variantId, quantity } = req.body;
//     if (!userId || !productId || !quantity) {
//       return res
//         .status(400)
//         .json({ error: "Thiếu userId, productId hoặc quantity" });
//     }
//     console.log("Cập nhật số lượng:", {
//       userId,
//       productId,
//       variantId,
//       quantity,
//     });

//     let cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
//     }

//     const item = cart.items.find(
//       (i) =>
//         i.product.toString() === productId &&
//         ((variantId && i.variant && i.variant.toString() === variantId) ||
//           (!variantId && !i.variant)),
//     );
//     if (!item) {
//       return res
//         .status(404)
//         .json({ error: "Không tìm thấy sản phẩm trong giỏ" });
//     }

//     // Kiểm tra tồn kho
//     const product = await Product.findById(productId).lean();
//     if (variantId) {
//       const variant = await ProductVariant.findById(variantId).lean();
//       if (!variant || quantity > variant.stock) {
//         return res.status(400).json({
//           error: "Số lượng vượt quá tồn kho hoặc biến thể không tồn tại",
//         });
//       }
//     } else if (quantity > product.stock) {
//       return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
//     }

//     item.quantity = quantity;
//     await cart.save();
//     console.log("Cập nhật số lượng thành công:", item);

//     const updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     for (let item of updatedCart?.items || []) {
//       if (item.product) {
//         item.product = await populateVariantsAndImages(item.product);
//       }
//       if (item.variant) {
//         item.variant.image = formatImage(item.variant.image);
//       }
//     }

//     res.json(updatedCart || { user: userId, items: [] });
//   } catch (err) {
//     console.error("Lỗi khi cập nhật số lượng:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể cập nhật số lượng" });
//   }
// });

// module.exports = router;
const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

const router = express.Router();

// Helper: build BASE_URL đúng (https + /api) — đồng bộ với products.js / variants.js
function getBaseUrl(req) {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : req.protocol;
  return `${protocol}://${req.get("host")}/api`;
}

// Hàm xử lý ảnh: build đúng route GET /products/images/:filename
function formatImage(baseUrl, filename) {
  if (!filename) return null;
  if (filename.startsWith("http")) {
    return filename.replace(/^http:\/\//, "https://");
  }
  const cleanName = filename.replace(/^\/?(images\/)?/, "");
  return `${baseUrl}/products/images/${cleanName}`;
}

// Hàm xử lý product và variants (gắn variants + convert ảnh full URL)
async function populateVariantsAndImages(product, baseUrl) {
  if (!product || !product._id) return product;

  const variants = await ProductVariant.find({ product: product._id }).lean();
  const variantsWithImage = variants.map((v) => ({
    ...v,
    image: formatImage(baseUrl, v.image),
  }));

  return {
    ...product,
    images: (product.images || []).map((img) => formatImage(baseUrl, img)),
    variants: variantsWithImage,
  };
}

// Hàm dùng chung: convert toàn bộ ảnh trong 1 cart (product + variant snapshot)
async function formatCartImages(cart, baseUrl) {
  if (!cart) return cart;
  for (let item of cart.items || []) {
    if (item.product) {
      item.product = await populateVariantsAndImages(item.product, baseUrl);
    }
    if (item.variant) {
      item.variant.image = formatImage(baseUrl, item.variant.image);
    }
  }
  return cart;
}

// ─────────────────────────────────────────────
// GET /:userId — Lấy giỏ hàng của user
// ─────────────────────────────────────────────
router.get("/:userId", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
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

    cart = await formatCartImages(cart, BASE_URL);

    res.json(cart);
  } catch (err) {
    console.error("Lỗi khi lấy giỏ hàng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể lấy giỏ hàng" });
  }
});

// ─────────────────────────────────────────────
// POST /add — Thêm sản phẩm vào giỏ
// ─────────────────────────────────────────────
router.post("/add", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
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
            (!variantId && !i.variant)),
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

    let updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    updatedCart = await formatCartImages(updatedCart, BASE_URL);

    res.json(updatedCart);
  } catch (err) {
    console.error("Lỗi khi thêm vào giỏ:", err);
    res.status(500).json({ error: "Lỗi server: Không thể thêm vào giỏ hàng" });
  }
});

// ─────────────────────────────────────────────
// POST /merge — Hợp nhất giỏ hàng
// ─────────────────────────────────────────────
router.post("/merge", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
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
                (!item.variant && !guestItem.variant)),
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

    let updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    updatedCart = await formatCartImages(updatedCart, BASE_URL);

    res.json(updatedCart || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi hợp nhất giỏ hàng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể hợp nhất giỏ hàng" });
  }
});

// ─────────────────────────────────────────────
// POST /remove — Xóa sản phẩm khỏi giỏ
// ─────────────────────────────────────────────
router.post("/remove", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
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
        ),
    );
    await cart.save();
    console.log("Xóa mặt hàng thành công");

    let updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    updatedCart = await formatCartImages(updatedCart, BASE_URL);

    res.json(updatedCart || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi xóa khỏi giỏ:", err);
    res.status(500).json({ error: "Lỗi server: Không thể xóa sản phẩm" });
  }
});

// ─────────────────────────────────────────────
// POST /update — Cập nhật số lượng
// ─────────────────────────────────────────────
router.post("/update", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
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
          (!variantId && !i.variant)),
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
        return res.status(400).json({
          error: "Số lượng vượt quá tồn kho hoặc biến thể không tồn tại",
        });
      }
    } else if (quantity > product.stock) {
      return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
    }

    item.quantity = quantity;
    await cart.save();
    console.log("Cập nhật số lượng thành công:", item);

    let updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant")
      .lean();
    updatedCart = await formatCartImages(updatedCart, BASE_URL);

    res.json(updatedCart || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi cập nhật số lượng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể cập nhật số lượng" });
  }
});

module.exports = router;
