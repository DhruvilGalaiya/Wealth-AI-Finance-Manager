// Prisma returns Decimal objects for money columns. Client components and
// server actions can only pass plain JSON, so convert them to numbers.
const toNumber = (value) =>
  value != null && typeof value === "object" && "toNumber" in value
    ? value.toNumber()
    : value;

export function serialize(record) {
  if (!record) return record;
  const out = { ...record };
  if ("balance" in out) out.balance = toNumber(out.balance);
  if ("amount" in out) out.amount = toNumber(out.amount);
  if (out.account) out.account = serialize(out.account);
  return out;
}

export const serializeMany = (records = []) => records.map(serialize);
