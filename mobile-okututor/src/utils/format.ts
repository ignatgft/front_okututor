export function formatPrice(value: number | null | undefined, currency?: string | null): string {
  if (value == null) return "—";
  const formatted = Math.abs(value % 1) < Number.EPSILON ? String(value) : value.toFixed(2);
  return `${formatted} ${(currency || "KGS").toUpperCase()}`;
}