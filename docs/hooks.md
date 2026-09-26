# Hooks

Plugins change what Modulo does through **filters** (take a value, return it changed)
and react to what happens through **actions**. Register them in your service
provider's `bootPlugin()`:

```php
protected function bootPlugin(): void
{
    add_filter('the_title', fn (string $title, Post $post) => $post->is_featured ? "★ {$title}" : $title, 10);

    add_action('post_published', function (Post $post) {
        // tell a newsletter service, warm a cache, ...
    });
}
```

Callbacks run in priority order (lower first, default `10`). A filter must return the
value; the extra arguments are for reading only.

## Filters

| Hook | Value | Also receives | Used for |
| --- | --- | --- | --- |
| `the_title` | post title (string) | `Post` | Titles themes show |
| `the_content` | rendered post HTML (string) | `Post` | Post and page bodies themes show (single views) |
| `the_excerpt` | excerpt (string) | `Post` | Excerpts themes show |
| `site_name` | site name (string) | — | Everywhere the site's name is shown: theme, admin, feed |
| `admin_menu` | sidebar entries from plugins (array) | `User` | Adding, removing or reordering plugin entries |

Filters run where the value is handed to themes (`PostPresenter`), so the stored
content is never changed. Public pages are cached for guests: output that depends on
the visitor must not come from a filter.

## Actions

| Hook | Arguments | When |
| --- | --- | --- |
| `cms_booted` | — | After every plugin has booted |
| `post_saved` | `Post` | A post or page was created or updated |
| `post_published` | `Post` | A post went live: created or switched to published with a date that has come, or a scheduled post whose time came (`modulo:publish-scheduled`) |
| `post_deleted` | `Post` | A post or page was moved to the trash |
| `comment_posted` | `Comment`, `Post` | A visitor posted a comment (it may still await moderation: check `$comment->status`) |

Actions run inside the request that caused them. Keep them quick, and dispatch a queued
job for anything slow (sending mail, calling an API).

## Helpers

`add_filter()`, `apply_filters()`, `add_action()` and `do_action()` are global
functions. A plugin may define its own hooks with them for other plugins to use; prefix
their names with the plugin slug (`modulo_shop.order_placed`).
