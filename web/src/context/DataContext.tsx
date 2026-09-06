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
  connect: (onProgress?: (step: string) => void) => Promise<void>;
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
  const [configured, setConfigured] = useState(isConfigured());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoConnected = useRef(false);

  const refresh = useCallback(async () => {
    if (!isConfigured()) return;
    const data = await fetchAll();
    setAccounts(data.accounts);
    setCategories(data.categories);
    setTransactions([...data.transactions].sort((a, b) => b.date.localeCompare(a.date)));
    setRecurring(data.recurring);
  }, []);

  const connect = useCallback(async (onProgress?: (step: string) => void) => {
    setError(null);
    onProgress?.('Connecting to server…');
    const fresh = await fetchAll();

    onProgress?.('Setting up database…');
    if (fresh.accounts.length === 0 && fresh.categories.length === 0) {
      await createRow('accounts', { name: 'Cash', type: 'cash', color: '#22c55e', openingBalance: 0 });
      for (const c of DEFAULT_CATEGORIES) {
        await createRow('categories', c as unknown as Record<string, unknown>);
      }
    }

    const now = new Date();
    const thisMonth = monthKey(now);
    for (const rule of fresh.recurring) {
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

    await refresh();
    setConfigured(true);
    setReady(true);
    onProgress?.('Ready to use!');
  }, [refresh]);

  useEffect(() => {
    if (!configured || autoConnected.current) return;
    autoConnected.current = true;
    connect().catch((e) => {
      setError(e instanceof Error ? e.message : 'unknown_error');
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function withRefresh(fn: () => Promise<void>) {
    try {
      await fn();
      await refresh();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }

  async function addTransaction(data: Omit<Transaction, 'id'>) {
    await withRefresh(() => createRow('transactions', data).then(() => {}));
  }
  async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id'>>) {
    await withRefresh(() => updateRow('transactions', id, data));
  }
  async function deleteTransaction(id: string) {
    await withRefresh(() => deleteRow('transactions', id));
  }
  async function addAccount(data: Omit<Account, 'id'>) {
    await withRefresh(() => createRow('accounts', data).then(() => {}));
  }
  async function setCategoryLimit(id: string, limit: number | undefined) {
    await withRefresh(() => updateRow('categories', id, { monthlyLimit: limit ?? '' }));
  }
  async function addRecurringRule(data: Omit<RecurringRule, 'id'>) {
    await withRefresh(() => createRow('recurring', data).then(() => {}));
  }
  async function deleteRecurringRule(id: string) {
    await withRefresh(() => deleteRow('recurring', id));
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
        connect,
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
