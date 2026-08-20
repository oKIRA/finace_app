/**
 * Date Utilities tailored for pt-BR and financial month periods.
 * Uses string-based ISO date parts (YYYY-MM-DD) to prevent timezone drift bugs.
 */

export const MONTH_NAMES_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MONTH_NAMES_SHORT_BR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function getMonthNameBR(monthNumber: number): string {
  // monthNumber is 1-indexed (1 = Janeiro, 12 = Dezembro)
  const idx = Math.max(1, Math.min(12, monthNumber)) - 1;
  return MONTH_NAMES_BR[idx];
}

export function getShortMonthNameBR(monthNumber: number): string {
  const idx = Math.max(1, Math.min(12, monthNumber)) - 1;
  return MONTH_NAMES_SHORT_BR[idx];
}

export function formatMonthYear(year: number, month: number): string {
  return `${getMonthNameBR(month)} de ${year}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

export function formatDateShortBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
  }
  return dateStr;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
    };
  }
  return { year: 2026, month: 8, day: 1 };
}

/**
 * Given a purchase date (YYYY-MM-DD) and the card closing day (e.g. 2nd) and due day (e.g. 9th),
 * determines which invoice month (YYYY-MM) the purchase belongs to.
 */
export function getInvoiceMonthForPurchase(
  purchaseDateStr: string,
  closingDay: number
): { year: number; month: number; invoiceMonthStr: string } {
  const { year, month, day } = parseDateParts(purchaseDateStr);

  let invoiceYear = year;
  let invoiceMonth = month;

  // If purchase is ON or AFTER the closing day, it rolls into the next month's invoice
  if (day >= closingDay) {
    invoiceMonth += 1;
    if (invoiceMonth > 12) {
      invoiceMonth = 1;
      invoiceYear += 1;
    }
  }

  const invoiceMonthStr = `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}`;
  return { year: invoiceYear, month: invoiceMonth, invoiceMonthStr };
}

/**
 * Calculates the exact due date (YYYY-MM-DD) for a given invoice month and due day
 */
export function getInvoiceDueDate(year: number, month: number, dueDay: number): string {
  const dayStr = String(Math.min(28, Math.max(1, dueDay))).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Returns an array of previous N months including the given month
 */
export function getPastMonthsList(currentYear: number, currentMonth: number, count = 6): Array<{ year: number; month: number; label: string }> {
  const list = [];
  let y = currentYear;
  let m = currentMonth;

  for (let i = 0; i < count; i++) {
    list.unshift({
      year: y,
      month: m,
      label: `${getShortMonthNameBR(m)}/${String(y).slice(-2)}`,
    });
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return list;
}
