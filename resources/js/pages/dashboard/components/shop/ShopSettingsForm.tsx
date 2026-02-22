import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, CreditCard, Package, Settings, Save } from 'lucide-react';

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
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <Tabs defaultValue="general" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
              >
                <Store className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="currency"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Currency
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
              >
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger
                value="pages"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
              >
                <Settings className="h-4 w-4 mr-2" />
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
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                    disabled={!canEdit}
                  >
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
                    onChange={(e) => handleChange('decimals', parseInt(e.target.value) || 2)}
                    disabled={!canEdit}
                  />
                </div>
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
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      )}
    </form>
  );
}
