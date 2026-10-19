Minimal compose-body context-menu test — #432
============================================

This independent MailExtension uses only the standard menus and compose permissions. Its ID differs from SmartTemplates, so it can be installed separately. It does not inject scripts, insert templates, access files, modify messages, or use experimental APIs.

Package: `docs/test/compose-context-menu-test-0.1.0.xpi`.

### Test

1. Disable SmartTemplates. Leave this test extension enabled.
2. Close existing compose windows and open a fresh blank message.
3. Open Thunderbird's Browser Console and clear it. Keep errors visible; test extension messages begin with `[ComposeMenuTest]`.
4. Right-click the message body and open **Compose Menu Test → Layout → Test snippet**. The click only logs the selected ID.
5. Dismiss with Escape and reopen repeatedly, including over paragraph text and blank space.
6. Switch to another application, return, and repeat.
7. Save the log and record the Thunderbird version and which openings worked or failed.

If the failure remains, repeat in a clean test profile with only this extension installed. If it does not occur, re-enable SmartTemplates and repeat in a fresh compose window to test the interaction separately.

The extension builds its menu once at startup. Nothing is rebuilt when opening, closing, or clicking a menu.

### Optional two-level comparison

Run in this test extension's add-on debugger console:

```js
await browser.menus.removeAll();
browser.menus.create({
  id: "test-root",
  title: "Compose Menu Test",
  contexts: ["compose_body"]
});
browser.menus.create({
  id: "test-snippet",
  parentId: "test-root",
  title: "Test snippet",
  contexts: ["compose_body"]
});
```

Restart or reload the test extension to restore the three-level menu. These commands affect only this test extension's menus.
