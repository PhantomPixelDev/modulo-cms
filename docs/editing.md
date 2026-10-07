# Editing content

Pages and posts use the same editor and recovery system. Save Draft keeps new
content private; Publish makes it public now; Schedule uses the publication date
in the site's configured timezone. Update saves text and other fields while
preserving publication status. Published content has an explicit **Unpublish and
save draft** action: it removes the item from public view in every language.

Publication status belongs to the whole item. Translation text is independent,
so updating a Spanish translation does not publish or unpublish the English one.
Successful saves stay in the editor. Field errors leave the input available to
correct and retry.

Recovery drafts are stored on the server after typing pauses for three seconds,
including new content, translations, media selections, custom fields and terms.
The browser keeps identifiers only. The dashboard's Unfinished work list resumes
them after a browser restart. Drafts are private to their owner and require the
same create or edit permissions as the content. Two tabs cannot silently
overwrite the same recovery revision; recover the newer draft before retrying.
Abandoned recovery records are pruned after 30 days by the scheduler.

The editor warns before leaving work that has not reached the server. An explicit
save clears only its matching recovery record after validation succeeds. Preview
first waits for recovery to succeed; new content needs one explicit save before
preview is available. Preview links expire after an hour and are not indexed or
cached.

The sidebar groups daily work under Content. Appearance holds themes and menus;
Extensions retains plugin routes and menus; Settings contains content models,
accounts, languages and maintenance. Groups remember their expanded state per
user and open when their current screen is visited.

![The content editor](screenshots/admin-editor.png)
