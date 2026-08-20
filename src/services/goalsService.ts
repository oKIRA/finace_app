import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { FinancialGoal } from '../types';

export const goalsService = {
  async getGoals(userId: string): Promise<FinancialGoal[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'goals');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FinancialGoal));
  },

  async createGoal(userId: string, goal: Omit<FinancialGoal, 'id' | 'createdAt'>): Promise<FinancialGoal> {
    const docRef = doc(collection(db, 'users', userId, 'goals'));
    const newGoal: FinancialGoal = {
      ...goal,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, newGoal);
    return newGoal;
  },

  async updateGoal(userId: string, id: string, data: Partial<FinancialGoal>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'goals', id);
    await updateDoc(docRef, data);
  },

  async depositToGoal(userId: string, id: string, amountCents: number): Promise<void> {
    const colRef = collection(db, 'users', userId, 'goals');
    const snap = await getDocs(colRef);
    const target = snap.docs.find((d) => d.id === id);
    if (target) {
      const current = (target.data().currentAmount || 0) + amountCents;
      const docRef = doc(db, 'users', userId, 'goals', id);
      await updateDoc(docRef, { currentAmount: Math.max(0, current) });
    }
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'goals', id);
    await deleteDoc(docRef);
  },
};
