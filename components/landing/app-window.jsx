"use client";

import { useState } from "react";
import { LayoutDashboard, Landmark, ArrowLeftRight, Settings, Search, Repeat, Pencil } from "lucide-react";
import { SAMPLE_TX, CategoryIconBubble, usd } from "./ui-bits";
import { cn } from "@/lib/utils";

export function AppWindow() {
  const [selected, setSelected] = useState(SAMPLE_TX[0].id);
  const tx = SAMPLE_TX.find((t) => t.id === selected);

  return (
    <div className="frame overflow-hidden rounded-2xl border bg-card shadow-[0_24px_64px_-32px_hsl(var(--foreground)/.25)]" data-ui>
      <div className="flex items-center gap-1.5 border-b px-4 py-3" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="ml-3 text-xs text-muted-foreground">Transactions</span>
      </div>
      <div className="grid md:grid-cols-[180px_1fr_300px]">
        {/* Sidebar */}
        <nav className="hidden border-r bg-sidebar p-3 text-[13px] md:block" aria-hidden>
          {[
            [LayoutDashboard, "Dashboard"],
            [Landmark, "Accounts"],
            [ArrowLeftRight, "Transactions", true],
            [Settings, "Settings"],
          ].map(([Icon, label, active]) => (
            <div key={label} className={cn("mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2", active ? "bg-card font-medium shadow-sm ring-1 ring-border" : "text-muted-foreground")}>
              <Icon className={cn("h-4 w-4", active && "text-primary")} /> {label}
            </div>
          ))}
        </nav>

        {/* List */}
        <div className="min-w-0 border-r">
          <div className="border-b p-3">
            <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-[13px] text-muted-foreground">
              <Search className="h-4 w-4" /> Search description, category or amount
            </div>
          </div>
          <ul role="listbox" aria-label="Sample transactions">
            {SAMPLE_TX.map((t) => (
              <li key={t.id}>
                <button
                  role="option"
                  aria-selected={t.id === selected}
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    "flex min-h-[52px] w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors",
                    t.id === selected ? "bg-primary/[.06]" : "hover:bg-accent/60"
                  )}
                >
                  <CategoryIconBubble icon={t.icon} color={t.color} size="h-8 w-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{t.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {t.cat} · {t.date} {t.repeats && <Repeat className="h-3 w-3" />}
                    </span>
                  </span>
                  <span className={cn("text-[13px] font-medium tabular", t.amount > 0 && "text-positive")}>{usd(t.amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        <div className="hidden p-5 md:block" aria-live="polite">
          <div className="flex items-center gap-3">
            <CategoryIconBubble icon={tx.icon} color={tx.color} size="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">{tx.name}</p>
              <p className="text-xs text-muted-foreground">{tx.date}, 2026</p>
            </div>
          </div>
          <p className={cn("mt-5 text-3xl font-semibold tracking-tight tabular", tx.amount > 0 && "text-positive")}>{usd(tx.amount)}</p>
          <dl className="mt-5 divide-y rounded-xl border text-[13px]">
            {[
              ["Category", tx.cat],
              ["Account", tx.account],
              ["Repeats", tx.repeats || "One-time"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px]" aria-hidden>
            <Pencil className="h-3.5 w-3.5" /> Edit transaction
          </div>
        </div>
      </div>
    </div>
  );
}
