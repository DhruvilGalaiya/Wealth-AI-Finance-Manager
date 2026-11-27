"use client";

import Link from "next/link";
import { ChevronRight, Landmark, PiggyBank, Star } from "lucide-react";
import { toast } from "sonner";
import { Money } from "@/components/app/money";
import { Pill } from "@/components/app/section-card";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPE_LABEL } from "@/lib/constants";
import { updateDefaultAccount } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

function AccountRow({ account, showMakeDefault }) {
  const { loading, fn } = useFetch(updateDefaultAccount);
  const Icon = account.type === "SAVINGS" ? PiggyBank : Landmark;

  const makeDefault = async (e) => {
    e.preventDefault();
    const res = await fn(account.id);
    if (res?.success) toast.success(`${account.name} is now your main account`);
  };

  return (
    <li>
      <Link
        href={`/account/${account.id}`}
        className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/60"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {account.name}
            {account.isDefault && <Pill tone="primary" icon={Star}>Main</Pill>}
          </p>
          <p className="text-xs text-muted-foreground">
            {ACCOUNT_TYPE_LABEL[account.type]} · {account._count?.transactions ?? 0} transactions
          </p>
        </div>
        {showMakeDefault && !account.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:inline-flex"
            onClick={makeDefault}
            disabled={loading}
          >
            Make main
          </Button>
        )}
        <Money amount={account.balance} className={cn("text-sm font-semibold", account.balance < 0 && "text-negative")} />
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

export function AccountList({ accounts, showMakeDefault = true, grouped = true }) {
  const groups = grouped
    ? [
        { key: "CURRENT", label: "Checking", items: accounts.filter((a) => a.type === "CURRENT") },
        { key: "SAVINGS", label: "Savings", items: accounts.filter((a) => a.type === "SAVINGS") },
      ].filter((g) => g.items.length)
    : [{ key: "all", label: null, items: accounts }];

  return (
    <div className="divide-y">
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && (
            <div className="flex items-center justify-between bg-muted/40 px-5 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>{g.label}</span>
              <Money amount={g.items.reduce((s, a) => s + a.balance, 0)} />
            </div>
          )}
          <ul className="divide-y">
            {g.items.map((a) => (
              <AccountRow key={a.id} account={a} showMakeDefault={showMakeDefault} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
