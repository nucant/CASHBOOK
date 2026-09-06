import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import type { Transaction, TxType } from '../lib/types';
import { CategoryIcon } from './CategoryIcon';

export function AddTransactionSheet({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: Transaction | null;
}) {
  const { accounts, categories, addTransaction, updateTransaction, deleteTransaction } = useData();
  const { showToast } = useToast();

  const [type, setType] = useState<TxType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [accountId, setAccountId] = useState<string | undefined>(editing?.accountId);
  const [categoryId, setCategoryId] = useState<string | undefined>(editing?.categoryId);
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(editing?.note ?? '');

  useEffect(() => {
    if (!accountId && accounts.length) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (categoryId && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id);
    } else if (!categoryId) {
      setCategoryId(filteredCategories[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  const canSave = Number(amount) > 0 && accountId && categoryId && date;

  function handleSave() {
    if (!canSave) return;
    const payload = {
      accountId: accountId!,
      categoryId: categoryId!,
      type,
      amount: Number(amount),
      note: note.trim() || undefined,
      date,
    };
    onClose();
    const promise = editing?.id ? updateTransaction(editing.id, payload) : addTransaction(payload);
    promise
      .then(() => showToast('Saved', 'success'))
      .catch(() => showToast('Failed to save — check connection', 'error'));
  }

  function handleDelete() {
    if (!editing?.id) return;
    const id = editing.id;
    onClose();
    deleteTransaction(id)
      .then(() => showToast('Deleted', 'success'))
      .catch(() => showToast('Failed to delete — check connection', 'error'));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-[460px] rounded-t-3xl bg-[var(--surface)] p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] sm:rounded-3xl sm:pb-5 sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={22} color="var(--muted)" />
          </button>
        </div>

        <div className="mb-4 flex rounded-full bg-[var(--bg)] p-1">
          {(['expense', 'income'] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors"
              style={{
                background: type === t ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'transparent',
                color: type === t ? '#fff' : 'var(--muted)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Amount</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-2xl font-semibold outline-none"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-[var(--muted)]">Category</label>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <div
                  className="rounded-full ring-offset-2"
                  style={{ boxShadow: categoryId === c.id ? `0 0 0 2px ${c.color}` : 'none', borderRadius: 999 }}
                >
                  <CategoryIcon icon={c.icon} color={c.color} size={16} />
                </div>
                <span className="text-[11px] text-[var(--muted)]">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Account</label>
            <select
              value={accountId ?? ''}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-sm outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Lunch with team"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="flex gap-3">
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center rounded-2xl border border-[var(--border)] px-4 text-[var(--expense)]"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--hero)] py-3.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {editing ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
