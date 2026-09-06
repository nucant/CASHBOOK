import { useData } from '../context/DataContext';
import type { Transaction } from '../lib/types';
import { monthKey } from '../lib/format';

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  value: number;
}

export interface BudgetStatus {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  limit: number;
  spent: number;
}

function breakdown(
  txs: Transaction[],
  categoryMap: Map<string, { name: string; color: string; icon: string }>,
): CategoryBreakdownItem[] {
  const map = new Map<string, number>();
  txs.forEach((t) => map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount));
  return Array.from(map, ([categoryId, value]) => ({
    categoryId,
    value,
    name: categoryMap.get(categoryId)?.name ?? 'Other',
    color: categoryMap.get(categoryId)?.color ?? '#78716c',
    icon: categoryMap.get(categoryId)?.icon ?? 'more-horizontal',
  })).sort((a, b) => b.value - a.value);
}

export function useFinance() {
  const { accounts, categories, transactions } = useData();

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const openingTotal = accounts.reduce((sum, a) => sum + a.openingBalance, 0);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    openingTotal,
  );

  const now = new Date();
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const monthTx = transactions.filter((t) => t.date.startsWith(thisMonth));
  const lastMonthTx = transactions.filter((t) => t.date.startsWith(lastMonth));

  const sumBy = (txs: Transaction[], type: 'income' | 'expense') =>
    txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const income = sumBy(monthTx, 'income');
  const expense = sumBy(monthTx, 'expense');
  const lastIncome = sumBy(lastMonthTx, 'income');
  const lastExpense = sumBy(lastMonthTx, 'expense');

  const byCategory = breakdown(monthTx.filter((t) => t.type === 'expense'), categoryMap);

  const budgetStatus: BudgetStatus[] = categories
    .filter((c) => c.type === 'expense' && c.monthlyLimit)
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      limit: c.monthlyLimit!,
      spent: monthTx.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0),
    }));

  return {
    accounts,
    categories,
    transactions,
    categoryMap,
    accountMap,
    balance,
    income,
    expense,
    lastIncome,
    lastExpense,
    monthTx,
    byCategory,
    budgetStatus,
  };
}
