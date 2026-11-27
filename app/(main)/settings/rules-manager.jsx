"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "@/components/app/section-card";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { defaultCategories } from "@/data/categories";
import { applyRulesToPast, createRule, deleteRule } from "@/actions/rules";

export function RulesManager({ rules }) {
  const router = useRouter();
  const [match, setMatch] = useState("");
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();
  const [applying, setApplying] = useState(false);

  const add = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createRule({ match, category });
      if (res.success) {
        toast.success(`Rule added: "${res.data.match}" → ${getCategory(res.data.category).name}`);
        setMatch("");
        setCategory("");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  const remove = (id) =>
    startTransition(async () => {
      const res = await deleteRule(id);
      if (res.success) router.refresh();
    });

  const applyPast = async () => {
    setApplying(true);
    const res = await applyRulesToPast();
    setApplying(false);
    if (res.success) {
      toast.success(res.updated ? `Re-sorted ${res.updated} transaction${res.updated === 1 ? "" : "s"}` : "Nothing to re-sort");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <SectionCard
      title="Auto-categorize rules"
      description="When a description contains the text, the transaction gets that category. Used by quick add and for anything left as “Other”."
      action={
        rules.length > 0 && (
          <Button variant="outline" size="sm" onClick={applyPast} disabled={applying}>
            {applying ? <Loader2 className="animate-spin" /> : <Wand2 />} Apply to past
          </Button>
        )
      }
    >
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
        <Input value={match} onChange={(e) => setMatch(e.target.value)} placeholder="Description contains… e.g. uber" maxLength={60} aria-label="Text to match" />
        <ArrowRight className="mx-auto hidden h-4 w-4 text-muted-foreground sm:block" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Category"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {["EXPENSE", "INCOME"].map((type) => (
              <SelectGroup key={type}>
                <SelectLabel>{type === "EXPENSE" ? "Expenses" : "Income"}</SelectLabel>
                {defaultCategories.filter((c) => c.type === type).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending || match.trim().length < 2 || !category}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add
        </Button>
      </form>

      {rules.length > 0 && (
        <ul className="mt-4 divide-y rounded-lg border">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.match}</code>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <CategoryIcon category={r.category} className="h-7 w-7" />
              <span className="flex-1 text-sm">{getCategory(r.category).name}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(r.id)} aria-label={`Delete rule ${r.match}`}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
