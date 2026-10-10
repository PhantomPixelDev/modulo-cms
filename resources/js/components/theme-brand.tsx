import type { ThemeSettingValues } from '@/theme-settings';
import { Box, CodeXml, Globe, Layers, Leaf, Sparkles, Square } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export interface BrandSite {
    name?: string;
    tagline?: string;
    logo?: string | null;
}

const icons = { layers: Layers, code: CodeXml, globe: Globe, leaf: Leaf, box: Box, sparkles: Sparkles, square: Square };

function LogoImage({ src, height, fallback }: { src: string; height: number; fallback: ReactNode }) {
    const [failed, setFailed] = useState<string>();
    return failed === src ? (
        fallback
    ) : (
        <img src={src} alt="" style={{ height, maxWidth: '100%' }} className="w-auto object-contain" onError={() => setFailed(src)} />
    );
}

export function safeLogoUrl(value: unknown): string | undefined {
    return typeof value === 'string' && /^(?:\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i.test(value) ? value : undefined;
}

export function brandName(site?: BrandSite, values: ThemeSettingValues = {}): string {
    return typeof values.logo_text === 'string' && values.logo_text.trim() ? values.logo_text.trim() : site?.name || 'Modulo CMS';
}

/** Shared by the public header, footer, authentication screens and admin preview. */
export function ThemeBrand({
    site,
    values = {},
    dark,
    compact = false,
}: {
    site?: BrandSite;
    values?: ThemeSettingValues;
    dark?: boolean;
    compact?: boolean;
}) {
    const name = brandName(site, values);
    const style = values.logo_style || 'auto';
    const darkImage = safeLogoUrl(values.dark_logo_image);
    const image = safeLogoUrl(values.logo_image) || safeLogoUrl(site?.logo) || darkImage;
    const height = compact ? 32 : Math.max(16, Math.min(80, Number(values.logo_height) || 32));
    const textSize = compact ? 14 : Math.max(12, Math.min(36, Number(values.logo_text_size) || 18));
    const Icon =
        typeof values.logo_icon === 'string' && Object.hasOwn(icons, values.logo_icon) ? icons[values.logo_icon as keyof typeof icons] : Layers;
    const showImage = (style === 'auto' || style === 'image') && Boolean(image);
    const showText = style === 'text' || values.logo_show_text !== false;
    const mark = (
        <span
            className="flex shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground"
            style={{ width: height, height, fontSize: height * 0.5 }}
            data-brand-kind={style === 'icon' || style === 'image' ? 'icon' : 'initial'}
        >
            {style === 'icon' || style === 'image' ? (
                <Icon aria-hidden="true" style={{ width: height * 0.6, height: height * 0.6 }} />
            ) : (
                name.charAt(0).toUpperCase()
            )}
        </span>
    );

    return (
        <span className="inline-flex max-w-full min-w-0 items-center gap-2.5" data-testid="theme-brand">
            {style !== 'text' &&
                (showImage ? (
                    <span className="inline-flex min-w-0 shrink-0" style={{ maxWidth: compact ? 120 : 'min(220px, 40vw)' }}>
                        <span className={darkImage && dark === undefined ? 'dark:hidden' : undefined}>
                            <LogoImage src={dark === true && darkImage ? darkImage : image!} height={height} fallback={mark} />
                        </span>
                        {darkImage && dark === undefined && (
                            <span className="hidden dark:block">
                                <LogoImage src={darkImage} height={height} fallback={mark} />
                            </span>
                        )}
                    </span>
                ) : (
                    mark
                ))}
            <span
                className={showText ? 'min-w-0 truncate group-data-[collapsible=icon]:sr-only' : 'sr-only'}
                style={showText ? { fontSize: textSize } : undefined}
            >
                {name}
            </span>
        </span>
    );
}
