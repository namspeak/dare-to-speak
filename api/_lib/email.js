const { getConfig } = require("./config");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendPaymentNotification({ registration, payment }) {
  const config = getConfig();
  const [createdAt, code, name, email, phone, role] = registration.row;
  const subject = `[S-PEAK K09] Đã thanh toán 1.000.000 VND — ${name || code}`;
  const rows = [
    ["Học viên", name],
    ["Email", email],
    ["Số điện thoại", phone],
    ["Vai trò", role],
    ["Mã thanh toán", code],
    ["Số tiền nhận", `${Number(payment.transferAmount).toLocaleString("vi-VN")} VND`],
    ["Thời gian giao dịch", payment.transactionDate],
    ["Mã giao dịch SePay", payment.id],
    ["Thời điểm đăng ký", createdAt],
  ];

  const htmlRows = rows.map(([label, value]) => `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#667085">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#111827;font-weight:600">${escapeHtml(value)}</td></tr>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.resendFromEmail,
      to: [config.notificationEmail],
      subject,
      html: `<div style="font-family:Arial,sans-serif;color:#111827"><h2>Khách hàng đã thanh toán</h2><p>Khoản thanh toán cho DARE TO S-PEAK K09 đã được xác nhận tự động qua SePay.</p><table style="border-collapse:collapse">${htmlRows}</table></div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Không gửi được email thông báo: ${detail.slice(0, 250)}`);
  }
}

module.exports = { sendPaymentNotification };
