import { describe, expect, it } from 'vitest';
import { getIcon, ICON_OPTIONS, iconMap } from './icons';

describe('icon registry', () => {
    it('resolves every icon the picker offers', () => {
        for (const { name } of ICON_OPTIONS) {
            expect(getIcon(name)).toBe(iconMap[name]);
        }
    });

    it('falls back to a circle for unknown or missing names', () => {
        const fallback = getIcon('circle');

        expect(getIcon('not-a-real-icon')).toBe(fallback);
        expect(getIcon(null)).toBe(fallback);
        expect(getIcon(undefined)).toBe(fallback);
    });

    it('has no duplicate names', () => {
        const names = ICON_OPTIONS.map(({ name }) => name);

        expect(new Set(names).size).toBe(names.length);
    });
});
