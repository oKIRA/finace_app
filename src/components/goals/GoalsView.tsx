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
  Check,
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
      setErrorMsg(`Erro ao realizar aporte: ${err?.message || 'Tente novamente.'}`);
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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reservas & Objetivos Futuros
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Metas Financeiras
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe o progresso de suas economias e realize novos aportes
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-goal"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Meta
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g) => {
          const percent = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
          const isCompleted = g.currentAmount >= g.targetAmount;

          return (
            <div
              key={g.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: g.color || '#10B981' }}
                  >
                    <Target className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(g)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{g.name}</h3>
                {g.description && (
                  <p className="text-xs text-slate-400 font-medium mb-3">{g.description}</p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 my-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Acumulado: {formatCurrency(g.currentAmount)}</span>
                    <span className="text-emerald-600 font-black">{percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: g.color || '#10B981',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Objetivo: {formatCurrency(g.targetAmount)}</span>
                    {g.targetDate && <span>Prazo: {formatDateBR(g.targetDate)}</span>}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openDepositModal(g)}
                  id={`btn-deposit-goal-${g.id}`}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PiggyBank className="w-4 h-4 text-emerald-600" />
                  Guardar Dinheiro (+ Aporte)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Criar Nova Meta Financeira</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome da Meta
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Viagem Europa, Reserva de Emergência, Carro"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor Alvo (R$)
                  </label>
                  <input
                    type="text"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    placeholder="15000,00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor Inicial (R$)
                  </label>
                  <input
                    type="text"
                    value={currentAmountStr}
                    onChange={(e) => setCurrentAmountStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Data Limite / Prazo (Opcional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Passagens, hospedagem e passeios"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Check className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  {submitting ? 'Salvando...' : selectedGoal ? 'Salvar Alterações' : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Realizar Aporte</h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteDeposit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="block text-[11px] text-emerald-800 font-bold">Meta: {selectedGoal.name}</span>
                <span className="text-xs font-extrabold text-emerald-950">
                  Saldo Atual: {formatCurrency(selectedGoal.currentAmount)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Valor do Aporte (R$)
                </label>
                <input
                  type="text"
                  value={depositAmountStr}
                  onChange={(e) => setDepositAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Check className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  {submitting ? 'Confirmando...' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
