Tracking issue: #433

Title: Thunderbird 159 beta: removed msgHdrFromURI breaks template processing

SmartTemplates fails while processing templates in Thunderbird 159.0b2 (64-bit). The reported error is:

```text
TypeError: messenger.msgHdrFromURI is not a function
smartTemplate-overlay.js:360:28
```

Thunderbird removed `nsIMessenger.msgHdrFromURI()` in [Mozilla bug 2075942](https://bugzilla.mozilla.org/show_bug.cgi?id=2075942). The removed method was a wrapper around `nsIMsgMessageService.messageURIToMsgHdr()`.

### Expected behavior

Templates continue to work when replying, forwarding, or reopening drafts in Thunderbird 159 beta, while retaining support for Thunderbird 140 ESR, the minimum supported version.

### Fix prepared

Replace all eight calls across `smartTemplate-overlay.js`, `smartTemplate-compose.js`, and `smartTemplate-util.js` with the message-service lookup:

```js
const msgHdr = MailServices.messageServiceFromURI(uri).messageURIToMsgHdr(uri);
```

Remove unused `nsIMessenger` instances and update the affected error message. Both release-note files have been updated. No new global bindings are introduced.

The replacement APIs predate Thunderbird 140, so no version-specific fallback is required.

### Validation

- [x] JavaScript syntax checks pass for all three changed scripts.
- [x] No `msgHdrFromURI` references remain in the chrome JavaScript files.
- [x] ATN release-note HTML tag whitelist passes.
- [x] Diff whitespace checks pass for the five changed files.
- [ ] Test replies and forwards in Thunderbird 159.0b2, including original-message headers, tags, and subject extraction.
- [ ] Test reopening drafts in Thunderbird 159.0b2.
- [ ] Repeat reply, forward, and draft checks in Thunderbird 140 ESR.

Status: tracking issue published as #433; fix prepared locally; runtime validation and release publication pending.
