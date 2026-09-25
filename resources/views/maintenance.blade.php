<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Maintenance - {{ config('app.name') }}</title>
    {{-- Self-contained on purpose: no CDN scripts or remote fonts, so it renders
         under a strict Content-Security-Policy and while assets are being replaced. --}}
    <style>
        :root { color-scheme: light dark; --bg: #fafafa; --card: #fff; --fg: #18181b; --muted: #71717a; --border: #e4e4e7; --accent: #2563eb; }
        @media (prefers-color-scheme: dark) { :root { --bg: #111113; --card: #18181b; --fg: #f4f4f5; --muted: #a1a1aa; --border: #27272a; --accent: #60a5fa; } }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1rem; background: var(--bg); color: var(--fg);
               font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        main { max-width: 28rem; width: 100%; box-sizing: border-box; text-align: center; background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; }
        .icon { display: inline-grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 0.875rem; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
        h1 { margin: 1.25rem 0 0.5rem; font-size: 1.5rem; letter-spacing: -0.02em; }
        p { margin: 0; color: var(--muted); }
        footer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.875rem; color: var(--muted); }
        a { color: var(--accent); font-weight: 600; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <main>
        <span class="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </span>
        <h1>Maintenance</h1>
        <p>{{ $message ?? 'We are currently undergoing maintenance. Please check back soon.' }}</p>
        <footer>Admin? <a href="/login">Log in</a></footer>
    </main>
</body>
</html>
