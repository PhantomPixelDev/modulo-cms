# Versioning and build identity

## Where the version lives

A plain-text `VERSION` file at the project root. That choice is forced rather than
stylistic — three install channels have to agree on the version, and only a committed
file is visible to all of them:

- **Docker** — `.dockerignore` excludes `.git`, so `git describe` cannot run inside an
  image build. The build additionally accepts a `MODULO_VERSION` argument and writes it
  into `VERSION`, so an image is stamped even when built from an arbitrary checkout.
- **Release tarball** — ships no `.git` at all.
- **Git checkout** — has `.git`, but the production entrypoint runs `config:cache`, so
  configuration must stay pure and side-effect free. Shelling out to git at config-load
  time is not an option.

`config/version.php` reads the file (or `MODULO_VERSION`) and nothing else reads it
directly.

## Reading it in code

Always through `App\Support\Version`, never `config('version.*')`:

```php
Version::current();              // "1.4.2" or "0.0.0-dev"
Version::isDev();                // true on an untagged working copy
Version::satisfiesMinimum('1.2.0');
Version::compare('v1.5.0');      // -1, 0 or 1; a leading "v" is ignored
```

`0.0.0-dev` is a sentinel meaning "untagged working copy", not a real version.
**Anything that gates on a version must treat a development build as "unknown, allow
with a warning"** — which `satisfiesMinimum()` already does by returning `true`. The
alternative is that every plugin becomes uninstallable on a development checkout,
because `0.0.0` fails every constraint.

## Install channel

`App\Support\InstallChannel::detect()` returns `docker`, `tarball` or `git`, checking
`/.dockerenv` and `/run/.containerenv` (Podman) first, then `.git`. Override with
`MODULO_INSTALL_CHANNEL` when detection would be wrong — for example an image built
from a checkout that still contains `.git`.

The channel exists because **a Docker install cannot update itself in place**, and that
is a hard architectural fact rather than a policy preference:

1. `docker/php.ini` sets `opcache.validate_timestamps = 0`, so rewritten files are never
   re-read.
2. The `web` image does `COPY --from=app /var/www/html/public` at *build* time, so an
   app container that rewrote `public/build` would leave PHP serving new markup while
   nginx served stale assets.
3. `compose up` replaces the container filesystem wholesale, discarding any in-place
   change.

`InstallChannel::canSelfUpdate()` returns false there, and the admin shows the correct
command for the detected channel instead of pretending one updater fits all three.

## Where it surfaces

- `GET /health` — `version` and `channel`, so a deploy can be diffed against what was
  expected without shelling into a container.
- Inertia shared props as `modulo`, and the System card under **Site Settings**.

## Cutting a release

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org).
`release-please` watches `main`, maintains a release pull request, and on merge writes
`VERSION` and `CHANGELOG.md` and pushes a `vX.Y.Z` tag. The tag is what the release
workflow builds images and the tarball from.

`feat` bumps the minor, `fix` and `perf` the patch. A `!` before the colon or a
`BREAKING CHANGE:` footer forces a major. While the project is pre-1.0,
`bump-minor-pre-major` keeps breaking changes at minor bumps rather than jumping to 2.0.

Nothing is released by pushing a tag by hand; do it through the release pull request so
`VERSION`, the changelog and the tag stay consistent.

`VERSION` is the only file release-please rewrites. `package.json` deliberately stays at
`0.0.0-dev`: bumping it would leave `package-lock.json`'s root version behind on every
release, and the release job runs `npm ci`, which is strict about those two agreeing.
The package is private and never published to npm, so its version field carries no
meaning — `App\Support\Version` is what anything should read.
