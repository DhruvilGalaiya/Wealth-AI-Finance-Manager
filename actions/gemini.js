"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireUser } from "@/lib/auth";
import { getFinancialSnapshot } from "@/lib/financial-snapshot";
import { formatMoney } from "@/lib/currency";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 6;

export async function askCopilot(message, history = []) {
  const user = await requireUser();

  const question = String(message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!question) return { success: false, error: "Please type a question." };
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "The AI assistant isn't configured yet." };
  }

  try {
    const s = await getFinancialSnapshot(user);
    const money = (n) => formatMoney(n, s.currency);

    const context = [
      `Total cash across ${s.accountCount} account(s): ${money(s.totalCash)}`,
      `This month — income: ${money(s.month.income)}, spending: ${money(s.month.expenses)}`,
      `Typical monthly spending (last 3 months): ${money(s.averageMonthlyExpenses)}`,
      s.runwayDays != null
        ? `Safety net: about ${s.runwayDays} days of spending covered by current cash`
        : "Safety net: not enough spending history yet",
      s.budget > 0
        ? `Monthly budget: ${money(s.budget)} (${s.pacing.usedPct.toFixed(0)}% used, day ${s.pacing.day} of ${s.pacing.daysInMonth})`
        : "No monthly budget set",
      s.topCategories.length
        ? `Top spending categories this month: ${s.topCategories
            .map((c) => `${c.category} ${money(c.amount)}`)
            .join(", ")}`
        : "No spending recorded this month",
    ].join("\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are Welth's friendly money coach. Speak plainly and warmly, like a supportive friend.
Avoid jargon (say "cash", "safety net", "savings" instead of "liquidity" or "runway").
Use the user's real numbers below, formatted in ${s.currency}. Keep answers to 2–4 short sentences.
Only answer personal-finance questions; politely decline anything else. You are not a licensed advisor.

User's financial snapshot:
${context}`,
    });

    const turns = (Array.isArray(history) ? history : [])
      .slice(-MAX_HISTORY)
      .filter((m) => m && typeof m.text === "string")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text.slice(0, 1000) }],
      }));
    // Gemini requires the history to start with a user turn.
    while (turns.length && turns[0].role !== "user") turns.shift();

    const chat = model.startChat({ history: turns });

    const result = await chat.sendMessage(question);
    return { success: true, text: result.response.text() };
  } catch (error) {
    console.error("Gemini error:", error);
    return { success: false, error: "I'm having trouble connecting right now. Please try again." };
  }
}
