import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, useForm } from '@inertiajs/react';
import { ArrowRight, Search, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

declare const route: (name: string, params?: any) => string;

interface RedirectItem {
    id: number;
    from_path: string;
    to_url: string;
    status_code: number;
    hits: number;
    last_hit_at: string | null;
    automatic: boolean;
}

export interface RedirectsProps {
    items: {
        data: RedirectItem[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        total: number;
    };
    q: string;
    statusCodes: number[];
}

export function RedirectsPage({ data }: { data: RedirectsProps }) {
    const form = useForm({ from_path: '', to_url: '', status_code: 301 });
    const [q, setQ] = useState(data.q);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('dashboard.admin.system.redirects.store'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const remove = (item: RedirectItem) => {
        if (window.confirm(`Remove the redirect from ${item.from_path}?`)) {
            router.delete(route('dashboard.admin.system.redirects.destroy', item.id), { preserveScroll: true });
        }
    };

    return (
        <SectionWrapper
            title="Redirects"
            description="Send visitors of old URLs to new ones. Changing the slug of a published post adds one automatically."
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Add a redirect</CardTitle>
                        <CardDescription>From a path on this site to another path or a full URL.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto_1fr_8rem_auto] md:items-start">
                            <div>
                                <Input
                                    placeholder="/old-page"
                                    value={form.data.from_path}
                                    onChange={(e) => form.setData('from_path', e.target.value)}
                                />
                                <InputError message={form.errors.from_path} />
                            </div>
                            <ArrowRight className="mt-2.5 hidden size-4 text-muted-foreground md:block" />
                            <div>
                                <Input
                                    placeholder="/new-page or https://…"
                                    value={form.data.to_url}
                                    onChange={(e) => form.setData('to_url', e.target.value)}
                                />
                                <InputError message={form.errors.to_url} />
                            </div>
                            <select
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                value={form.data.status_code}
                                onChange={(e) => form.setData('status_code', Number(e.target.value))}
                                aria-label="Status code"
                            >
                                {data.statusCodes.map((code) => (
                                    <option key={code} value={code}>
                                        {code} {code === 301 || code === 308 ? '(permanent)' : '(temporary)'}
                                    </option>
                                ))}
                            </select>
                            <Button disabled={form.processing}>Add</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(route('dashboard.admin.system.redirects'), q ? { q } : {}, { preserveState: true });
                            }}
                            className="relative mb-4 max-w-xs"
                        >
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search redirects" className="pl-9" />
                        </form>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Hits</TableHead>
                                    <TableHead className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No redirects{data.q ? ' match your search' : ' yet'}.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data.items.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-xs break-all">{item.from_path}</TableCell>
                                        <TableCell className="font-mono text-xs break-all">{item.to_url}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Badge variant="outline">{item.status_code}</Badge>
                                                {item.automatic && <Badge variant="secondary">auto</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className="text-right tabular-nums"
                                            title={item.last_hit_at ? `Last: ${new Date(item.last_hit_at).toLocaleString()}` : undefined}
                                        >
                                            {item.hits}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(item)}>
                                                <Trash2 className="text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {data.items.last_page > 1 && (
                            <div className="mt-4 flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!data.items.prev_page_url}
                                    onClick={() => data.items.prev_page_url && router.visit(data.items.prev_page_url)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!data.items.next_page_url}
                                    onClick={() => data.items.next_page_url && router.visit(data.items.next_page_url)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SectionWrapper>
    );
}
