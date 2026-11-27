"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, Loader2, Minus, MoreHorizontal, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState, Pill } from "@/components/app/section-card";
import { useMoney, useCurrency } from "@/components/providers/currency-provider";
import { CURRENCIES } from "@/lib/currency";
import { goalPlan } from "@/lib/forecast";
import { contributeToGoal, createGoal, deleteGoal } from "@/actions/goals";
import { cn } from "@/lib/utils";

const STATUS = {
  "on-track": { tone: "positive", label: "On track" },
  behind: { tone: "warning", label: "Behind" },
  overdue: { tone: "negative", label: "Past deadline" },
  done: { tone: "primary", label: "Reached" },
  open: { tone: "neutral", label: "No deadline" },
};

function NewGoalDialog({ children }) {
  const router = useRouter();
  const currency = useCurrency();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    const res = await createGoal({ name: form.get("name"), target: form.get("target"), deadline: form.get("deadline") || null });
    setSaving(false);
    if (res.success) {
      toast.success(`Goal "${res.data.name}" created`);
      setOpen(false);
      setError("");
      router.refresh();
    } else setError(res.error);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New savings goal</DialogTitle>
          <DialogDescription>We&apos;ll work out how much to put aside each month.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="goal-name" className="text-sm font-medium">Name</label>
            <Input id="goal-name" name="name" placeholder="e.g. Emergency fund" maxLength={60} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="goal-target" className="text-sm font-medium">Target ({CURRENCIES[currency]?.symbol})</label>
              <Input id="goal-target" name="target" type="number" inputMode="decimal" min="1" step="0.01" placeholder="5000" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="goal-deadline" className="text-sm font-medium">By (optional)</label>
              <Input id="goal-deadline" name="deadline" type="date" min={format(new Date(), "yyyy-MM-dd")} />
            </div>
          </div>
          {error && <p className="text-xs text-negative">{error}</p>}
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Create goal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({ goal }) {
  const router = useRouter();
  const money = useMoney();
  const plan = goalPlan(goal);
  const status = STATUS[plan.status];
  const [mode, setMode] = useState(null); // "add" | "take"
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    const res = await contributeToGoal(goal.id, mode === "take" ? -value : value);
    setBusy(false);
    if (res.success) {
      if (res.data.saved >= res.data.target && goal.saved < goal.target) toast.success(`🎉 ${goal.name} reached!`);
      setMode(null);
      setAmount("");
      router.refresh();
    } else toast.error(res.error);
  };

  const remove = async () => {
    const res = await deleteGoal(goal.id);
    if (res.success) { toast.success("Goal removed"); router.refresh(); }
  };

  return (
    <li className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            {goal.deadline ? `By ${format(new Date(goal.deadline), "MMM d, yyyy")}` : "No deadline"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Pill tone={status.tone}>{status.label}</Pill>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${goal.name} options`}><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMode("take")}><Minus className="mr-2 h-4 w-4" /> Take money out</DropdownMenuItem>
              <DropdownMenuItem className="text-negative focus:text-negative" onClick={remove}><Trash2 className="mr-2 h-4 w-4" /> Delete goal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular">{money(goal.saved)}</p>
        <p className="text-sm text-muted-foreground tabular">of {money(goal.target)}</p>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(plan.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", plan.status === "behind" || plan.status === "overdue" ? "bg-warning" : "bg-primary")} style={{ width: `${plan.pct}%` }} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        {mode ? (
          <form onSubmit={apply} className="flex w-full items-center gap-2">
            <Input autoFocus type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === "take" ? "Amount to take out" : "Amount to add"} className="h-9" aria-label="Amount" />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={busy} aria-label="Save"><Check /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setMode(null); setAmount(""); }}>Cancel</Button>
          </form>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {plan.status === "done"
                ? "Goal reached."
                : plan.monthly != null
                  ? <>Save <span className="font-medium text-foreground tabular">{money(plan.monthly)}</span>/month</>
                  : <><span className="font-medium text-foreground tabular">{money(plan.remaining)}</span> to go</>}
            </p>
            {plan.status !== "done" && (
              <Button size="sm" variant="outline" onClick={() => setMode("add")}><Plus /> Add money</Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function Goals({ goals }) {
  return (
    <section id="goals" className="scroll-mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Savings goals</h2>
        {goals.length > 0 && (
          <NewGoalDialog><Button size="sm" variant="ghost" className="text-primary"><Plus /> New goal</Button></NewGoalDialog>
        )}
      </div>
      {goals.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Save toward something specific — a trip, a laptop, an emergency fund."
            action={<NewGoalDialog><Button size="sm"><Plus /> Create a goal</Button></NewGoalDialog>}
            className="py-10"
          />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </ul>
      )}
    </section>
  );
}
