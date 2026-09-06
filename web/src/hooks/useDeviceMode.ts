import { useEffect, useState } from 'react';

export type ViewMode = 'auto' | 'mobile' | 'tablet' | 'desktop';
export type ResolvedMode = 'mobile' | 'tablet' | 'desktop';

const DESKTOP_QUERY = '(min-width: 1024px)';
const TABLET_QUERY = '(min-width: 768px)';

function detect(): ResolvedMode {
  if (typeof window === 'undefined') return 'mobile';
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop';
  if (window.matchMedia(TABLET_QUERY).matches) return 'tablet';
  return 'mobile';
}

export function useDeviceMode(mode: ViewMode): ResolvedMode {
  const [resolved, setResolved] = useState<ResolvedMode>(() => (mode === 'auto' ? detect() : mode));

  useEffect(() => {
    if (mode !== 'auto') {
      setResolved(mode);
      return;
    }
    const desktopMq = window.matchMedia(DESKTOP_QUERY);
    const tabletMq = window.matchMedia(TABLET_QUERY);
    const handler = () => setResolved(detect());
    handler();
    desktopMq.addEventListener('change', handler);
    tabletMq.addEventListener('change', handler);
    return () => {
      desktopMq.removeEventListener('change', handler);
      tabletMq.removeEventListener('change', handler);
    };
  }, [mode]);

  return resolved;
}
