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
  taxonomyTerms: {
    index: (params?: { taxonomy_id?: number | string }) =>
      params?.taxonomy_id
        ? route('dashboard.admin.taxonomy-terms.index', { taxonomy_id: params.taxonomy_id })
        : route('dashboard.admin.taxonomy-terms.index'),
    create: () => route('dashboard.admin.taxonomy-terms.create'),
    store: () => route('dashboard.admin.taxonomy-terms.store'),
    edit: (id: number | string) => route('dashboard.admin.taxonomy-terms.edit', { taxonomy_term: id }),
    update: (id: number | string) => route('dashboard.admin.taxonomy-terms.update', { taxonomy_term: id }),
    destroy: (id: number | string) => route('dashboard.admin.taxonomy-terms.destroy', { taxonomy_term: id }),
    show: (id: number | string) => route('dashboard.admin.taxonomy-terms.show', { taxonomy_term: id }),
  },
  templates: {
    index: () => route('dashboard.admin.templates.index'),
    create: () => route('dashboard.admin.templates.create'),
    store: () => route('dashboard.admin.templates.store'),
    edit: (id: number | string) => route('dashboard.admin.templates.edit', { template: id }),
    update: (id: number | string) => route('dashboard.admin.templates.update', { template: id }),
    destroy: (id: number | string) => route('dashboard.admin.templates.destroy', { template: id }),
    show: (id: number | string) => route('dashboard.admin.templates.show', { template: id }),
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
    index: () => route('dashboard.admin.roles.index'),
    create: () => route('dashboard.admin.roles.create'),
    store: () => route('dashboard.admin.roles.store'),
    update: (id: number | string) => route('dashboard.admin.roles.update', { role: id }),
    destroy: (id: number | string) => route('dashboard.admin.roles.destroy', { role: id }),
    edit: (id: number | string) => route('dashboard.admin.roles.edit', { role: id }),
  },
  sitemap: {
    index: () => route('dashboard.admin.sitemap.index'),
    update: () => route('dashboard.admin.sitemap.update'),
    regenerate: () => route('dashboard.admin.sitemap.regenerate'),
  },
  siteSettings: {
    index: (group?: string) => group 
      ? route('dashboard.admin.settings.index', { group }) 
      : route('dashboard.admin.settings.index'),
    update: (group: string) => route('dashboard.admin.settings.update', { group }),
    clearCache: () => route('dashboard.admin.settings.clear-cache'),
  },
  plugins: {
    index: () => route('dashboard.admin.plugins.index'),
    activate: (slug: string) => route('dashboard.admin.plugins.activate', { slug }),
    deactivate: (slug: string) => route('dashboard.admin.plugins.deactivate', { slug }),
    settings: (slug: string) => route('dashboard.admin.plugins.settings', { slug }),
    updateSettings: (slug: string) => route('dashboard.admin.plugins.update-settings', { slug }),
    destroy: (slug: string) => route('dashboard.admin.plugins.destroy', { slug }),
  },
  media: {
    index: (params?: { folder_id?: number | string; q?: string; type?: string; sort?: string; dir?: 'asc' | 'desc'; page?: number | string; perPage?: number | string }) => {
      const p: Record<string, any> = {};
      if (!params) return route('dashboard.admin.media.index');
      for (const k of ['folder_id', 'q', 'type', 'sort', 'dir', 'page', 'perPage'] as const) {
        const v = (params as any)[k];
        if (v !== undefined && v !== null && v !== '') p[k] = v;
      }
      return Object.keys(p).length ? route('dashboard.admin.media.index', p) : route('dashboard.admin.media.index');
    },
    store: () => route('dashboard.admin.media.store'),
    update: (id: number | string) => route('dashboard.admin.media.update', { media: id }),
    destroy: (id: number | string) => route('dashboard.admin.media.destroy', { media: id }),
    regenerate: (id?: number | string) =>
      id ? route('dashboard.admin.media.regenerate', { media: id }) : route('dashboard.admin.media.regenerate'),
    bulk: () => route('dashboard.admin.media.bulk'),
    folders: {
      store: () => route('dashboard.admin.media.folders.store'),
      update: (id: number | string) => route('dashboard.admin.media.folders.update', { bucket: id }),
      destroy: (id: number | string) => route('dashboard.admin.media.folders.destroy', { bucket: id }),
    },
  },
  shop: {
    products: {
      index: () => route('dashboard.admin.shop.products.index'),
      store: () => route('dashboard.admin.shop.products.store'),
      update: (id: number | string) => route('dashboard.admin.shop.products.update', { post: id }),
      destroy: (id: number | string) => route('dashboard.admin.shop.products.destroy', { post: id }),
    },
    orders: {
      index: () => route('dashboard.admin.shop.orders.index'),
      show: (id: number | string) => route('dashboard.admin.shop.orders.show', { order: id }),
      update: (id: number | string) => route('dashboard.admin.shop.orders.update', { order: id }),
      destroy: (id: number | string) => route('dashboard.admin.shop.orders.destroy', { order: id }),
    },
    settings: {
      index: () => route('dashboard.admin.shop.settings.index'),
    },
  },
  misc: {
    dashboard: () => route('dashboard.admin.index'),
  },
};
