import { useAdminToast } from '@/components/admin/AdminToastProvider';
import ErrorBoundary from '@/ErrorBoundary';
import { useTranslation } from '@/hooks/useTranslation';
import { useAcl } from '@/lib/acl';
import { type ReactNode } from 'react';
import { ROUTE } from './routes';
import { renderDashboardHome } from './sections/home/homeSection';
import { lazySections } from './sections/lazySections';
import { DashboardProps, asArray, type User as DashboardUser } from './types';

const getCommentsSections = lazySections(['comments'], () =>
    import('./sections/comments/commentsSections').then((module) => module.getCommentsSections),
);
const getMediaSections = lazySections(['media'], () => import('./sections/media/mediaSections').then((module) => module.getMediaSections));
const getPagesSections = lazySections(['pages', 'pages.create', 'pages.edit'], () =>
    import('./sections/pages/pagesSections').then((module) => module.getPagesSections),
);
const getPluginsSections = lazySections(['plugins', 'plugin-settings'], () =>
    import('./sections/plugins/pluginsSections').then((module) => module.getPluginsSections),
);
const getPostTypesSections = lazySections(['post-types', 'post-types.create', 'post-types.edit'], () =>
    import('./sections/post-types/postTypesSections').then((module) => module.getPostTypesSections),
);
const getPostsSections = lazySections(['posts', 'posts.create', 'posts.edit', 'posts.show'], () =>
    import('./sections/posts/postsSections').then((module) => module.getPostsSections),
);
const getRolesSections = lazySections(['roles', 'roles.create', 'roles.edit'], () =>
    import('./sections/roles/rolesSections').then((module) => module.getRolesSections),
);
const getSiteSettingsSections = lazySections(['site-settings'], () =>
    import('./sections/site-settings/siteSettingsSections').then((module) => module.getSiteSettingsSections),
);
const getSitemapSections = lazySections(['sitemap'], () => import('./sections/sitemap/sitemapSections').then((module) => module.getSitemapSections));
const getSystemSections = lazySections(['languages', 'email', 'activity', 'redirects', 'updates', 'backups'], () =>
    import('./sections/system/systemSections').then((module) => module.getSystemSections),
);
const getTaxonomiesSections = lazySections(['taxonomies', 'taxonomies.create', 'taxonomies.edit'], () =>
    import('./sections/taxonomies/taxonomiesSections').then((module) => module.getTaxonomiesSections),
);
const getTaxonomyTermsSections = lazySections(['taxonomy-terms', 'taxonomy-terms.create', 'taxonomy-terms.edit', 'taxonomy-terms.show'], () =>
    import('./sections/taxonomy-terms/taxonomyTermsSections').then((module) => module.getTaxonomyTermsSections),
);
const getTemplatesSections = lazySections(['templates', 'templates.create', 'templates.edit', 'templates.show'], () =>
    import('./sections/templates/templatesSections').then((module) => module.getTemplatesSections),
);
const getThemesSections = lazySections(['themes', 'themes.show', 'themes.customizer'], () =>
    import('./sections/themes/themesSections').then((module) => module.getThemesSections),
);
const getTranslationSections = lazySections(['translations'], () =>
    import('./sections/translations/translationSections').then((module) => module.getTranslationSections),
);
const getTrashSections = lazySections(['trash'], () => import('./sections/trash/trashSections').then((module) => module.getTrashSections));
const getUsersSections = lazySections(['users', 'users.create', 'users.edit'], () =>
    import('./sections/users/usersSections').then((module) => module.getUsersSections),
);

export default function DashboardContent({
    adminStats,
    adminSection,
    users: usersProp,
    roles: rolesProp,
    posts: postsProp,
    postTypes,
    currentPostType,
    taxonomies,
    taxonomyTerms,
    taxonomyTerm,
    themes,
    discoveredThemes,
    activeTheme,
    theme,
    allRoles,
    permissions = [],
    editPost,
    post,
    authors,
    filters,
    pageParents,
    pageFields,
    defaultStatus,
    parentsByType,
    groupedTerms,
    sitemapSettings,
    settings,
    settingsGroup,
    pages,
    globalCommentsEnabled,
    timezones,
    plugins,
    plugin,
    settingsSchema,
    templates,
    template,
    editTemplate,
    templateTypes,
    media,
    folders,
    allFolders,
    breadcrumb,
    currentFolderId,
    editUser,
    editRole,
    editPostType,
    editTaxonomy,
    editTaxonomyTerm,
    parentTerms,
    auth,
    systemStatus,
    overview,
    locales,
    currentLocale,
    translation,
    translationManager,
    comments,
    commentCounts,
    commentFilter,
    commentModeration,
    updateCenter,
    backups,
    activity,
    trash,
    redirects,
    mailSettings,
    languages,
}: DashboardProps & { globalCommentsEnabled: boolean }) {
    const { t } = useTranslation();
    const { success: showSuccess, error: showError } = useAdminToast();
    // Convert users to match the expected User type
    const users = asArray(usersProp).map((user: DashboardUser) => ({
        ...user,
        email_verified_at: 'email_verified_at' in user ? user.email_verified_at : null,
        // Ensure roles is always an array of { id, name } objects
        roles: (() => {
            const raw: unknown = user.roles;
            const nested = raw && typeof raw === 'object' && 'roles' in raw ? raw.roles : null;
            const list: unknown[] = Array.isArray(raw) ? raw : Array.isArray(nested) ? nested : [];

            return list
                .filter(
                    (role): role is { id: number; name: string } =>
                        !!role &&
                        typeof role === 'object' &&
                        'id' in role &&
                        typeof role.id === 'number' &&
                        'name' in role &&
                        typeof role.name === 'string',
                )
                .map((role) => ({
                    id: role.id,
                    name: role.name,
                }));
        })(),
    }));
    // Transform permissions to include timestamps for RoleForm
    const permissionsWithTimestamps = (permissions || []).map((permission) => ({
        ...permission,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }));

    // Ensure roles is always an array
    const roles = asArray(rolesProp);

    // Centralized UI ACL: prefer auth-shared roles/permissions via useAcl
    const { hasPermission, isAdmin: isAdminRole } = useAcl();
    const can = (perm: string) => isAdminRole() || hasPermission(perm);

    // Media permissions (computed via can())
    const canEditMedia = can('edit media');
    const canDeleteMedia = can('delete media');

    // Admins or users with relevant permissions can edit post author
    const canEditAuthorFlag = can('assign posts author') || can('edit posts');
    // Posts/Pages section logic extracted to ./sections/posts and ./sections/pages

    // Users/Roles section logic extracted to ./sections/users and ./sections/roles

    // Users/Roles section renderers extracted to ./sections/users and ./sections/roles

    // Render the appropriate section based on adminSection
    const normalizeSection = (s?: string) => {
        if (!s) return undefined;
        // Strip known inertia-style prefixes and trailing index indicators
        let key = s;
        if (key.startsWith('dashboard.admin.')) key = key.replace(/^dashboard\.admin\./, '');
        if (key.endsWith('.index')) key = key.slice(0, -'.index'.length);

        const map: Record<string, string> = {
            post: 'posts',
            user: 'users',
            role: 'roles',
            page: 'pages',
            'post-type': 'post-types',
            taxonomy: 'taxonomies',
            theme: 'themes',
        };
        return map[key] || key;
    };

    const renderSection = () => {
        const section = normalizeSection(adminSection);
        if (!section) {
            return renderDashboardHome({ auth, adminStats, systemStatus, overview, ROUTE, t });
        }

        const sectionsMap: Record<string, () => ReactNode> = {
            ...getSystemSections({ updateCenter, backups, activity, redirects, mailSettings, languages }),
            ...getTrashSections({ trash }),
            ...getMediaSections({
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
            }),
            ...getSitemapSections({
                postTypes,
                sitemapSettings,
                can,
                ROUTE,
                t,
            }),
            ...getPluginsSections({
                plugins,
                plugin,
                settingsSchema,
                can,
                ROUTE,
                t,
            }),
            ...getTranslationSections({
                translationManager,
                can,
                t,
            }),
            ...getCommentsSections({
                comments,
                commentCounts,
                commentFilter,
                commentModeration,
                t,
            }),
            ...getSiteSettingsSections({
                settings,
                settingsGroup,
                pages,
                postTypes,
                timezones,
                locales,
                currentLocale,
                can,
                t,
            }),
            ...getThemesSections({
                themes,
                discoveredThemes,
                activeTheme,
                theme,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getPostsSections({
                postsProp,
                editPost,
                post,
                postTypes,
                currentPostType,
                groupedTerms,
                authors,
                filters,
                parentsByType,
                locales,
                currentLocale,
                translation,
                can,
                canEditAuthorFlag,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getPagesSections({
                postsProp,
                post,
                editPost,
                authors,
                filters,
                pageParents,
                pageFields,
                defaultStatus,
                canEditAuthorFlag,
                locales,
                currentLocale,
                translation,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getPostTypesSections({
                postTypes,
                editPostType,
                globalCommentsEnabled,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getTaxonomiesSections({
                adminSection,
                taxonomies,
                editTaxonomy,
                postTypes,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getUsersSections({
                users,
                auth,
                allRoles,
                permissions,
                editUser,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getRolesSections({
                roles,
                editRole,
                permissionsWithTimestamps,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getTaxonomyTermsSections({
                adminSection,
                taxonomyTerms,
                taxonomyTerm,
                editTaxonomyTerm,
                taxonomies,
                parentTerms,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
            ...getTemplatesSections({
                adminSection,
                templates,
                template,
                editTemplate,
                templateTypes,
                can,
                showSuccess,
                showError,
                ROUTE,
                t,
            }),
        };

        return sectionsMap[section]?.() ?? <div>Section not found</div>;
    };

    return <ErrorBoundary>{renderSection()}</ErrorBoundary>;
}
