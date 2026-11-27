"use client";

import Link from "next/link";
import { PieChart } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/app/section-card";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { useMoney } from "@/components/providers/currency-provider";

export function SpendingCard({ categories, total }) {
  const money = useMoney();
  const top = categories.slice(0, 6);
  const rest = categories.slice(6);
  const rows = rest.length
    ? [...top, { category: "__other", amount: rest.reduce((s, c) => s + c.amount, 0), share: rest.reduce((s, c) => s + c.share, 0) }]
    : top;
  const max = rows[0]?.amount || 1;

  return (
    <SectionCard
      title="Spending by category"
      description={categories.length ? `${money(total)} this month` : undefined}
      action={
        <Link href="/transactions?type=EXPENSE" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      }
      className="h-full"
    >
      {rows.length === 0 ? (
        <EmptyState icon={PieChart} title="No spending yet this month" description="Expenses you add will be grouped here." />
      ) : (
        <ul className="space-y-3.5">
          {rows.map((row) => {
            const isOther = row.category === "__other";
            const name = isOther ? `${rest.length} other categories` : getCategory(row.category).name;
            return (
              <li key={row.category} className="flex items-center gap-3">
                {isOther ? (
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                    +{rest.length}
                  </span>
                ) : (
                  <CategoryIcon category={row.category} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{name}</span>
                    <span className="shrink-0 tabular">{money(row.amount)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(row.amount / max) * 100}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs text-muted-foreground tabular">{row.share.toFixed(0)}%</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
