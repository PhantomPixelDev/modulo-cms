import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ROUTE } from '../../routes';

interface RegistryPlugin {
    slug: string;
    name: string;
    description: string | null;
    author: string | null;
    homepage: string | null;
    version: string;
    installed_version: string | null;
    unmet: string[];
}

const newer = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }) > 0;

/**
 * Plugins published in the registry. Installing downloads the package,
 * verifies its checksum and unpacks it; it arrives inactive.
 */
export function PluginBrowser({ canInstall }: { canInstall: boolean }) {
    const [plugins, setPlugins] = useState<RegistryPlugin[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback((refresh = false) => {
        setPlugins(null);
        fetch(`${ROUTE.plugins.registry()}${refresh ? '?refresh=1' : ''}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`The registry could not be loaded (HTTP ${response.status}).`);
                const data = (await response.json()) as { plugins: RegistryPlugin[]; error: string | null };
                setPlugins(data.plugins);
                setError(data.error);
            })
            .catch((e: unknown) => {
                setPlugins([]);
                setError(e instanceof Error ? e.message : 'The registry could not be loaded.');
            });
    }, []);

    useEffect(() => load(), [load]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (plugins ?? []).filter((p) => !q || `${p.name} ${p.description ?? ''} ${p.author ?? ''}`.toLowerCase().includes(q));
    }, [plugins, query]);

    const install = (slug: string) =>
        router.post(
            ROUTE.plugins.install(),
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
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the registry" className="pl-9" />
                </div>
                <Button variant="outline" size="sm" onClick={() => load(true)} disabled={plugins === null}>
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

            {plugins === null ? (
                <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading the registry…
                </div>
            ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    {query ? 'No plugins match your search.' : 'The registry has no plugins yet.'}
                </p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((plugin) => {
                        const upToDate = plugin.installed_version !== null && !newer(plugin.version, plugin.installed_version);
                        const canUpdate = plugin.installed_version !== null && !upToDate;
                        return (
                            <Card key={plugin.slug} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {plugin.name}
                                        {upToDate && <Badge variant="success">Installed</Badge>}
                                        {canUpdate && <Badge variant="warning">Update</Badge>}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        v{plugin.version}
                                        {plugin.author && <> · {plugin.author}</>}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3 pb-4">
                                    <p className="line-clamp-3 text-sm text-muted-foreground">{plugin.description || 'No description provided.'}</p>
                                    {plugin.unmet.length > 0 && (
                                        <p className="flex gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning-foreground dark:text-warning">
                                            <AlertTriangle className="size-3.5 shrink-0" />
                                            <span>Needs {plugin.unmet.join(', ')}.</span>
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between gap-2 pt-0">
                                    {upToDate ? (
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CheckCircle2 className="size-3.5 text-success" /> Up to date
                                        </span>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled={!canInstall || busy !== null || plugin.unmet.length > 0}
                                            onClick={() => install(plugin.slug)}
                                        >
                                            {busy === plugin.slug && <Loader2 className="animate-spin" />}
                                            {canUpdate ? `Update to ${plugin.version}` : 'Install'}
                                        </Button>
                                    )}
                                    {plugin.homepage && (
                                        <a
                                            href={plugin.homepage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Details <ExternalLink className="size-3" />
                                        </a>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
