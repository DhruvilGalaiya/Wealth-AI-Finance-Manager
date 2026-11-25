"use client";

import { useMemo, useState } from "react";
import { format, startOfDay, startOfMonth, startOfWeek, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionCard } from "@/components/app/section-card";
import { useMoney } from "@/components/providers/currency-provider";
import { cn } from "@/lib/utils";

const RANGES = {
  "1M": { label: "1M", days: 30, bucket: "day" },
  "3M": { label: "3M", days: 90, bucket: "week" },
  "6M": { label: "6M", days: 180, bucket: "week" },
  "1Y": { label: "1Y", days: 365, bucket: "month" },
};

const bucketStart = {
  day: (d) => startOfDay(d),
  week: (d) => startOfWeek(d, { weekStartsOn: 1 }),
  month: (d) => startOfMonth(d),
};
const bucketLabel = { day: "MMM d", week: "MMM d", month: "MMM" };

export function AccountChart({ transactions }) {
  const money = useMoney();
  const [range, setRange] = useState("1M");

  const { data, totals } = useMemo(() => {
    const { days, bucket } = RANGES[range];
    const since = startOfDay(subDays(new Date(), days));
    const map = new Map();
    const totals = { income: 0, expenses: 0 };

    for (const t of transactions) {
      const d = new Date(t.date);
      if (d < since) continue;
      const key = bucketStart[bucket](d).getTime();
      const row = map.get(key) || { ts: key, income: 0, expenses: 0 };
      if (t.type === "INCOME") {
        row.income += t.amount;
        totals.income += t.amount;
      } else {
        row.expenses += t.amount;
        totals.expenses += t.amount;
      }
      map.set(key, row);
    }

    const data = [...map.values()]
      .sort((a, b) => a.ts - b.ts)
      .map((r) => ({ ...r, label: format(new Date(r.ts), bucketLabel[bucket]) }));
    return { data, totals };
  }, [transactions, range]);

  const net = totals.income - totals.expenses;

  return (
    <SectionCard
      title="Cash flow"
      action={
        <div className="inline-flex rounded-lg border bg-muted/50 p-0.5" role="tablist" aria-label="Date range">
          {Object.entries(RANGES).map(([key, r]) => (
            <button
              key={key}
              role="tab"
              aria-selected={range === key}
              onClick={() => setRange(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <dl className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-chart-income" /> Income
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular">{money(totals.income)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-chart-expense" /> Spending
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular">{money(totals.expenses)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Net</dt>
          <dd className={cn("mt-1 text-lg font-semibold tabular", net < 0 && "text-negative")}>{money(net)}</dd>
        </div>
      </dl>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No transactions in this period.</p>
      ) : (
        <div className="h-64" role="img" aria-label="Income and spending over time">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => money(v, { compact: true })} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }}
                formatter={(v, name) => [money(v), name]}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
              />
              <Bar dataKey="income" name="Income" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expenses" name="Spending" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
