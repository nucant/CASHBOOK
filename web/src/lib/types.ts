export type AccountType = 'cash' | 'bank' | 'card';
export type TxType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  openingBalance: number;
}

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;
  icon: string;
  monthlyLimit?: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TxType;
  amount: number;
  note?: string;
  date: string;
}

export interface RecurringRule {
  id: string;
  accountId: string;
  categoryId: string;
  type: TxType;
  amount: number;
  note?: string;
  dayOfMonth: number;
  lastGeneratedMonth?: string;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', type: 'expense', color: '#f59e0b', icon: 'utensils' },
  { name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'car' },
  { name: 'Bills', type: 'expense', color: '#ef4444', icon: 'receipt' },
  { name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'shopping-bag' },
  { name: 'Health', type: 'expense', color: '#10b981', icon: 'heart-pulse' },
  { name: 'Education', type: 'expense', color: '#6366f1', icon: 'book-open' },
  { name: 'Entertainment', type: 'expense', color: '#a855f7', icon: 'clapperboard' },
  { name: 'Rent', type: 'expense', color: '#64748b', icon: 'home' },
  { name: 'Other', type: 'expense', color: '#78716c', icon: 'more-horizontal' },
  { name: 'Salary', type: 'income', color: '#22c55e', icon: 'wallet' },
  { name: 'Other Income', type: 'income', color: '#06b6d4', icon: 'trending-up' },
];
