import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatMoney } from '../lib/format';

export function StatCard({ type, amount }: { type: 'income' | 'expense'; amount: number }) {
  const isIncome = type === 'income';
  return (
    <div
      className="flex flex-1 items-center gap-3 rounded-2xl p-4"
      style={{ background: isIncome ? 'var(--income-soft)' : 'var(--expense-soft)' }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: isIncome ? 'var(--income)' : 'var(--expense)' }}
      >
        {isIncome ? (
          <ArrowUpRight size={18} color="#fff" strokeWidth={2.5} />
        ) : (
          <ArrowDownLeft size={18} color="#fff" strokeWidth={2.5} />
        )}
      </div>
      <div>
        <p className="text-xs text-[var(--muted)]">{isIncome ? 'Income' : 'Expense'}</p>
        <p className="text-sm font-semibold">{formatMoney(amount)}</p>
      </div>
    </div>
  );
}
