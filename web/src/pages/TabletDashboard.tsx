import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useFinance } from '../hooks/useFinance';
import type { Transaction } from '../lib/types';
import { BalanceCard } from '../components/BalanceCard';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';
import { formatMoney } from '../lib/format';

export function TabletDashboard({ onEdit }: { onEdit: (tx: Transaction) => void }) {
  const { balance, income, expense, transactions, categoryMap, byCategory } = useFinance();
  const recent = transactions.slice(0, 10);

  return (
    <div className="grid grid-cols-2 gap-5 px-6 pt-5">
      <div className="flex flex-col gap-5">
        <BalanceCard balance={balance} />
        <div className="flex gap-3">
          <StatCard type="income" amount={income} />
          <StatCard type="expense" amount={expense} />
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--muted)]">By Category</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No expenses this month.</p>
          ) : (
            <div className="flex items-center gap-5">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={32} outerRadius={50} stroke="none">
                    {byCategory.map((c) => (
                      <Cell key={c.categoryId} fill={c.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
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
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">Recent Transactions</h3>
        <div className="flex flex-col gap-2">
          {recent.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
              No transactions yet. Tap + to add your first one.
            </p>
          )}
          {recent.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} category={categoryMap.get(tx.categoryId)} onClick={() => onEdit(tx)} />
          ))}
        </div>
      </div>
    </div>
  );
}
