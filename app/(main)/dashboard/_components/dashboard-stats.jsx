import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export function DashboardStats({ transactions }) {
  // 1. Filter for THIS month's transactions
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthTx = transactions?.filter(t => {
    const txMonthStr = new Date(t.date || t.createdAt).toISOString().slice(0, 7);
    return txMonthStr === currentMonthStr;
  }) || [];

  // 2. Calculate Revenue & Expenses
  const revenue = thisMonthTx
    .filter(t => t.type?.toLowerCase() === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = thisMonthTx
    .filter(t => t.type?.toLowerCase() === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Calculate Spending Rate
  const spendingRate = revenue > 0 ? ((expenses / revenue) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Revenue Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Revenue
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">${revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          <p className="text-sm text-emerald-500 mt-2 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded flex items-center gap-1">
            + Current Month
          </p>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Expenses
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">${expenses.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          <p className="text-sm text-rose-500 mt-2 font-medium bg-rose-50 w-fit px-2 py-0.5 rounded flex items-center gap-1">
            - Current Month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}