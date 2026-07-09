import { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  ExternalLink,
  Folder,
  HelpCircle,
  List,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { ExtensionPathBlock } from './ExtensionPathBlock';

type Extra = 'extension' | 'groq' | undefined;
interface Item {
  src: string;
  id: string;
  extra?: Extra;
}

interface Section {
  id: string;
  icon: LucideIcon;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    id: 'gettingStarted',
    icon: Sparkles,
    items: [
      { src: 'intro', id: 'what' },
      { src: 'intro', id: 'manual' },
      { src: 'intro', id: 'fromLeetcode' },
      { src: 'stats', id: 'what' },
      { src: 'roadmap', id: 'what' },
      { src: 'roadmap', id: 'filter' },
    ],
  },
  {
    id: 'problems',
    icon: List,
    items: [
      { src: 'problems', id: 'filter' },
      { src: 'problems', id: 'statuses' },
      { src: 'problems', id: 'editDelete' },
    ],
  },
  {
    id: 'review',
    icon: RefreshCw,
    items: [
      { src: 'review', id: 'what' },
      { src: 'review', id: 'howSession' },
      { src: 'review', id: 'whenAdded' },
    ],
  },
  {
    id: 'extension',
    icon: Folder,
    items: [
      { src: 'extension', id: 'install', extra: 'extension' },
      { src: 'extension', id: 'requires' },
      { src: 'extension', id: 'data' },
      { src: 'ai', id: 'what' },
      { src: 'ai', id: 'setup', extra: 'groq' },
      { src: 'ai', id: 'cost' },
      { src: 'ai', id: 'error401' },
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    items: [
      { src: 'privacy', id: 'location' },
      { src: 'privacy', id: 'network' },
      { src: 'privacy', id: 'backup' },
    ],
  },
];

export function HelpView() {
  const { t } = useTranslation('help');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const normalized = query.trim().toLowerCase();
  const searching = normalized.length > 0;

  const resolvedSections = useMemo(
    () =>
      SECTIONS.map((sec) => ({
        ...sec,
        title: t(`nav.${sec.id}`),
        navLabel: t(`nav.${sec.id}`),
        items: sec.items.map((item) => ({
          ...item,
          q: t(`sections.${item.src}.${item.id}.q`),
          a: t(`sections.${item.src}.${item.id}.a`),
        })),
      })),
    [t]
  );

  const matchesById = useMemo(() => {
    if (!searching) return null;
    const map = new Map<string, number>();
    for (const sec of resolvedSections) {
      const hits = sec.items.filter(
        (it) =>
          it.q.toLowerCase().includes(normalized) ||
          it.a.toLowerCase().includes(normalized)
      ).length;
      if (hits > 0) map.set(sec.id, hits);
    }
    return map;
  }, [normalized, resolvedSections, searching]);

  const visibleSections = useMemo(() => {
    if (!searching) {
      const active = resolvedSections.find((s) => s.id === activeId);
      return active ? [active] : [];
    }
    return resolvedSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter(
          (it) =>
            it.q.toLowerCase().includes(normalized) ||
            it.a.toLowerCase().includes(normalized)
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [activeId, normalized, resolvedSections, searching]);

  const totalHits = matchesById
    ? Array.from(matchesById.values()).reduce((n, v) => n + v, 0)
    : 0;

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-glass-stroke/10 bg-bg-200/40 px-3 py-5 backdrop-blur-sm">
        <header className="mb-3 flex items-center gap-2 px-2">
          <HelpCircle className="h-4 w-4 text-brand-400" />
          <h1 className="text-sm font-semibold tracking-tight text-fg">{t('title')}</h1>
        </header>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg/[0.68]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-9 w-full rounded-md border border-glass-stroke/10 bg-bg-200/60 pl-8 pr-8 text-xs text-fg placeholder:text-fg/[0.68] outline-none focus:border-brand-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-fg/[0.68] hover:bg-fg/10 hover:text-fg"
              aria-label={t('search.clear')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <nav className="flex flex-col gap-1 overflow-auto scroll-thin">
          {resolvedSections.map((sec) => {
            const active = !searching && sec.id === activeId;
            const hits = matchesById?.get(sec.id) ?? 0;
            const dim = searching && hits === 0;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveId(sec.id);
                  if (searching) setQuery('');
                }}
                className={cn(
                  active ? 'nav-btn-active' : 'nav-btn',
                  'w-full text-left',
                  dim && 'opacity-50'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <sec.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{sec.navLabel}</span>
                {searching && hits > 0 ? (
                  <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-200">
                    {hits}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-auto scroll-thin">
        <div className="max-w-5xl px-8 py-7">
          {searching ? (
            <p className="mb-5 text-xs text-fg/[0.68]">
              {totalHits === 0
                ? t('search.empty')
                : t('search.results', {
                    count: totalHits,
                    sections: visibleSections.length,
                  })}
            </p>
          ) : null}

          <div className="space-y-7">
            {visibleSections.map((sec) => (
              <section key={sec.id}>
                <div className="mb-2 flex items-center gap-2">
                  <sec.icon className="h-4 w-4 text-brand-400" />
                  <h2 className="text-base font-bold text-brand-200">{sec.title}</h2>
                </div>
                <div className="mb-3 border-b border-glass-stroke/10" />
                <div className="space-y-2">
                  {sec.items.map((it) => (
                    <FaqItem
                      key={`${it.src}.${it.id}`}
                      question={it.q}
                      answer={it.a}
                      extra={it.extra}
                      defaultOpen={searching}
                      highlight={normalized}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  extra,
  defaultOpen = false,
  highlight = '',
}: {
  question: string;
  answer: string;
  extra?: Extra;
  defaultOpen?: boolean;
  highlight?: string;
}) {
  const { t } = useTranslation('help');
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div
      className={cn(
        'rounded-2xl border border-glass-stroke/10 bg-fg/[0.04] transition',
        open
          ? 'border-brand-400/40 bg-fg/[0.07]'
          : 'hover:border-brand-400/30 hover:bg-fg/[0.06]'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" />
        <span className="flex-1 text-sm font-medium text-fg">
          {renderHighlighted(question, highlight)}
        </span>
        <ChevronRight
          className={cn(
            'mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400 transition-transform',
            open && 'rotate-90'
          )}
        />
      </button>
      {open ? (
        <div className="px-4 pb-4 pl-11">
          <p className="whitespace-pre-line text-sm leading-relaxed text-fg/[0.68]">
            {renderHighlighted(answer, highlight)}
          </p>
          {extra === 'extension' ? <ExtensionPathBlock /> : null}
          {extra === 'groq' ? (
            <Button
              variant="outline"
              className="mt-3 gap-2"
              onClick={() => window.lv.app.openExternal('https://console.groq.com')}
            >
              <ExternalLink className="h-4 w-4" /> {t('faq.groq.openConsole')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function renderHighlighted(text: string, needle: string): React.ReactNode {
  if (!needle) return text;
  const lower = text.toLowerCase();
  const q = needle.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={key++}
        className="rounded bg-brand-500/40 px-0.5 text-fg"
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return parts;
}
