import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { MediaLibrary } from '../../components/media/MediaLibrary';
import { asArray } from '../../types';

export function getMediaSections({
  media,
  folders,
  allFolders,
  breadcrumb,
  currentFolderId,
  can,
  canEditMedia,
  canDeleteMedia,
  ROUTE,
  t,
}: {
  media: any;
  folders: any;
  allFolders: any;
  breadcrumb: any;
  currentFolderId: any;
  can: (perm: string) => boolean;
  canEditMedia: boolean;
  canDeleteMedia: boolean;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderMedia = () => (
    <SectionWrapper
      title={t('dashboard.media.title')}
      description={t('dashboard.media.description')}
    >
      <MediaLibrary
        items={asArray(media as any)}
        pagination={
          media && !Array.isArray((media as any)) && (media as any).current_page
            ? {
                current_page: (media as any).current_page,
                last_page: (media as any).last_page,
                per_page: (media as any).per_page,
                total: (media as any).total,
              }
            : undefined
        }
        folders={asArray(folders as any)}
        allFolders={asArray(allFolders as any)}
        breadcrumb={asArray(breadcrumb as any)}
        currentFolderId={currentFolderId ?? null}
        canUpload={can('upload media')}
        canEdit={canEditMedia}
        canDelete={canDeleteMedia}
      />
    </SectionWrapper>
  );

  return {
    media: renderMedia,
  };
}
