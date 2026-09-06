import { useEffect, useState } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { type Transaction } from '../lib/types';
import { useData } from '../context/DataContext';
import { BottomNav, type Page } from '../components/BottomNav';
import { PacmanLoader } from '../components/PacmanLoader';
import { AddTransactionSheet } from '../components/AddTransactionSheet';
import { TabletDashboard } from '../pages/TabletDashboard';
import { Statistics } from '../pages/Statistics';
import { Accounts } from '../pages/Accounts';
import { Settings, type Theme } from '../pages/Settings';
import type { ViewMode } from '../hooks/useDeviceMode';

const PAGE_TITLE: Record<Page, string> = {
  home: 'Cashbook',
  stats: 'Statistics',
  accounts: 'Accounts',
  settings: 'Settings',
};

export function TabletApp({
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
  const [page, setPage] = useState<Page>(configured ? 'home' : 'settings');
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
    <div className="mx-auto flex min-h-dvh max-w-[820px] flex-col bg-[var(--bg)]">
      <header className="flex items-center justify-between px-6 pt-6">
        <h1 className="font-display text-2xl">{PAGE_TITLE[page]}</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
          aria-label="Notifications"
        >
          <Bell size={17} color="var(--muted)" />
        </button>
      </header>

      {!configured && page !== 'settings' && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-2xl border p-3 text-xs" style={{ borderColor: 'var(--expense)', background: 'var(--expense-soft)', color: 'var(--expense)' }}>
          <AlertTriangle size={16} /> Connect Google Sheets in Settings to start.
        </div>
      )}
      {configured && error && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-2xl border p-3 text-xs" style={{ borderColor: 'var(--expense)', background: 'var(--expense-soft)', color: 'var(--expense)' }}>
          <AlertTriangle size={16} /> Sync error: {error}
        </div>
      )}

      <main className="flex-1 pb-8">
        {!ready && configured ? (
          <PacmanLoader label="Loading your data…" />
        ) : (
          <>
            {page === 'home' && <TabletDashboard onEdit={openEdit} />}
            {page === 'stats' && (
              <div className="mx-auto max-w-xl px-6">
                <Statistics />
              </div>
            )}
            {page === 'accounts' && (
              <div className="mx-auto max-w-xl px-6">
                <Accounts />
              </div>
            )}
            {page === 'settings' && (
              <div className="mx-auto max-w-xl px-6">
                <Settings theme={theme} onThemeChange={onThemeChange} mode={mode} onModeChange={onModeChange} />
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav active={page} onChange={setPage} onAdd={openAdd} />

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
