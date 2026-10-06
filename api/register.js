const { missingEnv, REQUIRED_REGISTRATION_ENV, getConfig } = require("./_lib/config");
const { json, setCors, handleOptions, readRawBody } = require("./_lib/http");
const { reserveRegistration, createPaymentQrUrl } = require("./_lib/registration");
const { calculateRegistrationPrice } = require("./_lib/pricing");

module.exports.config = { api: { bodyParser: false } };

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

module.exports = async function register(req, res) {
  if (handleOptions(req, res)) return;
  setCors(req, res);

  if (req.method !== "POST") return json(res, 405, { success: false, message: "Method not allowed" });

  const missing = missingEnv(REQUIRED_REGISTRATION_ENV);
  if (missing.length) {
    return json(res, 503, { success: false, message: "Cổng thanh toán đang được hoàn thiện. Vui lòng thử lại sau." });
  }

  try {
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString("utf8") || "{}");

    if (cleanText(body.website, 100)) return json(res, 200, { success: true });

    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 120).toLowerCase();
    const phone = cleanText(body.phone, 30);
    const role = cleanText(body.role, 60);
    const pricing = calculateRegistrationPrice({ promoCode: cleanText(body.promoCode, 30), regularPrice: getConfig().amount });

    if (name.length < 2 || !isValidEmail(email) || phone.length < 8 || !role) {
      return json(res, 422, { success: false, message: "Vui lòng kiểm tra lại họ tên, email, số điện thoại và vai trò." });
    }

    if (!pricing.valid) {
      return json(res, 422, { success: false, message: "Mã ưu đãi không hợp lệ. Vui lòng kiểm tra DTS50 hoặc DTS100." });
    }

    const registration = await reserveRegistration({ name, email, phone, role, amount: pricing.amount, promoCode: pricing.promoCode });
    const config = getConfig();

    return json(res, 201, {
      success: true,
      paymentCode: registration.code,
      amount: pricing.amount,
      qrUrl: createPaymentQrUrl(registration.code, pricing.amount),
      pricingReason: pricing.reason,
      bankName: config.bankName,
      accountNumber: config.accountNumber,
    });
  } catch (error) {
    console.error("Registration error", error);
    return json(res, 500, { success: false, message: "Không thể tạo mã thanh toán lúc này. Vui lòng thử lại sau." });
  }
};
