"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";
import { useCurrency } from "@/components/providers/currency-provider";
import { CURRENCIES } from "@/lib/currency";

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}

// Kept the original export name so existing imports keep working.
export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const currency = useCurrency();
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", type: "CURRENT", balance: "", isDefault: false },
  });
  const { loading, fn } = useFetch(createAccount);

  const onSubmit = async (data) => {
    const res = await fn(data);
    if (res?.success) {
      toast.success(`${res.data.name} added`);
      reset();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an account</DialogTitle>
          <DialogDescription>Track a bank account by entering its current balance.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Account name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Everyday checking" autoComplete="off" {...register("name")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" htmlFor="type" error={errors.type?.message}>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={`Balance (${CURRENCIES[currency]?.symbol})`} htmlFor="balance" error={errors.balance?.message}>
              <Input id="balance" type="number" inputMode="decimal" step="0.01" placeholder="0.00" {...register("balance")} />
            </Field>
          </div>

          <label htmlFor="isDefault" className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3">
            <span>
              <span className="block text-sm font-medium">Make this my main account</span>
              <span className="block text-xs text-muted-foreground">Selected by default for new transactions and budget tracking.</span>
            </span>
            <Switch id="isDefault" checked={watch("isDefault")} onCheckedChange={(c) => setValue("isDefault", c)} />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Adding…" : "Add account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
