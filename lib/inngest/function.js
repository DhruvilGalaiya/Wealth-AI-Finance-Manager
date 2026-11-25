import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/lib/email";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addMonths, startOfMonth } from "date-fns";
import { monthRange } from "@/lib/finance";
import { nextRecurringDate } from "@/lib/recurring";
import { formatMoney } from "@/lib/currency";

// 1. Recurring transactions -------------------------------------------------

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: { limit: 10, period: "1m", key: "event.data.userId" },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    const { transactionId, userId } = event?.data || {};
    if (!transactionId || !userId) return { error: "Missing required event data" };

    return step.run("process-transaction", async () => {
      const template = await db.transaction.findUnique({
        where: { id: transactionId, userId },
      });
      if (!template?.isRecurring || !template.nextRecurringDate) return { skipped: true };

      const now = new Date();
      let due = new Date(template.nextRecurringDate);
      let created = 0;

      // Catch up on every missed occurrence (e.g. if the job was down),
      // each dated on its real due date, then advance the schedule.
      await db.$transaction(async (tx) => {
        while (due <= now && created < 31) {
          await tx.transaction.create({
            data: {
              type: template.type,
              amount: template.amount,
              description: template.description,
              date: due,
              category: template.category,
              userId: template.userId,
              accountId: template.accountId,
              isRecurring: false,
            },
          });

          const amount = template.amount.toNumber();
          await tx.account.update({
            where: { id: template.accountId },
            data: { balance: { increment: template.type === "EXPENSE" ? -amount : amount } },
          });

          created++;
          due = nextRecurringDate(due, template.recurringInterval);
        }

        await tx.transaction.update({
          where: { id: template.id },
          data: { lastProcessed: now, nextRecurringDate: due },
        });
      });

      return { created };
    });
  }
);

export const triggerRecurringTransactions = inngest.createFunction(
  { id: "trigger-recurring-transactions", name: "Trigger Recurring Transactions" },
  { cron: "0 0 * * *" }, // daily at midnight
  async ({ step }) => {
    const due = await step.run("fetch-due-recurring-transactions", () =>
      db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          nextRecurringDate: { lte: new Date() },
        },
        select: { id: true, userId: true },
      })
    );

    if (due.length > 0) {
      await step.sendEvent(
        "fan-out-recurring",
        due.map((t) => ({
          name: "transaction.recurring.process",
          data: { transactionId: t.id, userId: t.userId },
        }))
      );
    }

    return { triggered: due.length };
  }
);

// 2. Monthly reports ----------------------------------------------------------

async function generateFinancialInsights(stats, month, currency) {
  const fallback = [
    "Your highest expense category this month might need attention.",
    "Consider setting up a budget for better financial management.",
    "Track your recurring expenses to identify potential savings.",
  ];
  if (!process.env.GEMINI_API_KEY) return fallback;

  const money = (n) => formatMoney(n, currency);
  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice. Keep it friendly.

    Financial data for ${month}:
    - Total income: ${money(stats.totalIncome)}
    - Total expenses: ${money(stats.totalExpenses)}
    - Net: ${money(stats.totalIncome - stats.totalExpenses)}
    - Expense categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ${money(amount)}`)
      .join(", ")}

    Respond with a JSON array of 3 strings.
  `;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
    const result = await model.generateContent(prompt);
    const insights = JSON.parse(result.response.text().replace(/```(?:json)?\n?/g, "").trim());
    return Array.isArray(insights) && insights.length ? insights.slice(0, 3) : fallback;
  } catch (error) {
    console.error("Error generating insights:", error);
    return fallback;
  }
}

export const generateMonthlyReports = inngest.createFunction(
  { id: "generate-monthly-reports", name: "Generate Monthly Reports" },
  // Cron reports on all users; the manual event (from the dashboard) passes a userId.
  [{ cron: "0 0 1 * *" }, { event: "report.generate" }],
  async ({ event, step }) => {
    const onlyUserId = event?.name === "report.generate" ? event.data?.userId : null;
    if (event?.name === "report.generate" && !onlyUserId) {
      return { error: "userId is required for manual reports" };
    }

    const users = await step.run("fetch-users", () =>
      db.user.findMany({
        where: onlyUserId ? { id: onlyUserId } : {},
        select: { id: true, email: true, name: true, currency: true },
      })
    );

    // Cron runs on the 1st => report last month. Manual => month so far.
    const reportMonth = onlyUserId ? new Date() : addMonths(startOfMonth(new Date()), -1);
    const monthName = reportMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const stats = await getMonthlyStats(user.id, reportMonth);
        const insights = await generateFinancialInsights(stats, monthName, user.currency);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: { stats, month: monthName, insights, currency: user.currency },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 3. Budget alerts ------------------------------------------------------------

export const checkBudgetAlerts = inngest.createFunction(
  { id: "check-budget-alerts", name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", () =>
      db.budget.findMany({
        include: {
          user: { include: { accounts: { where: { isDefault: true } } } },
        },
      })
    );

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue;

      await step.run(`check-budget-${budget.id}`, async () => {
        const { start, end } = monthRange();

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: { gte: start, lt: end },
          },
          _sum: { amount: true },
        });

        // step.run results are JSON-serialized, so Decimals arrive as strings.
        const totalExpenses = Number(expenses._sum.amount ?? 0);
        const budgetAmount = Number(budget.amount);
        if (budgetAmount <= 0) return;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        const alreadySentThisMonth =
          budget.lastAlertSent && new Date(budget.lastAlertSent) >= start;

        if (percentageUsed >= 80 && !alreadySentThisMonth) {
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount,
                totalExpenses,
                accountName: defaultAccount.name,
                currency: budget.user.currency,
              },
            }),
          });

          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

async function getMonthlyStats(userId, month) {
  const { start, end } = monthRange(month);

  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    { totalExpenses: 0, totalIncome: 0, byCategory: {}, transactionCount: transactions.length }
  );
}
