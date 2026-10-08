# React partials in content

Themes can expose reusable React components to page and post authors. Register a component once, then insert it with a shortcode:

```text
[partial name="callout" title="Good to know" tone="success"]
Your text goes here.
[/partial]
```

Put a block module on its own paragraph in the editor. Quoted attributes can contain spaces. Attributes are strings, including numbers and booleans. A module without body text can use `[partial name="contact-card" /]`.

Modern React includes `callout` (`title`, `tone`: `info`, `success`, `warning`) and `disclosure` (`title`, `open`: `true` or `false`). Disclosure is a collapsible section with native keyboard controls. Modules work in published content, translations, and signed editor previews.

## Create a module

Run this in a source checkout, with your theme under `resources/themes/`:

```bash
php artisan theme:partial my-theme contact-card
```

This creates `components/partials/ContactCard.tsx` and registers it in `theme.json`. Existing files and registrations are never overwritten. Edit the component, run `npm run build`, then deploy your application.

The production Docker image has no Node runtime. Include new React source in your application build; uploading a `.tsx` file through the theme installer does not compile it.

## Component contract

```tsx
import type { ThemePartialProps } from '@/theme-partials';

export default function ContactCard({ attributes, children }: ThemePartialProps) {
    return (
        <section className="my-6 rounded-xl border p-5">
            <h2>{attributes.title}</h2>
            {children}
        </section>
    );
}
```

`name` identifies the registration. `attributes` combines defaults with shortcode attributes; `name` is excluded. `children` contains sanitized rich text and nested modules. Use ordinary React state and hooks. Components mount through portals in the existing React tree, so Inertia's `usePage()` and your theme providers remain available. Do not create another React root or bundle another React copy.

Attributes and body text are untrusted author input. Render attributes as React text, validate URL attributes, and never evaluate them as code. Use `children` instead of injecting HTML. Components must not perform writes on mount: navigation and React development checks can mount them again.

## Register manually

Add an entry to `partials` in `theme.json`:

```json
{
    "partials": {
        "contact-card": {
            "component": "components/partials/ContactCard.tsx",
            "shortcode": true,
            "defaults": { "title": "Contact us" }
        }
    }
}
```

Only `"shortcode": true` entries are exposed. Navigation, comments, and other structural partials stay private. Components must be `.tsx` files inside `components/partials/` or `partials/` in a bundled theme. Defaults must be strings. Content can select a registered name; it cannot select an arbitrary file or script URL.

The registry reads the manifest on the server. Manifest changes do not require reinstalling the theme, but React changes require a build. Clear public-page caches when changing a deployed registration.

## Rendering in your theme

Standard page and post templates use the shared renderer. Custom templates must pass HTML and descriptors:

```tsx
import ContentRenderer from '@/components/content/ContentRenderer';

<ContentRenderer className="prose max-w-none" html={post.content} partials={post.content_partials} />;
```

`content` stays an HTML string for existing themes and plugin content filters. `content_partials` is a separate typed descriptor array with generated IDs, component keys, attributes, and body HTML. Archive cards skip rendering. The headless API keeps its existing HTML contract and does not mount React modules.

## Child themes

Registrations inherit from the nearest ancestor. A child can override defaults or component paths. When a file is absent, the renderer looks for that path in bundled parents. Runtime child themes can reuse bundled parent components but cannot upload executable React files.

Disable an inherited registration with the same name and `"shortcode": false`. Unknown, disabled, or removed partials keep enclosed text. Self-closing partials have no fallback text.

## Loading and fallback

Modules load on demand. Enclosed body text stays visible while a module loads or when it fails. With Inertia SSR enabled, the server renders this fallback body too. Without SSR, the site's existing React app shell requires JavaScript. A successful mount hides the duplicate body. Put essential information inside the shortcode body: component-only text and interactions require JavaScript and are not server-rendered.

Nested partials work up to 16 levels; an item is limited to 100 modules. Shortcodes inside `<pre>` and `<code>` stay literal. Author HTML cannot forge an import: generated IDs must match separate descriptors and the build-time component allowlist.

Plugin `ShortcodeService::register()` handlers continue to work alongside partials. Inside a partial, body content uses the rich-text sanitizer; plugin forms belong outside partials or should be implemented directly as React components.

See [theme development](theme-development.md) and [hooks](hooks.md).
