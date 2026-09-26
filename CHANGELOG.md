# Changelog

## [0.2.0](https://github.com/PhantomPixelDev/modulo-cms/compare/v0.1.2...v0.2.0) (2026-09-26)


### Features

* **api:** headless API v1 with personal API tokens ([6cc4e55](https://github.com/PhantomPixelDev/modulo-cms/commit/6cc4e5580fe8bc96d404130c02182f5beaa7db87))
* **content:** redirects, per-post SEO, logo and favicon ([73acf87](https://github.com/PhantomPixelDev/modulo-cms/commit/73acf873570e96ab5057e564b6b20be895762e6c))
* **content:** trash, revisions and scheduled publishing ([8a9a9f9](https://github.com/PhantomPixelDev/modulo-cms/commit/8a9a9f9c6b69ec70a9226f2003bdb23950352b0e))
* finish update center and backups (sidebar, rollback, tests, docs) ([abef7cd](https://github.com/PhantomPixelDev/modulo-cms/commit/abef7cd2215d106d6d069a2491c033440618f190))
* modulo:update self-updates a release-tarball install ([b477978](https://github.com/PhantomPixelDev/modulo-cms/commit/b4779782ba120010b855d95c5933bef4f1883425))
* **plugins:** requirements, lifecycle hooks and registry install from the admin ([1085403](https://github.com/PhantomPixelDev/modulo-cms/commit/1085403cec9a58384422284e6abf989b5e309640))
* **plugins:** working plugin frontend SDK (import map + shims + Vite preset) ([ef22b9d](https://github.com/PhantomPixelDev/modulo-cms/commit/ef22b9d06140a6643c6d271279aecee11bfd3d31))
* **security:** activity log with an admin page ([6d1cf58](https://github.com/PhantomPixelDev/modulo-cms/commit/6d1cf582da6ae6c23a952f915ca8f64377808ea4))
* **security:** security headers with nonce CSP, stronger passwords, two-factor login ([ebaa393](https://github.com/PhantomPixelDev/modulo-cms/commit/ebaa3937bb9be694b37cf62f58ec326b7816ae2c))
* **shop:** customer accounts, remembered addresses and terms (ModuloShop 1.4.0) ([79bdd8e](https://github.com/PhantomPixelDev/modulo-cms/commit/79bdd8e37e17ad76acee69ee295b99af01ce470b))
* **shop:** customer accounts, remembered addresses and terms (ModuloShop 1.4.0) ([928f4ea](https://github.com/PhantomPixelDev/modulo-cms/commit/928f4ea67ca91c2b71fcac61a1cb73321b6f2b03))
* **shop:** editable orders with history, notes and customer emails (ModuloShop 1.3.0) ([2d1eca7](https://github.com/PhantomPixelDev/modulo-cms/commit/2d1eca70c145cd4ab52b91cc00ed94a68e1a25cf))
* **shop:** editable orders with history, notes and customer emails (ModuloShop 1.3.0) ([3527b62](https://github.com/PhantomPixelDev/modulo-cms/commit/3527b62b8533091833ce3020e59bb321f5920fcf))
* **shop:** online payments with Stripe, PayPal and Mollie (ModuloShop 1.2.0) ([7eed562](https://github.com/PhantomPixelDev/modulo-cms/commit/7eed562d4934fcab02b3b71937b0bc62a5d33f00))
* **shop:** online payments with Stripe, PayPal and Mollie (ModuloShop 1.2.0) ([3fc484b](https://github.com/PhantomPixelDev/modulo-cms/commit/3fc484b65d8c38d8c257fad7d302912433c832ea))
* **shop:** product editor, sale dates and variations (ModuloShop 1.5.0) ([e471e43](https://github.com/PhantomPixelDev/modulo-cms/commit/e471e43d5b05795b5c7189e8e466cf47864b74b8))
* **shop:** product editor, sale dates and variations (ModuloShop 1.5.0) ([2bca15d](https://github.com/PhantomPixelDev/modulo-cms/commit/2bca15d5b990cd62a1ed0b444a389e67df492e24))
* **shop:** store money format, mini-cart, product rich results, invoices (ModuloShop 1.6.0) ([5f693d3](https://github.com/PhantomPixelDev/modulo-cms/commit/5f693d3e0a79f0880adf3b1d46b1d515c25c056a))
* **shop:** store money format, mini-cart, product rich results, invoices (ModuloShop 1.6.0) ([dfa6985](https://github.com/PhantomPixelDev/modulo-cms/commit/dfa69851acb6601b18ec8e962c939ba19e74387b))
* **shop:** tax, shipping methods and coupons (ModuloShop 1.1.0) ([6111aad](https://github.com/PhantomPixelDev/modulo-cms/commit/6111aad8e1b13bf93b6663507a06d985144c0d5e))
* **shop:** tax, shipping methods and coupons (ModuloShop 1.1.0) ([f27561f](https://github.com/PhantomPixelDev/modulo-cms/commit/f27561f26117f3ceb4f0e3e858bbc6af279eaec5))
* signed releases, release manifest and schema-version guard ([0a7f216](https://github.com/PhantomPixelDev/modulo-cms/commit/0a7f2163c47de3eb74eae1cf98f9bbc61003c32c))
* **themes:** child themes installable from the registry ([2730d44](https://github.com/PhantomPixelDev/modulo-cms/commit/2730d44ec636d0782f6cc942a88b42c57b4181a4))
* update center, scheduled update checks and full-site backups ([88807cd](https://github.com/PhantomPixelDev/modulo-cms/commit/88807cd0e259596c0bbaeabb5505de955219c5dd))


### Bug Fixes

* **contact-form:** send notifications when no recipient is set; subject optional ([935cf0c](https://github.com/PhantomPixelDev/modulo-cms/commit/935cf0cdb3932a97b2a8bc2db547c0c89e40dca1))
* make upgrades, updates and plugin installs safe to rely on ([bfc63a3](https://github.com/PhantomPixelDev/modulo-cms/commit/bfc63a3bcd1708e61e3b572b709423537cd6181f))
* phase 0 correctness pass (shop admin, publishing, permalinks) ([ddfa992](https://github.com/PhantomPixelDev/modulo-cms/commit/ddfa992870248013bbbb79f6714c462b0a1b4e66))
* phase 0 correctness pass (shop admin, publishing, permalinks) ([79e1e56](https://github.com/PhantomPixelDev/modulo-cms/commit/79e1e56cbf4cfb6bebe04d6d061785230c8e5d88))
* **plugins:** check the route cache file itself before rebuilding ([00c5e13](https://github.com/PhantomPixelDev/modulo-cms/commit/00c5e139ed0aa4b3fce4114ba28a8d8145a3a35d))
* **plugins:** plugin pages 404 after activation; contact form notifications ([1574e77](https://github.com/PhantomPixelDev/modulo-cms/commit/1574e77db1f533bb763e36bd2dc51c7ddaeeb361))
* **plugins:** rebuild the route cache when a plugin is switched on or off ([98eb4e7](https://github.com/PhantomPixelDev/modulo-cms/commit/98eb4e76591444aea6b7cd4d4d0a63eda1de9833))
* **shop:** seeder runs without a console; bump ModuloShop to 1.0.1 ([5c0113b](https://github.com/PhantomPixelDev/modulo-cms/commit/5c0113b0588b3c8e2600fde207b0ad6e89bffb2d))
* verify the installer's administrator; find plugin fixture by slug ([4cbd8a1](https://github.com/PhantomPixelDev/modulo-cms/commit/4cbd8a1290807a58269ad688801d69681ea0bbba))


### Performance

* send admin translations once and keep caches after install ([7f7df1e](https://github.com/PhantomPixelDev/modulo-cms/commit/7f7df1e630ba31ee3d1abe8311cc422d4f60c114))
* send admin translations once and keep caches after install ([90542b1](https://github.com/PhantomPixelDev/modulo-cms/commit/90542b19dc74b59d665b6340fffb0e5dae4a56c5))
* send the Ziggy route map once per audience ([3367dfe](https://github.com/PhantomPixelDev/modulo-cms/commit/3367dfe73846a4e418fae154718eb679f28eb739))

## [0.1.2](https://github.com/PhantomPixelDev/modulo-cms/compare/v0.1.1...v0.1.2) (2026-09-23)


### Bug Fixes

* scope media actions to the library, serve translated slugs ([#21](https://github.com/PhantomPixelDev/modulo-cms/issues/21)) ([d2fea5a](https://github.com/PhantomPixelDev/modulo-cms/commit/d2fea5aaca9c03deb6b5e777824978c5137bdac5))

## [0.1.1](https://github.com/PhantomPixelDev/modulo-cms/compare/v0.1.0...v0.1.1) (2026-09-21)


### Bug Fixes

* installer scripts start the published stack; clearer release assets ([#19](https://github.com/PhantomPixelDev/modulo-cms/issues/19)) ([a94a819](https://github.com/PhantomPixelDev/modulo-cms/commit/a94a819a2e057d9909bea2b32955c51d720ca554))

## 0.1.0 (2026-09-21)


### Features

* add a first-run installer and split the seeders ([4fc91ea](https://github.com/PhantomPixelDev/modulo-cms/commit/4fc91eadcc1d1c4655901911cceb83b83b2a73ea))
* add installer scripts for a one-command setup ([b0eaf58](https://github.com/PhantomPixelDev/modulo-cms/commit/b0eaf58f672240f40b2a0244a1a3bbe52164b445))
* add modern React theme with auth components and improved dashboard UI ([f8b424a](https://github.com/PhantomPixelDev/modulo-cms/commit/f8b424ab1a0ad394dc4780c64ef354c560a74a25))
* add modulo:upgrade with preflight checks ([1bace0c](https://github.com/PhantomPixelDev/modulo-cms/commit/1bace0c9356d9f42381a5e45b44c7751a40031cb))
* add update checks, a schema baseline and an upgrade CI gate ([c85768b](https://github.com/PhantomPixelDev/modulo-cms/commit/c85768b2f9b6cb04640b670b710a3f77c26335bf))
* finish the operator tooling, e2e coverage and documentation ([4346d22](https://github.com/PhantomPixelDev/modulo-cms/commit/4346d22d302b5eb3e63ef23897b13878d50dea4b))
* give the build a version and an install channel ([6cff011](https://github.com/PhantomPixelDev/modulo-cms/commit/6cff0118a4cd4daa24677db7064b453ec072f604))
* implement media folders and featured image picker ([313baf0](https://github.com/PhantomPixelDev/modulo-cms/commit/313baf0e3e5f748e84039f6cedae2c56d82ea903))
* implement rich text editor with HTML and Markdown support ([610116e](https://github.com/PhantomPixelDev/modulo-cms/commit/610116e848ddb3129a71d2c86b409e056d077063))
* implement sitemap generation and media library with enhanced post management ([596b72f](https://github.com/PhantomPixelDev/modulo-cms/commit/596b72f8e4bfafa4a550af308229f70626c63659))
* install and update plugins from a registry ([77a5c95](https://github.com/PhantomPixelDev/modulo-cms/commit/77a5c9526b336cd5b69a1c7022790f580125883c))
* let plugins ship their own React components ([f74cd10](https://github.com/PhantomPixelDev/modulo-cms/commit/f74cd1042439b0515aab09d3867d69a3dcdeac6a))
* migrate to new Flexia theme with updated dashboard components ([2d8d19b](https://github.com/PhantomPixelDev/modulo-cms/commit/2d8d19bdc081fb6d3e05f95f96e6e5d98d612481))
* publish releases as images and a prebuilt tarball ([faf0fde](https://github.com/PhantomPixelDev/modulo-cms/commit/faf0fde839899191d5c810d57b1761f553dfdac2))


### Bug Fixes

* build releases, per-database install lock, green e2e ([#15](https://github.com/PhantomPixelDev/modulo-cms/issues/15)) ([dc22f96](https://github.com/PhantomPixelDev/modulo-cms/commit/dc22f96f7eea2a2ab7ee2bc22ef62fbfac69bb5d))
* **ci:** let release-please read its config and bump VERSION ([#16](https://github.com/PhantomPixelDev/modulo-cms/issues/16)) ([5db4dcf](https://github.com/PhantomPixelDev/modulo-cms/commit/5db4dcf83a896e1222ca207093b56d29a86a06c2))
* **ci:** tag releases vX.Y.Z, without the package name ([#18](https://github.com/PhantomPixelDev/modulo-cms/issues/18)) ([429788d](https://github.com/PhantomPixelDev/modulo-cms/commit/429788dc3dec52cb1836872f3d450fb35623142d))
* let release-please read its own manifest ([c637239](https://github.com/PhantomPixelDev/modulo-cms/commit/c6372391ab370f14aaf9fa81b3dcc7e75e1b67b6))
* make the first release 0.1.0 rather than 1.0.0 ([a68ac72](https://github.com/PhantomPixelDev/modulo-cms/commit/a68ac7287140a9de8e447115115211c0976fab1d))
* make the suite pass on PostgreSQL, and tidy dead commands ([8e63ec4](https://github.com/PhantomPixelDev/modulo-cms/commit/8e63ec46c2b63d89b26a946eba0644b29aca3187))
* run plugin migrations when a plugin is updated ([c25a896](https://github.com/PhantomPixelDev/modulo-cms/commit/c25a896b77bc4c225169bc86ad1621f20094ec31))
* stop the e2e job gating merges until it is verified ([27fd548](https://github.com/PhantomPixelDev/modulo-cms/commit/27fd548a7d838a92f0f4f33496b72efa1f4e9b40))
* stop the release workflow cancelling itself ([bdc052b](https://github.com/PhantomPixelDev/modulo-cms/commit/bdc052bdbc82edbfa6e34ffa363fce03ff2c6a48))
* stop the test suite running against the development database ([1b57647](https://github.com/PhantomPixelDev/modulo-cms/commit/1b576475be74fe35179a68ac471ef032d4b9a9f1))
* write the release tarball outside the tree it archives ([c716f9e](https://github.com/PhantomPixelDev/modulo-cms/commit/c716f9ed4bbd8f084c9f32e009973e93565e1268))
