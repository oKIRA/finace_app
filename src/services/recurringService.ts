import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { RecurringBill } from '../types';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const recurringService = {
  async getRecurringBills(userId: string): Promise<RecurringBill[]> {
    if (!userId) return [];
    const local = getLocalData<RecurringBill>(userId, 'recurring');

    try {
      const colRef = collection(db, 'users', userId, 'recurring');
      const snap = await runWithTimeout(getDocs(colRef), 2500);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecurringBill));
      if (remote.length > 0) {
        setLocalData(userId, 'recurring', remote);
        return remote;
      }
    } catch (e) {
      console.warn('Could not load recurring bills from Firestore, using local cache:', e);
    }

    return local;
  },

  async createRecurringBill(userId: string, bill: Omit<RecurringBill, 'id' | 'createdAt'>): Promise<RecurringBill> {
    const docRef = doc(collection(db, 'users', userId, 'recurring'));
    const newBill: RecurringBill = {
      ...bill,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };

    saveLocalItem(userId, 'recurring', newBill);

    try {
      await runWithTimeout(setDoc(docRef, newBill), 2500);
    } catch (e) {
      console.warn('Recurring bill saved locally, background Firestore sync pending:', e);
    }

    return newBill;
  },

  async updateRecurringBill(userId: string, id: string, data: Partial<RecurringBill>): Promise<void> {
    const current = getLocalData<RecurringBill>(userId, 'recurring');
    const existing = current.find((r) => r.id === id);
    if (existing) {
      const updated: RecurringBill = { ...existing, ...data };
      saveLocalItem(userId, 'recurring', updated);
    }

    try {
      const docRef = doc(db, 'users', userId, 'recurring', id);
      await runWithTimeout(updateDoc(docRef, data), 2500);
    } catch (e) {
      console.warn('Recurring bill updated locally, background Firestore sync pending:', e);
    }
  },

  async deleteRecurringBill(userId: string, id: string): Promise<void> {
    removeLocalItem(userId, 'recurring', id);

    try {
      const docRef = doc(db, 'users', userId, 'recurring', id);
      await runWithTimeout(deleteDoc(docRef), 2500);
    } catch (e) {
      console.warn('Recurring bill deleted locally, background Firestore delete pending:', e);
    }
  },
};
