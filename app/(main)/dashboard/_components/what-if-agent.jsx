"use client";

import { useState, useEffect } from "react";

export function WhatIfAgent({ accounts, transactions, budgetData }) {
    const [expenseInput, setExpenseInput] = useState("");
    const [aiAction, setAiAction] = useState("Loading AI...");
    const hypotheticalExpense = parseFloat(expenseInput) || 0;

    // --- BULLETPROOF DATA GRAB ---
    const totalLiquidAssets = accounts?.reduce((sum, account) => sum + (Number(account.balance) || 0), 0) || 0;

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthlyBurn = transactions?.filter(t => {
        const isExpense = t.type?.toLowerCase() === 'expense' || t.type === 'EXPENSE';
        const txMonthStr = new Date(t.date || t.createdAt).toISOString().slice(0, 7);
        return isExpense && txMonthStr === currentMonthStr;
    }).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const currentRunwayMonths = monthlyBurn > 0 ? (totalLiquidAssets / monthlyBurn) : 99;
    const currentRunwayDays = Math.round(currentRunwayMonths * 30);

    const currentSpent = budgetData?.currentExpenses || 0;
    const budgetLimit = budgetData?.budget?.amount || 10000;

    // --- DYNAMIC TIME-BASED PACING MATH ---
    const today = new Date();
    const currentDay = today.getDate(); 
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    const expectedPacing = (currentDay / daysInMonth) * 100;

    const getHealthState = (spent) => {
        const actualPacing = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
        const pacingDelta = actualPacing - expectedPacing;
        
        if (pacingDelta >= 15) return { label: "WARNING", color: "text-red-400" };
        if (pacingDelta >= 5) return { label: "FRAGILE", color: "text-amber-400" };
        return { label: "SAFE", color: "text-green-400" };
    };

    const currentHealth = getHealthState(currentSpent);
    const simulatedHealth = getHealthState(currentSpent + hypotheticalExpense);

    const simulatedAssets = Math.max(0, totalLiquidAssets - hypotheticalExpense);
    const simulatedRunwayMonths = monthlyBurn > 0 ? (simulatedAssets / monthlyBurn) : 99;
    const simulatedRunwayDays = Math.round(simulatedRunwayMonths * 30);

    // --- MACHINE LEARNING DQN INTEGRATION ---
    useEffect(() => {
        const fetchAiAction = async () => {
            setAiAction("Calculating...");
            try {
                const response = await fetch("http://localhost:8000/predict_action", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        current_day: currentDay,
                        actual_pacing: budgetLimit > 0 ? ((currentSpent + hypotheticalExpense) / budgetLimit) * 100 : 0,
                        expected_pacing: expectedPacing,
                        runway: simulatedRunwayDays
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setAiAction(data.action);
                } else {
                    setAiAction("AI Offline");
                }
            } catch (error) {
                console.error("AI API is offline", error);
                setAiAction("AI Offline");
            }
        };

        fetchAiAction();
    }, [hypotheticalExpense, currentSpent, simulatedRunwayDays, currentDay, expectedPacing, budgetLimit]);

    // --- TRANSLATE AI DATA TO SIMPLE USER UI ---
    let displayAction = "Loading...";
    let actionColor = "text-slate-400 bg-slate-800";
    let diagnosticText = "Analyzing your financial state...";

    if (aiAction === "Spend Normal") {
        displayAction = "Reasonable";
        actionColor = "text-green-700 bg-green-100";
        diagnosticText = "This purchase is reasonable. It stays well within your budget pacing and keeps your financial health secure.";
    } else if (aiAction === "Save") {
        displayAction = "Not Recommended";
        actionColor = "text-amber-700 bg-amber-100";
        diagnosticText = "This purchase is not recommended right now. It stretches your current budget and moves you toward a riskier position.";
    } else if (aiAction === "Defer Purchases") {
        displayAction = "Avoid Spend";
        actionColor = "text-red-700 bg-red-100";
        diagnosticText = "We strongly advise against this spend. It consumes a dangerous amount of your budget and puts your financial health at risk.";
    } else if (aiAction === "AI Offline") {
        displayAction = "Offline";
        diagnosticText = "Could not connect to the AI engine. Please try again.";
    }

    return (
        <div className="p-6 rounded-lg border bg-slate-900 shadow-sm text-white flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold">AI Predictive Analysis</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${actionColor}`}>
                        AI RECOMMENDATION: {displayAction}
                    </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                    Live insights based on your spending habits and liquidity.
                </p>
            </div>

            <div className="mt-auto p-4 bg-slate-800 rounded border border-slate-700">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-3">
                    Interactive What-If Scenario
                </span>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-slate-400 font-medium">$</span>
                    <input
                        type="number"
                        placeholder="Enter a hypothetical purchase..."
                        value={expenseInput}
                        onChange={(e) => setExpenseInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                    />
                </div>

                {hypotheticalExpense > 0 ? (
                    <div className="space-y-3 text-sm bg-slate-900/50 p-4 rounded border border-slate-700">
                        <p className="text-slate-300 border-b border-slate-700 pb-2 mb-2">
                            Impact of <strong className="text-white">${hypotheticalExpense}</strong> purchase:
                        </p>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Health Shift:</span>
                            <div className="flex items-center gap-2 font-bold">
                                <span className={currentHealth.color}>{currentHealth.label}</span>
                                <span className="text-slate-500">➔</span>
                                <span className={simulatedHealth.color}>{simulatedHealth.label}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400">Runway Shift:</span>
                            <div className="flex items-center gap-2 font-bold">
                                <span className="text-white">{currentRunwayDays} days</span>
                                <span className="text-slate-500">➔</span>
                                <span className={`${simulatedRunwayDays < currentRunwayDays ? 'text-red-400' : 'text-white'}`}>
                                    {simulatedRunwayDays} days
                                </span>
                            </div>
                        </div>

                        {/* --- SIMPLE AI DIAGNOSTIC TEXT BLOCK --- */}
                        <div className="mt-4 pt-3 border-t border-slate-700 bg-slate-900/80 p-3 rounded-md">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                What this means
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              &quot;{diagnosticText}&quot;
                            </p>
                        </div>

                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">
                        Enter an amount to simulate its impact on your finances.
                    </p>
                )}
            </div>
        </div>
    );
}