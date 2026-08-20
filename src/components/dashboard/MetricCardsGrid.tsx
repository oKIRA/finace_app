import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { formatCurrency } from '../../lib/utils/formatters';

export const MetricCardsGrid: React.FC = () => {
  const { summary } = useFinanceData();

  const cards = [
    {
      id: 'metric-card-total-balance',
      title: 'Saldo Atual',
      amount: summary.totalBalance,
      subtitle: 'Total em todas as contas',
      icon: Wallet,
      color: 'text-slate-900',
      bgIcon: 'bg-slate-100 text-slate-700',
      borderAccent: 'border-slate-200',
    },
    {
      id: 'metric-card-income',
      title: 'Entradas',
      amount: summary.monthIncome,
      subtitle: 'Recebido este mês',
      icon: ArrowUpRight,
      color: 'text-emerald-600',
      bgIcon: 'bg-emerald-50 text-emerald-600',
      borderAccent: 'border-emerald-100',
    },
    {
      id: 'metric-card-expenses',
      title: 'Despesas',
      amount: summary.monthExpense,
      subtitle: 'Gastos totais do mês',
      icon: ArrowDownRight,
      color: 'text-rose-600',
      bgIcon: 'bg-rose-50 text-rose-600',
      borderAccent: 'border-rose-100',
    },
    {
      id: 'metric-card-cards',
      title: 'Faturas Cartões',
      amount: summary.monthInvoicesTotal,
      subtitle: 'Compras & parcelas no cartão',
      icon: CreditCard,
      color: 'text-purple-600',
      bgIcon: 'bg-purple-50 text-purple-600',
      borderAccent: 'border-purple-100',
    },
    {
      id: 'metric-card-available',
      title: 'Disponível',
      amount: summary.availableBalance,
      subtitle: 'Livre após faturas pendentes',
      icon: CheckCircle2,
      color: summary.availableBalance >= 0 ? 'text-blue-600' : 'text-amber-600',
      bgIcon: 'bg-blue-50 text-blue-600',
      borderAccent: 'border-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            id={c.id}
            className={`bg-white rounded-2xl p-4 sm:p-5 border ${c.borderAccent} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.bgIcon}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-xl sm:text-2xl font-black tracking-tight ${c.color}`}>
                {formatCurrency(c.amount)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{c.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
