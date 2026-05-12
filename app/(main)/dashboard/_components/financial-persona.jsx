"use client";

import { useState, useEffect } from "react";

export function FinancialPersona({ currentExpenses, budgetLimit }) {
    const [persona, setPersona] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPersona = async () => {
            const total = currentExpenses || 1;
            const savingsPct = budgetLimit > currentExpenses ? ((budgetLimit - currentExpenses) / budgetLimit) * 100 : 5;
            
            const payload = {
                housing_pct: 45.0, 
                food_pct: 25.0,
                entertainment_pct: 30.0 - savingsPct > 0 ? 30.0 - savingsPct : 5.0,
                savings_pct: savingsPct
            };

            try {
                const response = await fetch("http://localhost:8000/analyze_persona", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                setPersona(data);
            } catch (error) {
                console.error("Clustering API offline");
            } finally {
                setLoading(false);
            }
        };

        fetchPersona();
    }, [currentExpenses, budgetLimit]);

    if (loading) return <div className="p-6 border rounded-lg bg-white h-full animate-pulse">Loading Spending Pattern...</div>;
    if (!persona) return null;

    return (
        <div className="p-6 rounded-lg border bg-white shadow-sm flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Spending Pattern
                    </span>
                    <h2 className="text-lg font-bold text-gray-800">Your Financial Persona</h2>
                </div>
                
                {/* --- SIMPLIFIED EXPLANATION TEXT --- */}
                <p className="text-sm text-gray-500 mb-6">
                    This analysis reviews your spending habits across different categories to reveal your financial lifestyle and help you understand exactly where your money is going.
                </p>
            </div>

            <div className="mt-auto p-5 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Assigned Profile
                </span>
                <h3 className={`text-2xl font-extrabold mb-2 ${persona.color}`}>
                    {persona.name}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed italic border-l-4 border-slate-300 pl-3">
                    &quot;{persona.trait}&quot;
                </p>
            </div>
        </div>
    );
}