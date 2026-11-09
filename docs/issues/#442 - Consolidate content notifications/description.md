Follow-up to #441: move suitable `showSmartTemplatesMessage()` workflows triggered by Composer actions into the notification bubble.

- Show informational errors as Issue rows, alongside any licensing notices.
- Highlight the triggering variable; truncate long expressions to 45 characters with the full text available on hover.
- Separate issues from licensing with one edge-to-edge divider, shown only when both sections exist.
- Allow delayed results, such as spellcheck failures, to join the current evaluation; discard results from superseded evaluations.
- Reuse existing localized messages.
- Preserve diagnostic details and actions, including copying template source after HTML insertion failures.
- Keep confirmation dialogs where a response determines whether processing continues or existing content is replaced.

Review callers individually, including invalid variables, spellcheck failures, file-loading errors, and character-set conversion warnings. Do not redirect the general message helper globally.

The proposed layout is in `docs/test/issue 442/test-composer-warnings.html`.