# Why the dev stack is slow on Windows

Short answer: the bind mount, not the application. Long answer below, with the
measurements, so nobody has to rediscover this.

## The measurements

Taken inside the running containers on a Windows host with the repository under `C:\`:

| | named volume | `C:\` bind mount |
|---|---|---|
| per-file `stat()` | 0.09ms | **2.2ms (~25x)** |

Laravel touches roughly 790 files per request, so path resolution — not PHP — dominates
the response time. `vendor/`, `storage/` and `node_modules/` already live on named
volumes and are unaffected; `app/`, `config/`, `routes/` and `resources/` come off `C:\`.

Reaching the stack through `localhost` adds another **~150ms** of WSL port forwarding.
The same request measured 220–300ms from inside the container network and 360–740ms
from the Windows host.

## What does not help

Both of these sound like they should help. Both were measured, and both made no
difference:

- **`php artisan config:cache`** — opcache already holds the compiled config files, so
  collapsing them into one changes nothing under PHP-FPM.
- **`opcache.validate_timestamps=0`** — the revalidation stat storm was the theory; it
  is not where the time goes.

Tuning the podman machine's CPU or memory does not help either, and on WSL2 those
settings are ignored outright — the VM takes its resources from `.wslconfig`. They were
not the constraint anyway: 12 cores and 7.5GB, mostly idle while requests were slow.

## What does help

**Keep the repository on the Linux filesystem.** Clone it inside WSL (`~/modulo-cms`,
reachable from Windows at `\\wsl.localhost\...`) instead of under `C:\`, and run the
stack from there. This removes the 25x penalty rather than working around it.

## The watcher problem, and why it is already fixed

Worth understanding if you change the Vite configuration.

Windows bind mounts do not deliver inotify events into the container, so the dev stack
polls. Polling `stat()`s every watched file on each interval. The watcher originally had
no ignore list and polled **3,928 files every second** — of which `.git` (1,239) and
`storage` (1,860) were 79%, and Vite serves neither. At 2.2ms per file that is ~8.6
seconds of work per one-second cycle, so it could never catch up: it pegged a core and
starved the same mount PHP reads from.

The symptom was wild variance rather than uniform slowness. The same
`Schema::hasTable()` query measured 2.4ms and 505ms in different traces, depending on
what the watcher happened to be doing.

Two things in `vite.config.ts` fix it, and both are load-bearing:

1. **`server.watch.ignored` must be a function, not globs.** chokidar 4 — which Vite 7
   ships — dropped glob support in `ignored`. A `'**/storage/**'` string silently
   matches nothing, so the ignore list appears to be configured while doing nothing at
   all. The predicate form works.
2. **`server.warmup` does not follow imports.** It transforms exactly the files it is
   given. `app.tsx` imports `ErrorBoundary`, `AdminToastProvider` and `use-appearance`
   on every page, and those cost 5.2s and 4.3s cold — and `app.tsx` blocks on them
   before anything renders, which produced a black screen with no error anywhere. They
   have to be named in the warmup list explicitly.

After both: first render 211ms from a cold page load, and clicking between pages
280–750ms, against roughly ten seconds before.
