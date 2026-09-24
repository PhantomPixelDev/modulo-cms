<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Upgrade required - {{ config('app.name', 'Modulo CMS') }}</title>
    {{-- Self-contained on purpose: this renders when the app refuses to run,
         so it must not depend on the built assets or the database. --}}
    <style>
        :root { color-scheme: light dark; --bg: #fafafa; --card: #fff; --fg: #18181b; --muted: #71717a; --border: #e4e4e7; }
        @media (prefers-color-scheme: dark) { :root { --bg: #111113; --card: #18181b; --fg: #f4f4f5; --muted: #a1a1aa; --border: #27272a; } }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1rem; background: var(--bg); color: var(--fg);
               font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        main { max-width: 32rem; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 2rem; }
        h1 { margin: 0 0 0.5rem; font-size: 1.25rem; letter-spacing: -0.01em; }
        p { margin: 0; color: var(--muted); }
    </style>
</head>
<body>
    <main>
        <h1>This site needs a newer version of Modulo</h1>
        <p>{{ $message }}</p>
    </main>
</body>
</html>
