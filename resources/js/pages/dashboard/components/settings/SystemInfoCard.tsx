import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModuloBuild, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

const CHANNEL_LABELS: Record<ModuloBuild['channel'], string> = {
    docker: 'Docker image',
    tarball: 'Release tarball',
    git: 'Git checkout',
};

/**
 * Which build is actually running.
 *
 * Worth surfacing because the answer is otherwise only available by shelling
 * into the container, and it is the first thing needed in a bug report or when
 * checking whether a deploy landed.
 */
export function SystemInfoCard({ title = 'System', description }: { title?: string; description?: string }) {
    const build = usePage<SharedData>().props.modulo;

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
            </CardContent>
        </Card>
    );
}
