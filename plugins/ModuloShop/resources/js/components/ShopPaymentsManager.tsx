import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Textarea, useAdminToast } from '@modulo/ui';
import { router } from '@inertiajs/react';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { ROUTE } from '../routes';
import type { ShopGateway } from '../types';

function GatewayCard({ gateway, canManage }: { gateway: ShopGateway; canManage: boolean }) {
    const { success: showSuccess, error: showError } = useAdminToast();
    const [enabled, setEnabled] = useState(gateway.enabled);
    const [values, setValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(gateway.fields.map((f) => [f.key, f.type === 'secret' ? '' : String(gateway.values[f.key] ?? '')])),
    );
    const [forget, setForget] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.put(
            ROUTE.shop.payments.update(gateway.id),
            { enabled, values, forget },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Secrets are write-only: clear what was typed once it is stored
                    setValues((v) =>
                        Object.fromEntries(
                            Object.entries(v).map(([k, val]) => [k, gateway.fields.find((f) => f.key === k)?.type === 'secret' ? '' : val]),
                        ),
                    );
                    setForget([]);
                },
                onError: () => showError(`Could not save ${gateway.label}`),
                onFinish: () => setSaving(false),
            },
        );
    };

    const copyWebhook = async () => {
        if (!gateway.webhook_url) return;
        try {
            await navigator.clipboard.writeText(gateway.webhook_url);
            showSuccess('Webhook URL copied');
        } catch {
            showError('Copy failed; select the URL and copy it by hand');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        {gateway.label}
                        {gateway.online && <Badge variant="outline">Online</Badge>}
                    </CardTitle>
                    <CardDescription>
                        {gateway.enabled && gateway.configured && 'Offered at checkout.'}
                        {gateway.enabled && !gateway.configured && 'Switched on, but not offered until its keys are filled in.'}
                        {!gateway.enabled && 'Not offered at checkout.'}
                    </CardDescription>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!canManage} aria-label={`Offer ${gateway.label}`} />
            </CardHeader>

            {gateway.fields.length > 0 && (
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {gateway.fields.map((field) => {
                        const id = `${gateway.id}-${field.key}`;
                        const isSet = field.type === 'secret' && gateway.values[field.key] === true && !forget.includes(field.key);

                        return (
                            <div key={field.key} className={`space-y-1 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                                <Label htmlFor={id}>{field.label}</Label>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        id={id}
                                        rows={4}
                                        value={values[field.key]}
                                        onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                                        disabled={!canManage}
                                    />
                                ) : field.type === 'select' ? (
                                    <Select
                                        value={values[field.key] || undefined}
                                        onValueChange={(v) => setValues({ ...values, [field.key]: v })}
                                        disabled={!canManage}
                                    >
                                        <SelectTrigger id={id}>
                                            <SelectValue placeholder="Choose…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(field.options ?? {}).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            id={id}
                                            type={field.type === 'secret' ? 'password' : 'text'}
                                            autoComplete="off"
                                            value={values[field.key]}
                                            placeholder={isSet ? '•••••••• saved (type to replace)' : ''}
                                            onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                                            disabled={!canManage}
                                        />
                                        {isSet && canManage && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setForget([...forget, field.key])}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
                            </div>
                        );
                    })}

                    {gateway.webhook_url && (
                        <div className="space-y-1 md:col-span-2">
                            <Label htmlFor={`${gateway.id}-webhook`}>Webhook URL</Label>
                            <div className="flex gap-2">
                                <Input id={`${gateway.id}-webhook`} readOnly value={gateway.webhook_url} className="font-mono text-xs" />
                                <Button type="button" variant="outline" size="icon" onClick={copyWebhook} aria-label="Copy webhook URL">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}

            {canManage && (
                <CardFooter className="justify-end">
                    <Button onClick={save} disabled={saving}>
                        {saving ? 'Saving…' : `Save ${gateway.label}`}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

export function ShopPaymentsManager({ gateways, canManage }: { gateways: ShopGateway[]; canManage: boolean }) {
    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Keys are stored encrypted and never shown again after saving. Use test keys first (Stripe <code>sk_test_…</code>, PayPal sandbox,
                Mollie <code>test_…</code>) and place a test order before switching to live keys.
            </p>
            {gateways.map((gateway) => (
                <GatewayCard key={gateway.id} gateway={gateway} canManage={canManage} />
            ))}
        </div>
    );
}
