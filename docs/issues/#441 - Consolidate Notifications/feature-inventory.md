# Licensed feature inventory

Supporting audit for #441. See the [notification requirements](https://github.com/RealRaven2000/SmartTemplates/blob/ESR140/docs/issues/%23441%20-%20Consolidate%20Notifications/requirements.md).

This is an audit of current code, not approval to introduce new gates. Pro below includes Domain licenses. License entitlements and actual enforcement are distinct.

## Existing counters and gates

There are no per-feature attempt/session counters comparable to quickFilters. The shared trial is 28 elapsed calendar days, calculated from `license.gracePeriodDate` in `st-background.js` (`GRACEPERIOD_DAYS`, `getGraceDate`, `getTrialDays`). It is not a count of active days or emails. Valid licenses refresh the grace date; expiry can restart the grace period from the license expiry date.

`premiumFeatures` and `standardFeatures` in `SmartTemplate4.Util` are temporary lists of feature names used to build reminders. They are cleared after processing and are not trial counters.

| Feature | License entitlement | Current restriction |
|---|---|---|
| External template and snippet menu entries | Standard / Pro | Unlicensed: 5 entries; Standard: 25; Pro: no tier cap. Excess entries are disabled in legacy menus or restricted in background menus. Limits apply to each constructed list, not a profile-wide total. |
| Recent template menus | Standard / Pro | Unlicensed: 3; Standard: 5; Pro: configured MRU ceiling. |
| Template/snippet categories | Pro for more than 3 | Without Pro, categories beyond 3 are grouped into Other. This is a menu organization restriction, not a trial counter. |
| Clipboard input: `%clipboard%`, clipboard arguments in header edits, replacements/search helpers | Pro | Clipboard reads are skipped or return empty after the shared trial, unless a valid Pro license is present. |
| Clipboard output: `%toclipboard()%`, header/address `toclipboard`, date-format clipboard output | Pro | Clipboard writes are skipped after the shared trial, unless a valid Pro license is present. |
| `%tags%` formatting | Pro | Returns empty after the shared trial without Pro. `tags.add` and `tags.remove` are placeholders in this parser, not implemented licensed actions. |
| `%deleteForwardedBody%` | Pro | Does not set the deletion flag after the shared trial without Pro. |
| CardBook contact lookup | Pro | Main `getAddressBookEntry` lookup disables CardBook without a valid Pro license; no trial exception in this gate. See audit caveats below. |
| Filter-triggered automatic sending | Pro | The `isAutoSend` path shows a reminder instead of calling `SendMessage` without a valid Pro license. Template processing itself has already occurred. No trial exception. |

Sources: `chrome/content/smartTemplate-fileTemplates.js` (`configureMenu`), `st-background.js` (`menuRestrictions` and menu construction), `chrome/content/smartTemplate-overlay.js` (`split`, `modifyHeader`, `replaceReservedWords`), `chrome/content/smartTemplate-util.js` (`unquotedRegex`, `dateFormat`, `getAddressBookEntry`), and `chrome/content/smartTemplate-compose.js` (`insertTemplate`, `isAutoSend`).

## Features recorded for licensing reminders without a general blocking gate

These functions execute in the audited legacy processing paths. Clipboard arguments within them can still be gated separately.

| Feature / recorded identifier | License entitlement | Current behavior |
|---|---|---|
| `%file()%`, `%style()%` | Standard or Pro | Recorded in `standardFeatures`; file/style insertion continues. |
| `%dateformat()%` | Standard or Pro | Recorded in `standardFeatures`; formatting continues. Clipboard output is separately gated. |
| `%preheader()%` / `preheader` | Pro | Records usage; builds the preheader. |
| Snippet `*selection*` / `snippetSelection` | Pro | Records usage; selected text is inserted into the snippet. |
| `%matchTextFromSubject()%`, `%matchTextFromBody()%` | Pro | Records usage; matching continues. |
| `%deleteText()%`, `%replaceText()%` | Pro | Records usage; text changes continue. |
| `%deleteQuotedText()%`, `%replaceQuotedText()%` | Pro | Records usage; quote text changes continue. |
| `%deleteQuotedTags()%`, `%replaceQuotedTags()%` | Pro | Records usage; tag changes continue, including the new scope options. |
| `header.set`, `header.prefix`, `header.append`, `header.delete`, `header.deleteFromSubject` | Pro | Recorded as `header.<command>`; header changes continue, including priority changes. Clipboard input is separately gated. |
| `%conditionalText()%` | Pro | Records usage; conditional insertion continues. |
| `%attach()%` | Pro | Records usage; file attachment continues. |

Sources: `chrome/content/smartTemplate-overlay.js` (all `addUsedPremiumFunction` / `addUsedStandardFunction` calls), `chrome/content/smartTemplate-util.js` (`dateFormat`), `chrome/content/smartTemplate-composer.js` (preheader), and `chrome/content/smartTemplate-fileTemplates.js` (snippet selection).

## Documentation and implementation discrepancies to retain for review

- The premium page presents license entitlements using checkmarks/crosses. Those do not consistently mean runtime blocking. The added current-restrictions section explains the distinction.
- Date/time offsets are advertised as Pro on the premium page, but the audited `X:=calculated` / `X:=timezone` branches contain no licensing gate or feature-usage recording. Do not mistake their listing for enforcement.
- `hasProLicense` and `hasStandardLicense` getters inspect key type without checking validity. Some legacy category/menu checks use those getters directly, whereas background menu restrictions check validity. Expired/missing-key behavior needs targeted testing before promising uniform enforcement.
- The main CardBook address lookup has a Pro gate, but the overlay's separate `card.find` search path invokes CardBook without the same explicit check. CardBook enforcement is not uniform across all entry points.
- The newer `scripts/st-parser.mjs.js` / `scripts/st-util.mjs.js` contain incomplete feature-tracking/restriction stubs. They must not be treated as equivalent to the active legacy parser or as proof that a gate is enforced.
- The general trial/licensing reminder is not itself a feature gate. Its elapsed-day counter must be distinguished from proposed session/day allowances.

## Implications for notification requirements

Existing elapsed-day gates already warrant accurate blocked-feature reporting. Reminder-only features must remain informational under the agreed severity rule. Any new usage policy must explicitly decide whether to replace, retain, or migrate the existing shared trial and fixed tier limits.
