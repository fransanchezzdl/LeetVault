import { useMemo, useState, useRef, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Problem } from '@shared/types/problem';
import { DifficultyBadge, StatusBadge } from '../../components/badges/Badges';
import { cn } from '../../lib/cn';
// import { useElasticScroll } from '../../lib/useElasticScroll'; // Unused for now
import { useUi } from '../../store/ui';

const col = createColumnHelper<Problem>();

interface Props {
  problems: Problem[];
}

const COL_WIDTHS = {
  number: '70px',
  title: 'minmax(0,1fr)',
  difficulty: '110px',
  pattern: '160px',
  status: '130px',
  date_solved: '110px',
  actions: '80px',
} as const;

function getVisibility(width: number): VisibilityState {
  return {
    number: width >= 560,
    title: true,
    difficulty: true,
    pattern: width >= 720,
    status: true,
    date_solved: width >= 900,
    actions: true,
  };
}

function buildGridTemplate(visibility: VisibilityState): string {
  return (Object.keys(COL_WIDTHS) as (keyof typeof COL_WIDTHS)[])
    .filter((key) => visibility[key] !== false)
    .map((key) => COL_WIDTHS[key])
    .join(' ');
}

export function ProblemsTable({ problems }: Props) {
  const { t } = useTranslation('problems');
  const openEdit = useUi((s) => s.openEdit);
  const openDelete = useUi((s) => s.openDelete);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo(
    () => [
      col.accessor('number', {
        header: '#',
        cell: (c) => <span className="text-fgMuted">{c.getValue() ?? '—'}</span>,
      }),
      col.accessor('title', {
        header: t('table.title'),
        cell: (c) => <span className="text-fg truncate">{c.getValue()}</span>,
      }),
      col.accessor('difficulty', {
        header: t('table.difficulty'),
        cell: (c) => <DifficultyBadge value={c.getValue()} />,
      }),
      col.accessor('pattern', {
        header: t('table.pattern'),
        cell: (c) => (
          <span className="text-fgMuted truncate">{c.getValue() || '—'}</span>
        ),
      }),
      col.accessor('status', {
        header: t('table.status'),
        cell: (c) => <StatusBadge value={c.getValue()} />,
      }),
      col.accessor('date_solved', {
        header: t('table.solved'),
        cell: (c) => (
          <span className="text-fgMuted">{c.getValue() || '—'}</span>
        ),
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: (c) => {
          const id = c.row.original.id;
          return (
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => openEdit(id)}
                title={t('table.actions.edit')}
                className="rounded p-1 text-fgSoft/70 hover:bg-white/10 hover:text-fg"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => openDelete(id)}
                title={t('table.actions.delete')}
                className="rounded p-1 text-fgSoft/70 hover:bg-diff-hard/30 hover:text-fg"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [openEdit, openDelete, t]
  );

  const table = useReactTable({
    data: problems,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
 const rows = table.getRowModel().rows;
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const apply = (width: number) => setColumnVisibility(getVisibility(width));
    apply(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) apply(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gridTemplate = useMemo(() => buildGridTemplate(columnVisibility), [columnVisibility]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  return (
    <div
      ref={parentRef}
      className="relative h-full overflow-auto scroll-thin rounded-2xl border border-glass-stroke bg-glass-fill"
    >
      <div
        className="sticky top-0 z-20 grid items-center rounded-t-2xl bg-bg-200/95 backdrop-blur border-b border-glass-stroke/30"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((h) => (
            <div
              key={h.id}
              onClick={h.column.getToggleSortingHandler()}
              className="select-none px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-fgMuted cursor-pointer hover:text-fg"
            >
              {flexRender(h.column.columnDef.header, h.getContext())}
              {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? null}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((vRow) => {
          const row = rows[vRow.index];
          const isLast = vRow.index === rows.length - 1;
          return (
            <div
              key={row.id}
              className={cn(
                'absolute inset-x-0 grid items-center hover:bg-white/5',
                isLast ? 'rounded-b-2xl' : 'border-b border-glass-stroke/20'
              )}
              style={{
                top: 0,
                transform: `translateY(${vRow.start}px)`,
                height: `${vRow.size}px`,
                gridTemplateColumns: gridTemplate,
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="px-3 py-2.5 text-sm min-w-0 truncate"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="absolute inset-x-0 top-12 flex justify-center text-sm text-fgMuted">
          {t('table.empty')}
        </div>
      ) : null}
    </div>
  );
}