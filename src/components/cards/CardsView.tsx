import React, { useState } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  TrendingUp,
  X,
  Check,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { cardsService } from '../../services/cardsService';
import { formatCurrency } from '../../lib/utils/formatters';
import { CardBrand, CreditCard, Invoice } from '../../types';

export const CardsView: React.FC<{ onNavigateToInvoices: () => void }> = ({
  onNavigateToInvoices,
}) => {
  const { user } = useAuth();
  const { cards, invoices, summary, openTransactionModal, refreshData } = useFinanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [brand, setBrand] = useState<CardBrand>('mastercard');
  const [limitStr, setLimitStr] = useState('');
  const [closingDay, setClosingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [color, setColor] = useState('#8A05BE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCard(null);
    setName('');
    setBank('');
    setBrand('mastercard');
    setLimitStr('');
    setClosingDay(1);
    setDueDay(10);
    setColor('#8A05BE');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (card: CreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setBank(card.bank);
    setBrand(card.brand || 'mastercard');
    setLimitStr(((card.limit || 0) / 100).toFixed(2));
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setColor(card.color || '#8A05BE');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome ou apelido do cartão.');
      return;
    }

    let cleaned = limitStr.replace(/[R$\s]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const limitFloat = parseFloat(cleaned) || 0;

    if (limitFloat <= 0) {
      setErrorMsg('Informe um limite de crédito válido maior que zero.');
      return;
    }

    const limitCents = Math.round(limitFloat * 100);

    try {
      setSubmitting(true);
      setErrorMsg(null);
      if (editingCard) {
        await cardsService.updateCard(user.uid, editingCard.id, {
          name: name.trim(),
          bank: bank.trim(),
          brand,
          limit: limitCents,
          closingDay: Number(closingDay),
          dueDay: Number(dueDay),
          color,
        });
      } else {
        await cardsService.createCard(user.uid, {
          name: name.trim(),
          bank: bank.trim() || 'Banco',
          brand,
          limit: limitCents,
          closingDay: Number(closingDay),
          dueDay: Number(dueDay),
          color,
        });
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao salvar cartão: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (card: CreditCard) => {
    if (!user) return;
    if (window.confirm(`Deseja realmente excluir o cartão "${card.name}"?`)) {
      try {
        await cardsService.deleteCard(user.uid, card.id);
        await refreshData();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir cartão.');
      }
    }
  };

  const invoiceMap = new Map<string, Invoice>(invoices.map((inv) => [inv.cardId, inv]));

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gestão de Cartões de Crédito
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            {cards.length} Cartões Cadastrados
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Faturas somam {formatCurrency(summary.monthInvoicesTotal)} no mês ativo
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={onNavigateToInvoices}
            id="btn-nav-to-invoices"
            className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            Ver Faturas Detalhadas
          </button>

          <button
            onClick={openCreateModal}
            id="btn-add-card"
            className="px-3.5 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => {
          const inv = invoiceMap.get(card.id);
          const usedAmount = inv ? inv.amount : 0;
          const availableAmount = Math.max(0, card.limit - usedAmount);
          const usedPercent = Math.min(100, (usedAmount / card.limit) * 100);

          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden min-w-0"
            >
              {/* Top Card Gradient Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: card.color || '#8A05BE' }}
              />

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: card.color || '#8A05BE' }}
                    >
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{card.name}</h3>
                      <p className="text-xs text-slate-400 font-medium capitalize truncate">
                        {card.bank} • {card.brand}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(card)}
                      id={`btn-edit-card-${card.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Editar Cartão"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(card)}
                      id={`btn-delete-card-${card.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Excluir Cartão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar of used limit */}
                <div className="space-y-1.5 my-3 sm:my-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Fatura Atual</span>
                    <span className="text-purple-600 font-black truncate ml-2">
                      {formatCurrency(usedAmount)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usedPercent > 80 ? 'bg-rose-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span className="truncate">Disp: {formatCurrency(availableAmount)}</span>
                    <span className="shrink-0 ml-2">{usedPercent.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Card Meta Infos */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="p-1.5 sm:p-2 bg-slate-50 rounded-xl min-w-0">
                    <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Limite</span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate block" title={formatCurrency(card.limit)}>
                      {formatCurrency(card.limit)}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-slate-50 rounded-xl min-w-0">
                    <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Fecha</span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate block">Dia {card.closingDay}</span>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-slate-50 rounded-xl min-w-0">
                    <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Vence</span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate block">Dia {card.dueDay}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 sm:mt-4 pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => openTransactionModal('card')}
                  id={`btn-card-purchase-${card.id}`}
                  className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-colors text-center"
                >
                  + Nova Compra
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating / Editing Card */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-purple-600" />
                {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
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
                  Nome / Identificador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Roxinho, Itaú Black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Banco / Emissor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Inter"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bandeira
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as CardBrand)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">Amex</option>
                    <option value="hipercard">Hipercard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Limite Total do Cartão (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Ex: 5000,00"
                  value={limitStr}
                  onChange={(e) => setLimitStr(e.target.value.replace(/[^\d,.-]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dia Fechamento
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) {
                        setClosingDay(Math.min(31, Math.max(1, value)));
                      }
                    }}
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

              {/* Color Pick */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cor do Cartão
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#8A05BE', '#FF7A00', '#0055FF', '#10B981', '#E11D48', '#0F172A', '#CA8A04'].map(
                    (c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-xl transition-transform ${
                          color === c ? 'scale-110 ring-2 ring-purple-600 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
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
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingCard ? 'Atualizar Cartão' : 'Criar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
