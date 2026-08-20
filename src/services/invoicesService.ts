import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Invoice, InvoiceStatus, CreditCard } from '../types';
import { transactionsService } from './transactionsService';
import { getInvoiceDueDate } from '../lib/utils/dates';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const invoicesService = {
  async getInvoices(userId: string, cardId?: string): Promise<Invoice[]> {
    if (!userId) return [];
    const local = getLocalData<Invoice>(userId, 'invoices');

    try {
      const colRef = collection(db, 'users', userId, 'invoices');
      const snap = await runWithTimeout(getDocs(colRef), 1200);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
      if (remote.length > 0) {
        setLocalData(userId, 'invoices', remote);
        let list = remote;
        if (cardId) list = list.filter((i) => i.cardId === cardId);
        return list;
      }
    } catch (e) {
      console.warn('Invoices loaded from local cache:', e);
    }

    let list = local;
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

    // 1. Create a card_payment transaction (reduces payingAccountId balance)
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

    // 2. Update local invoice
    const currentInvoices = getLocalData<Invoice>(userId, 'invoices');
    const existing = currentInvoices.find((i) => i.id === invoiceId);
    const updatedInvoice: Invoice = {
      ...(existing || {
        id: invoiceId,
        cardId,
        year,
        month,
        amount: amountToPay,
        closingDate: '',
        dueDate: '',
      }),
      paidAmount: amountToPay,
      status: 'paid' as InvoiceStatus,
      paidAt: new Date().toISOString(),
      paymentTransactionId: paymentTransaction.id,
    };
    saveLocalItem(userId, 'invoices', updatedInvoice);

    // 3. Sync to Firestore in background
    try {
      const docRef = doc(db, 'users', userId, 'invoices', invoiceId);
      await runWithTimeout(
        setDoc(
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
        ),
        1200
      );
    } catch (e) {
      console.warn('Invoice payment saved locally, Firestore sync pending:', e);
    }
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

    const localInvoices = getLocalData<Invoice>(userId, 'invoices');
    const localExisting = localInvoices.find((i) => i.id === invoiceId);

    if (localExisting) {
      const status = this.calculateInvoiceStatus(
        calculatedCardExpenses,
        localExisting.paidAmount || 0,
        dueDate,
        localExisting.status === 'paid'
      );
      return {
        ...localExisting,
        amount: calculatedCardExpenses,
        status,
        dueDate,
        closingDate,
      };
    }

    try {
      const docRef = doc(db, 'users', userId, 'invoices', invoiceId);
      const snap = await runWithTimeout(getDoc(docRef), 1000);
      if (snap.exists()) {
        const remoteData = snap.data() as Invoice;
        const status = this.calculateInvoiceStatus(
          calculatedCardExpenses,
          remoteData.paidAmount || 0,
          dueDate,
          remoteData.status === 'paid'
        );
        const inv: Invoice = {
          ...remoteData,
          amount: calculatedCardExpenses,
          status,
          dueDate,
          closingDate,
        };
        saveLocalItem(userId, 'invoices', inv);
        return inv;
      }
    } catch (e) {
      // Ignore background timeout and proceed with constructed invoice
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
