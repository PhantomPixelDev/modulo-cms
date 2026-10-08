# Troubleshooting

[Documentation home](index.md)

## A screen or button is missing

Navigation and actions are filtered by permission. Ask an administrator to check **Settings → Roles** and your assigned role. Shop screens also require the plugin to be active under **Extensions → Plugins**. Expand the relevant sidebar group to see its links.

## Content does not save

Wait for the current request to finish. Save controls stay disabled while it runs to prevent repeated submissions. If validation fails, the editor keeps your input and displays field errors; fix those fields and retry.

Autosave and explicit saving are separate. A recovery draft does not update the public page. Use **Publish**, **Update**, or **Schedule** for that. **Unpublish and save draft** removes the item from public view across all languages.

If autosave reports a network error, keep the editor open until connectivity returns and the changes reach the server. Browser storage contains recovery identifiers, not a copy of your content. Leaving before the server receives the changes can lose them.

If another tab saved a newer recovery revision, Modulo rejects the stale request and offers recovery. Copy any text you want to keep before restoring the newer draft. Close the extra editor tab to avoid continuing the conflict. See [saving and recovering work](editing.md).

## Preview is unavailable or expired

New content needs its first successful explicit save before preview is available. Existing content and translations must finish autosaving before preview opens. If autosave fails, fix that failure and retry preview.

Preview links are signed and expire after one hour. Generate a new link from the editor when one expires. Previews are excluded from indexing and do not change publication status.

## Scheduled content or background jobs are not running

Check the timezone label in the editor and the dashboard's service status. Schedule times use the configured site timezone.

The queue worker and scheduler send separate heartbeats. Missing heartbeats or heartbeats older than three minutes appear as missing or stale. With `QUEUE_CONNECTION=sync`, jobs run inline during requests; no worker heartbeat is expected.

The `/health` endpoint checks web readiness through the database and cache. A healthy response does not mean the queue worker or scheduler is running. Their status is shown separately so a stopped worker does not take public pages offline.

For Docker, use the Compose files and environment options for your installation channel, as described in [installation](installation.md). From an automatically installed stack:

```bash
docker compose ps
docker compose logs --tail=100 app queue scheduler web
docker compose exec app php artisan schedule:list
```

Confirm the worker and scheduler are running, inspect their errors, and restart the affected service after fixing the cause. On bare metal, check the worker service and the cron entry running `php artisan schedule:run`.

Application uptime comes from the Docker container startup timestamp. **Unavailable** means the installation has no reliable timestamp; it does not itself indicate downtime.

## Email does not arrive

Open **Settings → Email** and send a test message. Check SMTP configuration and sender address, then inspect the worker if messages are queued. The development stack captures email in Mailpit at `http://localhost:8025` instead of sending externally.

Production configuration is cached at startup. After changing environment variables, recreate or restart the affected services as described in [configuration](configuration.md).

## The homepage or demo content is unexpected

Check the front-page selection in **Settings → Site Settings** and ensure the selected page is published. That page takes precedence over the default homepage.

`MODULO_DEMO=false` is the normal-installation default. Setting it to `true` enables demo credentials and CMS promotional sections. The public demo restores clean content every four hours, including uploads and recovery drafts; use your own installation for permanent work.

## Adding to the cart fails

Check that the product is published, in stock, and has all required variation choices selected. The bundled theme uses one cart notification; an error replaces previous feedback. Refresh after a deployment if your browser still has an older frontend loaded.

For checkout problems, inspect the order and payment history in **Shop → Orders**, verify provider configuration and webhook delivery, and consult the [shop guide](shop.md).

## Report a reproducible problem

[Open a GitHub issue](https://github.com/PhantomPixelDev/modulo-cms/issues) with your version, installation channel, relevant plugin/theme versions, reproduction steps, and error message. Include relevant log excerpts after removing passwords, tokens, private keys, and customer data.
