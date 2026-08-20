import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useDateFilter } from '../../context/DateFilterContext';
import { getPastMonthsList } from '../../lib/utils/dates';
import { formatCurrency } from '../../lib/utils/formatters';

export const IncomeVsExpenseChart: React.FC = () => {
  const { allTransactions } = useFinanceData();
  const { selectedYear, selectedMonth } = useDateFilter();

  const pastMonths = getPastMonthsList(selectedYear, selectedMonth, 6);

  const chartData = pastMonths.map((m) => {
    const periodStr = `${m.year}-${String(m.month).padStart(2, '0')}`;

    // Direct Income
    const income = allTransactions
      .filter((t) => t.type === 'income' && t.year === m.year && t.month === m.month)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Direct Expense
    const directExp = allTransactions
      .filter((t) => t.type === 'expense' && t.year === m.year && t.month === m.month)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Card Expense
    const cardExp = allTransactions
      .filter((t) => {
        if (t.type !== 'card_expense') return false;
        if (t.invoiceMonth) return t.invoiceMonth === periodStr;
        return t.year === m.year && t.month === m.month;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = directExp + cardExp;

    return {
      monthLabel: m.label,
      receitas: income / 100,
      despesas: expense / 100,
      rawIncome: income,
      rawExpense: expense,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
          <p className="font-bold text-slate-200">{label}</p>
          <p className="text-emerald-400 font-semibold">
            Entradas: {formatCurrency(data.rawIncome)}
          </p>
          <p className="text-rose-400 font-semibold">
            Despesas: {formatCurrency(data.rawExpense)}
          </p>
          <p className="text-slate-300 pt-1 border-t border-slate-700 font-medium">
            Resultado:{' '}
            <span
              className={
                data.rawIncome - data.rawExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }
            >
              {formatCurrency(data.rawIncome - data.rawExpense, true)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
            Entradas vs Despesas
          </h3>
          <p className="text-xs text-slate-400 truncate">Histórico dos últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Entradas
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            Despesas
          </span>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748B' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
