import { describe, expect, it } from 'vitest';
import { contrastingText, themeSettingsCss } from './theme-settings';

describe('theme appearance styles', () => {
    it('scopes light and dark palettes to the public theme and maps layout options', () => {
        const css = themeSettingsCss({
            primary_color: '#be123c',
            dark_primary_color: '#ffffff',
            font_family: 'helvetica',
            container_width: 'wide',
            corner_style: 'square',
        });
        expect(css).toContain('.theme-frontend.theme-frontend{');
        expect(css).toContain('.dark .theme-frontend.theme-frontend{');
        expect(css).toContain('--primary:#be123c');
        expect(css).toContain('--primary-foreground:#ffffff');
        expect(css).toContain('--theme-container-width:80rem');
        expect(css).toContain('font-family:Helvetica, Arial, sans-serif');
        expect(css).toContain('--radius:0px');
        expect(css).not.toContain(':root');
    });
    it('does not interpolate arbitrary CSS or undeclared tokens', () => {
        expect(
            themeSettingsCss({
                primary_color: '#fff;}</style>',
                font_family: 'url(https://evil.test)',
                container_width: '999px',
                corner_style: 'evil',
                code: 'bad',
            }),
        ).toBe('');
    });
    it('uses readable text on very light and dark brand colors', () => {
        expect(contrastingText('#ffffff')).toBe('#111111');
        expect(contrastingText('#000000')).toBe('#ffffff');
    });
});
