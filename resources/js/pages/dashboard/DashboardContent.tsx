import { useState, type ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
// Ziggy exposes a global `route()` when @routes is included; declare it for TS
declare const route: (name: string, params?: any) => string;
import { Button } from '@/components/ui/button';
import { SectionWrapper } from './components/common/SectionWrapper';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { UserList, UserForm } from './components/users';
import { RoleList, RoleForm } from './components/roles';
import { PostList } from './components/posts/PostList';
import { PostForm } from './components/posts/PostForm';
import { PostTypeForm } from './components/post-types/PostTypeForm';
import { PostTypeList } from './components/post-types/PostTypeList';
import { PostView } from './components/posts/PostView';
import { PageForm } from './components/pages/PageForm';
import { PagesList } from './components/pages/PagesList';
import { TaxonomyList } from './components/taxonomies/TaxonomyList';
import { TaxonomyForm } from './components/taxonomies/TaxonomyForm';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, Database, HardDrive, RefreshCcw, Server, Timer, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ActiveThemeCard } from './components/themes/ActiveThemeCard';
import { InstalledThemesGrid } from './components/themes/InstalledThemesGrid';
import { DiscoveredThemesList } from './components/themes/DiscoveredThemesList';
import { ThemeDetails } from './components/themes/ThemeDetails';
import { ThemeCustomizerForm } from './components/themes/ThemeCustomizerForm';
import { SitemapSettingsForm } from './components/sitemap/SitemapSettingsForm';
import { DashboardProps, asArray, type User as DashboardUser, type Permission, type PostListItem } from './types';
import { SectionHeader } from '@/components/ui/section-header';
import { ROUTE } from './routes';
import { MediaLibrary } from './components/media/MediaLibrary';
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
  themes,
  discoveredThemes,
  activeTheme,
  theme,
  // theme details/customizer
  themeConfig,
  themeAssets,
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
  media,
  folders,
  allFolders,
  breadcrumb,
  currentFolderId,
  editUser,
  editRole,
  editPostType,
  editTaxonomy,
  auth,
  recentActivity,
  systemStatus,
}: DashboardProps) {
  const {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    notify: showToast,
  } = useAdminToast();
  const [showUserForm, setShowUserForm] = useState(false);
  // Convert users to match the expected User type
  const users = asArray(usersProp).map((user: DashboardUser) => ({
    ...user,
    email_verified_at: 'email_verified_at' in user ? user.email_verified_at : null,
    // Ensure roles is always an array of { id, name } objects
    roles: (user.roles || []).map(role => ({
      id: role.id,
      name: role.name
    }))
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

  const statusIcons: Record<string, LucideIcon> = {
    server: Server,
    uptime: Timer,
    database: Database,
    cache: Zap,
    storage: HardDrive,
    queue: Activity,
  };

  const statusDescriptions: Record<string, string> = {
    server: 'Application web server availability',
    uptime: 'Time since the last server restart',
    database: 'Database connection health',
    cache: 'Cache layer responsiveness',
    storage: 'Disk usage across storage volumes',
    queue: 'Background job throughput',
  };

  const STATUS_COLOR_TOKENS: Record<string, { text: string; indicator: string; badge: string; iconBg: string; border: string }> = {
    green: {
      text: 'text-emerald-600',
      indicator: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    blue: {
      text: 'text-sky-600',
      indicator: 'bg-sky-500',
      badge: 'bg-sky-50 text-sky-700 border border-sky-200',
      iconBg: 'bg-sky-50 text-sky-600',
      border: 'border-sky-100',
    },
    yellow: {
      text: 'text-amber-600',
      indicator: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700 border border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    red: {
      text: 'text-rose-600',
      indicator: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
    },
    gray: {
      text: 'text-muted-foreground',
      indicator: 'bg-muted-foreground/60',
      badge: 'bg-muted/80 text-muted-foreground border border-border/60',
      iconBg: 'bg-muted/70 text-muted-foreground',
      border: 'border-border/60',
    },
  };

  const getStatusColors = (tone: string) => STATUS_COLOR_TOKENS[tone] ?? STATUS_COLOR_TOKENS.gray;

  const formatLastChecked = (iso?: string) => {
    if (!iso) return 'Updated moments ago';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Updated moments ago';

    const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (diffMinutes <= 1) return 'Updated just now';
    if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Updated ${diffHours}h ago`;

    const diffDays = Math.round(diffHours / 24);
    return `Updated ${diffDays}d ago`;
  };
  // Handle page form submission
  const handlePageSubmit = async (formData: any, editId?: number) => {
    const url = editId ? ROUTE.pages.update(editId) : ROUTE.pages.store();
    const method = editId ? 'put' : 'post';
    try {
      // Use Inertia callbacks for better UX and to ensure navigation happens
      router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Page ${editId ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.pages.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${editId ? 'update' : 'create'} page`);
        },
      });
    } catch (error) {
      console.error('Error saving page:', error);
      showError(`Failed to ${editId ? 'update' : 'create'} page`);
    }
  };

  // Handle delete page
  const handleDeletePage = async (page: any) => {
    const name = page?.title || 'this page';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await router.delete(ROUTE.pages.destroy(page.id), {
        onSuccess: () => {
          showSuccess('Page deleted');
          router.visit(ROUTE.pages.index());
        },
        onError: () => showError('Failed to delete page'),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      showError('An error occurred while deleting the page');
    }
  };

  // Handle delete post type
  const handleDeletePostType = async (pt: any) => {
    const name = pt?.label || pt?.name || 'this post type';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await router.delete(ROUTE.postTypes.destroy(pt.id), {
        onSuccess: () => {
          showSuccess('Post type deleted');
          router.visit(ROUTE.postTypes.index());
        },
        onError: () => showError('Failed to delete post type'),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting post type:', error);
      showError('An error occurred while deleting the post type');
    }
  };

  // Handle post type form submission
  const handlePostTypeSubmit = async (formData: any) => {
    try {
      const url = (editPostType as any)
        ? ROUTE.postTypes.update((editPostType as any).id)
        : ROUTE.postTypes.store();
      const method = (editPostType as any) ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Post type ${(editPostType as any) ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.postTypes.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${(editPostType as any) ? 'update' : 'create'} post type`);
        },
      });
    } catch (error) {
      console.error('Error saving post type:', error);
      showError(`Failed to ${(editPostType as any) ? 'update' : 'create'} post type`);
    }
  };

  // Handle post form submission
  const handlePostSubmit = async (formData: any, editId?: number) => {
    try {
      const url = editId ? ROUTE.posts.update(editId) : ROUTE.posts.store();
      const method = editId ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Post ${editId ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.posts.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${editId ? 'update' : 'create'} post`);
        },
      });
    } catch (error) {
      console.error('Error saving post:', error);
      showError(`Failed to ${editId ? 'update' : 'create'} post`);
    }
  };

  

  // Handle user form submission
  const handleUserSubmit = async (formData: any) => {
    try {
      const url = editUser 
        ? ROUTE.users.update(editUser.id)
        : ROUTE.users.store();
      
      const method = editUser ? 'put' : 'post';
      
      // Use Inertia callbacks to ensure XHR completes before redirect
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`User ${editUser ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.users.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${editUser ? 'update' : 'create'} user`);
        },
      });
    } catch (error) {
      console.error('Error saving user:', error);
      showError(`Failed to ${editUser ? 'update' : 'create'} user`);
    }
  };

  // Handle role form submission
  const handleRoleSubmit = async (data: any) => {
    const url = editRole 
      ? ROUTE.roles.update(editRole.id)
      : ROUTE.roles.store();
    
    const method = editRole ? 'put' : 'post';
    
    try {
      await router[method](url, data, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Role ${editRole ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.roles.index());
        },
        onError: (errors) => {
          console.error('Failed to save role:', errors);
          showError(`Failed to ${editRole ? 'update' : 'create'} role`);
        },
      });
    } catch (error) {
      console.error('Error saving role:', error);
      showError(`Failed to ${editRole ? 'update' : 'create'} role`);
    }
  };

  // --- Posts: extract render helpers to simplify switch ---
  const renderPostsList = () => {
    const postItems: PostListItem[] = Array.isArray(postsProp)
      ? (postsProp as PostListItem[])
      : (((postsProp as any)?.data ?? []) as PostListItem[]);

    return (
      <SectionWrapper
        title="Posts"
        actions={
          can('create posts') ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.posts.create())}>
              + New Post
            </Button>
          ) : null
        }
      >
        <PostList
          posts={postItems}
          canCreate={false}
          canEdit={can('edit posts')}
        />
      </SectionWrapper>
    );
  };

  const renderMedia = () => (
    <SectionWrapper
      title="Media"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
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

  // --- Users helpers ---
  const renderUsersList = () => (
    <SectionWrapper 
      title="Users"
      actions={
        can('create users') ? (
          <Button 
            size="sm" 
            onClick={() => router.visit(ROUTE.users.create())}
          >
            + New User
          </Button>
        ) : null
      }
    >
      <UserList 
        users={users} 
        onEdit={(id) => router.visit(ROUTE.users.edit(id))}
        onRoleChange={async (userId, roleId, action) => {
          try {
            const url = action === 'assign' 
              ? ROUTE.users.roles.assign(userId, roleId)
              : ROUTE.users.roles.remove(userId, roleId);
            await router.post(url, {}, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(`Role ${action === 'assign' ? 'assigned' : 'removed'} successfully`);
                router.reload({ only: ['users'] });
              },
              onError: () => showError(`Failed to ${action} role`)
            });
          } catch (error) {
            console.error('Error updating user role:', error);
            showError('An error occurred while updating the role');
          }
        }}
        currentUserId={auth.user?.id}
        canEditUsers={can('edit users')}
        canDeleteUsers={can('delete users')}
        canManageRoles={can('assign roles')}
      />
    </SectionWrapper>
  );

  const renderUserCreate = () => (
    <SectionWrapper 
      title="Create New User"
      actions={
        <Button 
          variant="outline"
          size="sm"
          onClick={() => router.visit(ROUTE.users.index())}
        >
          Back to Users
        </Button>
      }
    >
      <UserForm 
        allRoles={allRoles || []}
        isEditing={false}
        permissions={permissions}
        onSubmit={handleUserSubmit}
        onCancel={() => router.visit(ROUTE.users.index())}
        currentUserId={auth.user?.id}
      />
    </SectionWrapper>
  );

  const renderUserEdit = () => {
    if (!editUser) {
      return (
        <SectionWrapper title="User Not Found">
          <p>User not found. Please try again.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.visit(ROUTE.users.index())}
            className="mt-4"
          >
            Back to Users
          </Button>
        </SectionWrapper>
      );
    }
    return (
      <SectionWrapper 
        title="Edit User"
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.visit(ROUTE.users.index())}
          >
            Back to Users
          </Button>
        }
      >
        <UserForm 
          user={{
            ...editUser,
            email_verified_at: 'email_verified_at' in editUser ? editUser.email_verified_at : null,
            roles: (editUser.roles || []).map(role => ({
              ...role,
              created_at: role.created_at || new Date().toISOString(),
              updated_at: role.updated_at || new Date().toISOString()
            }))
          }}
          allRoles={(allRoles || []).map(role => ({
            ...role,
            created_at: role.created_at || new Date().toISOString(),
            updated_at: role.updated_at || new Date().toISOString()
          }))}
          isEditing={true}
          permissions={permissions}
          onSubmit={handleUserSubmit}
          onCancel={() => router.visit(ROUTE.users.index())}
          currentUserId={auth.user?.id}
        />
      </SectionWrapper>
    );
  };

  // --- Roles helpers ---
  const renderRolesList = () => (
    <SectionWrapper 
      title="Roles"
      actions={
        <Button size="sm" onClick={() => router.visit(ROUTE.roles.create())}>
          + New Role
        </Button>
      }
    >
      <RoleList 
        roles={roles} 
        onEdit={(id) => router.visit(ROUTE.roles.edit(id))} 
      />
    </SectionWrapper>
  );

  const renderRoleCreateEdit = () => (
    <SectionWrapper 
      title={editRole ? 'Edit Role' : 'Create New Role'}
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.visit(ROUTE.roles.index())}
        >
          Back to Roles
        </Button>
      }
    >
      <RoleForm
        role={editRole}
        allPermissions={permissionsWithTimestamps}
        isEditing={!!editRole}
        onSubmit={handleRoleSubmit}
        onCancel={() => router.visit(ROUTE.roles.index())}
      />
    </SectionWrapper>
  );

  const renderPostCreate = () => (
    <SectionWrapper title="Create Post" actions={
      <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
        Back to Posts
      </Button>
    }>
      <PostForm 
        isEditing={false}
        postTypes={(postTypes as any) || []}
        groupedTerms={(groupedTerms as any) || {}}
        authors={(authors as any) || []}
        parentsByType={(parentsByType as any) || {}}
        canEditAuthor={canEditAuthorFlag}
        onSubmit={handlePostSubmit}
        onCancel={() => router.visit(ROUTE.posts.index())}
      />
    </SectionWrapper>
  );

  const renderPostEdit = () => (
    <SectionWrapper title="Edit Post" actions={
      <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
        Back to Posts
      </Button>
    }>
      <PostForm 
        post={editPost as any}
        postTypes={(postTypes as any) || []}
        groupedTerms={(groupedTerms as any) || {}}
        authors={(authors as any) || []}
        parentsByType={(parentsByType as any) || {}}
        canEditAuthor={canEditAuthorFlag}
        isEditing={true}
        onSubmit={(data) => handlePostSubmit(data, (editPost as any)?.id)}
        onCancel={() => router.visit(ROUTE.posts.index())}
      />
    </SectionWrapper>
  );

  const renderPostShow = () => (
    <SectionWrapper title="View Post" actions={
      <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
        Back to Posts
      </Button>
    }>
      <PostView post={(post as any) || (editPost as any)} />
    </SectionWrapper>
  );

  // --- Pages helpers ---
  const renderPagesList = () => (
    <SectionWrapper
      title="Pages"
      actions={
        can('create posts') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.pages.create())}>
            + New Page
          </Button>
        ) : null
      }
    >
      <PagesList
        pages={asArray((postsProp as any)?.data || [])
          .filter((p: any) => (p.post_type?.name ? p.post_type.name === 'page' : true))
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            created_at: p.created_at,
            author: p.author ? { id: p.author.id, name: p.author.name } : null,
          }))}
        canEdit={can('edit posts')}
        canDelete={can('delete posts')}
        onEdit={(id) => router.visit(ROUTE.pages.edit(id))}
        onDelete={(pg) => handleDeletePage(pg)}
      />
    </SectionWrapper>
  );

  const renderPageCreate = () => (
    <SectionWrapper
      title={'Create Page'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
          Back to Pages
        </Button>
      }
    >
      <PageForm
        isEditing={false}
        onSubmit={(data) => handlePageSubmit(data)}
        onCancel={() => router.visit(ROUTE.pages.index())}
      />
    </SectionWrapper>
  );

  const renderPageEdit = () => (
    <SectionWrapper
      title={'Edit Page'}
      actions={
        <div className="flex gap-2">
          {can('delete posts') && (
            <Button variant="destructive" size="sm" onClick={() => handleDeletePage((post as any) || (editPost as any))}>
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
            Back to Pages
          </Button>
        </div>
      }
    >
      <PageForm
        page={(post as any) || (editPost as any)}
        isEditing={true}
        onSubmit={(data) => handlePageSubmit(data, ((post as any) || (editPost as any))?.id)}
        onCancel={() => router.visit(ROUTE.pages.index())}
      />
    </SectionWrapper>
  );

  // --- Post Types helpers ---
  const renderPostTypesList = () => (
    <SectionWrapper
      title="Post Types"
      actions={
        can('create post types') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.postTypes.create())}>
            + New Post Type
          </Button>
        ) : null
      }
    >
      <PostTypeList
        items={asArray(postTypes).map((pt: any) => ({
          id: pt.id,
          name: pt.name,
          label: pt.label,
          route_prefix: pt.route_prefix ?? null,
        }))}
        canView={can('view post types')}
        canEdit={can('edit post types')}
        canDelete={can('delete post types')}
        onView={(id) => router.visit(ROUTE.postTypes.show(id))}
        onEdit={(id) => router.visit(ROUTE.postTypes.edit(id))}
        onDelete={(pt) => handleDeletePostType(pt)}
      />
    </SectionWrapper>
  );

  const renderPostTypeCreate = () => (
    <SectionWrapper
      title={'Create Post Type'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.postTypes.index())}>
          Back to Post Types
        </Button>
      }
    >
      <PostTypeForm
        isEditing={false}
        onSubmit={handlePostTypeSubmit}
        onCancel={() => router.visit(ROUTE.postTypes.index())}
      />
    </SectionWrapper>
  );

  const renderPostTypeEdit = () => (
    <SectionWrapper
      title={'Edit Post Type'}
      actions={
        <div className="flex gap-2">
          {can('delete post types') && (
            <Button variant="destructive" size="sm" onClick={() => handleDeletePostType(editPostType)}>
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.postTypes.index())}>
            Back to Post Types
          </Button>
        </div>
      }
    >
      <PostTypeForm
        postType={editPostType as any}
        isEditing={true}
        onSubmit={handlePostTypeSubmit}
        onCancel={() => router.visit(ROUTE.postTypes.index())}
      />
    </SectionWrapper>
  );

  // --- Taxonomies helpers ---
  const renderTaxonomiesList = () => (
    <SectionWrapper
      title="Taxonomies"
      actions={
        can('create taxonomies') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.taxonomies.create())}>
            + New Taxonomy
          </Button>
        ) : null
      }
    >
      <TaxonomyList
        items={(Array.isArray((taxonomies as any)?.data) ? (taxonomies as any).data : asArray(taxonomies)).map((tx: any) => ({
          id: tx.id,
          name: tx.name,
          label: tx.label,
        }))}
        canView={can('view taxonomies')}
        canEdit={can('edit taxonomies')}
        onView={(id) => router.visit(ROUTE.taxonomies.show(id))}
        onEdit={(id) => router.visit(ROUTE.taxonomies.edit(id))}
      />
    </SectionWrapper>
  );

  const renderTaxonomyForm = () => (
    <SectionWrapper
      title={adminSection === 'taxonomies.create' ? 'Create Taxonomy' : 'Edit Taxonomy'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.taxonomies.index())}>
          Back to Taxonomies
        </Button>
      }
    >
      <TaxonomyForm
        taxonomy={(adminSection === 'taxonomies.edit' ? editTaxonomy : null) as any}
        postTypes={(postTypes as any) || []}
        isEditing={adminSection === 'taxonomies.edit'}
        onSubmit={async (payload) => {
          const isEditingTaxonomy = adminSection === 'taxonomies.edit' && editTaxonomy;
          try {
            const method = isEditingTaxonomy ? 'put' : 'post';
            const url = isEditingTaxonomy
              ? route('dashboard.admin.taxonomies.update', { taxonomy: editTaxonomy.id })
              : route('dashboard.admin.taxonomies.store');
            await router[method](url, payload, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(`Taxonomy ${isEditingTaxonomy ? 'updated' : 'created'} successfully`);
                router.visit(ROUTE.taxonomies.index());
              },
              onError: (errors) => {
                console.error('Failed to save taxonomy', errors);
                showError(`Failed to ${isEditingTaxonomy ? 'update' : 'create'} taxonomy`);
              },
            });
          } catch (error) {
            console.error('Error submitting taxonomy form:', error);
            showError(`Failed to ${isEditingTaxonomy ? 'update' : 'create'} taxonomy`);
          }
        }}
        onCancel={() => router.visit(ROUTE.taxonomies.index())}
      />
    </SectionWrapper>
  );

  // --- Themes helpers ---
  const renderThemesMain = () => {
    const installedThemesArr = asArray(themes as any);
    const installedSlugs = new Set(installedThemesArr.map((it: any) => it.slug));
    return (
      <SectionWrapper
        title="Themes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
              Back to Dashboard
            </Button>
            {can('install themes') && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await router.post(ROUTE.themes.discover(), {}, {
                      preserveScroll: true,
                      onSuccess: () => {
                        showSuccess('Discovered and installed themes');
                        router.reload({ only: ['themes', 'discoveredThemes', 'activeTheme'] });
                      },
                      onError: () => showError('Failed to discover/install themes'),
                    });
                  } catch (e) {
                    console.error(e);
                    showError('Error discovering themes');
                  }
                }}
              >
                Discover & Install All
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-8">
          <ActiveThemeCard
            activeTheme={activeTheme as any}
            canPublishAssets={can('publish theme assets')}
            canCustomize={can('customize themes')}
            onPublishAssets={async (themeId) => {
              try {
                await router.post(ROUTE.themes.publishAssets(themeId), {}, {
                  preserveScroll: true,
                  onSuccess: () => showSuccess('Assets published'),
                  onError: () => showError('Failed to publish assets'),
                });
              } catch (e) {
                console.error(e);
                showError('Error publishing assets');
              }
            }}
            onCustomize={(themeId) => router.visit(ROUTE.themes.customizer(themeId))}
            onView={(themeId) => router.visit(ROUTE.themes.show(themeId))}
          />

          <InstalledThemesGrid
            items={installedThemesArr as any}
            activeSlug={(activeTheme as any)?.slug}
            canActivate={can('activate themes')}
            canPublishAssets={can('publish theme assets')}
            canCustomize={can('customize themes')}
            canDelete={can('delete themes')}
            onView={(id) => router.visit(ROUTE.themes.show(id))}
            onActivate={async (slug) => {
              try {
                await router.post(ROUTE.themes.activate(slug), {}, {
                  preserveScroll: true,
                  onSuccess: () => {
                    showSuccess('Theme activated');
                    router.reload({ only: ['themes', 'activeTheme'] });
                  },
                  onError: () => showError('Failed to activate theme'),
                });
              } catch (e) {
                console.error(e);
                showError('Error activating theme');
              }
            }}
            onPublishAssets={async (id) => {
              try {
                await router.post(ROUTE.themes.publishAssets(id), {}, {
                  preserveScroll: true,
                  onSuccess: () => showSuccess('Assets published'),
                  onError: () => showError('Failed to publish assets'),
                });
              } catch (e) {
                console.error(e);
                showError('Error publishing theme assets');
              }
            }}
            onCustomize={(id) => router.visit(ROUTE.themes.customizer(id))}
            onUninstall={async (id, displayName) => {
              if (!confirm(`Uninstall theme "${displayName}"? This will remove it from the database.`)) return;
              try {
                await router.delete(ROUTE.themes.destroy(id), {
                  preserveScroll: true,
                  onSuccess: () => {
                    showSuccess('Theme uninstalled');
                    router.reload({ only: ['themes', 'discoveredThemes'] });
                  },
                  onError: () => showError('Failed to uninstall theme'),
                });
              } catch (e) {
                console.error(e);
                showError('Error uninstalling theme');
              }
            }}
          />

          <DiscoveredThemesList
            items={asArray(discoveredThemes as any)
              .filter((t: any) => !installedSlugs.has(t?.config?.slug || t?.slug))
              .map((t: any) => ({
                slug: t?.slug ?? t?.config?.slug,
                name: t?.name ?? t?.config?.name,
                config: t?.config,
              }))}
          />
        </div>
      </SectionWrapper>
    );
  };

  const renderThemeDetails = () => (
    <SectionWrapper
      title="Theme Details"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.themes.index())}>
          Back to Themes
        </Button>
      }
    >
      <ThemeDetails
        theme={theme as any}
        canActivate={can('activate themes')}
        canPublishAssets={can('publish theme assets')}
        canCustomize={can('customize themes')}
        onActivate={async (slug) => {
          try {
            await router.post(ROUTE.themes.activate(slug));
            showSuccess('Theme activated');
            router.visit(ROUTE.themes.index());
          } catch (e) {
            console.error(e);
            showError('Failed to activate theme');
          }
        }}
        onPublishAssets={async (id) => {
          try {
            await router.post(ROUTE.themes.publishAssets(id));
            showSuccess('Assets published');
          } catch (e) {
            console.error(e);
            showError('Failed to publish assets');
          }
        }}
        onCustomize={(id) => router.visit(ROUTE.themes.customizer(id))}
        onUninstall={async (id, displayName) => {
          if (!confirm(`Uninstall theme "${displayName}"?`)) return;
          try {
            await router.delete(ROUTE.themes.destroy(id), { preserveScroll: true });
            showSuccess('Theme uninstalled');
            router.visit(ROUTE.themes.index());
          } catch (error) {
            console.error(error);
            showError('Failed to uninstall theme');
          }
        }}
      />
    </SectionWrapper>
  );

  const renderThemeCustomizer = () => (
    <SectionWrapper
      title="Theme Customizer"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.themes.index())}>
          Back to Themes
        </Button>
      }
    >
      <ThemeCustomizerForm
        theme={theme as any}
        settings={(customizerSettings as any) || {}}
        availableMenus={(availableMenus as any) || {}}
        widgetAreas={(widgetAreas as any) || {}}
        initial={(typeof (theme as any)?.customizer === 'object' && (theme as any)?.customizer) ? (theme as any).customizer : {}}
        onSave={async (data) => {
          try {
            await router.put(ROUTE.themes.update((theme as any)?.id), { customizer: data }, {
              preserveScroll: true,
              onSuccess: () => showSuccess('Customizer saved'),
              onError: () => showError('Failed to save customizer'),
            });
          } catch (err) {
            console.error(err);
            showError('Error saving customizer');
          }
        }}
      />
    </SectionWrapper>
  );

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
      return (
        <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-3">
          {/* Welcome Header */}
          <Card className="border border-border/60 shadow-none rounded-md">
            <CardHeader className="pb-2.5">
              <CardTitle className="text-base font-semibold text-foreground/90">Welcome back, {auth?.user?.name || 'Admin'}!</CardTitle>
              <CardDescription className="text-sm text-muted-foreground/90">Here's what's happening with your CMS today.</CardDescription>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          {adminStats && (
            <DashboardStats 
              users={adminStats.users} 
              roles={adminStats.roles} 
              posts={adminStats.posts} 
              pages={adminStats.pages}
              postTypes={adminStats.postTypes}
              taxonomies={adminStats.taxonomies}
              themes={adminStats.themes}
              media={adminStats.media}
            />
          )}

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
            {/* Quick Actions - Left Column */}
            <div className="lg:col-span-1">
              <Card className="border border-border/60 shadow-none rounded-md">
                <CardHeader className="pb-2.5">
                  <CardTitle className="text-sm font-semibold text-foreground/90">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <Button 
                    className="h-8 w-full justify-start px-2 text-xs font-medium" 
                    size="sm"
                    variant="secondary"
                    onClick={() => router.visit(ROUTE.posts.create())}
                  >
                    <span className="mr-1.5">📝</span> Create New Post
                  </Button>
                  <Button 
                    className="h-8 w-full justify-start px-2 text-xs font-medium" 
                    size="sm"
                    variant="secondary"
                    onClick={() => router.visit(ROUTE.pages.create())}
                  >
                    <span className="mr-1.5">📄</span> Create New Page
                  </Button>
                  <Button 
                    className="h-8 w-full justify-start px-2 text-xs font-medium" 
                    size="sm"
                    variant="secondary"
                    onClick={() => router.visit(ROUTE.users.create())}
                  >
                    <span className="mr-1.5">👤</span> Add New User
                  </Button>
                  <Button 
                    className="h-8 w-full justify-start px-2 text-xs font-medium" 
                    size="sm"
                    variant="secondary"
                    onClick={() => router.visit(ROUTE.themes.index())}
                  >
                    <span className="mr-1.5">🎨</span> Manage Themes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Server Stats - Right 3 Columns */}
            <div className="lg:col-span-3">
              <Card className="h-full border border-border/60 shadow-none rounded-md">
                <CardContent className="space-y-2">
                  {systemStatus ? (
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(systemStatus).map(([key, status]) => {
                        const colors = getStatusColors(status.color);
                        const Icon = statusIcons[key] ?? RefreshCcw;
                        return (
                          <div
                            key={key}
                            className={cn(
                              'group relative overflow-hidden rounded-sm border bg-card/70 p-1.5 transition-colors',
                              'hover:border-foreground/10',
                              colors.border
                            )}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className={cn('flex size-5 items-center justify-center rounded-full text-[10px] transition-colors', colors.iconBg)}>
                                  <Icon className="size-2.5" />
                                </div>
                                <div className="space-y-1">
                                  <h3 className="text-[10px] font-semibold leading-none text-foreground">
                                    {status.label}
                                  </h3>
                                </div>
                              </div>
                              <div
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                                  colors.badge
                                )}
                              >
                                <span className={cn('h-2 w-2 rounded-full', colors.indicator, status.indicator === 'pulse' ? 'animate-pulse' : '')} />
                                {status.status}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <div className={cn('text-sm font-semibold leading-tight', colors.text)}>
                                {status.value}
                              </div>
                              <div className="text-[8.5px] text-muted-foreground">
                                {formatLastChecked(status.last_checked_at)}
                              </div>
                            </div>
                            {status.meta && Object.keys(status.meta).length > 0 && (
                              <dl className="mt-1 grid gap-0.5 text-[8.5px] text-muted-foreground">
                                {Object.entries(status.meta).map(([metaKey, metaValue]) => (
                                  <div key={`${key}-${metaKey}`} className="flex items-center justify-between gap-2">
                                    <dt className="font-medium text-foreground/70">
                                      {metaKey}
                                    </dt>
                                    <dd className="truncate text-right text-foreground/80">
                                      {metaValue ?? '—'}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted p-6 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <RefreshCcw className="size-5 animate-spin text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Fetching live metrics</p>
                        <p className="text-xs text-muted-foreground">Gathering the latest server health data…</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      );
    }

    const sectionsMap = {
      // Pages
      'pages': renderPagesList,
      'pages.create': renderPageCreate,
      'pages.edit': renderPageEdit,
      // Post Types
      'post-types': renderPostTypesList,
      'post-types.create': renderPostTypeCreate,
      'post-types.edit': renderPostTypeEdit,
      // Taxonomies
      'taxonomies': renderTaxonomiesList,
      'taxonomies.create': renderTaxonomyForm,
      'taxonomies.edit': renderTaxonomyForm,
      // Themes
      'themes': renderThemesMain,
      'themes.show': renderThemeDetails,
      'themes.customizer': renderThemeCustomizer,
      // Posts
      'posts': renderPostsList,
      'posts.create': renderPostCreate,
      'posts.edit': renderPostEdit,
      'posts.show': renderPostShow,
      // Users
      'users': renderUsersList,
      'users.create': renderUserCreate,
      'users.edit': renderUserEdit,
      // Roles
      'roles': renderRolesList,
      'roles.create': renderRoleCreateEdit,
      'roles.edit': renderRoleCreateEdit,
      // Sitemap
      'sitemap': renderSitemap,
      // Media
      'media': renderMedia,
    };

    return sectionsMap[section]?.() ?? <div>Section not found</div>;
  };

  const renderSitemap = () => (
    <SectionWrapper
      title="Sitemap"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
    >
      <SitemapSettingsForm
        postTypes={(postTypes as any) || []}
        settings={(sitemapSettings as any) || { include_taxonomies: true, enable_cache: true, cache_ttl: 3600 }}
        canEdit={can('edit settings')}
      />
    </SectionWrapper>
  );

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
