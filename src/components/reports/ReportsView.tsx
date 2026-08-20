import React, { useState } from 'react';
import {
  FileBarChart2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  CreditCard,
  Landmark,
  Calculator,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useDateFilter } from '../../context/DateFilterContext';
import { formatCurrency, formatPercent } from '../../lib/utils/formatters';
import { getMonthNameBR, getPastMonthsList } from '../../lib/utils/dates';

export const ReportsView: React.FC = () => {
  const { allTransactions, accounts, cards, categories, recurring, summary } = useFinanceData();
  const { selectedYear, selectedMonth } = useDateFilter();

  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Month comparisons (Current month vs Previous month)
  let prevYear = selectedYear;
  let prevMonth = selectedMonth - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentPeriodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const prevPeriodStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  // Current Month calculations
  const curIncome = allTransactions
    .filter((t) => t.type === 'income' && t.year === selectedYear && t.month === selectedMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const curExpense = allTransactions
    .filter((t) => {
      const isDirect = t.type === 'expense' && t.year === selectedYear && t.month === selectedMonth;
      const isCard =
        t.type === 'card_expense' &&
        (t.invoiceMonth ? t.invoiceMonth === currentPeriodStr : t.year === selectedYear && t.month === selectedMonth);
      return isDirect || isCard;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Previous Month calculations
  const prevIncome = allTransactions
    .filter((t) => t.type === 'income' && t.year === prevYear && t.month === prevMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const prevExpense = allTransactions
    .filter((t) => {
      const isDirect = t.type === 'expense' && t.year === prevYear && t.month === prevMonth;
      const isCard =
        t.type === 'card_expense' &&
        (t.invoiceMonth ? t.invoiceMonth === prevPeriodStr : t.year === prevYear && t.month === prevMonth);
      return isDirect || isCard;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseVariationPercent =
    prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;

  // Forecast calculations
  const recurringPendingIncome = recurring
    .filter((r) => r.active && r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const recurringPendingExpense = recurring
    .filter((r) => r.active && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const projectedEndingBalance =
    summary.totalBalance + recurringPendingIncome - recurringPendingExpense;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Análises Financeiras & Previsão
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Relatórios Comparativos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {getMonthNameBR(selectedMonth)} de {selectedYear}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setReportPeriod('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportPeriod === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Mês Ativo
          </button>
          <button
            onClick={() => setReportPeriod('year')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportPeriod === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Ano {selectedYear}
          </button>
        </div>
      </div>

      {/* Financial Forecast Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-6 text-white shadow-md border border-emerald-800/40">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-white">
              Previsão de Fechamento do Mês
            </h3>
            <p className="text-xs text-emerald-300/80">
              Projeção calculada com base no saldo atual e lançamentos fixos programados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800">
          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="block text-[11px] font-bold text-slate-400 uppercase">
              Saldo Atual em Contas
            </span>
            <span className="text-lg font-black text-white mt-1 block">
              {formatCurrency(summary.totalBalance)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="block text-[11px] font-bold text-emerald-400 uppercase">
              + Entradas Previstas
            </span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">
              {formatCurrency(recurringPendingIncome)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="block text-[11px] font-bold text-rose-400 uppercase">
              - Despesas Previstas
            </span>
            <span className="text-lg font-black text-rose-400 mt-1 block">
              {formatCurrency(recurringPendingExpense)}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-900/40 rounded-2xl border border-emerald-600/40">
            <span className="block text-[11px] font-black text-emerald-300 uppercase">
              = Saldo Projetado
            </span>
            <span className="text-xl font-black text-emerald-300 mt-1 block">
              {formatCurrency(projectedEndingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Month over Month Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
              Comparativo Mensal
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Comparando {getMonthNameBR(selectedMonth)} com {getMonthNameBR(prevMonth)}
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">
                    {getMonthNameBR(prevMonth)}
                  </span>
                  <p className="text-xs text-slate-600 mt-1">
                    Entradas: <b className="text-emerald-700">{formatCurrency(prevIncome)}</b>
                  </p>
                  <p className="text-xs text-slate-600">
                    Despesas: <b className="text-rose-700">{formatCurrency(prevExpense)}</b>
                  </p>
                </div>
                <div className="text-right font-black text-sm text-slate-800">
                  {formatCurrency(prevIncome - prevExpense, true)}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase block">
                    {getMonthNameBR(selectedMonth)} (Atual)
                  </span>
                  <p className="text-xs text-slate-700 mt-1">
                    Entradas: <b className="text-emerald-700">{formatCurrency(curIncome)}</b>
                  </p>
                  <p className="text-xs text-slate-700">
                    Despesas: <b className="text-rose-700">{formatCurrency(curExpense)}</b>
                  </p>
                </div>
                <div className="text-right font-black text-sm text-emerald-900">
                  {formatCurrency(curIncome - curExpense, true)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Variação de Despesas</span>
            <span
              className={`flex items-center gap-1 font-extrabold ${
                expenseVariationPercent <= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {expenseVariationPercent <= 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {formatPercent(Math.abs(expenseVariationPercent))}
            </span>
          </div>
        </div>

        {/* Expenses by Payment Account / Method */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
              Gastos por Conta & Cartão
            </h3>
            <p className="text-xs text-slate-400 mb-4">Origem dos débitos e faturas</p>

            <div className="space-y-3">
              {accounts.map((acc) => {
                const accSpent = allTransactions
                  .filter(
                    (t) =>
                      t.accountId === acc.id &&
                      t.type === 'expense' &&
                      t.year === selectedYear &&
                      t.month === selectedMonth
                  )
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div key={acc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-800">{acc.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{formatCurrency(accSpent)}</span>
                  </div>
                );
              })}

              {cards.map((card) => {
                const cardSpent = allTransactions
                  .filter(
                    (t) =>
                      t.cardId === card.id &&
                      t.type === 'card_expense' &&
                      (t.invoiceMonth ? t.invoiceMonth === currentPeriodStr : true)
                  )
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div key={card.id} className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-purple-950">{card.name}</span>
                    </div>
                    <span className="font-extrabold text-purple-900">{formatCurrency(cardSpent)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
