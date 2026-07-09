import { useEffect } from 'react';
import { useResolvedTheme } from './useResolvedTheme';

export function useApplyTheme() {
  const resolved = useResolvedTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, [resolved]);
}
