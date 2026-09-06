import { useMemo, useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { CategoryIcon } from '../../components/CategoryIcon';
import { formatDate, formatMoney } from '../../lib/format';
import type { Transaction } from '../../lib/types';

type SortKey = 'date' | 'amount';

export function TransactionsTable({ onEdit }: { onEdit: (tx: Transaction) => void }) {
  const { transactions, categoryMap, accountMap, categories, accounts } = useFinance();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let rows = transactions;
    if (categoryFilter !== 'all') rows = rows.filter((t) => String(t.categoryId) === categoryFilter);
    if (accountFilter !== 'all') rows = rows.filter((t) => String(t.accountId) === accountFilter);
    if (typeFilter !== 'all') rows = rows.filter((t) => t.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((t) => {
        const cat = categoryMap.get(t.categoryId)?.name?.toLowerCase() ?? '';
        const note = t.note?.toLowerCase() ?? '';
        return cat.includes(q) || note.includes(q);
      });
    }
    const sorted = [...rows].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'amount') return (a.amount - b.amount) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
    return sorted;
  }, [transactions, categoryFilter, accountFilter, typeFilter, search, sortKey, sortDir, categoryMap]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" color="var(--muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by category or note…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort('date')}>
                <span className="flex items-center gap-1">Date <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Note</th>
              <th className="cursor-pointer select-none px-4 py-3 text-right" onClick={() => toggleSort('amount')}>
                <span className="flex items-center justify-end gap-1">Amount <ArrowUpDown size={12} /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              return (
                <tr
                  key={tx.id}
                  onClick={() => onEdit(tx)}
                  className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={cat?.icon ?? 'more-horizontal'} color={cat?.color ?? '#78716c'} size={14} />
                      {cat?.name ?? 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{accountMap.get(tx.accountId)?.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{tx.note ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
                    {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                  No transactions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
