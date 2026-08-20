import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { RecurringBill } from '../types';

export const recurringService = {
  async getRecurringBills(userId: string): Promise<RecurringBill[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'recurring');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecurringBill));
  },

  async createRecurringBill(userId: string, bill: Omit<RecurringBill, 'id' | 'createdAt'>): Promise<RecurringBill> {
    const docRef = doc(collection(db, 'users', userId, 'recurring'));
    const newBill: RecurringBill = {
      ...bill,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, newBill);
    return newBill;
  },

  async updateRecurringBill(userId: string, id: string, data: Partial<RecurringBill>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'recurring', id);
    await updateDoc(docRef, data);
  },

  async deleteRecurringBill(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'recurring', id);
    await deleteDoc(docRef);
  },
};
