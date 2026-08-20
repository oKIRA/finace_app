import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  X,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { budgetsService } from '../../services/budgetsService';
import { formatCurrency, formatPercent } from '../../lib/utils/formatters';
import { Budget, Category } from '../../types';

export const BudgetsView: React.FC = () => {
  const { user } = useAuth();
  const { budgets, categories, categoryExpenses, refreshData } = useFinanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const expenseMap = new Map<string, number>(categoryExpenses.map((c) => [c.categoryId, c.amount]));

  const openAddModal = () => {
    if (expenseCategories.length > 0) {
      setSelectedCategoryId(expenseCategories[0].id);
    }
    setLimitStr('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let targetCatId = selectedCategoryId;
    if (!targetCatId && expenseCategories.length > 0) {
      targetCatId = expenseCategories[0].id;
    }

    if (!targetCatId) {
      setErrorMsg('Nenhuma categoria de despesa disponível para orçamento.');
      return;
    }

    let cleaned = limitStr.replace(/[R$\s]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const amountFloat = parseFloat(cleaned) || 0;

    if (amountFloat <= 0) {
      setErrorMsg('Informe um limite válido maior que zero (ex: 500,00).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await budgetsService.setCategoryBudget(
        user.uid,
        targetCatId,
        Math.round(amountFloat * 100)
      );
      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao salvar orçamento: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b: Budget) => {
    if (!user) return;
    if (window.confirm('Deseja remover o limite desta categoria?')) {
      try {
        await budgetsService.deleteBudget(user.uid, b.id);
        await refreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + (expenseMap.get(b.categoryId) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Planejamento & Tetos de Gastos
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            Orçamento Mensal
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Gasto total de {formatCurrency(totalBudgetSpent)} de {formatCurrency(totalBudgetLimit)} orçados
          </p>
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-budget"
          className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Definir Novo Limite
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {budgets.map((b) => {
          const cat = catMap.get(b.categoryId);
          const spent = expenseMap.get(b.categoryId) || 0;
          const remaining = b.amount - spent;
          const percentage = Math.min(100, (spent / b.amount) * 100);
          const isExceeded = spent > b.amount;
          const isWarning = percentage >= 80 && !isExceeded;

          return (
            <div
              key={b.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#10B981' }}
                    />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                      {cat?.name || 'Categoria'}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDelete(b)}
                    title="Excluir Limite"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Amount details */}
                <div className="flex items-baseline justify-between text-xs my-2 gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base truncate">
                    {formatCurrency(spent)}
                  </span>
                  <span className="text-slate-400 font-medium shrink-0">
                    de {formatCurrency(b.amount)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold mt-1">
                  <span className={isExceeded ? 'text-rose-600 font-bold truncate' : 'text-slate-500 truncate'}>
                    {isExceeded
                      ? `Estourou em ${formatCurrency(Math.abs(remaining))}`
                      : `Restam ${formatCurrency(remaining)}`}
                  </span>
                  <span className="text-slate-400 shrink-0 ml-2">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                Definir Limite de Gastos
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Teto Limite Mensal (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 800,00"
                  value={limitStr}
                  onChange={(e) => setLimitStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
