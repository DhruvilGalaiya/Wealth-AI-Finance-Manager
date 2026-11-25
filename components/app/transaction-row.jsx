import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { Money } from "@/components/app/money";

export function TransactionRow({ transaction, accountName }) {
  const category = getCategory(transaction.category);
  return (
    <li className="flex items-center gap-3 py-3">
      <CategoryIcon category={transaction.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description || category.name}
        </p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {category.name}
          <span aria-hidden>·</span>
          {format(new Date(transaction.date), "MMM d")}
          {accountName && (
            <>
              <span aria-hidden>·</span>
              {accountName}
            </>
          )}
          {transaction.isRecurring && <Repeat className="h-3 w-3" aria-label="Recurring" />}
        </p>
      </div>
      <Money amount={transaction.amount} type={transaction.type} signed className="text-sm font-medium" />
    </li>
  );
}
