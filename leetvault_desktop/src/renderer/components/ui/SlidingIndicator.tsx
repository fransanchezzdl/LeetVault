import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface IndicatorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useSlidingIndicator<K, C extends HTMLElement = HTMLElement>(
  activeKey: K | null
) {
  const containerRef = useRef<C | null>(null);
  const itemRefs = useRef(new Map<K, HTMLElement>());
  const [rect, setRect] = useState<IndicatorRect | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const item = activeKey != null ? itemRefs.current.get(activeKey) : undefined;
      if (!container || !item) {
        setRect(null);
        return;
      }
      const c = container.getBoundingClientRect();
      const b = item.getBoundingClientRect();
      setRect({
        top: b.top - c.top + container.scrollTop,
        left: b.left - c.left + container.scrollLeft,
        width: b.width,
        height: b.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeKey]);

  const setItemRef = (key: K) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(key, el);
    else itemRefs.current.delete(key);
  };

  return { containerRef, setItemRef, rect };
}

export function SlidingIndicator({
  rect,
  className,
}: {
  rect: IndicatorRect | null;
  className?: string;
}) {
  if (!rect) return null;
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-lg bg-nav-active-grad transition-all duration-300 ease-out',
        className
      )}
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    />
  );
}
