import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Budget } from '../types';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const budgetsService = {
  async getBudgets(userId: string): Promise<Budget[]> {
    if (!userId) return [];
    const local = getLocalData<Budget>(userId, 'budgets');

    try {
      const colRef = collection(db, 'users', userId, 'budgets');
      const snap = await runWithTimeout(getDocs(colRef), 2500);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget));
      if (remote.length > 0) {
        setLocalData(userId, 'budgets', remote);
        return remote;
      }
    } catch (e) {
      console.warn('Could not load budgets from Firestore, using local cache:', e);
    }

    return local;
  },

  async setCategoryBudget(userId: string, categoryId: string, amount: number): Promise<Budget> {
    const current = getLocalData<Budget>(userId, 'budgets');
    const existing = current.find((b) => b.categoryId === categoryId);

    if (existing) {
      const updated: Budget = { ...existing, amount };
      saveLocalItem(userId, 'budgets', updated);

      try {
        const docRef = doc(db, 'users', userId, 'budgets', existing.id);
        await runWithTimeout(updateDoc(docRef, { amount }), 2500);
      } catch (e) {
        console.warn('Budget updated locally, background Firestore sync pending:', e);
      }

      return updated;
    }

    const docRef = doc(collection(db, 'users', userId, 'budgets'));
    const newBudget: Budget = {
      id: docRef.id,
      categoryId,
      amount,
    };

    saveLocalItem(userId, 'budgets', newBudget);

    try {
      await runWithTimeout(setDoc(docRef, newBudget), 2500);
    } catch (e) {
      console.warn('Budget saved locally, background Firestore sync pending:', e);
    }

    return newBudget;
  },

  async deleteBudget(userId: string, id: string): Promise<void> {
    removeLocalItem(userId, 'budgets', id);

    try {
      const docRef = doc(db, 'users', userId, 'budgets', id);
      await runWithTimeout(deleteDoc(docRef), 2500);
    } catch (e) {
      console.warn('Budget deleted locally, background Firestore delete pending:', e);
    }
  },
};
