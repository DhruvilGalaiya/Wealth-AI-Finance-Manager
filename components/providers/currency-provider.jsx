"use client";

import { createContext, useCallback, useContext } from "react";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/currency";

const CurrencyContext = createContext(DEFAULT_CURRENCY);

export function CurrencyProvider({ currency, children }) {
  return (
    <CurrencyContext.Provider value={currency || DEFAULT_CURRENCY}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

// const money = useMoney(); money(12.5) => "$12.50"
export function useMoney() {
  const currency = useCurrency();
  return useCallback((amount, opts) => formatMoney(amount, currency, opts), [currency]);
}
