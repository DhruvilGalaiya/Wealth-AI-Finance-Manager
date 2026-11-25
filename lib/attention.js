// "Needs attention": a short list of things worth acting on, computed from data the
// dashboard already has. Each item has a severity, a sentence and one action.
import { differenceInCalendarDays, format } from "date-fns";
import { goalPlan } from "./forecast.js";

export function buildAttention({ pacing, budget, upcoming = [], projection, anomalies = [], uncategorized = 0, goals = [], money }) {
  const items = [];
  const now = new Date();

  if (pacing && budget > 0) {
    if (pacing.status === "over") {
      items.push({ id: "budget-over", tone: "negative", title: "You're over budget", text: `${money(pacing.usedPct > 100 ? (pacing.usedPct / 100) * budget - budget : 0)} past your monthly limit.`, href: "/insights", action: "See spending" });
    } else if (pacing.status === "at-risk" || pacing.status === "watch") {
      items.push({ id: "budget-fast", tone: "warning", title: "Spending is running fast", text: `${pacing.usedPct.toFixed(0)}% of the budget used on day ${pacing.day}. Keep to ${money(pacing.safeDaily)} a day.`, href: "/insights", action: "See spending" });
    }
  }

  const soon = upcoming.filter((o) => o.type === "EXPENSE" && differenceInCalendarDays(new Date(o.date), now) <= 3);
  if (soon.length) {
    const total = soon.reduce((s, o) => s + o.amount, 0);
    const first = soon[0];
    items.push({
      id: "bills-soon",
      tone: "neutral",
      title: soon.length === 1 ? `${first.description || "A bill"} is due ${format(new Date(first.date), "EEE, MMM d")}` : `${soon.length} bills due in the next 3 days`,
      text: `${money(total)} scheduled.`,
      href: "/plan",
      action: "View upcoming",
    });
  }

  if (projection && projection.low.balance < 0) {
    items.push({ id: "low-balance", tone: "negative", title: "Balance could go negative", text: `Scheduled bills take you to ${money(projection.low.balance)} on ${format(new Date(projection.low.date), "MMM d")}.`, href: "/plan", action: "View forecast" });
  }

  const recentOdd = anomalies.filter((t) => differenceInCalendarDays(now, new Date(t.date)) <= 7);
  if (recentOdd.length) {
    const t = recentOdd[0];
    items.push({ id: `odd-${t.id}`, tone: "warning", title: "Unusual purchase this week", text: `${t.description || "A purchase"} for ${money(t.amount)} is well above your normal.`, href: `/transaction/create?edit=${t.id}`, action: "Review it" });
  }

  if (uncategorized > 0) {
    items.push({ id: "uncategorized", tone: "neutral", title: `${uncategorized} transaction${uncategorized === 1 ? "" : "s"} marked "Other"`, text: "Add a rule once and future ones sort themselves.", href: "/settings#rules", action: "Create a rule" });
  }

  for (const g of goals) {
    const plan = goalPlan(g, now);
    if (plan.status === "behind" || plan.status === "overdue") {
      items.push({ id: `goal-${g.id}`, tone: "warning", title: `${g.name} is behind`, text: plan.monthly ? `Save ${money(plan.monthly)} a month to reach it on time.` : "The deadline has passed.", href: "/plan#goals", action: "Update goal" });
      break;
    }
  }

  const order = { negative: 0, warning: 1, neutral: 2 };
  return items.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 4);
}
