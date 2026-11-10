Follow-up to #441: move suitable `showSmartTemplatesMessage()` workflows triggered by Composer actions into the notification bubble.

Scope is limited to problems raised while Composer processes a template or inserts/processes a fragment. External template editor problems, menu restrictions, and other messages unrelated to that processing remain in their existing UI. The aim is modeless email editing: users can continue editing and correcting their email while the reported problems remain available in the bubble.

- Show informational errors as Issue rows, alongside any licensing notices.
- The first error must show the notification bubble if it is not already displayed, even when there are no licensing notices. Subsequent errors must update the same bubble's contents as they arrive, retaining earlier issues from the current template session and any licensing notices. Update the bubble's summary/status whenever the accumulated issues require it; do not create a separate bubble for each error or wait until processing completes to display them.
- Highlight the triggering variable; truncate long expressions to 45 characters. Hover and accessibility text show up to 250 characters, including a final ellipsis when truncated, so embedded image data or other huge arguments cannot produce enormous tooltips. Keep the full diagnostic/source data separate from this display limit.
- Separate issues from licensing with one edge-to-edge divider, shown only when both sections exist.
- Retain issues across Insert Snippet operations, including snippets with no errors. Only the dedicated Change Template flow clears all issues because it replaces/rebuilds the email. Identity changes do not clear issues. Individual rows remain dismissible while editing.
- Allow delayed results, such as spellcheck failures, to join the current issue session even after another snippet is inserted. Change Template starts a new session; discard delayed results from the superseded template session.
- Reuse existing localized messages.
- Preserve diagnostic details and actions, including copying template source after HTML insertion failures.
- Keep confirmation dialogs where a response determines whether processing continues or existing content is replaced.
- Agreed button handling: for in-scope messages where OK only closes the dialog, replace the dialog with an Issue row and a per-row Dismiss button. No replacement OK action is needed. Review callers with other effects individually: preserve actions such as copying template source, and keep confirmations that control processing.
- Each Issue row has a Dismiss button in its last column, allowing users to remove individual reported problems after addressing them without changing email content or clearing the other rows. This is separate from dismissing the entire bubble.

Review callers individually, including invalid variables, spellcheck failures, file-loading errors, and character-set conversion warnings. Do not redirect the general message helper globally.

The interactive prototype is in [test-composer-warnings.html](test-composer-warnings.html) beside this description. It includes template/fragment error examples, per-row dismissal, incremental reporting, a Change Template reset, and editable email content. The original mockup remains in `docs/test/issue 442/test-composer-warnings.html`.

## Existing message callers

The table below inventories the current calls to `SmartTemplate4.Util.showSmartTemplatesMessage()`, the replacement for the legacy `SmartTemplate4.Message.display()` helper. Locations are relative to `chrome/content/`; line numbers are a snapshot and will move as implementation progresses.

| Caller | Problem or purpose | Treatment for #442 |
| --- | --- | --- |
| `smartTemplate-util.js:1296` — `displayNotAllowedMessage()` | Variable is not allowed in the current context (`contextError`). | Move to an Issue row; highlight the triggering variable and retain the diagnostic log. |
| `smartTemplate-util.js:1310` — `displayInvalidToken()` | Invalid variable or parameters (`tokenError`). | Move to an Issue row; retain the complete expression for hover and diagnostics. |
| `smartTemplate-util.js:3333` — `setSpellchecker()` | Spellchecker remains unavailable after retries (`notification.spellcheck.error` plus diagnostic details). | Move to an Issue row; carry the originating evaluation ID through retries and discard superseded results. |
| `smartTemplate-util.js:3438` — `setSpellchecker()` | Language switching fails, including missing dictionaries. | Move to an Issue row; preserve the localized error and exception details, and associate it with the original `%spellcheck(...)%` expression. |
| `smartTemplate-fileTemplates.js:1584` — `insertFileEntryInComposer()` | A snippet/template file cannot be loaded (`fileTemplates.error.filePath`). | Move to an Issue row in the initiating Composer; preserve the file label and full path. |
| `smartTemplate-main.js:619` — `notifyComposeBodyReady()` | The selected template file cannot be loaded (`fileTemplates.error.filePath`). | Move to an Issue row; start the evaluation early enough that a later reset cannot erase this failure. |
| `smartTemplate-fileTemplates.js:1834` — `readHTMLTemplateFile()` / `toUnicode()` | Character-set conversion fails (`fileTemplates.error.charSet`); processing falls back to the original data. | Move to an Issue row when loading for a Composer evaluation; retain the charset and fallback behavior. Keep other calling contexts working. |
| `smartTemplate-compose.js:1912` — HTML insertion error handler | HTML insertion fails; displays syntax advice and the exception, then offers to copy the template source. | Agreed: retain the error and diagnostic details in an Issue row with Copy template source and Dismiss actions. No Cancel button is needed: the existing OK copies the source, and Cancel only closes the dialog; neither choice controls further processing. |
| `smartTemplate-main.js:700` — `notifyComposeBodyReady()` | Replacing a template would overwrite edited content (`notification.editedChangeWarning` / `notification.editedChangeChallenge`). | Agreed: outside the new notification flow. Keep the blocking confirmation: OK permits replacement and Cancel stops it. This requires user input before processing can continue; any redesign is deferred to later work. |
| `smartTemplate-composer.js:194` — template-selection action | No template is armed; instructs the user to select from the menu (`fileTemplates.selectFromMenu`). | Keep the existing dialog and menu initialization/focus behavior; no template or fragment is being processed yet. |
| `smartTemplate-fileTemplates.js:133` — `edit()` | External template editor is not configured (`prompt.fileTemplates.editor.setup`). | Keep the setup dialog; OK opens the editor preference. Outside template evaluation. |
| `smartTemplate-fileTemplates.js:169` — `edit()` | Configured external editor path is invalid (`prompt.fileTemplates.editor.pathError`). | Keep the setup dialog; OK opens the relevant preferences. Outside template evaluation. |
| `smartTemplate-fileTemplates.js:665` — template-limit information menu item | Explains licensing limits on the number of configured templates (`fileTemplates.restrictTemplates`). | Keep outside the template-issue migration; this is a menu licensing explanation. |
| `smartTemplate-fileTemplates.js:1284` — `fireComposeCommand()` | No Thunderbird controller exists for the requested compose command (`fileTemplates.error.nocontroller`). | Keep the existing message: the command may fail before a Composer exists to host a bubble. |

Do not redirect `showSmartTemplatesMessage()` globally. Route eligible callers explicitly, keeping issue state independent of licensing so licensed users also receive template diagnostics and license updates do not clear issues. Use the initiating Composer rather than the most recently focused Composer when associating messages and actions.

## Implementation and testing

The legacy parser reports through `SmartTemplate4.Util.reportComposeIssue()` using the existing NotifyTools background listener. The wrapper sends plain-text `message`, `expression`, `details`, an optional named `action`, and the originating Composer/evaluation IDs. Background owns retained issue state and dispatches models to the existing MailExtension compose script. Copy template source uses the standard clipboard API and the existing permission; no new experimental API is needed.

The wrapper comment records the intent to recreate this utility in background and remove parser NotifyTools calls when parsing migrates during the remaining ESR period. Parsing and host services should become separate components to allow a possible Firefox add-on for Gmail templates.

The implementation also routes existing processing alerts for prompt validation, unavailable sent dates, unsupported or unreadable nested files, missing attachments, and identity-switch file-loading failures through the wrapper. User cancellation still aborts the relevant operation without adding an issue. Existing processing/fallback decisions are preserved.

See [manual test templates and checks](test-templates/README.md). Automated controller/transport checks are in `test-compose-issues.mjs`; renderer regression checks remain with the existing #441 notification tests.
