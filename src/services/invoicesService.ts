import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Invoice, InvoiceStatus, CreditCard } from '../types';
import { transactionsService } from './transactionsService';
import { getInvoiceDueDate } from '../lib/utils/dates';

export const invoicesService = {
  async getInvoices(userId: string, cardId?: string): Promise<Invoice[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'invoices');
    const snap = await getDocs(colRef);
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
    if (cardId) {
      list = list.filter((i) => i.cardId === cardId);
    }
    return list;
  },

  async payInvoice(
    userId: string,
    invoiceData: {
      cardId: string;
      cardName: string;
      year: number;
      month: number;
      amountToPay: number; // in cents
      payingAccountId: string;
      paymentDate: string; // YYYY-MM-DD
    }
  ): Promise<void> {
    const { cardId, cardName, year, month, amountToPay, payingAccountId, paymentDate } = invoiceData;
    const invoiceId = `${cardId}_${year}_${month}`;

    // 1. Create a card_payment transaction (reduces payingAccountId balance, does NOT count as second expense)
    const paymentTransaction = await transactionsService.createTransaction(userId, {
      type: 'card_payment',
      amount: amountToPay,
      description: `Pagamento Fatura ${cardName} (${month}/${year})`,
      categoryId: '',
      accountId: payingAccountId,
      cardId,
      date: paymentDate,
      paymentMethod: 'debit',
      notes: `Liquidação de fatura do cartão`,
    });

    // 2. Update/create the invoice record in Firestore
    const docRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await setDoc(
      docRef,
      {
        id: invoiceId,
        cardId,
        year,
        month,
        amount: amountToPay,
        paidAmount: amountToPay,
        status: 'paid' as InvoiceStatus,
        paidAt: new Date().toISOString(),
        paymentTransactionId: paymentTransaction.id,
      },
      { merge: true }
    );
  },

  calculateInvoiceStatus(
    invoiceAmount: number,
    paidAmount: number,
    dueDate: string,
    isExplicitlyPaid: boolean
  ): InvoiceStatus {
    if (isExplicitlyPaid || (invoiceAmount > 0 && paidAmount >= invoiceAmount)) {
      return 'paid';
    }
    const today = new Date().toISOString().split('T')[0];
    if (today > dueDate && invoiceAmount > 0) {
      return 'overdue';
    }
    if (invoiceAmount > 0) {
      return 'open';
    }
    return 'open';
  },

  async getOrCreateInvoiceRecord(
    userId: string,
    card: CreditCard,
    year: number,
    month: number,
    calculatedCardExpenses: number
  ): Promise<Invoice> {
    const invoiceId = `${card.id}_${year}_${month}`;
    const dueDate = getInvoiceDueDate(year, month, card.dueDay);
    const closingDate = getInvoiceDueDate(year, month, card.closingDay);

    try {
      const docRef = doc(db, 'users', userId, 'invoices', invoiceId);
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? (snap.data() as Invoice) : undefined;

      if (existing) {
        const status = this.calculateInvoiceStatus(
          calculatedCardExpenses,
          existing.paidAmount || 0,
          dueDate,
          existing.status === 'paid'
        );
        return {
          ...existing,
          amount: calculatedCardExpenses,
          status,
          dueDate,
          closingDate,
        };
      }
    } catch (e) {
      console.warn('Error reading invoice record, generating in-memory invoice:', e);
    }

    const newInvoice: Invoice = {
      id: invoiceId,
      cardId: card.id,
      year,
      month,
      amount: calculatedCardExpenses,
      status: this.calculateInvoiceStatus(calculatedCardExpenses, 0, dueDate, false),
      closingDate,
      dueDate,
    };

    return newInvoice;
  },
};
