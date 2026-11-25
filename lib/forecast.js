// Upcoming scheduled transactions and the projected balance they produce.
import { addDays, startOfDay, differenceInCalendarMonths } from "date-fns";
import { nextRecurringDate } from "./recurring.js";

// Every occurrence of each recurring template within the next `days` days.
export function upcomingOccurrences(templates = [], days = 30, now = new Date()) {
  const start = startOfDay(now);
  const end = addDays(start, days);
  const out = [];
  for (const t of templates) {
    if (!t.isRecurring || !t.nextRecurringDate || !t.recurringInterval) continue;
    let d = new Date(t.nextRecurringDate);
    let guard = 0;
    while (d < start && guard++ < 400) d = nextRecurringDate(d, t.recurringInterval);
    while (d <= end && guard++ < 400) {
      out.push({
        id: `${t.id}-${d.getTime()}`,
        templateId: t.id,
        date: d.toISOString(),
        description: t.description,
        category: t.category,
        type: t.type,
        amount: Number(t.amount),
        accountId: t.accountId,
        interval: t.recurringInterval,
      });
      d = nextRecurringDate(d, t.recurringInterval);
    }
  }
  return out.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Day-by-day projected total balance from scheduled items only.
export function projectBalance(startBalance, occurrences, days = 30, now = new Date()) {
  const start = startOfDay(now);
  const byDay = new Map();
  for (const o of occurrences) {
    const key = startOfDay(new Date(o.date)).getTime();
    byDay.set(key, (byDay.get(key) || 0) + (o.type === "INCOME" ? o.amount : -o.amount));
  }
  const points = [];
  let balance = startBalance;
  let low = { balance: startBalance, date: start.toISOString() };
  for (let i = 0; i <= days; i++) {
    const d = addDays(start, i);
    balance += byDay.get(d.getTime()) || 0;
    points.push({ date: d.toISOString(), balance });
    if (balance < low.balance) low = { balance, date: d.toISOString() };
  }
  return { points, low, end: balance };
}

// What a goal needs per month to land on its deadline.
export function goalPlan(goal, now = new Date()) {
  const target = Number(goal.target);
  const saved = Number(goal.saved);
  const remaining = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  if (!goal.deadline) return { remaining, pct, monthly: null, monthsLeft: null, status: remaining === 0 ? "done" : "open" };

  const deadline = new Date(goal.deadline);
  const monthsLeft = Math.max(0, differenceInCalendarMonths(deadline, now));
  const monthly = remaining === 0 ? 0 : remaining / Math.max(1, monthsLeft);

  // Expected progress if saving evenly from creation to deadline
  const created = new Date(goal.createdAt || now);
  const span = deadline - created;
  const expectedPct = span > 0 ? Math.min(100, ((now - created) / span) * 100) : 100;
  let status = "on-track";
  if (remaining === 0) status = "done";
  else if (deadline < now) status = "overdue";
  else if (pct + 10 < expectedPct) status = "behind";

  return { remaining, pct, monthly, monthsLeft, expectedPct, status };
}
