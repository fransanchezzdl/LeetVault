import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RoadmapCategory, RoadmapList } from './data/types';

interface Props {
  list: RoadmapList;
  solved: Set<number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const COL_W = 260;
const ROW_H = 150;
const NODE_W = 210;
const NODE_H = 72;
const PAD = 40;

interface Layout {
  width: number;
  height: number;
  centers: Map<string, { cx: number; cy: number }>;
}

function layoutTree(list: RoadmapList): Layout {
  const maxX = Math.max(...list.categories.map((c) => c.x));
  const maxY = Math.max(...list.categories.map((c) => c.y));
  const width = (maxX + 1) * COL_W + PAD * 2;
  const height = (maxY + 1) * ROW_H + PAD * 2;
  const centers = new Map<string, { cx: number; cy: number }>();
  for (const c of list.categories) {
    centers.set(c.id, {
      cx: c.x * COL_W + NODE_W / 2 + PAD,
      cy: c.y * ROW_H + NODE_H / 2 + PAD,
    });
  }
  return { width, height, centers };
}

function categoryProgress(cat: RoadmapCategory, solved: Set<number>) {
  const total = cat.problems.length;
  const done = cat.problems.reduce((acc, p) => acc + (solved.has(p.n) ? 1 : 0), 0);
  return { done, total, pct: total === 0 ? 0 : done / total };
}

function nodeColor(pct: number): { fill: string; stroke: string; text: string } {
  if (pct === 0) return { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,232,194,0.18)', text: '#F7EEE4' };
  if (pct === 1) return { fill: 'rgba(46,139,106,0.22)', stroke: '#2E8B6A', text: '#F7EEE4' };
  return { fill: 'rgba(255,177,51,0.16)', stroke: '#FFB133', text: '#F7EEE4' };
}

export function RoadmapTree({ list, solved, selectedId, onSelect }: Props) {
  const { t } = useTranslation('roadmap');
  const layout = useMemo(() => layoutTree(list), [list]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const nextScale = Math.min(2.4, Math.max(0.35, scale * delta));
    // Zoom around mouse position
    const ratio = nextScale / scale;
    setTx(mx - (mx - tx) * ratio);
    setTy(my - (my - ty) * ratio);
    setScale(nextScale);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    drag.current = { x: e.clientX, y: e.clientY, tx, ty };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setTx(drag.current.tx + (e.clientX - drag.current.x));
    setTy(drag.current.ty + (e.clientY - drag.current.y));
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const resetView = () => {
    const el = wrapRef.current;
    if (!el) {
      setScale(1);
      setTx(0);
      setTy(0);
      return;
    }
    const rect = el.getBoundingClientRect();
    const margin = 24;
    const fitScale = Math.min(
      (rect.width - margin * 2) / layout.width,
      (rect.height - margin * 2) / layout.height
    );
    const next = Math.min(2.4, Math.max(0.35, fitScale));
    setScale(next);
    setTx((rect.width - layout.width * next) / 2);
    setTy((rect.height - layout.height * next) / 2);
  };

  // Initial fit-to-screen once the container has measurable size.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (el.clientWidth === 0 || el.clientHeight === 0) return;
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.width, layout.height]);

  const zoom = (factor: number) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const nextScale = Math.min(2.4, Math.max(0.35, scale * factor));
    const ratio = nextScale / scale;
    setTx(cx - (cx - tx) * ratio);
    setTy(cy - (cy - ty) * ratio);
    setScale(nextScale);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-glass-stroke bg-bg-300/50">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoom(1.2)}
          className="rounded-lg border border-glass-stroke bg-bg-200/80 p-1.5 text-fgSoft hover:bg-white/10"
          title={t('tree.zoomIn')}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoom(0.85)}
          className="rounded-lg border border-glass-stroke bg-bg-200/80 p-1.5 text-fgSoft hover:bg-white/10"
          title={t('tree.zoomOut')}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg border border-glass-stroke bg-bg-200/80 p-1.5 text-fgSoft hover:bg-white/10"
          title={t('tree.reset')}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={wrapRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <svg
          width={layout.width}
          height={layout.height}
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: '0 0',
            display: 'block',
          }}
        >
          <defs>
            <marker
              id="rm-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,232,194,0.35)" />
            </marker>
          </defs>

          {/* Edges */}
          {list.categories.flatMap((c) =>
            c.prereqs.map((pid) => {
              const from = layout.centers.get(pid);
              const to = layout.centers.get(c.id);
              if (!from || !to) return null;
              const x1 = from.cx;
              const y1 = from.cy + NODE_H / 2;
              const x2 = to.cx;
              const y2 = to.cy - NODE_H / 2 - 4;
              const dy = Math.max(1, y2 - y1);
              // Keep control points close to source/target so long horizontal
              // diagonals don't swoop into other nodes.
              const ctrl = Math.min(dy * 0.55, ROW_H * 0.55);
              const d = `M ${x1} ${y1} C ${x1} ${y1 + ctrl}, ${x2} ${y2 - ctrl}, ${x2} ${y2}`;
              return (
                <path
                  key={`${pid}-${c.id}`}
                  d={d}
                  fill="none"
                  stroke="rgba(255,232,194,0.22)"
                  strokeWidth={1.5}
                  markerEnd="url(#rm-arrow)"
                />
              );
            })
          )}

          {/* Nodes */}
          {list.categories.map((c) => {
            const center = layout.centers.get(c.id)!;
            const { done, total, pct } = categoryProgress(c, solved);
            const colors = nodeColor(pct);
            const selected = selectedId === c.id;
            const x = center.cx - NODE_W / 2;
            const y = center.cy - NODE_H / 2;
            return (
              <g
                key={c.id}
                data-node
                onClick={() => onSelect(c.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={14}
                  ry={14}
                  fill={colors.fill}
                  stroke={selected ? '#FFB133' : colors.stroke}
                  strokeWidth={selected ? 2.5 : 1.5}
                />
                <text
                  x={center.cx}
                  y={center.cy - 6}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={14}
                  fontWeight={600}
                  fontFamily="Poppins, system-ui, sans-serif"
                >
                  {c.name}
                </text>
                <text
                  x={center.cx}
                  y={center.cy + 14}
                  textAnchor="middle"
                  fill="rgba(247,238,228,0.6)"
                  fontSize={11}
                  fontFamily="Poppins, system-ui, sans-serif"
                >
                  {done} / {total}
                </text>
                {/* Progress bar */}
                <rect
                  x={x + 14}
                  y={y + NODE_H - 12}
                  width={NODE_W - 28}
                  height={3}
                  rx={1.5}
                  fill="rgba(255,255,255,0.08)"
                />
                <rect
                  x={x + 14}
                  y={y + NODE_H - 12}
                  width={(NODE_W - 28) * pct}
                  height={3}
                  rx={1.5}
                  fill={pct === 1 ? '#2E8B6A' : '#FFB133'}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
