import "server-only";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

// Token-bucket limit per Clerk user for write-heavy actions.
export async function enforceRateLimit(clerkUserId) {
  if (!process.env.ARCJET_KEY) return; // not configured (local dev)

  const req = await request();
  const decision = await aj.protect(req, { userId: clerkUserId, requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error("Request blocked");
  }
}
