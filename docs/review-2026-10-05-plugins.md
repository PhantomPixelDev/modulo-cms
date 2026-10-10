# Installed plugin review — 2026-10-05

This pass reviews the installed distribution repositories, which are separate from
Modulo core: Shop 1.7.1, Contact Form 1.1.0 and the inactive Hello World 1.0.0 sample.
Earlier reports covered core and its plugin framework, rather than these installed
plugins' business logic. Fixes belong in their upstream repositories.

## Changes

Shop 1.8.0:

- Escape titles, image attributes and SKU text in product shortcodes; sanitize rich
  product content. Three DOM-based regression cases reproduced executable elements
  and event attributes before the fix.
- Exclude private product types and taxonomies from catalog routes, related products,
  cart loading and shortcodes. Price shortcodes also require a released product.
- Return public product fields in catalog JSON instead of complete Post models and
  arbitrary metadata. Clients using `meta_data.price` must now use `price`; the plugin
  README documents this change.
- Validate catalog filters and handle array access keys as unauthorized instead of
  raising server errors. Reject malformed Mollie notification IDs before outbound
  requests, and validate payment-method input.
- Preserve refunded payments when a delayed success notification arrives.
- Lock and reload orders for admin updates, refunds and deletions. Requests holding
  stale models cannot return stock twice, repeat a completed refund, or delete an
  order reopened by another request. The stock regression reproduced 7 available
  units where the original inventory was 5.
- Eager-load taxonomy data, aggregate shortcode category counts in SQL, and cap
  shortcode product limits at 60.

Contact Form 1.1.1 rejects line breaks in visitor-provided mail-header fields. Its
dedicated limiter permits ten submissions per IP per minute, regardless of email
rotation, without consuming the login limiter. Tests cover malformed and oversized
input, mail rendering and submission limits. These tests do not establish an SMTP
header-injection exploit; they verify rejection at the input boundary.

Core now safely handles non-string email input in its authentication limiter. Two
regression cases reproduced server errors on login and password-reset requests.

Both active plugin repositories now test SQLite and PostgreSQL 16 in CI. No plugin
implementation was added to the core repository. Hello World's small provider was
inspected: it adds a boot log and a site-name filter; it remains inactive.

## Validation and coverage

The original plugin suites passed 98 cases. This pass adds 33 plugin cases and two
core cases. The final plugin suite passes 131 cases on PostgreSQL (573 assertions).
The combined core/plugin SQLite run passes 612 cases (2,439 assertions), with one
PostgreSQL-only case skipped. Core PHPStan passes without changing its baseline;
the combined PostgreSQL run passes all 613 cases (2,441 assertions).
Pint checks pass. Shop TypeScript and its admin bundle build pass, the generated
bundle is unchanged, and npm audit reports zero vulnerabilities.

Tests used a separate source copy, a dedicated PostgreSQL database/container and
private Docker network. Browser checks use a second fixture database and a loopback
Nginx/PHP-FPM stack accessed through SSH. Email uses a log driver and payment APIs
are mocked; no production order, contact or payment data was used.

Public/plugin permissions, checkout totals, stock, coupon expiry/limits, customer
accounts, guest secret links, invoices, payment signatures/amounts and repeated
notifications are exercised by the plugin suites. Core package tests also cover
checksums, unsafe archives, requirements, upgrades and route caches. Download and
archive handling were reread; this pass did not establish a new exploitable flaw
in those boundaries.

## Remaining coverage gaps

- Actual Stripe, PayPal and Mollie sandbox/live round trips and external refund
  reconciliation; mocked responses do not validate configured provider accounts.
- A process or database failure after a provider accepts a refund but before local
  persistence. Order locking covers overlapping local requests, not distributed
  atomicity with an external payment provider.
- Multi-process shop checkout/payment stress and changing prices/settings during
  checkout. Stale-model order regressions and PostgreSQL tests are not a capacity
  or comprehensive race-condition benchmark.
- Sustained load/capacity testing and a full production backup restoration drill.
- Delivery through real SMTP, external storage integrations, and rescanning older
  uploaded SVG files.
- Every legacy shortcode's variation/sale-date presentation, every theme variant,
  and runtime activation of the inactive Hello World sample.

These gaps remain explicit; passing the checks above is not a claim that every
plugin feature or deployment scenario has been exercised.
