export const CURRENCIES = {
  USD: { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  INR: { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  EUR: { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE" },
};

export const DEFAULT_CURRENCY = "USD";

export const isSupportedCurrency = (code) =>
  Object.prototype.hasOwnProperty.call(CURRENCIES, code);

const formatters = new Map();

function getFormatter(code, compact) {
  const key = `${code}:${compact}`;
  if (!formatters.has(key)) {
    const { locale } = CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
    formatters.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        ...(compact
          ? { notation: "compact", maximumFractionDigits: 1 }
          : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      })
    );
  }
  return formatters.get(key);
}

export function formatMoney(amount, code = DEFAULT_CURRENCY, { compact = false } = {}) {
  const safeCode = isSupportedCurrency(code) ? code : DEFAULT_CURRENCY;
  return getFormatter(safeCode, compact).format(Number(amount) || 0);
}
