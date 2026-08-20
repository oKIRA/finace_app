import { Account, CreditCard, Transaction, RecurringBill, Category, MonthSummary } from '../../types';

export function calculateMonthSummary(
  accounts: Account[],
  transactions: Transaction[],
  cards: CreditCard[],
  recurring: RecurringBill[],
  selectedYear: number,
  selectedMonth: number
): MonthSummary {
  // 1. Total balance of all active accounts
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

  // Filter transactions for this exact period
  const periodMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Direct Incomes for the month
  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.year === selectedYear && t.month === selectedMonth)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Direct Expenses from accounts (cash, debit, pix, etc.)
  const directExpenses = transactions
    .filter((t) => t.type === 'expense' && t.year === selectedYear && t.month === selectedMonth)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Credit Card expenses associated with this month's invoice cycle
  const cardExpenses = transactions
    .filter((t) => {
      if (t.type !== 'card_expense') return false;
      // If invoiceMonth is recorded, match it; otherwise match year and month
      if (t.invoiceMonth) return t.invoiceMonth === periodMonthStr;
      return t.year === selectedYear && t.month === selectedMonth;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Card Payments (settlement of obligations) - for tracking invoice payments
  const cardPayments = transactions
    .filter((t) => t.type === 'card_payment' && t.year === selectedYear && t.month === selectedMonth)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Total Real Monthly Expense = Direct Expenses + Card Purchases
  const monthExpense = directExpenses + cardExpenses;

  // Total Invoices Amount due this month
  const monthInvoicesTotal = cardExpenses;

  // Net Result (Surplus/Deficit)
  const netMonthResult = monthIncome - monthExpense;

  // Unpaid portion of this month's invoices
  const unpaidInvoices = Math.max(0, monthInvoicesTotal - cardPayments);

  // Remaining recurring bills for this month that haven't passed or been paid
  const pendingRecurringExpenses = recurring
    .filter((r) => r.active && r.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingRecurringIncome = recurring
    .filter((r) => r.active && r.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Available balance after reserving for unpaid obligations
  const availableBalance = totalBalance - unpaidInvoices;

  // Projected end of month balance
  const projectedEndBalance = totalBalance + pendingRecurringIncome - pendingRecurringExpenses - unpaidInvoices;

  return {
    totalBalance,
    monthIncome,
    monthExpense,
    monthCardExpenses: cardExpenses,
    monthInvoicesTotal,
    netMonthResult,
    availableBalance,
    projectedEndBalance,
  };
}

export interface CategoryExpenseBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export function calculateExpensesByCategory(
  transactions: Transaction[],
  categories: Category[],
  selectedYear: number,
  selectedMonth: number
): CategoryExpenseBreakdown[] {
  const periodMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const categoryTotals: Record<string, number> = {};

  transactions.forEach((t) => {
    // Include both direct expense and card expense for this month
    const isDirectExpense = t.type === 'expense' && t.year === selectedYear && t.month === selectedMonth;
    const isCardExpense =
      t.type === 'card_expense' &&
      (t.invoiceMonth ? t.invoiceMonth === periodMonthStr : t.year === selectedYear && t.month === selectedMonth);

    if (isDirectExpense || isCardExpense) {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    }
  });

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  if (totalExpense === 0) return [];

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      return {
        categoryId: catId,
        categoryName: cat?.name || 'Outros',
        categoryColor: cat?.color || '#94A3B8',
        categoryIcon: cat?.icon || 'Tag',
        amount,
        percentage: (amount / totalExpense) * 100,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface SmartInsight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export function generateSmartInsights(
  summary: MonthSummary,
  categoryBreakdown: CategoryExpenseBreakdown[],
  cards: CreditCard[],
  allTransactions: Transaction[],
  selectedYear: number,
  selectedMonth: number
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // 1. Top expense category insight
  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    insights.push({
      id: 'top-cat',
      text: `${top.categoryName} é sua maior categoria de despesas este mês (${top.percentage.toFixed(0)}% do total gasto).`,
      type: top.percentage > 40 ? 'warning' : 'info',
    });
  }

  // 2. Card limit usage insight
  if (cards.length > 0 && summary.monthCardExpenses > 0) {
    const totalLimit = cards.reduce((acc, c) => acc + c.limit, 0);
    if (totalLimit > 0) {
      const usagePercent = (summary.monthCardExpenses / totalLimit) * 100;
      if (usagePercent > 70) {
        insights.push({
          id: 'card-limit-high',
          text: `Atenção: Suas faturas somam ${usagePercent.toFixed(0)}% do seu limite total de cartões.`,
          type: 'alert',
        });
      } else {
        insights.push({
          id: 'card-limit-normal',
          text: `Sua fatura atual representa ${usagePercent.toFixed(0)}% do seu limite total disponível.`,
          type: 'info',
        });
      }
    }
  }

  // 3. Future installments insight
  const currentPeriodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const futureInstallments = allTransactions.filter(
    (t) => t.isInstallment && t.invoiceMonth && t.invoiceMonth > currentPeriodStr
  );
  const futureTotal = futureInstallments.reduce((acc, t) => acc + t.amount, 0);
  if (futureTotal > 0) {
    insights.push({
      id: 'future-installments',
      text: `Você possui R$ ${(futureTotal / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em parcelas futuras já programadas.`,
      type: 'info',
    });
  }

  // 4. Month balance surplus or deficit
  if (summary.monthIncome > 0 || summary.monthExpense > 0) {
    if (summary.netMonthResult > 0) {
      insights.push({
        id: 'surplus',
        text: `Você está economizando R$ ${(summary.netMonthResult / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} este mês (+${summary.monthIncome > 0 ? ((summary.netMonthResult / summary.monthIncome) * 100).toFixed(0) : 0}% da renda).`,
        type: 'success',
      });
    } else if (summary.netMonthResult < 0) {
      insights.push({
        id: 'deficit',
        text: `Atenção: As despesas deste mês superam as receitas em R$ ${(Math.abs(summary.netMonthResult) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        type: 'alert',
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 'welcome',
      text: 'Cadastre suas contas e transações para visualizar análises inteligentes automáticas.',
      type: 'info',
    });
  }

  return insights;
}
