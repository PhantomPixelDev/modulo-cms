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

export interface PostFormProps {
  post?: any;
  postTypes?: PostType[];
  groupedTerms?: Record<string, Term[]>;
  authors?: Author[];
  parentsByType?: Record<string | number, ParentPost[]>;
  canEditAuthor?: boolean;
  isEditing: boolean;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
}

export interface MetaData {
  [key: string]: any;
}
