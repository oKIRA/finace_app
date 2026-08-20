import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  ArrowLeftRight,
  Clock,
  Plus,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { formatCurrency } from '../../lib/utils/formatters';
import { formatDateBR } from '../../lib/utils/dates';
import { DynamicIcon } from '../ui/DynamicIcon';
import { Category } from '../../types';

export const RecentTransactions: React.FC<{ onNavigateToTransactions: () => void }> = ({
  onNavigateToTransactions,
}) => {
  const { transactions, categories, openTransactionModal } = useFinanceData();

  const recentList = transactions.slice(0, 5);
  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
            Gastos Recentes
          </h3>
          <p className="text-xs text-slate-400 truncate">Últimas movimentações deste mês</p>
        </div>
        <button
          onClick={onNavigateToTransactions}
          id="btn-view-all-transactions"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0"
        >
          Ver Todas ({transactions.length})
        </button>
      </div>

      {recentList.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-600">Nenhum lançamento no período</p>
          <button
            onClick={() => openTransactionModal('expense')}
            id="btn-empty-add-trans"
            className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Transação
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentList.map((t) => {
            const cat = catMap.get(t.categoryId);
            const isIncome = t.type === 'income';
            const isCard = t.type === 'card_expense';
            const isTransfer = t.type === 'transfer';

            return (
              <div key={t.id} className="py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3 group min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${cat?.color || '#94A3B8'}15`,
                      borderColor: `${cat?.color || '#94A3B8'}30`,
                      color: cat?.color || '#64748B',
                    }}
                  >
                    {cat?.icon ? (
                      <DynamicIcon name={cat.icon} className="w-4 h-4" />
                    ) : isIncome ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    ) : isCard ? (
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    ) : isTransfer ? (
                      <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{t.description}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 truncate">
                      <span className="truncate">{cat?.name || (isTransfer ? 'Transferência' : 'Geral')}</span>
                      <span>•</span>
                      <span className="shrink-0">{formatDateBR(t.date)}</span>
                      {t.isInstallment && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 font-semibold shrink-0">
                            {t.currentInstallment}/{t.totalInstallments}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`text-xs font-black whitespace-nowrap ${
                      isIncome
                        ? 'text-emerald-600'
                        : isTransfer
                        ? 'text-blue-600'
                        : isCard
                        ? 'text-purple-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
