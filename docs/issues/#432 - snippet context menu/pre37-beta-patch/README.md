Beta-compatible pre37 comparison build — #432
=============================================

Source archive: `E:\Dev\Mozilla\Dev\SmartTemplate\Test Versions\4.21\smartTemplate-fx-4.20.3pre37.xpi`

Output: `smartTemplate-fx-4.20.3pre37-beta-compat.xpi` in the ESR140 workspace root.

The original archive is unchanged. The output keeps version `4.20.3pre37` and its original manifest and menu implementation. Only seven message-header lookups were replaced with the equivalent #433 compatibility fix:

```js
MailServices.messageServiceFromURI(uri).messageURIToMsgHdr(uri)
```

Changed files are included here for inspection:

- `chrome/content/smartTemplate-compose.js`: two lookups.
- `chrome/content/smartTemplate-overlay.js`: four lookups.
- `chrome/content/smartTemplate-util.js`: one lookup.

Existing QueryInterface calls and subsequent header access are retained. No new global bindings or namespace APIs were added. Unused legacy messenger declarations are left intact to minimize unrelated changes.

All three patched scripts pass syntax checks. Decompressed archive-entry SHA-256 comparisons confirm that every other entry is byte-for-byte identical to the original XPI. Thunderbird runtime testing remains necessary.

This older build predates preservation of the `contextMenu` flag. Avoid editing or saving the snippet list during the comparison test.
