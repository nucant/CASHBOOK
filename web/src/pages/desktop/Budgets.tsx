import { AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useFinance } from '../../hooks/useFinance';
import { CategoryIcon } from '../../components/CategoryIcon';
import { formatMoney } from '../../lib/format';

export function Budgets() {
  const { categories, monthTx, budgetStatus } = useFinance();
  const { setCategoryLimit } = useData();
  const overBudget = budgetStatus.filter((b) => b.spent > b.limit);

  async function updateLimit(id: string, value: string) {
    const num = value === '' ? undefined : Number(value);
    await setCategoryLimit(id, num);
  }

  return (
    <div className="flex flex-col gap-6">
      {overBudget.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--expense)', background: 'var(--expense-soft)' }}>
          <AlertTriangle size={20} color="var(--expense)" />
          <p className="text-sm" style={{ color: 'var(--expense)' }}>
            <strong>{overBudget.map((b) => b.name).join(', ')}</strong> {overBudget.length > 1 ? 'are' : 'is'} over budget this month.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {categories.filter((c) => c.type === 'expense').map((c) => {
          const spent = monthTx.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
          const limit = c.monthlyLimit;
          const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
          const over = limit !== undefined && spent > limit;
          return (
            <div key={c.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex items-center gap-3">
                <CategoryIcon icon={c.icon} color={c.color} size={18} />
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-sm font-semibold" style={over ? { color: 'var(--expense)' } : undefined}>
                  {formatMoney(spent)}
                </span>
              </div>
              {limit ? (
                <div className="h-2 rounded-full bg-[var(--bg)]">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: over ? 'var(--expense)' : c.color }} />
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">No monthly limit set</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[var(--muted)]">Monthly limit</span>
                <input
                  type="number"
                  defaultValue={limit ?? ''}
                  onBlur={(e) => updateLimit(c.id, e.target.value)}
                  placeholder="None"
                  className="w-28 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-right text-sm outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
