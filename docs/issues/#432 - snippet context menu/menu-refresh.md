Compose-body snippet menu refresh — #432
=======================================

The existing `updateFileTemplates` NotifyTools handler calls `refreshSnippetContextMenu(entries)` directly after the legacy side reports saved data. The one-time `legacyMessengerReady` promise has been removed. A promise queue serializes menu rebuilds so overlapping updates cannot interleave removals and creations.

Only snippets with `contextMenu === true` are included. If all selected snippets share one nonempty category, that category becomes the top popup. Otherwise the localized `snippets.head` label is used for the parent. Uncategorized items and category parents appear under it in first-occurrence order from the saved list; children retain their order within each category. Rebuilds remove only the IDs created by this manager, in reverse creation order. Repeated updates with unchanged selected paths, labels, categories, and ordering skip teardown.

A single click listener reads the current ID-to-entry map and calls the experimental `Utilities.insertSnippet(tabId, entry)` API. It resolves the clicked compose tab, checks that its editor and SmartTemplates insertion helper are available, and awaits that window's `fileTemplates.insertFileEntryInComposer(entry)`. The existing legacy helper retains file access, selection handling, variable processing, and editor insertion. No new notification listener is used, and insertion never falls back to the most recent compose window.

Settings keeps the native snippet select and its existing selection and drag-and-drop handlers. A separate checkbox column aligns to the option rectangles and updates on scroll, resize, and list mutations. Toggling stores an explicit boolean through the existing settings API and legacy JSON save path. Column headings are deferred. Checkbox tooltips and accessible labels are localized in all locales.

Production-test cleanup removes the temporary compose-event listeners, the wrapper around Thunderbird's `openContextMenu`, deferred-field diagnostic logging, and all three isolation switches (`disableDeferredListeners`, `skipTemplateProcessing`, `skipEditorReset`). Saved values for those removed switches no longer affect behavior. Menu rebuild and click diagnostics remain gated by the main debug switch and `API.menus`; insertion errors remain visible. The `importNode()` fix and normal deferred-field handlers remain active.

Run from the repository root:

```sh
node "docs/issues/#432 - snippet context menu/check-menu-refresh.cjs"
node "docs/issues/#432 - snippet context menu/check-snippet-api.cjs"
```

The checks exercise filtering, category and root ordering, renamed and deleted entries, current click mappings, overlapping updates, creation-error recovery, checkbox persistence, rename, up/down moves, drag-and-drop, deletion, and import.

Thunderbird UI checks:

- [ ] Checkbox alignment with native option rows at different sizes and display scales.
- [ ] Checkbox alignment after scrolling, switching settings tabs, and adding or removing rows.
- [ ] Keyboard selection, checkbox activation, and drag-and-drop remain usable.
- [ ] Changes appear in the compose-body context menu after the settings save debounce.
- [ ] Closing and reopening Settings, and restarting Thunderbird, retain the flags.
- [ ] Empty selection removes snippet menu items without affecting other menus.
- [ ] Click a snippet with two compose windows open; only the clicked window receives it.
- [ ] Test insertion at the caret, selection replacement, template variables, and missing-file handling.

HTML sanitisation and compose-document ownership
------------------------------------------------

Commit `ee88ba73` fixes the insertion stage of `SmartTemplate4.Util.insertHtmlSafely()`. After parsing and sanitising HTML, both body nodes and retained head nodes are deep-imported with `ownerDoc.importNode(sanitized, true)` before insertion. Previously, the code appended the parser-created nodes directly, adopting them from the privileged DOMParser document. The script and unsafe-attribute filtering is unchanged; the correction concerns how sanitised content enters the destination document.

This change was made while investigating compose context-menu events that failed to reach Thunderbird's actor handoff on inserted content. It is relevant beyond the new snippet menu because it changes the shared HTML insertion helper. The same commit also uses `event.currentTarget` for deferred-field handlers and consumes a field's contextmenu event before opening its custom popup.

The reported improvement for #424 may be another effect of this fix, but that attribution remains unverified. Compare the same template and Thunderbird version with and without the importNode change to isolate it from the deferred-field listener changes.
