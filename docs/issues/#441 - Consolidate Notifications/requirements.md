# Consolidate licensing and feature notifications

Status: consolidated requirements draft for #441. Open policy decisions are explicitly listed below. No runtime implementation changes are authorized by this document.

Design reference: [HTML prototype source](../blob/ESR140/docs/issues/%23441%20-%20Consolidate%20Notifications/notification-prototype.html) (download and open locally to interact). The prototype demonstrates presentation, not production trial accounting or suppression. Its sample 28-day value is not a decision on the new allowance length.

## Goals

- Reduce the screen space, repetition, and cognitive load of licensing reminders for existing users.
- Make licensing and trial status clear and consistent across notification sources.
- Help new users reach a useful result through better onboarding, including the recently added Download Snippets feature.
- Move toward understandable trial allowances and predictable gates rather than incessant reminders.

## Current problems

See [the current feature inventory](../blob/ESR140/docs/issues/%23441%20-%20Consolidate%20Notifications/feature-inventory.md) for existing gates, fixed limits, reminder-only features, and implementation discrepancies. The current shared 28-day trial is elapsed calendar time, not a per-feature session/day allowance.

One template insertion can produce three visible bars: general licensing/trial information, a Pro feature list, and a Standard feature list. These messages compete for attention and reduce the space available for writing email.

General reminders and Standard feature notices share a notification identifier, but asynchronous creation may allow duplicate bars. Pro feature notices use a separate identifier. This is a suspected contributing cause that needs verification during implementation.

Current messaging says features will keep working. Repeated reminders therefore provide little new information. A yellow warning for a feature that was not blocked exaggerates the severity.

## Agreed direction

### Frequency and trial accounting

- Keep the 28-day general trial for new users; after license expiry, provide 7 grace days from the expiry date. Preserve previous per-feature usage through licensing and grace periods. Explain the transition to remaining feature allowances in the expanded trial/grace row. After it ends, each tracked licensed feature has its own allowance of **12 free uses**, with maximums defined centrally in code. This supersedes the earlier shared active-use-day countdown proposal.
- Store `{ usage, lastUsedDate }` per feature in a JSON string preference under `extensions.smarttemplates.<feature>`. Only the first qualifying use on a local calendar date increments that feature's count; further emails, uses, and Thunderbird restarts that day consume nothing extra. Inactive days and features covered by the license consume nothing.
- New features start with their own full allowance without resetting other features. The final included day remains available at zero additional uses remaining; blocking begins on a later day. A valid Standard license must not consume Standard allowances or grant unlimited Pro evaluation through its refreshed legacy grace date.
- A specific informational notice about missing licensing or gated features should appear only once per day, in the first composer for that day. Features encountered later that day must not trigger additional informational reminders; defer their reporting to the next daily notice. Actual blocking warnings are a separate policy decision.
- Reminder frequency must be coordinated across composer windows and notification sources; opening another composer must not independently restart the reminders.
- Trial allowance consumption and notification display frequency are separate concerns. An active trial session must not imply showing a reminder on every use.

### Severity and clarity

- General trial-day information is informational.
- Pro and Standard feature usage is informational while the features remain available.
- When a tracked feature is exhausted, skip execution and retain its original token in the message. Mark actual blocking explicitly with a restrained pink bubble, highlighted feature names, and the **Some features blocked** summary. A zero remaining count on the final included day is not a blocked operation.
- A yellow warning is warranted only when a feature was actually blocked.
- Messages must distinguish available trial usage, an active trial session, exhausted allowances, and an operation that was actually blocked.
- Consolidate the competing licensing sources into one compact, expandable composer notification, as specified below.
- Replace confusing funding/reminder explanations such as "They will keep working, but upgrading ... removes these reminders" with concise, accurate feature and trial status. Do not promise continued availability for a feature that can be blocked. The prototype retains existing text as layout content; final copy must match the agreed gate policy.

### Composer notification presentation

- Use a right-aligned bubble over the composer editor rather than stacked full-width bars that reduce vertical writing space. A toolbar action is not the information surface for this design.
- Initially show the SmartTemplates icon, a short text status, and a right-facing disclosure chevron. Do not use an icon-only reminder or show purchase buttons in the collapsed state.
- When trial information is absent, use **Licensed features used** as the collapsed summary for available licensed features. Use **Some features blocked** when an actual blocked operation is explicitly reported; expiry alone must not imply blocking. If both apply, the blocked summary takes precedence. The current frontend reports usage only; explicit blocking reports are future integration work.
- Keep the collapsed bubble below 50% of the available editor width. On expansion, retain right alignment and expand upward to approximately 75% width, capped at 1,000 px. On narrow screens, allow the expanded panel to use the available width with margins. Cap the total bubble height at 80% of the editor viewport so composer context remains visible; scroll details only when they exceed the available height, without an additional fixed pixel-height cap.
- The expanded header contains exactly one SmartTemplates branding icon at the top left, the add-on name, and a collapse chevron. Replace the collapsed status with this header; do not repeat branding or "Learn more" inside the expanded panel.
- Below the header, render independently optional, parameter-driven sections in this order:
  1. **licence:** available trial data and concise licensing information. Omit the trial section when no trial data remains or it is unavailable. End this field with a normal **More about licensing** hyperlink to `https://smarttemplates.quickfolders.org/contribute.html`, not a separate footer button.
  2. **PRO:** one feature-summary row for previously flagged Pro features; omit it when there are none. Text may wrap naturally.
  3. **STD:** one feature-summary row for previously flagged Standard features; omit it when there are none. Text may wrap naturally.
- List feature names with red, focusable `(number)` controls for their real remaining allowances. Hovering shows a tooltip; selecting the count reveals the explanation. Use **free uses remaining** and explain that only the first use each day counts, so the feature can be fully tested throughout that day. Append the friendly license-fit sentence: PRO features are included with SmartTemplates Pro; STD features are included with SmartTemplates Standard or Pro. Omit counts when usage data is unavailable and never display prototype sample values as real counters.
- Build badges as styled text rather than prerendered `licensing.png` / `proFeature.png`: orange **licence**, cyan **PRO** inspired by `pro-paid.svg`, and a less saturated **STD** badge. Keep explicit text labels so color alone is not the indicator.
- Buttons below the sections are independently parameter-driven. Supported actions include **Buy License**, **Compare Features…**, and **Remind me later**; omit actions that are not applicable.
- Reuse the existing localization entity `message.features` (English: "Compare Features…") for the comparison button. Link to `https://smarttemplates.quickfolders.org/premium.html#featureComparison`. Show it when PRO or STD feature information is present and the action is enabled.
- Licensing web links open in the external browser in the production add-on. The standalone prototype uses normal links opening separately and demonstration purchase/snooze behavior.
- Retain keyboard-accessible expansion, visible focus, readable wrapping, and an accessible association between the disclosure and its details. Expansion must not steal editor focus automatically.

### Frontend feasibility and boundaries

The preferred frontend candidate is a compose-script overlay. Standard compose scripts operate in the email editor document, not Thunderbird's surrounding chrome; there is no standard MX equivalent of the native embedded notification bar. The operating-system notifications API does not provide this presentation or equivalent action buttons.

Validate the overlay lifecycle before production adoption. Fixed positioning, Shadow DOM, and `contenteditable="false"` alone do not guarantee exclusion from saved or sent message content. The UI must not contaminate outgoing email, drafts, or saved templates, and must not interfere with plain-text composition, selection, undo, or normal editing. Parser migration is not a prerequisite for a separate presentation component; define its communication with the existing legacy parser explicitly. An experimental wrapper around the current bar remains an alternative if the overlay cannot meet these requirements, not an agreed frontend migration on its own.

### Remind later

A meaningful Remind me later mechanism is desired. It should provide a quiet period across composers rather than merely close one bar. Its duration, persistence, and relationship to actual blocking warnings remain open.

### De-noising menus and licensing explanations

- Keep licensing actions visible when invoked from a composer: use an in-app dialog for licensing choices and explanations, and open licensing web pages in the external browser. Do not open these pages in a main-window Thunderbird tab hidden behind the composer. The current More about licensing action opens `contribute.html` in such a tab and can therefore appear unresponsive despite working.
- Replace the chatty menu question "Why are some templates in this menu disabled?" with the action label **Remove menu limits…**.
- Give this entry the PRO icon at `chrome/content/skin/icons/pro-default.svg` so its licensing purpose is recognizable without a long label.
- Show the entry when license limits affect the menu. Keep the explanation available on demand rather than opening a dialog automatically.
- Explain the tier differences in the dialog: unlicensed users have 5 entries per Write, Reply, Forward, or snippet toolbar menu; Standard raises each allowance to 25; Pro removes the tier entry cap. The existing 3-category limit without Pro is separate.
- Describe entries that the menu makes accessible rather than implying users cannot configure or save additional entries.
- Preserve the permanent limited-use option for unlicensed users; the existing menu allowances are fixed limits, not expiring usage counters.

## Proposed Change List

These are proposals for implementation planning, not authorization to change runtime behavior. Open policy decisions below still apply.

1. Coordinate the general licensing, Standard-feature, and Pro-feature notification sources, preventing duplicate bars and reducing occupied composer space.
2. Add shared daily reminder tracking across composers, with informational notices shown only under the agreed once-daily policy.
3. Introduce per-feature 12-use allowances after the existing general trial, consumed at most once per local day, independently of notification frequency. Preserve original tokens when an exhausted feature is skipped.
4. Reserve yellow warnings for features that were actually blocked; distinguish those from informational licensing and trial messages.
5. Provide a meaningful Remind me later action once its quiet-period and persistence policies are settled.
6. Replace the existing menu-limit question with **Remove menu limits…** and the PRO icon, retaining an explanation dialog with accurate tier limits.
7. Apply the same entry and category policy to the new right-click snippet menu as to the snippet toolbar menu. Its current lack of these checks is an enforcement inconsistency. Use the same compact licensing action when limits apply.
8. Keep the feature inventory and premium page aligned with implemented restrictions, and support onboarding through useful templates and downloadable snippets without adding competing reminders.
9. Make licensing actions visible from the composer: retain in-app licensing dialogs and route licensing web pages to the external browser instead of a Thunderbird tab behind the composer.
10. Prototype and validate a composer overlay with the agreed collapsed/expanded layout, optional trial/PRO/STD sections, styled badges, and parameter-driven actions. Reuse `message.features` for the feature-comparison button and move More about licensing into the licence field as a text link.
11. Replace ambiguous reminder copy with concise status wording after the gate policy is settled; keep final text consistent with what actually remains available or was blocked.

## Reference: quickFilters trial implementation

The current quickFilters implementation centralizes feature allowances and counts consumed uses. Its restore feature uses a session allowance: repeated operations remain covered while the Thunderbird process is running or while the last-used local date matches today. Other features generally count individual attempts.

It distinguishes remaining attempts, active trial sessions, and exhausted allowances. Becoming licensed resets usage, and licensed operation consumes no trials. Usage operations are coordinated through an explicit experimental API.

The session allowance does not itself suppress repeated notifications. SmartTemplates needs an explicit reminder-frequency policy in addition to any adapted usage accounting.

## Onboarding and audience context

The supplied user charts show a long-term decline followed by relative stability since 2025. They do not establish whether the decline comes from acquisition, retention, or users remaining on older Thunderbird versions.

Onboarding should help users reach a working template or snippet quickly. Detailed onboarding flows are a separate design task; this notification work should support that goal without adding more competing messages.

## Open decisions

- Review grouping and future per-feature maximum adjustments; the initial default is 12. Existing strict Pro-only CardBook and auto-send actions remain unchanged; review them separately before offering trials for those non-token operations.
- Finalize concise collapsed status and section wording, including how the first daily notice summarizes features deferred from the previous day. Feature names appear in the expanded view; later feature use stays quiet informationally.
- Decide whether an actual blocked operation must always produce an immediate warning, including after the daily informational notice or a Remind me later action.
- Define treatment of existing users and existing templates when introducing gates.
- Review the retained-token behavior during native tests, including side-effect commands and nested templates. The agreed initial behavior is to skip the exhausted feature and keep its original token visible, rather than stop composition.
- Define dismissal, snooze duration, restart persistence, and reset behavior after licensing changes.
- Optional sections must not leave empty rows or separators. Final blocked-feature details depend on the outstanding blocking policy; the collapsed used/blocked distinction is agreed above.

## Implementation constraints

- Preserve legacy preference namespace prefixes because Thunderbird about:config storage is global.
- Prefer standard MailExtension APIs; use explicit experimental API methods where privileged access is necessary.
- Keep new persistent state and helpers beneath the existing SmartTemplate4 namespace or in appropriate module/private scopes. Do not introduce global bindings in injected legacy scripts without approval.
- Preserve existing integration contracts and unrelated Thunderbird notifications.
- Maintain UTF-8 throughout localization work, preserve alphabetical catalog order, and respect each locale's localization scope.

## Verification expectations

- Exercise multiple emails and overlapping composer windows on the same day.
- Verify informational notices do not repeat beyond the agreed daily policy.
- Verify trial use does not decrement per email within an included session/day.
- Verify basic free usage, the general trial, covered licensed usage, and inactive days consume no per-feature allowance; each feature consumes at most one use across composers and restarts on the same local date.
- Verify yellow warnings correspond to an actually blocked operation.
- Cover restart, day rollover, license transitions, dismissal, and snooze after their policies are agreed.
- Verify the consolidated presentation preserves useful writing space and accurately reports the affected features.
- Exercise each optional section and button independently, including exhausted/missing trial data, PRO-only, STD-only, both tiers, and no enabled buttons. Branding remains present in the expanded header.
- Verify licensing and comparison links open visibly in the external browser, and `message.features` supplies the comparison label.
- Verify keyboard expansion/collapse, focus, narrow windows, and text wrapping. Collapsed mode shows no purchase buttons; expanded mode retains right alignment and the agreed width cap.
- Before adopting the compose-script overlay, verify no UI content or styling enters sent messages, drafts, saved templates, or plain-text output. Cover send/save failures and cancellation as well as successful operations; verify normal editor selection, undo, and focus remain usable.
