// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// // Địa chỉ gửi đi. Nếu chưa verify domain riêng trên Resend,
// // bắt buộc phải dùng địa chỉ mặc định này (onboarding@resend.dev).
// // Sau khi verify domain riêng (vd: yourdomain.com), đổi thành
// // "Cửa hàng <no-reply@yourdomain.com>"
// const FROM_ADDRESS =
//   process.env.MAIL_FROM || "Cửa hàng <onboarding@resend.dev>";

// function formatCurrency(n) {
//   return new Intl.NumberFormat("vi-VN", {
//     style: "currency",
//     currency: "VND",
//   }).format(n || 0);
// }

// function buildOrderHtml(order) {
//   const itemsHtml = (order.products || [])
//     .map((item) => {
//       const name = item.product?.name || "Sản phẩm";
//       const variantInfo = item.variant
//         ? ` (${item.variant.size || ""} ${item.variant.color || ""})`
//         : "";
//       return `<tr>
//         <td style="padding:6px;border:1px solid #eee;">${name}${variantInfo}</td>
//         <td style="padding:6px;border:1px solid #eee;text-align:center;">${item.quantity}</td>
//       </tr>`;
//     })
//     .join("");

//   const addr = order.shippingAddress;

//   return `
//     <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
//       <h2>Xác nhận đơn hàng #${order._id}</h2>
//       <p>Trạng thái: <b>${order.status}</b></p>
//       <p>Phương thức thanh toán: <b>${order.paymentMethod}</b></p>
//       <table style="width:100%;border-collapse:collapse;margin:12px 0;">
//         <thead>
//           <tr>
//             <th style="padding:6px;border:1px solid #eee;text-align:left;">Sản phẩm</th>
//             <th style="padding:6px;border:1px solid #eee;">SL</th>
//           </tr>
//         </thead>
//         <tbody>${itemsHtml}</tbody>
//       </table>
//       <p><b>Tổng tiền: ${formatCurrency(order.totalPrice)}</b></p>
//       ${
//         addr
//           ? `<p>Địa chỉ giao hàng: ${addr.fullName} - ${addr.phone} - ${addr.address}, ${addr.city}, ${addr.country}</p>`
//           : ""
//       }
//     </div>
//   `;
// }

// async function sendOrderEmails(order) {
//   const html = buildOrderHtml(order);
//   const customerEmail = order.user?.email;

//   const sendPromises = [];

//   if (customerEmail) {
//     sendPromises.push(
//       resend.emails.send({
//         from: FROM_ADDRESS,
//         to: customerEmail,
//         subject: `Xác nhận đơn hàng #${order._id}`,
//         html,
//       }),
//     );
//   }

//   if (process.env.ADMIN_EMAIL) {
//     sendPromises.push(
//       resend.emails.send({
//         from: FROM_ADDRESS,
//         to: process.env.ADMIN_EMAIL,
//         subject: `[Đơn hàng mới] #${order._id}`,
//         html,
//       }),
//     );
//   }

//   try {
//     const results = await Promise.allSettled(sendPromises);
//     results.forEach((r, i) => {
//       if (r.status === "rejected") {
//         console.error(`Gửi email #${i} thất bại:`, r.reason);
//       } else if (r.value?.error) {
//         console.error(`Gửi email #${i} bị Resend từ chối:`, r.value.error);
//       }
//     });
//     console.log("Đã xử lý gửi email đơn hàng cho:", order._id);
//   } catch (err) {
//     console.error("Lỗi gửi email đơn hàng:", err);
//   }
// }

// module.exports = { sendOrderEmails };
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Địa chỉ gửi đi. Nếu chưa verify domain riêng trên Resend,
// bắt buộc phải dùng địa chỉ mặc định này (onboarding@resend.dev).
// Sau khi verify domain riêng (vd: yourdomain.com), đổi thành
// "Cửa hàng <no-reply@yourdomain.com>"
const FROM_ADDRESS =
  process.env.MAIL_FROM || "Cửa hàng <onboarding@resend.dev>";

// ⚠️ TẠM THỜI để test - vì chưa verify domain riêng trên Resend,
// tài khoản chỉ được gửi email tới đúng địa chỉ đăng ký Resend.
// Khi có domain riêng và verify xong, xoá dòng này (hoặc set thành null)
// để email gửi đúng tới khách hàng thật.
const TEST_EMAIL_OVERRIDE = "sanggamer1042005@gmail.com";

function formatCurrency(n) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n || 0);
}

function buildOrderHtml(order) {
  const itemsHtml = (order.products || [])
    .map((item) => {
      const name = item.product?.name || "Sản phẩm";
      const variantInfo = item.variant
        ? ` (${item.variant.size || ""} ${item.variant.color || ""})`
        : "";
      return `<tr>
        <td style="padding:6px;border:1px solid #eee;">${name}${variantInfo}</td>
        <td style="padding:6px;border:1px solid #eee;text-align:center;">${item.quantity}</td>
      </tr>`;
    })
    .join("");

  const addr = order.shippingAddress;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2>Xác nhận đơn hàng #${order._id}</h2>
      <p>Trạng thái: <b>${order.status}</b></p>
      <p>Phương thức thanh toán: <b>${order.paymentMethod}</b></p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead>
          <tr>
            <th style="padding:6px;border:1px solid #eee;text-align:left;">Sản phẩm</th>
            <th style="padding:6px;border:1px solid #eee;">SL</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><b>Tổng tiền: ${formatCurrency(order.totalPrice)}</b></p>
      ${
        addr
          ? `<p>Địa chỉ giao hàng: ${addr.fullName} - ${addr.phone} - ${addr.address}, ${addr.city}, ${addr.country}</p>`
          : ""
      }
    </div>
  `;
}

async function sendOrderEmails(order) {
  const html = buildOrderHtml(order);

  // Nếu đang ở chế độ test (chưa verify domain), luôn gửi về TEST_EMAIL_OVERRIDE
  // thay vì email khách hàng thật, để tránh bị Resend từ chối (lỗi 403).
  const customerEmail = TEST_EMAIL_OVERRIDE || order.user?.email;

  const sendPromises = [];

  if (customerEmail) {
    sendPromises.push(
      resend.emails.send({
        from: FROM_ADDRESS,
        to: customerEmail,
        subject: `Xác nhận đơn hàng #${order._id}`,
        html,
      }),
    );
  }

  if (process.env.ADMIN_EMAIL) {
    sendPromises.push(
      resend.emails.send({
        from: FROM_ADDRESS,
        // Admin email cũng cần override nếu khác với email test,
        // nếu không sẽ tiếp tục bị Resend từ chối.
        to: TEST_EMAIL_OVERRIDE || process.env.ADMIN_EMAIL,
        subject: `[Đơn hàng mới] #${order._id}`,
        html,
      }),
    );
  }

  try {
    const results = await Promise.allSettled(sendPromises);
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Gửi email #${i} thất bại:`, r.reason);
      } else if (r.value?.error) {
        console.error(`Gửi email #${i} bị Resend từ chối:`, r.value.error);
      }
    });
    console.log("Đã xử lý gửi email đơn hàng cho:", order._id);
  } catch (err) {
    console.error("Lỗi gửi email đơn hàng:", err);
  }
}

module.exports = { sendOrderEmails };
