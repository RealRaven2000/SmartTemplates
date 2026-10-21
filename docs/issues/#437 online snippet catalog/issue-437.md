Title:
Enhancement: online repository of snippets hosted in on smarttemplates support site

Requirements:
- Like the support site this initially will host English-only examples.
- Support importing snippets into SmartTemplates, directly from the Add-on
- integrate into the Settings page on Smart Snippets tab
- Allow users to browse and preview snippets before importing.
- Allow users to rename templates when importing.
- Use a two-pane browser: the catalog on the left and the preview on the right.
- Put a checkbox beside each catalog item so users can select multiple snippets for one import. Preview the most recently selected item without clearing other checked items.
- Show the snippet file name first in the preview area, followed by its title, description, and preview image.
- If a preview PNG is missing or fails to load, show a shared "Preview unavailable" placeholder. Missing previews must not prevent selection or importing.
- Provide an "Add Snippets" button, enabled when at least one item is checked. Import all checked snippets and their declared assets.
- After a successful import, close the browser and highlight the added entries in the Settings snippet list so users can find and rearrange them via drag and drop. Preserve the existing list's selection and drag-and-drop contracts; visual highlighting of imported entries does not require changing it into a multiselect list.
- Keep the browser open with selections retained if importing fails or is cancelled; report the problem instead of showing success.
- Cache an editable local title for each item for the lifetime of the browser session, independently of its checked state or the currently previewed item. Use these edited titles on import without changing catalog titles or file names.
- Always emphasize Download Snippets while the Settings snippet list is empty. After successful imports, highlight the added rows and return focus to that list.
- Make the function easy to discover, by using an emphasized "Download snippets" button such as below:


<img width="821" height="353" alt="Image" src="https://github.com/user-attachments/assets/ec8e362d-f1c3-41f6-8a16-63557207771f" />

## Implementation notes

- `html/st-snippet-browser.mjs` implements the Settings dialog, catalog validation, session titles, and downloads. Repository content is displayed as text and PNG previews; downloaded snippet HTML is not executed in the browser.
- The default catalog URL is `https://smarttemplates.quickfolders.org/repo/snippets/index.json`; `storage.local.snippetRepositoryURL` can override it with an HTTPS index URL or folder URL. Host access currently covers the SmartTemplates support site. Verified the live catalog on 2026-10-21: schema version 1, all 11 snippet files, and the declared image asset return HTTP 200. The local website build also includes the repository correctly.
- Clicking Add Snippets opens the native folder picker titled Select target folder before downloading. `Utilities.selectSnippetFolder` reuses and remembers `fileTemplates.path`, shared with Select template file. Cancelling leaves selections and edited labels intact. The explicit `Utilities.installSnippetFiles` API writes the selected snippets and their declared assets directly into the chosen target folder, preserving relative asset paths. Identical existing files are reused. Different existing files stop the import with a conflict warning before any files are written; local edits are never silently overwritten. On a write failure, only new files created by that batch are removed, leaving pre-existing files untouched.
- Imported entries are added to the existing Settings list with their edited titles and catalog categories. Context-menu checkboxes remain opt-in, and the existing drag-and-drop behavior is preserved.
- Relative CSS `url(...)` conversion for Composer is still pending. Existing Composer code handles absolute local image URLs and relative `<img>` sources, so retaining assets alone does not yet make the background-image example work in Composer.
- Run the automated checks with `node "docs/issues/#437 online snippet catalog/check-browser.mjs"`. Live Thunderbird testing remains required.
