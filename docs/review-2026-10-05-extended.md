# Extended security review — 5 October 2026

This follow-up builds on the first review and its deployed commit `7c287dd`.
It checks authentication races, public content boundaries and browser workflows.

## Confirmed issues and fixes

| Area                 | Reproduction                                                                                                                                          | Fix                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authenticator replay | Two independently loaded users, including simultaneous PostgreSQL processes, accepted the same authenticator code.                                    | Lock and reload the user inside a transaction before validating and consuming a code.                                             |
| Recovery codes       | Overlapping requests could reuse one recovery code or restore a code another request consumed.                                                        | Serialize consumption against the latest stored list.                                                                             |
| 2FA setup            | Posting to the setup endpoint again discarded confirmed settings, including when administrators were required to keep 2FA enabled.                    | Preserve enabled settings; serialize setup and confirmation to prevent overlapping operations from confirming a different secret. |
| Pending login        | A password-verified challenge had no deadline and stayed usable after a password or authenticator secret changed.                                     | Expire challenges after ten minutes, bind them to the verified credentials, and clear challenge state after expiry or success.    |
| Public content       | Taxonomy archives, classic archives, homepage fallbacks, direct page lookups and comment submissions did not consistently require a public post type. | Apply a shared public visibility scope at these boundaries. Signed editor previews retain their existing access model.            |
| Scheduled homepage   | A future-dated published page was served immediately when selected as the homepage.                                                                   | Require the publication time to have arrived.                                                                                     |
| Private taxonomies   | Public post output, sidebar data and API term filters revealed private taxonomy labels or assignments.                                                | Exclude private taxonomies from public output and filters. Authorized API read tokens retain access.                              |
| Sidebar counts       | Category counts included future publications and posts from private types.                                                                            | Count only public released content.                                                                                               |

Taxonomy archives now eager-load the taxonomies of their terms, avoiding individual
taxonomy lookups during presentation. Adding the missing relationship type annotation
also removes one obsolete PHPStan baseline entry; the baseline was not expanded.

## Validation

The added feature tests first reproduced 18 failures in the original implementation.
The standalone PostgreSQL concurrency check also failed against the original user
model with two successful uses of the same authenticator code. The fixed model passed
15 synchronized pairs: duplicate authenticator codes, duplicate recovery codes and
different recovery codes consumed concurrently.

| Check                              | Result                                                       |
| ---------------------------------- | ------------------------------------------------------------ |
| Added feature regression cases     | 27                                                           |
| Full SQLite suite                  | 517 passed, 1 PostgreSQL-only test skipped; 1,961 assertions |
| Full PostgreSQL 16 suite           | 518 passed; 1,963 assertions                                 |
| Simultaneous PostgreSQL challenges | 15 pairs passed; now checked in CI                           |
| Pint                               | Passed                                                       |
| PHPStan/Larastan                   | No errors                                                    |

TypeScript passed and all 42 Vitest tests passed. One initial Vitest run exceeded
the existing five-second timeout while inspecting a package's exports; a repeat
run passed without a code or timeout change.

All eight existing browser scenarios passed across the fresh-install and
Nginx/PHP-FPM runs: install completion and lockout, public health, admin screens,
redirect creation, API tokens and content forms.
Manual browser verification also completed authenticator setup and displayed the
eight recovery codes after successful confirmation.

PHP checks used a separate source copy and a disposable PostgreSQL container on a
private Docker network. Browser tests used another source copy, a separate database
and a loopback-only port accessed through SSH. No production data was used by tests.
The browser stack uses Nginx and PHP-FPM with the application's normal configuration
cache and writable storage permissions.

Read-only live browser checks covered the homepage, login, password-reset screen,
content detail and search, including a mobile viewport. The only observed console
errors were failed DNS resolution for Cloudflare's external analytics script.

Live HTTP checks confirmed that the installer returns 404, unsigned previews return
403, unauthenticated admin requests redirect to login, invalid API tokens and
unauthenticated writes return 401, and malformed API filters return 422. A request
without a CSRF token on the isolated real stack returned 419.

Five sequential live homepage requests returned 200, with a median time to first
byte of approximately 152 ms from the VPS. This is a small latency sample, not a
capacity or load benchmark.

Repeat the additional concurrency check only on a migrated dedicated test database:

```sh
APP_ENV=testing DB_CONNECTION=pgsql DB_DATABASE=modulo_test \
  php tests/Integration/two-factor-concurrency.php
```

Supply the test database's host, credentials and application key through the
environment. The script refuses other environments and database names, creates
only its own temporary user, and removes that user when finished.
