import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { OverviewCard } from '../../components/OverviewCard';
import { TransactionRow } from '../../components/TransactionRow';
import { CategoryIcon } from '../../components/CategoryIcon';
import { formatMoney } from '../../lib/format';
import type { DesktopPage } from '../../components/Sidebar';

function pctDelta(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export function Overview({ onNavigate, onEdit }: { onNavigate: (p: DesktopPage) => void; onEdit: (tx: import('../../lib/types').Transaction) => void }) {
  const { balance, income, expense, lastIncome, lastExpense, byCategory, monthTx, budgetStatus, transactions, categoryMap } = useFinance();

  const trendData = useMemo(() => {
    const now = new Date();
    const days = now.getDate();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const key = d.toISOString().slice(0, 10);
      const value = monthTx.filter((t) => t.type === 'expense' && t.date === key).reduce((s, t) => s + t.amount, 0);
      buckets.push({ label: d.toLocaleDateString('en-IN', { day: '2-digit' }), value });
    }
    return buckets;
  }, [monthTx]);

  const recent = transactions.slice(0, 6);
  const net = income - expense;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <OverviewCard label="Total Balance" amount={balance} icon={Wallet} tone="neutral" />
        <OverviewCard label="Income (this month)" amount={income} icon={TrendingUp} tone="income" delta={pctDelta(income, lastIncome)} />
        <OverviewCard label="Expense (this month)" amount={expense} icon={TrendingDown} tone="expense" delta={pctDelta(expense, lastExpense)} />
        <OverviewCard label="Net Savings (this month)" amount={net} icon={PiggyBank} tone={net >= 0 ? 'income' : 'expense'} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">Spending this month</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillExpenseDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} interval={4} />
              <Tooltip
                formatter={(v) => formatMoney(Number(v))}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="value" stroke="var(--expense)" strokeWidth={2.5} fill="url(#fillExpenseDesktop)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">By Category</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No expenses yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} stroke="none">
                    {byCategory.map((c) => (
                      <Cell key={c.categoryId} fill={c.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {byCategory.slice(0, 4).map((c) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatMoney(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--muted)]">Budgets</h3>
            <button type="button" onClick={() => onNavigate('budgets')} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              View all
            </button>
          </div>
          {budgetStatus.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No budget limits set. Add them in Settings.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {budgetStatus.slice(0, 4).map((b) => {
                const over = b.spent > b.limit;
                const pct = Math.min(100, (b.spent / b.limit) * 100);
                return (
                  <div key={b.categoryId}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <CategoryIcon icon={b.icon} color={b.color} size={12} />
                        {b.name}
                      </span>
                      <span className={over ? 'font-semibold' : 'text-[var(--muted)]'} style={over ? { color: 'var(--expense)' } : undefined}>
                        {formatMoney(b.spent)} / {formatMoney(b.limit)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg)]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, background: over ? 'var(--expense)' : b.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--muted)]">Recent Transactions</h3>
            <button type="button" onClick={() => onNavigate('transactions')} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recent.length === 0 && <p className="text-sm text-[var(--muted)]">No transactions yet.</p>}
            {recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} category={categoryMap.get(tx.categoryId)} onClick={() => onEdit(tx)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
