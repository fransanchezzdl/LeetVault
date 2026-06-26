import { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Database,
  ExternalLink,
  Folder,
  HelpCircle,
  List,
  Lock,
  Map as MapIcon,
  PieChart,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';

type Extra = 'extension' | 'groq' | undefined;
interface Item {
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
    id: 'intro',
    icon: Sparkles,
    items: [{ id: 'what' }, { id: 'manual' }, { id: 'fromLeetcode' }],
  },
  {
    id: 'problems',
    icon: List,
    items: [{ id: 'filter' }, { id: 'statuses' }, { id: 'editDelete' }],
  },
  {
    id: 'review',
    icon: RefreshCw,
    items: [{ id: 'what' }, { id: 'howSession' }, { id: 'whenAdded' }],
  },
  {
    id: 'stats',
    icon: PieChart,
    items: [{ id: 'what' }],
  },
  {
    id: 'roadmap',
    icon: MapIcon,
    items: [{ id: 'what' }, { id: 'filter' }],
  },
  {
    id: 'extension',
    icon: Folder,
    items: [
      { id: 'install', extra: 'extension' },
      { id: 'requires' },
      { id: 'data' },
    ],
  },
  {
    id: 'ai',
    icon: Sparkles,
    items: [
      { id: 'what' },
      { id: 'setup', extra: 'groq' },
      { id: 'cost' },
      { id: 'error401' },
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    items: [{ id: 'location' }, { id: 'network' }, { id: 'backup' }],
  },
];

export function HelpView() {
  const { t } = useTranslation('help');
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalized) {
      return SECTIONS.map((sec) => ({
        ...sec,
        title: t(`sections.${sec.id}.title`),
        items: sec.items.map((item) => ({
          ...item,
          q: t(`sections.${sec.id}.${item.id}.q`),
          a: t(`sections.${sec.id}.${item.id}.a`),
        })),
      }));
    }
    return SECTIONS.map((sec) => {
      const items = sec.items
        .map((item) => ({
          ...item,
          q: t(`sections.${sec.id}.${item.id}.q`),
          a: t(`sections.${sec.id}.${item.id}.a`),
        }))
        .filter(
          (it) =>
            it.q.toLowerCase().includes(normalized) ||
            it.a.toLowerCase().includes(normalized)
        );
      return { ...sec, title: t(`sections.${sec.id}.title`), items };
    }).filter((sec) => sec.items.length > 0);
  }, [normalized, t]);

  const totalHits = filteredSections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="h-full overflow-auto scroll-thin">
      <div className="px-8 py-7">
      <header className="mb-6 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-brand-400" />
        <h1 className="text-2xl font-bold text-fg">{t('title')}</h1>
      </header>

      <div className="mb-7 max-w-5xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fgMuted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-11 w-full rounded-xl border border-glass-stroke bg-bg-200/60 pl-10 pr-10 text-sm text-fg placeholder:text-fgMuted outline-none backdrop-blur-sm focus:border-brand-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-fgMuted hover:bg-white/10 hover:text-fg"
              aria-label={t('search.clear')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {normalized ? (
          <p className="mt-2 px-1 text-xs text-fgMuted">
            {totalHits === 0
              ? t('search.empty')
              : t('search.results', {
                  count: totalHits,
                  sections: filteredSections.length,
                })}
          </p>
        ) : null}
      </div>

      <div className="max-w-5xl space-y-7">
        {!normalized ? <DataSection /> : null}
        {filteredSections.map((sec) => (
          <section key={sec.id}>
            <div className="mb-2 flex items-center gap-2">
              <sec.icon className="h-4 w-4 text-brand-400" />
              <h2 className="text-base font-bold text-brand-200">{sec.title}</h2>
            </div>
            <div className="mb-3 border-b border-glass-stroke" />
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {sec.items.map((it) => (
                <FaqItem
                  key={it.id}
                  question={it.q}
                  answer={it.a}
                  extra={it.extra}
                  defaultOpen={!!normalized}
                  highlight={normalized}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      </div>
    </div>
  );
}

function DataSection() {
  const { t } = useTranslation('help');
  const qc = useQueryClient();
  const [dbPath, setDbPath] = useState<string>('');
  const [status, setStatus] = useState<{
    kind: 'idle' | 'ok' | 'err';
    msg?: string;
  }>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.lv.app.dbPath().then(setDbPath).catch(() => setDbPath(''));
  }, []);

  const onImport = async () => {
    setBusy(true);
    setStatus({ kind: 'idle' });
    try {
      const res = await window.lv.app.importDb();
      if (res.ok) {
        await qc.invalidateQueries();
        setStatus({
          kind: 'ok',
          msg: t('data.importedSuccess', {
            count: res.imported,
            backup: res.backupPath || t('data.noPreviousBackup'),
          }),
        });
      } else if (res.reason === 'cancelled') {
        setStatus({ kind: 'idle' });
      } else {
        setStatus({ kind: 'err', msg: res.message || t('data.importErrorFallback') });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Database className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">{t('data.title')}</h2>
      </div>
      <div className="mb-3 border-b border-glass-stroke" />

      <div className="rounded-2xl border border-glass-stroke bg-white/[0.04] p-4">
        <p className="text-sm text-fg">{t('data.importTitle')}</p>
        <p className="mt-1 text-xs text-fgMuted">{t('data.importDescription')}</p>
        {dbPath ? (
          <p className="mt-2 text-[11px] text-fgMuted/80">
            {t('data.currentPath')} <code className="text-fgSoft">{dbPath}</code>
          </p>
        ) : null}

        <div className="mt-3">
          <Button variant="outline" className="gap-2" onClick={onImport} disabled={busy}>
            <Upload className="h-4 w-4" />
            {busy ? t('data.importing') : t('data.importButton')}
          </Button>
        </div>

        {status.kind === 'ok' ? (
          <p className="mt-3 rounded-md border border-status-solved/40 bg-status-solved/10 px-3 py-2 text-xs text-fgSoft">
            {status.msg}
          </p>
        ) : null}
        {status.kind === 'err' ? (
          <p className="mt-3 rounded-md border border-diff-hard/40 bg-diff-hard/10 px-3 py-2 text-xs text-fgSoft">
            {status.msg}
          </p>
        ) : null}
      </div>
    </section>
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
        'rounded-2xl border border-glass-stroke bg-white/[0.04] transition',
        open
          ? 'border-brand-400/40 bg-white/[0.07]'
          : 'hover:border-brand-400/30 hover:bg-white/[0.06]'
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
          <p className="whitespace-pre-line text-sm leading-relaxed text-fgMuted">
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

function ExtensionPathBlock() {
  const { t } = useTranslation('help');
  const [path, setPath] = useState<string>('');

  useEffect(() => {
    window.lv.app.extensionPath().then(setPath).catch(() => setPath(''));
  }, []);

  return (
    <div className="mt-3 space-y-2">
      {path ? (
        <p className="text-[11px] text-fgMuted/80">
          {t('faq.extension.path')} <code className="text-fgSoft">{path}</code>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.lv.app.openExtensionFolder()}
          disabled={!path}
        >
          <Folder className="h-4 w-4" /> {t('faq.extension.openFolder')}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            window.lv.app.openExternal(
              'https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world'
            )
          }
        >
          <ExternalLink className="h-4 w-4" /> {t('faq.extension.installGuide')}
        </Button>
      </div>
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
