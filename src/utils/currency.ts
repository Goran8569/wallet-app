import { CURRENCY_MAP } from "../types";

export const getCurrencyCode = (currencyId: number): string => {
  return CURRENCY_MAP[currencyId] || "USD";
};

export const getCurrencyId = (currencyCode: string): number | null => {
  const entry = Object.entries(CURRENCY_MAP).find(([_, code]) => code === currencyCode);
  return entry ? parseInt(entry[0]) : null;
};
