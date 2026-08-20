import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { FinancialGoal } from '../types';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const goalsService = {
  async getGoals(userId: string): Promise<FinancialGoal[]> {
    if (!userId) return [];
    const local = getLocalData<FinancialGoal>(userId, 'goals');

    try {
      const colRef = collection(db, 'users', userId, 'goals');
      const snap = await runWithTimeout(getDocs(colRef), 2500);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FinancialGoal));
      if (remote.length > 0) {
        setLocalData(userId, 'goals', remote);
        return remote;
      }
    } catch (e) {
      console.warn('Could not load goals from Firestore, using local cache:', e);
    }

    return local;
  },

  async createGoal(userId: string, goal: Omit<FinancialGoal, 'id' | 'createdAt'>): Promise<FinancialGoal> {
    const docRef = doc(collection(db, 'users', userId, 'goals'));
    const newGoal: FinancialGoal = {
      ...goal,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };

    saveLocalItem(userId, 'goals', newGoal);

    try {
      await runWithTimeout(setDoc(docRef, newGoal), 2500);
    } catch (e) {
      console.warn('Goal saved locally, background Firestore sync pending:', e);
    }

    return newGoal;
  },

  async updateGoal(userId: string, id: string, data: Partial<FinancialGoal>): Promise<void> {
    const current = getLocalData<FinancialGoal>(userId, 'goals');
    const existing = current.find((g) => g.id === id);
    if (existing) {
      const updated: FinancialGoal = { ...existing, ...data };
      saveLocalItem(userId, 'goals', updated);
    }

    try {
      const docRef = doc(db, 'users', userId, 'goals', id);
      await runWithTimeout(updateDoc(docRef, data), 2500);
    } catch (e) {
      console.warn('Goal updated locally, background Firestore sync pending:', e);
    }
  },

  async depositToGoal(userId: string, id: string, amountCents: number): Promise<void> {
    const current = getLocalData<FinancialGoal>(userId, 'goals');
    const target = current.find((g) => g.id === id);
    if (target) {
      const newAmount = Math.max(0, (target.currentAmount || 0) + amountCents);
      const updated: FinancialGoal = { ...target, currentAmount: newAmount };
      saveLocalItem(userId, 'goals', updated);

      try {
        const docRef = doc(db, 'users', userId, 'goals', id);
        await runWithTimeout(updateDoc(docRef, { currentAmount: newAmount }), 2500);
      } catch (e) {
        console.warn('Goal deposit updated locally, background Firestore sync pending:', e);
      }
    }
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    removeLocalItem(userId, 'goals', id);

    try {
      const docRef = doc(db, 'users', userId, 'goals', id);
      await runWithTimeout(deleteDoc(docRef), 2500);
    } catch (e) {
      console.warn('Goal deleted locally, background Firestore delete pending:', e);
    }
  },
};
