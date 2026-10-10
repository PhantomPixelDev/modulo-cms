import type { ThemeSettingValues } from '@/theme-settings';
import { Box, CodeXml, Globe, Layers, Leaf, Sparkles, Square } from 'lucide-react';

export interface BrandSite {
    name?: string;
    tagline?: string;
    logo?: string | null;
}

const icons = { layers: Layers, code: CodeXml, globe: Globe, leaf: Leaf, box: Box, sparkles: Sparkles, square: Square };

export function safeLogoUrl(value: unknown): string | undefined {
    return typeof value === 'string' && /^(?:\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i.test(value) ? value : undefined;
}

export function brandName(site?: BrandSite, values: ThemeSettingValues = {}): string {
    return typeof values.logo_text === 'string' && values.logo_text.trim() ? values.logo_text.trim() : site?.name || 'Modulo CMS';
}

/** Shared by the public header, footer, authentication screens and admin preview. */
export function ThemeBrand({ site, values = {}, dark }: { site?: BrandSite; values?: ThemeSettingValues; dark?: boolean }) {
    const name = brandName(site, values);
    const style = values.logo_style || 'auto';
    const image = safeLogoUrl(values.logo_image) || safeLogoUrl(site?.logo);
    const darkImage = safeLogoUrl(values.dark_logo_image);
    const height = Math.max(16, Math.min(80, Number(values.logo_height) || 32));
    const textSize = Math.max(12, Math.min(36, Number(values.logo_text_size) || 18));
    const Icon =
        typeof values.logo_icon === 'string' && Object.hasOwn(icons, values.logo_icon) ? icons[values.logo_icon as keyof typeof icons] : Layers;
    const showImage = (style === 'auto' || style === 'image') && Boolean(image);
    const showText = style === 'text' || values.logo_show_text !== false;

    return (
        <span className="inline-flex max-w-full min-w-0 items-center gap-2.5" data-testid="theme-brand">
            {style !== 'text' &&
                (showImage ? (
                    <span className="inline-flex min-w-0 shrink-0" style={{ maxWidth: 'min(220px, 40vw)' }}>
                        <img
                            src={dark === true && darkImage ? darkImage : image}
                            alt=""
                            style={{ height, maxWidth: '100%' }}
                            className={darkImage && dark === undefined ? 'w-auto object-contain dark:hidden' : 'w-auto object-contain'}
                        />
                        {darkImage && dark === undefined && (
                            <img src={darkImage} alt="" style={{ height, maxWidth: '100%' }} className="hidden w-auto object-contain dark:block" />
                        )}
                    </span>
                ) : (
                    <span
                        className="flex shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground"
                        style={{ width: height, height }}
                    >
                        {style === 'icon' ? (
                            <Icon aria-hidden="true" style={{ width: height * 0.6, height: height * 0.6 }} />
                        ) : (
                            name.charAt(0).toUpperCase()
                        )}
                    </span>
                ))}
            <span className={showText ? 'min-w-0 truncate' : 'sr-only'} style={showText ? { fontSize: textSize } : undefined}>
                {name}
            </span>
        </span>
    );
}
