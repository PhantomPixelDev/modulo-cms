# React partials in content

Themes can expose reusable React components to page and post authors. Register a component once, then insert it with a shortcode:

First install and activate your theme under **Appearance → Themes**. Content modules need an active React theme, just like public page templates.

```text
[partial name="callout" title="Good to know" tone="success"]
Your text goes here.
[/partial]
```

Put a block module on its own paragraph in the editor. Quoted attributes can contain spaces. Attributes are strings, including numbers and booleans. A module without body text can use `[partial name="contact-card" /]`.

Modern React includes `callout` (`title`, `tone`: `info`, `success`, `warning`) and `disclosure` (`title`, `open`: `true` or `false`). Disclosure is a collapsible section with native keyboard controls. Modules work in published content, translations, and signed editor previews.

## Browse and copy in the admin

Open **Appearance → Content partials** to search the active theme's available modules, see their descriptions and attribute defaults, and **Copy shortcode**. Inherited modules are included; disabled and structural partials are excluded. Page and post editors have a **Browse partials** button that opens the catalog in a separate tab, keeping your editing session open.

Paste the copied shortcode into its own paragraph, replace the body text, and change attribute values as needed. Clipboard failures select the snippet for manual copying. Theme viewers and users with page/post create or edit permission can view the catalog; theme-management permission is not required for authors.

Theme authors can add optional `label` and `description` strings to a registration. Defaults are listed as available attributes. Set `"body": false` for a module whose example should use a self-closing shortcode. These are catalog hints; they do not change the React component contract. Unusual defaults containing quotes or HTML entities are omitted from copyable examples and still applied automatically by the renderer.

## Insert, edit, and preview

In the page or post editor, place the cursor where the module belongs and click **Insert partial** in the formatting toolbar. Choose a module, fill its fields, and write its body text. **Preview module** opens an embedded preview using the active theme's page template. Click **Insert partial** to add an editable block; use **Edit partial** on that block to change it later. Insertion supports undo and redo. Blocks remain editable after saving, recovery, and switching between the editor, HTML, and Markdown views.

The catalog also has **Configure and preview** for trying modules before inserting them. Previews require your current authoring or theme-view permission, expire after ten minutes, and belong only to your account. They do not create a post, page, or recovery draft, and are excluded from indexing and caching. If the theme has no renderable page template, preview reports an error. Changing fields clears an outdated preview; a failed request keeps your input for retrying.

Existing shortcodes continue to work. A complete shortcode in its own paragraph becomes an editable block when the content is reopened. Shortcodes mixed with other text remain ordinary text. Module bodies can contain nested shortcodes and formatting; the outer block's body editor keeps nested shortcodes as text. Missing modules retain their saved content, so authors can inspect it in HTML mode and install the required theme.

## Define editor fields

Add optional `fields` to an opted-in partial registration:

```json
{
    "component": "components/partials/ContactCard.tsx",
    "shortcode": true,
    "defaults": { "title": "Contact us", "tone": "info", "open": "false" },
    "fields": {
        "title": { "type": "text", "label": "Title", "required": true },
        "message": { "type": "textarea", "label": "Message", "help": "A short introduction." },
        "tone": {
            "type": "select",
            "label": "Tone",
            "options": [{ "value": "info", "label": "Information" }, { "value": "success", "label": "Success" }]
        },
        "open": { "type": "boolean", "label": "Start expanded" },
        "image": { "type": "image", "label": "Photo" }
    }
}
```

Supported controls are `text`, `textarea`, `select`, `boolean`, and `image`. Field keys must be lowercase attribute names (`a-z`, numbers, `_`, `-`), starting with a letter; `name` is reserved. `label` and `help` are optional strings; `required` is an optional boolean. Select options are a list of 1–50 unique string values with labels. Defaults without an explicit field get a plain text control, keeping older themes usable.

All submitted values remain strings: switches use `"true"` and `"false"`. Image controls accept HTTP(S) or site-relative URLs and show a media picker when the author has **view media** permission. Field values are limited to 2,000 characters and body HTML to 32,768 characters in the picker. Required fields, select values, booleans, and image URL schemes are checked before insertion and again by the preview endpoint. These hints do not retroactively reject existing published shortcodes; components still need to validate untrusted values, including URLs.

The editor escapes attribute quotes and HTML entities when serializing blocks. Keep the generated wrapper in source views to preserve the block. The public component receives the decoded string and sanitized body, using the same rendering contract as manually written shortcodes.

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
            "label": "Contact card",
            "description": "Show contact information from your theme.",
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
