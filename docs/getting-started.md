# Getting started

[Documentation home](index.md)

## Try the public demo

Open [the Modulo demo](https://dev-modulo.ppxl.dev/) and follow **Admin Dashboard** to sign in:

| Role          | Email                | Password    |
| ------------- | -------------------- | ----------- |
| Administrator | `admin@example.com`  | `admin123`  |
| Editor        | `editor@example.com` | `editor123` |
| Reader        | `user@example.com`   | `user123`   |

These credentials belong to the public demo. Its database, uploads, and recovery drafts are restored to clean demo content every four hours. Use your own installation for work you want to keep.

## Install your own site

On your server, install Docker Engine and the Docker Compose plugin, or use Podman with a Compose provider. Follow the [installation guide](installation.md) to configure the public URL and HTTPS, start the stack, and open `/install` to name your site and create your administrator account.

Normal installations have `MODULO_DEMO=false`: the homepage shows your site identity and published content. Demo credentials and CMS promotional sections appear only in demo mode. A configured published front page takes precedence over the default homepage.

Before inviting other people, configure your public address and HTTPS, test email delivery, and check that backups and background services are running. See [configuration](configuration.md), [backups](backup-restore.md), and [troubleshooting](troubleshooting.md).

## Find your way around

| Navigation | Use it for                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Dashboard  | Recent activity, unfinished drafts, and service status                  |
| Content    | Posts, pages, media, comments, trash, and taxonomy terms                |
| Appearance | Themes and menus                                                        |
| Extensions | Plugins and their administration screens, including Shop                |
| Settings   | Site settings, languages, users, roles, content models, and maintenance |

Navigation and actions depend on your permissions. Expand a group to see its links; Modulo remembers expanded groups per user and opens the group containing the current screen.

## Publish your first page

1. Open **Content → Pages** and choose the create action.
2. Enter a title and write the content. Add a featured image from the media library if needed.
3. Choose **Save Draft** to keep it private, or **Publish** to make it public. Wait for the request to finish; field errors appear in the editor if it fails.
4. The editor stays open after a successful save. You can now preview the page and continue editing.
5. Add a link through **Appearance → Menus**, or choose the published page as your front page in **Settings → Site Settings**.

Posts follow the same saving flow and can also have categories and tags. Pages support a parent page. Your permissions determine which publication actions are available.

## Understand saving before you edit

Autosave creates a private recovery record about three seconds after you stop typing. It does **not** publish changes. The dashboard lists unfinished drafts, including work that has not yet become a post or page.

**Update** saves changes to published content. **Unpublish and save draft** removes the whole item from public view, including its translations. Saving translation text alone preserves publication status. **Schedule** uses the site timezone shown in the editor.

See [saving and recovering work](editing.md) for previews, concurrent tabs, and browser recovery. Continue with the [editor guide](editor-guide.md) or [shop guide](shop.md).
