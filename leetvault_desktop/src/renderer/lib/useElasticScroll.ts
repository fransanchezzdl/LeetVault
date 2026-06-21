import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type WheelEvent,
} from 'react';

const BOUNCE_MAX = 96;
const BOUNCE_GAIN = 0.45;
const SETTLE_MS = 90;
const SPRING_MS = 520;
const SPRING_EASING = 'cubic-bezier(.2,.9,.25,1.15)';

/**
 * iOS-style elastic over-scroll bounce.
 *
 * - Returns a ref for the scroll container and a wheel handler.
 * - When the user scrolls past either edge, an asymptotic damping curve
 *   translates the inner content. The further you push, the more resistance
 *   you feel, capped at BOUNCE_MAX.
 * - After a short idle window, the content springs back to 0 with a soft
 *   overshoot easing.
 *
 * Apply `style` to the element you want to bounce (typically a single inner
 * wrapper). Anything you want to stay still during the bounce (e.g. a sticky
 * table header) should live in the scroll container OUTSIDE that wrapper.
 */
export function useElasticScroll<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  onWheel: (e: WheelEvent<T>) => void;
  style: CSSProperties;
} {
  const ref = useRef<T>(null);
  const [bounce, setBounce] = useState(0);
  const [springing, setSpringing] = useState(false);
  const settleTimer = useRef<number | null>(null);

  const onWheel = useCallback((e: WheelEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 1;
    const atTop = el.scrollTop <= 0;
    const atBottom = !scrollable || el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    const overTop = atTop && e.deltaY < 0;
    const overBottom = atBottom && e.deltaY > 0;
    if (!overTop && !overBottom) return;

    e.preventDefault();
    setSpringing(false);
    setBounce((prev) => {
      // Asymptotic resistance: the closer to BOUNCE_MAX, the smaller the step.
      const resistance = Math.max(0, 1 - Math.abs(prev) / BOUNCE_MAX);
      const step = -e.deltaY * BOUNCE_GAIN * resistance;
      const next = prev + step;
      return Math.max(-BOUNCE_MAX, Math.min(BOUNCE_MAX, next));
    });

    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      setSpringing(true);
      setBounce(0);
    }, SETTLE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    };
  }, []);

  const style: CSSProperties = {
    transform: `translate3d(0, ${bounce}px, 0)`,
    transition: springing ? `transform ${SPRING_MS}ms ${SPRING_EASING}` : 'none',
    willChange: 'transform',
  };

  return { ref, onWheel, style };
}
