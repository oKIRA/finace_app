/**
 * Types & Interfaces for Finance App
 */

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'cards'
  | 'invoices'
  | 'recurring'
  | 'budgets'
  | 'goals'
  | 'reports'
  | 'settings';

export type AccountType = 'checking' | 'savings' | 'cash' | 'investment' | 'other';

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  initialBalance: number; // in cents
  currentBalance: number; // in cents
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export type CategoryType = 'expense' | 'income' | 'both';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault?: boolean;
}

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'pix' | 'transfer';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'card_expense' | 'card_payment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in cents (always positive)
  description: string;
  categoryId: string;
  accountId: string; // origin bank account or paid-from account
  targetAccountId?: string; // used for transfers
  cardId?: string; // used for credit card purchases & payments
  date: string; // YYYY-MM-DD
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
  paymentMethod: PaymentMethod;
  isInstallment?: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  notes?: string;
  invoiceMonth?: string; // YYYY-MM for matching credit card invoices
  createdAt: string;
  updatedAt?: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other';

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  brand: CardBrand;
  limit: number; // in cents
  closingDay: number; // 1 - 31
  dueDay: number; // 1 - 31
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue';

export interface Invoice {
  id: string; // e.g. cardId_YYYY_MM
  cardId: string;
  year: number;
  month: number; // 1 - 12
  amount: number; // in cents
  status: InvoiceStatus;
  closingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paidAt?: string;
  paymentTransactionId?: string;
  paidAmount?: number;
}

export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number; // in cents
  type: 'expense' | 'income';
  categoryId: string;
  accountId?: string;
  cardId?: string;
  dueDay: number; // 1 - 31
  frequency: RecurringFrequency;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number; // monthly limit in cents
  month?: number; // optional specific month or global
  year?: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  targetDate?: string; // YYYY-MM-DD
  color: string;
  icon: string;
  description?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  currency: string;
  locale: string;
  createdAt: string;
}

export interface FilterPeriod {
  year: number;
  month: number; // 1 - 12
}

export interface MonthSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthCardExpenses: number;
  monthInvoicesTotal: number;
  netMonthResult: number;
  availableBalance: number;
  projectedEndBalance: number;
}
