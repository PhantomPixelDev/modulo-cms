/**
 * Converts a date string to the datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export function toDatetimeLocalStr(s?: string): string {
  if (!s) return '';
  // If already like 2025-01-01T12:30:00 or 2025-01-01T12:30
  if (s.includes('T')) return s.slice(0, 16);
  // If like 2025-01-01 12:30:00
  if (s.includes(' ')) {
    const [d, t] = s.split(' ');
    return `${d}T${t.slice(0, 5)}`;
  }
  return s;
}

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(value: string): string {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extracts selected term IDs from a post object
 */
export function getSelectedTermIds(post: any): number[] {
  if (Array.isArray(post?.selected_terms)) return post.selected_terms as number[];
  if (Array.isArray(post?.taxonomy_terms)) {
    return (post.taxonomy_terms as Array<{ id: number }>).map(t => t.id);
  }
  return [];
}
