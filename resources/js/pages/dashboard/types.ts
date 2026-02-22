// Define base interfaces to avoid dependency on @/types
export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface TranslationEntry {
  key: string;
  value?: string;
  override?: string | null;
  is_overridden: boolean;
}

export interface TranslationManagerPayload {
  entries: TranslationEntry[];
  locales: Locale[];
  domains: string[];
  currentLocale: string;
  currentDomain: string;
  search?: string;
  overrideCount: number;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;
  email_verified_at: string | null;
  roles?: Role[];
}

export interface Role extends BaseEntity {
  name: string;
  permissions?: Permission[];
  // Add other required Role properties here
  created_at?: string;
  updated_at?: string;
}

export interface Permission extends BaseEntity {
  name: string;
  description?: string;
}

export interface Post extends BaseEntity {
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  post_type_id: number;
  author_id?: number;
  author?: User;
  post_type?: PostType;
  taxonomy_terms?: TaxonomyTerm[];
  // Added fields used by forms and returned by backend
  slug?: string;
  featured_image?: string | null;
  published_at?: string | null;
  meta_title?: string;
  meta_description?: string;
  parent_id?: number | null;
  menu_order?: number;
  meta_data?: Record<string, any>;
  // Used on edit screens for pre-selecting taxonomy terms
  selected_terms?: number[];
}

export interface PostType extends BaseEntity {
  name: string;
  label: string;
  plural_label: string;
  description?: string;
  route_prefix?: string;
  has_taxonomies: boolean;
  has_featured_image: boolean;
  has_excerpt: boolean;
  has_comments: boolean;
  supports: string[];
  taxonomies: string[];
  slug: string;
  is_public: boolean;
  is_hierarchical: boolean;
  show_in_menu: boolean;
  menu_icon?: string;
  menu_position: number;
}

export interface Taxonomy extends BaseEntity {
  name: string;
  label: string;
  plural_label: string;
  description?: string;
  slug: string;
  is_hierarchical: boolean;
  is_public: boolean;
  post_types: string[];
  show_in_menu: boolean;
  menu_icon?: string;
  menu_position: number;
}

export interface TaxonomyTerm extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  term_order: number;
  meta_title?: string;
  meta_description?: string;
  taxonomy?: Taxonomy;
}

export interface Locale {
  id: number;
  code: string;
  name: string;
  native_name?: string;
  direction?: string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
}

export interface PostTranslation {
  id: number;
  post_id: number;
  locale: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  seo_title?: string;
  seo_description?: string;
}

export interface SitemapCustomUrl {
  loc: string;
  lastmod?: string | null;
  changefreq?: string | null;
  priority?: number | null;
}

export interface SitemapSettings {
  included_post_type_ids?: number[] | null;
  include_taxonomies: boolean;
  enable_cache: boolean;
  cache_ttl: number;
  last_generated_at?: string | null;
  custom_urls?: SitemapCustomUrl[];
}

export interface SiteSettings {
  general?: Record<string, any>;
  reading?: Record<string, any>;
  writing?: Record<string, any>;
  seo?: Record<string, any>;
  social?: Record<string, any>;
  analytics?: Record<string, any>;
  media?: Record<string, any>;
  advanced?: Record<string, any>;
}

export interface MediaItem extends BaseEntity {
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumb?: string;
  custom_properties?: Record<string, any>;
}

export interface MediaFolder extends BaseEntity {
  name: string;
  slug: string;
  path: string;
  parent_id: number | null;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ShopProduct extends BaseEntity {
  sku?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  sale_price?: string | null;
  currency: string;
  is_active: boolean;
  status?: 'draft' | 'published' | 'pending' | 'private';
  stock?: number | null;
  featured_image?: string | null;
  meta?: Record<string, any> | null;
}

export interface ShopOrder extends BaseEntity {
  order_number: string;
  status: string;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  total: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  item_count: number;
}

export interface Template extends BaseEntity {
  name: string;
  slug: string;
  type: string;
  description?: string;
  content: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  creator?: User;
}

export interface AuthUser extends User {
  can: (permission: string) => boolean;
}

interface Auth {
  user: AuthUser | null;
}

export interface DashboardProps {
  adminStats?: {
    users: number;
    roles: number;
    posts: number;
    pages: number;
    postTypes: number;
    taxonomies: number;
    taxonomyTerms: number;
    themes: number;
    media: number;
  };
  adminSection?: string;
  users?: {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  roles?: {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  posts?: Post[] | { data: Post[] };
  postTypes?: PostType[];
  currentPostType?: PostType;
  taxonomies?: Taxonomy[] | { data: Taxonomy[] };
  taxonomyTerms?: any;
  taxonomyTerm?: any;
  editTaxonomyTerm?: any;
  parentTerms?: Array<{ id: number; name: string }>;
  templates?: Template[];
  templateTypes?: Record<string, string>;
  templatesPagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  allRoles?: Role[];
  permissions?: Array<{ id: number; name: string }>;
  groupedTerms?: Record<string, any>;
  authors?: Array<{ id: number; name: string }>;
  parentsByType?: Record<number | string, Array<{ id: number; title: string }>>;
  sitemapSettings?: SitemapSettings;
  // Site settings
  settings?: SiteSettings;
  settingsGroup?: string;
  pages?: Array<{ id: number; title: string }>;
  timezones?: string[];
  // Plugins
  plugins?: any[];
  plugin?: any;
  post?: Post; // single post for show view
  editPost?: Post;
  editPostType?: PostType;
  // Localization
  locales?: Locale[];
  currentLocale?: string;
  translation?: PostTranslation;
  editTaxonomy?: Taxonomy;
  editUser?: any;
  editRole?: any;
  editTemplate?: Template;
  template?: Template;
  themes?: any[];
  activeTheme?: any;
  discoveredThemes?: any[];
  theme?: any;
  // Theme details specific
  themeConfig?: any;
  themeAssets?: any;
  auth: Auth;
  // Media library
  media?: MediaItem[] | Paginated<MediaItem>;
  folders?: MediaFolder[];
  allFolders?: MediaFolder[];
  breadcrumb?: MediaFolder[];
  currentFolderId?: number | null;
  // ModuloShop
  shopProducts?: Paginated<ShopProduct>;
  shopOrders?: Paginated<ShopOrder>;
  shopOrder?: ShopOrder;
  shopSettings?: Record<string, any>;
  // Dashboard activity and status
  recentActivity?: Array<{
    type: string;
    icon: string;
    title: string;
    description: string;
    user: string;
    timestamp: string;
    created_at: any;
  }>;
  systemStatus?: Record<string, {
    status: string;
    label: string;
    value: string;
    color: string;
    indicator: string;
    detail?: string;
    last_checked_at?: string;
    meta?: Record<string, string | number | null | undefined>;
  }>;
  globalCommentsEnabled: boolean;
  translationManager?: TranslationManagerPayload;
}

// Post Type List Item
export interface PostTypeListItem {
  id: number;
  name: string;
  label: string;
  route_prefix: string;
}

// Taxonomy List Item
export interface TaxonomyListItem {
  id: number;
  name: string;
  label: string;
}

// Page List Item
export interface PageListItem {
  id: number;
  title: string;
  status: string;
  author?: { name: string };
  created_at: string;
}

// Post List Item
export interface PostListItem {
  id: number;
  title: string;
  slug?: string;
  status: string;
  post_type?: { id: number; label: string; name: string };
  author?: { id: number; name: string };
  created_at: string;
}

// Normalize paginated objects or arrays to arrays
export function asArray<T>(val?: T[] | { data: T[] } | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : val.data || [];
}
