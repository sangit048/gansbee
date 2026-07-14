const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

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
  const customerEmail = order.user?.email;

  const sendPromises = [];

  if (customerEmail) {
    sendPromises.push(
      transporter.sendMail({
        from: `"Cửa hàng" <${process.env.MAIL_USER}>`,
        to: customerEmail,
        subject: `Xác nhận đơn hàng #${order._id}`,
        html,
      }),
    );
  }

  if (process.env.ADMIN_EMAIL) {
    sendPromises.push(
      transporter.sendMail({
        from: `"Hệ thống đơn hàng" <${process.env.MAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `[Đơn hàng mới] #${order._id}`,
        html,
      }),
    );
  }

  try {
    await Promise.all(sendPromises);
    console.log("Đã gửi email đơn hàng thành công cho:", order._id);
  } catch (err) {
    console.error("Lỗi gửi email đơn hàng:", err);
  }
}

module.exports = { sendOrderEmails };
