// Pure finance helpers shared by server and client code.
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  getDaysInMonth,
  differenceInCalendarDays,
} from "date-fns";

export function monthRange(date = new Date()) {
  const start = startOfMonth(date);
  return { start, end: addMonths(start, 1) }; // end is exclusive
}

export const isExpense = (t) => t.type === "EXPENSE";
export const isIncome = (t) => t.type === "INCOME";

export function inMonth(t, date = new Date()) {
  const { start, end } = monthRange(date);
  const d = new Date(t.date);
  return d >= start && d < end;
}

export const sumAmounts = (txs) => txs.reduce((s, t) => s + Number(t.amount || 0), 0);

export function monthTotals(transactions = [], date = new Date()) {
  const month = transactions.filter((t) => inMonth(t, date));
  const income = sumAmounts(month.filter(isIncome));
  const expenses = sumAmounts(month.filter(isExpense));
  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  return { income, expenses, net, savingsRate, count: month.length };
}

export function categoryBreakdown(transactions = [], date = new Date()) {
  const totals = {};
  for (const t of transactions) {
    if (!isExpense(t) || !inMonth(t, date)) continue;
    totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
  }
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
      share: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Where the month "should" be: day 10 of 30 => 33% of budget used.
export function budgetPacing(spent, budget, date = new Date()) {
  const daysInMonth = getDaysInMonth(date);
  const day = date.getDate();
  const daysRemaining = daysInMonth - day + 1; // include today
  const expectedPct = (day / daysInMonth) * 100;
  const usedPct = budget > 0 ? (spent / budget) * 100 : 0;
  const delta = usedPct - expectedPct;

  let status = "on-track";
  if (budget > 0 && spent > budget) status = "over";
  else if (delta >= 15) status = "at-risk";
  else if (delta >= 5) status = "watch";

  const dailyAverage = day > 0 ? spent / day : 0;
  const projected = dailyAverage * daysInMonth;
  const remaining = Math.max(0, budget - spent);
  const safeDaily = daysRemaining > 0 ? remaining / daysRemaining : 0;

  return {
    day,
    daysInMonth,
    daysRemaining,
    expectedPct,
    usedPct,
    delta,
    status,
    dailyAverage,
    projected,
    projectedDelta: budget - projected,
    remaining,
    safeDaily,
  };
}

// Average monthly spend across the last `months` complete-or-current months.
export function averageMonthlyExpenses(transactions = [], months = 3, date = new Date()) {
  const start = startOfMonth(addMonths(date, -(months - 1)));
  const expenses = transactions.filter(
    (t) => isExpense(t) && new Date(t.date) >= start && new Date(t.date) <= endOfMonth(date)
  );
  const spanDays = Math.max(1, differenceInCalendarDays(date, start) + 1);
  return (sumAmounts(expenses) / spanDays) * 30;
}

// How many days current cash lasts at the user's typical spend rate.
export function runwayDays(totalCash, monthlyExpenses) {
  if (monthlyExpenses <= 0) return null; // no spending history => unknown
  return Math.max(0, Math.round((totalCash / monthlyExpenses) * 30));
}

// Z-score outliers on the last 90 days of expenses (only unusually high ones).
export function detectAnomalies(transactions = [], { threshold = 2, days = 90 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const expenses = transactions.filter((t) => isExpense(t) && new Date(t.date) >= since);
  if (expenses.length < 5) return [];

  const amounts = expenses.map((t) => Number(t.amount));
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const sd = Math.sqrt(amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length);
  if (sd === 0) return [];

  return expenses
    .map((t) => ({ ...t, zScore: (Number(t.amount) - mean) / sd }))
    .filter((t) => t.zScore > threshold)
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, 5);
}

// Daily running balance over the last `days` days, ending at current total.
export function balanceHistory(transactions = [], currentTotal = 0, days = 90) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deltas = new Map();
  for (const t of transactions) {
    const d = new Date(t.date);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    const change = isIncome(t) ? Number(t.amount) : -Number(t.amount);
    deltas.set(key, (deltas.get(key) || 0) + change);
  }

  const points = [];
  let balance = currentTotal;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    points.push({ date: d.toISOString(), balance });
    balance -= deltas.get(d.getTime()) || 0; // walk backwards
  }
  return points.reverse();
}
