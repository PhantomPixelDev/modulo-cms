export interface PostType {
  id: number;
  name: string;
  label: string;
  is_hierarchical?: boolean;
}

export interface Term {
  id: number;
  name: string;
  slug?: string;
  count?: number;
}

export interface Author {
  id: number;
  name: string;
}

export interface FeaturedImagePreview {
  id?: number;
  url: string;
  thumb?: string;
  name?: string;
  mime_type?: string;
  file_name?: string;
}

export interface ParentPost {
  id: number;
  title: string;
}

export interface Locale {
  id: number;
  code: string;
  name: string;
  native_name?: string;
  is_default?: boolean;
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

export interface PostFormProps {
  post?: any;
  translation?: PostTranslation;
  postTypes?: PostType[];
  groupedTerms?: Record<string, Term[]>;
  authors?: Author[];
  parentsByType?: Record<string | number, ParentPost[]>;
  locales?: Locale[];
  currentLocale?: string;
  canEditAuthor?: boolean;
  isEditing: boolean;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  onLocaleChange?: (locale: string) => void;
}

export interface MetaData {
  [key: string]: any;
}
