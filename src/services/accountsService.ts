import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Account } from '../types';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const accountsService = {
  async getAccounts(userId: string): Promise<Account[]> {
    if (!userId) return [];
    const local = getLocalData<Account>(userId, 'accounts');

    try {
      const colRef = collection(db, 'users', userId, 'accounts');
      const snap = await runWithTimeout(getDocs(colRef), 2500);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
      if (remote.length > 0) {
        setLocalData(userId, 'accounts', remote);
        return remote;
      }
    } catch (e) {
      console.warn('Could not load accounts from Firestore, using local cache:', e);
    }

    return local;
  },

  async createAccount(userId: string, account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const docRef = doc(collection(db, 'users', userId, 'accounts'));
    const newAccount: Account = {
      ...account,
      id: docRef.id,
      currentBalance: account.initialBalance,
      createdAt: new Date().toISOString(),
    };

    // 1. Instant local update
    saveLocalItem(userId, 'accounts', newAccount);

    // 2. Safe background sync to Firestore
    try {
      await runWithTimeout(setDoc(docRef, newAccount), 2500);
    } catch (e) {
      console.warn('Account saved locally, background Firestore sync pending:', e);
    }

    return newAccount;
  },

  async updateAccount(userId: string, id: string, data: Partial<Account>): Promise<void> {
    const current = getLocalData<Account>(userId, 'accounts');
    const existing = current.find((a) => a.id === id);
    if (existing) {
      const updated: Account = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveLocalItem(userId, 'accounts', updated);
    }

    try {
      const docRef = doc(db, 'users', userId, 'accounts', id);
      await runWithTimeout(
        updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        }),
        2500
      );
    } catch (e) {
      console.warn('Account updated locally, background Firestore sync pending:', e);
    }
  },

  async deleteAccount(userId: string, id: string): Promise<void> {
    removeLocalItem(userId, 'accounts', id);

    try {
      const docRef = doc(db, 'users', userId, 'accounts', id);
      await runWithTimeout(deleteDoc(docRef), 2500);
    } catch (e) {
      console.warn('Account deleted locally, background Firestore delete pending:', e);
    }
  },

  async updateBalance(userId: string, accountId: string, balanceDeltaCents: number): Promise<void> {
    const accounts = getLocalData<Account>(userId, 'accounts');
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      const newBalance = (target.currentBalance || 0) + balanceDeltaCents;
      const updated: Account = {
        ...target,
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      saveLocalItem(userId, 'accounts', updated);

      try {
        const docRef = doc(db, 'users', userId, 'accounts', accountId);
        await runWithTimeout(
          updateDoc(docRef, {
            currentBalance: newBalance,
            updatedAt: new Date().toISOString(),
          }),
          2500
        );
      } catch (e) {
        console.warn('Account balance updated locally, background Firestore sync pending:', e);
      }
    }
  },
};
