Intermittent compose-body context-menu routing failure — #432
============================================================

### Latest finding: the failed clicks bypass the actor handoff

The newest `test-log.txt` contains two failed openings followed by one successful opening in the same compose window:

| Click | Event target | `openContextMenu()` called | Context data at popupshowing | Result |
| --- | --- | --- | --- | --- |
| 1 | `p` in `about:blank?compose` | No | Absent | Native handler throws; extension menu absent |
| 2 | `p` in `about:blank?compose` | No | Absent | Native handler throws; extension menu absent |
| 3 | `div#smartTemplate4-template` in the same document | Yes | Actor and spell-check data present | Extension menu appears |

All three report focus on `messageEditor`, the expected `msgComposeContext` editor context attribute, and no keyboard modifiers. No menu rebuild occurs between the clicks. The successful handoff reports `currentGlobal: true`.

This establishes a difference before the extension menu builder: failed openings do not reach the compose window's `openContextMenu(message, browser, actor)` function. The target difference is correlated in the captured pairs, but its cause is not yet established. The earlier depth tests below do not establish submenu depth as the cause, because event routing was not controlled during those tests. Do not flatten categories based on those observations alone.

Next source-level investigation: why the trusted contextmenu event on the failing editor targets opens the native popup without the ContextMenu actor delivering fresh data. The existing wrapper only logs and forwards the original call; it does not manufacture context data or suppress errors.

### Earlier menu-depth comparison

Manual tests in the SmartTemplates add-on debugger isolate the failure from the snippet refresh function, saved entries, checkbox UI, and click handler. The test menu items below have no click handlers.

Observed results:

- One plain `compose_body` item: repeated openings work, including after switching applications.
- A parent with one child: repeated openings work, including after switching applications.
- A parent, child submenu, and grandchild item: initially displays correctly; the next context-menu opening loses the extension items. The add-on log records one shown/hidden pair and no subsequent `onShown` event for the failed opening.

Related Browser Console errors from the original menu:

```text
msgComposeContextOnShowing: nsContextMenu.contentData is null (reading spellInfo)
msgComposeContextOnHiding: nsContextMenu.contentData is null (reading actor)
```

Compose diagnostics show `hasContextData: false` before and after the failed `msgComposeContext` popupshowing handler. No snippet-menu refresh occurs during the failing open/close sequence.

### Reproduction

In the add-on debugger console, temporarily remove SmartTemplates' API menus and create the following three-level test:

```js
await browser.menus.removeAll();

browser.menus.create({
  id: "st432-test-root",
  title: "SmartTemplates test",
  contexts: ["compose_body"]
});

browser.menus.create({
  id: "st432-test-child",
  parentId: "st432-test-root",
  title: "Test snippet",
  contexts: ["compose_body"]
});

browser.menus.create({
  id: "st432-test-grandchild",
  parentId: "st432-test-child",
  title: "Nested snippet",
  contexts: ["compose_body"]
});
```

Open a fresh compose window, right-click in the body, open both submenu levels, and dismiss with Escape. Right-click again. Also test switching to another application and returning before reopening the menu.

For the working two-level comparison, repeat the setup without creating the grandchild. For the flat comparison, create only the root item.

`removeAll()` temporarily removes all API menus belonging to SmartTemplates; it does not change saved snippet data. Restart the add-on to restore its registered menus. This test was performed with SmartTemplates enabled, so a standalone minimal extension would be the next step to distinguish a Thunderbird defect from an interaction with other installed code or styling.

### Possible workaround

Keep one SmartTemplates parent and list snippets directly beneath it, prefixing labels with their category, for example `Layout » Text Box`. This avoids the extra category submenu while retaining category information and saved ordering. This workaround has not yet been applied or tested.
