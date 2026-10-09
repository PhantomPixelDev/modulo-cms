# Demo fixtures and testing

The default demo is deliberately small: five pages, three published articles,
one unfinished draft, one future article, and two announcements. The active Shop
plugin adds three products: regular price, sale price, and sold out. Two content
translations, a page hierarchy, nested React partials, and one valid media-library
image cover features without dozens of filler records. There are three documented
demo accounts. Fresh normal production installations receive no sample content.

## Create or replace a disposable demo

After installing the CMS and activating the bundled `modern-react` theme:

```bash
php artisan modulo:seed-demo --force
```

To replace an old demo collection, first back up its database and files. Set
`MODULO_DEMO=true`, then run:

```bash
php artisan modulo:seed-demo --reset-content --force
```

This **permanently removes all posts, pages, products, menus and editor recovery
drafts**, including visitor content and trash. It clears configured front-page
IDs and seeds the compact collection. It retains users, settings, extensions,
media and shop order history. Database changes are transactional; files created
by media seeding are outside that transaction. Use it only on a disposable site.
Both `MODULO_DEMO=true` and `--force` are required for replacement in every
environment. Upgrades never run it automatically.

Reseeding without `--reset-content` updates the named examples but does not remove
an older collection. Optional products and Shop navigation are added only while
the Shop plugin is active. Announcement URLs use `/infos/{slug}`; pages use
`/{slug}`; articles use `/posts/{slug}`. A parent page does not add a URL segment.

## Regression checks

```bash
vendor/bin/pest tests/Feature/Frontend/DemoIntegrityTest.php tests/Feature/Frontend/RoutingTest.php
vendor/bin/pest -c config/testing/phpunit.pgsql.xml
npm run types
npx eslint --config config/tooling/eslint.config.js .
npm run format:check
npm run test:js
npm run build
```

The integrity suite follows every seeded published item, archive, translation,
taxonomy, menu, sitemap and RSS link. It also follows search-result URLs and
verifies drafts/future articles remain private, reseeding stays compact, normal
sites cannot replace content, and upgrades preserve customized content models.
Shop fixture tests live in the Shop repository and run against both databases.

Public content has its own per-IP limit (120 requests per minute by default),
separate from authentication and writes. Set `MODULO_PUBLIC_REQUESTS_PER_MINUTE`
to tune it for your installation.

After seeding a running test server, exercise actual browser navigation:

```bash
MODULO_E2E_URL=http://127.0.0.1:8000 MODULO_E2E_DEMO=1 npm run test:e2e -- z-demo-integrity.spec.ts
```

Browser CI first tests installation and editing, then replaces its disposable
content and runs this audit with the verified Shop plugin. It clicks search results, checks navigation and
discovery links, refreshes destinations, and exercises nested partials on mobile
and desktop. A 200 response alone is insufficient: search destinations must show
their expected heading, and modules must respond to interaction.

With Shop active, `MODULO_E2E_SHOP=1 npm run test:e2e -- z-demo-shop.spec.ts`
also checks product search, sale price, sold-out behavior, one cart toast,
cart totals, and a cash-on-delivery checkout using a fictional test customer.

For a deployed demo, suspend its content-reset job during deployment, retain a
compatible database/files/code backup, validate the new collection, capture the
clean baseline, exercise one complete reset, and resume the schedule.
