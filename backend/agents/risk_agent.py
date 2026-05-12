from utils.calculations import compute_metrics

def financial_health_agent(user_df):
    latest = user_df.iloc[-1]

    liquidity_runway, leverage = compute_metrics(latest)

    # Decision logic
    if liquidity_runway < 1:
        status = "CRITICAL"
        message = "You are at risk of insolvency. Immediate action required."

    elif liquidity_runway < 3:
        status = "FRAGILE"
        message = "Low financial buffer. Reduce discretionary spending."

    elif leverage > 0.6:
        status = "WARNING"
        message = "High leverage detected. Control expenses."

    else:
        status = "STABLE"
        message = "Your financial health is stable."

    return {
        "status": status,
        "liquidity": liquidity_runway,
        "leverage": leverage,
        "message": message
    }