import React from 'react';
import { CalendarClock, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useDateFilter } from '../../context/DateFilterContext';
import { formatCurrency } from '../../lib/utils/formatters';
import { CreditCard } from '../../types';

export const UpcomingBills: React.FC = () => {
  const { recurring, invoices, cards } = useFinanceData();
  const { selectedMonth, selectedYear } = useDateFilter();

  const cardMap = new Map<string, CreditCard>(cards.map((c) => [c.id, c]));

  // 1. Recurring bills for this month
  const recurringItems = recurring
    .filter((r) => r.active)
    .map((r) => {
      const dayStr = String(r.dueDay).padStart(2, '0');
      const monthStr = String(selectedMonth).padStart(2, '0');
      const dueDateStr = `${dayStr}/${monthStr}`;

      return {
        id: `rec-${r.id}`,
        title: r.name,
        amount: r.amount,
        dueDay: r.dueDay,
        dueDateStr,
        type: r.type,
        status: 'open' as const,
      };
    });

  // 2. Card Invoices due this month
  const invoiceItems = invoices
    .filter((i) => i.amount > 0)
    .map((i) => {
      const card = cardMap.get(i.cardId);
      const dueDay = card ? card.dueDay : 10;
      const dayStr = String(dueDay).padStart(2, '0');
      const monthStr = String(selectedMonth).padStart(2, '0');

      return {
        id: `inv-${i.id}`,
        title: `Fatura ${card?.name || 'Cartão'}`,
        amount: i.amount,
        dueDay,
        dueDateStr: `${dayStr}/${monthStr}`,
        type: 'expense' as const,
        status: i.status,
      };
    });

  const allItems = [...recurringItems, ...invoiceItems].sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Próximos Vencimentos</h3>
          <p className="text-xs text-slate-400">Contas fixas e faturas deste mês</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
          <CalendarClock className="w-4 h-4" />
        </div>
      </div>

      {allItems.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-600">Nenhum vencimento programado</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cadastre contas recorrentes na aba "Recorrentes".
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {allItems.map((item) => {
            const isPaid = item.status === 'paid';
            const isOverdue = item.status === 'overdue';

            return (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-400">Vencimento: {item.dueDateStr}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(item.amount)}
                  </span>

                  {isPaid ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Pago
                    </span>
                  ) : isOverdue ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Atrasado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      Aberto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
