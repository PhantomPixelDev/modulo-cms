import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

interface LocaleInfo {
    current: string;
    direction: 'ltr' | 'rtl';
    name: string;
    native_name: string;
    available: Array<{
        code: string;
        name: string;
        native_name: string;
        direction: 'ltr' | 'rtl';
        is_default: boolean;
    }>;
}

interface TranslationData {
    [domain: string]: {
        [key: string]: string | object;
    };
}

interface PageProps {
    locale?: LocaleInfo;
    translations?: TranslationData;
    themeTranslations?: Record<string, any>;
    [key: string]: unknown;
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): string | undefined {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return undefined;
        }
    }

    return typeof result === 'string' ? result : undefined;
}

/**
 * Replace placeholders in a string with provided values
 * Supports :placeholder and :Placeholder (capitalized) formats
 */
function replacePlaceholders(text: string, replacements: Record<string, string | number>): string {
    let result = text;

    for (const [key, value] of Object.entries(replacements)) {
        const stringValue = String(value);
        
        // Replace :key with value
        result = result.replace(new RegExp(`:${key}`, 'g'), stringValue);
        
        // Replace :Key (capitalized) with capitalized value
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        const capitalizedValue = stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
        result = result.replace(new RegExp(`:${capitalizedKey}`, 'g'), capitalizedValue);
    }

    return result;
}

/**
 * Hook for accessing translations in React components
 * 
 * Usage:
 * const { t, locale, availableLocales, switchLocale } = useTranslation();
 * 
 * // Simple translation
 * t('common.actions.save') // "Save"
 * 
 * // With replacements
 * t('common.success.created', { item: 'Post' }) // "Post created successfully."
 * 
 * // With fallback
 * t('missing.key', {}, 'Default text') // "Default text"
 */
export function useTranslation() {
    const { locale, translations, themeTranslations } = usePage<PageProps>().props;

    const currentLocale = locale?.current ?? 'en';
    const direction = locale?.direction ?? 'ltr';
    const availableLocales = locale?.available ?? [];

    const combinedTranslations = useMemo(() => {
        if (!translations && !themeTranslations) {
            return undefined;
        }

        if (themeTranslations) {
            return {
                ...(translations || {}),
                theme: {
                    ...(translations?.theme ?? {}),
                    ...themeTranslations,
                },
            } as TranslationData;
        }

        return translations;
    }, [translations, themeTranslations]);

    /**
     * Translate a key with optional replacements
     */
    const t = useCallback(
        (key: string, replacements: Record<string, string | number> = {}, fallback?: string): string => {
            if (!combinedTranslations) {
                return fallback ?? key;
            }

            // Try to get the translation using dot notation
            const value = getNestedValue(combinedTranslations, key);

            if (value !== undefined) {
                return replacePlaceholders(value, replacements);
            }

            // Return fallback or key if not found
            return fallback ?? key;
        },
        [combinedTranslations]
    );

    /**
     * Check if a translation key exists
     */
    const has = useCallback(
        (key: string): boolean => {
            if (!combinedTranslations) return false;
            return getNestedValue(combinedTranslations, key) !== undefined;
        },
        [combinedTranslations]
    );

    /**
     * Get all translations for a domain
     */
    const domain = useCallback(
        (domainName: string): Record<string, any> => {
            if (!combinedTranslations || !combinedTranslations[domainName]) {
                return {};
            }
            return combinedTranslations[domainName];
        },
        [combinedTranslations]
    );

    /**
     * Switch to a different locale
     */
    const switchLocale = useCallback((localeCode: string) => {
        // Add ?lang=xx to current URL and reload
        const url = new URL(window.location.href);
        url.searchParams.set('lang', localeCode);
        window.location.href = url.toString();
    }, []);

    /**
     * Get plural form of a translation
     * Supports Laravel-style pluralization with | separator
     */
    const choice = useCallback(
        (key: string, count: number, replacements: Record<string, string | number> = {}): string => {
            const value = t(key, {}, key);
            
            // Check if value has plural forms (separated by |)
            if (value.includes('|')) {
                const forms = value.split('|').map(s => s.trim());
                
                // Simple singular/plural
                if (forms.length === 2) {
                    const selected = count === 1 ? forms[0] : forms[1];
                    return replacePlaceholders(selected, { ...replacements, count });
                }
                
                // Multiple forms (0, 1, many)
                if (forms.length >= 3) {
                    let selected: string;
                    if (count === 0) {
                        selected = forms[0];
                    } else if (count === 1) {
                        selected = forms[1];
                    } else {
                        selected = forms[2];
                    }
                    return replacePlaceholders(selected, { ...replacements, count });
                }
            }

            return replacePlaceholders(value, { ...replacements, count });
        },
        [t]
    );

    return useMemo(
        () => ({
            t,
            has,
            domain,
            choice,
            locale: currentLocale,
            direction,
            availableLocales,
            switchLocale,
            isRTL: direction === 'rtl',
        }),
        [t, has, domain, choice, currentLocale, direction, availableLocales, switchLocale]
    );
}

/**
 * Shorthand hook that just returns the t function
 */
export function useT() {
    const { t } = useTranslation();
    return t;
}

export default useTranslation;
