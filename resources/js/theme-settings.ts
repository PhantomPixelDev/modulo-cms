export type ThemeSettingValue = string | boolean;
export type ThemeSettingValues = Record<string, ThemeSettingValue>;
export interface ThemeSettingField {
    type: 'color' | 'select' | 'boolean';
    label: string;
    group: 'colors' | 'dark_colors' | 'layout';
    default: ThemeSettingValue;
    options: Record<string, string>;
}
export interface ThemeSettingsData {
    id: number;
    name: string;
    active: boolean;
    fields: Record<string, ThemeSettingField>;
    values: ThemeSettingValues;
}

const fonts: Record<string, string> = {
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    helvetica: 'Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const widths: Record<string, string> = { compact: '64rem', standard: '72rem', wide: '80rem' };
const radii: Record<string, string> = { square: '0px', subtle: '0.375rem', rounded: '0.625rem', soft: '1rem' };

function color(value: ThemeSettingValue | undefined): string | undefined {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}

/** Choose readable button text for the selected brand color. */
export function contrastingText(hex: string): string {
    const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
    const [r, g, b] = channels.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#111111' : '#ffffff';
}

/** Only known tokens and enumerated CSS values enter generated styles. */
export function themeDeclarations(values: ThemeSettingValues, dark = false): string {
    const prefix = dark ? 'dark_' : '';
    const tokens: string[] = [];
    const primary = color(values[`${prefix}primary_color`]);
    const background = color(values[`${prefix}background_color`]);
    const foreground = color(values[`${prefix}text_color`]);
    const muted = color(values[`${prefix}surface_color`]);
    const border = color(values[`${prefix}border_color`]);
    if (primary) tokens.push(`--primary:${primary}`, `--ring:${primary}`, `--primary-foreground:${contrastingText(primary)}`);
    if (background) tokens.push(`--background:${background}`, `--card:${background}`, `--popover:${background}`);
    if (foreground)
        tokens.push(
            `--foreground:${foreground}`,
            `--card-foreground:${foreground}`,
            `--popover-foreground:${foreground}`,
            `--secondary-foreground:${foreground}`,
            `--accent-foreground:${foreground}`,
            `--muted-foreground:${foreground}`,
        );
    if (muted) tokens.push(`--muted:${muted}`, `--secondary:${muted}`, `--accent:${muted}`);
    if (border) tokens.push(`--border:${border}`, `--input:${border}`);
    if (!dark) {
        const font = typeof values.font_family === 'string' ? fonts[values.font_family] : undefined;
        const width = typeof values.container_width === 'string' ? widths[values.container_width] : undefined;
        const radius = typeof values.corner_style === 'string' ? radii[values.corner_style] : undefined;
        if (font) tokens.push(`font-family:${font}`);
        if (width) tokens.push(`--theme-container-width:${width}`);
        if (radius) tokens.push(`--radius:${radius}`);
    }
    return tokens.join(';');
}

export function themeSettingsCss(values: ThemeSettingValues): string {
    const light = themeDeclarations(values);
    const dark = themeDeclarations(values, true);
    return `${light ? `.theme-frontend.theme-frontend{${light}}` : ''}${dark ? `.dark .theme-frontend.theme-frontend{${dark}}` : ''}`;
}
