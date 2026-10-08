import { describe, expect, it } from 'vitest';
import { partialShortcode } from './shortcode';

const partial = { name: 'callout', label: 'Callout', description: '', body: true, defaults: { tone: 'info', title: '' } };

describe('catalog shortcodes', () => {
    it('includes defaults and places the body between tags', () => {
        expect(partialShortcode(partial, 'Your content')).toBe('[partial name="callout" tone="info" title=""]\nYour content\n[/partial]');
    });
    it('offers self-closing examples for modules without a body', () => {
        expect(partialShortcode({ ...partial, body: false, defaults: {} }, 'Unused')).toBe('[partial name="callout" /]');
    });
    it('keeps unsafe defaults implicit instead of corrupting copied syntax', () => {
        expect(
            partialShortcode({ ...partial, defaults: { name: 'other', 'bad key': 'value', title: 'He said "hello"', value: '&quot;' } }, 'Body'),
        ).toBe('[partial name="callout"]\nBody\n[/partial]');
    });
});
