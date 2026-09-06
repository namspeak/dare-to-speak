const { google } = require("googleapis");
const { getConfig, getGoogleCredentials } = require("./config");

const REGISTRATION_RANGE = "REGISTRATIONS!A2:N";

function vietnamDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date).replace(",", "");
}

function safeCellText(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function createSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function getRegistrationRows() {
  const { spreadsheetId } = getConfig();
  const sheets = createSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: REGISTRATION_RANGE,
    majorDimension: "ROWS",
  });
  return response.data.values || [];
}

async function reserveRegistration({ name, email, phone, role }) {
  const config = getConfig();
  const sheets = createSheetsClient();
  const rows = await getRegistrationRows();
  const usedCodes = new Set(rows.map((row) => String(row[1] || "").toUpperCase()));

  let code = "";
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const candidate = `${config.codePrefix}${suffix}`;
    if (!usedCodes.has(candidate)) {
      code = candidate;
      break;
    }
  }

  if (!code) throw new Error("Không thể tạo mã thanh toán duy nhất. Vui lòng thử lại.");

  const values = [[
    vietnamDateTime(),
    code,
    safeCellText(name),
    safeCellText(email),
    safeCellText(phone),
    safeCellText(role),
    config.amount,
    "Chờ thanh toán",
    "",
    "",
    "",
    "",
    "",
    "",
  ]];

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: "REGISTRATIONS!A:N",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  const updatedRange = response.data.updates?.updatedRange || "";
  const rowMatch = updatedRange.match(/!(?:[A-Z]+)(\d+):/);

  return { code, rowNumber: rowMatch ? Number(rowMatch[1]) : null };
}

async function findRegistrationByCode(code) {
  const rows = await getRegistrationRows();
  const target = String(code || "").toUpperCase();
  const rowIndex = rows.findIndex((row) => String(row[1] || "").toUpperCase() === target);

  if (rowIndex < 0) return null;
  return { rowNumber: rowIndex + 2, row: rows[rowIndex] };
}

async function updatePayment({ rowNumber, existingRow, transactionId, transactionDate, transferAmount, status, note, notificationSentAt = "" }) {
  const config = getConfig();
  const sheets = createSheetsClient();
  const row = existingRow || [];
  const values = [[
    status,
    row[8] || "",
    transactionDate || vietnamDateTime(),
    String(transactionId || ""),
    Number(transferAmount || 0),
    note || row[12] || "",
    notificationSentAt || row[13] || "",
  ]];

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `REGISTRATIONS!H${rowNumber}:N${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

async function markNotificationSent(rowNumber, existingRow) {
  const config = getConfig();
  const sheets = createSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `REGISTRATIONS!N${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[vietnamDateTime()]] },
  });
}

function createPaymentQrUrl(code) {
  const config = getConfig();
  const query = new URLSearchParams({
    acc: config.accountNumber,
    bank: config.bankCode,
    amount: String(config.amount),
    des: code,
    template: "compact",
    showinfo: "true",
  });
  return `https://qr.sepay.vn/img?${query.toString()}`;
}

module.exports = {
  vietnamDateTime,
  reserveRegistration,
  findRegistrationByCode,
  updatePayment,
  markNotificationSent,
  createPaymentQrUrl,
};
