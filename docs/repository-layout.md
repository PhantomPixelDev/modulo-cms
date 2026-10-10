# Repository layout

The root contains the application entry points, dependency manifests and files
that tools discover by their standard names. Most development configuration lives
under `config/`.

| Location                        | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `app/`, `bootstrap/`, `routes/` | Laravel application and entry points                                  |
| `config/*.php`                  | Runtime application configuration                                     |
| `config/tooling/`               | Vite, ESLint, Prettier, TypeScript, PHPStan, BuildKit and release configuration |
| `config/testing/`               | PostgreSQL, Vitest and Playwright configuration                       |
| `database/`, `tests/`           | Migrations, seeders and automated tests                               |
| `resources/`, `public/`         | Frontend source, themes and public assets                             |
| `docker/`, `docker-dev/`        | Production and development container stacks                           |
| `scripts/`                      | Build, upgrade and release helpers                                    |
| `.github/`                      | CI, community policies and issue templates                            |
| `docs/`                         | Documentation source                                                  |
| `packages/plugin-sdk/`          | Shared plugin frontend build contracts                                |

`composer.json`, `package.json` and their lockfiles stay in the root for
dependency installation and reproducible builds. Laravel uses the root `artisan`
entry point and environment templates. Docker reads `.dockerignore`; Git reads
`.gitignore` and `.gitattributes`; editors discover `.editorconfig` there.

The root `tsconfig.json` delegates to `config/tooling/tsconfig.json`, so editors
and build tools still discover TypeScript settings. The primary `phpunit.xml`
stays in the root for `php artisan test`, Pest, PHPUnit and existing plugin test
workflows. PostgreSQL tests use `config/testing/phpunit.pgsql.xml` explicitly.
`VERSION` and `CHANGELOG.md` remain the shared release metadata.

## Working with the project

Run these from the repository root:

```bash
composer test
composer test:pgsql
composer analyse
vendor/bin/pint --test
npm run types
npm run lint:check
npm run format:check
npm run test:js:coverage
npm run build:ssr
npm run docs:build
```

PostgreSQL testing requires a dedicated `modulo_test` database and connection
credentials in the environment. Browser tests require a running disposable test
installation:

```bash
npm run test:e2e
npm run test:e2e -- z-demo-integrity.spec.ts
```

Npm scripts select the relocated configuration files. Prettier also discovers its
shared configuration through the `prettier` field in `package.json`.

Husky and lint-staged are not installed. CI performs the quality checks; local
checks run through the commands above. Personal `.claude/` guidance, local hooks
and optional `components.json` scaffolding settings are ignored. Generated
dependencies, coverage, browser reports and build output are also ignored.
