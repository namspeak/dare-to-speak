const REQUIRED_REGISTRATION_ENV = [
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "SEPAY_BANK_CODE",
  "SEPAY_ACCOUNT_NUMBER"
];

const REQUIRED_WEBHOOK_ENV = [
  ...REQUIRED_REGISTRATION_ENV,
  "SEPAY_HMAC_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NOTIFICATION_EMAIL"
];

function missingEnv(names) {
  return names.filter((name) => !String(process.env[name] || "").trim());
}

function getConfig() {
  return {
    spreadsheetId: String(process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "").trim(),
    bankCode: String(process.env.SEPAY_BANK_CODE || "").trim(),
    bankName: String(process.env.SEPAY_BANK_NAME || "Ngân hàng").trim(),
    accountNumber: String(process.env.SEPAY_ACCOUNT_NUMBER || "").trim(),
    codePrefix: String(process.env.PAYMENT_CODE_PREFIX || "DTS_").trim().toUpperCase(),
    amount: Number(process.env.PAYMENT_AMOUNT || 1000000),
    hmacSecret: String(process.env.SEPAY_HMAC_SECRET || "").trim(),
    resendApiKey: String(process.env.RESEND_API_KEY || "").trim(),
    resendFromEmail: String(process.env.RESEND_FROM_EMAIL || "").trim(),
    notificationEmail: String(process.env.NOTIFICATION_EMAIL || "").trim(),
  };
}

function getGoogleCredentials() {
  const raw = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing.");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
  }
}

module.exports = {
  REQUIRED_REGISTRATION_ENV,
  REQUIRED_WEBHOOK_ENV,
  missingEnv,
  getConfig,
  getGoogleCredentials,
};
