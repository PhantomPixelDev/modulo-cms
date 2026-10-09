import type { CatalogPartial } from '@/pages/admin/partials/shortcode';
import { describe, expect, it } from 'vitest';
import { parsePartial, partialErrors, partialHTML, partialValues, type PartialValue } from './partial-editor';

const value: PartialValue = {
    name: 'callout',
    attributes: { title: 'He said "hello" & <goodbye> \'yes\'' },
    body: '<p><strong>Useful</strong> text</p>',
    hasBody: true,
};
const partial: CatalogPartial = {
    name: 'callout',
    label: 'Callout',
    description: '',
    body: true,
    defaults: {},
    fields: [
        { name: 'tone', type: 'select', label: 'Tone', help: '', required: true, options: [{ value: 'info', label: 'Info' }] },
        { name: 'open', type: 'boolean', label: 'Open', help: '', required: false, options: [] },
        { name: 'image', type: 'image', label: 'Image', help: '', required: false, options: [] },
    ],
};

describe('editable shortcode blocks', () => {
    it('roundtrips quotes, entities and formatted body through HTML', () => {
        const doc = new DOMParser().parseFromString(partialHTML(value), 'text/html');
        expect(parsePartial(doc.body.firstElementChild!.innerHTML)).toEqual(value);
    });
    it('retains nested modules and literal code examples', () => {
        const nested = { ...value, body: '<p>[partial name="disclosure"]Nested[/partial]</p><code>[partial name="example"]</code>' };
        const doc = new DOMParser().parseFromString(partialHTML(nested), 'text/html');
        expect(parsePartial(doc.body.firstElementChild!.innerHTML)?.body).toBe(nested.body);
    });
    it('leaves mixed prose, malformed and adjacent shortcodes alone', () => {
        for (const html of [
            'Before [partial name="callout"]Body[/partial]',
            '[partial name="callout"]No closing',
            '[partial name="a" /][partial name="b" /]',
            '<code>[partial name="callout" /]</code>',
        ])
            expect(parsePartial(html)).toBeNull();
    });
    it('recognizes self-closing legacy shortcodes', () => {
        expect(parsePartial('[partial name="callout" title="Old" /]')).toEqual({
            name: 'callout',
            attributes: { title: 'Old' },
            body: '',
            hasBody: false,
        });
    });
    it('validates typed fields and retains unrelated saved attributes', () => {
        const attributes = partialValues(partial, { old: 'keep me' });
        expect(attributes.open).toBe('false');
        expect(attributes.old).toBe('keep me');
        expect(partialErrors(partial, { ...attributes, image: 'javascript:alert(1)' }, 'Invalid')).toEqual({ tone: 'Invalid', image: 'Invalid' });
        expect(partialErrors(partial, { ...attributes, tone: 'info', image: '/storage/photo.webp' }, 'Invalid')).toEqual({});
    });
});
