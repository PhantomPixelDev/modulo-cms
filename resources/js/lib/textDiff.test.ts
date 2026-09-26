import { describe, expect, it } from 'vitest';
import { diffText } from './textDiff';

describe('diffText', () => {
    it('marks nothing when the texts are equal', () => {
        expect(diffText('Hello world', 'Hello world')).toEqual([{ type: 'same', text: 'Hello world' }]);
    });

    it('shows a changed word inside a paragraph', () => {
        expect(diffText('The quick fox', 'The slow fox')).toEqual([
            { type: 'same', text: 'The ' },
            { type: 'removed', text: 'quick' },
            { type: 'added', text: 'slow' },
            { type: 'same', text: ' fox' },
        ]);
    });

    it('keeps untouched paragraphs whole', () => {
        const parts = diffText('One\nTwo\nThree', 'One\nTwo\nThree\nFour');
        expect(parts).toEqual([
            { type: 'same', text: 'One\nTwo\nThree' },
            { type: 'added', text: '\nFour' },
        ]);
    });

    it('handles empty sides', () => {
        expect(diffText('', 'New')).toEqual([{ type: 'added', text: 'New' }]);
        expect(diffText('Old', '')).toEqual([{ type: 'removed', text: 'Old' }]);
    });
});
