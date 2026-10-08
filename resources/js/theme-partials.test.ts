import { describe, expect, it } from 'vitest';
import { resolveThemePartial } from './theme-partials';

describe('theme partial loader', () => {
    it('resolves bundled partials lazily and reuses their identity', () => {
        const path = 'modern-react/components/partials/Callout.tsx';
        expect(resolveThemePartial(path)).not.toBeNull();
        expect(resolveThemePartial(path)).toBe(resolveThemePartial(path));
    });
    it.each(['../../pages/Admin.tsx', 'https://evil.test/file.tsx', 'modern-react/components/Page.tsx', 'missing/partials/Missing.tsx'])(
        'refuses unregistered path %s',
        (path) => expect(resolveThemePartial(path)).toBeNull(),
    );
});
