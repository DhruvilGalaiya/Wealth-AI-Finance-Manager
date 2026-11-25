import "server-only";
import { db } from "@/lib/prisma";
import { serializeMany } from "@/lib/serialize";
import {
  averageMonthlyExpenses,
  budgetPacing,
  categoryBreakdown,
  monthTotals,
  runwayDays,
} from "@/lib/finance";

// Server-computed numbers about a user — never trust these from the client.
export async function getFinancialSnapshot(user) {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const [accounts, rawTransactions, budget] = await Promise.all([
    db.account.findMany({ where: { userId: user.id } }),
    db.transaction.findMany({
      where: { userId: user.id, date: { gte: since } },
      orderBy: { date: "desc" },
    }),
    db.budget.findUnique({ where: { userId: user.id } }),
  ]);

  const transactions = serializeMany(rawTransactions);
  const totalCash = accounts.reduce((s, a) => s + a.balance.toNumber(), 0);
  const month = monthTotals(transactions);
  const avgMonthly = averageMonthlyExpenses(transactions);
  const budgetAmount = budget ? budget.amount.toNumber() : 0;

  return {
    currency: user.currency || "USD",
    totalCash,
    accountCount: accounts.length,
    month,
    averageMonthlyExpenses: avgMonthly,
    runwayDays: runwayDays(totalCash, avgMonthly),
    budget: budgetAmount,
    pacing: budgetAmount > 0 ? budgetPacing(month.expenses, budgetAmount) : null,
    topCategories: categoryBreakdown(transactions).slice(0, 5),
    transactions,
  };
}
