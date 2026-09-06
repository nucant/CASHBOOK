import { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../context/DataContext';
import { formatMoney } from '../lib/format';

type Period = 'week' | 'month' | 'year';

function startOfPeriod(period: Period): Date {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

export function Statistics() {
  const [period, setPeriod] = useState<Period>('month');
  const { transactions, categories } = useData();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const from = startOfPeriod(period);
  const inRange = transactions.filter((t) => new Date(t.date + 'T00:00:00') >= from);
  const expenseTx = inRange.filter((t) => t.type === 'expense');
  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);

  const trendData = useMemo(() => {
    if (period === 'year') {
      const buckets = new Map<string, number>();
      for (let i = 0; i < 12; i++) {
        const d = new Date(new Date().getFullYear(), i, 1);
        buckets.set(d.toLocaleDateString('en-IN', { month: 'short' }), 0);
      }
      inRange.forEach((t) => {
        const d = new Date(t.date + 'T00:00:00');
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        const delta = t.type === 'expense' ? t.amount : 0;
        buckets.set(key, (buckets.get(key) ?? 0) + delta);
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
      const d = new Date(t.date + 'T00:00:00');
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
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
    <div className="flex flex-col gap-6 px-4 pt-5">
      <div>
        <p className="text-sm text-[var(--muted)]">Total Spent</p>
        <p className="font-display text-3xl">{formatMoney(totalExpense)}</p>
      </div>

      <div className="flex rounded-full bg-[var(--surface)] border border-[var(--border)] p-1">
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className="flex-1 rounded-full py-2 text-sm font-medium capitalize"
            style={{
              background: period === p ? 'var(--hero)' : 'transparent',
              color: period === p ? '#fff' : 'var(--muted)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={trendData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <Tooltip
              formatter={(v) => formatMoney(Number(v))}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="value" stroke="var(--expense)" strokeWidth={2.5} fill="url(#fillExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">By Category</h3>
        {byCategory.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No expenses in this period.</p>
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={32} outerRadius={50} stroke="none">
                  {byCategory.map((c) => (
                    <Cell key={c.categoryId} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {byCategory.slice(0, 5).map((c) => (
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

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">Top Spending</h3>
        <div className="flex flex-col gap-3">
          {byCategory.slice(0, 5).map((c) => (
            <div key={c.categoryId}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="font-medium">{formatMoney(c.value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg)]">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${totalExpense ? (c.value / totalExpense) * 100 : 0}%`, background: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
