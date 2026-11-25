"use server";

import { startOfMonth, addMonths, format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { callModel } from "@/lib/ml-api";
import { getFinancialSnapshot } from "@/lib/financial-snapshot";
import { budgetPacing, isExpense, isIncome, runwayDays, sumAmounts } from "@/lib/finance";
import { defaultCategories } from "@/data/categories";

const categoryName = (id) => defaultCategories.find((c) => c.id === id)?.name || id;

const PERSONA_GROUPS = {
  housing: ["housing", "utilities", "bills", "insurance"],
  food: ["food", "groceries"],
  entertainment: ["entertainment", "shopping", "travel", "personal", "gifts"],
};

const PERSONAS = {
  0: { name: "Super Saver", tone: "positive", trait: "You save a large share of your income and keep lifestyle spending low." },
  1: { name: "Lifestyle Spender", tone: "warning", trait: "Dining, shopping and fun take a big share — great to enjoy, but it slows your savings." },
  2: { name: "Housing-Heavy", tone: "negative", trait: "Rent and fixed bills take most of your income, leaving little flexible cash." },
  3: { name: "Balanced Budgeter", tone: "neutral", trait: "You keep a healthy balance between essentials, fun and saving." },
};

function lastMonths(n) {
  const thisMonth = startOfMonth(new Date());
  return Array.from({ length: n }, (_, i) => addMonths(thisMonth, -(n - 1 - i)));
}

// Spending persona from the last 3 months, as % of income.
export async function getSpendingPersona() {
  const user = await requireUser();
  const { transactions } = await getFinancialSnapshot(user);

  const since = addMonths(startOfMonth(new Date()), -2);
  const recent = transactions.filter((t) => new Date(t.date) >= since);
  const income = sumAmounts(recent.filter(isIncome));
  const expenses = recent.filter(isExpense);

  if (income <= 0 || expenses.length < 5) {
    return { status: "insufficient-data" };
  }

  const pct = (cats) =>
    (sumAmounts(expenses.filter((t) => cats.includes(t.category))) / income) * 100;

  const features = {
    housing_pct: pct(PERSONA_GROUPS.housing),
    food_pct: pct(PERSONA_GROUPS.food),
    entertainment_pct: pct(PERSONA_GROUPS.entertainment),
    savings_pct: Math.max(0, ((income - sumAmounts(expenses)) / income) * 100),
  };

  const result = await callModel("/analyze_persona", features);
  const persona = PERSONAS[result?.cluster];
  if (!persona) return { status: "offline", features };

  return { status: "ok", ...persona, features };
}

// LSTM forecast for the user's fixed/recurring cost categories.
export async function getRecurringForecast() {
  const user = await requireUser();
  const { transactions } = await getFinancialSnapshot(user);

  // The LSTM expects exactly 5 points: the 5 complete months before this one.
  const months = lastMonths(6).slice(0, 5);
  const recurringCats = new Set(
    transactions.filter((t) => isExpense(t) && t.isRecurring).map((t) => t.category)
  );
  const candidates = recurringCats.size
    ? [...recurringCats]
    : ["housing", "utilities", "bills", "insurance", "education"];

  const series = candidates
    .map((category) => {
      const history = months.map((m) => {
        const end = addMonths(m, 1);
        return sumAmounts(
          transactions.filter(
            (t) => isExpense(t) && t.category === category && new Date(t.date) >= m && new Date(t.date) < end
          )
        );
      });
      return { category, history };
    })
    .filter((s) => s.history.filter((v) => v > 0).length >= 3)
    .slice(0, 4);

  if (series.length === 0) return { status: "insufficient-data", items: [] };

  const result = await callModel("/predict_subscriptions", {
    subscriptions: series.map((s) => ({ name: s.category, history: s.history })),
  });

  const items = series.map((s, i) => {
    const p = result?.predictions?.[i];
    const current = s.history[s.history.length - 1];
    return {
      category: s.category,
      name: categoryName(s.category),
      current,
      predicted: p?.predicted_next ?? null,
      status: p?.status ?? null,
      months: months.map((m) => format(m, "MMM")),
      history: s.history,
    };
  });

  return { status: result ? "ok" : "offline", items };
}

const ACTION_LABELS = {
  "Spend Normal": { verdict: "Looks fine", tone: "positive", text: "This fits within your budget pace and keeps a healthy safety net." },
  Save: { verdict: "Think twice", tone: "warning", text: "This stretches your budget for the month. Consider waiting or trimming elsewhere." },
  "Defer Purchases": { verdict: "Better to wait", tone: "negative", text: "This would push you well past your budget pace and shrink your safety net." },
};

// What-if: how would a purchase of `amount` change this month?
export async function evaluatePurchase(amount) {
  const user = await requireUser();
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0 || value > 1e9) {
    return { status: "invalid" };
  }

  const s = await getFinancialSnapshot(user);
  const budget = s.budget;
  const before = budget > 0 ? budgetPacing(s.month.expenses, budget) : null;
  const after = budget > 0 ? budgetPacing(s.month.expenses + value, budget) : null;
  const runwayBefore = s.runwayDays;
  const runwayAfter = runwayDays(Math.max(0, s.totalCash - value), s.averageMonthlyExpenses);

  const model = before
    ? await callModel("/predict_action", {
        current_day: before.day,
        actual_pacing: after.usedPct,
        expected_pacing: after.expectedPct,
        runway: runwayAfter ?? 999,
      })
    : null;

  // Rule-based fallback mirrors the model's three actions.
  let action = model?.action;
  let source = "model";
  if (!ACTION_LABELS[action]) {
    source = "rules";
    if (value > s.totalCash) action = "Defer Purchases";
    else if (after && (after.status === "over" || after.status === "at-risk")) action = "Defer Purchases";
    else if (after?.status === "watch" || (runwayAfter != null && runwayAfter < 90)) action = "Save";
    else action = "Spend Normal";
  }

  return {
    status: "ok",
    source,
    ...ACTION_LABELS[action],
    budget,
    before: before && { usedPct: before.usedPct, status: before.status },
    after: after && { usedPct: after.usedPct, status: after.status },
    runwayBefore,
    runwayAfter,
    cashAfter: s.totalCash - value,
  };
}
