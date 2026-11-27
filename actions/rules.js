"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { categorize } from "@/lib/rules";
import { defaultCategories } from "@/data/categories";

const CATEGORY_IDS = new Set(defaultCategories.map((c) => c.id));

export async function getRules() {
  const user = await requireUser();
  return db.rule.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
}

export async function createRule({ match, category }) {
  try {
    const user = await requireUser();
    const text = String(match || "").trim().toLowerCase();
    if (text.length < 2 || text.length > 60) throw new Error("Use 2 to 60 characters for the text to match");
    if (!CATEGORY_IDS.has(category)) throw new Error("Choose a category");

    const count = await db.rule.count({ where: { userId: user.id } });
    if (count >= 100) throw new Error("You can have up to 100 rules");

    const rule = await db.rule.create({ data: { match: text, category, userId: user.id } });
    revalidatePath("/settings");
    return { success: true, data: rule };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteRule(id) {
  try {
    const user = await requireUser();
    await db.rule.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Re-categorize past "Other" transactions using the user's rules (only rules, never hints).
export async function applyRulesToPast() {
  try {
    const user = await requireUser();
    const rules = await db.rule.findMany({ where: { userId: user.id } });
    if (!rules.length) return { success: true, updated: 0 };

    const candidates = await db.transaction.findMany({
      where: { userId: user.id, category: { in: ["other-expense", "other-income"] } },
      select: { id: true, description: true, type: true },
    });

    let updated = 0;
    for (const t of candidates) {
      const hit = categorize(t.description, rules);
      if (hit?.source === "rule") {
        await db.transaction.update({ where: { id: t.id }, data: { category: hit.category } });
        updated++;
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true, updated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
