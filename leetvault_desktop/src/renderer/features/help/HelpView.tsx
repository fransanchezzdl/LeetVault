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
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
//import { useElasticScroll } from '../../lib/useElasticScroll'; // Unused for now

type Extra = 'extension' | 'groq' | undefined;
type Item = [question: string, answer: string, extra?: Extra];

interface Section {
  icon: LucideIcon;
  title: string;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    icon: Sparkles,
    title: 'Primeros pasos',
    items: [
      [
        '¿Qué es LeetVault?',
        'LeetVault es una app de escritorio para guardar, organizar y repasar los problemas de LeetCode que resuelves. Puedes apuntar tu solución, notas, el patrón algorítmico y usar el sistema de repaso espaciado para no olvidar lo que has aprendido.',
      ],
      [
        '¿Cómo añado un problema manualmente?',
        'Ve a la pestaña Problemas y pulsa el botón ＋ Nuevo. Rellena el número, título, dificultad, patrón y tu solución. Pulsa Guardar.',
      ],
      [
        '¿Cómo añado un problema desde LeetCode automáticamente?',
        'Instala la extensión de Chrome incluida (ver sección Extensión más abajo). Con la extensión activa, abre cualquier problema en leetcode.com y pulsa el icono de LeetVault en la barra del navegador. La extensión detecta el número, título, dificultad y tu código del editor automáticamente.',
      ],
    ],
  },
  {
    icon: List,
    title: 'Pestaña Problemas',
    items: [
      [
        '¿Cómo busco o filtro mis problemas?',
        'En la parte superior tienes un buscador de texto libre (busca en título y notas), un filtro de dificultad (Fácil / Medio / Difícil) y un filtro de estado (Resuelto / En progreso / Por repasar).',
      ],
      [
        '¿Qué significan los estados?',
        '• Resuelto — lo has completado y está listo para el ciclo de repaso.\n• En progreso — lo tienes a medias o quieres retomarlo.\n• Por repasar — lo marcaste para revisarlo antes de una entrevista.',
      ],
      [
        '¿Puedo editar o borrar un problema?',
        'Sí. Haz clic en el icono del lápiz para abrir el formulario de edición, o en la papelera para eliminarlo.',
      ],
    ],
  },
  {
    icon: RefreshCw,
    title: 'Pestaña Repaso (Repaso espaciado)',
    items: [
      [
        '¿Qué es el repaso espaciado?',
        'Es una técnica científica para memorizar de forma eficiente. LeetVault usa el algoritmo SM-2: cuanto mejor recuerdas un problema, más días pasan hasta que te lo vuelve a mostrar. Así dedicas tiempo solo a lo que realmente necesitas repasar.',
      ],
      [
        '¿Cómo funciona la sesión de revisión?',
        'La pestaña Repaso muestra los problemas cuya fecha de repaso ha llegado. Intenta resolver el problema, luego valora tu recuerdo con uno de los 5 botones:\n• Blackout — no lo recuerdas nada → vuelve en 1 día\n• Difícil — lo recordaste con mucho esfuerzo → 2 días\n• Bien — lo recordaste con algo de dificultad → 3–7 días\n• Fácil — lo recordaste sin problemas → 7–14 días\n• Perfecto — lo recuerdas como si lo hubieras hecho ayer → 30+ días',
      ],
      [
        '¿Cuándo se añade un problema al ciclo de repaso?',
        'Automáticamente cuando su estado es Resuelto. El primer repaso aparece al día siguiente.',
      ],
    ],
  },
  {
    icon: PieChart,
    title: 'Pestaña Estadísticas',
    items: [
      [
        '¿Qué muestra la pestaña Estadísticas?',
        '• Distribución por dificultad (gráfico de tarta).\n• Top 10 patrones más practicados (gráfico de barras).\n• Heatmap de actividad: un calendario con los días que resolviste problemas, igual que el de GitHub. Pasa el ratón por encima de cada celda para ver cuántos problemas resolviste ese día.',
      ],
    ],
  },
  {
    icon: MapIcon,
    title: 'Pestaña Roadmap',
    items: [
      [
        '¿Qué es el Roadmap?',
        'Es un mapa visual de los patrones algorítmicos más importantes para entrevistas técnicas (Two Pointers, Sliding Window, BFS/DFS, Dynamic Programming, etc.). Muestra cuántos problemas has resuelto de cada patrón y tu progreso general.',
      ],
      [
        '¿Puedo filtrar los problemas por patrón desde el Roadmap?',
        'Sí. Haz clic en cualquier patrón del Roadmap y la pestaña Problemas se abrirá automáticamente filtrada por ese patrón.',
      ],
    ],
  },
  {
    icon: Folder,
    title: 'Extensión de Chrome',
    items: [
      [
        '¿Cómo instalo la extensión?',
        '1. Abre Chrome y ve a chrome://extensions\n2. Activa el Modo desarrollador (esquina superior derecha)\n3. Pulsa "Cargar descomprimida"\n4. Selecciona la carpeta leetcode_extension incluida con LeetVault (pulsa "Abrir carpeta de la extensión" para encontrarla)\n5. La extensión aparecerá en tu barra de Chrome.',
        'extension',
      ],
      [
        '¿La extensión funciona si LeetVault no está abierto?',
        'No. La extensión se comunica con la app de escritorio a través de un servidor local (puerto 7842). LeetVault debe estar abierto y en ejecución para que puedas guardar problemas desde Chrome.',
      ],
      [
        '¿Qué datos captura la extensión?',
        'Solo los datos del problema que estás viendo: número, título, dificultad, tags y el código que tienes en el editor Monaco de LeetCode. No envía nada a ningún servidor externo — todo va directamente a tu app local.',
      ],
    ],
  },
  {
    icon: Sparkles,
    title: 'Pista IA (Groq)',
    items: [
      [
        '¿Qué es la pista IA?',
        'Es una funcionalidad opcional de la extensión. Al pulsar "Pista IA" en el popup de la extensión, se envía el título del problema y tu código actual a la API de Groq (gratuita) y recibes una pista de 2-3 frases sobre la estrategia o patrón a seguir, sin darte la solución directa.',
      ],
      [
        '¿Cómo consigo y configuro mi API key de Groq?',
        '1. Ve a console.groq.com y crea una cuenta gratuita\n2. En el panel, ve a "API Keys" → "Create API Key"\n3. Copia la key (empieza por gsk_...)\n4. Abre la extensión en leetcode.com → pulsa "Pista IA"\n5. La primera vez te pedirá la key → pégala y pulsa Guardar\nLa key se guarda solo en tu navegador (chrome.storage.local). LeetVault nunca la ve ni la almacena.',
        'groq',
      ],
      [
        '¿Cuánto cuesta usar Groq?',
        'La capa gratuita de Groq es más que suficiente para uso personal: incluye miles de peticiones al mes. El modelo usado (Llama 3.1 8B) es muy rápido y eficiente.',
      ],
      [
        'La pista IA da error 401, ¿qué hago?',
        'Tu API key no es válida o ha caducado. La extensión borrará la key guardada automáticamente y te pedirá una nueva. Ve a console.groq.com para generar una nueva key.',
      ],
    ],
  },
  {
    icon: Lock,
    title: 'Privacidad y datos',
    items: [
      [
        '¿Dónde se guardan mis datos?',
        'Todo se guarda localmente en tu ordenador en una base de datos SQLite llamada leetcode.db. La ruta depende del sistema operativo (Windows: %APPDATA%\\LeetVault; macOS: ~/Library/Application Support/LeetVault; Linux: ~/.config/LeetVault). Puedes hacer backup copiando ese archivo.',
      ],
      [
        '¿LeetVault envía algo a internet?',
        'Solo si usas la pista IA — en ese caso se envía el título del problema y tu código a la API de Groq usando tu propia key. Nada más. La app principal es 100% offline.',
      ],
      [
        '¿Cómo hago backup de mis problemas?',
        'Copia el archivo leetcode.db de la ruta anterior a donde quieras. Para restaurar, pégalo de vuelta en la misma carpeta (cierra LeetVault antes).',
      ],
    ],
  },
];

export function HelpView() {
  //const { ref, onWheel, style } = useElasticScroll<HTMLDivElement>(); // Unused for now
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalized) return SECTIONS;
    return SECTIONS
      .map((sec) => ({
        ...sec,
        items: sec.items.filter(
          ([q, a]) =>
            q.toLowerCase().includes(normalized) ||
            a.toLowerCase().includes(normalized)
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [normalized]);

  const totalHits = filteredSections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div /*ref={ref} onWheel={onWheel}*/ className="h-full overflow-auto scroll-thin">
      <div /*style={style}*/ className="px-8 py-7">
      <header className="mb-6 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-brand-400" />
        <h1 className="text-2xl font-bold text-fg">Ayuda y preguntas frecuentes</h1>
      </header>

      <div className="mb-7 max-w-5xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fgMuted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la ayuda (preguntas, respuestas)…"
            className="h-11 w-full rounded-xl border border-glass-stroke bg-bg-200/60 pl-10 pr-10 text-sm text-fg placeholder:text-fgMuted outline-none backdrop-blur-sm focus:border-brand-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-fgMuted hover:bg-white/10 hover:text-fg"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {normalized ? (
          <p className="mt-2 px-1 text-xs text-fgMuted">
            {totalHits === 0
              ? 'Sin resultados.'
              : `${totalHits} resultado${totalHits === 1 ? '' : 's'} en ${filteredSections.length} sección${filteredSections.length === 1 ? '' : 'es'}.`}
          </p>
        ) : null}
      </div>

      <div className="max-w-5xl space-y-7">
        {!normalized ? <DataSection /> : null}
        {filteredSections.map((sec) => (
          <section key={sec.title}>
            <div className="mb-2 flex items-center gap-2">
              <sec.icon className="h-4 w-4 text-brand-400" />
              <h2 className="text-base font-bold text-brand-200">{sec.title}</h2>
            </div>
            <div className="mb-3 border-b border-glass-stroke" />
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {sec.items.map(([q, a, extra]) => (
                <FaqItem
                  key={q}
                  question={q}
                  answer={a}
                  extra={extra}
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
          msg: `Importados ${res.imported} problemas. Backup en ${res.backupPath || '(sin backup previo)'}`,
        });
      } else if (res.reason === 'cancelled') {
        setStatus({ kind: 'idle' });
      } else {
        setStatus({ kind: 'err', msg: res.message || 'No se pudo importar la base de datos.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Database className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">Datos</h2>
      </div>
      <div className="mb-3 border-b border-glass-stroke" />

      <div className="rounded-2xl border border-glass-stroke bg-white/[0.04] p-4">
        <p className="text-sm text-fg">Importar base de datos de una versión anterior</p>
        <p className="mt-1 text-xs text-fgMuted">
          Selecciona un <code className="text-fgSoft">leetcode.db</code> de LeetVault v1. Se validará
          el esquema y reemplazará la base de datos actual, conservando un backup automático.
        </p>
        {dbPath ? (
          <p className="mt-2 text-[11px] text-fgMuted/80">
            Ruta actual: <code className="text-fgSoft">{dbPath}</code>
          </p>
        ) : null}

        <div className="mt-3">
          <Button variant="outline" className="gap-2" onClick={onImport} disabled={busy}>
            <Upload className="h-4 w-4" />
            {busy ? 'Importando…' : 'Importar leetcode.db…'}
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
              <ExternalLink className="h-4 w-4" /> Ir a console.groq.com
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExtensionPathBlock() {
  const [path, setPath] = useState<string>('');

  useEffect(() => {
    window.lv.app.extensionPath().then(setPath).catch(() => setPath(''));
  }, []);

  return (
    <div className="mt-3 space-y-2">
      {path ? (
        <p className="text-[11px] text-fgMuted/80">
          Ruta: <code className="text-fgSoft">{path}</code>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.lv.app.openExtensionFolder()}
          disabled={!path}
        >
          <Folder className="h-4 w-4" /> Abrir carpeta de la extensión
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
          <ExternalLink className="h-4 w-4" /> Guía de instalación
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
