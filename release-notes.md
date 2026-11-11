**Enhancements**

- Compatible with Thunderbird 162.
- Added the Pro feature `%prompt()%` for free text or selection from a list of choices in templates and Smart Fragments. Supports clipboard defaults, optional clipboard output, and limited evaluation access. #443.

**Composer notifications and feature trials**

- Licensing notices now appear in a compact, expandable notification bubble instead of sliding notification bars. Remaining uses are shown beside each licensed feature, with an explanation of daily counting and the applicable license. Licensing and comparison links open in the external browser. #441.
- New users have 28 trial days without consuming individual feature allowances. Users with an expired license have 7 grace days from license expiry to renew while retaining access to licensed template features. Previous feature usage is preserved through licensed and grace periods. #441.
- Outside the trial or grace period, each tracked licensed feature uses its own remaining free allowance. Only the first use each local calendar day counts; further emails and Thunderbird restarts that day consume no additional uses. Features covered by a valid license do not consume an allowance. #441.
- Remind me later hides Standard and Pro feature countdown reminders until the next local midnight, across composers and Thunderbird restarts. Existing compose sessions stay quiet after midnight; blocked features and template errors remain visible. #441.
- Exhausted features are skipped with their original tokens retained. A pink notification highlights features that were actually blocked and warns that unresolved variables may remain in the email. #441.
- Template and Smart Fragment errors now appear in the notification bubble, so editing can continue and errors can be dismissed individually. Diagnostic details remain available; HTML insertion failures offer a Copy template source action. #442.

**Other improvements**

- Fixed trial access to clipboard operations, tags, and `%deleteForwardedBody%`. #439.
- Updated translations, including the Refresh UI action and the structured What's New information in all locales. Simplified localization entity names and sorted locale catalogs alphabetically. #440.
