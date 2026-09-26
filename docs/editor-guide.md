# Running your site: a guide for editors

This guide is for the people who write and look after a Modulo site day to day. You
don't need to know anything about servers or code.

## The dashboard

Signing in takes you to the **Dashboard**. Its first box, **Get your site ready**, is a
short checklist (site name, logo, first page, main menu, email, two-step sign-in). Each
step ticks itself off once it's done; click a step to go where you do it. Hide the
checklist with the × when you no longer need it.

Below it you'll find:

- **Your drafts**: what you started and haven't published.
- **Going live soon**: posts scheduled for later.
- **Recently edited**: the latest changes by anyone.
- **Comments to review**: comments waiting for your approval.

## Writing posts and pages

**Content → Posts** (or **Pages**) lists everything, newest first. Search by title,
filter by status (including **Scheduled**), author or type, and tick several rows to
publish them, move them back to draft or put them in the trash in one go.

In the editor:

- **Status** sits next to the save button: *Draft* is only visible to you and other
  editors, *Published* is live.
- **Your work is saved as you type.** If you close the tab by mistake, the editor offers
  to bring back your unsaved changes the next time you open the post.
- **Preview** shows the post exactly as visitors will see it, including unsaved changes.
  The preview link works for an hour, so you can send it to someone for a quick look.
- **Schedule** a post by choosing a publish date in the future (Advanced tab) and
  setting the status to *Published*. It goes live on its own at that time.
- **Revisions** lists earlier versions. *Changes since* highlights what was removed and
  added since each one; **Restore this version** puts it back (the current text is kept
  as a revision, so you can undo that too).
- **Search engines** (SEO tab): the title and description shown in Google, the picture
  shown when the page is shared, and *Hide from search engines* for pages that shouldn't
  appear in search results.
- **Details**: some content types have extra fields, like a price or an event date. They
  appear under the excerpt.

Pages can sit under another page (**Advanced → Parent page**), for example *Team* under
*About*.

Deleted posts go to **Trash**, where you can restore them for 30 days.

## Media

**Content → Media** holds your images and files. Give every image an **alt text**: a
short description read aloud to blind visitors and used by search engines. Images show a
"No alt text" warning until they have one. Large images are resized automatically, so
upload the best version you have.

## Menus

**Appearance → Menus** builds the navigation of your site:

1. Open a menu (or create one and choose where it shows, e.g. *Header Navigation*).
2. Tick pages under **Add to menu** and click *Add to menu*, or add a **Custom link**.
3. **Drag** items to reorder them; drag an item to the right to make it a sub-item.
   The arrow buttons do the same if you prefer (or on a phone).
4. Click the pencil to rename an item, link it elsewhere, open it in a new tab, show it
   only to signed-in visitors, or translate it.

Changes to the order are saved as you make them.

## Languages

**Administration → Languages** lists the languages your content can be written in. Add
one from the list, switch languages on and off, and choose the default: the language
visitors see when they open your site. In the posts list, the small language badges on
each row open that translation (a dashed badge means it isn't translated yet).

## Comments

**Content → Comments** shows comments by status. Approve, mark as spam or delete them.
Whether new comments need approval first is set on the same page.

## Email

**System → Email** decides how your site sends mail (order confirmations, password
resets, contact messages). Enter the SMTP details from your email provider and use
**Send test email** to check they work. Until email is set up, messages are only written
to the site's log, so nobody receives them.

## Backups

**System → Backups** keeps full copies of your site: all content, uploaded files and
plugins. One is made every Sunday night; **Back up now** makes one immediately, for
example before a big change.

To go back to a backup, click its **Restore** button, choose what to restore and type the
backup's name to confirm. The site shows a maintenance page for a minute while it runs.
Everything changed since that backup is lost, so make a fresh backup first if unsure.

If your host has set up **off-site copies**, every backup is also stored somewhere else,
so you can recover even if the server is lost; the page shows whether the last copy
worked.

## Users and roles

**Administration → Users** invites people and changes their role. Roles decide what
someone may do: an *Editor* can publish content, an *Author* can write drafts that an
editor publishes. Turn on two-step sign-in for your own account under your profile
(**Settings → Two-factor**): it keeps your site safe even if your password leaks.

## Plugins and the shop

**Administration → Plugins → Browse registry** adds features such as the
[Shop](https://github.com/PhantomPixelDev/modulo-plugin-shop) or a contact form.
Installed plugins get their own entries in the sidebar under **Extensions**, and their
settings are found there or under Plugins.
