import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
// Ziggy exposes a global `route()` when @routes is included; declare it for TS
declare const route: (name: string, params?: any) => string;
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionWrapper } from './components/common/SectionWrapper';
import { toast } from 'sonner';
import { UserList, UserForm } from './components/users';
import { RoleList, RoleForm } from './components/roles';
import { PostList } from './components/posts/PostList';
import { PostForm } from './components/posts/PostForm';
import { PostTypeForm } from './components/post-types/PostTypeForm';
import { PostView } from './components/posts/PostView';
import { PageForm } from './components/pages/PageForm';
import { DashboardProps, asArray, type User as DashboardUser, type Permission } from './types';

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
  groupedTerms,
  editUser,
  editRole,
  editPostType,
  auth,
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
  
  // Ensure permissions have the required fields
  const permissionsWithTimestamps: Permission[] = (permissions || []).map(p => {
    const permission = p as Permission;
    return {
      id: permission.id || 0,
      name: permission.name || '',
      description: 'description' in permission ? (permission as any).description : '',
      created_at: 'created_at' in permission ? (permission as any).created_at : new Date().toISOString(),
      updated_at: 'updated_at' in permission ? (permission as any).updated_at : new Date().toISOString(),
    };
  });
  // Handle page form submission
  const handlePageSubmit = async (formData: any, editId?: number) => {
    const url = editId
      ? route('dashboard.admin.pages.update', editId)
      : route('dashboard.admin.pages.store');
    const method = editId ? 'put' : 'post';
    try {
      // Use Inertia callbacks for better UX and to ensure navigation happens
      router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Page ${editId ? 'updated' : 'created'} successfully`);
          router.visit(route('dashboard.admin.pages.index'));
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
      await router.delete(route('dashboard.admin.pages.destroy', page.id), {
        onSuccess: () => {
          toast.success('Page deleted');
          router.visit(route('dashboard.admin.pages.index'));
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
      await router.delete(route('dashboard.admin.post-types.destroy', pt.id), {
        onSuccess: () => {
          toast.success('Post type deleted');
          router.visit(route('dashboard.admin.post-types.index'));
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
        ? route('dashboard.admin.post-types.update', (editPostType as any).id)
        : route('dashboard.admin.post-types.store');
      const method = (editPostType as any) ? 'put' : 'post';
      await router[method](url, formData);
      toast.success(`Post type ${(editPostType as any) ? 'updated' : 'created'} successfully`);
      router.visit(route('dashboard.admin.post-types.index'));
    } catch (error) {
      console.error('Error saving post type:', error);
      toast.error(`Failed to ${(editPostType as any) ? 'update' : 'create'} post type`);
    }
  };

  // Handle post form submission
  const handlePostSubmit = async (formData: any, editId?: number) => {
    try {
      const url = editId
        ? route('dashboard.admin.posts.update', { post: editId })
        : route('dashboard.admin.posts.store');
      const method = editId ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route('dashboard.admin.posts.index'));
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
        },
      });
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  // Helper: check capability from permissions array; fallback to auth.user?.can.
  // If no permissions are provided at all, default to true so dev environments still show actions.
  const can = (perm: string) => {
    // Admin/super-admin override
    const isAdmin = Array.isArray(auth?.user?.roles) && auth.user.roles.some((r: any) => ['admin', 'super-admin'].includes(r.name));
    if (isAdmin) return true;
    // If no permissions provided at all, default allow in dev
    if (permissionsWithTimestamps.length === 0) return true;
    // Check provided permissions or fallback to auth.user.can
    return permissionsWithTimestamps.some(p => p.name === perm) || Boolean(auth?.user?.can?.(perm));
  };

  // Handle user form submission
  const handleUserSubmit = async (formData: any) => {
    try {
      const url = editUser 
        ? route('dashboard.admin.users.update', editUser.id)
        : route('dashboard.admin.users.store');
      
      const method = editUser ? 'put' : 'post';
      
      // Use Inertia callbacks to ensure XHR completes before redirect
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          router.visit(route('dashboard.admin.users.index'));
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
      ? route('dashboard.admin.roles.update', editRole.id)
      : route('dashboard.admin.roles.store');
    
    const method = editRole ? 'put' : 'post';
    
    router[method](url, data, {
      onSuccess: () => {
        setShowRoleForm(false);
      },
    });
  };

  // Render the appropriate section based on adminSection
  const renderSection = () => {
    if (!adminSection) {
      return (
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Panel</h2>
          </div>

          {adminStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle>Users</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-semibold">{adminStats.users}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-semibold">{adminStats.roles}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Posts</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-semibold">{adminStats.posts}</div></CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }

    switch (adminSection) {
      case 'pages':
        return (
          <SectionWrapper
            title="Pages"
            actions={
              can('create posts') ? (
                <Button size="sm" onClick={() => router.visit(route('dashboard.admin.pages.create'))}>
                  + New Page
                </Button>
              ) : null
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Author</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {asArray((postsProp as any)?.data || posts).filter((p: any) => (p.post_type?.name ? p.post_type.name === 'page' : true)).map((pg: any) => (
                    <tr key={pg.id} className="border-b last:border-b-0 hover:bg-accent dark:hover:bg-gray-800">
                      <td className="py-2 pr-4">{pg.title}</td>
                      <td className="py-2 pr-4">{pg.status}</td>
                      <td className="py-2 pr-4">{pg.author?.name || '—'}</td>
                      <td className="py-2 pr-4">{new Date(pg.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          {can('edit posts') && (
                            <Button size="sm" onClick={() => router.visit(route('dashboard.admin.pages.edit', pg.id))}>
                              Edit
                            </Button>
                          )}
                          {can('delete posts') && (
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePage(pg)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionWrapper>
        );

      case 'pages.create':
        return (
          <SectionWrapper
            title={'Create Page'}
            actions={
              <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.pages.index'))}>
                Back to Pages
              </Button>
            }
          >
            <PageForm
              isEditing={false}
              onSubmit={(data) => handlePageSubmit(data)}
              onCancel={() => router.visit(route('dashboard.admin.pages.index'))}
            />
          </SectionWrapper>
        );

      case 'pages.edit':
        return (
          <SectionWrapper
            title={'Edit Page'}
            actions={
              <div className="flex gap-2">
                {can('delete posts') && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePage((post as any) || (editPost as any))}>
                    Delete
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.pages.index'))}>
                  Back to Pages
                </Button>
              </div>
            }
          >
            <PageForm
              page={(post as any) || (editPost as any)}
              isEditing={true}
              onSubmit={(data) => handlePageSubmit(data, ((post as any) || (editPost as any))?.id)}
              onCancel={() => router.visit(route('dashboard.admin.pages.index'))}
            />
          </SectionWrapper>
        );
      case 'post-types':
        return (
          <SectionWrapper
            title="Post Types"
            actions={
              can('create post types') ? (
                <Button size="sm" onClick={() => router.visit(route('dashboard.admin.post-types.create'))}>
                  + New Post Type
                </Button>
              ) : null
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Label</th>
                    <th className="py-2 pr-4">Route Prefix</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {asArray(postTypes).map((pt: any) => (
                    <tr key={pt.id} className="border-b last:border-b-0 hover:bg-accent dark:hover:bg-gray-800">
                      <td className="py-2 pr-4">{pt.name}</td>
                      <td className="py-2 pr-4">{pt.label}</td>
                      <td className="py-2 pr-4">{pt.route_prefix || '-'}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          {can('view post types') && (
                            <Button variant="secondary" size="sm" onClick={() => router.visit(route('dashboard.admin.post-types.show', pt.id))}>
                              View
                            </Button>
                          )}
                          {can('edit post types') && (
                            <Button size="sm" onClick={() => router.visit(route('dashboard.admin.post-types.edit', pt.id))}>
                              Edit
                            </Button>
                          )}
                          {can('delete post types') && (
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePostType(pt)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionWrapper>
        );

      case 'post-types.create':
        return (
          <SectionWrapper
            title={'Create Post Type'}
            actions={
              <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.post-types.index'))}>
                Back to Post Types
              </Button>
            }
          >
            <PostTypeForm
              isEditing={false}
              onSubmit={handlePostTypeSubmit}
              onCancel={() => router.visit(route('dashboard.admin.post-types.index'))}
            />
          </SectionWrapper>
        );

      case 'post-types.edit':
        return (
          <SectionWrapper
            title={'Edit Post Type'}
            actions={
              <div className="flex gap-2">
                {can('delete post types') && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePostType(editPostType)}>
                    Delete
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.post-types.index'))}>
                  Back to Post Types
                </Button>
              </div>
            }
          >
            <PostTypeForm
              postType={editPostType as any}
              isEditing={true}
              onSubmit={handlePostTypeSubmit}
              onCancel={() => router.visit(route('dashboard.admin.post-types.index'))}
            />
          </SectionWrapper>
        );

      case 'taxonomies':
        return (
          <SectionWrapper
            title="Taxonomies"
            actions={
              can('create taxonomies') ? (
                <Button size="sm" onClick={() => router.visit(route('dashboard.admin.taxonomies.create'))}>
                  + New Taxonomy
                </Button>
              ) : null
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Label</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray((taxonomies as any)?.data) ? (taxonomies as any).data : asArray(taxonomies)).map((tx: any) => (
                    <tr key={tx.id} className="border-b last:border-b-0 hover:bg-accent dark:hover:bg-gray-800">
                      <td className="py-2 pr-4">{tx.name}</td>
                      <td className="py-2 pr-4">{tx.label}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          {can('view taxonomies') && (
                            <Button variant="secondary" size="sm" onClick={() => router.visit(route('dashboard.admin.taxonomies.show', tx.id))}>
                              View
                            </Button>
                          )}
                          {can('edit taxonomies') && (
                            <Button size="sm" onClick={() => router.visit(route('dashboard.admin.taxonomies.edit', tx.id))}>
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionWrapper>
        );

      case 'taxonomies.create':
      case 'taxonomies.edit':
        return (
          <SectionWrapper
            title={adminSection === 'taxonomies.create' ? 'Create Taxonomy' : 'Edit Taxonomy'}
            actions={
              <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.taxonomies.index'))}>
                Back to Taxonomies
              </Button>
            }
          >
            <p>Taxonomy form UI is not implemented yet.</p>
          </SectionWrapper>
        );

      case 'themes': {
        const installedThemesArr = asArray(themes as any);
        const installedSlugs = new Set(installedThemesArr.map((it: any) => it.slug));
        return (
          <SectionWrapper
            title="Themes"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.index'))}>
                  Back to Dashboard
                </Button>
                {can('install themes') && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await router.post(route('dashboard.admin.themes.discover'), {}, {
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
              {/* Active Theme */}
              <div>
                <h3 className="font-semibold mb-3">Active Theme</h3>
                <div className="border rounded-md p-4">
                  {(activeTheme as any) ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        {(() => {
                          const cfg = (activeTheme as any)?.config || {};
                          const previewPath = cfg.preview || cfg.screenshot;
                          return previewPath ? (
                            <img
                              src={`/themes/${(activeTheme as any).slug}/${previewPath}`}
                              alt={(activeTheme as any).name || (activeTheme as any).slug}
                              className="w-20 h-14 object-cover rounded border"
                            />
                          ) : null;
                        })()}
                        <div>
                          <div className="font-medium">{(activeTheme as any).name || (activeTheme as any).slug}</div>
                          <div className="text-xs text-muted-foreground">Slug: {(activeTheme as any).slug}</div>
                          {((activeTheme as any)?.config?.version || (activeTheme as any)?.config?.author) && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {(activeTheme as any)?.config?.version && <span>Version: {(activeTheme as any).config.version}</span>}
                              {((activeTheme as any)?.config?.version && (activeTheme as any)?.config?.author) && <span> · </span>}
                              {(activeTheme as any)?.config?.author && (
                                (activeTheme as any)?.config?.author_url ? (
                                  <a className="underline" href={(activeTheme as any).config.author_url} target="_blank" rel="noreferrer">
                                    {(activeTheme as any).config.author}
                                  </a>
                                ) : (
                                  <span>{(activeTheme as any).config.author}</span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {can('publish theme assets') && (
                          <Button size="sm" variant="secondary" onClick={async () => {
                            try {
                              await router.post(route('dashboard.admin.themes.publish-assets', (activeTheme as any).id), {}, {
                                preserveScroll: true,
                                onSuccess: () => toast.success('Assets published'),
                                onError: () => toast.error('Failed to publish assets'),
                              });
                            } catch (e) {
                              console.error(e);
                              toast.error('Error publishing assets');
                            }
                          }}>Publish Assets</Button>
                        )}
                        {can('customize themes') && (
                          <Button size="sm" onClick={() => router.visit(route('dashboard.admin.themes.customizer', (activeTheme as any).id))}>Customize</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => router.visit(route('dashboard.admin.themes.show', (activeTheme as any).id))}>View</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No active theme</div>
                  )}
                </div>
              </div>

              {/* Installed Themes */}
              <div>
                <h3 className="font-semibold mb-3">Installed Themes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {installedThemesArr.map((t: any) => {
                    const isActive = (activeTheme as any)?.slug === t.slug || t.is_active;
                    return (
                      <div key={t.id} className={`border rounded-md p-4 ${isActive ? 'ring-1 ring-accent' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            {(() => {
                              const cfg = t?.config || {};
                              const previewPath = cfg.preview || cfg.screenshot;
                              return previewPath ? (
                                <img
                                  src={`/themes/${t.slug}/${previewPath}`}
                                  alt={t.name || t.slug}
                                  className="w-20 h-14 object-cover rounded border"
                                />
                              ) : null;
                            })()}
                            <div>
                              <div className="font-medium">{t.name || t.slug}</div>
                              <div className="text-xs text-muted-foreground">Slug: {t.slug}</div>
                              {(t?.config?.version || t?.config?.author) && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {t?.config?.version && <span>Version: {t.config.version}</span>}
                                  {(t?.config?.version && t?.config?.author) && <span> · </span>}
                                  {t?.config?.author && (
                                    t?.config?.author_url ? (
                                      <a className="underline" href={t.config.author_url} target="_blank" rel="noreferrer">{t.config.author}</a>
                                    ) : (
                                      <span>{t.config.author}</span>
                                    )
                                  )}
                                </div>
                              )}
                              {isActive && <div className="mt-1 text-xs inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</div>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.themes.show', t.id))}>View</Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!isActive && can('activate themes') && (
                            <Button size="sm" onClick={async () => {
                              try {
                                await router.post(route('dashboard.admin.themes.activate', t.slug), {}, {
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
                            }}>Activate</Button>
                          )}
                          {can('publish theme assets') && (
                            <Button size="sm" variant="secondary" onClick={async () => {
                              try {
                                await router.post(route('dashboard.admin.themes.publish-assets', t.id), {}, {
                                  preserveScroll: true,
                                  onSuccess: () => toast.success('Assets published'),
                                  onError: () => toast.error('Failed to publish assets'),
                                });
                              } catch (e) {
                                console.error(e);
                                toast.error('Error publishing assets');
                              }
                            }}>Publish Assets</Button>
                          )}
                          {isActive && can('customize themes') && (
                            <Button size="sm" onClick={() => router.visit(route('dashboard.admin.themes.customizer', t.id))}>Customize</Button>
                          )}
                          {!isActive && can('delete themes') && (
                            <Button size="sm" variant="destructive" onClick={async () => {
                              if (!confirm(`Uninstall theme "${t.name || t.slug}"? This will remove it from the database.`)) return;
                              try {
                                await router.delete(route('dashboard.admin.themes.destroy', t.id), {
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
                            }}>Uninstall</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discovered Themes */}
              <div>
                <h3 className="font-semibold mb-3">Discovered Themes</h3>
                {asArray(discoveredThemes as any).filter((t: any) => !installedSlugs.has(t?.config?.slug || t?.slug)).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No uninstalled themes discovered.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {asArray(discoveredThemes as any).filter((t: any) => !installedSlugs.has(t?.config?.slug || t?.slug)).map((t: any) => (
                      <div key={t.config?.slug || t.slug} className="border rounded-md p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.name || t.config?.name || t.slug}</div>
                          <div className="text-xs text-muted-foreground">Slug: {t.config?.slug || t.slug}</div>
                          {(t?.config?.version || t?.config?.author) && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {t?.config?.version && <span>Version: {t.config.version}</span>}
                              {(t?.config?.version && t?.config?.author) && <span> · </span>}
                              {t?.config?.author && (
                                t?.config?.author_url ? (
                                  <a className="underline" href={t.config.author_url} target="_blank" rel="noreferrer">{t.config.author}</a>
                                ) : (
                                  <span>{t.config.author}</span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                        {can('install themes') && (
                          <Button size="sm" onClick={async () => {
                            try {
                              await router.post(route('dashboard.admin.themes.install'), { slug: t.config?.slug || t.slug }, {
                                preserveScroll: true,
                                onSuccess: () => {
                                  toast.success('Theme installed');
                                  router.reload({ only: ['themes', 'discoveredThemes'] });
                                },
                                onError: () => toast.error('Failed to install theme'),
                              });
                            } catch (e) {
                              console.error(e);
                              toast.error('Error installing theme');
                            }
                          }}>Install</Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionWrapper>
        );
      }
      case 'themes.show':
        return (
          <SectionWrapper
            title="Theme Details"
            actions={
              <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.themes.index'))}>
                Back to Themes
              </Button>
            }
          >
            {(() => {
              const t = (theme as any) || {};
              const cfg = (t.config || (theme as any)?.config || (theme as any)?.themeConfig) || ({} as any);
              const isActive = Boolean(t.is_active);
              const previewPath = cfg.preview || cfg.screenshot || t.screenshot;
              return (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    {previewPath ? (
                      <img
                        src={`/themes/${t.slug}/${previewPath}`}
                        alt={t.name || t.slug}
                        className="w-40 h-28 object-cover rounded border"
                      />
                    ) : null}
                    <div className="space-y-1 text-sm">
                      <div className="text-lg font-semibold">{t.name || t.slug}</div>
                      <div className="text-muted-foreground">Slug: {t.slug}</div>
                      {cfg?.version && (
                        <div className="text-muted-foreground">Version: {cfg.version}</div>
                      )}
                      {cfg?.author && (
                        <div className="text-muted-foreground">
                          Author: {cfg.author_url ? (
                            <a href={cfg.author_url} className="underline" target="_blank" rel="noreferrer">{cfg.author}</a>
                          ) : cfg.author}
                        </div>
                      )}
                      {cfg?.description && (
                        <div className="text-muted-foreground">{cfg.description}</div>
                      )}
                      {isActive && (
                        <div className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isActive && can('activate themes') && (
                      <Button size="sm" onClick={async () => {
                        try {
                          await router.post(route('dashboard.admin.themes.activate', t.slug));
                          toast.success('Theme activated');
                          router.visit(route('dashboard.admin.themes.index'));
                        } catch (e) {
                          console.error(e);
                          toast.error('Failed to activate theme');
                        }
                      }}>Activate</Button>
                    )}
                    {can('publish theme assets') && (
                      <Button size="sm" variant="secondary" onClick={async () => {
                        try {
                          await router.post(route('dashboard.admin.themes.publish-assets', t.id));
                          toast.success('Assets published');
                        } catch (e) {
                          console.error(e);
                          toast.error('Failed to publish assets');
                        }
                      }}>Publish Assets</Button>
                    )}
                    {isActive && can('customize themes') && (
                      <Button size="sm" onClick={() => router.visit(route('dashboard.admin.themes.customizer', t.id))}>Customize</Button>
                    )}
                    {!isActive && can('delete themes') && (
                      <Button size="sm" variant="destructive" onClick={async () => {
                        if (!confirm(`Uninstall theme "${t.name || t.slug}"?`)) return;
                        try {
                          await router.delete(route('dashboard.admin.themes.destroy', t.id), { preserveScroll: true });
                          toast.success('Theme uninstalled');
                          router.visit(route('dashboard.admin.themes.index'));
                        } catch (e) {
                          console.error(e);
                          toast.error('Failed to uninstall theme');
                        }
                      }}>Uninstall</Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <div className="text-sm text-muted-foreground">
                        {(Array.isArray(t.tags) && t.tags.length > 0) && (
                          <div className="mb-2">Tags: {t.tags.join(', ')}</div>
                        )}
                        {cfg?.supports && Object.keys(cfg.supports).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(cfg.supports).map(([k, v]: any) => (
                              <li key={k}>{k}: {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Menus</h4>
                      <div className="text-sm text-muted-foreground">
                        {cfg?.menus && Object.keys(cfg.menus).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(cfg.menus).map(([k, v]: any) => (
                              <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Widget Areas</h4>
                      <div className="text-sm text-muted-foreground">
                        {t?.widget_areas && Object.keys(t.widget_areas).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(t.widget_areas).map(([k, v]: any) => (
                              <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Templates</h4>
                      <div className="text-sm text-muted-foreground">
                        {t?.templates && Object.keys(t.templates).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(t.templates).map(([k, v]: any) => (
                              <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </SectionWrapper>
        );
      case 'themes.customizer':
        return (
          <SectionWrapper
            title="Theme Customizer"
            actions={
              <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.themes.index'))}>
                Back to Themes
              </Button>
            }
          >
            {(() => {
              const t = (theme as any) || {};
              const settings = (customizerSettings as any) || {};
              const menus = (availableMenus as any) || {};
              const widgets = (widgetAreas as any) || {};

              const initial: Record<string, any> = typeof t.customizer === 'object' && t.customizer ? t.customizer : {};

              const handleSubmit = async (e: any) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const data: Record<string, any> = {};
                for (const [k, v] of form.entries()) {
                  data[k] = v as any;
                }
                try {
                  await router.put(route('dashboard.admin.themes.update', t.id), { customizer: data }, {
                    preserveScroll: true,
                    onSuccess: () => toast.success('Customizer saved'),
                    onError: () => toast.error('Failed to save customizer'),
                  });
                } catch (err) {
                  console.error(err);
                  toast.error('Error saving customizer');
                }
              };

              const entries = Object.entries(settings);

              return (
                <div className="space-y-8">
                  <div className="border rounded-md p-4">
                    <div className="font-semibold mb-2">{t.name || t.slug}</div>
                    <div className="text-xs text-muted-foreground">Slug: {t.slug}</div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {entries.length === 0 && (
                        <div className="text-sm text-muted-foreground">No customizer settings defined by this theme.</div>
                      )}
                      {entries.map(([key, raw]) => {
                        const v: any = raw as any;
                        const value = (initial && key in initial) ? initial[key] : (v && v.default !== undefined ? v.default : (typeof v === 'string' ? v : ''));
                        const type = (v && v.type) ? String(v.type) : (typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? 'color' : 'text');
                        const label = (v && v.label) ? String(v.label) : key;
                        const options = (v && Array.isArray(v.options)) ? v.options : undefined;
                        return (
                          <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                            <label htmlFor={`cz_${key}`} className="text-sm font-medium">{label}</label>
                            <div className="md:col-span-2">
                              {options ? (
                                <select id={`cz_${key}`} name={key} defaultValue={String(value)} className="w-full border rounded px-3 py-2 bg-background">
                                  {options.map((opt: any) => (
                                    <option key={String(opt?.value ?? opt)} value={String(opt?.value ?? opt)}>{String(opt?.label ?? opt)}</option>
                                  ))}
                                </select>
                              ) : type === 'color' ? (
                                <input id={`cz_${key}`} name={key} type="color" defaultValue={String(value || '#000000')} className="h-9 w-16 p-1 border rounded" />
                              ) : (
                                <input id={`cz_${key}`} name={key} type="text" defaultValue={String(value)} className="w-full border rounded px-3 py-2 bg-background" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.themes.index'))}>Cancel</Button>
                    </div>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Available Menus</h4>
                      <div className="text-sm text-muted-foreground">
                        {menus && Object.keys(menus).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(menus).map(([k, v]: any) => (
                              <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Widget Areas</h4>
                      <div className="text-sm text-muted-foreground">
                        {widgets && Object.keys(widgets).length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(widgets).map(([k, v]: any) => (
                              <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </SectionWrapper>
        );
      case 'posts':
        return (
          <SectionWrapper 
            title="Posts" 
            actions={
              can('create posts') ? (
                <Button size="sm" onClick={() => router.visit(route('dashboard.admin.posts.create'))}>
                  + New Post
                </Button>
              ) : null
            }
          >
            <PostList 
              posts={postsProp as any}
              canCreate={can('create posts')}
              canEdit={can('edit posts')}
              onCreate={() => router.visit(route('dashboard.admin.posts.create'))}
            />
          </SectionWrapper>
        );

      case 'posts.create':
        return (
          <SectionWrapper title="Create Post" actions={
            <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.posts.index'))}>
              Back to Posts
            </Button>
          }>
            <PostForm 
              isEditing={false}
              postTypes={(postTypes as any) || []}
              groupedTerms={(groupedTerms as any) || {}}
              onSubmit={handlePostSubmit}
              onCancel={() => router.visit(route('dashboard.admin.posts.index'))}
            />
          </SectionWrapper>
        );

      case 'posts.edit':
        return (
          <SectionWrapper title="Edit Post" actions={
            <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.posts.index'))}>
              Back to Posts
            </Button>
          }>
            <PostForm 
              post={editPost as any}
              postTypes={(postTypes as any) || []}
              groupedTerms={(groupedTerms as any) || {}}
              isEditing={true}
              onSubmit={(data) => handlePostSubmit(data, (editPost as any)?.id)}
              onCancel={() => router.visit(route('dashboard.admin.posts.index'))}
            />
          </SectionWrapper>
        );

      case 'posts.show':
        return (
          <SectionWrapper title="View Post" actions={
            <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.posts.index'))}>
              Back to Posts
            </Button>
          }>
            <PostView post={(post as any) || (editPost as any)} />
          </SectionWrapper>
        );
      case 'users.create':
        return (
          <SectionWrapper 
            title="Create New User"
            actions={
              <Button 
                variant="outline"
                size="sm"
                onClick={() => router.visit(route('dashboard.admin.users.index'))}
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
              onCancel={() => router.visit(route('dashboard.admin.users.index'))}
              currentUserId={auth.user?.id}
            />
          </SectionWrapper>
        );

      case 'users':
        return (
          <SectionWrapper 
            title="Users"
            actions={
              can('create users') ? (
                <Button 
                  size="sm" 
                  onClick={() => router.visit(route('dashboard.admin.users.create'))}
                >
                  + New User
                </Button>
              ) : null
            }
          >
            <UserList 
              users={users} 
              onEdit={(id) => router.visit(route('dashboard.admin.users.edit', id))}
              onRoleChange={async (userId, roleId, action) => {
                try {
                  const url = action === 'assign' 
                    ? route('dashboard.admin.users.roles.assign', { user: userId, role: roleId })
                    : route('dashboard.admin.users.roles.remove', { user: userId, role: roleId });
                  
                  await router.post(url, {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                      toast.success(`Role ${action === 'assign' ? 'assigned' : 'removed'} successfully`);
                      router.reload({ only: ['users'] });
                    },
                    onError: () => {
                      toast.error(`Failed to ${action} role`);
                    }
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

      case 'users.edit':
        if (!editUser) {
          return (
            <SectionWrapper title="User Not Found">
              <p>User not found. Please try again.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.visit(route('dashboard.admin.users.index'))}
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
                onClick={() => router.visit(route('dashboard.admin.users.index'))}
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
              onCancel={() => router.visit(route('dashboard.admin.users.index'))}
              currentUserId={auth.user?.id}
            />
          </SectionWrapper>
        );

      case 'roles':
        return (
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
              onEdit={(id) => router.visit(route('dashboard.admin.roles.edit', id))} 
            />
          </SectionWrapper>
        );

      case 'roles.create':
      case 'roles.edit':
        return (
          <SectionWrapper 
            title={editRole ? 'Edit Role' : 'Create New Role'}
            actions={
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.visit(route('dashboard.admin.roles'))}
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
              onCancel={() => router.visit(route('dashboard.admin.roles'))}
            />
          </SectionWrapper>
        );

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <>
      <Head title="Dashboard" />
      {renderSection()}
    </>
  );
}
