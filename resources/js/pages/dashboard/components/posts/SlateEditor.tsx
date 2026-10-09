import { escapePartialText, parsePartial, partialHTML, type PartialValue } from '@/components/content/partial-editor';
import { useTranslation } from '@/hooks/useTranslation';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Boxes,
    Code,
    Eye,
    FileCode,
    FileText,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Minus,
    Type as Paragraph,
    Quote,
    SquareCode,
    Strikethrough,
    Underline as UnderlineIcon,
    Unlink,
} from 'lucide-react';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseEditor, createEditor, Descendant, Editor, Range, Element as SlateElement, Text, Transforms } from 'slate';
import { HistoryEditor, withHistory } from 'slate-history';
import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import type { MediaItem } from '../../types';
import MediaPickerDialog from '../media/MediaPickerDialog';

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
type PartialElement = PartialValue & { type: 'partial'; children: [{ text: '' }] };

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
    | ImageElement
    | PartialElement;

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
    partialsEnabled?: boolean;
}

const PartialDialog = lazy(() => import('@/components/content/PartialDialog').then((module) => ({ default: module.PartialDialog })));

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

function isBlockActive(editor: Editor, type: CustomElement['type']) {
    const [match] = Array.from(
        Editor.nodes(editor, {
            match: (n) => SlateElement.isElement(n) && (n as SlateElement).type === type,
        }),
    );
    return !!match;
}

function toggleBlock(editor: Editor, type: CustomElement['type']) {
    const isActive = isBlockActive(editor, type);
    const isList = LIST_TYPES.includes(type);

    Transforms.unwrapNodes(editor, {
        match: (n) => SlateElement.isElement(n) && LIST_TYPES.includes((n as SlateElement).type as string),
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

    Transforms.setNodes<SlateElement>(editor, { type: newType } as Partial<SlateElement>);

    if (!isActive && isList) {
        const block: NumberedListElement | BulletedListElement = { type: type === 'numbered-list' ? 'numbered-list' : 'bulleted-list', children: [] };
        Transforms.wrapNodes(editor, block);
    }
}

function isMarkActive(editor: Editor, format: keyof Omit<FormattedText, 'text'>) {
    const marks = Editor.marks(editor) as Partial<FormattedText> | null;
    return marks ? marks[format] === true : false;
}

function toggleMark(editor: Editor, format: keyof Omit<FormattedText, 'text'>) {
    const isActive = isMarkActive(editor, format);
    if (isActive) Editor.removeMark(editor, format);
    else Editor.addMark(editor, format, true);
}

function setAlign(editor: Editor, align: Align) {
    Transforms.setNodes<SlateElement>(editor, { align } as Partial<SlateElement>, { match: (n) => SlateElement.isElement(n) });
}

function isLinkActive(editor: Editor) {
    const [link] = Editor.nodes(editor, { match: (n) => SlateElement.isElement(n) && (n as SlateElement).type === 'link' });
    return !!link;
}

function unwrapLink(editor: Editor) {
    Transforms.unwrapNodes(editor, { match: (n) => SlateElement.isElement(n) && (n as SlateElement).type === 'link' });
}

function wrapLink(editor: Editor, url: string) {
    if (isLinkActive(editor)) unwrapLink(editor);
    const { selection } = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link: LinkElement = { type: 'link', url, children: isCollapsed ? [{ text: url }] : [] };
    if (isCollapsed) {
        Transforms.insertNodes(editor, link);
    } else {
        Transforms.wrapNodes(editor, link, { split: true });
        Transforms.collapse(editor, { edge: 'end' });
    }
}

function insertImage(editor: Editor, url: string) {
    const image: ImageElement = { type: 'image', url, children: [{ text: '' }] };
    Transforms.insertNodes(editor, image);
}

// Basic HTML serialization/deserialization for supported nodes
function serializeNode(node: Descendant): string {
    if (Text.isText(node)) {
        let str = escapePartialText(node.text);
        if ((node as FormattedText).code) str = `<code>${str}</code>`;
        if ((node as FormattedText).bold) str = `<strong>${str}</strong>`;
        if ((node as FormattedText).italic) str = `<em>${str}</em>`;
        if ((node as FormattedText).underline) str = `<u>${str}</u>`;
        if ((node as FormattedText).strikethrough) str = `<s>${str}</s>`;
        return str;
    }
    const element = node as SlateElement;
    const align = ('align' in element ? element.align : undefined) as Align | undefined;
    const style = align ? ` style="text-align:${align}"` : '';
    const children = (element.children as Descendant[]).map(serializeNode).join('');
    switch (element.type) {
        case 'partial':
            return partialHTML(element);
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
            return `<a href="${element.url}">${children}</a>`;
        case 'image':
            return `<img src="${element.url}" />`;
        default:
            return `<p${style}>${children}</p>`;
    }
}

function serialize(value: Descendant[]): string {
    return value.map(serializeNode).join('');
}

function deserialize(html?: string, partialsEnabled = true): Descendant[] {
    if (!html) return [createParagraph('')];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.body;
    const children: Descendant[] = [];
    body.childNodes.forEach((n) => {
        const el = n as HTMLElement;
        if (el.nodeName === '#text') {
            const partial = partialsEnabled ? parsePartial(escapePartialText(el.textContent || '')) : null;
            if (partial) {
                children.push({ type: 'partial', ...partial, children: [{ text: '' }] });
                return;
            }
            children.push(createParagraph(el.textContent || ''));
            return;
        }
        children.push(deserializeElement(el, partialsEnabled));
    });
    const last = children.at(-1);
    if (last && SlateElement.isElement(last) && last.type === 'partial') children.push(createParagraph(''));
    return children.length ? children : [createParagraph(body.textContent || '')];
}

function deserializeElement(el: HTMLElement, partialsEnabled = true): Descendant {
    if (partialsEnabled && (el.nodeName === 'P' || (el.nodeName === 'DIV' && el.classList.contains('modulo-editor-partial')))) {
        const partial = parsePartial(el.innerHTML);
        if (partial) return { type: 'partial', ...partial, children: [{ text: '' }] };
    }
    const styleAlign = (el.style?.textAlign as Align | undefined) || undefined;
    const align = styleAlign && ['left', 'center', 'right', 'justify'].includes(styleAlign) ? styleAlign : undefined;
    const nodeChildren = Array.from(el.childNodes).map((cn) => deserializeChild(cn as HTMLElement, partialsEnabled));
    const children = (nodeChildren.length ? nodeChildren : [{ text: '' }]) as Descendant[];
    switch (el.nodeName) {
        case 'H1':
            return { type: 'heading-one', align, children };
        case 'H2':
            return { type: 'heading-two', align, children };
        case 'H3':
            return { type: 'heading-three', align, children };
        case 'BLOCKQUOTE':
            return { type: 'block-quote', align, children };
        case 'OL':
            return { type: 'numbered-list', align, children };
        case 'UL':
            return { type: 'bulleted-list', align, children };
        case 'LI':
            return { type: 'list-item', align, children };
        case 'PRE':
            return { type: 'code-block', align, children };
        case 'HR':
            return { type: 'divider', children: [{ text: '' }] };
        case 'A':
            return { type: 'link', url: el.getAttribute('href') || '#', children };
        case 'IMG':
            return { type: 'image', url: el.getAttribute('src') || '', children: [{ text: '' }] };
        case 'P':
        default:
            return { type: 'paragraph', align, children };
    }
}

function deserializeChild(el: HTMLElement, partialsEnabled = true): Descendant {
    if (el.nodeType === Node.TEXT_NODE) {
        return { text: el.textContent || '' };
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return { text: '' };
    const tag = el.nodeName;
    const childNodes = Array.from(el.childNodes).map((cn) => deserializeChild(cn as HTMLElement, partialsEnabled));
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
            return deserializeElement(el, partialsEnabled);
    }
    return node || { text: '' };
}

function wrapMarks(nodes: Descendant[], mark: keyof Omit<FormattedText, 'text'>): Descendant {
    const apply = (node: Descendant): Descendant =>
        Text.isText(node) ? { ...node, [mark]: true } : ({ ...node, children: node.children.map(apply) } as CustomElement);
    return nodes.map(apply)[0] ?? { text: '' };
}

// --- Markdown serialization helpers ---
function mdPlainText(nodes: Descendant[] | undefined): string {
    if (!nodes) return '';
    const parts: string[] = [];
    const walk = (n: Descendant) => {
        if (Text.isText(n)) {
            parts.push(n.text);
        } else {
            n.children.forEach(walk);
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
        case 'partial':
            return partialHTML(el) + '\n\n';
        case 'heading-one':
            return `# ${mdPlainText(el.children as Descendant[])}\n\n`;
        case 'heading-two':
            return `## ${mdPlainText(el.children as Descendant[])}\n\n`;
        case 'heading-three':
            return `### ${mdPlainText(el.children as Descendant[])}\n\n`;
        case 'block-quote': {
            const text = mdPlainText(el.children as Descendant[]);
            return (
                text
                    .split(/\n/)
                    .map((l) => (l ? `> ${l}` : '>'))
                    .join('\n') + '\n\n'
            );
        }
        case 'numbered-list': {
            let i = 1;
            const items = el.children
                .filter((node): node is CustomElement => SlateElement.isElement(node))
                .map((li) => `${i++}. ${mdPlainText(li.children)}`)
                .join('\n');
            return items + '\n\n';
        }
        case 'bulleted-list': {
            const items = el.children
                .filter((node): node is CustomElement => SlateElement.isElement(node))
                .map((li) => `- ${mdPlainText(li.children)}`)
                .join('\n');
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
            const url = el.url || '#';
            const text = mdPlainText(el.children as Descendant[]);
            return `[${text}](${url})`;
        }
        case 'image': {
            const url = el.url || '';
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
function parseMarkdown(md: string, partialsEnabled = true): Descendant[] {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const out: Descendant[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // skip extra blank lines
        if (!line.trim()) {
            i++;
            continue;
        }

        // code fence
        if (partialsEnabled && line.trim().startsWith('<div class="modulo-editor-partial">')) {
            let end = i;
            let partial: PartialValue | null = null;
            while (end < lines.length && !partial) {
                const candidate = lines.slice(i, end + 1).join('\n');
                if (candidate.trim().endsWith('</div>')) {
                    const root = new DOMParser().parseFromString(candidate, 'text/html').body.firstElementChild;
                    if (root) partial = parsePartial(root.innerHTML);
                }
                end++;
            }
            if (partial) {
                out.push({ type: 'partial', ...partial, children: [{ text: '' }] });
                i = end;
                continue;
            }
        }
        if (/^```/.test(line.trim())) {
            i++;
            const codeLines: string[] = [];
            while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
                codeLines.push(lines[i]);
                i++;
            }
            // skip closing fence
            if (i < lines.length) i++;
            out.push({ type: 'code-block', children: [{ text: codeLines.join('\n') }] });
            continue;
        }

        // divider
        if (/^\s*---+\s*$/.test(line)) {
            out.push({ type: 'divider', children: [{ text: '' }] });
            i++;
            continue;
        }

        // heading
        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
            const level = h[1].length;
            const text = h[2];
            const type = level === 1 ? 'heading-one' : level === 2 ? 'heading-two' : 'heading-three';
            out.push({ type, children: [{ text }] });
            i++;
            continue;
        }

        // blockquote (accumulate contiguous > lines)
        if (/^\s*>\s?/.test(line)) {
            const bq: string[] = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                bq.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }
            out.push({ type: 'block-quote', children: [{ type: 'paragraph', children: [{ text: bq.join('\n') }] }] });
            continue;
        }

        // list (bulleted)
        if (/^\s*[-*]\s+/.test(line)) {
            const items: ListItemElement[] = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                const itemText = lines[i].replace(/^\s*[-*]\s+/, '');
                items.push({ type: 'list-item', children: [{ type: 'paragraph', children: [{ text: itemText }] }] });
                i++;
            }
            out.push({ type: 'bulleted-list', children: items });
            continue;
        }

        // list (numbered)
        if (/^\s*\d+\.\s+/.test(line)) {
            const items: ListItemElement[] = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
                items.push({ type: 'list-item', children: [{ type: 'paragraph', children: [{ text: itemText }] }] });
                i++;
            }
            out.push({ type: 'numbered-list', children: items });
            continue;
        }

        // image-only line ![alt](url) -> image element (alt ignored here)
        const img = line.match(/^!\[[^\]]*\]\(([^)]+)\)\s*$/);
        if (img) {
            out.push({ type: 'image', url: img[1], children: [{ text: '' }] });
            i++;
            continue;
        }

        // link-only line [text](url) -> paragraph with link
        const lk = line.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
        if (lk) {
            out.push({ type: 'paragraph', children: [{ type: 'link', url: lk[2], children: [{ text: lk[1] }] }] });
            i++;
            continue;
        }

        // paragraph (accumulate until blank line)
        const para: string[] = [line];
        i++;
        while (i < lines.length && lines[i].trim()) {
            // stop if a new block starts
            if (
                /^(#{1,3})\s+/.test(lines[i]) ||
                /^```/.test(lines[i]) ||
                /^\s*>\s?/.test(lines[i]) ||
                /^\s*[-*]\s+/.test(lines[i]) ||
                /^\s*\d+\.\s+/.test(lines[i]) ||
                /^\s*---+\s*$/.test(lines[i])
            ) {
                break;
            }
            para.push(lines[i]);
            i++;
        }
        out.push({ type: 'paragraph', children: [{ text: para.join('\n') }] });
    }

    return out.length ? out : [createParagraph('')];
}

function createParagraph(text: string): ParagraphElement {
    return { type: 'paragraph', children: [{ text }] };
}

export default function SlateEditor({ initialHTML, onHTMLChange, partialsEnabled = true }: SlateEditorProps) {
    const { t } = useTranslation();
    const editor = useMemo(() => {
        const instance = withHistory(withReact(createEditor() as ReactEditor));
        const isVoid = instance.isVoid;
        instance.isVoid = (element) => element.type === 'partial' || isVoid(element);
        const normalizeNode = instance.normalizeNode;
        instance.normalizeNode = (entry, options) => {
            const [node, path] = entry;
            if (path.length === 0 && Editor.isEditor(node)) {
                const last = node.children.at(-1);
                if (last && SlateElement.isElement(last) && last.type === 'partial') {
                    Transforms.insertNodes(instance, createParagraph(''), { at: [node.children.length] });
                    return;
                }
            }
            normalizeNode(entry, options);
        };
        return instance;
    }, []);
    const initialValue = useMemo<Descendant[]>(() => {
        return deserialize(initialHTML, partialsEnabled);
    }, [initialHTML, partialsEnabled]);
    const [value, setValue] = useState<Descendant[]>(initialValue);
    const lastHTML = useRef(serialize(initialValue));
    const [viewMode, setViewMode] = useState<'editor' | 'html' | 'markdown'>('editor');
    const [previewText, setPreviewText] = useState<string>('');
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    const [partialOpen, setPartialOpen] = useState(false);
    const [editingPartial, setEditingPartial] = useState<PartialValue | undefined>();
    const savedRange = useRef<ReturnType<typeof Editor.rangeRef> | null>(null);
    const savedPath = useRef<ReturnType<typeof Editor.pathRef> | null>(null);

    useEffect(() => {
        return () => {
            savedRange.current?.unref();
            savedPath.current?.unref();
        };
    }, []);

    const editPartial = useCallback(
        (element: PartialElement) => {
            savedPath.current?.unref();
            savedPath.current = Editor.pathRef(editor, ReactEditor.findPath(editor, element));
            setEditingPartial({ name: element.name, attributes: element.attributes, body: element.body, hasBody: element.hasBody });
            setPartialOpen(true);
        },
        [editor],
    );
    const renderElement = useCallback((props: RenderElementProps) => <Element {...props} onEditPartial={editPartial} />, [editPartial]);
    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

    // Keep preview text in sync when switching modes
    useEffect(() => {
        if (viewMode === 'html') {
            setPreviewText(serialize(value));
        } else if (viewMode === 'markdown') {
            setPreviewText(serializeMarkdown(value));
        }
    }, [viewMode, value]);

    // Helper to replace editor content programmatically
    const setEditorContent = useCallback(
        (nodes: Descendant[]) => {
            // Replace editor children and normalize
            editor.children = nodes;
            Editor.normalize(editor, { force: true });
            editor.onChange();
            setValue(nodes);
            const html = serialize(nodes);
            lastHTML.current = html;
            onHTMLChange?.(html);
        },
        [editor, onHTMLChange],
    );

    const handleChange = (val: Descendant[]) => {
        setValue(val);
        const html = serialize(val);
        if (html !== lastHTML.current) {
            lastHTML.current = html;
            onHTMLChange?.(html);
        }
    };

    return (
        <div>
            <Toolbar
                editor={editor}
                onChangeViewMode={setViewMode}
                onRequestImage={() => setImagePickerOpen(true)}
                onRequestPartial={
                    partialsEnabled && viewMode === 'editor'
                        ? () => {
                              savedRange.current?.unref();
                              savedPath.current?.unref();
                              savedPath.current = null;
                              savedRange.current = editor.selection ? Editor.rangeRef(editor, editor.selection) : null;
                              setEditingPartial(undefined);
                              setPartialOpen(true);
                          }
                        : undefined
                }
            />
            <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
                {viewMode === 'editor' ? (
                    <Editable
                        aria-label="Content"
                        className="rich-text min-h-40 focus:outline-none"
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        spellCheck
                        autoFocus={false}
                    />
                ) : (
                    <div className="min-h-40">
                        <textarea
                            className="h-40 w-full rounded-md border border-input bg-muted/40 p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            onBlur={() => {
                                try {
                                    const nodes =
                                        viewMode === 'html' ? deserialize(previewText, partialsEnabled) : parseMarkdown(previewText, partialsEnabled);
                                    setEditorContent(nodes);
                                } catch {
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
            {partialOpen && (
                <Suspense fallback={<p role="status">{t('dashboard.partials.loading')}</p>}>
                    <PartialDialog
                        open={partialOpen}
                        initial={editingPartial}
                        onOpenChange={(next) => {
                            setPartialOpen(next);
                            if (!next) {
                                const range = savedRange.current?.unref();
                                savedRange.current = null;
                                savedPath.current?.unref();
                                savedPath.current = null;
                                if (range) Transforms.select(editor, range);
                                requestAnimationFrame(() => ReactEditor.focus(editor));
                            }
                        }}
                        onApply={(partial) => {
                            HistoryEditor.withNewBatch(editor, () => {
                                const path = savedPath.current?.current;
                                if (path) Transforms.setNodes(editor, { ...partial, type: 'partial' }, { at: path });
                                else {
                                    const range = savedRange.current?.unref();
                                    savedRange.current = null;
                                    if (range) Transforms.select(editor, range);
                                    else Transforms.select(editor, Editor.end(editor, []));
                                    Transforms.insertNodes(editor, [{ type: 'partial', ...partial, children: [{ text: '' }] }, createParagraph('')], {
                                        select: true,
                                    });
                                }
                            });
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
}

function Toolbar({
    editor,
    onChangeViewMode,
    onRequestImage,
    onRequestPartial,
}: {
    editor: Editor;
    onChangeViewMode: (m: 'editor' | 'html' | 'markdown') => void;
    onRequestImage: () => void;
    onRequestPartial?: () => void;
}) {
    const { t } = useTranslation();
    return (
        <div className="mb-3 flex flex-wrap items-center gap-0.5 rounded-lg border bg-muted/40 p-1">
            <IconBtn title="Bold" onClick={() => toggleMark(editor, 'bold')}>
                <Bold size={16} />
            </IconBtn>
            <IconBtn title="Italic" onClick={() => toggleMark(editor, 'italic')}>
                <Italic size={16} />
            </IconBtn>
            <IconBtn title="Underline" onClick={() => toggleMark(editor, 'underline')}>
                <UnderlineIcon size={16} />
            </IconBtn>
            <IconBtn title="Strikethrough" onClick={() => toggleMark(editor, 'strikethrough')}>
                <Strikethrough size={16} />
            </IconBtn>
            <IconBtn title="Inline Code" onClick={() => toggleMark(editor, 'code')}>
                <Code size={16} />
            </IconBtn>

            <IconBtn title="Paragraph" onClick={() => toggleBlock(editor, 'paragraph')}>
                <Paragraph size={16} />
            </IconBtn>
            <IconBtn title="Heading 1" onClick={() => toggleBlock(editor, 'heading-one')}>
                <Heading1 size={16} />
            </IconBtn>
            <IconBtn title="Heading 2" onClick={() => toggleBlock(editor, 'heading-two')}>
                <Heading2 size={16} />
            </IconBtn>
            <IconBtn title="Heading 3" onClick={() => toggleBlock(editor, 'heading-three')}>
                <Heading3 size={16} />
            </IconBtn>

            <IconBtn title="Bulleted List" onClick={() => toggleBlock(editor, 'bulleted-list')}>
                <List size={16} />
            </IconBtn>
            <IconBtn title="Numbered List" onClick={() => toggleBlock(editor, 'numbered-list')}>
                <ListOrdered size={16} />
            </IconBtn>
            <IconBtn title="Block Quote" onClick={() => toggleBlock(editor, 'block-quote')}>
                <Quote size={16} />
            </IconBtn>
            <IconBtn title="Code Block" onClick={() => toggleBlock(editor, 'code-block')}>
                <SquareCode size={16} />
            </IconBtn>
            <IconBtn title="Horizontal Rule" onClick={() => Transforms.insertNodes(editor, { type: 'divider', children: [{ text: '' }] })}>
                <Minus size={16} />
            </IconBtn>

            <IconBtn title="Align Left" onClick={() => setAlign(editor, 'left')}>
                <AlignLeft size={16} />
            </IconBtn>
            <IconBtn title="Align Center" onClick={() => setAlign(editor, 'center')}>
                <AlignCenter size={16} />
            </IconBtn>
            <IconBtn title="Align Right" onClick={() => setAlign(editor, 'right')}>
                <AlignRight size={16} />
            </IconBtn>
            <IconBtn title="Justify" onClick={() => setAlign(editor, 'justify')}>
                <AlignJustify size={16} />
            </IconBtn>

            <IconBtn
                title="Link"
                onClick={() => {
                    const prev = window.prompt('Enter URL', 'https://');
                    if (!prev) return;
                    wrapLink(editor, prev);
                }}
            >
                <LinkIcon size={16} />
            </IconBtn>
            <IconBtn title="Unlink" onClick={() => unwrapLink(editor)}>
                <Unlink size={16} />
            </IconBtn>
            <IconBtn title="Image" onClick={onRequestImage}>
                <ImageIcon size={16} />
            </IconBtn>

            <span className="mx-1.5 w-px self-stretch bg-border" />
            {onRequestPartial && (
                <IconBtn title={t('dashboard.partials.insert')} onClick={onRequestPartial}>
                    <Boxes size={16} />
                </IconBtn>
            )}
            <IconBtn title="Editor" onClick={() => onChangeViewMode('editor')}>
                <Eye size={16} />
            </IconBtn>
            <IconBtn title="Show HTML" onClick={() => onChangeViewMode('html')}>
                <FileCode size={16} />
            </IconBtn>
            <IconBtn title="Show Markdown" onClick={() => onChangeViewMode('markdown')}>
                <FileText size={16} />
            </IconBtn>
        </div>
    );
}

function IconBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-xs"
        >
            {children}
        </button>
    );
}

const Element = ({ attributes, children, element, onEditPartial }: RenderElementProps & { onEditPartial: (element: PartialElement) => void }) => {
    const { t } = useTranslation();
    const style = 'align' in element && element.align ? { textAlign: element.align } : undefined;
    switch (element.type) {
        case 'partial':
            return (
                <div {...attributes} data-partial-name={element.name} className="my-3 rounded-lg border bg-muted/40 p-4">
                    <div contentEditable={false} className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <strong>{element.name}</strong>
                            <p className="text-sm text-muted-foreground">{t('dashboard.partials.module_block')}</p>
                        </div>
                        <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onEditPartial(element)}
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            {t('dashboard.partials.edit')}
                        </button>
                    </div>
                    <span className="sr-only">{children}</span>
                </div>
            );
        case 'heading-one':
            return (
                <h1 style={style} {...attributes}>
                    {children}
                </h1>
            );
        case 'heading-two':
            return (
                <h2 style={style} {...attributes}>
                    {children}
                </h2>
            );
        case 'heading-three':
            return (
                <h3 style={style} {...attributes}>
                    {children}
                </h3>
            );
        case 'block-quote':
            return (
                <blockquote style={style} {...attributes}>
                    {children}
                </blockquote>
            );
        case 'numbered-list':
            return (
                <ol style={style} {...attributes}>
                    {children}
                </ol>
            );
        case 'bulleted-list':
            return (
                <ul style={style} {...attributes}>
                    {children}
                </ul>
            );
        case 'list-item':
            return (
                <li style={style} {...attributes}>
                    {children}
                </li>
            );
        case 'code-block':
            return (
                <pre style={style} {...attributes}>
                    <code>{children}</code>
                </pre>
            );
        case 'divider':
            return (
                <div {...attributes}>
                    <hr />
                    {children}
                </div>
            );
        case 'link':
            return (
                <a {...attributes} href={element.url} target="_blank" rel="noreferrer noopener">
                    {children}
                </a>
            );
        case 'image':
            return (
                <div {...attributes}>
                    <img src={element.url} alt="" className="max-w-full" />
                    {children}
                </div>
            );
        default:
            return (
                <p style={style} {...attributes}>
                    {children}
                </p>
            );
    }
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
    if (leaf.code) children = <code>{children}</code>;
    if (leaf.bold) children = <strong>{children}</strong>;
    if (leaf.italic) children = <em>{children}</em>;
    if (leaf.underline) children = <u>{children}</u>;
    if (leaf.strikethrough) children = <s>{children}</s>;
    return <span {...attributes}>{children}</span>;
};
