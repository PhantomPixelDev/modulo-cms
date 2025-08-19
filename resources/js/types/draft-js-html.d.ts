declare module 'draft-js-import-html' {
  import { ContentState } from 'draft-js';
  export function stateFromHTML(html: string): ContentState;
  const defaultExport: (html: string) => ContentState;
  export default defaultExport;
}

declare module 'draft-js-export-html' {
  import { ContentState } from 'draft-js';
  export function stateToHTML(content: ContentState): string;
  const defaultExport: (content: ContentState) => string;
  export default defaultExport;
}
