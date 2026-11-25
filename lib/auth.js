import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Resolve the signed-in Clerk user to our database user, or throw.
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return user;
}
