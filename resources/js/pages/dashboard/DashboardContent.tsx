import { type ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { getTemplatesSections } from './sections/templates/templatesSections';
import { getTaxonomyTermsSections } from './sections/taxonomy-terms/taxonomyTermsSections';
import { getUsersSections } from './sections/users/usersSections';
import { getRolesSections } from './sections/roles/rolesSections';
import { renderDashboardHome } from './sections/home/homeSection';
import { getPostsSections } from './sections/posts/postsSections';
import { getPagesSections } from './sections/pages/pagesSections';
import { getPostTypesSections } from './sections/post-types/postTypesSections';
import { getTaxonomiesSections } from './sections/taxonomies/taxonomiesSections';
import { getThemesSections } from './sections/themes/themesSections';
import { getMediaSections } from './sections/media/mediaSections';
import { getSitemapSections } from './sections/sitemap/sitemapSections';
import { getPluginsSections } from './sections/plugins/pluginsSections';
import { getSiteSettingsSections } from './sections/site-settings/siteSettingsSections';
import { getShopSections } from './sections/shop/shopSections';
import { DashboardProps, asArray, type User as DashboardUser } from './types';
import { ROUTE } from './routes';
import { useAcl } from '@/lib/acl';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function DashboardContent({
  adminStats,
  adminSection,
  users: usersProp,
  roles: rolesProp,
  posts: postsProp,
  postTypes,
  taxonomies,
  taxonomyTerms,
  taxonomyTerm,
  themes,
  discoveredThemes,
  activeTheme,
  theme,
  // theme details/customizer
  customizerSettings,
  availableMenus,
  widgetAreas,
  allRoles,
  permissions = [],
  editPost,
  post,
  authors,
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
  templates,
  template,
  editTemplate,
  templateTypes,
  media,
  folders,
  allFolders,
  breadcrumb,
  currentFolderId,
  shopProducts,
  shopOrders,
  shopOrder,
  editUser,
  editRole,
  editPostType,
  editTaxonomy,
  editTaxonomyTerm,
  parentTerms,
  auth,
  systemStatus,
}: DashboardProps & { globalCommentsEnabled: boolean }) {
  const {
    success: showSuccess,
    error: showError,
  } = useAdminToast();
  // Convert users to match the expected User type
  const users = asArray(usersProp).map((user: DashboardUser) => ({
    ...user,
    email_verified_at: 'email_verified_at' in user ? user.email_verified_at : null,
    // Ensure roles is always an array of { id, name } objects
    roles: (() => {
      const raw: any = (user as any).roles;
      const list: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.roles)
          ? raw.roles
          : [];

      return list
        .filter((r) => r && typeof r === 'object')
        .map((role) => ({
          id: role.id,
          name: role.name,
        }));
    })(),
  }));
  // Transform permissions to include timestamps for RoleForm
  const permissionsWithTimestamps = (permissions || []).map(permission => ({
    ...permission,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    if (key.endsWith('.index')) key = key.slice(0, -('.index'.length));

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
      return renderDashboardHome({ auth, adminStats, systemStatus, ROUTE });
    }

    const sectionsMap: Record<string, () => ReactNode> = {
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
      }),
      ...getSitemapSections({
        postTypes,
        sitemapSettings,
        can,
        ROUTE,
      }),
      ...getPluginsSections({
        plugins,
        plugin,
        can,
        ROUTE,
      }),
      ...getShopSections({
        shopProducts,
        shopOrders,
        shopOrder,
        can,
        ROUTE,
      }),
      ...getSiteSettingsSections({
        settings,
        settingsGroup,
        pages,
        timezones,
        can,
        ROUTE,
      }),
      ...getThemesSections({
        themes,
        discoveredThemes,
        activeTheme,
        theme,
        customizerSettings,
        availableMenus,
        widgetAreas,
        can,
        showSuccess,
        showError,
        ROUTE,
      }),
      ...getPostsSections({
        postsProp,
        editPost,
        post,
        postTypes,
        groupedTerms,
        authors,
        parentsByType,
        can,
        canEditAuthorFlag,
        showSuccess,
        showError,
        ROUTE,
      }),
      ...getPagesSections({
        postsProp,
        post,
        editPost,
        can,
        showSuccess,
        showError,
        ROUTE,
      }),
      ...getPostTypesSections({
        postTypes,
        editPostType,
        globalCommentsEnabled,
        can,
        showSuccess,
        showError,
        ROUTE,
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
      }),
      ...getRolesSections({
        roles,
        editRole,
        permissionsWithTimestamps,
        can,
        showSuccess,
        showError,
        ROUTE,
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
      }),
    };

    return sectionsMap[section]?.() ?? <div>Section not found</div>;
  };

  // Move getPageTitle to the top level of the component
  const getPageTitle = (): string => {
    const appName = 'Modulo CMS';
    const section = normalizeSection(adminSection);
    const item = editUser || editRole || editPost || editPostType || editTaxonomy || post;
    
    if (!section) return `Dashboard | ${appName}`;
    
    // Handle edit/create views
    if (item) {
      const action = editUser || editRole || editPost || editPostType || editTaxonomy ? 'Edit' : 'View';
      const type = editUser || (item as any)?.name?.includes('user') ? 'User' : 
                  editRole || (item as any)?.name?.includes('role') ? 'Role' :
                  editPost || (item as any)?.title ? 'Post' : 
                  editPostType ? 'Post Type' : 
                  editTaxonomy ? 'Taxonomy' : 'Item';
      
      const itemName = (item as any)?.title || (item as any)?.name || '';
      
      return itemName 
        ? `${action} ${type}: ${itemName} | ${section.charAt(0).toUpperCase() + section.slice(1)} | ${appName}`
        : `${action} ${type} | ${section.charAt(0).toUpperCase() + section.slice(1)} | ${appName}`;
    }
    
    // Handle list views
    return `${section.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} | ${appName}`;
  };

  // Get the title once when the component renders
  const pageTitle = getPageTitle();

  useDocumentTitle(pageTitle);

  return (
    <>
      <Head>
        <title key="title">{pageTitle}</title>
        <meta name="description" content={pageTitle} key="description" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderSection()}
      </div>
    </>
  );
}
