import { Plus, Wallet } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard, EmptyState } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { AccountList } from "./_components/account-list";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const accounts = await getUserAccounts();
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const byType = (type) => accounts.filter((a) => a.type === type).reduce((s, a) => s + a.balance, 0);

  const addButton = (
    <CreateAccountDrawer>
      <Button><Plus /> Add account</Button>
    </CreateAccountDrawer>
  );

  return (
    <>
      <PageHeader title="Accounts" description="All your balances in one place." actions={addButton} />

      {accounts.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Wallet}
            title="No accounts yet"
            description="Add a checking or savings account to start tracking."
            action={addButton}
            className="py-14"
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard className="lg:order-2 lg:self-start">
            <p className="text-sm text-muted-foreground">Total balance</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight"><Money amount={total} /></p>
            <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Checking</dt>
                <dd><Money amount={byType("CURRENT")} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Savings</dt>
                <dd><Money amount={byType("SAVINGS")} /></dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Your main account is used for budget tracking and pre-selected for new transactions.
            </p>
          </SectionCard>

          <SectionCard bodyClassName="p-0" className="overflow-hidden lg:order-1 lg:col-span-2">
            <AccountList accounts={accounts} />
          </SectionCard>
        </div>
      )}
    </>
  );
}
