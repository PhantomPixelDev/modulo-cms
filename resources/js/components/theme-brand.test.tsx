import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeBrand, safeLogoUrl } from './theme-brand';

describe('theme branding', () => {
    it('uses the site identity when custom text is empty and keeps image-only logos accessible', () => {
        render(<ThemeBrand site={{ name: 'My site', logo: '/storage/logo.png' }} values={{ logo_show_text: false }} />);
        expect(screen.getByText('My site')).toHaveClass('sr-only');
        expect(screen.getByTestId('theme-brand').querySelector('img')).toHaveAttribute('src', '/storage/logo.png');
    });

    it('supports text-only and icon branding without interpreting HTML', () => {
        const { rerender } = render(<ThemeBrand values={{ logo_style: 'text', logo_text: '<b>My studio</b>', logo_show_text: false }} />);
        expect(screen.getByText('<b>My studio</b>')).not.toHaveClass('sr-only');
        expect(screen.getByTestId('theme-brand').querySelector('img,svg,b')).toBeNull();
        rerender(<ThemeBrand values={{ logo_style: 'icon', logo_icon: 'constructor' }} />);
        expect(screen.getByTestId('theme-brand').querySelector('svg')).not.toBeNull();
    });

    it('previews the dark logo and bounds sizes', () => {
        render(<ThemeBrand dark values={{ logo_style: 'image', logo_image: '/logo.png', dark_logo_image: '/dark.png', logo_height: 999 }} />);
        const image = screen.getByTestId('theme-brand').querySelector('img');
        expect(image).toHaveAttribute('src', '/dark.png');
        expect(image).toHaveStyle({ height: '80px' });
    });

    it('rejects executable, protocol-relative and whitespace URLs', () => {
        for (const url of ['javascript:alert(1)', 'data:image/svg+xml,bad', '//example.com/a.png', '/a b.png'])
            expect(safeLogoUrl(url)).toBeUndefined();
        expect(safeLogoUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png');
    });
});
