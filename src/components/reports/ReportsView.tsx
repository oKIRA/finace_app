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
import { getMonthNameBR } from '../../lib/utils/dates';

export const ReportsView: React.FC = () => {
  const { allTransactions, recurring, summary } = useFinanceData();
  const { selectedYear, selectedMonth } = useDateFilter();

  const [reportPeriod, setReportPeriod] = useState<'month' | 'year'>('month');

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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Análises Financeiras & Previsão
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            Relatórios Comparativos
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {getMonthNameBR(selectedMonth)} de {selectedYear}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto shrink-0">
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
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-800/40">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
              Previsão de Fechamento do Mês
            </h3>
            <p className="text-xs text-emerald-300/80 truncate">
              Projeção calculada com base no saldo atual e lançamentos fixos programados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-4 border-t border-slate-800">
          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">
              Saldo Atual em Contas
            </span>
            <span className="text-base sm:text-lg font-black text-white mt-1 block truncate" title={formatCurrency(summary.totalBalance)}>
              {formatCurrency(summary.totalBalance)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">
              Recorrentes a Receber
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 mt-1 block truncate" title={formatCurrency(recurringPendingIncome)}>
              + {formatCurrency(recurringPendingIncome)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">
              Recorrentes a Pagar
            </span>
            <span className="text-base sm:text-lg font-black text-rose-400 mt-1 block truncate" title={formatCurrency(recurringPendingExpense)}>
              - {formatCurrency(recurringPendingExpense)}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-900/40 rounded-2xl border border-emerald-500/40 min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-bold text-emerald-300 uppercase">
              Saldo Projetado
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-300 mt-1 block truncate" title={formatCurrency(projectedEndingBalance)}>
              {formatCurrency(projectedEndingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Month vs Month Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Comparativo Mensal
              </h3>
              <p className="text-xs text-slate-400 truncate">Mês Atual vs Mês Anterior</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4">
            {/* Income Comparison */}
            <div className="p-3.5 bg-slate-50 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">Receitas</span>
                <span className="text-emerald-600 font-black">{formatCurrency(curIncome)}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Mês Anterior: {formatCurrency(prevIncome)}
              </p>
            </div>

            {/* Expense Comparison */}
            <div className="p-3.5 bg-slate-50 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">Despesas Totais</span>
                <span className="text-rose-600 font-black">{formatCurrency(curExpense)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Mês Anterior: {formatCurrency(prevExpense)}</span>
                <span
                  className={`font-bold ${
                    expenseVariationPercent > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {expenseVariationPercent > 0 ? '+' : ''}
                  {expenseVariationPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Taxa de Poupança
                </h3>
                <p className="text-xs text-slate-400 truncate">Percentual guardado da receita</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {(() => {
              const saved = curIncome - curExpense;
              const rate = curIncome > 0 ? Math.max(0, (saved / curIncome) * 100) : 0;

              return (
                <div className="space-y-3 my-2">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {rate.toFixed(1)}%
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, rate)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Você economizou {formatCurrency(Math.max(0, saved))} das suas receitas este mês.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
