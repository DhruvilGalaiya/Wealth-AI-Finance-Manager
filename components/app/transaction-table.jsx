"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MoreHorizontal, Pencil,
  Repeat, Search, Trash2, X, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { EmptyState } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { bulkDeleteTransactions } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const INTERVAL = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };
const ALL = "all";

function SortHeader({ field, sort, onSort, children, className }) {
  const active = sort.field === field;
  const Icon = sort.direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className={cn("px-3 py-2.5 font-medium", className)} aria-sort={active ? `${sort.direction}ending` : "none"}>
      <button
        onClick={() => onSort(field)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
      >
        {children}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-0")} />
      </button>
    </th>
  );
}

export function TransactionTable({ transactions, accounts, initialType }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState(initialType || ALL);
  const [category, setCategory] = useState(ALL);
  const [accountId, setAccountId] = useState(ALL);
  const [sort, setSort] = useState({ field: "date", direction: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [confirmIds, setConfirmIds] = useState(null);
  const { loading: deleting, fn: deleteFn } = useFetch(bulkDeleteTransactions);

  const accountName = useMemo(
    () => Object.fromEntries((accounts || []).map((a) => [a.id, a.name])),
    [accounts]
  );
  const showAccount = (accounts?.length || 0) > 1;
  const categoryOptions = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = transactions.filter((t) => {
      if (type !== ALL && t.type !== type) return false;
      if (category !== ALL && t.category !== category) return false;
      if (accountId !== ALL && t.accountId !== accountId) return false;
      if (!q) return true;
      return (
        t.description?.toLowerCase().includes(q) ||
        getCategory(t.category).name.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    });

    const dir = sort.direction === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sort.field === "amount") return (a.amount - b.amount) * dir;
      if (sort.field === "category") return a.category.localeCompare(b.category) * dir;
      return (new Date(a.date) - new Date(b.date)) * dir;
    });
    return result;
  }, [transactions, search, type, category, accountId, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const hasFilters = search || type !== ALL || category !== ALL || accountId !== ALL;

  const resetPage = (setter) => (v) => {
    setter(v);
    setPage(1);
    setSelected([]);
  };

  const onSort = (field) =>
    setSort((s) => ({ field, direction: s.field === field && s.direction === "desc" ? "asc" : "desc" }));

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () =>
    setSelected(allOnPage ? selected.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...selected, ...rows.map((r) => r.id)])]);

  const confirmDelete = async () => {
    const ids = confirmIds;
    const res = await deleteFn(ids);
    if (res?.success) {
      toast.success(`Deleted ${res.deleted} transaction${res.deleted === 1 ? "" : "s"}`);
      setSelected((s) => s.filter((id) => !ids.includes(id)));
      setConfirmIds(null);
      router.refresh();
    }
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Add your first income or expense to see it here."
        action={<Button asChild size="sm"><Link href="/transaction/create">Add transaction</Link></Button>}
        className="py-14"
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description, category or amount"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            className="pl-9"
            aria-label="Search transactions"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={type} onValueChange={resetPage(setType)}>
            <SelectTrigger className="sm:w-[130px]" aria-label="Filter by type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expenses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={resetPage(setCategory)}>
            <SelectTrigger className="sm:w-[160px]" aria-label="Filter by category"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>{getCategory(c).name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showAccount && (
            <Select value={accountId} onValueChange={resetPage(setAccountId)}>
              <SelectTrigger className="col-span-2 sm:w-[160px]" aria-label="Filter by account"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch(""); setType(ALL); setCategory(ALL); setAccountId(ALL); setPage(1);
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2 text-sm">
          <span>{selected.length} selected</span>
          <Button variant="destructive" size="sm" onClick={() => setConfirmIds(selected)}>
            <Trash2 /> Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="w-10 py-2.5 pl-4 pr-1">
                <Checkbox checked={allOnPage} onCheckedChange={toggleAll} aria-label="Select all on this page" />
              </th>
              <SortHeader field="date" sort={sort} onSort={onSort} className="hidden w-28 md:table-cell">Date</SortHeader>
              <th className="px-3 py-2.5 font-medium">Description</th>
              <SortHeader field="category" sort={sort} onSort={onSort} className="hidden lg:table-cell">Category</SortHeader>
              {showAccount && <th className="hidden px-3 py-2.5 font-medium xl:table-cell">Account</th>}
              <SortHeader field="amount" sort={sort} onSort={onSort} className="text-right [&>button]:ml-auto">Amount</SortHeader>
              <th className="w-12 pr-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            )}
            {rows.map((t) => {
              const cat = getCategory(t.category);
              return (
                <tr key={t.id} className={cn("transition-colors hover:bg-accent/40", selected.includes(t.id) && "bg-accent/50")}>
                  <td className="py-2.5 pl-4 pr-1">
                    <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} aria-label="Select transaction" />
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-muted-foreground md:table-cell">
                    {format(new Date(t.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={t.category} className="h-8 w-8" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.description || cat.name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="md:hidden">{format(new Date(t.date), "MMM d")} ·</span>
                          <span className="lg:hidden">{cat.name}</span>
                          {t.isRecurring && (
                            <span className="inline-flex items-center gap-1" title={t.nextRecurringDate ? `Next: ${format(new Date(t.nextRecurringDate), "PP")}` : undefined}>
                              <Repeat className="h-3 w-3" /> {INTERVAL[t.recurringInterval]}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">{cat.name}</td>
                  {showAccount && (
                    <td className="hidden px-3 py-2.5 text-muted-foreground xl:table-cell">{accountName[t.accountId]}</td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                    <Money amount={t.amount} type={t.type} signed />
                  </td>
                  <td className="pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Transaction actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/transaction/create?edit=${t.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-negative focus:text-negative" onClick={() => setConfirmIds([t.id])}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
        <span>
          {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <span className="tabular">{current} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!confirmIds} onOpenChange={(o) => !o && setConfirmIds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {confirmIds?.length === 1 ? "transaction" : `${confirmIds?.length} transactions`}?
            </DialogTitle>
            <DialogDescription>
              Account balances will be adjusted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
