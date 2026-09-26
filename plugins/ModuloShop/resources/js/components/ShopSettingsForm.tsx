import { Button, Card, CardContent, CardHeader, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@modulo/ui';
import { CreditCard, Package, Plus, Save, Settings, Store, Trash2, Truck } from 'lucide-react';
import React, { useState } from 'react';

interface ShippingMethodRow {
    name: string;
    price: number | string;
    free_over: number | string | null;
}

interface ShopSettingsFormProps {
    settings: Record<string, any>;
    canEdit: boolean;
    onSave: (data: Record<string, any>) => Promise<void> | void;
}

const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'CHF', label: 'Swiss Franc (CHF)' },
    { value: 'CNY', label: 'Chinese Yuan (¥)' },
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'BRL', label: 'Brazilian Real (R$)' },
];

export function ShopSettingsForm({ settings, canEdit, onSave }: ShopSettingsFormProps) {
    const [formData, setFormData] = useState({
        store_name: settings.store_name || 'My Shop',
        currency: settings.currency || 'USD',
        currency_position: settings.currency_position || 'before',
        thousand_separator: settings.thousand_separator || ',',
        decimal_separator: settings.decimal_separator || '.',
        decimals: settings.decimals ?? 2,
        products_per_page: settings.products_per_page || 12,
        enable_reviews: settings.enable_reviews ?? false,
        enable_stock_management: settings.enable_stock_management ?? true,
        low_stock_threshold: settings.low_stock_threshold || 5,
        out_of_stock_visibility: settings.out_of_stock_visibility ?? true,
        cart_page_id: settings.cart_page_id || null,
        checkout_page_id: settings.checkout_page_id || null,
        terms_page_id: settings.terms_page_id || null,
        enable_checkout: settings.enable_checkout ?? true,
        invoice_details: settings.invoice_details ?? '',
        tax_rate: settings.tax_rate ?? 0,
        prices_include_tax: settings.prices_include_tax ?? false,
        shipping_methods: (Array.isArray(settings.shipping_methods) ? settings.shipping_methods : []) as ShippingMethodRow[],
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (key: string, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const updateMethod = (index: number, patch: Partial<ShippingMethodRow>) => {
        setFormData((prev) => ({
            ...prev,
            shipping_methods: prev.shipping_methods.map((m, i) => (i === index ? { ...m, ...patch } : m)),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

        setIsSaving(true);
        try {
            await onSave({
                ...formData,
                tax_rate: Number(formData.tax_rate) || 0,
                shipping_methods: formData.shipping_methods
                    .filter((m) => String(m.name).trim() !== '')
                    .map((m) => ({
                        name: String(m.name).trim(),
                        price: Number(m.price) || 0,
                        free_over: m.free_over === '' || m.free_over === null ? null : Number(m.free_over),
                    })),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <Tabs defaultValue="general" className="w-full">
                    <CardHeader className="pb-0">
                        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                            <TabsTrigger
                                value="general"
                                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <Store className="mr-2 h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger
                                value="currency"
                                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Currency
                            </TabsTrigger>
                            <TabsTrigger
                                value="checkout"
                                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <Truck className="mr-2 h-4 w-4" />
                                Tax &amp; Shipping
                            </TabsTrigger>
                            <TabsTrigger
                                value="inventory"
                                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <Package className="mr-2 h-4 w-4" />
                                Inventory
                            </TabsTrigger>
                            <TabsTrigger
                                value="pages"
                                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Pages
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {/* General Settings */}
                        <TabsContent value="general" className="mt-0 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="store_name">Store Name</Label>
                                    <Input
                                        id="store_name"
                                        value={formData.store_name}
                                        onChange={(e) => handleChange('store_name', e.target.value)}
                                        disabled={!canEdit}
                                        placeholder="My Shop"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="products_per_page">Products Per Page</Label>
                                    <Input
                                        id="products_per_page"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={formData.products_per_page}
                                        onChange={(e) => handleChange('products_per_page', parseInt(e.target.value) || 12)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="invoice_details">Invoice details</Label>
                                    <textarea
                                        id="invoice_details"
                                        rows={3}
                                        value={formData.invoice_details}
                                        onChange={(e) => handleChange('invoice_details', e.target.value)}
                                        disabled={!canEdit}
                                        placeholder={'Company name\nStreet 1, 1234 AB City\nVAT NL123456789B01'}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Printed at the top of every invoice: your address, company and VAT numbers.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between space-x-2 sm:col-span-2">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable_reviews">Enable Product Reviews</Label>
                                        <p className="text-xs text-muted-foreground">Allow customers to leave reviews on products</p>
                                    </div>
                                    <Switch
                                        id="enable_reviews"
                                        checked={formData.enable_reviews}
                                        onCheckedChange={(checked) => handleChange('enable_reviews', checked)}
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Currency Settings */}
                        <TabsContent value="currency" className="mt-0 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)} disabled={!canEdit}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((curr) => (
                                                <SelectItem key={curr.value} value={curr.value}>
                                                    {curr.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency_position">Currency Position</Label>
                                    <Select
                                        value={formData.currency_position}
                                        onValueChange={(value) => handleChange('currency_position', value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="before">Before price ($99.99)</SelectItem>
                                            <SelectItem value="after">After price (99.99$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thousand_separator">Thousand Separator</Label>
                                    <Select
                                        value={formData.thousand_separator}
                                        onValueChange={(value) => handleChange('thousand_separator', value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=",">Comma (1,000)</SelectItem>
                                            <SelectItem value=".">Period (1.000)</SelectItem>
                                            <SelectItem value=" ">Space (1 000)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="decimal_separator">Decimal Separator</Label>
                                    <Select
                                        value={formData.decimal_separator}
                                        onValueChange={(value) => handleChange('decimal_separator', value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=".">Period (99.99)</SelectItem>
                                            <SelectItem value=",">Comma (99,99)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="decimals">Number of Decimals</Label>
                                    <Input
                                        id="decimals"
                                        type="number"
                                        min={0}
                                        max={4}
                                        value={formData.decimals}
                                        onChange={(e) =>
                                            handleChange('decimals', Number.isNaN(parseInt(e.target.value)) ? 2 : parseInt(e.target.value))
                                        }
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Checkout, tax and shipping */}
                        <TabsContent value="checkout" className="mt-0 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="flex items-center justify-between space-x-2 sm:col-span-2">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable_checkout">Checkout open</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Switch off to keep the catalogue and cart but stop taking orders
                                        </p>
                                    </div>
                                    <Switch
                                        id="enable_checkout"
                                        checked={formData.enable_checkout}
                                        onCheckedChange={(checked) => handleChange('enable_checkout', checked)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tax_rate">Tax rate (%)</Label>
                                    <Input
                                        id="tax_rate"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.01"
                                        value={formData.tax_rate}
                                        onChange={(e) => handleChange('tax_rate', e.target.value)}
                                        disabled={!canEdit}
                                    />
                                    <p className="text-xs text-muted-foreground">Charged on products and shipping. 0 turns tax off.</p>
                                </div>

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="prices_include_tax">Prices include tax</Label>
                                        <p className="text-xs text-muted-foreground">
                                            On: the price you enter is what customers pay. Off: tax is added at checkout.
                                        </p>
                                    </div>
                                    <Switch
                                        id="prices_include_tax"
                                        checked={formData.prices_include_tax}
                                        onCheckedChange={(checked) => handleChange('prices_include_tax', checked)}
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label>Shipping methods</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Customers pick one at checkout. Leave &quot;Free over&quot; empty for no free-shipping threshold. No methods
                                        means no shipping charge.
                                    </p>
                                </div>
                                {formData.shipping_methods.map((method, index) => (
                                    <div key={index} className="grid grid-cols-[1fr_7rem_7rem_auto] items-end gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor={`sm-name-${index}`} className="text-xs">
                                                Name
                                            </Label>
                                            <Input
                                                id={`sm-name-${index}`}
                                                value={method.name}
                                                onChange={(e) => updateMethod(index, { name: e.target.value })}
                                                placeholder="Standard"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`sm-price-${index}`} className="text-xs">
                                                Price
                                            </Label>
                                            <Input
                                                id={`sm-price-${index}`}
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={method.price}
                                                onChange={(e) => updateMethod(index, { price: e.target.value })}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`sm-free-${index}`} className="text-xs">
                                                Free over
                                            </Label>
                                            <Input
                                                id={`sm-free-${index}`}
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={method.free_over ?? ''}
                                                onChange={(e) => updateMethod(index, { free_over: e.target.value })}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Remove ${method.name || 'shipping method'}`}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    shipping_methods: prev.shipping_methods.filter((_, i) => i !== index),
                                                }))
                                            }
                                            disabled={!canEdit}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            shipping_methods: [...prev.shipping_methods, { name: '', price: 0, free_over: null }],
                                        }))
                                    }
                                    disabled={!canEdit || formData.shipping_methods.length >= 20}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add shipping method
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Inventory Settings */}
                        <TabsContent value="inventory" className="mt-0 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="flex items-center justify-between space-x-2 sm:col-span-2">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable_stock_management">Enable Stock Management</Label>
                                        <p className="text-xs text-muted-foreground">Track inventory levels for products</p>
                                    </div>
                                    <Switch
                                        id="enable_stock_management"
                                        checked={formData.enable_stock_management}
                                        onCheckedChange={(checked) => handleChange('enable_stock_management', checked)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {formData.enable_stock_management && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                                            <Input
                                                id="low_stock_threshold"
                                                type="number"
                                                min={0}
                                                value={formData.low_stock_threshold}
                                                onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 5)}
                                                disabled={!canEdit}
                                            />
                                            <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                                        </div>

                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="out_of_stock_visibility">Show Out of Stock Products</Label>
                                                <p className="text-xs text-muted-foreground">Display products even when out of stock</p>
                                            </div>
                                            <Switch
                                                id="out_of_stock_visibility"
                                                checked={formData.out_of_stock_visibility}
                                                onCheckedChange={(checked) => handleChange('out_of_stock_visibility', checked)}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* Pages Settings */}
                        <TabsContent value="pages" className="mt-0 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cart_page_id">Cart Page ID</Label>
                                    <Input
                                        id="cart_page_id"
                                        type="number"
                                        value={formData.cart_page_id || ''}
                                        onChange={(e) => handleChange('cart_page_id', e.target.value ? parseInt(e.target.value) : null)}
                                        disabled={!canEdit}
                                        placeholder="Leave empty for default"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="checkout_page_id">Checkout Page ID</Label>
                                    <Input
                                        id="checkout_page_id"
                                        type="number"
                                        value={formData.checkout_page_id || ''}
                                        onChange={(e) => handleChange('checkout_page_id', e.target.value ? parseInt(e.target.value) : null)}
                                        disabled={!canEdit}
                                        placeholder="Leave empty for default"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="terms_page_id">Terms & Conditions Page ID</Label>
                                    <Input
                                        id="terms_page_id"
                                        type="number"
                                        value={formData.terms_page_id || ''}
                                        onChange={(e) => handleChange('terms_page_id', e.target.value ? parseInt(e.target.value) : null)}
                                        disabled={!canEdit}
                                        placeholder="Leave empty for default"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            {canEdit && (
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            )}
        </form>
    );
}
