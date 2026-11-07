# Composer notification frontend (#441)

## Implemented scope

Existing composer licensing calls now use the existing NotifyTools listener to reach a background controller in `html/compose-notifications/controller.mjs`. The request includes the originating window ID; the controller resolves its compose tab, combines and deduplicates general/PRO/STD information, and delivers a model through standard `tabs.sendMessage` messaging. A compose script registers before legacy window injection starts; its ready request retrieves pending state. Other windows retain the native notification path, which is also the fallback if composer routing throws.

`compose.js` creates one host outside the editor body. All notification text, controls, and the stylesheet link live in an open ShadowRoot. `notification.css` is loaded inside that root and does not style email content. The host is removed on legacy composer teardown; an empty host from a previously saved draft is replaced when the script initializes. Per-tab state is discarded when the tab closes. Successful license validation removes covered feature sections.

The frontend uses existing localized licensing/feature text and `message.features`. The three new labels (`notification.compose.details`, `notification.compose.learnMore`, and `notification.compose.remindLater`) are translated in all 21 non-English UI locales. The SPLASH-only Vietnamese locale retains the English fallback. UTF-8 text and existing catalog entries are preserved; no catalogs were bulk-reformatted.

The existing general trial remains in place. After it ends, tracked template features now have independent 12-use allowances, counted once per local day. Remind me later still only collapses the bubble; daily suppression and a persisted snooze are not implemented yet.

## Automated checks

### Per-feature display integration

The live renderer now uses structured PRO/STD feature lists and the approved friendly license descriptions. Optional numeric counts are rendered as focusable red `(number)` controls, with native hover tooltips and a clicked explanation below the actions. The shared counting explanation appears only when at least one feature has valid usage data. Feature names and license descriptions remain visible without counters.

The controller's `getFeatureUsage(features, request)` provider is wired to an explicit Utilities API. It returns real remaining-use counts without consuming another use. Eight additional display/explanation strings are in the English catalog, with default-locale fallback elsewhere pending localization.

### Per-feature counting and gates

- `scripts/premium/usage-policy.js` defines the tracked Standard and Pro template features and their maximum allowances (12 each). It is loaded with the store into a private API scope, not a legacy window global.
- `scripts/premium/usage-store.js` stores each feature's JSON `{ usage, lastUsedDate }` in a string preference named `extensions.smarttemplates.<feature>`. The existing `extensions.smartTemplate4.*` preferences retain their names. No usage is consumed during the general trial or for features covered by a valid license.
- Once-per-local-day accounting survives composer changes, add-on reloads, and Thunderbird restarts. The last included day remains usable even at zero remaining; the next day's attempt is denied. No license event resets unrelated counters.
- The Utilities method is synchronous so legacy modifier functions can check/consume atomically before side effects. The legacy namespace loads its callable through the existing WindowListener API context. No new NotifyTools listener is introduced.
- A valid Standard license's refreshed legacy grace date does not provide an unlimited Pro trial. Covered Standard features bypass counting; uncovered Pro features use their own allowance.
- Exhausted template commands are skipped and their original tokens remain in the message. Modifier tokens are protected from the later modification pass as well. Dependency checks avoid running a header command with an unavailable clipboard argument.
- Actually blocked features get a pink bubble, a **Some features blocked** summary, and individually highlighted feature names. A count of zero alone does not imply blocking while the last included day is still active.
- Existing strict Pro-only CardBook contact lookup and filter auto-send checks are unchanged. Their non-token actions are not converted into 12-use trials by this implementation. Existing menu entry/category limits are unchanged.
- No general-trial-date reset, rollout notice, or migration to a different initial trial period is included. Existing users with an expired general trial start with fresh per-feature allowances when no new usage preference exists.

To test exhaustion, after expiring the general trial set a feature preference such as `extensions.smarttemplates.file` to `{"usage":12,"lastUsedDate":"2026-10-01"}` in Config Editor. Its next attempted use should remain as `%file(...)%` and produce the pink warning. Reset that preference to restore its full allowance. With today's date instead, the final included day should remain usable at zero remaining. Test on a disposable compose message and review tokens before sending.

Run `node --test "docs/issues/#441 - Consolidate Notifications/test-compose-notifications.mjs" "docs/issues/#441 - Consolidate Notifications/test-feature-usage.mjs"`.

Tests cover concurrent reports in separate composers, feature deduplication, pending delivery, optional sections, action routing, license transitions, renderer reinjection, stale model rejection, and the UI's placement entirely inside shadow DOM. The DOM harness does not verify Thunderbird serialization or native rendering.

## Native test checklist

### Confirmed user testing — 2026-11-07

- Buy License button: passed.
- Compare Features button: passed.
- More about licensing link: passed.
- Expired trial after setting `settings["license.gracePeriodDate"]` to `2026-10-01` and restarting: passed. Reply with an account template using `%file()%` shows the collapsed **Licensed features used** summary; expanded view omits the trial and PRO sections, retains the STD feature row, and offers Buy License, Compare Features, and the dummy Remind me later action. This confirms presentation, not any new gating policy.
- Collapsed notification avoids the visible LanguageTool control: passed after using the editor viewport height and measuring toolbar descendants. Inspector showed a 404 px viewport versus 1,061 px document height.

These results confirm the listed actions and layout behavior only; draft/send serialization and the remaining checklist items still need separate verification.

The collapsed bubble now detects visible LanguageTool toolbar controls in its open shadow root and moves itself above overlapping controls with a 10 px gap. Expanded layout remains unchanged. Resize/mutation observers and a one-second fallback check handle toolbar changes and late shadow-root attachment; the other extension's DOM/styles are never modified. Positioning styles remain inside our shadow root. If the toolbar is hidden, removed, or no longer overlaps horizontally, the normal bottom position is restored. Test this with LanguageTool enabled, including resizing and collapsing/re-expanding the notification.

1. Build and install the development package. With no valid license, open a composer using a template with Standard features (`file`, `style`) and Pro features (`replaceQuotedTags`, `header.prefix`). A single collapsed bubble should replace the old composer licensing bars.
2. Expand it: one branding header, optional trial/PRO/STD rows, and action buttons. Collapse/re-expand and resize the window. Check that email formatting and editor selection remain unchanged.
3. Open two composers with different features and confirm each bubble shows only its own reports. Insert another snippet and confirm repeated feature names are not duplicated.
4. Compare Features and More about licensing should open in the external browser. Buy/Renew/Upgrade should open the licensing dialog. Remind me later should only collapse the current bubble.
5. Verify optional sections with expired trial data, Pro-only usage, and Standard-only usage. Validate a license and check that covered notifications disappear.
6. Inspect the live DOM: the host is after body; its content and stylesheet are under `#shadow-root`. Save manually, autosave, save as template, and send to a test account. Inspect raw source: no notification text, controls, CSS, or icon should be serialized. An empty host may remain, as in the LanguageTool investigation. Repeat for plain-text composition and a canceled/failed send.
7. Exercise add-on reload in existing composers and a reopened saved draft. Confirm no duplicate hosts/listeners. Check the error console for `[ST441]` errors.

Native send/save serialization must be verified with this implementation; the LanguageTool investigation is supporting evidence, not a substitute for these checks.
