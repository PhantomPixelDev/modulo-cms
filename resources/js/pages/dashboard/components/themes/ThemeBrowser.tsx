import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Loader2, Palette, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ROUTE } from '../../routes';

interface RegistryTheme {
    slug: string;
    name: string;
    description: string | null;
    author: string | null;
    screenshot: string | null;
    parent: string | null;
    version: string;
    installed_version: string | null;
    unmet: string[];
}

const newer = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }) > 0;

/**
 * Child themes published in the registry: styles and settings over a
 * bundled theme, installable without rebuilding the site.
 */
export function ThemeBrowser({ canInstall }: { canInstall: boolean }) {
    const [themes, setThemes] = useState<RegistryTheme[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback((refresh = false) => {
        setThemes(null);
        fetch(`${ROUTE.themes.registry()}${refresh ? '?refresh=1' : ''}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`The registry could not be loaded (HTTP ${response.status}).`);
                const data = (await response.json()) as { themes: RegistryTheme[]; error: string | null };
                setThemes(data.themes);
                setError(data.error);
            })
            .catch((e: unknown) => {
                setThemes([]);
                setError(e instanceof Error ? e.message : 'The registry could not be loaded.');
            });
    }, []);

    useEffect(() => load(), [load]);

    const install = (slug: string) =>
        router.post(
            ROUTE.themes.registryInstall(),
            { slug },
            {
                preserveScroll: true,
                onStart: () => setBusy(slug),
                onFinish: () => {
                    setBusy(null);
                    load();
                },
            },
        );

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">Browse registry</h2>
                    <p className="text-sm text-muted-foreground">Restyle an installed theme with a child theme. No rebuild needed.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => load(true)} disabled={themes === null}>
                    <RefreshCw />
                    Refresh
                </Button>
            </div>

            {error && (
                <p className="flex items-center gap-2 text-sm text-warning-foreground dark:text-warning">
                    <AlertTriangle className="size-4" />
                    {error}
                </p>
            )}

            {themes === null ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading the registry…
                </div>
            ) : themes.length === 0 ? (
                !error && <p className="py-6 text-sm text-muted-foreground">The registry has no themes yet.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {themes.map((theme) => {
                        const upToDate = theme.installed_version !== null && !newer(theme.version, theme.installed_version);
                        const canUpdate = theme.installed_version !== null && !upToDate;
                        return (
                            <Card key={theme.slug} className="flex flex-col overflow-hidden pt-0">
                                <div className="flex aspect-video items-center justify-center bg-muted">
                                    {theme.screenshot ? (
                                        <img src={theme.screenshot} alt="" className="size-full object-cover" loading="lazy" />
                                    ) : (
                                        <Palette className="size-8 text-muted-foreground" />
                                    )}
                                </div>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {theme.name}
                                        {upToDate && <Badge variant="success">Installed</Badge>}
                                        {canUpdate && <Badge variant="warning">Update</Badge>}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        v{theme.version}
                                        {theme.parent && <> · based on {theme.parent}</>}
                                        {theme.author && <> · {theme.author}</>}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3 pb-4">
                                    <p className="line-clamp-3 text-sm text-muted-foreground">{theme.description || 'No description provided.'}</p>
                                    {theme.unmet.length > 0 && (
                                        <p className="flex gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning-foreground dark:text-warning">
                                            <AlertTriangle className="size-3.5 shrink-0" />
                                            <span>Needs {theme.unmet.join(', ')}.</span>
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-0">
                                    {upToDate ? (
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CheckCircle2 className="size-3.5 text-success" /> Up to date
                                        </span>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled={!canInstall || busy !== null || theme.unmet.length > 0}
                                            onClick={() => install(theme.slug)}
                                        >
                                            {busy === theme.slug && <Loader2 className="animate-spin" />}
                                            {canUpdate ? `Update to ${theme.version}` : 'Install'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
