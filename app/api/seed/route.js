import { seedTransactions } from "@/actions/seed";

// Development helper: replaces the signed-in user's default account
// transactions with demo data. Disabled in production.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  try {
    return Response.json(await seedTransactions());
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 401 });
  }
}
