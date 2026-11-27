// Parses a one-line transaction: "coffee 4.50 yesterday", "salary 5200 income",
// "rent 1450 monthly on 3rd", "uber 18 friday", "groceries 62.30 2026-11-20".
import { subDays, startOfDay, setDate, isAfter, addMonths } from "date-fns";
import { categorize, isIncomeCategory } from "./rules.js";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const SHORT_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const INCOME_WORDS = ["income", "received", "earned", "got paid", "refund"];
const EXPENSE_WORDS = ["spent", "paid", "expense", "bought"];
const INTERVALS = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY", annually: "YEARLY", "every day": "DAILY", "every week": "WEEKLY", "every month": "MONTHLY", "every year": "YEARLY" };

export function parseQuickAdd(input, { rules = [], now = new Date() } = {}) {
  let text = ` ${String(input || "").trim()} `;
  const today = startOfDay(now);
  const out = { amount: null, date: today, type: null, recurringInterval: null, description: "", category: null, categorySource: null };

  // Amount: first number, optional currency symbol and thousands separators
  const amountMatch = text.match(/[\s]([$₹€]?\s?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|[$₹€]?\s?\d+(?:\.\d{1,2})?)(?=\s)/);
  if (amountMatch) {
    out.amount = Number(amountMatch[1].replace(/[$₹€,\s]/g, ""));
    text = text.replace(amountMatch[0], " ");
  }

  const take = (re) => {
    const m = text.match(re);
    if (m) text = text.replace(m[0], " ");
    return m;
  };

  // Recurrence
  for (const [word, interval] of Object.entries(INTERVALS)) {
    if (take(new RegExp(`\\s${word}\\s`, "i"))) { out.recurringInterval = interval; break; }
  }

  // Dates
  let m;
  if ((m = take(/\s(\d{4}-\d{2}-\d{2})\s/))) {
    const d = new Date(`${m[1]}T00:00:00`);
    if (!Number.isNaN(d.getTime())) out.date = d;
  } else if (take(/\s(yesterday|yday)\s/i)) {
    out.date = subDays(today, 1);
  } else if (take(/\stoday\s/i)) {
    out.date = today;
  } else if ((m = take(/\s(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\s/i))) {
    let d = setDate(today, Math.min(31, Number(m[1])));
    if (isAfter(d, today)) d = addMonths(d, -1); // "on 28th" means the most recent 28th
    out.date = d;
  } else {
    const dayIdx = [...WEEKDAYS, ...SHORT_DAYS].findIndex((w) => new RegExp(`\\s(?:last\\s+|on\\s+)?${w}\\s`, "i").test(text));
    if (dayIdx >= 0) {
      const target = dayIdx % 7;
      take(new RegExp(`\\s(?:last\\s+|on\\s+)?${[...WEEKDAYS, ...SHORT_DAYS][dayIdx]}\\s`, "i"));
      const back = (today.getDay() - target + 7) % 7 || 7;
      out.date = subDays(today, back);
    }
  }

  // Type words
  for (const w of INCOME_WORDS) if (take(new RegExp(`\\s${w}\\s`, "i"))) { out.type = "INCOME"; break; }
  if (!out.type) for (const w of EXPENSE_WORDS) if (take(new RegExp(`\\s${w}\\s`, "i"))) { out.type = "EXPENSE"; break; }
  take(/\s(for|on|at)\s/i);

  out.description = text.replace(/\s+/g, " ").trim();
  out.description = out.description.charAt(0).toUpperCase() + out.description.slice(1);

  const hit = categorize(out.description, rules);
  if (hit) {
    out.category = hit.category;
    out.categorySource = hit.source;
    if (!out.type) out.type = isIncomeCategory(hit.category) ? "INCOME" : "EXPENSE";
  }
  if (!out.type) out.type = "EXPENSE";
  if (!out.category || isIncomeCategory(out.category) !== (out.type === "INCOME")) {
    out.category = out.type === "INCOME" ? "other-income" : "other-expense";
    out.categorySource = null;
  }

  // Noon local time keeps the calendar day stable across timezones.
  out.date = new Date(out.date.getFullYear(), out.date.getMonth(), out.date.getDate(), 12);
  out.valid = Number.isFinite(out.amount) && out.amount > 0 && out.description.length > 0;
  return out;
}
