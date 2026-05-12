import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";
import { runPolicyEngine } from "@/lib/rl-policy-engine";
import { WhatIfAgent } from "./_components/what-if-agent";
import { DashboardStats } from "./_components/dashboard-stats";
import { GenerateReportButton } from "./_components/generate-report-button";
import { detectAnomalies } from "@/lib/anomaly-detector";
import { DailyBurnTracker } from "./_components/daily-burn-tracker"; 
import { FinancialPersona } from "./_components/financial-persona";
import { SubscriptionPredictor } from "./_components/subscription-predictor";
import { AiCopilot } from "./_components/ai-copilot"; // <-- NEW IMPORT

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  // --- AIML ENGINE DATA GATHERING ---
  const totalLiquidAssets = accounts?.reduce((sum, account) => sum + (Number(account.balance) || 0), 0) || 0;
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = transactions?.filter(t => {
    const isExpense = t.type?.toLowerCase() === 'expense' || t.type === 'EXPENSE';
    const txMonthStr = new Date(t.date || t.createdAt).toISOString().slice(0, 7);
    return isExpense && txMonthStr === currentMonthStr;
  }).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const aiInsights = runPolicyEngine(totalLiquidAssets, monthlyExpenses);
  const anomalies = detectAnomalies(transactions || []);

  // --- GATHER CONTEXT FOR GEMINI ---
  const geminiContext = {
    assets: totalLiquidAssets,
    runwayDays: aiInsights.runwayDays,
    budget: budgetData?.budget?.amount || 0,
    spent: budgetData?.currentExpenses || 0
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <GenerateReportButton />
      </div>

      <DashboardStats transactions={transactions} />

      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* --- THE AI COMMAND CENTER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Column: Static Analytics */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-lg border bg-white shadow-sm flex flex-col justify-center h-full">
            <h2 className="text-lg font-bold text-gray-800">Liquidity Runway</h2>
            <p className="text-sm text-gray-500 mb-4">
              If your income drops to zero, how long do you survive?
            </p>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-5xl font-extrabold text-blue-600">{aiInsights.runwayDays}</span>
              <span className="text-gray-600 font-bold text-lg">Days</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Agent */}
        <WhatIfAgent 
          accounts={accounts} 
          transactions={transactions} 
          budgetData={budgetData} 
        />
        
      </div>

      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>

      {/* Analytics & Machine Learning Block */}
        <div className="flex flex-col gap-4">
          <DailyBurnTracker 
            currentSpent={budgetData?.currentExpenses || 0} 
            budgetLimit={budgetData?.budget?.amount || 0} 
          />
          <FinancialPersona 
             currentExpenses={budgetData?.currentExpenses || 0} 
             budgetLimit={budgetData?.budget?.amount || 0} 
          />
          <SubscriptionPredictor />
        </div>

      {/* AI ANOMALY ALERTS */}
      {anomalies.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              AI Alert
            </span>
            <h3 className="text-lg font-bold text-rose-900">Spending Anomalies Detected</h3>
          </div>
          <p className="text-sm text-rose-700 mb-4">
            Our statistical engine identified {anomalies.length} transaction(s) deviating significantly from your baseline.
          </p>
          <div className="space-y-2">
            {anomalies.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-rose-100">
                <span className="font-medium text-gray-800">{tx.description || "Untitled Transaction"}</span>
                <span className="font-bold text-rose-600">${tx.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* NEW: GEN-AI COPILOT CHAT */}
      <div className="w-full">
          <AiCopilot contextData={geminiContext} />
      </div>
      {/* --------------------------- */}
    </div>
  );
}