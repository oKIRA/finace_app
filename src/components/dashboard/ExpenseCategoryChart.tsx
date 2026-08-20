import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinanceData } from '../../context/FinanceDataContext';
import { formatCurrency, formatPercent } from '../../lib/utils/formatters';
import { PieChart as PieIcon } from 'lucide-react';

export const ExpenseCategoryChart: React.FC = () => {
  const { categoryExpenses, summary } = useFinanceData();

  const data = categoryExpenses.map((c) => ({
    name: c.categoryName,
    value: c.amount / 100,
    color: c.categoryColor,
    rawAmount: c.amount,
    percentage: c.percentage,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-700">Sem despesas registradas</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Nenhuma despesa ou compra no cartão foi lançada para este mês ainda.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-800">
          <p className="font-bold flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </p>
          <p className="text-slate-300 mt-1">
            {formatCurrency(item.rawAmount)} ({formatPercent(item.percentage)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Gastos por Categoria</h3>
          <p className="text-xs text-slate-400">Distribuição percentual de saídas</p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          Total: {formatCurrency(summary.monthExpense)}
        </span>
      </div>

      <div className="h-52 w-full my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Table / Chips */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 max-h-36 overflow-y-auto custom-scrollbar">
        {categoryExpenses.slice(0, 6).map((c) => (
          <div key={c.categoryId} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: c.categoryColor }}
              />
              <span className="text-slate-700 font-medium truncate">{c.categoryName}</span>
            </div>
            <span className="font-bold text-slate-900 shrink-0 ml-1">
              {c.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
