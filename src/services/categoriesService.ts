import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Category } from '../types';
import {
  getLocalData,
  hasLocalData,
  setLocalData,
  saveLocalItem,
  removeLocalItem,
  runWithTimeout,
} from '../lib/storage/syncStorage';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Despesas
  { name: 'Alimentação', icon: 'Utensils', color: '#F97316', type: 'expense', isDefault: true },
  { name: 'Casa & Moradia', icon: 'Home', color: '#0EA5E9', type: 'expense', isDefault: true },
  { name: 'Transporte & Combustível', icon: 'Car', color: '#8B5CF6', type: 'expense', isDefault: true },
  { name: 'Saúde & Cuidados', icon: 'HeartPulse', color: '#EC4899', type: 'expense', isDefault: true },
  { name: 'Educação', icon: 'GraduationCap', color: '#3B82F6', type: 'expense', isDefault: true },
  { name: 'Lazer & Entretenimento', icon: 'Sparkles', color: '#EAB308', type: 'expense', isDefault: true },
  { name: 'Compras & Vestuário', icon: 'ShoppingBag', color: '#10B981', type: 'expense', isDefault: true },
  { name: 'Assinaturas & Serviços', icon: 'Tv', color: '#6366F1', type: 'expense', isDefault: true },
  { name: 'Viagens', icon: 'Plane', color: '#14B8A6', type: 'expense', isDefault: true },
  { name: 'Financeiro & Tarifas', icon: 'Landmark', color: '#64748B', type: 'expense', isDefault: true },
  { name: 'Outras Despesas', icon: 'CircleEllipsis', color: '#94A3B8', type: 'expense', isDefault: true },

  // Receitas
  { name: 'Salário', icon: 'Briefcase', color: '#10B981', type: 'income', isDefault: true },
  { name: 'Freelance & Projetos', icon: 'Laptop', color: '#06B6D4', type: 'income', isDefault: true },
  { name: 'Rendimentos & Investimentos', icon: 'TrendingUp', color: '#8B5CF6', type: 'income', isDefault: true },
  { name: 'Vendas & Desapegos', icon: 'Tag', color: '#F59E0B', type: 'income', isDefault: true },
  { name: 'Outras Receitas', icon: 'Wallet', color: '#3B82F6', type: 'income', isDefault: true },
];

export const categoriesService = {
  async getCategories(userId: string): Promise<Category[]> {
    if (!userId) return [];
    const local = getLocalData<Category>(userId, 'categories');
    if (hasLocalData(userId, 'categories')) {
      return local;
    }

    try {
      const colRef = collection(db, 'users', userId, 'categories');
      const snap = await runWithTimeout(getDocs(colRef), 1200);

      if (!snap.empty) {
        const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
        setLocalData(userId, 'categories', remote);
        return remote;
      }
    } catch (err) {
      console.warn('Error fetching categories from Firestore, using local defaults:', err);
    }

    // Seed defaults in local storage and try background sync
    return await this.seedDefaultCategories(userId);
  },

  async seedDefaultCategories(userId: string): Promise<Category[]> {
    const defaultList: Category[] = DEFAULT_CATEGORIES.map((c, idx) => ({
      id: `cat_default_${idx}`,
      ...c,
    }));

    setLocalData(userId, 'categories', defaultList);

    try {
      const colRef = collection(db, 'users', userId, 'categories');
      const batch = writeBatch(db);
      for (const cat of defaultList) {
        const docRef = doc(colRef, cat.id);
        batch.set(docRef, cat);
      }
      await runWithTimeout(batch.commit(), 1200);
    } catch (err) {
      console.warn('Background batch sync for default categories skipped:', err);
    }

    return defaultList;
  },

  async createCategory(userId: string, category: Omit<Category, 'id'>): Promise<Category> {
    const docRef = doc(collection(db, 'users', userId, 'categories'));
    const newCategory: Category = {
      ...category,
      id: docRef.id,
    };

    saveLocalItem(userId, 'categories', newCategory);

    try {
      await runWithTimeout(setDoc(docRef, newCategory), 1200);
    } catch (e) {
      console.warn('Category saved locally, background Firestore sync pending:', e);
    }

    return newCategory;
  },

  async updateCategory(userId: string, id: string, data: Partial<Category>): Promise<void> {
    const current = getLocalData<Category>(userId, 'categories');
    const existing = current.find((c) => c.id === id);
    if (existing) {
      saveLocalItem(userId, 'categories', { ...existing, ...data });
    }

    try {
      const docRef = doc(db, 'users', userId, 'categories', id);
      await runWithTimeout(updateDoc(docRef, data), 1200);
    } catch (e) {
      console.warn('Category updated locally, background Firestore sync pending:', e);
    }
  },

  async deleteCategory(userId: string, id: string): Promise<void> {
    removeLocalItem(userId, 'categories', id);

    try {
      const docRef = doc(db, 'users', userId, 'categories', id);
      await runWithTimeout(deleteDoc(docRef), 1200);
    } catch (e) {
      console.warn('Category deleted locally, background Firestore sync pending:', e);
    }
  },
};
