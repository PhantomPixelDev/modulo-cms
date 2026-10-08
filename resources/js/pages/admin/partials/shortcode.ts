export interface CatalogPartial {
    name: string;
    label: string;
    description: string;
    body: boolean;
    defaults: Record<string, string>;
}

export function partialShortcode(partial: CatalogPartial, body: string): string {
    // Unusual defaults remain implicit: their quotes/entities need not be pasted
    // through the rich-text editor. The renderer always applies manifest defaults.
    const attributes = Object.entries(partial.defaults)
        .filter(([name, value]) => name !== 'name' && /^[\w-]+$/.test(name) && !/[&"'<>\r\n]/.test(value))
        .map(([name, value]) => ` ${name}="${value}"`)
        .join('');
    const opening = `[partial name="${partial.name}"${attributes}`;
    return partial.body ? `${opening}]\n${body}\n[/partial]` : `${opening} /]`;
}
