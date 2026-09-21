# Changelog

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
