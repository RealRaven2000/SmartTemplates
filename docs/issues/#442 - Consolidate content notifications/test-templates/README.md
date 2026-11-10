# Manual Composer checks for #442

Install a test build containing the implementation. These files can be selected as templates or inserted as Smart Fragments. Keep the original files beside one another so relative file references work.

1. Use [01-spellcheck.html](01-spellcheck.html). Expect an Issue row for the nonexistent dictionary, even with a valid Pro license and no licensing notices. Continue typing in the email while inspecting the issue.
2. Use [02-multiple-issues.html](02-multiple-issues.html). Expect two unsupported-file issues and a spellcheck issue in the same bubble. The long variable shows at most 45 characters, with up to 250 characters on hover or keyboard focus. Dismiss one row: the other rows and email content must remain. The collapsed issue count must update.
3. Insert [03-clean.html](03-clean.html) using Insert Snippet. Previous issues must remain. Then select it through Change Template: all previous issues must clear. If changing a template would overwrite edited content, the existing confirmation must still block replacement until answered.
4. Use [04-missing-file.html](04-missing-file.html). Expect file-reading details in a row. Existing fallback error text may also remain in the email; this change does not rewrite that fallback. The missing file must not be created.
5. Open two Composers and trigger problems separately. Reports and Dismiss actions must affect only their originating Composer.
6. Test a startup template containing the spellcheck variable with a sufficiently long configured spellcheck delay. Before its timer runs, use Change Template to select the clean template in the same Composer. The old dictionary issue must not appear in the new session. In a separate run, insert the clean file using Insert Snippet instead: the delayed issue must still appear, since snippets do not supersede existing issues.
7. With a license/trial state that produces licensing rows, repeat the multiple-issue check. Expect issues above licensing with one full-width section divider. Licensing updates must retain remaining issue rows.

The file-variable tests require an available Standard/Pro allowance or a covering license. If the feature is blocked by licensing, expect the existing blocked-feature notice instead of executing its file-processing path. The spellcheck test does not require a paid feature. Delayed spellcheck scheduling depends on whether the operation is a startup evaluation; changing a template can report immediately.

For a reproducible Copy template source check, focus the intended Composer, then run [report-actions.js](report-actions.js) in the multiprocess Browser Console. It explicitly targets the most recently active Composer regardless of the console's selected global, and adds two clearly marked synthetic issues through the same utility used by the parser. Its Promise should fulfil with `{ reported: 2, composerTitle: "..." }`; expand the result to verify the target. The earlier version returned `undefined` and could silently target the main mail window, where issue reporting is intentionally ignored. Copy the source from the first row and paste into a scratch editor: expect exactly `<p>ST442 clipboard verification</p>`. Dismiss either row independently, then report again to verify the same bubble updates. Simply writing malformed HTML is not a reliable way to trigger Thunderbird's actual insertion exception because its HTML parser often repairs the markup.

External editor setup/path dialogs, menu licensing restrictions, and the no-template-selected guidance should retain their existing UI.

## Reported manual results

The minimal template tests below are being run through Insert Snippet, rather than replacing the main template.

- 2026-11-10, Copy template source: clicking the synthetic issue's action copies exactly `<p>ST442 clipboard verification</p>` to the clipboard. Manual clipboard verification passed.

- 2026-11-10, follow-up: Change Template successfully suppresses an earlier deferred/timeout spellcheck result. The updated multiprocess Browser Console helper creates both synthetic issue rows in the Composer, including diagnostic details, independent Dismiss buttons, and Copy template source. Clipboard contents after clicking Copy template source still need confirmation.

- 2026-11-10, follow-up checks: individual middle-row dismissal works as expected. Change Template shows the edited-content warning; OK rebuilds the email and clears previous issues. The long-expression tooltip displays the full expression. A 250-character tooltip/accessibility limit was subsequently requested for large expressions and implemented for the next build. The copy-action script initially ran against `messenger.xhtml` in the multiprocess Browser Console and returned a fulfilled Promise with `undefined`; corrected the test helper to select an open Composer explicitly and return a confirmation object. Copying the source itself still needs manual confirmation.

- 2026-11-10, test 3 via Insert Snippet, build 4.22pre50: inserting the clean snippet incorrectly cleared earlier issues. Requirement clarified: only Change Template may clear all issues; Insert Snippet and identity changes preserve them. Corrected in source for the next build, with regression tests for retained rows/actions and delayed reports across snippet insertions.

- 2026-11-10, `02-multiple-issues.html` via Insert Snippet, build 4.22pre50: both unsupported-file issues appear first, then the delayed spellcheck issue joins the same expanded bubble. Existing rows and details are retained and the panel scrolls as it grows. Incremental reporting is confirmed. Individual dismissal with other rows present and the full-expression tooltip still need confirmation. The screenshots exposed a question mark replacing the truncation ellipsis; corrected in source together with affected new localized labels and summary/copy markers, with encoding regression checks added for the next build.

- 2026-11-10, test 1, build 4.22pre50: the existing German quickFilters support template invokes `%spellcheck(en,de)%`. After approximately 15 seconds, the collapsed bubble appears with a pulsing `Template issues (1)` status. Expanding shows the expression, localized spellcheck error, and `Could not access spellChecker.` diagnostic. Dismiss removes the sole issue and closes the bubble because no other messages remain. This confirms delayed issue presentation and last-row dismissal. The diagnostic indicates exhausted spellchecker-access retries, rather than a dictionary lookup failure; the underlying spellchecker availability still needs investigation.

- 2026-11-10, minimal template `01-spellcheck.html`: the Issue row correctly identifies `%spellcheck(zz_ST442)%` and shows the spellcheck error with `Could not access spellChecker.`. This also exercises spellchecker-access retry exhaustion; the intended nonexistent-dictionary lookup path has not yet been reached.
