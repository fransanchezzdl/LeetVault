import { useEffect, useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUi } from '../store/ui';

export function AnalyticsNotice() {
  const { t } = useTranslation(['chrome', 'common']);
  const [show, setShow] = useState(false);
  const setView = useUi((s) => s.setView);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [should, configured] = await Promise.all([
          window.lv.analytics.shouldShowNotice(),
          window.lv.analytics.isConfigured(),
        ]);
        if (!cancelled && should && configured) setShow(true);
      } catch {
        // bridge missing in old preload; ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => dismiss(), 10_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const dismiss = async () => {
    setShow(false);
    try {
      await window.lv.analytics.dismissNotice();
    } catch {
      // ignore
    }
  };

  const openSettings = async () => {
    await dismiss();
    setView('settings');
  };

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="pointer-events-auto rounded-xl border border-glass-stroke/10 bg-bg-200/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <BarChart3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-fg">{t('chrome:analyticsNotice.title')}</p>
            <p className="mt-1 text-xs text-fg/[0.68]">
              {t('chrome:analyticsNotice.body')}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={openSettings}
                className="text-xs font-medium text-brand-300 hover:text-brand-200"
              >
                {t('chrome:analyticsNotice.openSettings')}
              </button>
              <span className="text-xs text-fg/[0.68]">·</span>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-fg/[0.68] hover:text-fg"
              >
                {t('chrome:analyticsNotice.acknowledge')}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 text-fg/[0.68] hover:bg-fg/10 hover:text-fg"
            aria-label={t('common:actions.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
