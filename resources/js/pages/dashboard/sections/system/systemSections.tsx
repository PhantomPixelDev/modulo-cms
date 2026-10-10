import { lazy, type ReactNode } from 'react';
import type { ActivityProps } from './activitySection';
import type { BackupsProps } from './backupsSection';
import type { MailSettingsData } from './emailSection';
import type { LanguagesProps } from './languagesSection';
import type { RedirectsProps } from './redirectsSection';
import type { UpdateCenterProps } from './updatesSection';
export type { CoreUpdate, PluginUpdate, UpdateCenterProps } from './updatesSection';

const ActivityPage = lazy(() => import('./activitySection').then((module) => ({ default: module.ActivityPage })));
const BackupsPage = lazy(() => import('./backupsSection').then((module) => ({ default: module.BackupsPage })));
const EmailPage = lazy(() => import('./emailSection').then((module) => ({ default: module.EmailPage })));
const LanguagesPage = lazy(() => import('./languagesSection').then((module) => ({ default: module.LanguagesPage })));
const RedirectsPage = lazy(() => import('./redirectsSection').then((module) => ({ default: module.RedirectsPage })));
const UpdatesPage = lazy(() => import('./updatesSection').then((module) => ({ default: module.UpdatesPage })));

export function getSystemSections({
    updateCenter,
    backups,
    activity,
    redirects,
    mailSettings,
    languages,
}: {
    updateCenter?: UpdateCenterProps;
    backups?: BackupsProps;
    activity?: ActivityProps;
    redirects?: RedirectsProps;
    mailSettings?: MailSettingsData;
    languages?: LanguagesProps;
}): Record<string, () => ReactNode> {
    return {
        languages: () => (languages ? <LanguagesPage data={languages} /> : null),
        email: () => (mailSettings ? <EmailPage data={mailSettings} /> : null),
        activity: () => (activity ? <ActivityPage data={activity} /> : null),
        redirects: () => (redirects ? <RedirectsPage data={redirects} /> : null),
        updates: () => (updateCenter ? <UpdatesPage data={updateCenter} /> : null),
        backups: () => (backups ? <BackupsPage data={backups} /> : null),
    };
}
