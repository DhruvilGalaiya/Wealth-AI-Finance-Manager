// Auto-categorize helpers shared by server code and the quick-add preview.

// Built-in hints used when no user rule matches. Lowercase substrings -> category id.
const KEYWORDS = [
  [["salary", "payroll", "paycheck", "wage"], "salary"],
  [["freelance", "invoice", "client"], "freelance"],
  [["dividend", "interest", "stock"], "investments"],
  [["rent", "mortgage"], "housing"],
  [["uber", "lyft", "taxi", "metro", "bus", "train", "fuel", "gas station", "petrol", "parking"], "transportation"],
  [["grocery", "groceries", "supermarket", "market", "whole foods", "trader joe", "aldi"], "groceries"],
  [["electric", "water bill", "internet", "wifi", "phone bill", "utility"], "utilities"],
  [["netflix", "spotify", "movie", "cinema", "concert", "game"], "entertainment"],
  [["coffee", "cafe", "lunch", "dinner", "breakfast", "restaurant", "pizza", "burger", "starbucks"], "food"],
  [["amazon", "clothes", "shoes", "mall", "shopping"], "shopping"],
  [["doctor", "pharmacy", "dentist", "hospital", "medicine"], "healthcare"],
  [["course", "tuition", "book", "school", "udemy"], "education"],
  [["haircut", "salon", "gym", "spa"], "personal"],
  [["flight", "hotel", "airbnb", "trip", "travel"], "travel"],
  [["insurance", "premium"], "insurance"],
  [["gift", "present", "donation"], "gifts"],
];

const INCOME_CATEGORIES = new Set(["salary", "freelance", "investments", "business", "rental", "other-income"]);

export const isIncomeCategory = (id) => INCOME_CATEGORIES.has(id);

// User rules win (longest match first), then the built-in hints.
export function categorize(description, rules = []) {
  const text = (description || "").toLowerCase();
  if (!text) return null;

  const userHit = [...rules]
    .sort((a, b) => b.match.length - a.match.length)
    .find((r) => r.match && text.includes(r.match.toLowerCase()));
  if (userHit) return { category: userHit.category, source: "rule", rule: userHit.match };

  for (const [words, category] of KEYWORDS) {
    const word = words.find((w) => text.includes(w));
    if (word) return { category, source: "hint", rule: word };
  }
  return null;
}
