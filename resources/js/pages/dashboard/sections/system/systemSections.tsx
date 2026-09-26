import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { ActivityPage, type ActivityProps } from './activitySection';
import { EmailPage, type MailSettingsData } from './emailSection';
import { RedirectsPage, type RedirectsProps } from './redirectsSection';

export interface CoreUpdate {
    checked: boolean;
    current: string;
    latest: string | null;
    available: boolean;
    url: string | null;
    published_at: string | null;
    error: string | null;
    security: boolean;
    breaking: boolean;
    requires_migrations: boolean;
    notes: string | null;
    unmet_requirements: string[];
}

export interface PluginUpdate {
    slug: string;
    name: string;
    installed: string;
    available: string;
    active: boolean;
}

export interface UpdateCenterProps {
    core: CoreUpdate;
    commands: string[];
    plugins: PluginUpdate[];
    installedPlugins: Array<{ slug: string; name: string; version: string; source: string | null; active: boolean }>;
    themes: PluginUpdate[];
    lastCheckedAt: string | null;
    pending: number;
    enabled: boolean;
    isDev: boolean;
    channel: string;
    canUpdatePlugins: boolean;
}

export interface BackupItem {
    name: string;
    size: number;
    created_at: string;
    version: string | null;
    contents: string[];
}

export interface BackupsProps {
    items: BackupItem[];
    keep: number;
    scheduled: boolean;
    directory: string;
}

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : 'never');

const formatSize = (bytes: number) =>
    bytes >= 1073741824
        ? `${(bytes / 1073741824).toFixed(1)} GB`
        : bytes >= 1048576
          ? `${(bytes / 1048576).toFixed(1)} MB`
          : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function usePost() {
    const [busy, setBusy] = useState<string | null>(null);
    const post = (key: string, url: string) =>
        router.post(url, {}, { preserveScroll: true, onStart: () => setBusy(key), onFinish: () => setBusy(null) });
    return { busy, post };
}

function CommandBlock({ commands }: { commands: string[] }) {
    return (
        <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
            {commands.map((line, i) => (
                <div key={i} className={line.startsWith('#') ? 'text-muted-foreground' : 'text-foreground'}>
                    {line || ' '}
                </div>
            ))}
        </pre>
    );
}

function UpdatesPage({ data }: { data: UpdateCenterProps }) {
    const { busy, post } = usePost();
    const { core } = data;

    return (
        <SectionWrapper
            title="Updates"
            description={`Core releases and plugin updates. Last checked: ${formatDateTime(data.lastCheckedAt)}.`}
            actions={
                <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => post('check', route('dashboard.admin.system.updates.check'))}
                >
                    {busy === 'check' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                    Check now
                </Button>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center gap-2">
                            Modulo CMS
                            {core.available ? (
                                <Badge variant={core.security ? 'destructive' : 'warning'}>
                                    {core.security ? 'Security update' : 'Update available'}
                                </Badge>
                            ) : core.checked ? (
                                <Badge variant="success">Up to date</Badge>
                            ) : null}
                            {core.available && core.breaking && <Badge variant="outline">Breaking changes</Badge>}
                        </CardTitle>
                        <CardDescription>
                            Running <span className="font-mono">{core.current}</span>
                            {core.available && core.latest && (
                                <>
                                    {' '}
                                    → <span className="font-mono font-medium text-foreground">{core.latest}</span>
                                </>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.isDev && (
                            <p className="text-sm text-muted-foreground">This is a development build, so it does not check for releases.</p>
                        )}
                        {!data.enabled && <p className="text-sm text-muted-foreground">Update checks are turned off (MODULO_UPDATE_CHECK=false).</p>}
                        {core.error && !data.isDev && data.enabled && (
                            <p className="flex items-center gap-2 text-sm text-warning-foreground dark:text-warning">
                                <AlertTriangle className="size-4" />
                                {core.error}
                            </p>
                        )}
                        {core.available && (
                            <>
                                {core.security && (
                                    <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                                        <ShieldAlert className="size-4 shrink-0 text-destructive" />
                                        This release fixes a security issue. Update as soon as you can.
                                    </div>
                                )}
                                {core.unmet_requirements.length > 0 && (
                                    <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                                        <p className="font-medium">This server does not meet the new release's requirements:</p>
                                        <ul className="mt-1 list-disc pl-5">
                                            {core.unmet_requirements.map((req) => (
                                                <li key={req}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Run this on the server ({data.channel} install). A backup is taken first, and a failed upgrade leaves the site
                                        in maintenance mode instead of half-migrated.
                                    </p>
                                    <CommandBlock commands={data.commands} />
                                </div>
                                {core.url && (
                                    <a
                                        href={core.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                    >
                                        Release notes <ExternalLink className="size-3.5" />
                                    </a>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <CardTitle>Plugins</CardTitle>
                            <CardDescription>
                                {data.plugins.length === 0
                                    ? 'Every installed plugin is up to date with the registry.'
                                    : `${data.plugins.length} plugin update${data.plugins.length === 1 ? '' : 's'} available.`}
                            </CardDescription>
                        </div>
                        {data.canUpdatePlugins && data.plugins.length > 1 && (
                            <Button
                                size="sm"
                                disabled={busy !== null}
                                onClick={() => post('all', route('dashboard.admin.system.updates.plugins.all'))}
                            >
                                {busy === 'all' && <Loader2 className="animate-spin" />}
                                Update all
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plugin</TableHead>
                                    <TableHead>Installed</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.installedPlugins.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No plugins installed.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data.installedPlugins.map((plugin) => {
                                    const update = data.plugins.find((u) => u.slug === plugin.slug);
                                    return (
                                        <TableRow key={plugin.slug}>
                                            <TableCell className="font-medium">
                                                {plugin.name}
                                                {!plugin.active && <span className="ml-2 text-xs text-muted-foreground">inactive</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{plugin.version}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {update ? update.available : <CheckCircle2 className="size-4 text-success" aria-label="Up to date" />}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {update && data.canUpdatePlugins && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={busy !== null}
                                                        onClick={() =>
                                                            post(plugin.slug, route('dashboard.admin.system.updates.plugins.update', plugin.slug))
                                                        }
                                                    >
                                                        {busy === plugin.slug && <Loader2 className="animate-spin" />}
                                                        Update
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                {data.themes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Themes</CardTitle>
                            <CardDescription>Themes installed from the registry with a newer release.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Theme</TableHead>
                                        <TableHead>Installed</TableHead>
                                        <TableHead>Available</TableHead>
                                        <TableHead className="text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.themes.map((theme) => (
                                        <TableRow key={theme.slug}>
                                            <TableCell className="font-medium">
                                                {theme.name}
                                                {theme.active && <span className="ml-2 text-xs text-muted-foreground">active</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{theme.installed}</TableCell>
                                            <TableCell className="font-mono text-xs">{theme.available}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy !== null}
                                                    onClick={() =>
                                                        post(`theme:${theme.slug}`, route('dashboard.admin.system.updates.themes.update', theme.slug))
                                                    }
                                                >
                                                    {busy === `theme:${theme.slug}` && <Loader2 className="animate-spin" />}
                                                    Update
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </SectionWrapper>
    );
}

function BackupsPage({ data }: { data: BackupsProps }) {
    const { busy, post } = usePost();

    const destroy = (name: string) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
        router.delete(route('dashboard.admin.system.backups.destroy', name), { preserveScroll: true });
    };

    return (
        <SectionWrapper
            title="Backups"
            description={`Database, media and plugins in one archive. The newest ${data.keep} are kept${data.scheduled ? '; a full backup also runs every Sunday night' : ''}.`}
            actions={
                <Button size="sm" disabled={busy !== null} onClick={() => post('create', route('dashboard.admin.system.backups.store'))}>
                    {busy === 'create' && <Loader2 className="animate-spin" />}
                    Back up now
                </Button>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Backup</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Contents</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No backups yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data.items.map((backup) => (
                                    <TableRow key={backup.name}>
                                        <TableCell className="font-mono text-xs">{backup.name}</TableCell>
                                        <TableCell>{formatDateTime(backup.created_at)}</TableCell>
                                        <TableCell className="font-mono text-xs">{backup.version ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{backup.contents.join(', ')}</TableCell>
                                        <TableCell className="tabular-nums">{formatSize(backup.size)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild size="icon" variant="ghost" aria-label="Download">
                                                    <a href={route('dashboard.admin.system.backups.download', backup.name)}>
                                                        <Download />
                                                    </a>
                                                </Button>
                                                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => destroy(backup.name)}>
                                                    <Trash2 className="text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Restoring</CardTitle>
                        <CardDescription>
                            A restore replaces the whole database, so it runs from the server rather than from this page. The site is put in
                            maintenance mode while it runs, and an older backup is migrated up to this version afterwards.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CommandBlock
                            commands={[
                                '# Docker (from the folder with docker-compose.yml):',
                                `docker compose exec app php artisan modulo:restore ${data.items[0]?.name ?? '<backup>.zip'}`,
                                '',
                                '# Other installs:',
                                `php artisan modulo:restore ${data.items[0]?.name ?? '<backup>.zip'}`,
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>
        </SectionWrapper>
    );
}

export function getSystemSections({
    updateCenter,
    backups,
    activity,
    redirects,
    mailSettings,
}: {
    updateCenter?: UpdateCenterProps;
    backups?: BackupsProps;
    activity?: ActivityProps;
    redirects?: RedirectsProps;
    mailSettings?: MailSettingsData;
}): Record<string, () => ReactNode> {
    return {
        email: () => (mailSettings ? <EmailPage data={mailSettings} /> : null),
        activity: () => (activity ? <ActivityPage data={activity} /> : null),
        redirects: () => (redirects ? <RedirectsPage data={redirects} /> : null),
        updates: () => (updateCenter ? <UpdatesPage data={updateCenter} /> : null),
        backups: () => (backups ? <BackupsPage data={backups} /> : null),
    };
}
