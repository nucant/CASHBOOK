import { LayoutDashboard, ArrowLeftRight, PieChart, Wallet, Target, Settings as SettingsIcon, Wallet2 } from 'lucide-react';

export type DesktopPage = 'overview' | 'transactions' | 'stats' | 'accounts' | 'budgets' | 'settings';

const NAV: { key: DesktopPage; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'stats', label: 'Statistics', icon: PieChart },
  { key: 'accounts', label: 'Accounts', icon: Wallet },
  { key: 'budgets', label: 'Budgets', icon: Target },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ active, onChange }: { active: DesktopPage; onChange: (p: DesktopPage) => void }) {
  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--hero)] text-white">
          <Wallet2 size={18} />
        </div>
        <span className="font-display text-lg">Cashbook</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <p className="px-2 text-[11px] text-[var(--muted)]">Stored locally on this device</p>
    </aside>
  );
}
