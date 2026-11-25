"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { serializeMany } from "@/lib/serialize";

const serializeGoal = (g) => ({ ...g, target: g.target.toNumber(), saved: g.saved.toNumber() });

export async function getGoals() {
  const user = await requireUser();
  const goals = await db.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  return goals.map(serializeGoal);
}

export async function createGoal({ name, target, deadline }) {
  try {
    const user = await requireUser();
    const title = String(name || "").trim();
    const amount = Number(target);
    if (!title || title.length > 60) throw new Error("Give the goal a name (up to 60 characters)");
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) throw new Error("Enter a target amount");
    const due = deadline ? new Date(deadline) : null;
    if (due && (Number.isNaN(due.getTime()) || due < new Date())) throw new Error("Pick a date in the future");

    const goal = await db.goal.create({ data: { name: title, target: amount, deadline: due, userId: user.id } });
    revalidatePath("/plan");
    revalidatePath("/dashboard");
    return { success: true, data: serializeGoal(goal) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add (or with a negative amount, take out) money from a goal.
export async function contributeToGoal(id, amount) {
  try {
    const user = await requireUser();
    const value = Number(amount);
    if (!Number.isFinite(value) || value === 0 || Math.abs(value) > 1e9) throw new Error("Enter an amount");

    const goal = await db.goal.findUnique({ where: { id, userId: user.id } });
    if (!goal) throw new Error("Goal not found");
    const saved = Math.max(0, goal.saved.toNumber() + value);

    const updated = await db.goal.update({ where: { id }, data: { saved } });
    revalidatePath("/plan");
    revalidatePath("/dashboard");
    return { success: true, data: serializeGoal(updated) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteGoal(id) {
  try {
    const user = await requireUser();
    await db.goal.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/plan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRecurringTemplates() {
  const user = await requireUser();
  const templates = await db.transaction.findMany({
    where: { userId: user.id, isRecurring: true, nextRecurringDate: { not: null } },
    orderBy: { nextRecurringDate: "asc" },
  });
  return serializeMany(templates);
}
