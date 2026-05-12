"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function askCopilot(message, contextData) {
  try {
    // Connect to Gemini using your free API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // We updated the persona to be a friendly, human coach and banned jargon.
    const systemPrompt = `
      You are a friendly, empathetic, and financially savvy money coach. You talk to the user like a supportive friend, not a strict banker.
      
      Here is their current financial snapshot:
      - Total Cash Available: $${contextData.assets}
      - Safety Net (Days they can survive without income): ${contextData.runwayDays} days
      - Monthly Budget Limit: $${contextData.budget}
      - Spent This Month: $${contextData.spent}

      The user asks: "${message}"

      Rules for your response:
      1. Speak like a real, supportive human. Be conversational, warm, and real.
      2. NEVER use robotic financial jargon like "liquid assets," "liquidity runway," "advisable," or "deplete." Instead, use everyday words like "total cash," "safety net," "good idea," or "drain your savings."
      3. Give practical, reality-based advice using their exact numbers, but frame it gently and realistically.
      4. Keep it short (2 to 3 sentences maximum).
      5. Use an emoji or two to make the text feel more human and alive.
    `;

    const result = await model.generateContent(systemPrompt);
    return result.response.text();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Oops! I'm having a little trouble connecting right now. Give me a second and try again! 😅";
  }
}