// const express = require("express");
// const Cart = require("../models/Cart");
// const Product = require("../models/Product");
// const ProductVariant = require("../models/ProductVariant");

// const router = express.Router();

// // Helper: build BASE_URL đúng (https + /api) — đồng bộ với products.js / variants.js
// function getBaseUrl(req) {
//   const protocol =
//     process.env.NODE_ENV === "production" ? "https" : req.protocol;
//   return `${protocol}://${req.get("host")}/api`;
// }

// // Hàm xử lý ảnh: build đúng route GET /products/images/:filename
// function formatImage(baseUrl, filename) {
//   if (!filename) return null;
//   if (filename.startsWith("http")) {
//     return filename.replace(/^http:\/\//, "https://");
//   }
//   const cleanName = filename.replace(/^\/?(images\/)?/, "");
//   return `${baseUrl}/products/images/${cleanName}`;
// }

// // Hàm xử lý product và variants (gắn variants + convert ảnh full URL)
// async function populateVariantsAndImages(product, baseUrl) {
//   if (!product || !product._id) return product;

//   const variants = await ProductVariant.find({ product: product._id }).lean();
//   const variantsWithImage = variants.map((v) => ({
//     ...v,
//     image: formatImage(baseUrl, v.image),
//   }));

//   return {
//     ...product,
//     images: (product.images || []).map((img) => formatImage(baseUrl, img)),
//     variants: variantsWithImage,
//   };
// }

// // Hàm dùng chung: convert toàn bộ ảnh trong 1 cart (product + variant snapshot)
// async function formatCartImages(cart, baseUrl) {
//   if (!cart) return cart;
//   for (let item of cart.items || []) {
//     if (item.product) {
//       item.product = await populateVariantsAndImages(item.product, baseUrl);
//     }
//     if (item.variant) {
//       item.variant.image = formatImage(baseUrl, item.variant.image);
//     }
//   }
//   return cart;
// }

// // ─────────────────────────────────────────────
// // GET /:userId — Lấy giỏ hàng của user
// // ─────────────────────────────────────────────
// router.get("/:userId", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
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

//     cart = await formatCartImages(cart, BASE_URL);

//     res.json(cart);
//   } catch (err) {
//     console.error("Lỗi khi lấy giỏ hàng:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể lấy giỏ hàng" });
//   }
// });

// // ─────────────────────────────────────────────
// // POST /add — Thêm sản phẩm vào giỏ
// // ─────────────────────────────────────────────
// router.post("/add", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
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

//     let updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     updatedCart = await formatCartImages(updatedCart, BASE_URL);

//     res.json(updatedCart);
//   } catch (err) {
//     console.error("Lỗi khi thêm vào giỏ:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể thêm vào giỏ hàng" });
//   }
// });

// // ─────────────────────────────────────────────
// // POST /merge — Hợp nhất giỏ hàng
// // ─────────────────────────────────────────────
// router.post("/merge", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
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

//     let updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     updatedCart = await formatCartImages(updatedCart, BASE_URL);

//     res.json(updatedCart || { user: userId, items: [] });
//   } catch (err) {
//     console.error("Lỗi khi hợp nhất giỏ hàng:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể hợp nhất giỏ hàng" });
//   }
// });

// // ─────────────────────────────────────────────
// // POST /remove — Xóa sản phẩm khỏi giỏ
// // ─────────────────────────────────────────────
// router.post("/remove", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
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

//     let updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     updatedCart = await formatCartImages(updatedCart, BASE_URL);

//     res.json(updatedCart || { user: userId, items: [] });
//   } catch (err) {
//     console.error("Lỗi khi xóa khỏi giỏ:", err);
//     res.status(500).json({ error: "Lỗi server: Không thể xóa sản phẩm" });
//   }
// });

// // ─────────────────────────────────────────────
// // POST /update — Cập nhật số lượng
// // ─────────────────────────────────────────────
// router.post("/update", async (req, res) => {
//   try {
//     const BASE_URL = getBaseUrl(req);
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

//     let updatedCart = await Cart.findOne({ user: userId })
//       .populate("items.product")
//       .populate("items.variant")
//       .lean();
//     updatedCart = await formatCartImages(updatedCart, BASE_URL);

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

// Helper: build BASE_URL đúng (https + /api)
function getBaseUrl(req) {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : req.protocol;
  return `${protocol}://${req.get("host")}/api`;
}

function formatImage(baseUrl, filename) {
  if (!filename) return null;
  if (filename.startsWith("http")) {
    return filename.replace(/^http:\/\//, "https://");
  }
  const cleanName = filename.replace(/^\/?(images\/)?/, "");
  return `${baseUrl}/products/images/${cleanName}`;
}

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

/**
 * Lọc bỏ item "chết":
 * - product bị xóa (populate ra null)
 * - quantity <= 0
 * - (tuỳ chọn) variant bắt buộc nhưng bị null
 *
 * Đồng thời lưu lại cart nếu có item bị loại.
 */
async function sanitizeCart(cart, { requireVariant = false } = {}) {
  if (!cart || !cart.items) return cart;

  const before = cart.items.length;
  cart.items = cart.items.filter((item) => {
    if (!item) return false;
    if (!item.product) return false; // product đã bị xóa
    if (!item.quantity || item.quantity < 1) return false;
    if (requireVariant && !item.variant) return false;
    return true;
  });

  if (cart.items.length !== before) {
    // Lưu bản document Mongoose (không lean)
    await cart.save();
  }
  return cart;
}

// ─────────────────────────────────────────────
// GET /:userId
// ─────────────────────────────────────────────
router.get("/:userId", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const { userId } = req.params;

    let cartDoc = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant");

    if (!cartDoc) {
      return res.json({ user: userId, items: [] });
    }

    // Dọn item chết (product null / quantity 0)
    await sanitizeCart(cartDoc, { requireVariant: false });

    let cart = cartDoc.toObject();
    cart = await formatCartImages(cart, BASE_URL);

    res.json(cart);
  } catch (err) {
    console.error("Lỗi khi lấy giỏ hàng:", err);
    res.status(500).json({ error: "Lỗi server: Không thể lấy giỏ hàng" });
  }
});

// ─────────────────────────────────────────────
// POST /add
// ─────────────────────────────────────────────
router.post("/add", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const { userId, productId, variantId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res
        .status(400)
        .json({ error: "Thiếu userId, productId hoặc quantity" });
    }

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
    } else if (product.stock != null && quantity > product.stock) {
      return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [
          {
            product: productId,
            variant: variantId || undefined,
            quantity,
          },
        ],
      });
    } else {
      const item = cart.items.find((i) => {
        const sameProduct = i.product.toString() === productId;
        if (!sameProduct) return false;
        if (variantId) {
          return i.variant && i.variant.toString() === variantId;
        }
        return !i.variant;
      });

      if (item) {
        item.quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          variant: variantId || undefined,
          quantity,
        });
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
// POST /merge
// ─────────────────────────────────────────────
router.post("/merge", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const { guestId, userId } = req.body;
    if (!guestId || !userId) {
      return res.status(400).json({ error: "Thiếu guestId hoặc userId" });
    }

    const guestCart = await Cart.findOne({ user: guestId });
    let userCart = await Cart.findOne({ user: userId });

    if (guestCart?.items?.length) {
      if (!userCart) {
        guestCart.user = userId;
        await guestCart.save();
      } else {
        for (const guestItem of guestCart.items) {
          const exist = userCart.items.find((item) => {
            const sameProduct =
              item.product.toString() === guestItem.product.toString();
            if (!sameProduct) return false;
            if (guestItem.variant) {
              return (
                item.variant &&
                item.variant.toString() === guestItem.variant.toString()
              );
            }
            return !item.variant;
          });
          if (exist) {
            exist.quantity += guestItem.quantity;
          } else {
            userCart.items.push(guestItem);
          }
        }
        await userCart.save();
      }
      await Cart.deleteOne({ user: guestId });
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
// POST /remove  ← ƯU TIÊN itemId, fallback productId + variantId
// ─────────────────────────────────────────────
router.post("/remove", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const { userId, itemId, productId, variantId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Thiếu userId" });
    }
    if (!itemId && !productId) {
      return res
        .status(400)
        .json({ error: "Thiếu itemId hoặc productId để xóa" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
    }

    const before = cart.items.length;

    if (itemId) {
      // Cách chắc chắn nhất: xóa theo _id của dòng cart
      cart.items = cart.items.filter(
        (i) => i._id.toString() !== itemId.toString(),
      );
    } else {
      // Fallback cũ
      cart.items = cart.items.filter((i) => {
        const sameProduct = i.product.toString() === productId;
        if (!sameProduct) return true; // giữ lại

        if (variantId) {
          // Xóa đúng variant
          return !(i.variant && i.variant.toString() === variantId);
        }
        // Không gửi variantId → xóa item không có variant
        // HOẶC xóa mọi item cùng product nếu muốn mạnh hơn:
        // return false;
        return !!i.variant; // chỉ xóa item không có variant
      });
    }

    if (cart.items.length === before) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm trong giỏ để xóa" });
    }

    await cart.save();

    let updatedCart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant");

    await sanitizeCart(updatedCart, { requireVariant: false });

    let result = updatedCart.toObject();
    result = await formatCartImages(result, BASE_URL);

    res.json(result || { user: userId, items: [] });
  } catch (err) {
    console.error("Lỗi khi xóa khỏi giỏ:", err);
    res.status(500).json({ error: "Lỗi server: Không thể xóa sản phẩm" });
  }
});

// ─────────────────────────────────────────────
// POST /update
// ─────────────────────────────────────────────
router.post("/update", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const { userId, itemId, productId, variantId, quantity } = req.body;

    if (!userId || quantity == null) {
      return res.status(400).json({ error: "Thiếu userId hoặc quantity" });
    }
    if (!itemId && !productId) {
      return res.status(400).json({ error: "Thiếu itemId hoặc productId" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
    }

    let item = null;
    if (itemId) {
      item = cart.items.find((i) => i._id.toString() === itemId.toString());
    } else {
      item = cart.items.find((i) => {
        const sameProduct = i.product.toString() === productId;
        if (!sameProduct) return false;
        if (variantId) {
          return i.variant && i.variant.toString() === variantId;
        }
        return !i.variant;
      });
    }

    if (!item) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm trong giỏ" });
    }

    // Kiểm tra tồn kho
    const pid = item.product.toString();
    const vid = item.variant ? item.variant.toString() : null;

    if (vid) {
      const variant = await ProductVariant.findById(vid).lean();
      if (!variant || quantity > variant.stock) {
        return res.status(400).json({
          error: "Số lượng vượt quá tồn kho hoặc biến thể không tồn tại",
        });
      }
    } else {
      const product = await Product.findById(pid).lean();
      if (!product || (product.stock != null && quantity > product.stock)) {
        return res.status(400).json({ error: "Số lượng vượt quá tồn kho" });
      }
    }

    item.quantity = quantity;
    await cart.save();

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

// ─────────────────────────────────────────────
// POST /cleanup  — dọn item chết (product null / variant null nếu muốn)
// ─────────────────────────────────────────────
router.post("/cleanup", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const { userId, requireVariant = false } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Thiếu userId" });
    }

    let cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate("items.variant");

    if (!cart) {
      return res.json({ user: userId, items: [] });
    }

    await sanitizeCart(cart, { requireVariant: !!requireVariant });

    let result = cart.toObject();
    result = await formatCartImages(result, BASE_URL);

    res.json(result);
  } catch (err) {
    console.error("Lỗi cleanup cart:", err);
    res.status(500).json({ error: "Lỗi server khi cleanup giỏ hàng" });
  }
});

module.exports = router;
