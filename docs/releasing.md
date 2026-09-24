# Releasing

## What a release produces

One tag produces two delivery channels, because the project supports Docker and
bare-metal installs equally:

| Artifact | Contents |
|---|---|
| `ghcr.io/phantompixeldev/modulo-cms` | PHP-FPM app image, `linux/amd64` + `linux/arm64` |
| `ghcr.io/phantompixeldev/modulo-cms-web` | nginx image serving `public/` |
| `modulo-cms-<version>.tar.gz` | Full source **with `vendor/` and `public/build` prebuilt** |
| `…​.tar.gz.sha256` | Checksum for the tarball |
| `…​.tar.gz.sigstore.json` | Keyless Sigstore signature bundle for the tarball |
| `release.json` (+ `.sigstore.json`) | Machine-readable manifest: version, channel, security/breaking flags, new migrations, requirements, artifact checksums and image digests |
| `docker-compose.yml`, `env.prod.example` | So a Docker install needs no git clone (the env template is published without its leading dot; GitHub renames dotfile assets) |
| `install.sh`, `install.ps1`, `modulo` | One-line installers, and the site helper they place next to `docker-compose.yml` (`./modulo update / backup / restore`) |

The tarball ships its dependencies already installed and its assets already built, so a
bare-metal install needs **neither Composer nor Node** on the target host. That is why
it is assembled with `tar` over the working tree rather than `git archive` — git cannot
include files it does not track.

Images are tagged `X.Y.Z`, `X.Y`, `X`, and `latest`. A prerelease (any version with a
hyphen, such as `1.2.0-rc.1`) is published but deliberately **does not move `latest`**.

Both images are signed with cosign (keyless, by digest) and carry SLSA provenance and
an SPDX SBOM as build attestations.

## release.json

```json
{
  "schema": 1,
  "version": "1.2.0",
  "channel": "stable",
  "previous_version": "1.1.3",
  "security": false,
  "breaking": false,
  "requires_migrations": true,
  "new_migrations": 2,
  "requirements": { "php": "^8.4", "postgres": ">=16" },
  "artifacts": {
    "tarball": { "name": "modulo-cms-1.2.0.tar.gz", "sha256": "…", "signature": "modulo-cms-1.2.0.tar.gz.sigstore.json" },
    "images": { "app": { "image": "ghcr.io/phantompixeldev/modulo-cms", "digest": "sha256:…" }, "web": { … } }
  }
}
```

`security` is set when a commit since the previous release is typed `fix(security): …`
(or carries a `SECURITY:` footer); `breaking` when one has `!` or a `BREAKING CHANGE:`
footer. Use those conventions — the updater will surface security releases prominently.

## Verifying a release

No keys are involved: each signature is a short-lived certificate tying the file to the
`release` workflow in this repository, logged in the public Sigstore transparency log.

```bash
# An image (by tag or digest)
cosign verify ghcr.io/phantompixeldev/modulo-cms:1.2.0 \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/PhantomPixelDev/modulo-cms/\.github/workflows/release\.yml@'

# The tarball (same for release.json)
cosign verify-blob modulo-cms-1.2.0.tar.gz \
  --bundle modulo-cms-1.2.0.tar.gz.sigstore.json \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/PhantomPixelDev/modulo-cms/\.github/workflows/release\.yml@'
```

## Cutting one

1. Merge work to `main` using [Conventional Commits](https://www.conventionalcommits.org).
2. `release-please` maintains a release pull request. Review the version bump and the
   changelog it proposes.
3. Merge that pull request. It writes `VERSION` and `CHANGELOG.md`, pushes the `vX.Y.Z`
   tag, and creates the GitHub release.
4. `release-please` then calls the `release` workflow directly (a tag pushed with
   `GITHUB_TOKEN` does not trigger other workflows). It runs the full test, lint and
   browser (e2e) suites — including upgrades from each of the three previous stable
   releases — then builds
   and pushes the images, builds and verifies the tarball, and attaches everything to
   the release.

Do not push a tag by hand. The release pull request is what keeps `VERSION`, the
changelog and the tag consistent with each other.

## Rehearsing without releasing

`release` accepts `workflow_dispatch` with a version input. That path runs the whole
pipeline — including the **arm64 build**, which is the part most likely to break — but
sets `push: false` and skips publishing entirely.

Use it after any change to `docker/Dockerfile` or `package.json`.

## The arm64 trap

`package.json` hard-pins three x64-only packages in `optionalDependencies`:

```
@rollup/rollup-linux-x64-gnu
@tailwindcss/oxide-linux-x64-gnu
lightningcss-linux-x64-gnu
```

On arm64 an asset build therefore **fails outright** rather than running slowly. The
`vendor` and `assets` stages in `docker/Dockerfile` are pinned with
`FROM --platform=$BUILDPLATFORM` so they always run natively on the builder. Both emit
architecture-independent output — PHP source and JS bundles — so this is correct as
well as fast.

If you remove those pins, arm64 releases stop working. Rehearse with
`workflow_dispatch` before trusting a change there.

## Installing a release

**Docker** — `curl -fsSL …/install.sh | sh` for a new site. An existing one updates
with `./modulo update 1.2.3` from its install folder (see [upgrading](upgrading.md)).
From a repository checkout:

```bash
MODULO_TAG=1.2.3 ./modulo.sh up prod
```

**Bare metal** — download the tarball and its checksum, verify, extract:

```bash
sha256sum -c modulo-cms-1.2.3.tar.gz.sha256
tar -xzf modulo-cms-1.2.3.tar.gz
```

Then point a web server at `public/`, create `.env` from `env.prod.example`, and run
`php artisan modulo:install` (new site) or `php artisan modulo:upgrade` (existing
site). No Composer or Node required.

## Building images locally

```bash
MODULO_BUILD=1 ./modulo.sh up prod
```

This layers `docker/docker-compose.build.yml` over the production stack. Locally built
images carry no version stamp and report the committed `VERSION` with a `-dev` suffix
(e.g. `0.1.2-dev`); pass `MODULO_VERSION` as a build argument if a local build needs to
claim a specific one.
