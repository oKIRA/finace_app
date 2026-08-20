import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  PiggyBank,
  CheckCircle,
  Calendar,
  Sparkles,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { goalsService } from '../../services/goalsService';
import { formatCurrency, formatPercent } from '../../lib/utils/formatters';
import { formatDateBR } from '../../lib/utils/dates';
import { FinancialGoal } from '../../types';

export const GoalsView: React.FC = () => {
  const { user } = useAuth();
  const { goals, refreshData } = useFinanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10B981');
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setSelectedGoal(null);
    setName('');
    setTargetAmountStr('');
    setCurrentAmountStr('0,00');
    setTargetDate('');
    setDescription('');
    setColor('#10B981');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openDepositModal = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setDepositAmountStr('');
    setErrorMsg(null);
    setIsDepositModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome da meta.');
      return;
    }

    let cleanedTarget = targetAmountStr.replace(/[R$\s]/g, '');
    if (cleanedTarget.includes('.') && cleanedTarget.includes(',')) {
      cleanedTarget = cleanedTarget.replace(/\./g, '').replace(',', '.');
    } else if (cleanedTarget.includes(',')) {
      cleanedTarget = cleanedTarget.replace(',', '.');
    }
    const targetFloat = parseFloat(cleanedTarget) || 0;

    let cleanedCurrent = currentAmountStr.replace(/[R$\s]/g, '');
    if (cleanedCurrent.includes('.') && cleanedCurrent.includes(',')) {
      cleanedCurrent = cleanedCurrent.replace(/\./g, '').replace(',', '.');
    } else if (cleanedCurrent.includes(',')) {
      cleanedCurrent = cleanedCurrent.replace(',', '.');
    }
    const currentFloat = parseFloat(cleanedCurrent) || 0;

    if (targetFloat <= 0) {
      setErrorMsg('Informe um valor objetivo maior que zero.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await goalsService.createGoal(user.uid, {
        name: name.trim(),
        targetAmount: Math.round(targetFloat * 100),
        currentAmount: Math.round(currentFloat * 100),
        targetDate: targetDate || undefined,
        description: description.trim() || undefined,
        color,
        icon: 'Target',
      });

      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao salvar meta: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal) return;

    let cleaned = depositAmountStr.replace(/[R$\s]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const depositFloat = parseFloat(cleaned) || 0;

    if (depositFloat <= 0) {
      setErrorMsg('Informe um valor de aporte maior que zero.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await goalsService.depositToGoal(
        user.uid,
        selectedGoal.id,
        Math.round(depositFloat * 100)
      );
      await refreshData();
      setIsDepositModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao registrar aporte na meta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (g: FinancialGoal) => {
    if (!user) return;
    if (window.confirm(`Deseja excluir a meta "${g.name}"?`)) {
      try {
        await goalsService.deleteGoal(user.uid, g.id);
        await refreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sonhos & Planejamento Futuro
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            Metas Financeiras
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Acompanhe o progresso de suas economias e reservas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-goal"
          className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Meta
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {goals.map((g) => {
          const percentage = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
          const isAchieved = g.currentAmount >= g.targetAmount;

          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden min-w-0"
            >
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: g.color || '#10B981' }}
              />

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: g.color || '#10B981' }}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{g.name}</h3>
                      {g.targetDate && (
                        <p className="text-xs text-slate-400 font-medium truncate">
                          Até {formatDateBR(g.targetDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(g)}
                    title="Excluir Meta"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Details */}
                <div className="space-y-1.5 my-3 sm:my-4">
                  <div className="flex items-center justify-between text-xs font-bold gap-2">
                    <span className="text-slate-500">Acumulado</span>
                    <span className="text-emerald-700 font-black truncate">
                      {formatCurrency(g.currentAmount)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold gap-2">
                    <span className="truncate">Objetivo: {formatCurrency(g.targetAmount)}</span>
                    <span className="shrink-0">{percentage.toFixed(0)}%</span>
                  </div>
                </div>

                {g.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 my-2">{g.description}</p>
                )}
              </div>

              {/* Action */}
              <div className="mt-3 sm:mt-4 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openDepositModal(g)}
                  id={`btn-deposit-goal-${g.id}`}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <PiggyBank className="w-3.5 h-3.5" /> + Fazer Aporte
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
                Aportar em {selectedGoal.name}
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
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

            <form onSubmit={handleExecuteDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Valor do Aporte (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 200,00"
                  value={depositAmountStr}
                  onChange={(e) => setDepositAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Nova Meta Financeira
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

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Objetivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência, Viagem Europa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Valor Alvo (R$)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 10000,00"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data Limite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descrição ou Motivação
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 6 meses de despesas fixas para segurança financeira"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
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
                  {submitting ? 'Salvando...' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
