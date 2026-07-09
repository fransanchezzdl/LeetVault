import { useEffect, useState } from 'react';
import { ExternalLink, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

export function ExtensionPathBlock() {
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
