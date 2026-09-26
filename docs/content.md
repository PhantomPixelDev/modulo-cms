# Working with content

## Trash

Deleting a post or page moves it to **Trash** (in the sidebar next to Comments). From
there it can be restored, deleted permanently, or the whole trash emptied. Anything left
longer than `MODULO_TRASH_DAYS` (30) is purged by the daily `model:prune`; `0` keeps it
until emptied by hand.

A trashed post still owns its slug. New posts get a free one automatically
(`hello`, `hello-2`, …).

## Autosave and preview

While you type, the editor keeps your unsaved text as a draft of your own (per post and
person) a few seconds after you stop. If the tab closes, opening the post again offers to
restore it. Saving the post discards the autosave.

**Preview** opens the post through the theme with the unsaved text, from a signed link
that expires after an hour, so it can be shared for a quick look. Previews are never
cached, counted as views or indexed.

## Custom fields

A content type can define extra fields (**Post types → edit → Custom fields**): short
and long text, number, link, email, date, yes/no, choice list and image. Posts of that
type show them in a **Details** box; the values are checked when the post is saved and
reach themes as `post.fields.<key>`. The key is fixed once saved, because themes and
existing posts use it.

## Revisions

Every time the title, excerpt, content or SEO title/description of a post or page
changes, the previous version is kept. **Revisions** in the editor lists them with who
made the change and when, shows what changed since each one (word by word) or the
version itself, and restores one with a click.
Restoring keeps the current text as a revision too, so it can be undone. The newest
`MODULO_REVISIONS_KEEP` (25) per post are kept.

## Scheduling

Set the status to **Published** and the publish date in the future. The post stays
hidden until then (the list shows it as **Scheduled**). When the time comes,
`modulo:publish-scheduled` — run every minute by the scheduler — clears the cached
listings and sitemap, notifies search engines (IndexNow), records it in the activity
log and fires the `post_published` action for plugins:

```php
add_action('post_published', function (App\Models\Post $post) {
    // announce it somewhere
});
```

Without the `scheduler` container (or cron running `php artisan schedule:run`), a
scheduled post still appears on time, but caches clear only when they expire.

## Redirects

**System → Redirects** sends visitors of an old path to a new path or a full URL, with
301/308 (permanent) or 302/307 (temporary), and counts hits. The query string is passed
on. The admin, API, login and system paths are never redirected, and a redirect can
only point to a path or an `http(s)://` URL.

Changing the slug of a **published** post adds a 301 from its old URL automatically
(marked *auto*). Chains are kept short: redirects pointing at the old URL are updated to
the new one, and renaming a post back removes the redirect away from its live URL.

## Search and social previews

The **SEO** tab of a post has, besides the title and description:

- **Social image** — for link previews; defaults to the featured image.
- **Canonical URL** — only when the content first appeared elsewhere.
- **Hide from search engines** — adds `noindex` and leaves the post out of the sitemap;
  visitors still see it.

Themes receive these as `post.seo` (`title`, `description`, `image`, `canonical`,
`noindex`); the bundled theme uses them for the title, meta description, Open Graph and
Twitter tags, canonical link and robots tag.

## Logo and favicon

**Site Settings → General** has a logo (shown in the site header) and a favicon, picked
from the media library or given as a URL. The Google Analytics / Tag Manager IDs and
search-engine verification codes under SEO and Analytics are now actually rendered into
every page (they were saved but never output before).
