import { Home, PieChart, Plus, Wallet, Settings } from 'lucide-react';

export type Page = 'home' | 'stats' | 'accounts' | 'settings';

export function BottomNav({
  active,
  onChange,
  onAdd,
}: {
  active: Page;
  onChange: (p: Page) => void;
  onAdd: () => void;
}) {
  const items: { key: Page; icon: typeof Home; label: string }[] = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'stats', icon: PieChart, label: 'Stats' },
  ];
  const items2: { key: Page; icon: typeof Home; label: string }[] = [
    { key: 'accounts', icon: Wallet, label: 'Accounts' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  const Item = ({ item }: { item: (typeof items)[number] }) => {
    const Icon = item.icon;
    const isActive = active === item.key;
    return (
      <button
        type="button"
        onClick={() => onChange(item.key)}
        className="flex flex-1 flex-col items-center gap-1 py-2"
        aria-label={item.label}
      >
        <Icon
          size={22}
          strokeWidth={2.2}
          color={isActive ? 'var(--text)' : 'var(--muted)'}
        />
      </button>
    );
  };

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] px-3 pt-1 pb-[calc(env(safe-area-inset-bottom)+6px)]">
      <div className="mx-auto flex max-w-[460px] items-center">
        {items.map((item) => (
          <Item key={item.key} item={item} />
        ))}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add transaction"
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--hero)] text-white shadow-lg shadow-black/20 active:scale-95 transition-transform"
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </div>
        {items2.map((item) => (
          <Item key={item.key} item={item} />
        ))}
      </div>
    </nav>
  );
}
