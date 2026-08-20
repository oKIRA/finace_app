import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Account,
  Category,
  Transaction,
  CreditCard,
  Invoice,
  RecurringBill,
  Budget,
  FinancialGoal,
  MonthSummary,
} from '../types';
import { useAuth } from './AuthContext';
import { useDateFilter } from './DateFilterContext';
import { accountsService } from '../services/accountsService';
import { categoriesService } from '../services/categoriesService';
import { transactionsService } from '../services/transactionsService';
import { cardsService } from '../services/cardsService';
import { invoicesService } from '../services/invoicesService';
import { recurringService } from '../services/recurringService';
import { budgetsService } from '../services/budgetsService';
import { goalsService } from '../services/goalsService';
import {
  calculateMonthSummary,
  calculateExpensesByCategory,
  generateSmartInsights,
  CategoryExpenseBreakdown,
  SmartInsight,
} from '../lib/calculations/financial';

interface FinanceDataContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[]; // for current selected month
  allTransactions: Transaction[]; // broader for installments & history
  cards: CreditCard[];
  invoices: Invoice[];
  recurring: RecurringBill[];
  budgets: Budget[];
  goals: FinancialGoal[];
  summary: MonthSummary;
  categoryExpenses: CategoryExpenseBreakdown[];
  smartInsights: SmartInsight[];
  loading: boolean;
  refreshData: () => Promise<void>;
  // Fast action triggers
  isTransactionModalOpen: boolean;
  openTransactionModal: (initialTab?: 'income' | 'expense' | 'card' | 'transfer') => void;
  closeTransactionModal: () => void;
  initialTransactionTab: 'income' | 'expense' | 'card' | 'transfer';
}

const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

export const FinanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { selectedYear, selectedMonth } = useDateFilter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurring, setRecurring] = useState<RecurringBill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [initialTransactionTab, setInitialTransactionTab] = useState<'income' | 'expense' | 'card' | 'transfer'>('expense');

  const openTransactionModal = (tab: 'income' | 'expense' | 'card' | 'transfer' = 'expense') => {
    setInitialTransactionTab(tab);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
  };

  const loadData = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setAllTransactions([]);
      setCards([]);
      setInvoices([]);
      setRecurring([]);
      setBudgets([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const uid = user.uid;

      // Parallel fetch for speed
      const [
        accs,
        cats,
        monthTrans,
        allTrans,
        creditCards,
        recurringBills,
        budgetsList,
        goalsList,
      ] = await Promise.all([
        accountsService.getAccounts(uid),
        categoriesService.getCategories(uid),
        transactionsService.getTransactions(uid, { year: selectedYear, month: selectedMonth }),
        transactionsService.getTransactions(uid, { limitCount: 200 }),
        cardsService.getCards(uid),
        recurringService.getRecurringBills(uid),
        budgetsService.getBudgets(uid),
        goalsService.getGoals(uid),
      ]);

      let resolvedAccs = accs;
      if (resolvedAccs.length === 0) {
        try {
          const defaultAcc = await accountsService.createAccount(uid, {
            name: 'Conta Principal',
            bank: 'Geral',
            type: 'checking',
            initialBalance: 0,
            currentBalance: 0,
            color: '#10B981',
          });
          resolvedAccs = [defaultAcc];
        } catch (e) {
          console.warn('Could not auto-create default account:', e);
        }
      }

      let resolvedCats = cats;
      if (resolvedCats.length === 0) {
        try {
          resolvedCats = await categoriesService.seedDefaultCategories(uid);
        } catch (e) {
          console.warn('Could not auto-seed categories:', e);
        }
      }

      // Calculate invoice representations for this month concurrently
      const periodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

      const invoicesList: Invoice[] = await Promise.all(
        creditCards.map(async (card) => {
          const cardExpensesTotal = monthTrans
            .filter((t) => t.cardId === card.id && t.type === 'card_expense' && (t.invoiceMonth ? t.invoiceMonth === periodStr : true))
            .reduce((sum, t) => sum + t.amount, 0);

          return await invoicesService.getOrCreateInvoiceRecord(
            uid,
            card,
            selectedYear,
            selectedMonth,
            cardExpensesTotal
          );
        })
      );

      setAccounts(resolvedAccs);
      setCategories(resolvedCats);
      setTransactions(monthTrans);
      setAllTransactions(allTrans);
      setCards(creditCards);
      setInvoices(invoicesList);
      setRecurring(recurringBills);
      setBudgets(budgetsList);
      setGoals(goalsList);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived financial analytics
  const summary = calculateMonthSummary(
    accounts,
    transactions,
    cards,
    recurring,
    selectedYear,
    selectedMonth
  );

  const categoryExpenses = calculateExpensesByCategory(
    transactions,
    categories,
    selectedYear,
    selectedMonth
  );

  const smartInsights = generateSmartInsights(
    summary,
    categoryExpenses,
    cards,
    allTransactions,
    selectedYear,
    selectedMonth
  );

  return (
    <FinanceDataContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        allTransactions,
        cards,
        invoices,
        recurring,
        budgets,
        goals,
        summary,
        categoryExpenses,
        smartInsights,
        loading,
        refreshData: loadData,
        isTransactionModalOpen,
        openTransactionModal,
        closeTransactionModal,
        initialTransactionTab,
      }}
    >
      {children}
    </FinanceDataContext.Provider>
  );
};

export const useFinanceData = () => {
  const context = useContext(FinanceDataContext);
  if (!context) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }
  return context;
};
