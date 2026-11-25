"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SectionCard } from "@/components/app/section-card";
import { useCurrency, useMoney } from "@/components/providers/currency-provider";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";
import { Segmented } from "@/components/app/segmented";

function Field({ label, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}

export function AddTransactionForm({ accounts, categories, editMode = false, editId, initialData = null }) {
  const router = useRouter();
  const money = useMoney();
  const currency = useCurrency();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description || "",
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            recurringInterval: initialData.recurringInterval || undefined,
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: (accounts.find((a) => a.isDefault) || accounts[0])?.id,
            category: "",
            date: new Date(),
            isRecurring: false,
          },
  });

  const { loading, fn } = useFetch(editMode ? updateTransaction : createTransaction);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const filteredCategories = categories.filter((c) => c.type === type);

  const onSubmit = async (data) => {
    const payload = { ...data, amount: Number(data.amount) };
    const res = editMode ? await fn(editId, payload) : await fn(payload);
    if (res?.success) {
      toast.success(editMode ? "Transaction updated" : "Transaction added");
      router.push(`/account/${res.data.accountId}`);
    }
  };

  const setType = (next) => {
    if (next === type) return;
    setValue("type", next);
    setValue("category", "", { shouldValidate: false });
  };

  const handleScan = (scanned) => {
    setType("EXPENSE");
    setValue("amount", scanned.amount.toString(), { shouldValidate: true });
    setValue("date", new Date(scanned.date));
    if (scanned.description) setValue("description", scanned.description);
    if (scanned.category) setValue("category", scanned.category, { shouldValidate: true });
    toast.success("Receipt scanned — check the details below.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!editMode && <ReceiptScanner onScanComplete={handleScan} />}

      <SectionCard bodyClassName="space-y-5">
        {/* Type toggle */}
        <Segmented
          label="Transaction type"
          className="w-full"
          value={type}
          onChange={setType}
          options={[
            { value: "EXPENSE", label: "Expense" },
            { value: "INCOME", label: "Income" },
          ]}
        />

        {/* Amount */}
        <Field label="Amount" error={errors.amount?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              {CURRENCIES[currency]?.symbol}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-12 pl-8 text-lg font-semibold tabular"
              {...register("amount")}
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.category?.message}>
            <Select value={watch("category") || ""} onValueChange={(v) => setValue("category", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Account" error={errors.accountId?.message}>
            <Select value={watch("accountId") || ""} onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Choose an account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {money(a.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Date" error={errors.date?.message}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="text-muted-foreground" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setValue("date", d, { shouldValidate: true })}
                  disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <Input placeholder="e.g. Weekly groceries" maxLength={200} {...register("description")} />
          </Field>
        </div>

        {/* Recurring */}
        <div className="rounded-lg border p-3">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Repeats</span>
              <span className="block text-xs text-muted-foreground">
                We&apos;ll add it automatically on schedule — great for rent, salary and subscriptions.
              </span>
            </span>
            <Switch checked={isRecurring} onCheckedChange={(c) => setValue("isRecurring", c)} />
          </label>
          {isRecurring && (
            <Field label="How often" error={errors.recurringInterval?.message} className="mt-3">
              <Select value={watch("recurringInterval") || ""} onValueChange={(v) => setValue("recurringInterval", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose a schedule" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </SectionCard>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading} className="min-w-36">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Saving…" : editMode ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
