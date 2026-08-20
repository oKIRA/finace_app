import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { CreditCard } from '../types';

export const cardsService = {
  async getCards(userId: string): Promise<CreditCard[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'cards');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CreditCard));
  },

  async createCard(userId: string, card: Omit<CreditCard, 'id' | 'createdAt'>): Promise<CreditCard> {
    const docRef = doc(collection(db, 'users', userId, 'cards'));
    const newCard: CreditCard = {
      ...card,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, newCard);
    return newCard;
  },

  async updateCard(userId: string, id: string, data: Partial<CreditCard>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'cards', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteCard(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'cards', id);
    await deleteDoc(docRef);
  },
};
