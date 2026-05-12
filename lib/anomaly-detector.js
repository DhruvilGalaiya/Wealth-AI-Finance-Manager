// lib/anomaly-detector.js

/**
 * AIML STATISTICAL BACKEND
 * Z-Score Anomaly Detection Algorithm
 * Identifies transactions that deviate significantly from the user's spending baseline.
 */
export function detectAnomalies(transactions) {
  // 1. Filter for valid expenses
  const expenses = transactions
    .filter(t => t.type?.toLowerCase() === 'expense' || t.type === 'EXPENSE')
    .map(t => ({ ...t, amount: Number(t.amount) }));

  if (expenses.length < 3) return []; // Need data to find a baseline

  // 2. Calculate the Mean (Average)
  const totalSpend = expenses.reduce((sum, t) => sum + t.amount, 0);
  const mean = totalSpend / expenses.length;

  // 3. Calculate Variance and Standard Deviation
  const variance = expenses.reduce((sum, t) => sum + Math.pow(t.amount - mean, 2), 0) / expenses.length;
  const standardDeviation = Math.sqrt(variance);

  // 4. Find Anomalies (Z-Score > 1.5 standard deviations from the mean)
  const threshold = 1.5;
  const anomalies = expenses.filter(t => {
    // Avoid dividing by zero if all expenses are exactly the same
    if (standardDeviation === 0) return false; 
    
    const zScore = Math.abs((t.amount - mean) / standardDeviation);
    return zScore > threshold && t.amount > mean; // Only flag unusually HIGH spikes
  });

  return anomalies;
}