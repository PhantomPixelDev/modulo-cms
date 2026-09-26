// Shapes of what the shop's admin controllers send to these screens.

export interface BaseEntity {
    id: number;
    created_at?: string;
    updated_at?: string;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ShopProduct extends BaseEntity {
    sku?: string | null;
    name: string;
    slug: string;
    description?: string | null;
    price: string;
    sale_price?: string | null;
    currency: string;
    is_active: boolean;
    status?: 'draft' | 'published' | 'pending' | 'private';
    stock?: number | null;
    featured_image?: string | null;
    meta?: Record<string, any> | null;
}

export interface ShopCoupon extends BaseEntity {
    code: string;
    description: string | null;
    type: 'percent' | 'fixed' | 'free_shipping';
    amount: number;
    min_subtotal: number | null;
    starts_at: string | null;
    expires_at: string | null;
    usage_limit: number | null;
    used_count: number;
    is_active: boolean;
}

export interface ShopGatewayField {
    key: string;
    label: string;
    type: 'text' | 'secret' | 'select' | 'textarea';
    options?: Record<string, string>;
    help?: string;
}

export interface ShopGateway {
    id: string;
    label: string;
    online: boolean;
    enabled: boolean;
    configured: boolean;
    fields: ShopGatewayField[];
    /** Secret fields are true/false (set or not), never the value */
    values: Record<string, string | boolean | null>;
    webhook_url: string | null;
}

export interface ShopOrder extends BaseEntity {
    order_number: string;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    total: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    item_count: number;
}
