import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createEditor, Descendant, Transforms, Editor, Element as SlateElement, Text, Range, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Type as Paragraph,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Eye,
  FileCode,
  FileText,
} from 'lucide-react';
import MediaPickerDialog from '../media/MediaPickerDialog';
import type { MediaItem } from '../../types';

// Types
export type Align = 'left' | 'center' | 'right' | 'justify';

type ParagraphElement = { type: 'paragraph'; align?: Align; children: Descendant[] };
type HeadingOneElement = { type: 'heading-one'; align?: Align; children: Descendant[] };
type HeadingTwoElement = { type: 'heading-two'; align?: Align; children: Descendant[] };
type HeadingThreeElement = { type: 'heading-three'; align?: Align; children: Descendant[] };
type BlockQuoteElement = { type: 'block-quote'; align?: Align; children: Descendant[] };
type NumberedListElement = { type: 'numbered-list'; align?: Align; children: Descendant[] };
type BulletedListElement = { type: 'bulleted-list'; align?: Align; children: Descendant[] };
type ListItemElement = { type: 'list-item'; align?: Align; children: Descendant[] };
type CodeBlockElement = { type: 'code-block'; align?: Align; children: Descendant[] };
type DividerElement = { type: 'divider'; children: [{ text: '' }] };
type LinkElement = { type: 'link'; url: string; children: Descendant[] };
type ImageElement = { type: 'image'; url: string; children: [{ text: '' }] };

type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | HeadingThreeElement
  | BlockQuoteElement
  | NumberedListElement
  | BulletedListElement
  | ListItemElement
  | CodeBlockElement
  | DividerElement
  | LinkElement
  | ImageElement;

type FormattedText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; code?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: FormattedText;
  }
}

export interface SlateEditorProps {
  initialHTML?: string;
  onHTMLChange?: (html: string) => void;
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

function isBlockActive(editor: Editor, type: CustomElement['type']) {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && (n as SlateElement).type === type,
    }),
  );
  return !!match;
}

function toggleBlock(editor: Editor, type: CustomElement['type']) {
  const isActive = isBlockActive(editor, type);
  const isList = LIST_TYPES.includes(type);

  Transforms.unwrapNodes(editor, {
    match: n => SlateElement.isElement(n) && LIST_TYPES.includes((n as SlateElement).type as string),
    split: true,
  });

  let newType: CustomElement['type'] = 'paragraph';
  if (!isActive) {
    if (type === 'code-block') newType = 'code-block';
    else if (type === 'block-quote') newType = 'block-quote';
    else if (type === 'heading-one') newType = 'heading-one';
    else if (type === 'heading-two') newType = 'heading-two';
    else if (type === 'heading-three') newType = 'heading-three';
    else if (isList) newType = 'list-item';
    else newType = 'paragraph';
  }

  Transforms.setNodes(editor, { type: newType } as Partial<SlateElement>);

  if (!isActive && isList) {
    const block: SlateElement = { type, children: [] } as any;
    Transforms.wrapNodes(editor, block);
  }
}

function isMarkActive(editor: Editor, format: keyof Omit<FormattedText, 'text'>) {
  const marks = Editor.marks(editor) as Partial<FormattedText> | null;
  return marks ? (marks as any)[format] === true : false;
}

function toggleMark(editor: Editor, format: keyof Omit<FormattedText, 'text'>) {
  const isActive = isMarkActive(editor, format);
  if (isActive) Editor.removeMark(editor, format);
  else Editor.addMark(editor, format, true);
}

function setAlign(editor: Editor, align: Align) {
  Transforms.setNodes(editor, { align } as Partial<SlateElement>, { match: n => SlateElement.isElement(n) });
}

function isLinkActive(editor: Editor) {
  const [link] = Editor.nodes(editor, { match: n => SlateElement.isElement(n) && (n as SlateElement).type === 'link' });
  return !!link;
}

function unwrapLink(editor: Editor) {
  Transforms.unwrapNodes(editor, { match: n => SlateElement.isElement(n) && (n as SlateElement).type === 'link' });
}

function wrapLink(editor: Editor, url: string) {
  if (isLinkActive(editor)) unwrapLink(editor);
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: LinkElement = { type: 'link', url, children: isCollapsed ? [{ text: url }] : [] } as any;
  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
}

function insertImage(editor: Editor, url: string) {
  const image: ImageElement = { type: 'image', url, children: [{ text: '' }] } as any;
  Transforms.insertNodes(editor, image);
}

// Basic HTML serialization/deserialization for supported nodes
function serializeNode(node: Descendant): string {
  if (Text.isText(node)) {
    let str = node.text;
    if ((node as FormattedText).code) str = `<code>${str}</code>`;
    if ((node as FormattedText).bold) str = `<strong>${str}</strong>`;
    if ((node as FormattedText).italic) str = `<em>${str}</em>`;
    if ((node as FormattedText).underline) str = `<u>${str}</u>`;
    if ((node as FormattedText).strikethrough) str = `<s>${str}</s>`;
    return str;
  }
  const element = node as SlateElement;
  const align = (element as any).align as Align | undefined;
  const style = align ? ` style="text-align:${align}"` : '';
  const children = (element.children as Descendant[]).map(serializeNode).join('');
  switch (element.type) {
    case 'heading-one':
      return `<h1${style}>${children}</h1>`;
    case 'heading-two':
      return `<h2${style}>${children}</h2>`;
    case 'heading-three':
      return `<h3${style}>${children}</h3>`;
    case 'block-quote':
      return `<blockquote${style}>${children}</blockquote>`;
    case 'numbered-list':
      return `<ol${style}>${children}</ol>`;
    case 'bulleted-list':
      return `<ul${style}>${children}</ul>`;
    case 'list-item':
      return `<li${style}>${children}</li>`;
    case 'code-block':
      return `<pre${style}><code>${children}</code></pre>`;
    case 'divider':
      return `<hr/>`;
    case 'link':
      return `<a href="${(element as any).url}">${children}</a>`;
    case 'image':
      return `<img src="${(element as any).url}" />`;
    default:
      return `<p${style}>${children}</p>`;
  }
}

function serialize(value: Descendant[]): string {
  return value.map(serializeNode).join('');
}

function deserialize(html?: string): Descendant[] {
  if (!html) return [createParagraph('')];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  const children: Descendant[] = [];
  body.childNodes.forEach((n) => {
    const el = n as HTMLElement;
    if (el.nodeName === '#text') {
      children.push(createParagraph(el.textContent || ''));
      return;
    }
    children.push(deserializeElement(el));
  });
  return children.length ? children : [createParagraph(body.textContent || '')];
}

function deserializeElement(el: HTMLElement): Descendant {
  const styleAlign = (el.style?.textAlign as Align | undefined) || undefined;
  const align = styleAlign && ['left', 'center', 'right', 'justify'].includes(styleAlign) ? styleAlign : undefined;
  const nodeChildren = Array.from(el.childNodes).map((cn) => deserializeChild(cn as HTMLElement));
  const children = (nodeChildren.length ? nodeChildren : [{ text: '' }]) as Descendant[];
  switch (el.nodeName) {
    case 'H1':
      return { type: 'heading-one', align, children } as any;
    case 'H2':
      return { type: 'heading-two', align, children } as any;
    case 'H3':
      return { type: 'heading-three', align, children } as any;
    case 'BLOCKQUOTE':
      return { type: 'block-quote', align, children } as any;
    case 'OL':
      return { type: 'numbered-list', align, children } as any;
    case 'UL':
      return { type: 'bulleted-list', align, children } as any;
    case 'LI':
      return { type: 'list-item', align, children } as any;
    case 'PRE':
      return { type: 'code-block', align, children } as any;
    case 'HR':
      return { type: 'divider', children: [{ text: '' }] } as any;
    case 'A':
      return { type: 'link', url: el.getAttribute('href') || '#', children } as any;
    case 'IMG':
      return { type: 'image', url: el.getAttribute('src') || '', children: [{ text: '' }] } as any;
    case 'P':
    default:
      return { type: 'paragraph', align, children } as any;
  }
}

function deserializeChild(el: HTMLElement): Descendant {
  if (el.nodeType === Node.TEXT_NODE) {
    return { text: el.textContent || '' };
  }
  if (el.nodeType !== Node.ELEMENT_NODE) return { text: '' };
  const tag = el.nodeName;
  const childNodes = Array.from(el.childNodes).map((cn) => deserializeChild(cn as HTMLElement));
  let node: Descendant | null = null;
  switch (tag) {
    case 'STRONG':
    case 'B':
      node = wrapMarks(childNodes, 'bold');
      break;
    case 'EM':
    case 'I':
      node = wrapMarks(childNodes, 'italic');
      break;
    case 'U':
      node = wrapMarks(childNodes, 'underline');
      break;
    case 'S':
    case 'DEL':
      node = wrapMarks(childNodes, 'strikethrough');
      break;
    case 'CODE':
      node = wrapMarks(childNodes, 'code');
      break;
    default:
      return deserializeElement(el);
  }
  return node || { text: '' };
}

function wrapMarks(nodes: Descendant[], mark: keyof Omit<FormattedText, 'text'>): Descendant {
  return nodes.map((n) => {
    if (Text.isText(n)) return { ...(n as any), [mark]: true } as any;
    if ((n as any).children) return { ...(n as any), children: (n as any).children.map((c: any) => ({ ...c, [mark]: true })) };
    return n;
  })[0];
}

// --- Markdown serialization helpers ---
function mdPlainText(nodes: Descendant[] | undefined): string {
  if (!nodes) return '';
  const parts: string[] = [];
  const walk = (n: Descendant) => {
    if (Text.isText(n)) {
      parts.push(n.text);
    } else if ((n as any).children) {
      (n as any).children.forEach((c: Descendant) => walk(c));
    }
  };
  nodes.forEach(walk);
  return parts.join('');
}

function mdForLeaf(t: FormattedText): string {
  let out = t.text || '';
  if (t.code) out = '`' + out + '`';
  if (t.bold) out = `**${out}**`;
  if (t.italic) out = `*${out}*`;
  if (t.strikethrough) out = `~~${out}~~`;
  // underline omitted in MD
  return out;
}

function mdForNode(node: Descendant): string {
  if (Text.isText(node)) return mdForLeaf(node as FormattedText);
  const el = node as SlateElement;
  switch (el.type) {
    case 'heading-one':
      return `# ${mdPlainText(el.children as Descendant[])}\n\n`;
    case 'heading-two':
      return `## ${mdPlainText(el.children as Descendant[])}\n\n`;
    case 'heading-three':
      return `### ${mdPlainText(el.children as Descendant[])}\n\n`;
    case 'block-quote': {
      const text = mdPlainText(el.children as Descendant[]);
      return text.split(/\n/).map(l => (l ? `> ${l}` : '>')).join('\n') + '\n\n';
    }
    case 'numbered-list': {
      let i = 1;
      const items = (el.children as any[]).map((li) => `${i++}. ${mdPlainText(li.children)}`).join('\n');
      return items + '\n\n';
    }
    case 'bulleted-list': {
      const items = (el.children as any[]).map((li) => `- ${mdPlainText(li.children)}`).join('\n');
      return items + '\n\n';
    }
    case 'list-item':
      return mdPlainText(el.children as Descendant[]) + '\n';
    case 'code-block': {
      const text = mdPlainText(el.children as Descendant[]);
      return '```\n' + text + '\n```\n\n';
    }
    case 'divider':
      return '---\n\n';
    case 'link': {
      const url = (el as any).url || '#';
      const text = mdPlainText(el.children as Descendant[]);
      return `[${text}](${url})`;
    }
    case 'image': {
      const url = (el as any).url || '';
      return `![](${url})\n\n`;
    }
    default:
      return mdPlainText(el.children as Descendant[]) + '\n\n';
  }
}

function serializeMarkdown(value: Descendant[]): string {
  return value.map(mdForNode).join('').trim() + '\n';
}

// --- Minimal Markdown parser (best-effort) ---
function parseMarkdown(md: string): Descendant[] {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: Descendant[] = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    // skip extra blank lines
    if (!line.trim()) {
      i++; continue;
    }

    // code fence
    if (/^```/.test(line.trim())) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i++;
      }
      // skip closing fence
      if (i < lines.length) i++;
      out.push({ type: 'code-block', children: [{ text: codeLines.join('\n') }] } as any);
      continue;
    }

    // divider
    if (/^\s*---+\s*$/.test(line)) {
      out.push({ type: 'divider', children: [{ text: '' }] } as any);
      i++; continue;
    }

    // heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const type = level === 1 ? 'heading-one' : level === 2 ? 'heading-two' : 'heading-three';
      out.push({ type, children: [{ text }] } as any);
      i++; continue;
    }

    // blockquote (accumulate contiguous > lines)
    if (/^\s*>\s?/.test(line)) {
      const bq: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        bq.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push({ type: 'block-quote', children: [{ type: 'paragraph', children: [{ text: bq.join('\n') }] }] } as any);
      continue;
    }

    // list (bulleted)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: any[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '');
        items.push({ type: 'list-item', children: [{ type: 'paragraph', children: [{ text: itemText }] }] });
        i++;
      }
      out.push({ type: 'bulleted-list', children: items } as any);
      continue;
    }

    // list (numbered)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: any[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        items.push({ type: 'list-item', children: [{ type: 'paragraph', children: [{ text: itemText }] }] });
        i++;
      }
      out.push({ type: 'numbered-list', children: items } as any);
      continue;
    }

    // image-only line ![alt](url) -> image element (alt ignored here)
    const img = line.match(/^!\[[^\]]*\]\(([^)]+)\)\s*$/);
    if (img) {
      out.push({ type: 'image', url: img[1], children: [{ text: '' }] } as any);
      i++; continue;
    }

    // link-only line [text](url) -> paragraph with link
    const lk = line.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
    if (lk) {
      out.push({ type: 'paragraph', children: [{ type: 'link', url: lk[2], children: [{ text: lk[1] }] }] } as any);
      i++; continue;
    }

    // paragraph (accumulate until blank line)
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim()) {
      // stop if a new block starts
      if (/^(#{1,3})\s+/.test(lines[i]) || /^```/.test(lines[i]) || /^\s*>\s?/.test(lines[i]) ||
          /^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]) || /^\s*---+\s*$/.test(lines[i])) {
        break;
      }
      para.push(lines[i]);
      i++;
    }
    out.push({ type: 'paragraph', children: [{ text: para.join('\n') }] } as any);
  }

  return out.length ? out : [createParagraph('')];
}

function createParagraph(text: string): ParagraphElement {
  return { type: 'paragraph', children: [{ text }] } as any;
}

export default function SlateEditor({ initialHTML, onHTMLChange }: SlateEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor() as ReactEditor)), []);
  const initialValue = useMemo<Descendant[]>(() => {
    return deserialize(initialHTML);
  }, [initialHTML]);
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const [viewMode, setViewMode] = useState<'editor' | 'html' | 'markdown'>('editor');
  const [previewText, setPreviewText] = useState<string>('');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  useEffect(() => {
    // noop; value is managed by Slate
  }, []);

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  // Keep preview text in sync when switching modes
  useEffect(() => {
    if (viewMode === 'html') {
      setPreviewText(serialize(value));
    } else if (viewMode === 'markdown') {
      setPreviewText(serializeMarkdown(value));
    }
  }, [viewMode, value]);

  // Helper to replace editor content programmatically
  const setEditorContent = useCallback((nodes: Descendant[]) => {
    // Replace editor children and normalize
    (editor as any).children = nodes as any;
    Editor.normalize(editor, { force: true });
    (editor as any).onChange();
    setValue(nodes);
    onHTMLChange?.(serialize(nodes));
  }, [editor, onHTMLChange]);

  const handleChange = (val: Descendant[]) => {
    setValue(val);
    onHTMLChange?.(serialize(val));
  };

  return (
    <div>
      <Toolbar editor={editor} viewMode={viewMode} onChangeViewMode={setViewMode} value={value} onRequestImage={() => setImagePickerOpen(true)} />
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        {viewMode === 'editor' ? (
          <Editable
            className="rich-text focus:outline-none min-h-40"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            spellCheck
            autoFocus={false}
          />
        ) : (
          <div className="min-h-40">
            <textarea
              className="w-full h-40 border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              onBlur={() => {
                try {
                  const nodes = viewMode === 'html' ? deserialize(previewText) : parseMarkdown(previewText);
                  setEditorContent(nodes);
                } catch (e) {
                  // silently ignore parse errors to avoid disrupting typing
                }
              }}
            />
          </div>
        )}
      </Slate>
      <MediaPickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={(item: MediaItem) => {
          if (!item?.url) return;
          insertImage(editor, item.url);
          setImagePickerOpen(false);
        }}
        type="image"
      />
    </div>
  );
}

function Toolbar({ editor, viewMode, onChangeViewMode, value, onRequestImage }: { editor: Editor; viewMode: 'editor' | 'html' | 'markdown'; onChangeViewMode: (m: 'editor' | 'html' | 'markdown') => void; value: Descendant[]; onRequestImage: () => void }) {
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      <IconBtn title="Bold" onClick={() => toggleMark(editor, 'bold')}><Bold size={16} /></IconBtn>
      <IconBtn title="Italic" onClick={() => toggleMark(editor, 'italic')}><Italic size={16} /></IconBtn>
      <IconBtn title="Underline" onClick={() => toggleMark(editor, 'underline')}><UnderlineIcon size={16} /></IconBtn>
      <IconBtn title="Strikethrough" onClick={() => toggleMark(editor, 'strikethrough')}><Strikethrough size={16} /></IconBtn>
      <IconBtn title="Inline Code" onClick={() => toggleMark(editor, 'code')}><Code size={16} /></IconBtn>

      <IconBtn title="Paragraph" onClick={() => toggleBlock(editor, 'paragraph')}><Paragraph size={16} /></IconBtn>
      <IconBtn title="Heading 1" onClick={() => toggleBlock(editor, 'heading-one')}><Heading1 size={16} /></IconBtn>
      <IconBtn title="Heading 2" onClick={() => toggleBlock(editor, 'heading-two')}><Heading2 size={16} /></IconBtn>
      <IconBtn title="Heading 3" onClick={() => toggleBlock(editor, 'heading-three')}><Heading3 size={16} /></IconBtn>

      <IconBtn title="Bulleted List" onClick={() => toggleBlock(editor, 'bulleted-list')}><List size={16} /></IconBtn>
      <IconBtn title="Numbered List" onClick={() => toggleBlock(editor, 'numbered-list')}><ListOrdered size={16} /></IconBtn>
      <IconBtn title="Block Quote" onClick={() => toggleBlock(editor, 'block-quote')}><Quote size={16} /></IconBtn>
      <IconBtn title="Code Block" onClick={() => toggleBlock(editor, 'code-block')}><SquareCode size={16} /></IconBtn>
      <IconBtn title="Horizontal Rule" onClick={() => Transforms.insertNodes(editor, { type: 'divider', children: [{ text: '' }] })}><Minus size={16} /></IconBtn>

      <IconBtn title="Align Left" onClick={() => setAlign(editor, 'left')}><AlignLeft size={16} /></IconBtn>
      <IconBtn title="Align Center" onClick={() => setAlign(editor, 'center')}><AlignCenter size={16} /></IconBtn>
      <IconBtn title="Align Right" onClick={() => setAlign(editor, 'right')}><AlignRight size={16} /></IconBtn>
      <IconBtn title="Justify" onClick={() => setAlign(editor, 'justify')}><AlignJustify size={16} /></IconBtn>

      <IconBtn title="Link" onClick={() => {
        const prev = window.prompt('Enter URL', 'https://');
        if (!prev) return;
        wrapLink(editor, prev);
      }}><LinkIcon size={16} /></IconBtn>
      <IconBtn title="Unlink" onClick={() => unwrapLink(editor)}><Unlink size={16} /></IconBtn>
      <IconBtn title="Image" onClick={onRequestImage}><ImageIcon size={16} /></IconBtn>

      <span className="mx-2 w-px bg-gray-300" />
      <IconBtn title="Editor" onClick={() => onChangeViewMode('editor')}><Eye size={16} /></IconBtn>
      <IconBtn title="Show HTML" onClick={() => onChangeViewMode('html')}><FileCode size={16} /></IconBtn>
      <IconBtn title="Show Markdown" onClick={() => onChangeViewMode('markdown')}><FileText size={16} /></IconBtn>
    </div>
  );
}

function IconBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="px-2 py-1 border rounded text-sm inline-flex items-center gap-1"
    >
      {children}
    </button>
  );
}

const Element = ({ attributes, children, element }: any) => {
  const style = (element.align ? { textAlign: element.align } : undefined) as React.CSSProperties;
  switch (element.type) {
    case 'heading-one':
      return <h1 style={style} {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 style={style} {...attributes}>{children}</h2>;
    case 'heading-three':
      return <h3 style={style} {...attributes}>{children}</h3>;
    case 'block-quote':
      return <blockquote style={style} {...attributes}>{children}</blockquote>;
    case 'numbered-list':
      return <ol style={style} {...attributes}>{children}</ol>;
    case 'bulleted-list':
      return <ul style={style} {...attributes}>{children}</ul>;
    case 'list-item':
      return <li style={style} {...attributes}>{children}</li>;
    case 'code-block':
      return <pre style={style} {...attributes}><code>{children}</code></pre>;
    case 'divider':
      return <div {...attributes}><hr />{children}</div>;
    case 'link':
      return <a {...attributes} href={element.url} target="_blank" rel="noreferrer noopener">{children}</a>;
    case 'image':
      return <div {...attributes}><img src={element.url} alt="" className="max-w-full" />{children}</div>;
    default:
      return <p style={style} {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.code) children = <code>{children}</code>;
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  if (leaf.strikethrough) children = <s>{children}</s>;
  return <span {...attributes}>{children}</span>;
};
