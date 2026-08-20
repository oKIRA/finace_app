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

  const handleDelete = async (bill: RecurringBill) => {
    if (!user) return;
    if (window.confirm(`Deseja excluir a conta recorrente "${bill.name}"?`)) {
      try {
        await recurringService.deleteRecurringBill(user.uid, bill.id);
        await refreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleActive = async (bill: RecurringBill) => {
    if (!user) return;
    try {
      await recurringService.updateRecurringBill(user.uid, bill.id, {
        active: !bill.active,
      });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Despesas & Receitas Fixas
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            Lançamentos Recorrentes
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {recurring.length} assinaturas, salários e contas cadastradas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-recurring"
          className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Novo Recorrente
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {recurring.map((bill) => {
          const isIncome = bill.type === 'income';
          const catName = catMap.get(bill.categoryId) || 'Categoria removida';

          return (
            <div
              key={bill.id}
              className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between min-w-0 ${
                !bill.active ? 'opacity-60' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{bill.name}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate">{catName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bill)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-3 sm:my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Valor Fixo</span>
                    <span className="text-xs font-bold text-slate-500">Todo dia {bill.dueDay}</span>
                  </div>
                  <span
                    className={`text-lg sm:text-xl font-black mt-1 block truncate ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                    title={formatCurrency(bill.amount)}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatCurrency(bill.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span className="capitalize">{bill.frequency === 'monthly' ? 'Mensal' : 'Anual'}</span>
                <button
                  onClick={() => handleToggleActive(bill)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    bill.active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {bill.active ? 'Ativo' : 'Pausado'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-600" />
                {editingBill ? 'Editar Recorrente' : 'Novo Lançamento Fixo'}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      type === 'expense'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Despesa Fixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      type === 'income'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Receita Fixa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome / Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Netflix, Aluguel, Salário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Ex: 55,90"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value.replace(/[^\d,.-]/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) {
                        setDueDay(Math.min(31, Math.max(1, value)));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                  {submitting ? 'Salvando...' : editingBill ? 'Atualizar' : 'Criar Recorrente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
