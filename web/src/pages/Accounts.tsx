import { useState } from 'react';
import { Wallet, Landmark, CreditCard, Plus, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { AccountType } from '../lib/types';
import { formatMoney } from '../lib/format';

const TYPE_ICON: Record<AccountType, typeof Wallet> = {
  cash: Wallet,
  bank: Landmark,
  card: CreditCard,
};

const PALETTE = ['#6c5ce7', '#2fbf71', '#f0653e', '#3b82f6', '#ec4899', '#f59e0b'];

export function Accounts() {
  const { accounts, transactions, addAccount } = useData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [opening, setOpening] = useState('');
  const [saving, setSaving] = useState(false);

  function balanceFor(accountId: string, opening: number) {
    return transactions
      .filter((t) => t.accountId === accountId)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), opening);
  }

  async function handleAddAccount() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await addAccount({
        name: name.trim(),
        type,
        color: PALETTE[accounts.length % PALETTE.length],
        openingBalance: Number(opening) || 0,
      });
      setName('');
      setOpening('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 rounded-full bg-[var(--hero)] px-3 py-1.5 text-xs font-medium text-white"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Account name (e.g. HDFC Bank)"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
          />
          <div className="flex gap-2">
            {(['cash', 'bank', 'card'] as AccountType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="flex-1 rounded-xl border py-2 text-xs font-medium capitalize"
                style={{
                  borderColor: type === t ? 'var(--accent)' : 'var(--border)',
                  background: type === t ? 'var(--accent-soft)' : 'transparent',
                  color: type === t ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            type="number"
            placeholder="Opening balance"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
          />
          <button
            type="button"
            onClick={handleAddAccount}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--hero)] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save Account
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {accounts.map((a) => {
          const Icon = TYPE_ICON[a.type];
          const bal = balanceFor(a.id, a.openingBalance);
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${a.color}22`, color: a.color }}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs capitalize text-[var(--muted)]">{a.type}</p>
              </div>
              <p className="text-sm font-semibold">{formatMoney(bal)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
