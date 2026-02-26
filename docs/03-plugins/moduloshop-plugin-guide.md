# ModuloShop Plugin Guide

ModuloShop adds e-commerce capabilities to Modulo CMS.

## Capabilities

- Shop catalog under `/shop`
- Cart and checkout routes
- Product and order admin screens under dashboard admin area
- Plugin settings (currency, shipping, gateways, etc.)

## Manifest highlights

`plugins/ModuloShop/plugin.json` includes:
- `slug`: `modulo-shop`
- `migrations_path`: `database/migrations`
- `seeder`: `Plugins\\ModuloShop\\database\\seeders\\ShopSeeder`

## Public routes

- `/shop`
- `/shop/{slug}`
- `/shop/cart/*`
- `/shop/checkout`
- `/product-category/{slug}`

## Admin routes

Prefixed under:
- `/dashboard/admin/shop/*`

Access control:
- `auth`, `verified`, and role/permission checks.

## Operational notes

- Product post type is ensured/seeded on plugin boot when missing.
- Keep checkout/payment integrations plugin-scoped.

## Related docs

- [Plugin Lifecycle](./plugin-lifecycle.md)
- [Public Routes](../04-api/public-routes.md)
