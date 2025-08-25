// Centralized route helpers for dashboard admin
// Uses Ziggy's global route() helper
// Ensure @routes is included so route() is available

declare const route: (name: string, params?: any) => string;

export const ROUTE = {
  posts: {
    index: () => route('dashboard.admin.posts.index'),
    create: () => route('dashboard.admin.posts.create'),
    store: () => route('dashboard.admin.posts.store'),
    update: (id: number | string) => route('dashboard.admin.posts.update', { post: id }),
    destroy: (id: number | string) => route('dashboard.admin.posts.destroy', { post: id }),
    edit: (id: number | string) => route('dashboard.admin.posts.edit', { post: id }),
    show: (id: number | string) => route('dashboard.admin.posts.show', { post: id }),
  },
  pages: {
    index: () => route('dashboard.admin.pages.index'),
    create: () => route('dashboard.admin.pages.create'),
    store: () => route('dashboard.admin.pages.store'),
    update: (id: number | string) => route('dashboard.admin.pages.update', id),
    destroy: (id: number | string) => route('dashboard.admin.pages.destroy', id),
    edit: (id: number | string) => route('dashboard.admin.pages.edit', id),
  },
  postTypes: {
    index: () => route('dashboard.admin.post-types.index'),
    create: () => route('dashboard.admin.post-types.create'),
    store: () => route('dashboard.admin.post-types.store'),
    update: (id: number | string) => route('dashboard.admin.post-types.update', id),
    destroy: (id: number | string) => route('dashboard.admin.post-types.destroy', id),
    edit: (id: number | string) => route('dashboard.admin.post-types.edit', id),
    show: (id: number | string) => route('dashboard.admin.post-types.show', id),
  },
  taxonomies: {
    index: () => route('dashboard.admin.taxonomies.index'),
    create: () => route('dashboard.admin.taxonomies.create'),
    edit: (id: number | string) => route('dashboard.admin.taxonomies.edit', id),
    show: (id: number | string) => route('dashboard.admin.taxonomies.show', id),
  },
  themes: {
    index: () => route('dashboard.admin.themes.index'),
    show: (id: number | string) => route('dashboard.admin.themes.show', id),
    customizer: (id: number | string) => route('dashboard.admin.themes.customizer', id),
    activate: (slug: string) => route('dashboard.admin.themes.activate', slug),
    publishAssets: (id: number | string) => route('dashboard.admin.themes.publish-assets', id),
    discover: () => route('dashboard.admin.themes.discover'),
    update: (id: number | string) => route('dashboard.admin.themes.update', id),
    destroy: (id: number | string) => route('dashboard.admin.themes.destroy', id),
  },
  users: {
    index: () => route('dashboard.admin.users.index'),
    create: () => route('dashboard.admin.users.create'),
    store: () => route('dashboard.admin.users.store'),
    update: (id: number | string) => route('dashboard.admin.users.update', id),
    destroy: (id: number | string) => route('dashboard.admin.users.destroy', id),
    edit: (id: number | string) => route('dashboard.admin.users.edit', id),
    roles: {
      assign: (userId: number | string, roleId: number | string) =>
        route('dashboard.admin.users.roles.assign', { user: userId, role: roleId }),
      remove: (userId: number | string, roleId: number | string) =>
        route('dashboard.admin.users.roles.remove', { user: userId, role: roleId }),
    },
  },
  roles: {
    index: () => route('dashboard.admin.roles'),
    store: () => route('dashboard.admin.roles.store'),
    update: (id: number | string) => route('dashboard.admin.roles.update', id),
    edit: (id: number | string) => route('dashboard.admin.roles.edit', id),
  },
  misc: {
    dashboard: () => route('dashboard.admin.index'),
  },
};
