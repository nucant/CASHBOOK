import { useEffect, useState } from 'react';
import { Bell, Plus, AlertTriangle } from 'lucide-react';
import type { Transaction } from '../lib/types';
import { useData } from '../context/DataContext';
import { Sidebar, type DesktopPage } from '../components/Sidebar';
import { PacmanLoader } from '../components/PacmanLoader';
import { AddTransactionSheet } from '../components/AddTransactionSheet';
import { Overview } from '../pages/desktop/Overview';
import { TransactionsTable } from '../pages/desktop/TransactionsTable';
import { DesktopStatistics } from '../pages/desktop/DesktopStatistics';
import { Budgets } from '../pages/desktop/Budgets';
import { Accounts } from '../pages/Accounts';
import { Settings, type Theme } from '../pages/Settings';
import type { ViewMode } from '../hooks/useDeviceMode';

const PAGE_TITLE: Record<DesktopPage, string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  stats: 'Statistics',
  accounts: 'Accounts',
  budgets: 'Budgets',
  settings: 'Settings',
};

export function DesktopApp({
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
  const { ready, configured, error } = useData();
  const [page, setPage] = useState<DesktopPage>(configured ? 'overview' : 'settings');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!configured) setPage('settings');
  }, [configured]);

  function openAdd() {
    setEditingTx(null);
    setSheetOpen(true);
  }
  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setSheetOpen(true);
  }

  return (
    <div className="flex min-h-dvh bg-[var(--bg)]">
      <Sidebar active={page} onChange={setPage} />

      <div className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-8 py-4">
          <h1 className="font-display text-xl">{PAGE_TITLE[page]}</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAdd}
              disabled={!configured}
              className="flex items-center gap-2 rounded-xl bg-[var(--hero)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Plus size={16} /> Add Transaction
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]"
              aria-label="Notifications"
            >
              <Bell size={16} color="var(--muted)" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-8 py-6">
          {!configured && page !== 'settings' && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border p-4 text-sm" style={{ borderColor: 'var(--expense)', background: 'var(--expense-soft)', color: 'var(--expense)' }}>
              <AlertTriangle size={18} /> Connect Google Sheets in Settings to start.
            </div>
          )}
          {configured && error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border p-4 text-sm" style={{ borderColor: 'var(--expense)', background: 'var(--expense-soft)', color: 'var(--expense)' }}>
              <AlertTriangle size={18} /> Sync error: {error}
            </div>
          )}

          {!ready && configured ? (
            <PacmanLoader label="Loading your data…" />
          ) : (
            <>
              {page === 'overview' && <Overview onNavigate={setPage} onEdit={openEdit} />}
              {page === 'transactions' && <TransactionsTable onEdit={openEdit} />}
              {page === 'stats' && <DesktopStatistics />}
              {page === 'accounts' && (
                <div className="max-w-2xl">
                  <Accounts />
                </div>
              )}
              {page === 'budgets' && <Budgets />}
              {page === 'settings' && (
                <div className="max-w-2xl">
                  <Settings theme={theme} onThemeChange={onThemeChange} mode={mode} onModeChange={onModeChange} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {sheetOpen && (
        <AddTransactionSheet
          editing={editingTx}
          onClose={() => {
            setSheetOpen(false);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
}
