"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CornerDownLeft, Loader2, Repeat, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { useMoney } from "@/components/providers/currency-provider";
import { parseQuickAdd } from "@/lib/quick-add";
import { quickAddTransaction } from "@/actions/transaction";
import { cn } from "@/lib/utils";

const EXAMPLES = ["coffee 4.50", "groceries 62.30 yesterday", "salary 5200", "rent 1450 monthly on 3rd"];
const INTERVAL = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };

export function useQuickAddShortcut(setOpen) {
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

export function QuickAddDialog({ open, onOpenChange, rules = [] }) {
  const router = useRouter();
  const money = useMoney();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text, { rules }) : null), [text, rules]);

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  const save = async () => {
    if (!parsed?.valid || saving) return;
    setSaving(true);
    const res = await quickAddTransaction(text);
    setSaving(false);
    if (res.success) {
      toast.success(`Added ${parsed.description} · ${money(parsed.amount)}`);
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const cat = parsed ? getCategory(parsed.category) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[22%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0" onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}>
        <DialogTitle className="sr-only">Quick add a transaction</DialogTitle>
        <DialogDescription className="sr-only">Type what it was, the amount and optionally when, then press Enter.</DialogDescription>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex items-center gap-3 border-b pl-4 pr-12"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="coffee 4.50 yesterday"
            maxLength={200}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="Describe the transaction"
          />
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </form>

        <div className="p-4" aria-live="polite">
          {!parsed ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Try</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => { setText(ex); inputRef.current?.focus(); }}
                    className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={cn("flex items-center gap-3 rounded-xl border p-3 transition-opacity", !parsed.valid && "opacity-60")}>
              <CategoryIcon category={parsed.category} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{parsed.description || "What was it?"}</p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                  <span>{cat.name}</span>
                  {parsed.categorySource === "rule" && <span className="text-primary">· your rule</span>}
                  <span>· {format(parsed.date, "EEE, MMM d")}</span>
                  {parsed.recurringInterval && (
                    <span className="inline-flex items-center gap-1">· <Repeat className="h-3 w-3" /> {INTERVAL[parsed.recurringInterval]}</span>
                  )}
                </p>
              </div>
              <span className={cn("text-sm font-semibold tabular", parsed.type === "INCOME" && "text-positive")}>
                {parsed.amount ? `${parsed.type === "INCOME" ? "+" : "−"}${money(parsed.amount)}` : "Amount?"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <Link href="/transaction/create" onClick={() => onOpenChange(false)} className="hover:text-foreground">
            Use the full form
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> to save to your main account
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
