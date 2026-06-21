import { Minus, Square, X } from 'lucide-react';

const isMac = navigator.userAgent.toLowerCase().includes('mac');

export function TitleBar() {
  if (isMac) {
    return (
      <div
        className="h-8 flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
    );
  }
  return (
    <div
      className="flex h-8 flex-shrink-0 items-center justify-between bg-bg-300/60 pl-3 text-fgSoft"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="select-none text-xs font-medium opacity-80">LeetVault</div>
      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ChromeBtn onClick={() => window.lv.window.minimize()} label="Minimize">
          <Minus className="h-3.5 w-3.5" />
        </ChromeBtn>
        <ChromeBtn onClick={() => window.lv.window.toggleMaximize()} label="Maximize">
          <Square className="h-3 w-3" />
        </ChromeBtn>
        <ChromeBtn onClick={() => window.lv.window.close()} label="Close" danger>
          <X className="h-3.5 w-3.5" />
        </ChromeBtn>
      </div>
    </div>
  );
}

function ChromeBtn({
  children,
  onClick,
  label,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        'flex h-full w-11 items-center justify-center text-fgSoft/80 transition ' +
        (danger ? 'hover:bg-diff-hard hover:text-fg' : 'hover:bg-white/10')
      }
    >
      {children}
    </button>
  );
}
