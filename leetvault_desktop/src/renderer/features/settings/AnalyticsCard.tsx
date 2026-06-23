import { useEffect, useState } from 'react';
import { BarChart3, Check, Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function AnalyticsCard() {
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

  const onToggle = async () => {
    if (enabled === null) return;
    const next = !enabled;
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

  return (
    <section className="rounded-2xl border border-glass-stroke bg-white/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">Analítica anónima</h2>
      </div>

      <p className="mb-4 text-sm text-fgMuted">
        Para entender qué funciones se usan y priorizar mejoras, LeetVault envía métricas anónimas
        (eventos como abrir la app, crear un problema, completar una sesión de repaso). Nunca se
        envían títulos, código, notas ni datos personales.
      </p>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-glass-stroke bg-black/20 p-3">
        <div className="text-sm">
          <p className="text-fg">Compartir métricas anónimas</p>
          <p className="text-xs text-fgMuted">
            Puedes desactivarlo en cualquier momento. El cambio surte efecto al instante.
          </p>
        </div>
        <input
          type="checkbox"
          checked={!!enabled}
          onChange={onToggle}
          className="h-5 w-5 cursor-pointer accent-brand-500"
          aria-label="Compartir métricas anónimas"
        />
      </label>

      {!configured ? (
        <p className="mt-3 rounded-md border border-diff-medium/40 bg-diff-medium/10 px-3 py-2 text-xs text-fgSoft">
          Esta build no tiene clave de PostHog configurada — no se envía ningún evento aunque el
          interruptor esté activo.
        </p>
      ) : null}

      {distinctId ? (
        <div className="mt-4">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-fgMuted">ID anónimo</p>
          <div className="flex items-center gap-2 rounded-md border border-glass-stroke bg-black/20 px-3 py-2">
            <code className="flex-1 break-all text-xs text-fgSoft">{distinctId}</code>
            <Button variant="ghost" className="gap-1 px-2 py-1 text-xs" onClick={onCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-fgMuted/80">
            Generado al instalar LeetVault. Único por instalación, sin relación con ninguna cuenta.
          </p>
        </div>
      ) : null}
    </section>
  );
}
