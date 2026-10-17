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
