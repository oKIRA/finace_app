/**
 * Currency & Number Formatters
 * Always handles money in integer cents to avoid floating point inaccuracies.
 */

export function formatCurrency(cents: number | undefined | null, showSign = false): string {
  if (cents === undefined || cents === null || isNaN(cents)) {
    return 'R$ 0,00';
  }

  const isNegative = cents < 0;
  const absValue = Math.abs(cents) / 100;

  const formatted = absValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isNegative) {
    return `- ${formatted}`;
  }

  if (showSign && cents > 0) {
    return `+ ${formatted}`;
  }

  return formatted;
}

export function parseCurrencyToCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }

  if (!value || typeof value !== 'string') {
    return 0;
  }

  // Remove currency symbol, whitespace, dots, and convert comma to dot
  const cleanStr = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatPercent(value: number, decimals = 1): string {
  if (isNaN(value)) return '0%';
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}
