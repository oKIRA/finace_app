import React, { useState } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  X,
  Check,
  Landmark,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useDateFilter } from '../../context/DateFilterContext';
import { useAuth } from '../../context/AuthContext';
import { invoicesService } from '../../services/invoicesService';
import { formatCurrency } from '../../lib/utils/formatters';
import { formatDateBR, getTodayString } from '../../lib/utils/dates';
import { Invoice, CreditCard as CreditCardType } from '../../types';

export const InvoicesView: React.FC = () => {
  const { user } = useAuth();
  const { cards, invoices, transactions, accounts, categories, refreshData } = useFinanceData();
  const { selectedYear, selectedMonth } = useDateFilter();

  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [payingInvoice, setPayingInvoice] = useState<{ invoice: Invoice; card: CreditCardType } | null>(null);

  // Payment modal states
  const [payingAccountId, setPayingAccountId] = useState(accounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeCardId = selectedCardId || cards[0]?.id || '';
  const currentCard = cards.find((c) => c.id === activeCardId);
  const currentInvoice = invoices.find((i) => i.cardId === activeCardId);

  const periodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Filter purchases for this specific card and invoice period
  const invoicePurchases = transactions.filter(
    (t) =>
      t.cardId === activeCardId &&
      t.type === 'card_expense' &&
      (t.invoiceMonth ? t.invoiceMonth === periodStr : true)
  );

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const handleOpenPaymentModal = () => {
    if (!currentInvoice || !currentCard) return;
    setPayingInvoice({ invoice: currentInvoice, card: currentCard });
    if (accounts.length > 0) {
      setPayingAccountId(accounts[0].id);
    }
    setPaymentDate(getTodayString());
    setErrorMsg(null);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !payingInvoice) return;

    if (!payingAccountId) {
      setErrorMsg('Selecione a conta de débito para pagamento.');
      return;
    }

    try {
      setSubmitting(true);
      await invoicesService.payInvoice(user.uid, {
        cardId: payingInvoice.card.id,
        cardName: payingInvoice.card.name,
        year: selectedYear,
        month: selectedMonth,
        amountToPay: payingInvoice.invoice.amount,
        payingAccountId,
        paymentDate,
      });

      await refreshData();
      setPayingInvoice(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao registrar pagamento da fatura.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Faturas Mensais por Cartão
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            Gestão de Faturas
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Acompanhe o fechamento, vencimento e realize a liquidação
          </p>
        </div>

        {/* Card Selector Pills */}
        {cards.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            {cards.map((c) => {
              const isSelected = c.id === activeCardId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  id={`btn-select-invoice-card-${c.id}`}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Overview Card */}
      {currentCard && currentInvoice ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-slate-700/60 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: currentCard.color || '#8A05BE' }}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">{currentCard.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{currentCard.brand}</p>
                  </div>
                </div>

                {currentInvoice.status === 'paid' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paga
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" /> Em Aberto
                  </span>
                )}
              </div>

              <div className="my-4 pt-2 border-t border-slate-700/60 min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Valor da Fatura
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight truncate" title={formatCurrency(currentInvoice.amount)}>
                  {formatCurrency(currentInvoice.amount)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Fecha</span>
                  <span className="font-bold truncate block">Dia {currentCard.closingDay}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Vence</span>
                  <span className="font-bold truncate block">Dia {currentCard.dueDay}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60">
              {currentInvoice.status === 'paid' ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-center">
                  <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Fatura liquidada com sucesso
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleOpenPaymentModal}
                  disabled={currentInvoice.amount <= 0}
                  id="btn-pay-invoice-now"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Pagar / Liquidar Fatura
                </button>
              )}
            </div>
          </div>

          {/* Purchases of this Invoice */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                    Itens Lançados nesta Fatura
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {invoicePurchases.length} compras e parcelas correspondentes a este ciclo
                  </p>
                </div>
                <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg shrink-0">
                  {formatCurrency(currentInvoice.amount)}
                </span>
              </div>

              {invoicePurchases.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Receipt className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Nenhum lançamento nesta fatura</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compras realizadas neste cartão aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                  {invoicePurchases.map((p) => {
                    const catName = catMap.get(p.categoryId) || 'Cartão';
                    return (
                      <div
                        key={p.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 truncate">{p.description}</span>
                            {p.isInstallment && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-black shrink-0">
                                {p.currentInstallment}/{p.totalInstallments}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {catName} • {formatDateBR(p.date)}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-purple-700 whitespace-nowrap">
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 flex flex-col items-center justify-center">
          <CreditCard className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum cartão cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Cadastre seu primeiro cartão de crédito para gerenciar limites e faturas.
          </p>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Pagar Fatura do Cartão
              </h3>
              <button
                onClick={() => setPayingInvoice(null)}
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

            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-[11px] font-bold text-slate-500 uppercase">
                  Cartão & Valor
                </span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{payingInvoice.card.name}</p>
                <p className="text-xl font-black text-purple-600 mt-1">
                  {formatCurrency(payingInvoice.invoice.amount)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Debitar da Conta
                </label>
                <select
                  value={payingAccountId}
                  onChange={(e) => setPayingAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
