import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { CreditCard } from '../types';
import {
  getLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const cardsService = {
  async getCards(userId: string): Promise<CreditCard[]> {
    if (!userId) return [];
    const local = getLocalData<CreditCard>(userId, 'cards');

    try {
      const colRef = collection(db, 'users', userId, 'cards');
      const snap = await runWithTimeout(getDocs(colRef), 2500);
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CreditCard));
      if (remote.length > 0) {
        setLocalData(userId, 'cards', remote);
        return remote;
      }
    } catch (e) {
      console.warn('Could not load cards from Firestore, using local cache:', e);
    }

    return local;
  },

  async createCard(userId: string, card: Omit<CreditCard, 'id' | 'createdAt'>): Promise<CreditCard> {
    const docRef = doc(collection(db, 'users', userId, 'cards'));
    const newCard: CreditCard = {
      ...card,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };

    saveLocalItem(userId, 'cards', newCard);

    try {
      await runWithTimeout(setDoc(docRef, newCard), 2500);
    } catch (e) {
      console.warn('Card saved locally, background Firestore sync pending:', e);
    }

    return newCard;
  },

  async updateCard(userId: string, id: string, data: Partial<CreditCard>): Promise<void> {
    const current = getLocalData<CreditCard>(userId, 'cards');
    const existing = current.find((c) => c.id === id);
    if (existing) {
      const updated: CreditCard = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveLocalItem(userId, 'cards', updated);
    }

    try {
      const docRef = doc(db, 'users', userId, 'cards', id);
      await runWithTimeout(
        updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        }),
        2500
      );
    } catch (e) {
      console.warn('Card updated locally, background Firestore sync pending:', e);
    }
  },

  async deleteCard(userId: string, id: string): Promise<void> {
    removeLocalItem(userId, 'cards', id);

    try {
      const docRef = doc(db, 'users', userId, 'cards', id);
      await runWithTimeout(deleteDoc(docRef), 2500);
    } catch (e) {
      console.warn('Card deleted locally, background Firestore delete pending:', e);
    }
  },
};
