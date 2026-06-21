import { 
  useCallback, 
  useEffect, 
  useRef, 
  useState, 
  type CSSProperties, 
  type WheelEvent 
} from 'react';

// CURRENTLY NOT BEING USED, it provoked lag and was ugly
// Redo in future TODOs

const BOUNCE_MAX = 96; 
const SETTLE_MS = 80; 
// 1. Cut the duration in half. 150ms feels instantaneous but retains smoothness.
const SPRING_MS = 150; 
// 2. Swapped to an "Out Expo" curve. It travels 80% of the distance almost instantly, then sharply stops.
const EASE_OUT = 'cubic-bezier(0.1, 1, 0.2, 1)'; 

const MOMENTUM_THRESHOLD = 20; 

export function useElasticScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [bounce, setBounce] = useState(0);
  const settleTimer = useRef<number | null>(null);

  const snapBack = useCallback(() => {
    setBounce(0);
  }, []);

  const onWheel = useCallback(
    (e: WheelEvent<T>) => {
      const el = ref.current;
      if (!el) return;

      const scrollable = el.scrollHeight > el.clientHeight;
      const atTop = el.scrollTop <= 0;
      const atBottom = !scrollable || el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      const overTop = atTop && e.deltaY < 0;
      const overBottom = atBottom && e.deltaY > 0;

      if (!overTop && !overBottom) return;

      e.preventDefault();

      if (Math.abs(e.deltaY) < MOMENTUM_THRESHOLD) {
        return;
      }

      setBounce((prev) => {
        const resistance = 1 - Math.abs(prev) / BOUNCE_MAX;
        const delta = -e.deltaY * 0.45 * Math.max(0.1, resistance);
        const next = prev + delta;
        
        return Math.max(-BOUNCE_MAX, Math.min(BOUNCE_MAX, next));
      });

      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(snapBack, SETTLE_MS);
    },
    [snapBack]
  );

  useEffect(() => {
    return () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    };
  }, []);

  const style: CSSProperties = {
    transform: `translate3d(0, ${bounce}px, 0)`,
    transition: bounce === 0 ? `transform ${SPRING_MS}ms ${EASE_OUT}` : 'none',
    willChange: 'transform',
  };

  return { ref, onWheel, style };
}