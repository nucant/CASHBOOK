import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchAll, createRow, updateRow, deleteRow, type AllData } from '../lib/sheetsApi';
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

function sortTx(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => b.date.localeCompare(a.date));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(isConfigured());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoConnected = useRef(false);

  const applyData = useCallback((data: AllData) => {
    setAccounts(data.accounts);
    setCategories(data.categories);
    setTransactions(sortTx(data.transactions));
    setRecurring(data.recurring);
  }, []);

  const refresh = useCallback(async () => {
    if (!isConfigured()) return;
    applyData(await fetchAll());
  }, [applyData]);

  // One network round trip in the common case: fetch once, and only
  // fetch again if we actually wrote new rows (first-time seeding or
  // due recurring transactions) — otherwise `fresh` is already current.
  const connect = useCallback(async (onProgress?: (step: string) => void) => {
    setError(null);
    onProgress?.('Connecting to server…');
    const fresh = await fetchAll();
    let wroteRows = false;

    if (fresh.accounts.length === 0 && fresh.categories.length === 0) {
      onProgress?.('Setting up database…');
      await createRow('accounts', { name: 'Cash', type: 'cash', color: '#22c55e', openingBalance: 0 });
      for (const c of DEFAULT_CATEGORIES) {
        await createRow('categories', c as unknown as Record<string, unknown>);
      }
      wroteRows = true;
    }

    const now = new Date();
    const thisMonth = monthKey(now);
    const dueRules = fresh.recurring.filter((r) => r.lastGeneratedMonth !== thisMonth && now.getDate() >= r.dayOfMonth);
    if (dueRules.length > 0) {
      onProgress?.('Applying recurring transactions…');
      for (const rule of dueRules) {
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
      wroteRows = true;
    }

    if (wroteRows) {
      applyData(await fetchAll());
    } else {
      applyData(fresh);
    }
    setConfigured(true);
    setReady(true);
    onProgress?.('Ready to use!');
  }, [applyData]);

  useEffect(() => {
    if (!configured || autoConnected.current) return;
    autoConnected.current = true;
    connect().catch((e) => {
      setError(e instanceof Error ? e.message : 'unknown_error');
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mutations update local state directly from the known change instead
  // of re-fetching all 4 sheets — cuts every add/edit/delete from two
  // Apps Script round trips down to one.
  async function addTransaction(data: Omit<Transaction, 'id'>) {
    try {
      const id = await createRow('transactions', data);
      setTransactions((prev) => sortTx([...prev, { id, ...data }]));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }
  async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id'>>) {
    try {
      await updateRow('transactions', id, data);
      setTransactions((prev) => sortTx(prev.map((t) => (t.id === id ? { ...t, ...data } : t))));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }
  async function deleteTransaction(id: string) {
    try {
      await deleteRow('transactions', id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }
  async function addAccount(data: Omit<Account, 'id'>) {
    try {
      const id = await createRow('accounts', data);
      setAccounts((prev) => [...prev, { id, ...data }]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }
  async function setCategoryLimit(id: string, limit: number | undefined) {
    try {
      await updateRow('categories', id, { monthlyLimit: limit ?? '' });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, monthlyLimit: limit } : c)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }
  async function addRecurringRule(data: Omit<RecurringRule, 'id'>) {
    try {
      const id = await createRow('recurring', data);
      setRecurring((prev) => [...prev, { id, ...data }]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
  }
  async function deleteRecurringRule(id: string) {
    try {
      await deleteRow('recurring', id);
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown_error');
      throw e;
    }
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
