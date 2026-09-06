const crypto = require("crypto");
const { missingEnv, REQUIRED_WEBHOOK_ENV, getConfig } = require("./_lib/config");
const { json, readRawBody } = require("./_lib/http");
const { findRegistrationByCode, updatePayment, markNotificationSent } = require("./_lib/registration");
const { sendPaymentNotification } = require("./_lib/email");

module.exports.config = { api: { bodyParser: false } };

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hmacIsValid(req, rawBody, secret) {
  const timestamp = String(req.headers["x-sepay-timestamp"] || "");
  const signature = String(req.headers["x-sepay-signature"] || "");
  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber) || Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > 600) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex")}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function isRecognizedPaymentCode(code, prefix) {
  return new RegExp(`^${escapeRegex(prefix)}\\d{1,5}$`, "i").test(String(code || ""));
}

module.exports = async function sepayWebhook(req, res) {
  if (req.method !== "POST") return json(res, 405, { success: false });

  const missing = missingEnv(REQUIRED_WEBHOOK_ENV);
  if (missing.length) return json(res, 503, { success: false });

  try {
    const rawBody = await readRawBody(req);
    const config = getConfig();

    if (!hmacIsValid(req, rawBody, config.hmacSecret)) {
      return json(res, 401, { success: false });
    }

    const payment = JSON.parse(rawBody.toString("utf8") || "{}");
    const code = String(payment.code || "").toUpperCase();

    if (payment.transferType !== "in" || !isRecognizedPaymentCode(code, config.codePrefix)) {
      return json(res, 200, { success: true });
    }

    const registration = await findRegistrationByCode(code);
    if (!registration) return json(res, 200, { success: true });

    const previousTransactionId = String(registration.row[10] || "");
    const notificationSentAt = String(registration.row[13] || "");
    const amountMatches = Number(payment.transferAmount) === config.amount;

    if (!amountMatches) {
      if (previousTransactionId !== String(payment.id)) {
        await updatePayment({
          rowNumber: registration.rowNumber,
          existingRow: registration.row,
          transactionId: payment.id,
          transactionDate: payment.transactionDate,
          transferAmount: payment.transferAmount,
          status: "Lệch số tiền",
          note: `SePay #${payment.id}: nhận ${Number(payment.transferAmount).toLocaleString("vi-VN")} VND, cần ${config.amount.toLocaleString("vi-VN")} VND.`,
        });
      }
      return json(res, 200, { success: true });
    }

    if (previousTransactionId !== String(payment.id)) {
      await updatePayment({
        rowNumber: registration.rowNumber,
        existingRow: registration.row,
        transactionId: payment.id,
        transactionDate: payment.transactionDate,
        transferAmount: payment.transferAmount,
        status: "Đã thanh toán",
        note: `Đối soát tự động qua SePay #${payment.id}.`,
      });
      registration.row[10] = String(payment.id);
      registration.row[7] = "Đã thanh toán";
    }

    if (!notificationSentAt) {
      await sendPaymentNotification({ registration, payment });
      await markNotificationSent(registration.rowNumber, registration.row);
    }

    return json(res, 200, { success: true });
  } catch (error) {
    console.error("SePay webhook error", error);
    return json(res, 500, { success: false });
  }
};
