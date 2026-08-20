import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Category } from '../types';

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
    try {
      const colRef = collection(db, 'users', userId, 'categories');
      const snap = await getDocs(colRef);

      if (snap.empty) {
        // Initialize with default categories
        return await this.seedDefaultCategories(userId);
      }

      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    } catch (err) {
      console.warn('Error fetching categories from Firestore, using local defaults:', err);
      return DEFAULT_CATEGORIES.map((c, idx) => ({ id: `default_cat_${idx}`, ...c }));
    }
  },

  async seedDefaultCategories(userId: string): Promise<Category[]> {
    const colRef = collection(db, 'users', userId, 'categories');
    const createdList: Category[] = [];

    try {
      const batch = writeBatch(db);
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const cat = DEFAULT_CATEGORIES[i];
        const docRef = doc(colRef);
        const newCat: Category = { id: docRef.id, ...cat };
        batch.set(docRef, newCat);
        createdList.push(newCat);
      }
      await batch.commit();
      return createdList;
    } catch (err) {
      console.warn('Error batch seeding categories:', err);
      return DEFAULT_CATEGORIES.map((c, idx) => ({ id: `default_cat_${idx}`, ...c }));
    }
  },

  async createCategory(userId: string, category: Omit<Category, 'id'>): Promise<Category> {
    const docRef = doc(collection(db, 'users', userId, 'categories'));
    const newCategory: Category = {
      ...category,
      id: docRef.id,
    };
    await setDoc(docRef, newCategory);
    return newCategory;
  },

  async updateCategory(userId: string, id: string, data: Partial<Category>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', id);
    await updateDoc(docRef, data);
  },

  async deleteCategory(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', id);
    await deleteDoc(docRef);
  },
};
