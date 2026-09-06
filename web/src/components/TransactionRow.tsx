import type { Category, Transaction } from '../lib/types';
import { CategoryIcon } from './CategoryIcon';
import { formatDate, formatMoney } from '../lib/format';

export function TransactionRow({
  tx,
  category,
  onClick,
}: {
  tx: Transaction;
  category?: Category;
  onClick?: () => void;
}) {
  const isIncome = tx.type === 'income';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface)] p-3 text-left border border-[var(--border)]"
    >
      <CategoryIcon icon={category?.icon ?? 'more-horizontal'} color={category?.color ?? '#78716c'} size={18} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{category?.name ?? 'Uncategorized'}</p>
        <p className="text-xs text-[var(--muted)]">{formatDate(tx.date)}{tx.note ? ` · ${tx.note}` : ''}</p>
      </div>
      <p className="text-sm font-semibold" style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
        {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
      </p>
    </button>
  );
}
