import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AED", "SGD", "AUD", "CAD", "BRL"] as const;
export type CurrencyCode = typeof CURRENCIES[number];

const fallbackRates: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.4,
  JPY: 156,
  AED: 3.67,
  SGD: 1.35,
  AUD: 1.51,
  CAD: 1.37,
  BRL: 5.25
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useCurrencyRates() {
  return useQuery({
    queryKey: ["rates"],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const response = await fetch("/api/rates", { headers: await authHeaders() });
      if (!response.ok) return fallbackRates;
      const json = await response.json();
      return { ...fallbackRates, ...json.rates } as Record<CurrencyCode, number>;
    }
  });
}

export function convertFromUsd(value: number, currency: CurrencyCode, rates: Record<CurrencyCode, number> = fallbackRates): number {
  return Math.round(value * (rates[currency] ?? 1));
}

export function convertFromInr(value: number, currency: CurrencyCode, rates: Record<CurrencyCode, number> = fallbackRates): number {
  const usd = value / (rates.INR || fallbackRates.INR);
  return Math.round(usd * (rates[currency] ?? 1));
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}
