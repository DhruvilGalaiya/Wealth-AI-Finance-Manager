import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserTransactions } from "@/actions/transaction";
import { getUserAccounts } from "@/actions/dashboard";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { TransactionTable } from "@/components/app/transaction-table";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({ searchParams }) {
  const params = await searchParams;
  const [transactions, accounts] = await Promise.all([getUserTransactions(), getUserAccounts()]);
  const initialType = params?.type === "INCOME" || params?.type === "EXPENSE" ? params.type : undefined;

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Everything across your accounts."
        actions={
          <Button asChild>
            <Link href="/transaction/create"><Plus /> Add transaction</Link>
          </Button>
        }
      />
      <SectionCard bodyClassName="p-0" className="overflow-hidden">
        <TransactionTable transactions={transactions} accounts={accounts} initialType={initialType} />
      </SectionCard>
    </>
  );
}
