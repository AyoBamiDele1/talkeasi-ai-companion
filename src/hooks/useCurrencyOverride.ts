import { useState, useEffect } from 'react';

export type Currency = 'NGN' | 'USD' | 'GBP';

const OVERRIDE_KEY = 'currency_override';

export const useCurrencyOverride = () => {
  const [override, setOverride] = useState<Currency | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(OVERRIDE_KEY);
    if (stored && ['NGN', 'USD', 'GBP'].includes(stored)) {
      setOverride(stored as Currency);
    }
  }, []);

  const setCurrencyOverride = (currency: Currency) => {
    localStorage.setItem(OVERRIDE_KEY, currency);
    setOverride(currency);
  };

  const clearCurrencyOverride = () => {
    localStorage.removeItem(OVERRIDE_KEY);
    setOverride(null);
  };

  return {
    override,
    hasOverride: override !== null,
    setCurrencyOverride,
    clearCurrencyOverride,
  };
};
