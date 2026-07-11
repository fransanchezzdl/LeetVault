import { useEffect, useState } from 'react';
import { BarChart3, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

type AnalyticsChoice = 'on' | 'off';

export function AnalyticsCard() {
  const { t } = useTranslation(['settings', 'common']);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [distinctId, setDistinctId] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void (async () => {
      const [e, id, conf] = await Promise.all([
        window.lv.analytics.getEnabled(),
        window.lv.analytics.getDistinctId(),
        window.lv.analytics.isConfigured(),
      ]);
      setEnabled(e);
      setDistinctId(id);
      setConfigured(conf);
    })();
  }, []);

  const onChange = async (choice: AnalyticsChoice) => {
    const next = choice === 'on';
    if (enabled === next) return;
    setEnabled(next);
    await window.lv.analytics.setEnabled(next);
    if (next && !distinctId) {
      const id = await window.lv.analytics.getDistinctId();
      setDistinctId(id);
    }
  };

  const onCopy = async () => {
    if (!distinctId) return;
    await navigator.clipboard.writeText(distinctId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const options: { value: AnalyticsChoice; label: string }[] = [
    { value: 'off', label: t('analytics.off') },
    { value: 'on', label: t('analytics.on') },
  ];

  return (
    <section className="rounded-2xl border border-glass-stroke/10 bg-fg/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">{t('analytics.title')}</h2>
      </div>

      <p className="mb-4 text-sm text-fg/[0.68]">
        {t('analytics.description')}
      </p>

      <div className="flex items-center justify-between gap-6 rounded-xl border border-glass-stroke/10 bg-black/20 p-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-fg">{t('analytics.toggleLabel')}</p>
          <p className="text-xs text-fg/[0.68]">{t('analytics.toggleHint')}</p>
        </div>
        <SegmentedControl<AnalyticsChoice>
          value={enabled ? 'on' : 'off'}
          onChange={(v) => void onChange(v)}
          options={options}
          ariaLabel={t('analytics.toggleLabel')}
        />
      </div>

      {!configured ? (
        <p className="mt-3 rounded-md border border-diff-medium/40 bg-diff-medium/10 px-3 py-2 text-xs text-fgSoft">
          {t('analytics.notConfigured')}
        </p>
      ) : null}

      {distinctId ? (
        <div className="mt-4">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-fg/[0.68]">{t('analytics.anonymousId')}</p>
          <div className="flex items-center gap-2 rounded-md border border-glass-stroke/10 bg-black/20 px-3 py-2">
            <code className="flex-1 break-all text-xs text-fgSoft">{distinctId}</code>
            <Button variant="ghost" className="gap-1 px-2 py-1 text-xs" onClick={onCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t('common:actions.copied') : t('common:actions.copy')}
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-fgMuted/80">
            {t('analytics.anonymousIdHint')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
