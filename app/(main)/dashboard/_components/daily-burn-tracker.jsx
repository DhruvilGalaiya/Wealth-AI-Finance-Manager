"use client";

export function DailyBurnTracker({ currentSpent, budgetLimit }) {
    // 1. Time Math
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDay + 1; // Include today

    // Avoid dividing by zero if budget isn't set
    const safeBudgetLimit = budgetLimit || 1; 

    // 2. Predictive Forecasting Math
    const currentBurnRate = currentSpent / currentDay;
    const projectedEndMonth = currentBurnRate * daysInMonth;
    const projectedDelta = safeBudgetLimit - projectedEndMonth;

    // 3. AI Auto-Correction Math
    const remainingBudget = Math.max(0, safeBudgetLimit - currentSpent);
    const safeDailyLimit = remainingBudget / daysRemaining;

    // 4. UI Dynamic States
    let projectionColor = "text-green-600";
    let projectionMessage = "Estimated Savings";
    if (projectedDelta < 0) {
        projectionColor = "text-rose-600";
        projectionMessage = "Estimated Over Budget";
    }

    return (
        <div className="p-6 rounded-lg border bg-white shadow-sm flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Smart Forecast
                    </span>
                    <h2 className="text-lg font-bold text-gray-800">Daily Spending Guide</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Based on your recent habits, you are spending an average of <strong className="text-gray-700">${currentBurnRate.toFixed(2)} a day</strong>.
                </p>
            </div>

            <div className="space-y-4">
                {/* AI Projection Card */}
                <div className="p-4 rounded-md border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Month-End Prediction
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-extrabold ${projectionColor}`}>
                            ${Math.abs(projectedDelta).toFixed(2)}
                        </span>
                        <span className="text-slate-600 font-medium text-sm">{projectionMessage}</span>
                    </div>
                </div>

                {/* AI Auto-Correction Target Card */}
                <div className="p-4 rounded-md border border-amber-100 bg-amber-50">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                        Suggested Daily Limit
                    </span>
                    <p className="text-xs text-amber-900 mb-2 leading-relaxed">
                        To comfortably stay within your budget, try to keep your spending under this amount for the remaining {daysRemaining} days:
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-amber-600">
                            ${safeDailyLimit.toFixed(2)}
                        </span>
                        <span className="text-amber-800 font-medium text-sm">/ day</span>
                    </div>
                </div>
            </div>
        </div>
    );
}