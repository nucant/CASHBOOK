import { formatMoney } from '../lib/format';

export function BalanceCard({ balance }: { balance: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 text-white"
      style={{ background: `linear-gradient(155deg, var(--hero-2), var(--hero))` }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />
      <p className="text-sm text-white/60">Total Balance</p>
      <p className="font-display mt-2 text-4xl tracking-tight">{formatMoney(balance)}</p>
    </div>
  );
}
