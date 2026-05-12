import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export function UpcomingBills({ transactions }) {
  // Filter for recurring expenses
  const recurringBills = transactions?.filter(t => 
    t.isRecurring && t.type?.toLowerCase() === 'expense'
  ).slice(0, 4) || []; // Show top 4

  return (
    <Card className="shadow-sm border h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-500" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recurringBills.length > 0 ? (
          recurringBills.map((bill, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-full border shadow-sm flex items-center justify-center font-bold text-gray-700">
                  {bill.name ? bill.name.charAt(0).toUpperCase() : 'B'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{bill.name || 'Recurring Bill'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(bill.date || bill.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="font-bold text-gray-900">${Number(bill.amount).toFixed(2)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-4">No upcoming recurring bills detected.</p>
        )}
      </CardContent>
    </Card>
  );
}