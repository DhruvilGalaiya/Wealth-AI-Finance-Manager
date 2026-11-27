import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { db } from "./prisma";

// Ensures a DB user exists for the signed-in Clerk user. Cached per request.
export const checkUser = cache(async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const existing = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (existing) return existing;

    const email = user.emailAddresses?.[0]?.emailAddress;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      email?.split("@")[0] ||
      "there";

    return await db.user.upsert({
      where: { clerkUserId: user.id },
      update: {},
      create: { clerkUserId: user.id, name, imageUrl: user.imageUrl, email },
    });
  } catch (error) {
    console.error("checkUser failed:", error.message);
    return null;
  }
});
