import type { ThemeSettingValues } from '@/theme-settings';
import { usePage } from '@inertiajs/react';
import { ThemeBrand, type BrandSite } from './theme-brand';

export default function AppLogo() {
    const { branding } = usePage<{ branding?: { site: BrandSite; values: ThemeSettingValues } }>().props;
    return <ThemeBrand site={branding?.site} values={branding?.values} compact />;
}
