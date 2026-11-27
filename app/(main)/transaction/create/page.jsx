import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import { getTransaction } from "@/actions/transaction";
import { defaultCategories } from "@/data/categories";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard, EmptyState } from "@/components/app/section-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { AddTransactionForm } from "../_components/transaction-form";

export const metadata = { title: "Add transaction" };

export default async function AddTransactionPage({ searchParams }) {
  const params = await searchParams;
  const editId = params?.edit;
  const accounts = await getUserAccounts();

  let initialData = null;
  if (editId) {
    initialData = await getTransaction(editId).catch(() => null);
    if (!initialData) notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={editId ? "Edit transaction" : "Add transaction"}
        description={editId ? "Update the details — balances adjust automatically." : "Record income or an expense."}
      />
      {accounts.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Wallet}
            title="You need an account first"
            description="Transactions belong to an account, so add one to continue."
            action={
              <div className="flex gap-2">
                <Button variant="outline" asChild><Link href="/dashboard">Back</Link></Button>
                <CreateAccountDrawer><Button>Add account</Button></CreateAccountDrawer>
              </div>
            }
          />
        </SectionCard>
      ) : (
        <AddTransactionForm
          accounts={accounts}
          categories={defaultCategories}
          editMode={!!editId}
          editId={editId}
          initialData={initialData}
        />
      )}
    </div>
  );
}
