"use client";

import { useState } from "react";
import { Check, Pencil, X, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard, Pill, EmptyState } from "@/components/app/section-card";
import { useMoney } from "@/components/providers/currency-provider";
import { updateBudget } from "@/actions/budget";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

const STATUS = {
  "on-track": { tone: "positive", label: "On track" },
  watch: { tone: "warning", label: "Spending fast" },
  "at-risk": { tone: "negative", label: "At risk" },
  over: { tone: "negative", label: "Over budget" },
};

const BAR = {
  "on-track": "bg-positive",
  watch: "bg-warning",
  "at-risk": "bg-negative",
  over: "bg-negative",
};

export function BudgetCard({ budget, spent, pacing, accountName }) {
  const money = useMoney();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(budget ? String(budget) : "");
  const { loading, fn } = useFetch(updateBudget);

  const save = async () => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a budget greater than 0");
      return;
    }
    const res = await fn(amount);
    if (res?.success) {
      toast.success("Budget updated");
      setEditing(false);
    }
  };

  const editor = (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9"
        placeholder="Monthly budget"
        autoFocus
        disabled={loading}
        aria-label="Monthly budget"
      />
      <Button type="submit" size="icon" disabled={loading} aria-label="Save budget">
        <Check />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => {
          setEditing(false);
          setValue(budget ? String(budget) : "");
        }}
        aria-label="Cancel"
      >
        <X />
      </Button>
    </form>
  );

  if (!budget) {
    return (
      <SectionCard title="Monthly budget" className="h-full">
        {editing ? (
          editor
        ) : (
          <EmptyState
            icon={Target}
            title="No budget yet"
            description="Set a monthly spending limit and we'll track your pace."
            action={<Button size="sm" onClick={() => setEditing(true)}>Set a budget</Button>}
          />
        )}
      </SectionCard>
    );
  }

  const status = STATUS[pacing.status];
  const used = Math.min(pacing.usedPct, 100);

  return (
    <SectionCard
      title="Monthly budget"
      description={accountName ? `Spending from ${accountName}` : undefined}
      action={
        !editing && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(true)} aria-label="Edit budget">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )
      }
      className="h-full"
    >
      {editing ? (
        editor
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-semibold tabular">{money(spent)}</p>
            <Pill tone={status.tone}>{status.label}</Pill>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">of {money(budget)} spent</p>

          <div className="relative mt-5">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(pacing.usedPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Budget used"
            >
              <div className={cn("h-full rounded-full transition-all", BAR[pacing.status])} style={{ width: `${used}%` }} />
            </div>
            {/* Where you'd be if spending evenly through the month */}
            <div
              className="absolute -top-1 w-0.5 rounded bg-foreground/60"
              style={{ left: `${pacing.expectedPct}%`, height: 18 }}
              title="Expected by today"
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{pacing.usedPct.toFixed(0)}% used</span>
            <span>Day {pacing.day} of {pacing.daysInMonth}</span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Left to spend</dt>
              <dd className="mt-0.5 font-medium tabular">{money(pacing.remaining)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Safe per day</dt>
              <dd className="mt-0.5 font-medium tabular">{money(pacing.safeDaily)}</dd>
            </div>
          </dl>
        </>
      )}
    </SectionCard>
  );
}
