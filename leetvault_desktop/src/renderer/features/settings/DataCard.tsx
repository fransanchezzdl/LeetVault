import { useEffect, useState } from 'react';
import { Database, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

export function DataCard() {
  const { t } = useTranslation('settings');
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
    <section className="rounded-2xl border border-glass-stroke/10 bg-fg/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">{t('data.title')}</h2>
      </div>

      <p className="text-sm text-fg">{t('data.importTitle')}</p>
      <p className="mt-1 text-xs text-fg/[0.68]">{t('data.importDescription')}</p>
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
    </section>
  );
}
