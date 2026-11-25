"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { SectionCard, Pill } from "@/components/app/section-card";
import { Input } from "@/components/ui/input";
import { useCurrency, useMoney } from "@/components/providers/currency-provider";
import { CURRENCIES } from "@/lib/currency";
import { evaluatePurchase } from "@/actions/insights";

const STATUS_LABEL = { "on-track": "On track", watch: "Spending fast", "at-risk": "At risk", over: "Over budget" };

export function WhatIfAgent() {
  const money = useMoney();
  const currency = useCurrency();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  // Debounce so we don't call the model on every keystroke.
  useEffect(() => {
    const amount = Number(input);
    if (!input || !Number.isFinite(amount) || amount <= 0) {
      setResult(null);
      return;
    }
    const id = setTimeout(() => {
      startTransition(async () => setResult(await evaluatePurchase(amount)));
    }, 450);
    return () => clearTimeout(id);
  }, [input]);

  const ok = result?.status === "ok";

  return (
    <SectionCard
      title="Can I afford it?"
      description="See how a purchase would affect your budget and safety net."
      className="h-full"
    >
      <label className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {CURRENCIES[currency]?.symbol}
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Enter an amount, e.g. 500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="pl-7"
          aria-label="Purchase amount"
        />
      </label>

      <div className="mt-4 min-h-[148px]" aria-live="polite">
        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </p>
        )}
        {!pending && !ok && (
          <p className="text-sm text-muted-foreground">
            Type an amount to see its impact before you buy.
          </p>
        )}
        {!pending && ok && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill tone={result.tone}>{result.verdict}</Pill>
              {result.source === "model" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> AI model
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{result.text}</p>
            <dl className="divide-y rounded-lg border text-sm">
              {result.before && (
                <div className="flex items-center justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Budget used</dt>
                  <dd className="flex items-center gap-1.5 tabular">
                    {result.before.usedPct.toFixed(0)}%
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{result.after.usedPct.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">({STATUS_LABEL[result.after.status]})</span>
                  </dd>
                </div>
              )}
              {result.runwayBefore != null && (
                <div className="flex items-center justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Safety net</dt>
                  <dd className="flex items-center gap-1.5 tabular">
                    {result.runwayBefore}d
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{result.runwayAfter}d</span>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between px-3 py-2">
                <dt className="text-muted-foreground">Cash after</dt>
                <dd className="font-medium tabular">{money(result.cashAfter)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
