import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchAll, createRow, updateRow, deleteRow } from '../lib/sheetsApi';
import { isConfigured } from '../lib/sheetsConfig';
import { DEFAULT_CATEGORIES, type Account, type Category, type Transaction, type RecurringRule } from '../lib/types';
import { monthKey } from '../lib/format';

interface DataContextValue {
  ready: boolean;
  configured: boolean;
  error: string | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringRule[];
  refresh: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addAccount: (data: Omit<Account, 'id'>) => Promise<void>;
  setCategoryLimit: (id: string, limit: number | undefined) => Promise<void>;
  addRecurringRule: (data: Omit<RecurringRule, 'id'>) => Promise<void>;
  deleteRecurringRule: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const configured = isConfigured();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [ready, setReady] = useState(!configured);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    if (!isConfigured()) return;
    try {
      const data = await fetchAll();
      setAccounts(data.accounts);
      setCategories(data.categories);
      setTransactions([...data.transactions].sort((a, b) => b.date.localeCompare(a.date)));
      setRecurring(data.recurring);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
    }
  }, []);

  useEffect(() => {
    if (!configured || initialized.current) return;
    initialized.current = true;
    (async () => {
      await refresh();

      const fresh = await fetchAll().catch(() => null);
      if (fresh && fresh.accounts.length === 0 && fresh.categories.length === 0) {
        await createRow('accounts', { name: 'Cash', type: 'cash', color: '#22c55e', openingBalance: 0 });
        for (const c of DEFAULT_CATEGORIES) {
          await createRow('categories', c as unknown as Record<string, unknown>);
        }
      }

      const afterSeed = await fetchAll().catch(() => null);
      if (afterSeed) {
        const now = new Date();
        const thisMonth = monthKey(now);
        for (const rule of afterSeed.recurring) {
          if (rule.lastGeneratedMonth === thisMonth) continue;
          if (now.getDate() < rule.dayOfMonth) continue;
          const date = new Date(now.getFullYear(), now.getMonth(), rule.dayOfMonth).toISOString().slice(0, 10);
          await createRow('transactions', {
            accountId: rule.accountId,
            categoryId: rule.categoryId,
            type: rule.type,
            amount: rule.amount,
            note: rule.note,
            date,
          });
          await updateRow('recurring', rule.id, { lastGeneratedMonth: thisMonth });
        }
      }

      await refresh();
      setReady(true);
    })();
  }, [configured, refresh]);

  async function addTransaction(data: Omit<Transaction, 'id'>) {
    await createRow('transactions', data);
    await refresh();
  }
  async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id'>>) {
    await updateRow('transactions', id, data);
    await refresh();
  }
  async function deleteTransaction(id: string) {
    await deleteRow('transactions', id);
    await refresh();
  }
  async function addAccount(data: Omit<Account, 'id'>) {
    await createRow('accounts', data);
    await refresh();
  }
  async function setCategoryLimit(id: string, limit: number | undefined) {
    await updateRow('categories', id, { monthlyLimit: limit ?? '' });
    await refresh();
  }
  async function addRecurringRule(data: Omit<RecurringRule, 'id'>) {
    await createRow('recurring', data);
    await refresh();
  }
  async function deleteRecurringRule(id: string) {
    await deleteRow('recurring', id);
    await refresh();
  }

  return (
    <DataContext.Provider
      value={{
        ready,
        configured,
        error,
        accounts,
        categories,
        transactions,
        recurring,
        refresh,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        setCategoryLimit,
        addRecurringRule,
        deleteRecurringRule,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
