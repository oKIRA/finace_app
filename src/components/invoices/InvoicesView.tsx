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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Faturas Mensais por Cartão
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Gestão de Faturas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe o fechamento, vencimento e realize a liquidação sem duplicar despesas
          </p>
        </div>

        {/* Card Selector Pills */}
        {cards.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {cards.map((c) => {
              const isSelected = c.id === activeCardId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  id={`btn-select-invoice-card-${c.id}`}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Overview Card */}
      {currentCard && currentInvoice ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-md border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Fatura do Cartão
                </span>
                {currentInvoice.status === 'paid' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paga
                  </span>
                ) : currentInvoice.status === 'overdue' ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Atrasada
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    Aberta
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{currentCard.name}</h3>
              <p className="text-xs text-slate-400">
                {currentCard.bank} • Fechamento todo dia {currentCard.closingDay}
              </p>

              <div className="my-6">
                <span className="text-xs text-slate-400 block font-medium">Valor Total da Fatura</span>
                <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                  {formatCurrency(currentInvoice.amount)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Fechamento</span>
                  <span className="font-bold text-slate-200">
                    {formatDateBR(currentInvoice.closingDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vencimento</span>
                  <span className="font-bold text-slate-200">
                    {formatDateBR(currentInvoice.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            {currentInvoice.status !== 'paid' && currentInvoice.amount > 0 && (
              <button
                onClick={handleOpenPaymentModal}
                id="btn-pay-invoice"
                className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check className="w-4 h-4" /> Pagar Fatura Agora
              </button>
            )}
          </div>

          {/* Detailed Purchases List on this invoice */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  Compras Incluídas nesta Fatura
                </h4>
                <p className="text-xs text-slate-400">
                  {invoicePurchases.length} compras e parcelas ativas
                </p>
              </div>
              <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
                Total: {formatCurrency(currentInvoice.amount)}
              </span>
            </div>

            {invoicePurchases.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Receipt className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhuma compra nesta fatura
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                {invoicePurchases.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.description}</p>
                        {p.isInstallment && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-black">
                            {p.currentInstallment}/{p.totalInstallments}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {catMap.get(p.categoryId) || 'Compras'} • Compra em {formatDateBR(p.date)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Nenhum cartão cadastrado</h4>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre um cartão de crédito para gerenciar faturas mensais.
          </p>
        </div>
      )}

      {/* Pay Invoice Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Pagar Fatura do Cartão</h3>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <span className="block text-[11px] font-bold text-purple-700 uppercase">
                  Fatura Selecionada
                </span>
                <p className="text-sm font-bold text-purple-950">{payingInvoice.card.name}</p>
                <p className="text-base font-black text-purple-900 mt-1">
                  Valor a Pagar: {formatCurrency(payingInvoice.invoice.amount)}
                </p>
                <p className="text-[11px] text-purple-600 mt-1">
                  * Regra de Cartão: O pagamento deduzirá da conta bancária de origem sem duplicar despesas.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Debitar da Conta Bancária
                </label>
                <select
                  value={payingAccountId}
                  onChange={(e) => setPayingAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: {formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
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
