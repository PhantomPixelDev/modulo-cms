import { Button, Checkbox, Input, Label, MediaPickerDialog } from '@modulo/ui';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export interface VariantRow {
    id?: string;
    name: string;
    sku: string;
    price: string;
    stock: string;
}

export interface ProductDetails {
    sale_price: string;
    sale_starts_at: string;
    sale_ends_at: string;
    weight: string;
    featured_image: string;
    gallery: string[];
    categories: number[];
    tags: number[];
    variants: VariantRow[];
}

export interface Term {
    id: number;
    name: string;
}

function TermPicker({ label, terms, selected, onChange }: { label: string; terms: Term[]; selected: number[]; onChange: (ids: number[]) => void }) {
    if (terms.length === 0) {
        return (
            <div className="space-y-1">
                <Label>{label}</Label>
                <p className="text-xs text-muted-foreground">None yet. Add them under the shop taxonomies.</p>
            </div>
        );
    }

    return (
        <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{label}</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {terms.map((term) => (
                    <label key={term.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={selected.includes(term.id)}
                            onCheckedChange={(checked) =>
                                onChange(checked === true ? [...selected, term.id] : selected.filter((id) => id !== term.id))
                            }
                        />
                        {term.name}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/**
 * The parts of a product beyond name and price: sale window, images,
 * categories and variations. Controlled: the parent owns the values.
 */
export function ProductDetailsFields({
    value,
    onChange,
    categories,
    tags,
    errors,
}: {
    value: ProductDetails;
    onChange: (patch: Partial<ProductDetails>) => void;
    categories: Term[];
    tags: Term[];
    errors: Record<string, string>;
}) {
    const [picking, setPicking] = useState<'featured' | 'gallery' | null>(null);
    const error = (key: string) => (errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null);

    const setVariant = (index: number, patch: Partial<VariantRow>) =>
        onChange({ variants: value.variants.map((row, i) => (i === index ? { ...row, ...patch } : row)) });

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                    <Label htmlFor="pd-sale">Sale price</Label>
                    <Input
                        id="pd-sale"
                        type="number"
                        min={0}
                        step="0.01"
                        value={value.sale_price}
                        onChange={(e) => onChange({ sale_price: e.target.value })}
                    />
                    {error('sale_price')}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pd-sale-from">Sale from</Label>
                    <Input
                        id="pd-sale-from"
                        type="date"
                        value={value.sale_starts_at}
                        onChange={(e) => onChange({ sale_starts_at: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pd-sale-to">Sale until</Label>
                    <Input id="pd-sale-to" type="date" value={value.sale_ends_at} onChange={(e) => onChange({ sale_ends_at: e.target.value })} />
                    {error('sale_ends_at')}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pd-weight">Weight (kg)</Label>
                    <Input
                        id="pd-weight"
                        type="number"
                        min={0}
                        step="0.001"
                        value={value.weight}
                        onChange={(e) => onChange({ weight: e.target.value })}
                    />
                </div>
                <p className="text-xs text-muted-foreground md:col-span-4">Leave the dates empty for a sale without a start or end.</p>
            </section>

            <section className="space-y-2">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                        {value.featured_image ? (
                            <div className="relative">
                                <img src={value.featured_image} alt="" className="h-24 w-24 rounded-md border object-cover" />
                                <button
                                    type="button"
                                    onClick={() => onChange({ featured_image: '' })}
                                    className="absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow"
                                    aria-label="Remove main image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <Button type="button" variant="outline" className="h-24 w-24 flex-col" onClick={() => setPicking('featured')}>
                                <ImagePlus className="h-5 w-5" />
                                <span className="text-xs">Main image</span>
                            </Button>
                        )}
                    </div>
                    {value.gallery.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                            <img src={url} alt="" className="h-24 w-24 rounded-md border object-cover" />
                            <button
                                type="button"
                                onClick={() => onChange({ gallery: value.gallery.filter((_, i) => i !== index) })}
                                className="absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow"
                                aria-label="Remove image"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" className="h-24 w-24 flex-col" onClick={() => setPicking('gallery')}>
                        <Plus className="h-5 w-5" />
                        <span className="text-xs">Gallery</span>
                    </Button>
                </div>
                <MediaPickerDialog
                    open={picking !== null}
                    onOpenChange={(open) => !open && setPicking(null)}
                    onSelect={(item) => {
                        if (picking === 'featured') onChange({ featured_image: item.url });
                        if (picking === 'gallery') onChange({ gallery: [...value.gallery, item.url] });
                        setPicking(null);
                    }}
                />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <TermPicker label="Categories" terms={categories} selected={value.categories} onChange={(ids) => onChange({ categories: ids })} />
                <TermPicker label="Tags" terms={tags} selected={value.tags} onChange={(ids) => onChange({ tags: ids })} />
            </section>

            <section className="space-y-2">
                <div>
                    <Label>Variations</Label>
                    <p className="text-xs text-muted-foreground">
                        Sizes, colours… Customers must pick one. Empty price uses the product price; empty stock is not tracked.
                    </p>
                </div>
                {value.variants.map((row, index) => (
                    <div key={row.id ?? `new-${index}`} className="grid grid-cols-[1fr_7rem_6rem_5rem_auto] items-end gap-2">
                        <div className="space-y-1">
                            {index === 0 && <Label className="text-xs">Option</Label>}
                            <Input
                                value={row.name}
                                placeholder="Red / L"
                                onChange={(e) => setVariant(index, { name: e.target.value })}
                                aria-label="Option name"
                            />
                        </div>
                        <div className="space-y-1">
                            {index === 0 && <Label className="text-xs">SKU</Label>}
                            <Input value={row.sku} onChange={(e) => setVariant(index, { sku: e.target.value })} aria-label="Option SKU" />
                        </div>
                        <div className="space-y-1">
                            {index === 0 && <Label className="text-xs">Price</Label>}
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={row.price}
                                onChange={(e) => setVariant(index, { price: e.target.value })}
                                aria-label="Option price"
                            />
                        </div>
                        <div className="space-y-1">
                            {index === 0 && <Label className="text-xs">Stock</Label>}
                            <Input
                                type="number"
                                min={0}
                                value={row.stock}
                                onChange={(e) => setVariant(index, { stock: e.target.value })}
                                aria-label="Option stock"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onChange({ variants: value.variants.filter((_, i) => i !== index) })}
                            aria-label={`Remove ${row.name || 'option'}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {error('variants')}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ variants: [...value.variants, { name: '', sku: '', price: '', stock: '' }] })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add variation
                </Button>
            </section>
        </div>
    );
}

/** Form values for a product as the API returns it. */
export function detailsFrom(product: Record<string, unknown> | null | undefined): ProductDetails {
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    return {
        sale_price: str(product?.sale_price),
        sale_starts_at: str(product?.sale_starts_at).slice(0, 10),
        sale_ends_at: str(product?.sale_ends_at).slice(0, 10),
        weight: str(product?.weight),
        featured_image: str(product?.featured_image),
        gallery: Array.isArray(product?.gallery) ? product.gallery.filter((g: unknown) => typeof g === 'string') : [],
        categories: Array.isArray(product?.categories) ? product.categories : [],
        tags: Array.isArray(product?.tags) ? product.tags : [],
        variants: Array.isArray(product?.variants)
            ? product.variants.map((v: Record<string, unknown>) => ({
                  id: typeof v.id === 'string' ? v.id : undefined,
                  name: str(v.name),
                  sku: str(v.sku),
                  price: str(v.price),
                  stock: str(v.stock),
              }))
            : [],
    };
}

/** Payload for the product API; empty strings become null. */
export function detailsPayload(d: ProductDetails) {
    const num = (v: string) => (v.trim() === '' ? null : Number(v));

    return {
        sale_price: num(d.sale_price),
        sale_starts_at: d.sale_starts_at || null,
        sale_ends_at: d.sale_ends_at || null,
        weight: num(d.weight),
        featured_image: d.featured_image || null,
        gallery: d.gallery,
        categories: d.categories,
        tags: d.tags,
        variants: d.variants
            .filter((v) => v.name.trim() !== '')
            .map((v) => ({ id: v.id, name: v.name.trim(), sku: v.sku || null, price: num(v.price), stock: num(v.stock) })),
    };
}
