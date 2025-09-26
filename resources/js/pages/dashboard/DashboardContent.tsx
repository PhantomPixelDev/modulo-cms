import { useState, type ReactNode } from 'react';
import { router } from '@inertiajs/react';
// Ziggy exposes a global `route()` when @routes is included; declare it for TS
declare const route: (name: string, params?: any) => string;
import { Button } from '@/components/ui/button';
import { SectionWrapper } from './components/common/SectionWrapper';
import { toast } from 'sonner';
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
import { DashboardStats } from './components/dashboard/DashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActiveThemeCard } from './components/themes/ActiveThemeCard';
import { InstalledThemesGrid } from './components/themes/InstalledThemesGrid';
import { DiscoveredThemesList } from './components/themes/DiscoveredThemesList';
import { ThemeDetails } from './components/themes/ThemeDetails';
import { ThemeCustomizerForm } from './components/themes/ThemeCustomizerForm';
import { SitemapSettingsForm } from './components/sitemap/SitemapSettingsForm';
import { DashboardProps, asArray, type User as DashboardUser, type Permission } from './types';
import { SectionHeader } from '@/components/ui/section-header';
import { ROUTE } from './routes';
import { MediaLibrary } from './components/media/MediaLibrary';
import { useAcl } from '@/lib/acl';

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
  auth,
  recentActivity,
  systemStatus,
}: DashboardProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
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
  const roles = asArray(rolesProp);
  const posts = asArray(postsProp);
  
  // Centralized UI ACL: prefer auth-shared roles/permissions via useAcl
  const { hasPermission, isAdmin: isAdminRole } = useAcl();
  const can = (perm: string) => isAdminRole() || hasPermission(perm);

  // Media permissions (computed via can())
  const canEditMedia = can('edit media');
  const canDeleteMedia = can('delete media');

  // Admins or users with relevant permissions can edit post author
  const canEditAuthorFlag = can('assign posts author') || can('edit posts');
  // Handle page form submission
  const handlePageSubmit = async (formData: any, editId?: number) => {
    const url = editId ? ROUTE.pages.update(editId) : ROUTE.pages.store();
    const method = editId ? 'put' : 'post';
    try {
      // Use Inertia callbacks for better UX and to ensure navigation happens
      router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Page ${editId ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.pages.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          toast.error(`Failed to ${editId ? 'update' : 'create'} page`);
        },
      });
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(`Failed to ${editId ? 'update' : 'create'} page`);
    }
  };

  // Handle delete page
  const handleDeletePage = async (page: any) => {
    const name = page?.title || 'this page';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await router.delete(ROUTE.pages.destroy(page.id), {
        onSuccess: () => {
          toast.success('Page deleted');
          router.visit(ROUTE.pages.index());
        },
        onError: () => toast.error('Failed to delete page'),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('An error occurred while deleting the page');
    }
  };

  // Handle delete post type
  const handleDeletePostType = async (pt: any) => {
    const name = pt?.label || pt?.name || 'this post type';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await router.delete(ROUTE.postTypes.destroy(pt.id), {
        onSuccess: () => {
          toast.success('Post type deleted');
          router.visit(ROUTE.postTypes.index());
        },
        onError: () => toast.error('Failed to delete post type'),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting post type:', error);
      toast.error('An error occurred while deleting the post type');
    }
  };

  // Handle post type form submission
  const handlePostTypeSubmit = async (formData: any) => {
    try {
      const url = (editPostType as any)
        ? ROUTE.postTypes.update((editPostType as any).id)
        : ROUTE.postTypes.store();
      const method = (editPostType as any) ? 'put' : 'post';
      await router[method](url, formData);
      toast.success(`Post type ${(editPostType as any) ? 'updated' : 'created'} successfully`);
      router.visit(ROUTE.postTypes.index());
    } catch (error) {
      console.error('Error saving post type:', error);
      toast.error(`Failed to ${(editPostType as any) ? 'update' : 'create'} post type`);
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
          router.visit(ROUTE.posts.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
        },
      });
    } catch (error) {
      console.error('Error saving post:', error);
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
          router.visit(ROUTE.users.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
        },
      });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // Handle role form submission
  const handleRoleSubmit = (data: any) => {
    const url = editRole 
      ? ROUTE.roles.update(editRole.id)
      : ROUTE.roles.store();
    
    const method = editRole ? 'put' : 'post';
    
    router[method](url, data, {
      onSuccess: () => {
        setShowRoleForm(false);
      },
    });
  };

  // --- Posts: extract render helpers to simplify switch ---
  const renderPostsList = () => (
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
        posts={(postsProp as any) || (posts as any) || []}
        canCreate={false}
        canEdit={can('edit posts')}
      />
    </SectionWrapper>
  );

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
                toast.success(`Role ${action === 'assign' ? 'assigned' : 'removed'} successfully`);
                router.reload({ only: ['users'] });
              },
              onError: () => toast.error(`Failed to ${action} role`)
            });
          } catch (error) {
            console.error('Error updating user role:', error);
            toast.error('An error occurred while updating the role');
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
        <Button size="sm" onClick={() => setShowRoleForm(true)}>
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
        pages={asArray((postsProp as any)?.data || posts)
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
      <p>Taxonomy form UI is not implemented yet.</p>
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
                        toast.success('Discovered and installed themes');
                        router.reload({ only: ['themes', 'discoveredThemes', 'activeTheme'] });
                      },
                      onError: () => toast.error('Failed to discover/install themes'),
                    });
                  } catch (e) {
                    console.error(e);
                    toast.error('Error discovering themes');
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
                  onSuccess: () => toast.success('Assets published'),
                  onError: () => toast.error('Failed to publish assets'),
                });
              } catch (e) {
                console.error(e);
                toast.error('Error publishing assets');
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
                    toast.success('Theme activated');
                    router.reload({ only: ['themes', 'activeTheme'] });
                  },
                  onError: () => toast.error('Failed to activate theme'),
                });
              } catch (e) {
                console.error(e);
                toast.error('Error activating theme');
              }
            }}
            onPublishAssets={async (id) => {
              try {
                await router.post(ROUTE.themes.publishAssets(id), {}, {
                  preserveScroll: true,
                  onSuccess: () => toast.success('Assets published'),
                  onError: () => toast.error('Failed to publish assets'),
                });
              } catch (e) {
                console.error(e);
                toast.error('Error publishing theme assets');
              }
            }}
            onCustomize={(id) => router.visit(ROUTE.themes.customizer(id))}
            onUninstall={async (id, displayName) => {
              if (!confirm(`Uninstall theme "${displayName}"? This will remove it from the database.`)) return;
              try {
                await router.delete(ROUTE.themes.destroy(id), {
                  preserveScroll: true,
                  onSuccess: () => {
                    toast.success('Theme uninstalled');
                    router.reload({ only: ['themes', 'discoveredThemes'] });
                  },
                  onError: () => toast.error('Failed to uninstall theme'),
                });
              } catch (e) {
                console.error(e);
                toast.error('Error uninstalling theme');
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
            toast.success('Theme activated');
            router.visit(ROUTE.themes.index());
          } catch (e) {
            console.error(e);
            toast.error('Failed to activate theme');
          }
        }}
        onPublishAssets={async (id) => {
          try {
            await router.post(ROUTE.themes.publishAssets(id));
            toast.success('Assets published');
          } catch (e) {
            console.error(e);
            toast.error('Failed to publish assets');
          }
        }}
        onCustomize={(id) => router.visit(ROUTE.themes.customizer(id))}
        onUninstall={async (id, displayName) => {
          if (!confirm(`Uninstall theme "${displayName}"?`)) return;
          try {
            await router.delete(ROUTE.themes.destroy(id), { preserveScroll: true });
            toast.success('Theme uninstalled');
            router.visit(ROUTE.themes.index());
          } catch (e) {
            console.error(e);
            toast.error('Failed to uninstall theme');
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
              onSuccess: () => toast.success('Customizer saved'),
              onError: () => toast.error('Failed to save customizer'),
            });
          } catch (err) {
            console.error(err);
            toast.error('Error saving customizer');
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
        <div className="px-4 py-6 space-y-6">
          {/* Welcome Header */}
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-xl">Welcome back, {auth?.user?.name || 'Admin'}!</CardTitle>
              <CardDescription>Here's what's happening with your CMS today.</CardDescription>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          {adminStats && (
            <DashboardStats users={adminStats.users} roles={adminStats.roles} posts={adminStats.posts} media={adminStats.media} />
          )}

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.visit(ROUTE.posts.create())}
                  >
                    <span className="mr-2">📝</span> Create New Post
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.visit(ROUTE.pages.create())}
                  >
                    <span className="mr-2">📄</span> Create New Page
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.visit(ROUTE.users.create())}
                  >
                    <span className="mr-2">👤</span> Add New User
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.visit(ROUTE.themes.index())}
                  >
                    <span className="mr-2">🎨</span> Manage Themes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-sm">{activity.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description} - {activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatus && Object.entries(systemStatus).map(([key, status]) => {
              const getColorClasses = (color: string) => {
                switch (color) {
                  case 'green': return { text: 'text-green-600', bg: 'bg-green-500' };
                  case 'red': return { text: 'text-red-600', bg: 'bg-red-500' };
                  case 'yellow': return { text: 'text-yellow-600', bg: 'bg-yellow-500' };
                  case 'blue': return { text: 'text-primary', bg: 'bg-primary' };
                  default: return { text: 'text-gray-600', bg: 'bg-gray-500' };
                }
              };
              const colors = getColorClasses(status.color);
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{status.label}</p>
                      <p className={`text-lg font-semibold ${colors.text}`}>{status.value}</p>
                    </div>
                    <div className={`w-3 h-3 ${colors.bg} rounded-full ${status.indicator === 'pulse' ? 'animate-pulse' : ''}`}></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    const sectionsMap: Record<string, () => ReactNode> = {
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

  return (
    <>
      {renderSection()}
    </>
  );
}
