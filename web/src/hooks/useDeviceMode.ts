import { useEffect, useState } from 'react';

export type ViewMode = 'auto' | 'mobile' | 'desktop';
export type ResolvedMode = 'mobile' | 'desktop';

const QUERY = '(min-width: 1024px)';

function detect(): ResolvedMode {
  if (typeof window === 'undefined') return 'mobile';
  return window.matchMedia(QUERY).matches ? 'desktop' : 'mobile';
}

export function useDeviceMode(mode: ViewMode): ResolvedMode {
  const [resolved, setResolved] = useState<ResolvedMode>(() => (mode === 'auto' ? detect() : mode));

  useEffect(() => {
    if (mode !== 'auto') {
      setResolved(mode);
      return;
    }
    const mq = window.matchMedia(QUERY);
    const handler = () => setResolved(mq.matches ? 'desktop' : 'mobile');
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return resolved;
}
