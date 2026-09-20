import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTranslation } from './useTranslation';

const pageProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: pageProps.current }),
}));

function withProps(props: Record<string, unknown>) {
    pageProps.current = props;

    return renderHook(() => useTranslation()).result.current;
}

describe('useTranslation', () => {
    it('resolves nested keys with dot notation', () => {
        const { t } = withProps({ translations: { dashboard: { comments: { title: 'Comments' } } } });

        expect(t('dashboard.comments.title')).toBe('Comments');
    });

    it('falls back to the key, or an explicit fallback, when missing', () => {
        const { t } = withProps({ translations: { dashboard: {} } });

        expect(t('dashboard.missing')).toBe('dashboard.missing');
        expect(t('dashboard.missing', {}, 'Default')).toBe('Default');
    });

    it('replaces placeholders, including the capitalized form', () => {
        const { t } = withProps({ translations: { common: { greeting: 'Hello :name (:Name)' } } });

        expect(t('common.greeting', { name: 'ada' })).toBe('Hello ada (Ada)');
    });

    it('merges theme translations under the theme domain', () => {
        const { t } = withProps({
            translations: { theme: { existing: 'kept' } },
            themeTranslations: { hero: 'From theme' },
        });

        expect(t('theme.hero')).toBe('From theme');
        expect(t('theme.existing')).toBe('kept');
    });

    it('picks singular or plural forms', () => {
        const { choice } = withProps({ translations: { common: { items: 'one item|:count items' } } });

        expect(choice('common.items', 1)).toBe('one item');
        expect(choice('common.items', 3)).toBe('3 items');
    });

    it('reports locale direction', () => {
        const rtl = withProps({ locale: { current: 'ar', direction: 'rtl', name: 'Arabic', native_name: 'x', available: [] } });

        expect(rtl.isRTL).toBe(true);
        expect(rtl.locale).toBe('ar');
    });
});
