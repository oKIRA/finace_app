import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { CategorySnapshot, Transaction, PaymentMethod } from '../types';
import { accountsService } from './accountsService';
import { parseDateParts, getInvoiceMonthForPurchase } from '../lib/utils/dates';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const transactionsService = {
  async getTransactions(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      accountId?: string;
      cardId?: string;
      categoryId?: string;
      type?: string;
      limitCount?: number;
    }
  ): Promise<Transaction[]> {
    if (!userId) return [];
    const local = getLocalData<Transaction>(userId, 'transactions');

    let all = local;
    try {
      const colRef = collection(db, 'users', userId, 'transactions');
      const snap = await runWithTimeout(getDocs(colRef), 2500);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
      if (remote.length > 0) {
        setLocalData(userId, 'transactions', remote);
        all = remote;
      }
    } catch (e) {
      console.warn('Could not load transactions from Firestore, using local cache:', e);
    }

    let list = [...all].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (options?.year && options?.month) {
      const invoiceMonthStr = `${options.year}-${String(options.month).padStart(2, '0')}`;
      list = list.filter(
        (t) =>
          (t.year === options.year && t.month === options.month) ||
          t.invoiceMonth === invoiceMonthStr
      );
    }
    if (options?.accountId) {
      list = list.filter((t) => t.accountId === options.accountId || t.targetAccountId === options.accountId);
    }
    if (options?.cardId) {
      list = list.filter((t) => t.cardId === options.cardId);
    }
    if (options?.categoryId) {
      list = list.filter((t) => t.categoryId === options.categoryId);
    }
    if (options?.type) {
      list = list.filter((t) => t.type === options.type);
    }

    if (options?.limitCount) {
      return list.slice(0, options.limitCount);
    }

    return list;
  },

  async createTransaction(
    userId: string,
    data: Omit<Transaction, 'id' | 'year' | 'month' | 'day' | 'createdAt'>
  ): Promise<Transaction> {
    const { year, month, day } = parseDateParts(data.date);
    const docRef = doc(collection(db, 'users', userId, 'transactions'));

    const newTransaction: Transaction = {
      ...data,
      id: docRef.id,
      year,
      month,
      day,
      createdAt: new Date().toISOString(),
    };

    // 1. Save locally
    saveLocalItem(userId, 'transactions', newTransaction);

    // 2. Adjust account balances
    if (data.type === 'income' && data.accountId) {
      await accountsService.updateBalance(userId, data.accountId, data.amount);
    } else if (data.type === 'expense' && data.accountId) {
      await accountsService.updateBalance(userId, data.accountId, -data.amount);
    } else if (data.type === 'transfer' && data.accountId && data.targetAccountId) {
      await accountsService.updateBalance(userId, data.accountId, -data.amount);
      await accountsService.updateBalance(userId, data.targetAccountId, data.amount);
    } else if (data.type === 'card_payment' && data.accountId) {
      await accountsService.updateBalance(userId, data.accountId, -data.amount);
    }

    // 3. Sync to Firestore safely
    try {
      await runWithTimeout(setDoc(docRef, newTransaction), 2500);
    } catch (e) {
      console.warn('Transaction saved locally, background Firestore sync pending:', e);
    }

    return newTransaction;
  },

  async createCardPurchaseWithInstallments(
    userId: string,
    purchase: {
      description: string;
      totalAmount: number;
      cardId: string;
      categoryId: string;
      categorySnapshot?: CategorySnapshot;
      date: string;
      installmentsCount: number;
      closingDay: number;
      notes?: string;
    }
  ): Promise<Transaction[]> {
    const { installmentsCount, totalAmount, date, closingDay, description, cardId, categoryId, categorySnapshot, notes } = purchase;
    const count = Math.max(1, installmentsCount);

    const baseAmount = Math.floor(totalAmount / count);
    const remainder = totalAmount - baseAmount * count;

    const { year: firstYear, month: firstMonth } = getInvoiceMonthForPurchase(date, closingDay);
    const { day: purchaseDay } = parseDateParts(date);

    const groupId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdList: Transaction[] = [];

    let currentY = firstYear;
    let currentM = firstMonth;

    for (let i = 1; i <= count; i++) {
      const installmentAmount = i === 1 ? baseAmount + remainder : baseAmount;
      const invoiceMonthStr = `${currentY}-${String(currentM).padStart(2, '0')}`;

      const docRef = doc(collection(db, 'users', userId, 'transactions'));
      const trans: Transaction = {
        id: docRef.id,
        type: 'card_expense',
        amount: installmentAmount,
        description: count > 1 ? `${description} (${i}/${count})` : description,
        categoryId,
        categorySnapshot,
        accountId: '',
        cardId,
        date,
        year: currentY,
        month: currentM,
        day: purchaseDay,
        paymentMethod: 'credit' as PaymentMethod,
        isInstallment: count > 1,
        currentInstallment: i,
        totalInstallments: count,
        installmentGroupId: count > 1 ? groupId : undefined,
        invoiceMonth: invoiceMonthStr,
        notes,
        createdAt: new Date().toISOString(),
      };

      saveLocalItem(userId, 'transactions', trans);
      createdList.push(trans);

      currentM += 1;
      if (currentM > 12) {
        currentM = 1;
        currentY += 1;
      }
    }

    try {
      const batch = writeBatch(db);
      for (const t of createdList) {
        const docRef = doc(db, 'users', userId, 'transactions', t.id);
        batch.set(docRef, t);
      }
      await runWithTimeout(batch.commit(), 2500);
    } catch (e) {
      console.warn('Installments saved locally, Firestore batch sync pending:', e);
    }

    return createdList;
  },

  async deleteTransaction(userId: string, transaction: Transaction): Promise<void> {
    removeLocalItem(userId, 'transactions', transaction.id);

    // Reverse balance impacts
    if (transaction.type === 'income' && transaction.accountId) {
      await accountsService.updateBalance(userId, transaction.accountId, -transaction.amount);
    } else if (transaction.type === 'expense' && transaction.accountId) {
      await accountsService.updateBalance(userId, transaction.accountId, transaction.amount);
    } else if (transaction.type === 'transfer' && transaction.accountId && transaction.targetAccountId) {
      await accountsService.updateBalance(userId, transaction.accountId, transaction.amount);
      await accountsService.updateBalance(userId, transaction.targetAccountId, -transaction.amount);
    } else if (transaction.type === 'card_payment' && transaction.accountId) {
      await accountsService.updateBalance(userId, transaction.accountId, transaction.amount);
    }

    try {
      const docRef = doc(db, 'users', userId, 'transactions', transaction.id);
      await runWithTimeout(deleteDoc(docRef), 2500);
    } catch (e) {
      console.warn('Transaction deleted locally, background Firestore delete pending:', e);
    }
  },

  async updateTransaction(userId: string, id: string, data: Partial<Transaction>): Promise<void> {
    const current = getLocalData<Transaction>(userId, 'transactions');
    const existing = current.find((t) => t.id === id);
    if (existing) {
      const updated: Transaction = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveLocalItem(userId, 'transactions', updated);
    }

    try {
      const docRef = doc(db, 'users', userId, 'transactions', id);
      await runWithTimeout(
        updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        }),
        2500
      );
    } catch (e) {
      console.warn('Transaction updated locally, background Firestore sync pending:', e);
    }
  },
};
