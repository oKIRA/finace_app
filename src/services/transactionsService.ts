import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Transaction, PaymentMethod } from '../types';
import { accountsService } from './accountsService';
import { parseDateParts, getInvoiceMonthForPurchase } from '../lib/utils/dates';

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
    const colRef = collection(db, 'users', userId, 'transactions');
    
    // We order by date descending
    let q = query(colRef, orderBy('date', 'desc'));

    if (options?.year && options?.month) {
      q = query(
        colRef,
        where('year', '==', options.year),
        where('month', '==', options.month),
        orderBy('date', 'desc')
      );
    }

    try {
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));

      // Also grab card expenses that might belong to this invoice month
      if (options?.year && options?.month) {
        const invoiceMonthStr = `${options.year}-${String(options.month).padStart(2, '0')}`;
        const cardExpensesQ = query(
          colRef,
          where('invoiceMonth', '==', invoiceMonthStr),
          orderBy('date', 'desc')
        );
        const cardSnap = await getDocs(cardExpensesQ);
        const cardItems = cardSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        
        // Merge and deduplicate by id
        const map = new Map<string, Transaction>();
        list.forEach((t) => map.set(t.id, t));
        cardItems.forEach((t) => map.set(t.id, t));
        list = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
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
    } catch {
      // Fallback query without compound index if index is not ready yet
      const simpleSnap = await getDocs(colRef);
      let list = simpleSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

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
    }
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

    await setDoc(docRef, newTransaction);

    // Apply Bank Balance Adjustments based on transaction type
    if (data.type === 'income' && data.accountId) {
      await accountsService.updateBalance(userId, data.accountId, data.amount);
    } else if (data.type === 'expense' && data.accountId) {
      await accountsService.updateBalance(userId, data.accountId, -data.amount);
    } else if (data.type === 'transfer' && data.accountId && data.targetAccountId) {
      await accountsService.updateBalance(userId, data.accountId, -data.amount);
      await accountsService.updateBalance(userId, data.targetAccountId, data.amount);
    } else if (data.type === 'card_payment' && data.accountId) {
      // Payment of credit card invoice from bank account
      await accountsService.updateBalance(userId, data.accountId, -data.amount);
    }
    // Note: card_expense does NOT deduct from bank account now (paid when invoice is paid)

    return newTransaction;
  },

  async createCardPurchaseWithInstallments(
    userId: string,
    purchase: {
      description: string;
      totalAmount: number; // in cents
      cardId: string;
      categoryId: string;
      date: string; // YYYY-MM-DD
      installmentsCount: number;
      closingDay: number;
      notes?: string;
    }
  ): Promise<Transaction[]> {
    const { installmentsCount, totalAmount, date, closingDay, description, cardId, categoryId, notes } = purchase;
    const count = Math.max(1, installmentsCount);

    const baseAmount = Math.floor(totalAmount / count);
    const remainder = totalAmount - baseAmount * count;

    const { year: firstYear, month: firstMonth } = getInvoiceMonthForPurchase(date, closingDay);
    const { day: purchaseDay } = parseDateParts(date);

    const groupId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const batch = writeBatch(db);
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
        accountId: '', // Not tied to a bank account until invoice payment
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

      batch.set(docRef, trans);
      createdList.push(trans);

      currentM += 1;
      if (currentM > 12) {
        currentM = 1;
        currentY += 1;
      }
    }

    await batch.commit();
    return createdList;
  },

  async deleteTransaction(userId: string, transaction: Transaction): Promise<void> {
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

    const docRef = doc(db, 'users', userId, 'transactions', transaction.id);
    await deleteDoc(docRef);
  },

  async updateTransaction(userId: string, id: string, data: Partial<Transaction>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'transactions', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },
};
