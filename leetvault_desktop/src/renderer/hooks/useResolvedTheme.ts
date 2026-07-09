import { useEffect, useState } from 'react';
import { useUi } from '../store/ui';

export type ResolvedTheme = 'dark' | 'light';

function readSystem(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useResolvedTheme(): ResolvedTheme {
  const theme = useUi((s) => s.theme);
  const [system, setSystem] = useState<ResolvedTheme>(readSystem);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => setSystem(mq.matches ? 'light' : 'dark');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [theme]);

  return theme === 'system' ? system : theme;
}
