import type { LucideIcon } from 'lucide-react';
import { formatMoney } from '../lib/format';

export function OverviewCard({
  label,
  amount,
  icon: Icon,
  tone = 'neutral',
  delta,
}: {
  label: string;
  amount: number;
  icon: LucideIcon;
  tone?: 'neutral' | 'income' | 'expense';
  delta?: number;
}) {
  const toneColor = tone === 'income' ? 'var(--income)' : tone === 'expense' ? 'var(--expense)' : 'var(--accent)';
  const toneSoft = tone === 'income' ? 'var(--income-soft)' : tone === 'expense' ? 'var(--expense-soft)' : 'var(--accent-soft)';
  return (
    <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: toneSoft, color: toneColor }}>
          <Icon size={16} />
        </div>
      </div>
      <p className="font-display text-2xl tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatMoney(amount)}
      </p>
      {delta !== undefined && Number.isFinite(delta) && (
        <p className="mt-1 text-xs" style={{ color: delta >= 0 ? 'var(--income)' : 'var(--expense)' }}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(0)}% vs last month
        </p>
      )}
    </div>
  );
}
