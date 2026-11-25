import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, Star } from "lucide-react";
import { getAccountWithTransactions } from "@/actions/account";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard, Pill } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { TransactionTable } from "@/components/app/transaction-table";
import { ACCOUNT_TYPE_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { AccountChart } from "../_components/account-chart";

export default async function AccountPage({ params }) {
  const { id } = await params;
  const account = await getAccountWithTransactions(id);
  if (!account) notFound();

  const { transactions, ...info } = account;

  return (
    <>
      <Link href="/accounts" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Accounts
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {info.name}
            {info.isDefault && <Pill tone="primary" icon={Star}>Main</Pill>}
          </span>
        }
        description={`${ACCOUNT_TYPE_LABEL[info.type]} · ${info._count.transactions} transactions`}
        actions={
          <>
            <div className="mr-2 text-right">
              <p className="text-xs text-muted-foreground">Current balance</p>
              <p className="text-2xl font-semibold"><Money amount={info.balance} /></p>
            </div>
            <Button asChild>
              <Link href="/transaction/create"><Plus /> Add transaction</Link>
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <AccountChart transactions={transactions} />
        <SectionCard title="Transactions" bodyClassName="p-0 pt-3" className="overflow-hidden">
          <TransactionTable transactions={transactions} />
        </SectionCard>
      </div>
    </>
  );
}
