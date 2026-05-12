def compute_metrics(row):
    total_spend = (
        row["fixed_expense"] +
        row["variable_expense"] +
        row["discretionary_expense"]
    )

    liquidity_runway = row["savings"] / total_spend
    leverage = total_spend / row["income"]

    return liquidity_runway, leverage