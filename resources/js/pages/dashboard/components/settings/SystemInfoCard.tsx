import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModuloBuild, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
export function SystemInfoCard({ title = 'System', description }: { title?: string; description?: string }) {
    const build = usePage<SharedData>().props.modulo;
    const [state, setState] = useState<UpdateState | null>(null);
    const [checking, setChecking] = useState(false);

    const load = (refresh = false) => {
        setChecking(true);
        const request = refresh
            ? fetch('/dashboard/admin/updates/refresh', {
                  method: 'POST',
                  headers: {
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                  },
              })
            : fetch('/dashboard/admin/updates', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });

        request
            .then((response) => (response.ok ? response.json() : null))
            .then((data: UpdateState | null) => setState(data))
            // A failed update check must never break the settings page.
            .catch(() => setState(null))
            .finally(() => setChecking(false));
    };

    useEffect(() => {
        load();
        // Runs once; the server caches the answer for hours.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                                    : 'This install runs from a container image, so it is replaced rather than updated in place. Run these on the host:'}
                            </p>
                            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{state.commands.join('\n')}</pre>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {state?.update.error ? state.update.error : state ? 'Running the latest release.' : 'Checking for updates...'}
                        </p>
                    )}

                    <Button variant="outline" size="sm" className="mt-3" disabled={checking} onClick={() => load(true)}>
                        {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Check for updates
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
