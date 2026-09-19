import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { Check, Globe } from 'lucide-react';

interface LocaleSwitcherProps {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showLabel?: boolean;
}

export function LocaleSwitcher({ variant = 'outline', size = 'sm', showLabel = true }: LocaleSwitcherProps) {
    const { locale, availableLocales, switchLocale } = useTranslation();

    // Don't render if no locales available or only one locale
    if (!availableLocales || availableLocales.length <= 1) {
        return null;
    }

    const currentLocale = availableLocales.find((l) => l.code === locale);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className="gap-2">
                    <Globe className="h-4 w-4" />
                    {showLabel && (
                        <span className="hidden sm:inline">{currentLocale?.native_name || currentLocale?.name || locale.toUpperCase()}</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
                {availableLocales.map((loc) => (
                    <DropdownMenuItem
                        key={loc.code}
                        onClick={() => switchLocale(loc.code)}
                        className="flex cursor-pointer items-center justify-between gap-2"
                    >
                        <span>
                            {loc.native_name || loc.name}
                            {loc.native_name && loc.native_name !== loc.name && (
                                <span className="ml-1 text-xs text-muted-foreground">({loc.name})</span>
                            )}
                        </span>
                        {loc.code === locale && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default LocaleSwitcher;
