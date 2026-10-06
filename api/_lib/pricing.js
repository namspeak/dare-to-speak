const REGULAR_PRICE = 1000000;
const EARLY_BIRD_PRICE = 500000;
const EARLY_BIRD_DEADLINE = Date.parse("2026-10-15T00:00:00+07:00");
const PROMO_CODES = Object.freeze({ DTS50: 500000, DTS100: 0 });

function calculateRegistrationPrice({ promoCode = "", now = new Date(), regularPrice = REGULAR_PRICE } = {}) {
  const normalizedCode = String(promoCode || "").trim().toUpperCase();

  if (normalizedCode && !Object.hasOwn(PROMO_CODES, normalizedCode)) {
    return { valid: false, promoCode: normalizedCode, amount: null, reason: "invalid_code" };
  }

  if (normalizedCode) {
    return {
      valid: true,
      promoCode: normalizedCode,
      amount: PROMO_CODES[normalizedCode],
      reason: normalizedCode,
    };
  }

  const earlyBird = new Date(now).getTime() < EARLY_BIRD_DEADLINE;
  return {
    valid: true,
    promoCode: "",
    amount: earlyBird ? EARLY_BIRD_PRICE : Number(regularPrice),
    reason: earlyBird ? "early_bird" : "regular",
  };
}

module.exports = { REGULAR_PRICE, EARLY_BIRD_PRICE, EARLY_BIRD_DEADLINE, calculateRegistrationPrice };
