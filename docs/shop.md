# Shop guide

[Documentation home](index.md)

The shop is a separate plugin, [Modulo Shop](https://github.com/PhantomPixelDev/modulo-plugin-shop). It adds products, a cart, checkout, payments, and order management. The bundled Modern React theme includes its public templates; another theme must provide compatible templates to display the storefront.

## Install and activate

Open **Extensions → Plugins**, browse the registry, install **Modulo Shop**, and activate it. An administrator can also run:

```bash
php artisan plugin:install modulo-shop
php artisan plugin:activate modulo-shop
```

Open **Extensions → Shop**. Its screens include **Products**, **Orders**, **Payments**, **Coupons**, and **Settings**. Access depends on shop permissions. If the links are missing, check plugin activation and your role.

## Configure checkout

1. In **Shop → Settings**, set store details and currency.
2. Configure whether tax is included in prices or added at checkout, then add shipping methods. Check the result with a sample cart.
3. In **Shop → Payments**, enable and configure your payment methods. Supported methods include Stripe, PayPal, Mollie, cash on delivery, and bank transfer.
4. For online providers, configure the webhook endpoint shown by the plugin and test with the provider's test mode before accepting real payments.
5. Configure site email and confirm the queue worker processes order emails. See [troubleshooting](troubleshooting.md).

## Add a product

Open **Shop → Products** and create a product. Enter its name, slug, description, and price. Add a gallery, categories, and tags as needed, then choose draft or published status and save.

- A **draft** is private. A **published** product can appear in the storefront.
- A blank stock quantity means inventory is not tracked. A quantity of `0` means out of stock.
- Variations can have their own SKU, price, and stock. An empty variation price uses the product price; empty variation stock is not tracked.
- Sale prices can have start and end dates. Check the displayed price after saving.

Visit `/shop` to see the catalog. Products use `/shop/{slug}`. Add the shop to a site menu through **Appearance → Menus** to include it in navigation.

## Test the shopping flow

Open a published product, select any required variation, and add it to the cart. In the bundled theme, cart feedback appears in one notification at the top right. Repeated additions update that notification; **View cart** opens `/shop/cart`.

Review quantities, shipping, and totals, then continue to `/shop/checkout`. Guest checkout is supported. Signed-in customers can use `/shop/account` to see orders and manage saved addresses.

For an online payment, confirm payment status in the order after the provider's webhook arrives. Returning from the provider's checkout alone is not proof of payment. Unpaid online orders can expire and return their reserved stock.

## Manage orders and discounts

**Shop → Orders** shows order details, status, payment history, and customer notes. Update fulfillment and tracking information there. Provider refunds are available for supported payment methods.

**Shop → Coupons** supports percentage discounts, fixed discounts, and free shipping, with dates and usage limits. Test a coupon at checkout to confirm its conditions and effect on the total.

For developer details and plugin updates, read the [shop repository documentation](https://github.com/PhantomPixelDev/modulo-plugin-shop#readme). Core [upgrading](upgrading.md) and [backup](backup-restore.md) instructions also apply to shop installations.
