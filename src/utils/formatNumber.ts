export function formatNumber(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 1_000_000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (value / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
}
