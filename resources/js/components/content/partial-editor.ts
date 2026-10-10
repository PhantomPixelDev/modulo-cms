import type { CatalogPartial, PartialField } from '@/pages/admin/partials/shortcode';

export interface PartialValue {
    name: string;
    attributes: Record<string, string>;
    body: string;
    hasBody: boolean;
}

export function escapePartialText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function decode(value: string): string {
    const el = document.createElement('textarea');
    el.innerHTML = value;
    return el.value;
}

export function partialCode(value: PartialValue): string {
    const attributes = Object.entries(value.attributes)
        .filter(([name]) => name !== 'name' && /^[a-z][a-z0-9_-]*$/.test(name))
        .map(([name, text]) => ` ${name}="${escapePartialText(text)}"`)
        .join('');
    const opening = `[partial name="${value.name}"${attributes}`;
    return value.hasBody ? `${opening}]${value.body}[/partial]` : `${opening} /]`;
}

export function partialHTML(value: PartialValue): string {
    const code = partialCode({ ...value, body: '' });
    const html = value.hasBody ? escapePartialText(code.slice(0, -'[/partial]'.length)) + value.body + '[/partial]' : escapePartialText(code);
    // A plain div survives the content sanitizer; no executable metadata is stored.
    return `<div class="modulo-editor-partial">${html}</div>`;
}

const tokenPattern = /\[(\/?)(partial)\b((?:"[^"]*"|'[^']*'|&quot;[\s\S]*?&quot;|[^\]"'])*)\]/g;

/** Recognize only a complete standalone module. Mixed prose remains ordinary content. */
export function parsePartial(html: string): PartialValue | null {
    const source = html.trim();
    const tokens = [...source.matchAll(tokenPattern)];
    const first = tokens[0];
    if (!first || first.index !== 0 || first[1]) return null;
    const selfClosing = /\/\s*$/.test(first[3]);
    let end = first[0].length;
    let body = '';
    if (!selfClosing) {
        let depth = 1;
        const literals = [...source.matchAll(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi)];
        for (const token of tokens.slice(1)) {
            if (literals.some((literal) => token.index! >= literal.index! && token.index! < literal.index! + literal[0].length)) continue;
            if (token[1]) depth--;
            else if (!/\/\s*$/.test(token[3])) depth++;
            if (!depth) {
                body = source.slice(end, token.index);
                end = token.index! + token[0].length;
                break;
            }
        }
        if (depth !== 0) return null;
    }
    if (end !== source.length) return null;
    const attributes: Record<string, string> = {};
    const decoded = decode(first[3]);
    for (const match of decoded.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g)) {
        attributes[match[1]] = decode(match[2] ?? match[3] ?? match[4] ?? '');
    }
    const name = attributes.name;
    if (!name || !/^[a-z][a-z0-9_-]*$/.test(name)) return null;
    delete attributes.name;
    return { name, attributes, body, hasBody: !selfClosing };
}

export function partialFields(partial: CatalogPartial): PartialField[] {
    return (
        partial.fields ?? Object.keys(partial.defaults).map((name) => ({ name, type: 'text', label: name, help: '', required: false, options: [] }))
    );
}

export function partialValues(partial: CatalogPartial, saved: Record<string, string> = {}): Record<string, string> {
    const empty = Object.fromEntries(partialFields(partial).map((field) => [field.name, field.type === 'boolean' ? 'false' : '']));
    return { ...empty, ...partial.defaults, ...saved };
}

export function partialErrors(partial: CatalogPartial, attributes: Record<string, string>, message: string): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const field of partialFields(partial)) {
        const value = attributes[field.name] ?? '';
        if (
            (field.required && !value.trim()) ||
            (value !== '' && field.type === 'select' && !field.options.some((option) => option.value === value)) ||
            (field.type === 'boolean' && value !== 'true' && value !== 'false') ||
            (value !== '' && field.type === 'image' && (!/^(https?:\/\/|\/(?!\/))/i.test(value) || /[\s\\]/.test(value))) ||
            value.length > 2000
        )
            errors[field.name] = message;
    }
    return errors;
}
