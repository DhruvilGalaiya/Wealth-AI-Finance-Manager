// lib/rl-policy-engine.js

export function runPolicyEngine(liquidAssets, monthlyExpenses) {
    // 1. Calculate Liquidity Runway in Months, then convert to Days
    const runwayMonths = monthlyExpenses > 0 ? (liquidAssets / monthlyExpenses) : 99;
    const runwayDays = Math.round(runwayMonths * 30); // 30 days per month
  
    // 2. Policy Action Engine
    let action = "Build buffer";
    let actionColor = "text-red-600 bg-red-100";
  
    if (runwayMonths > 6) {
      action = "Spend / Invest";
      actionColor = "text-green-700 bg-green-100";
    } else if (runwayMonths >= 3) {
      action = "Save";
      actionColor = "text-blue-700 bg-blue-100";
    } else if (runwayMonths >= 1) {
      action = "Defer purchases";
      actionColor = "text-amber-700 bg-amber-100";
    }
  
    // 3. Stress Scenario Engine (Also converted to days)
    const emergencyAssets = Math.max(0, liquidAssets - 2500);
    const emergencyRunwayMonths = monthlyExpenses > 0 ? (emergencyAssets / monthlyExpenses) : 0;
    const emergencyRunwayDays = Math.round(emergencyRunwayMonths * 30);
    
    const scenario = `If a $2,500 medical emergency occurs, your liquidity runway drops to ${emergencyRunwayDays} days.`;
  
    return {
      runwayDays: runwayDays,          // <-- Now passing exact days
      recommendedAction: action,
      actionStyle: actionColor,
      stressScenario: scenario
    };
  }