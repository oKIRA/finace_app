import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  X,
  Check,
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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Planejamento & Tetos de Gastos
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Orçamento Mensal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gasto total de {formatCurrency(totalBudgetSpent)} de {formatCurrency(totalBudgetLimit)} orçados
          </p>
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-budget"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Definir Novo Limite
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#94A3B8' }}
                    />
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                      {cat?.name || 'Categoria'}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDelete(b)}
                    className="p-1 rounded-md text-slate-300 hover:text-rose-600"
                    title="Remover Limite"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Gasto: {formatCurrency(spent)}</span>
                    <span className="text-slate-900">Limite: {formatCurrency(b.amount)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (spent / b.amount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    {isExceeded ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Excedido em{' '}
                        {formatCurrency(Math.abs(remaining))}
                      </span>
                    ) : isWarning ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Restam {formatCurrency(remaining)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Restam {formatCurrency(remaining)}
                      </span>
                    )}
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {((spent / b.amount) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Definir Orçamento por Categoria</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Limite Mensal (R$)
                </label>
                <input
                  type="text"
                  value={limitStr}
                  onChange={(e) => setLimitStr(e.target.value)}
                  placeholder="Ex: 1500,00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
