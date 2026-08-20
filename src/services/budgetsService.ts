import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Budget } from '../types';

export const budgetsService = {
  async getBudgets(userId: string): Promise<Budget[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'budgets');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget));
  },

  async setCategoryBudget(userId: string, categoryId: string, amount: number): Promise<Budget> {
    const colRef = collection(db, 'users', userId, 'budgets');
    const snap = await getDocs(colRef);
    const existing = snap.docs.find((d) => d.data().categoryId === categoryId);

    if (existing) {
      const docRef = doc(db, 'users', userId, 'budgets', existing.id);
      await updateDoc(docRef, { amount });
      return { id: existing.id, categoryId, amount };
    }

    const docRef = doc(colRef);
    const newBudget: Budget = {
      id: docRef.id,
      categoryId,
      amount,
    };
    await setDoc(docRef, newBudget);
    return newBudget;
  },

  async deleteBudget(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'budgets', id);
    await deleteDoc(docRef);
  },
};
