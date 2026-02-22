import type { ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { TranslationManager } from '../../components/translations/TranslationManager';
import type { TranslationManagerPayload } from '../../types';

export function getTranslationSections({
  translationManager,
  can,
  t,
}: {
  translationManager?: TranslationManagerPayload;
  can: (permission: string) => boolean;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderTranslations = () => (
    <SectionWrapper
      title={t('dashboard.translations.title')}
      description={t('dashboard.translations.description')}
    >
      {translationManager ? (
        <TranslationManager
          {...translationManager}
          canEdit={can('edit settings')}
        />
      ) : (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          {t('dashboard.translations.unavailable')}
        </div>
      )}
    </SectionWrapper>
  );

  return {
    translations: renderTranslations,
  };
}
