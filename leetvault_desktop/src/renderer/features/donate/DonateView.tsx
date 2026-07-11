import { Heart, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { siKofi, siGithubsponsors } from 'simple-icons';

const KOFI_URL = 'https://ko-fi.com/fransanchezzdl';
const SPONSORS_URL = 'https://github.com/sponsors/fransanchezzdl';

export function DonateView(): JSX.Element {
  const { t } = useTranslation('donate');

  const open = (url: string): void => {
    void window.lv.app.openExternal(url);
  };

  return (
    <div className="flex h-full items-center justify-center p-8">
      <section className="glass-card-dim w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Heart className="h-6 w-6" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-fg">{t('title')}</h1>
        <p className="mb-6 text-sm text-fg/[0.68]">{t('intro')}</p>

        <div className="flex flex-col gap-3">
          <DonateButton
            onClick={() => open(KOFI_URL)}
            label={t('kofi')}
            hint={t('kofiHint')}
            iconPath={siKofi.path}
            iconColor={`#${siKofi.hex}`}
          />
          <DonateButton
            onClick={() => open(SPONSORS_URL)}
            label={t('sponsors')}
            hint={t('sponsorsHint')}
            iconPath={siGithubsponsors.path}
            iconColor={`#${siGithubsponsors.hex}`}
          />
        </div>

        <p className="mt-6 text-xs text-fg/[0.55]">{t('thanks')}</p>
      </section>
    </div>
  );
}

function DonateButton(props: {
  onClick: () => void;
  label: string;
  hint: string;
  iconPath: string;
  iconColor: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="group flex items-center gap-3 rounded-lg border border-glass-stroke/10 bg-fg/[0.04] px-4 py-3 text-left transition hover:border-brand-500/30 hover:bg-fg/[0.08]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-fg/[0.06]"
        aria-hidden="true"
      >
        <svg width={20} height={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d={props.iconPath} fill={props.iconColor} />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{props.label}</span>
        <span className="block text-xs text-fg/[0.60]">{props.hint}</span>
      </span>
      <ExternalLink className="h-4 w-4 text-fg/[0.45] transition group-hover:text-brand-300" />
    </button>
  );
}
