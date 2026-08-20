import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard as CardIcon,
  ArrowLeftRight,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { transactionsService } from '../../services/transactionsService';
import { accountsService } from '../../services/accountsService';
import { categoriesService } from '../../services/categoriesService';
import { cardsService } from '../../services/cardsService';
import { getTodayString } from '../../lib/utils/dates';
import { PaymentMethod } from '../../types';

export const TransactionModal: React.FC = () => {
  const { user } = useAuth();
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    initialTransactionTab,
    accounts,
    categories,
    cards,
    refreshData,
  } = useFinanceData();

  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'card' | 'transfer'>(initialTransactionTab);

  // Form Fields
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize state whenever modal opens or tab changes
  useEffect(() => {
    if (isTransactionModalOpen) {
      setActiveTab(initialTransactionTab);
      resetForm();
    }
  }, [isTransactionModalOpen, initialTransactionTab]);

  useEffect(() => {
    // Select sensible default accounts & categories
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
    if (accounts.length > 1 && !targetAccountId) {
      setTargetAccountId(accounts[1].id);
    }
    if (cards.length > 0 && !cardId) {
      setCardId(cards[0].id);
    }
  }, [accounts, cards, accountId, targetAccountId, cardId]);

  useEffect(() => {
    // Select matching default category based on active tab
    if (categories.length > 0) {
      if (activeTab === 'income') {
        const incCat = categories.find((c) => c.type === 'income' || c.type === 'both');
        if (incCat) setCategoryId(incCat.id);
      } else {
        const expCat = categories.find((c) => c.type === 'expense' || c.type === 'both');
        if (expCat) setCategoryId(expCat.id);
      }
    }
  }, [activeTab, categories]);

  const resetForm = () => {
    setDescription('');
    setAmountStr('');
    setDate(getTodayString());
    setNotes('');
    setErrorMessage(null);
    setIsInstallment(false);
    setInstallmentsCount(1);
    setPaymentMethod('pix');
  };

  if (!isTransactionModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMessage(null);

    // Flexible amount parsing (handles '50', '50,00', '50.00', '1.500,50', 'R$ 50,00')
    let cleaned = amountStr.replace(/[R$\s]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const amountFloat = parseFloat(cleaned);

    if (isNaN(amountFloat) || amountFloat <= 0) {
      setErrorMessage('Por favor, informe um valor válido maior que zero (ex: 50,00).');
      return;
    }

    const amountCents = Math.round(amountFloat * 100);

    if (!description.trim()) {
      setErrorMessage('Por favor, informe uma descrição para o lançamento.');
      return;
    }

    try {
      setSubmitting(true);

      // Determine resolved account
      let effectiveAccountId = accountId;
      if (!effectiveAccountId && accounts.length > 0) {
        effectiveAccountId = accounts[0].id;
      } else if (!effectiveAccountId) {
        const createdAcc = await accountsService.createAccount(user.uid, {
          name: 'Conta Principal',
          bank: 'Geral',
          type: 'checking',
          initialBalance: 0,
          currentBalance: 0,
          color: '#10B981',
        });
        effectiveAccountId = createdAcc.id;
      }

      // Determine resolved category
      let effectiveCategoryId = categoryId;
      if (!effectiveCategoryId) {
        const matchingCat = filteredCategories.length > 0 ? filteredCategories[0] : categories[0];
        if (matchingCat) {
          effectiveCategoryId = matchingCat.id;
        } else {
          const defaultCats = await categoriesService.getCategories(user.uid);
          effectiveCategoryId = defaultCats[0]?.id || 'geral';
        }
      }

      if (activeTab === 'income') {
        await transactionsService.createTransaction(user.uid, {
          type: 'income',
          amount: amountCents,
          description: description.trim(),
          categoryId: effectiveCategoryId,
          accountId: effectiveAccountId,
          date,
          paymentMethod,
          notes: notes.trim(),
        });
      } else if (activeTab === 'expense') {
        await transactionsService.createTransaction(user.uid, {
          type: 'expense',
          amount: amountCents,
          description: description.trim(),
          categoryId: effectiveCategoryId,
          accountId: effectiveAccountId,
          date,
          paymentMethod,
          notes: notes.trim(),
        });
      } else if (activeTab === 'card') {
        let effectiveCardId = cardId;
        let closingDay = 1;

        if (!effectiveCardId && cards.length > 0) {
          effectiveCardId = cards[0].id;
          closingDay = cards[0].closingDay;
        } else if (!effectiveCardId) {
          const createdCard = await cardsService.createCard(user.uid, {
            name: 'Cartão de Crédito',
            bank: 'Geral',
            brand: 'mastercard',
            limit: 200000,
            closingDay: 5,
            dueDay: 12,
            color: '#8A05BE',
          });
          effectiveCardId = createdCard.id;
          closingDay = createdCard.closingDay;
        } else {
          const selectedCard = cards.find((c) => c.id === effectiveCardId);
          if (selectedCard) closingDay = selectedCard.closingDay;
        }

        await transactionsService.createCardPurchaseWithInstallments(user.uid, {
          description: description.trim(),
          totalAmount: amountCents,
          cardId: effectiveCardId,
          categoryId: effectiveCategoryId,
          date,
          installmentsCount: isInstallment ? Math.max(1, installmentsCount) : 1,
          closingDay,
          notes: notes.trim(),
        });
      } else if (activeTab === 'transfer') {
        let targetId = targetAccountId;
        if (!targetId || targetId === effectiveAccountId) {
          const other = accounts.find((a) => a.id !== effectiveAccountId);
          if (other) {
            targetId = other.id;
          } else {
            const secondaryAcc = await accountsService.createAccount(user.uid, {
              name: 'Reserva / Poupança',
              bank: 'Geral',
              type: 'savings',
              initialBalance: 0,
              currentBalance: 0,
              color: '#3B82F6',
            });
            targetId = secondaryAcc.id;
          }
        }

        await transactionsService.createTransaction(user.uid, {
          type: 'transfer',
          amount: amountCents,
          description: description.trim() || 'Transferência entre contas',
          categoryId: '',
          accountId: effectiveAccountId,
          targetAccountId: targetId,
          date,
          paymentMethod: 'transfer',
          notes: notes.trim(),
        });
      }

      await refreshData();
      closeTransactionModal();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setErrorMessage(`Erro ao salvar lançamento: ${err?.message || 'Verifique sua conexão e tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (activeTab === 'income') return c.type === 'income' || c.type === 'both';
    return c.type === 'expense' || c.type === 'both';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header & Tabs */}
        <div className="bg-slate-900 text-white p-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight">Novo Lançamento</h3>
            <button
              onClick={closeTransactionModal}
              id="btn-close-modal"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('expense');
                setErrorMessage(null);
              }}
              id="tab-expense"
              className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('income');
                setErrorMessage(null);
              }}
              id="tab-income"
              className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Receita</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('card');
                setErrorMessage(null);
              }}
              id="tab-card"
              className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                activeTab === 'card'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CardIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Cartão</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('transfer');
                setErrorMessage(null);
              }}
              id="tab-transfer"
              className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                activeTab === 'transfer'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Transf.</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                R$
              </span>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                id="input-transaction-amount"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                activeTab === 'income'
                  ? 'Ex: Salário, Freelance, Venda'
                  : activeTab === 'card'
                  ? 'Ex: Notebook, Supermercado, Jantar'
                  : activeTab === 'transfer'
                  ? 'Ex: Transferência para Reserva'
                  : 'Ex: Supermercado, Aluguel, Combustível'
              }
              id="input-transaction-description"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
          </div>

          {/* Category Selection (Not needed for simple bank transfers) */}
          {activeTab !== 'transfer' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                id="select-transaction-category"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account / Card Selectors */}
          {activeTab === 'card' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Cartão de Crédito
              </label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                id="select-transaction-card"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.bank}) - Fecha dia {c.closingDay}
                  </option>
                ))}
              </select>
              {cards.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhum cartão cadastrado. Cadastre um cartão na aba "Cartões de Crédito".
                </p>
              )}
            </div>
          ) : activeTab === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Conta de Origem
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  id="select-transfer-source"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Conta de Destino
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  id="select-transfer-target"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Conta Bancária
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  id="select-transaction-account"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  id="select-transaction-payment-method"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs"
                >
                  <option value="pix">PIX</option>
                  <option value="debit">Cartão de Débito</option>
                  <option value="cash">Dinheiro em Espécie</option>
                  <option value="transfer">Transferência Bancária</option>
                </select>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Data da Operação
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                id="input-transaction-date"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Installment options for Credit Card */}
          {activeTab === 'card' && (
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Compra Parcelada?
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    id="checkbox-is-installment"
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {isInstallment && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Número de Parcelas
                    </label>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                      id="select-installments-count"
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-semibold text-purple-950"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((num) => (
                        <option key={num} value={num}>
                          {num}x parcelas
                        </option>
                      ))}
                    </select>
                  </div>
                  {amountStr && (
                    <div className="text-right">
                      <span className="block text-[11px] text-purple-700">Valor por mês</span>
                      <span className="text-xs font-bold text-purple-900">
                        R${' '}
                        {(
                          (parseFloat(amountStr.replace(',', '.')) || 0) /
                          Math.max(1, installmentsCount)
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        /mês
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações adicionais..."
              id="input-transaction-notes"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeTransactionModal}
              id="btn-cancel-transaction"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              id="btn-save-transaction"
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                'Salvando...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar Lançamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
