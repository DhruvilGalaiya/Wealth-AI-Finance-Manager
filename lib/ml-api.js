const COLAB_API_URL = "https://janetta-graphologic-isographically.ngrok-free.dev/predict-risk";

// 1. Add arguments to the function
export async function getRiskClassification(leverage, runway, variance = 0.15, volatility = 0.20) {
  try {
    const response = await fetch(COLAB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        // 2. Replace dummy data with the real arguments!
        income_variance: variance,
        fixed_obligation_ratio: leverage,
        liquidity_buffer: runway,
        spending_volatility: volatility
      }),
    });

    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.risk_state;

  } catch (error) {
    console.error("Failed to reach Colab ML backend:", error);
    return null;
  }
}