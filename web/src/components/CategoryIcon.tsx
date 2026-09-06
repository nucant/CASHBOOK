import {
  Utensils, Car, Receipt, ShoppingBag, HeartPulse, BookOpen,
  Clapperboard, Home, MoreHorizontal, Wallet, TrendingUp, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  clapperboard: Clapperboard,
  home: Home,
  'more-horizontal': MoreHorizontal,
  wallet: Wallet,
  'trending-up': TrendingUp,
};

export function CategoryIcon({ icon, color, size = 20 }: { icon: string; color: string; size?: number }) {
  const Icon = ICONS[icon] ?? MoreHorizontal;
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{ width: size * 2, height: size * 2, background: `${color}22`, color }}
    >
      <Icon size={size} strokeWidth={2.2} />
    </div>
  );
}
