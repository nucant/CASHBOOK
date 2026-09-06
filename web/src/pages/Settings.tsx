import { useState } from 'react';
import { Trash2, Plus, Download, Sun, Moon, Monitor, Smartphone, Wand2, Loader2, Check, X as XIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../context/DataContext';
import type { TxType } from '../lib/types';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatDate, formatMoney } from '../lib/format';
import type { ViewMode } from '../hooks/useDeviceMode';
import { getSheetsConfig, setSheetsConfig } from '../lib/sheetsConfig';

export type Theme = 'light' | 'dark' | 'system';

export function Settings({
  theme,
  onThemeChange,
  mode,
  onModeChange,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
}) {
  const {
    categories,
    accounts,
    recurring,
    transactions,
    configured,
    setCategoryLimit,
    addRecurringRule,
    deleteRecurringRule,
    connect,
  } = useData();

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleType, setRuleType] = useState<TxType>('expense');
  const [ruleAccount, setRuleAccount] = useState<string | undefined>(accounts[0]?.id);
  const [ruleCategory, setRuleCategory] = useState<string | undefined>(undefined);
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleDay, setRuleDay] = useState('1');
  const [ruleNote, setRuleNote] = useState('');

  const [sheetsUrl, setSheetsUrl] = useState(() => getSheetsConfig().url);
  const [sheetsToken, setSheetsToken] = useState(() => getSheetsConfig().token);
  const [connStatus, setConnStatus] = useState<'idle' | 'connecting' | 'ok' | 'error'>(configured ? 'ok' : 'idle');
  const [connStep, setConnStep] = useState('');
  const [connError, setConnError] = useState('');

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const expenseCategories = categories.filter((c) => c.type === ruleType);

  async function saveConnection() {
    setSheetsConfig(sheetsUrl, sheetsToken);
    setConnStatus('connecting');
    setConnError('');
    try {
      await connect((step) => setConnStep(step));
      setConnStatus('ok');
    } catch (e) {
      setConnStatus('error');
      setConnError(e instanceof Error ? e.message : 'unknown_error');
    }
  }

  async function addRule() {
    if (!ruleAccount || !ruleCategory || !Number(ruleAmount)) return;
    await addRecurringRule({
      accountId: ruleAccount,
      categoryId: ruleCategory,
      type: ruleType,
      amount: Number(ruleAmount),
      note: ruleNote.trim() || undefined,
      dayOfMonth: Math.min(28, Math.max(1, Number(ruleDay) || 1)),
    });
    setRuleAmount('');
    setRuleNote('');
    setShowRuleForm(false);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Cashbook — Transactions', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Date', 'Category', 'Account', 'Type', 'Amount']],
      body: transactions.map((t) => [
        formatDate(t.date),
        catMap.get(t.categoryId)?.name ?? '-',
        accMap.get(t.accountId)?.name ?? '-',
        t.type,
        formatMoney(t.amount),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [23, 22, 28] },
    });
    doc.save('cashbook-transactions.pdf');
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-5 pb-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">Data Source (Google Sheets)</h3>
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Apps Script Web App URL</label>
            <input
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Secret Token</label>
            <input
              value={sheetsToken}
              onChange={(e) => setSheetsToken(e.target.value)}
              placeholder="the SECRET from Code.gs"
              type="password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            type="button"
            onClick={saveConnection}
            disabled={connStatus === 'connecting'}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--hero)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {connStatus === 'connecting' && <Loader2 size={16} className="animate-spin" />}
            {connStatus === 'ok' && <Check size={16} color="var(--income)" />}
            {connStatus === 'error' && <XIcon size={16} color="var(--expense)" />}
            {connStatus === 'connecting' ? connStep || 'Connecting…' : 'Save & Test Connection'}
          </button>
          {connStatus === 'ok' && <p className="text-xs" style={{ color: 'var(--income)' }}>Connected — {accounts.length} account(s), {categories.length} categories loaded.</p>}
          {connStatus === 'error' && <p className="text-xs" style={{ color: 'var(--expense)' }}>Could not connect ({connError}). Check the URL and token.</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">Appearance</h3>
        <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          {([
            { key: 'light', icon: Sun },
            { key: 'system', icon: Monitor },
            { key: 'dark', icon: Moon },
          ] as { key: Theme; icon: typeof Sun }[]).map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onThemeChange(key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium capitalize"
              style={{
                background: theme === key ? 'var(--hero)' : 'transparent',
                color: theme === key ? '#fff' : 'var(--muted)',
              }}
            >
              <Icon size={14} /> {key}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">Layout</h3>
        <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          {([
            { key: 'auto', icon: Wand2, label: 'Auto' },
            { key: 'mobile', icon: Smartphone, label: 'Mobile' },
            { key: 'desktop', icon: Monitor, label: 'Desktop' },
          ] as { key: ViewMode; icon: typeof Wand2; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onModeChange(key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium"
              style={{
                background: mode === key ? 'var(--hero)' : 'transparent',
                color: mode === key ? '#fff' : 'var(--muted)',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Auto switches between the mobile and desktop layout based on your screen width.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">Category Budgets (Monthly)</h3>
        <div className="flex flex-col gap-2">
          {categories.filter((c) => c.type === 'expense').map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <CategoryIcon icon={c.icon} color={c.color} size={16} />
              <span className="flex-1 text-sm">{c.name}</span>
              <input
                type="number"
                defaultValue={c.monthlyLimit ?? ''}
                onBlur={(e) => setCategoryLimit(c.id, e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="No limit"
                className="w-28 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-right text-sm outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--muted)]">Recurring Expenses</h3>
          <button
            type="button"
            onClick={() => setShowRuleForm((s) => !s)}
            className="flex items-center gap-1 rounded-full bg-[var(--hero)] px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {showRuleForm && (
          <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex gap-2">
              {(['expense', 'income'] as TxType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setRuleType(t); setRuleCategory(undefined); }}
                  className="flex-1 rounded-xl border py-2 text-xs font-medium capitalize"
                  style={{
                    borderColor: ruleType === t ? 'var(--accent)' : 'var(--border)',
                    background: ruleType === t ? 'var(--accent-soft)' : 'transparent',
                    color: ruleType === t ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={ruleCategory ?? ''}
              onChange={(e) => setRuleCategory(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
            >
              <option value="" disabled>Select category</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={ruleAccount ?? ''}
              onChange={(e) => setRuleAccount(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                value={ruleAmount}
                onChange={(e) => setRuleAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
              />
              <input
                type="number"
                value={ruleDay}
                onChange={(e) => setRuleDay(e.target.value)}
                min={1}
                max={28}
                placeholder="Day"
                className="w-20 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <input
              type="text"
              value={ruleNote}
              onChange={(e) => setRuleNote(e.target.value)}
              placeholder="Note (e.g. House rent)"
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
            />
            <button type="button" onClick={addRule} className="rounded-xl bg-[var(--hero)] py-2.5 text-sm font-semibold text-white">
              Save Rule
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {recurring.length === 0 && !showRuleForm && (
            <p className="text-sm text-[var(--muted)]">No recurring rules yet.</p>
          )}
          {recurring.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <CategoryIcon icon={catMap.get(r.categoryId)?.icon ?? 'more-horizontal'} color={catMap.get(r.categoryId)?.color ?? '#78716c'} size={16} />
              <div className="flex-1">
                <p className="text-sm font-medium">{catMap.get(r.categoryId)?.name} · Day {r.dayOfMonth}</p>
                <p className="text-xs text-[var(--muted)]">{accMap.get(r.accountId)?.name}{r.note ? ` · ${r.note}` : ''}</p>
              </div>
              <span className="text-sm font-semibold">{formatMoney(r.amount)}</span>
              <button type="button" onClick={() => deleteRecurringRule(r.id)} aria-label="Delete rule">
                <Trash2 size={16} color="var(--expense)" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">Export</h3>
        <button
          type="button"
          onClick={exportPdf}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 text-sm font-medium"
        >
          <Download size={16} /> Export all transactions as PDF
        </button>
      </div>
    </div>
  );
}
