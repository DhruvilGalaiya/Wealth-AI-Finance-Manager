"use client";

import { useMoney } from "@/components/providers/currency-provider";
import { cn } from "@/lib/utils";

// Formats an amount in the user's currency. `signed` shows +/− and colors it.
export function Money({ amount, signed = false, type, compact, className }) {
  const money = useMoney();
  const value = Number(amount) || 0;
  const direction = type ? (type === "INCOME" ? 1 : -1) : Math.sign(value);
  const abs = Math.abs(value);

  if (!signed) {
    return <span className={cn("tabular", className)}>{money(value, { compact })}</span>;
  }

  return (
    <span
      className={cn(
        "tabular",
        direction > 0 ? "text-positive" : direction < 0 ? "text-foreground" : "",
        className
      )}
    >
      {direction > 0 ? "+" : direction < 0 ? "−" : ""}
      {money(abs, { compact })}
    </span>
  );
}
