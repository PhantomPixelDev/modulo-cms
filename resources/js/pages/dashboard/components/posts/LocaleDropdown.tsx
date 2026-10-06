import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { router } from '@inertiajs/react';
import { ChevronDown, Globe, Trash2 } from 'lucide-react';

export interface LocaleOption {
    code: string;
    name?: string;
    native_name?: string;
    is_default?: boolean;
}

interface LocaleDropdownProps {
    locales?: LocaleOption[];
    currentLocale?: string;
    onLocaleChange?: (code: string) => void;
    /** Whether a translation exists for the current locale (enables delete). */
    hasTranslation?: boolean;
    /** Fully built delete URL (e.g. route('...translations.destroy', ...)). */
    deleteRoute?: string;
}

/**
 * Language switcher shared by the post and page editors. Switching only
 * changes `?locale=`; the parent remounts the form (via key) so fields show
 * the newly selected locale instead of stale text.
 */
export function LocaleDropdown({ locales = [], currentLocale = 'en', onLocaleChange, hasTranslation, deleteRoute }: LocaleDropdownProps) {
    const { t } = useTranslation();
    if (locales.length <= 1) return null;

    const current = locales.find((l) => l.code === currentLocale);
    const showDelete = Boolean(hasTranslation && deleteRoute && current && !current.is_default);

    const handleDelete = () => {
        if (!deleteRoute) return;
        if (!window.confirm(t('dashboard.posts.translations.delete_confirm'))) return;
        router.delete(deleteRoute, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">{currentLocale.toUpperCase()}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.code}
                        onClick={() => onLocaleChange?.(locale.code)}
                        className={currentLocale === locale.code ? 'bg-accent' : ''}
                    >
                        <span className="mr-2 font-medium">{locale.code.toUpperCase()}</span>
                        <span className="text-muted-foreground">{locale.native_name || locale.name}</span>
                        {locale.is_default && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                Default
                            </Badge>
                        )}
                    </DropdownMenuItem>
                ))}
                {showDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            {t('dashboard.posts.translations.delete')}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
