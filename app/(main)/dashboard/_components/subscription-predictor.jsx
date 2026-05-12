"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function SubscriptionPredictor() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const analyzeSubscriptions = async () => {
            // These are now just 3 general examples of how the AI monitors bills.
            // In a real long-term account, this would automatically pull from your 'transactions' array.
            const payload = {
                subscriptions: [
                    { name: "Groceries", history: [65.00, 64.50, 72.00, 85.00, 92.00] },
                    { name: "Internet Plan", history: [40.00, 40.00, 40.00, 40.00, 40.00] },
                    { name: "Streaming & Media", history: [15.99, 15.99, 15.99, 15.99, 15.99] }
                ]
            };

            try {
                const response = await fetch("http://localhost:8000/predict_subscriptions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                setPredictions(data.predictions);
            } catch (error) {
                console.error("Monitoring API offline");
            } finally {
                setLoading(false);
            }
        };

        analyzeSubscriptions();
    }, []);

    return (
        <div className="p-6 rounded-lg border bg-white shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    AI Monitor
                </span>
                <h2 className="text-lg font-bold text-gray-800">Recurring Bills</h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
                Automatically monitors your regular bills to ensure prices stay consistent.
            </p>

            {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs font-medium uppercase tracking-widest">Scanning cycles...</span>
                </div>
            ) : (
                <div className="space-y-3 mt-auto">
                    {predictions.map((sub, idx) => (
                        <div key={idx} className="flex flex-col p-3 border border-slate-100 rounded-md bg-slate-50">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{sub.name}</span>
                                
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${sub.color}`}>
                                    {sub.status === "Stable" ? "Stable Price" : "Rising Cost"}
                                </span>
                            </div>
                            
                            <div className="mt-1">
                                <span className="text-xs text-slate-500">Current Monthly: <strong className="text-slate-700">${sub.current_cost.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}