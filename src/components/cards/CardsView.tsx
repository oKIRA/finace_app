import React, { useState } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  CheckCircle,
  X,
  Check,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { cardsService } from '../../services/cardsService';
import { formatCurrency, formatPercent } from '../../lib/utils/formatters';
import { CreditCard, CardBrand, Invoice } from '../../types';

export const CardsView: React.FC<{ onNavigateToInvoices: () => void }> = ({ onNavigateToInvoices }) => {
  const { user } = useAuth();
  const { cards, invoices, summary, refreshData, openTransactionModal } = useFinanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [brand, setBrand] = useState<CardBrand>('mastercard');
  const [limitStr, setLimitStr] = useState('');
  const [closingDay, setClosingDay] = useState(2);
  const [dueDay, setDueDay] = useState(9);
  const [color, setColor] = useState('#8A05BE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCard(null);
    setName('');
    setBank('');
    setBrand('mastercard');
    setLimitStr('');
    setClosingDay(2);
    setDueDay(9);
    setColor('#8A05BE');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: CreditCard) => {
    setEditingCard(c);
    setName(c.name);
    setBank(c.bank);
    setBrand(c.brand);
    setLimitStr(((c.limit || 0) / 100).toFixed(2));
    setClosingDay(c.closingDay);
    setDueDay(c.dueDay);
    setColor(c.color || '#8A05BE');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome do cartão.');
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
      setErrorMsg('Informe um limite válido maior que zero.');
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
          closingDay,
          dueDay,
          color,
        });
      } else {
        await cardsService.createCard(user.uid, {
          name: name.trim(),
          bank: bank.trim() || name.trim(),
          brand,
          limit: limitCents,
          closingDay,
          dueDay,
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

  const handleDelete = async (c: CreditCard) => {
    if (!user) return;
    if (window.confirm(`Deseja realmente excluir o cartão "${c.name}"?`)) {
      try {
        await cardsService.deleteCard(user.uid, c.id);
        await refreshData();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir cartão.');
      }
    }
  };

  const invoiceMap = new Map<string, Invoice>(invoices.map((i) => [i.cardId, i]));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gestão de Cartões de Crédito
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {cards.length} Cartões Cadastrados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Faturas somam {formatCurrency(summary.monthInvoicesTotal)} no mês ativo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToInvoices}
            id="btn-nav-to-invoices"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            Ver Faturas Detalhadas
          </button>

          <button
            onClick={openCreateModal}
            id="btn-add-card"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const inv = invoiceMap.get(card.id);
          const usedAmount = inv ? inv.amount : 0;
          const availableAmount = Math.max(0, card.limit - usedAmount);
          const usedPercent = Math.min(100, (usedAmount / card.limit) * 100);

          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Card Gradient Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: card.color || '#8A05BE' }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: card.color || '#8A05BE' }}
                    >
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{card.name}</h3>
                      <p className="text-xs text-slate-400 font-medium capitalize">
                        {card.bank} • {card.brand}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
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
                <div className="space-y-1.5 my-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Utilizado na Fatura</span>
                    <span className="text-purple-600 font-black">{formatCurrency(usedAmount)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usedPercent > 80 ? 'bg-rose-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Disponível: {formatCurrency(availableAmount)}</span>
                    <span>{usedPercent.toFixed(0)}% do limite</span>
                  </div>
                </div>

                {/* Card Meta Infos */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Limite</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {formatCurrency(card.limit)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Fecha</span>
                    <span className="text-xs font-extrabold text-slate-800">Dia {card.closingDay}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Vence</span>
                    <span className="text-xs font-extrabold text-slate-800">Dia {card.dueDay}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 flex items-center justify-between gap-2">
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

      {/* Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">
                {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank Ultravioleta, C6 Carbon"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Banco Emissor
                  </label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Ex: Nubank, Itaú"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bandeira
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as CardBrand)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">American Express</option>
                    <option value="other">Outra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Limite Total do Cartão (R$)
                </label>
                <input
                  type="text"
                  value={limitStr}
                  onChange={(e) => setLimitStr(e.target.value)}
                  placeholder="Ex: 5000,00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Dia de Fechamento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={(e) => setClosingDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    required
                  />
                </div>

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
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cor do Cartão
                </label>
                <div className="flex items-center gap-2">
                  {['#8A05BE', '#EC7000', '#0F172A', '#1E3A8A', '#047857', '#B91C1C'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
