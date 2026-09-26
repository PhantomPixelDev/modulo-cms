// Admin URLs of the shop, built with the core's global route() (Ziggy).
export const ROUTE = {
    shop: {
        products: {
            index: () => route('dashboard.admin.shop.products.index'),
            store: () => route('dashboard.admin.shop.products.store'),
            update: (id: number | string) => route('dashboard.admin.shop.products.update', { post: id }),
            destroy: (id: number | string) => route('dashboard.admin.shop.products.destroy', { post: id }),
        },
        orders: {
            index: () => route('dashboard.admin.shop.orders.index'),
            show: (id: number | string) => route('dashboard.admin.shop.orders.show', { order: id }),
            update: (id: number | string) => route('dashboard.admin.shop.orders.update', { order: id }),
            destroy: (id: number | string) => route('dashboard.admin.shop.orders.destroy', { order: id }),
            refund: (id: number | string) => route('dashboard.admin.shop.orders.refund', { order: id }),
            notes: (id: number | string) => route('dashboard.admin.shop.orders.notes.store', { order: id }),
        },
        payments: {
            index: () => route('dashboard.admin.shop.payments.index'),
            update: (gateway: string) => route('dashboard.admin.shop.payments.update', { gateway }),
        },
        coupons: {
            index: () => route('dashboard.admin.shop.coupons.index'),
            store: () => route('dashboard.admin.shop.coupons.store'),
            update: (id: number | string) => route('dashboard.admin.shop.coupons.update', { coupon: id }),
            destroy: (id: number | string) => route('dashboard.admin.shop.coupons.destroy', { coupon: id }),
        },
        settings: {
            index: () => route('dashboard.admin.shop.settings.index'),
        },
    },
};
