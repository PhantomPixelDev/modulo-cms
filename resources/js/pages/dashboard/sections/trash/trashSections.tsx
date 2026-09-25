import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

export interface TrashProps {
    items: {
        data: Array<{
            id: number;
            title: string;
            slug: string;
            status: string;
            type: string | null;
            author: string | null;
            deleted_at: string | null;
        }>;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        total: number;
    };
    days: number;
}

function TrashPage({ data }: { data: TrashProps }) {
    const { items } = data;

    const restore = (id: number) => router.post(route('dashboard.admin.trash.restore', { id }), {}, { preserveScroll: true });
    const destroy = (id: number, title: string) => {
        if (window.confirm(`Delete "${title}" permanently? This cannot be undone.`)) {
            router.delete(route('dashboard.admin.trash.destroy', { id }), { preserveScroll: true });
        }
    };
    const empty = () => {
        if (window.confirm(`Delete all ${items.total} items in the trash permanently? This cannot be undone.`)) {
            router.delete(route('dashboard.admin.trash.empty'), { preserveScroll: true });
        }
    };

    return (
        <SectionWrapper
            title="Trash"
            description={
                data.days > 0
                    ? `Deleted posts and pages. They are removed for good after ${data.days} days.`
                    : 'Deleted posts and pages, kept until the trash is emptied.'
            }
            actions={
                items.total > 0 ? (
                    <Button variant="outline" size="sm" className="text-destructive" onClick={empty}>
                        <Trash2 /> Empty trash
                    </Button>
                ) : undefined
            }
        >
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Deleted</TableHead>
                                <TableHead className="text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                        The trash is empty.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.title}
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">/{item.slug}</span>
                                    </TableCell>
                                    <TableCell>{item.type ?? '—'}</TableCell>
                                    <TableCell>{item.author ?? '—'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" variant="outline" onClick={() => restore(item.id)}>
                                                <RotateCcw /> Restore
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="Delete permanently"
                                                onClick={() => destroy(item.id, item.title)}
                                            >
                                                <Trash2 className="text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {items.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Page {items.current_page} of {items.last_page}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!items.prev_page_url}
                                    onClick={() => items.prev_page_url && router.visit(items.prev_page_url)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!items.next_page_url}
                                    onClick={() => items.next_page_url && router.visit(items.next_page_url)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </SectionWrapper>
    );
}

export function getTrashSections({ trash }: { trash?: TrashProps }): Record<string, () => ReactNode> {
    return { trash: () => (trash ? <TrashPage data={trash} /> : null) };
}
