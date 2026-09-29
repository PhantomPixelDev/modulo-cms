import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorBoundary from '@/ErrorBoundary';
import { apiGet, apiPost } from '@/lib/api';
import type { ModuloBuild, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const CHANNEL_LABELS: Record<ModuloBuild['channel'], string> = {
    docker: 'Docker image',
    tarball: 'Release tarball',
    git: 'Git checkout',
};

interface UpdateState {
    update: {
        current: string;
        latest: string | null;
        available: boolean;
        url: string | null;
        error: string | null;
    };
    commands: string[];
    canSelfUpdate: boolean;
}

/**
 * Which build is actually running.
 *
 * Worth surfacing because the answer is otherwise only available by shelling
 * into the container, and it is the first thing needed in a bug report or when
 * checking whether a deploy landed.
 */
function SystemInfoCardInner({ title = 'System', description }: { title?: string; description?: string }) {
    const build = usePage<SharedData>().props.modulo;
    const [state, setState] = useState<UpdateState | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const mounted = useRef(true);

    const load = (refresh = false) => {
        setChecking(true);
        const request = refresh ? apiPost<UpdateState>('/dashboard/admin/updates/refresh') : apiGet<UpdateState>('/dashboard/admin/updates');

        request
            .then((data) => {
                if (!mounted.current) return;
                setState(data);
                setRequestError(null);
            })
            // A failed update check must never break the settings page.
            .catch((error: unknown) => {
                if (!mounted.current) return;
                setState(null);
                setRequestError(error instanceof Error ? error.message : 'Could not check for updates.');
            })
            .finally(() => {
                if (mounted.current) setChecking(false);
            });
    };

    useEffect(() => {
        mounted.current = true;
        load();
        // Runs once; the server caches the answer for hours.
         
        return () => {
            mounted.current = false;
        };
    }, []);

    if (!build) {
        return null;
    }

    const rows: Array<{ label: string; value: string }> = [
        { label: 'Version', value: build.isDev ? `${build.version} (development build)` : build.version },
        { label: 'Install channel', value: CHANNEL_LABELS[build.channel] ?? build.channel },
    ];

    if (build.commit) {
        rows.push({ label: 'Commit', value: build.commit });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2">
                    {rows.map((row) => (
                        <div key={row.label} className="flex flex-col gap-1">
                            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{row.label}</dt>
                            <dd className="font-mono text-sm break-all">{row.value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="mt-6 border-t pt-4">
                    {state?.update.available ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">
                                Version {state.update.latest} is available.{' '}
                                {state.update.url ? (
                                    <a href={state.update.url} target="_blank" rel="noreferrer" className="underline">
                                        Release notes
                                    </a>
                                ) : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {state.canSelfUpdate
                                    ? 'Run these from the site directory:'
                                    : 'This install runs from a container image, so the image is replaced rather than updated in place. Run this on the host:'}
                            </p>
                            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{state.commands.join('\n')}</pre>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {requestError ??
                                state?.update.error ??
                                (state ? 'Running the latest release.' : checking ? 'Checking for updates…' : 'Update status unavailable.')}
                        </p>
                    )}

                    <Button variant="outline" size="sm" className="mt-3" disabled={checking} onClick={() => load(true)}>
                        {checking ? <Loader2 className="animate-spin" /> : null}
                        Check for updates
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function SystemInfoCard({ title = 'System', description }: { title?: string; description?: string }) {
    return (
        <ErrorBoundary>
            <SystemInfoCardInner title={title} description={description} />
        </ErrorBoundary>
    );
}
