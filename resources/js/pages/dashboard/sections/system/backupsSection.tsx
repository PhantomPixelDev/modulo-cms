import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, CloudOff, CloudUpload, Download, History, Loader2, RotateCcw, Trash2, Upload, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

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
    offsite: {
        enabled: boolean;
        disk: string | null;
        target: string | null;
        last: { ok: boolean; at: string; error: string | null; file: string } | null;
    };
    restore: { state: 'queued' | 'running' | 'done' | 'failed'; backup: string; message: string | null; at: string } | null;
    uploadMaxMb: number;
}

const formatSize = (bytes: number) =>
    bytes >= 1073741824
        ? `${(bytes / 1073741824).toFixed(1)} GB`
        : bytes >= 1048576
          ? `${(bytes / 1048576).toFixed(1)} MB`
          : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const when = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');

function RestoreDialog({ backup, onClose }: { backup: BackupItem; onClose: () => void }) {
    const { t } = useTranslation();
    const parts = backup.contents.filter((part) => ['database', 'media', 'plugins'].includes(part));
    const form = useForm({ confirm: '', parts });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('dashboard.backups.restore.title')}</DialogTitle>
                    <DialogDescription>{t('dashboard.backups.restore.description')}</DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('dashboard.admin.system.backups.restore', backup.name), { preserveScroll: true, onSuccess: onClose });
                    }}
                >
                    <div className="space-y-2">
                        <Label>{t('dashboard.backups.restore.parts')}</Label>
                        {parts.map((part) => (
                            <label key={part} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.data.parts.includes(part)}
                                    onCheckedChange={(checked) =>
                                        form.setData('parts', checked === true ? [...form.data.parts, part] : form.data.parts.filter((p) => p !== part))
                                    }
                                />
                                {t(`dashboard.backups.contents.${part}`)}
                            </label>
                        ))}
                        <InputError message={form.errors.parts} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="restore-confirm">{t('dashboard.backups.restore.confirm', { name: backup.name })}</Label>
                        <Input
                            id="restore-confirm"
                            value={form.data.confirm}
                            onChange={(e) => form.setData('confirm', e.target.value)}
                            className="font-mono text-xs"
                            autoComplete="off"
                        />
                        <InputError message={form.errors.confirm} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('dashboard.common.cancel')}
                        </Button>
                        <Button type="submit" variant="destructive" disabled={form.processing || form.data.confirm !== backup.name || form.data.parts.length === 0}>
                            {form.processing ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                            {t('dashboard.backups.restore.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function BackupsPage({ data }: { data: BackupsProps }) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [restoring, setRestoring] = useState<BackupItem | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const upload = useForm<{ backup: File | null }>({ backup: null });

    const create = () =>
        router.post(route('dashboard.admin.system.backups.store'), {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });

    const destroy = (name: string) => {
        if (!window.confirm(t('dashboard.backups.confirm_delete', { name }))) return;
        router.delete(route('dashboard.admin.system.backups.destroy', name), { preserveScroll: true });
    };

    const status = data.restore;

    return (
        <SectionWrapper
            title={t('dashboard.backups.title')}
            description={
                data.scheduled
                    ? t('dashboard.backups.description_scheduled', { keep: data.keep })
                    : t('dashboard.backups.description', { keep: data.keep })
            }
            actions={
                <div className="flex gap-2">
                    <input
                        ref={fileInput}
                        type="file"
                        accept=".zip,application/zip"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (!file) return;
                            upload.setData('backup', file);
                            upload.transform(() => ({ backup: file }));
                            upload.post(route('dashboard.admin.system.backups.upload'), { preserveScroll: true, forceFormData: true });
                            e.target.value = '';
                        }}
                    />
                    <Button size="sm" variant="outline" disabled={upload.processing} onClick={() => fileInput.current?.click()}>
                        {upload.processing ? <Loader2 className="animate-spin" /> : <Upload />}
                        {t('dashboard.backups.upload')}
                    </Button>
                    <Button size="sm" disabled={busy} onClick={create}>
                        {busy && <Loader2 className="animate-spin" />}
                        {t('dashboard.backups.create')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {upload.errors.backup && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{upload.errors.backup}</AlertDescription>
                    </Alert>
                )}

                {status && (
                    <Alert variant={status.state === 'failed' ? 'destructive' : 'default'}>
                        {status.state === 'failed' ? (
                            <XCircle className="h-4 w-4" />
                        ) : status.state === 'done' ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <AlertTitle>{t(`dashboard.backups.restore.state.${status.state}`, { name: status.backup })}</AlertTitle>
                        <AlertDescription>
                            {when(status.at)}
                            {status.message && <pre className="mt-2 max-h-40 overflow-auto text-xs whitespace-pre-wrap">{status.message}</pre>}
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('dashboard.backups.table.backup')}</TableHead>
                                    <TableHead>{t('dashboard.backups.table.created')}</TableHead>
                                    <TableHead>{t('dashboard.backups.table.version')}</TableHead>
                                    <TableHead>{t('dashboard.backups.table.contents')}</TableHead>
                                    <TableHead>{t('dashboard.backups.table.size')}</TableHead>
                                    <TableHead className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            {t('dashboard.backups.empty')}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data.items.map((backup) => (
                                    <TableRow key={backup.name}>
                                        <TableCell className="font-mono text-xs">{backup.name}</TableCell>
                                        <TableCell>{when(backup.created_at)}</TableCell>
                                        <TableCell className="font-mono text-xs">{backup.version ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {backup.contents.map((part) => t(`dashboard.backups.contents.${part}`, {}, part)).join(', ')}
                                        </TableCell>
                                        <TableCell className="tabular-nums">{formatSize(backup.size)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={t('dashboard.backups.restore.button')}
                                                    title={t('dashboard.backups.restore.button')}
                                                    onClick={() => setRestoring(backup)}
                                                >
                                                    <History />
                                                </Button>
                                                <Button
                                                    asChild
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={t('dashboard.backups.download')}
                                                    title={t('dashboard.backups.download')}
                                                >
                                                    <a href={route('dashboard.admin.system.backups.download', backup.name)}>
                                                        <Download />
                                                    </a>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={t('dashboard.backups.delete')}
                                                    title={t('dashboard.backups.delete')}
                                                    onClick={() => destroy(backup.name)}
                                                >
                                                    <Trash2 className="text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <p className="mt-3 text-xs text-muted-foreground">{t('dashboard.backups.upload_hint', { size: data.uploadMaxMb })}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            {data.offsite.enabled ? <CloudUpload className="h-4 w-4 text-primary" /> : <CloudOff className="h-4 w-4 text-muted-foreground" />}
                            {t('dashboard.backups.offsite.title')}
                            {data.offsite.enabled && data.offsite.last && (
                                <Badge variant={data.offsite.last.ok ? 'success' : 'destructive'}>
                                    {data.offsite.last.ok ? t('dashboard.backups.offsite.ok') : t('dashboard.backups.offsite.failing')}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {data.offsite.enabled
                                ? t('dashboard.backups.offsite.enabled', { target: data.offsite.target ?? data.offsite.disk ?? '' })
                                : t('dashboard.backups.offsite.disabled')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {data.offsite.enabled && data.offsite.last && (
                            <p className={data.offsite.last.ok ? 'text-muted-foreground' : 'text-destructive'}>
                                {data.offsite.last.ok
                                    ? t('dashboard.backups.offsite.last_ok', { file: data.offsite.last.file, at: when(data.offsite.last.at) })
                                    : t('dashboard.backups.offsite.last_failed', { at: when(data.offsite.last.at), reason: data.offsite.last.error ?? '' })}
                            </p>
                        )}
                        {!data.offsite.enabled && (
                            <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
                                {[
                                    'MODULO_BACKUP_DISK=s3',
                                    'AWS_ACCESS_KEY_ID=…',
                                    'AWS_SECRET_ACCESS_KEY=…',
                                    'AWS_DEFAULT_REGION=auto',
                                    'AWS_BUCKET=my-site-backups',
                                    'AWS_ENDPOINT=https://… # for B2, Wasabi, R2, MinIO',
                                ].join('\n')}
                            </pre>
                        )}
                    </CardContent>
                </Card>
            </div>

            {restoring && <RestoreDialog backup={restoring} onClose={() => setRestoring(null)} />}
        </SectionWrapper>
    );
}
