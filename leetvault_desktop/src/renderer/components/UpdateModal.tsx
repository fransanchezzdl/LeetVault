import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UpdateInfo } from '@shared/types/updater';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

export function UpdateModal() {
  const { t } = useTranslation('chrome');
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await window.lv.app.checkForUpdates();
        if (!cancelled && result) {
          setInfo(result);
          setOpen(true);
        }
      } catch {
        // bridge missing or main-process error — stay silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = async () => {
    if (!info) return;
    setOpen(false);
    try {
      await window.lv.app.dismissUpdate(info.latest, 'dismissed');
    } catch {
      // ignore
    }
  };

  const download = async () => {
    if (!info) return;
    setOpen(false);
    try {
      await window.lv.app.dismissUpdate(info.latest, 'opened', info.url);
    } catch {
      // ignore
    }
  };

  if (!info) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) void dismiss();
      }}
      title={t('update.title')}
      description={t('update.description', { current: info.current, latest: info.latest })}
      size="sm"
    >
      {info.notes ? (
        <details className="mb-4 rounded-md border border-glass-stroke bg-black/20 p-3 text-xs text-fgMuted">
          <summary className="cursor-pointer text-fgSoft">{t('update.notes')}</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed">
            {info.notes}
          </pre>
        </details>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => void dismiss()}>
          {t('update.later')}
        </Button>
        <Button variant="primary" onClick={() => void download()}>
          <Download className="mr-2 h-4 w-4" />
          {t('update.download')}
        </Button>
      </div>
    </Dialog>
  );
}
