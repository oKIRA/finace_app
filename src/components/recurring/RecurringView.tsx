import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  X,
  Check,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { recurringService } from '../../services/recurringService';
import { formatCurrency } from '../../lib/utils/formatters';
import { RecurringBill, RecurringFrequency } from '../../types';

export const RecurringView: React.FC = () => {
  const { user } = useAuth();
  const { recurring, categories, accounts, cards, refreshData } = useFinanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [dueDay, setDueDay] = useState(5);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const openCreateModal = () => {
    setEditingBill(null);
    setName('');
    setAmountStr('');
    setType('expense');
    setCategoryId(categories[0]?.id || '');
    setAccountId(accounts[0]?.id || '');
    setCardId('');
    setDueDay(5);
    setFrequency('monthly');
    setNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmountStr(((bill.amount || 0) / 100).toFixed(2));
    setType(bill.type);
    setCategoryId(bill.categoryId);
    setAccountId(bill.accountId || '');
    setCardId(bill.cardId || '');
    setDueDay(bill.dueDay);
    setFrequency(bill.frequency);
    setNotes(bill.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome da conta recorrente.');
      return;
    }

    let cleaned = amountStr.replace(/[R$\s]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const amountFloat = parseFloat(cleaned) || 0;

    if (amountFloat <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    const amountCents = Math.round(amountFloat * 100);

    let effectiveCatId = categoryId;
    if (!effectiveCatId && categories.length > 0) {
      effectiveCatId = categories[0].id;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      if (editingBill) {
        await recurringService.updateRecurringBill(user.uid, editingBill.id, {
          name: name.trim(),
          amount: amountCents,
          type,
          categoryId: effectiveCatId,
          accountId: accountId || undefined,
          cardId: cardId || undefined,
          dueDay,
          frequency,
          notes: notes.trim(),
        });
      } else {
        await recurringService.createRecurringBill(user.uid, {
          name: name.trim(),
          amount: amountCents,
          type,
          categoryId: effectiveCatId,
          accountId: accountId || undefined,
          cardId: cardId || undefined,
          dueDay,
          frequency,
          active: true,
          notes: notes.trim(),
        });
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao salvar conta recorrente: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (bill: RecurringBill) => {
    if (!user) return;
    try {
      await recurringService.updateRecurringBill(user.uid, bill.id, { active: !bill.active });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (bill: RecurringBill) => {
    if (!user) return;
    if (window.confirm(`Deseja excluir a conta recorrente "${bill.name}"?`)) {
      try {
        await recurringService.deleteRecurringBill(user.uid, bill.id);
        await refreshData();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir.');
      }
    }
  };

  const totalMonthlyExpenses = recurring
    .filter((r) => r.active && r.type === 'expense')
    .reduce((acc, r) => acc + r.amount, 0);

  const totalMonthlyIncome = recurring
    .filter((r) => r.active && r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Contas Fixas & Assinaturas
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Lançamentos Recorrentes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Impacto mensal: {formatCurrency(totalMonthlyExpenses)} em despesas fixas e {formatCurrency(totalMonthlyIncome)} em receitas fixas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-recurring"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Conta Recorrente
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurring.map((bill) => {
          const isIncome = bill.type === 'income';

          return (
            <div
              key={bill.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                bill.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${
                      isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {isIncome ? 'Receita Fixa' : 'Despesa Fixa'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(bill)}
                      id={`btn-toggle-recurring-${bill.id}`}
                      title={bill.active ? 'Desativar' : 'Ativar'}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                    >
                      {bill.active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(bill)}
                      id={`btn-edit-recurring-${bill.id}`}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bill)}
                      id={`btn-delete-recurring-${bill.id}`}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{bill.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {catMap.get(bill.categoryId) || 'Contas'} • Todo dia {bill.dueDay}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Valor</span>
                  <span
                    className={`text-base font-black ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(bill.amount)}
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
              <h3 className="text-sm font-bold tracking-tight">
                {editingBill ? 'Editar Recorrência' : 'Nova Conta Recorrente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome do Lançamento
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aluguel, Netflix, Internet, Salário"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="expense">Despesa Fixa</option>
                    <option value="income">Receita Fixa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Dia de Vencimento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Periodicidade
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                  Salvar Recorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
