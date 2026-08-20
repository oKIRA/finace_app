import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Account } from '../types';

export const accountsService = {
  async getAccounts(userId: string): Promise<Account[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'accounts');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
  },

  async createAccount(userId: string, account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const docRef = doc(collection(db, 'users', userId, 'accounts'));
    const newAccount: Account = {
      ...account,
      id: docRef.id,
      currentBalance: account.initialBalance,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, newAccount);
    return newAccount;
  },

  async updateAccount(userId: string, id: string, data: Partial<Account>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'accounts', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteAccount(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'accounts', id);
    await deleteDoc(docRef);
  },

  async updateBalance(userId: string, accountId: string, balanceDeltaCents: number): Promise<void> {
    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    // Fetch current to calculate exact integer balance
    const colRef = collection(db, 'users', userId, 'accounts');
    const snap = await getDocs(colRef);
    const target = snap.docs.find((d) => d.id === accountId);
    if (target) {
      const current = (target.data().currentBalance || 0) + balanceDeltaCents;
      await updateDoc(docRef, {
        currentBalance: current,
        updatedAt: new Date().toISOString(),
      });
    }
  },
};
