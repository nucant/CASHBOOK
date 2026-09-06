import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useFinance } from '../../hooks/useFinance';
import { formatMoney } from '../../lib/format';

type Period = 'week' | 'month' | 'year';

function startOfPeriod(period: Period): Date {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

export function DesktopStatistics() {
  const { transactions, categoryMap } = useFinance();
  const [period, setPeriod] = useState<Period>('month');

  const from = startOfPeriod(period);
  const inRange = transactions.filter((t) => new Date(t.date + 'T00:00:00') >= from);
  const expenseTx = inRange.filter((t) => t.type === 'expense');
  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const totalIncome = inRange.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const trendData = useMemo(() => {
    if (period === 'year') {
      const buckets = new Map<string, number>();
      for (let i = 0; i < 12; i++) {
        buckets.set(new Date(new Date().getFullYear(), i, 1).toLocaleDateString('en-IN', { month: 'short' }), 0);
      }
      inRange.forEach((t) => {
        if (t.type !== 'expense') return;
        const key = new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' });
        buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
      });
      return Array.from(buckets, ([label, value]) => ({ label, value }));
    }
    const days = period === 'week' ? 7 : new Date().getDate();
    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      buckets.set(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), 0);
    }
    inRange.forEach((t) => {
      if (t.type !== 'expense') return;
      const key = new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
    });
    return Array.from(buckets, ([label, value]) => ({ label, value }));
  }, [period, inRange, from]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenseTx.forEach((t) => map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount));
    return Array.from(map, ([categoryId, value]) => ({
      categoryId,
      value,
      name: categoryMap.get(categoryId)?.name ?? 'Other',
      color: categoryMap.get(categoryId)?.color ?? '#78716c',
    })).sort((a, b) => b.value - a.value);
  }, [expenseTx, categoryMap]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-[var(--muted)]">Total Income</p>
            <p className="font-display text-2xl" style={{ color: 'var(--income)' }}>{formatMoney(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Total Expense</p>
            <p className="font-display text-2xl" style={{ color: 'var(--expense)' }}>{formatMoney(totalExpense)}</p>
          </div>
        </div>
        <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className="rounded-full px-4 py-2 text-sm font-medium capitalize"
              style={{ background: period === p ? 'var(--hero)' : 'transparent', color: period === p ? '#fff' : 'var(--muted)' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">Spending Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillExpenseDStats" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="var(--expense)" strokeWidth={2.5} fill="url(#fillExpenseDStats)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">Category Breakdown</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No expenses in this period.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} stroke="none">
                    {byCategory.map((c) => (
                      <Cell key={c.categoryId} fill={c.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byCategory.slice(0, 6).map((c) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatMoney(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">Category Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory.slice(0, 6)} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byCategory.slice(0, 6).map((c) => (
                  <Cell key={c.categoryId} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
