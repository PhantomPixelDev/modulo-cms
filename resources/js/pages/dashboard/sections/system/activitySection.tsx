import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

declare const route: (name: string, params?: any) => string;

export interface ActivityEntry {
    id: number;
    event: string;
    description: string;
    properties: Record<string, unknown> | null;
    user: { id: number; name: string; email: string } | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface ActivityProps {
    entries: {
        data: ActivityEntry[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        total: number;
    };
    filters: { group: string | null; user: number | null; q: string | null };
    groups: string[];
    retentionDays: number;
}

const tone = (event: string): 'destructive' | 'warning' | 'success' | 'outline' => {
    if (/failed|lockout|deleted|uninstalled|disabled/.test(event)) return 'destructive';
    if (/^(core|backup|2fa|role|settings)\./.test(event)) return 'warning';
    if (/login|created|installed|enabled|activated/.test(event)) return 'success';
    return 'outline';
};

export function ActivityPage({ data }: { data: ActivityProps }) {
    const [q, setQ] = useState(data.filters.q ?? '');

    const apply = (next: Partial<ActivityProps['filters']>) =>
        router.get(
            route('dashboard.admin.system.activity'),
            Object.fromEntries(Object.entries({ ...data.filters, ...next }).filter(([, v]) => v !== null && v !== '')),
            { preserveState: true, preserveScroll: true },
        );

    const search = (e: FormEvent) => {
        e.preventDefault();
        apply({ q: q || null });
    };

    const { entries } = data;

    return (
        <SectionWrapper
            title="Activity"
            description={`Sign-ins and changes to content, users, roles, settings and extensions.${data.retentionDays > 0 ? ` Kept for ${data.retentionDays} days.` : ''}`}
        >
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <form onSubmit={search} className="relative w-full max-w-xs">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search descriptions" className="pl-9" />
                </form>
                <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant={data.filters.group === null ? 'secondary' : 'ghost'} onClick={() => apply({ group: null })}>
                        All
                    </Button>
                    {data.groups.map((group) => (
                        <Button key={group} size="sm" variant={data.filters.group === group ? 'secondary' : 'ghost'} onClick={() => apply({ group })}>
                            {group}
                        </Button>
                    ))}
                </div>
                {data.filters.user !== null && (
                    <Button size="sm" variant="outline" onClick={() => apply({ user: null })}>
                        Clear user filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-44">When</TableHead>
                                <TableHead>What</TableHead>
                                <TableHead>Who</TableHead>
                                <TableHead>From</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Nothing recorded{data.filters.group || data.filters.q ? ' for this filter' : ' yet'}.
                                    </TableCell>
                                </TableRow>
                            )}
                            {entries.data.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                                        {new Date(entry.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={tone(entry.event)} className="font-mono text-[10px]">
                                                {entry.event}
                                            </Badge>
                                            <span className="text-sm">{entry.description}</span>
                                        </div>
                                        {entry.properties && Object.keys(entry.properties).length > 0 && (
                                            <details className="mt-1 text-xs text-muted-foreground">
                                                <summary className="cursor-pointer">Details</summary>
                                                <pre className="mt-1 max-w-xl overflow-x-auto rounded bg-muted p-2">
                                                    {JSON.stringify(entry.properties, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {entry.user ? (
                                            <button
                                                type="button"
                                                className="hover:underline"
                                                onClick={() => apply({ user: entry.user!.id })}
                                                title={entry.user.email}
                                            >
                                                {entry.user.name}
                                            </button>
                                        ) : (
                                            <span className="text-muted-foreground">{entry.user_agent === 'console' ? 'console' : '—'}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground" title={entry.user_agent ?? undefined}>
                                        {entry.ip_address ?? '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {entries.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground tabular-nums">
                                Page {entries.current_page} of {entries.last_page} · {entries.total} entries
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!entries.prev_page_url}
                                    onClick={() => entries.prev_page_url && router.visit(entries.prev_page_url, { preserveScroll: true })}
                                >
                                    <ChevronLeft /> Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!entries.next_page_url}
                                    onClick={() => entries.next_page_url && router.visit(entries.next_page_url, { preserveScroll: true })}
                                >
                                    Next <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </SectionWrapper>
    );
}
