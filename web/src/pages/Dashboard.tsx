import { useFinance } from '../hooks/useFinance';
import type { Transaction } from '../lib/types';
import { BalanceCard } from '../components/BalanceCard';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';

export function Dashboard({ onEdit }: { onEdit: (tx: Transaction) => void }) {
  const { balance, income, expense, transactions, categoryMap } = useFinance();
  const recent = transactions.slice(0, 8);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      <BalanceCard balance={balance} />

      <div className="flex gap-3">
        <StatCard type="income" amount={income} />
        <StatCard type="expense" amount={expense} />
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
