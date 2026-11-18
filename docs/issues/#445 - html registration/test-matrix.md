# Registration checkout test matrix

Manual test plan for #445. Open **SmartTemplates → Test → New registration tab** with the starting license installed. Results below are expectations, not completed tests.

The maintainer reports that all Settings → Licenses scenarios pass in German with valid, soon-to-expire and expired licenses, including Standard upgrade. This confirms the Settings entry point and its available actions. Individual shop routes, referrers, date boundaries, no-license purchases and invalid/mismatched-key tests remain separately recorded below; the Settings report does not establish those results. Automated model tests do not replace these Thunderbird/shop checks.

## Required final-build check: Domain renewal emphasis

Pending maintainer test on the final build: install a real expired Domain license, open registration through Renew License, and verify that Renew License in the Domain card is the highlighted primary action. Standard must be hidden. Buy Pro may appear only as an unhighlighted separate personal-license purchase, with the Domain coverage explanation; it must not look like a Domain renewal alternative. Check the Domain renewal checkout destination and existing Domain key referrer without completing a purchase. Repeat with a valid Domain license: the highlighted action must still say Renew License, never Extend License. Do not mark this passed from the prototype alone.

The maintainer reports that Domain users accidentally buying Pro instead of renewing is a recurring problem. The legacy XHTML dialog highlighted the Domain button for this case; preserve that product guidance in the replacement.

## Recorded manual results

Pending Thunderbird check: click Buy/Renew/Upgrade in a composer notification bubble. It must open the modern registration tab, preserve the feature context, reuse an existing registration tab, and leave the composer open. The legacy XHTML menu entry remains an independent emergency fallback.

Pending Thunderbird checks for the other migrated callers: installation/update splash Extend/Renew/Upgrade buttons and renewal/upgrade promotional icons, both template category-limit warnings, and the general message dialog's license button. Each must open/reuse modern registration with its originating feature preserved. Explicit Extend actions must reveal early Standard extension. Splash pages close only after registration opens successfully and remain open on failure; the composer and main Thunderbird window remain open. Confirm the emergency test-menu entry still opens XHTML independently.

| Date | Check | Result | Maintainer feedback |
| --- | --- | --- | --- |
| 2026-11-16 | Settings ↔ registration between-tab handoff | Passed | Feels more connected and responsive; registration feels more like part of the add-on than a separate web page. |
| 2026-11-17 | Settings → Licenses scenarios in German | Passed | Valid, soon-to-expire and expired licenses, including Standard upgrade. |
| 2026-11-17 | Composer bubble: Standard license using Pro features | Passed | Upgrade action opens modern registration with Pro highlighted. German notification text and the Lizenz badge were subsequently verified after localization fixes. |
| 2026-11-17 | What's New purchase button and sale icon | Passed | Opens the new registration page instead of the shop directly. |
| 2026-11-17 | Registration tab reuse from another entry point | Passed | Existing registration tab is reused. Explicit intent and synthetic-scenario reset remain separate checks. |
| 2026-11-17 | Emergency legacy registration test-menu entry | Passed | Opens the legacy XHTML registration dialog. |
| 2026-11-17 | Licensed email address not configured in any account | Passed | Settings shows the missing-account warning and Buy License action. |

These results confirm the reported tab handoff and Settings scenarios, not every checkout destination, validation failure or simulated failure path.

Use normal mode for real shop checks. URLs containing `scenario=` use synthetic data and never open checkout. `?intent=extend` in normal mode uses the actual license and explicitly reveals early Standard extension. Save your previous license before replacing it: validation saves the entered key, including an invalid one.

## Products to click

| ID | Starting license | Card/button to click | Expected shop route after `/quickfolders/` | Referrer | Result / notes |
| --- | --- | --- | --- | --- | --- |
| P01 | No license | Buy Standard | `product/smarttemplatestandard` | Originating feature, if supplied; otherwise absent | |
| P02 | No license | Buy Pro | `instant/smarttemplate4` | Originating feature, if supplied; otherwise absent | |
| P03 | No license | Buy Domain | `product/smarttemplate4domain` | Originating feature, if supplied; otherwise absent | |
| S01 | Valid Standard, fewer than 30 days left | Standard: Extend License | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S02 | Valid Standard, exactly 30 days left | Standard card hidden | No checkout action | None sent | |
| S03 | Valid Standard, more than 30 days left | Standard card hidden | No checkout action | None sent | |
| S04 | Valid Standard, 30+ days left; open with `?intent=extend` | Standard: Extend License | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S05 | Valid Standard, near expiry | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| S06 | Valid Standard, well before expiry | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| S07 | Expired Standard, recently expired | Standard: Renew License | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S08 | Expired Standard, long expired | Standard: Renew License | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S09 | Expired Standard, recently expired | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| S10 | Expired Standard, long expired | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| R01 | Valid Pro, near expiry | Pro: Extend License | `instant/smarttemplate4renew` | Existing Pro key | |
| R02 | Valid Pro, well before expiry | Pro: Extend License | `instant/smarttemplate4renew` | Existing Pro key | |
| R03 | Expired Pro, recently expired | Pro: Renew License | `instant/smarttemplate4renew` | Existing Pro key | |
| R04 | Expired Pro, long expired | Pro: Renew License | `instant/smarttemplate4renew` | Existing Pro key | |
| D01 | Valid Domain | Domain: Renew License | `product/smarttemplatesdomainrenewal` | Existing Domain key | |
| D02 | Expired Domain, recently expired | Domain: Renew License | `product/smarttemplatesdomainrenewal` | Existing Domain key | |
| D03 | Expired Domain, long expired | Domain: Renew License | `product/smarttemplatesdomainrenewal` | Existing Domain key | |

For a short first pass, run P01–P03, S01, S05, S07, S09, R01, R03, and D01–D02. Then check long-expired licenses, the Standard 30-day boundary, and explicit early extension.

## License dates and pricing

These are shop/license-generator checks. Opening a product page alone does not prove the issued expiry date; record that separately when testing generated output.

| Action | Expected date rule | Result / notes |
| --- | --- | --- |
| Buy a new personal license | Full year from payment | |
| Extend a valid Standard or Pro license | Later of one year from payment or one year beyond the existing expiry date | |
| Renew an expired Standard or Pro license | Later of one year from payment or one year beyond the existing expiry date | |
| Upgrade valid Standard to Pro | One year from upgrade payment; remaining Standard time is not added | |
| Upgrade expired Standard to Pro | One year from upgrade payment; same rule as valid Standard | |
| Extend/renew Domain | Normally one year beyond the previous expiry date; late ordering/payment does not restart the term | |

Check that renewal/extension products show their intended reduced pricing rather than new-license pricing. Record currency, tax treatment, and any active promotion when comparing. No fixed prices are embedded in the registration page.

## Checks on every live checkout

- The intended product opens in the default external browser.
- Edited first name, last name, and email prefill correctly. Include Unicode names, an apostrophe, an ampersand, and an email address containing `+` in at least one run.
- Renewals, extensions, and upgrades pass the previous license key as `referrer`, even if an originating feature was supplied. New purchases pass only the originating feature, if any.
- Contact values and the key are encoded once. Inspect locally if necessary; redact keys and personal details from shared screenshots or results.
- The registration tab stays open and retains edits. If browser opening fails, an error appears and the button becomes usable again.
- Switching between selection and terms preserves the chosen account and edited contact values.

## Unavailable options and state checks

| Starting state | Expected behavior | Result / notes |
| --- | --- | --- |
| Valid or expired Standard/Pro | Buy Domain opens `product/smarttemplate4domain` as a new purchase; do not pass the personal key as a renewal referrer | |
| Valid or expired Pro | Standard card hidden; no downgrade purchase | |
| Valid or expired Domain | Standard hidden; Domain renewal highlighted; Pro is an unhighlighted new purchase with coverage explanation | |
| Invalid key, missing licensed account, or email mismatch | Show the corresponding state; offer fresh purchases without passing the invalid key | |
| No eligible identities | Permit manual contact entry; require a valid email before opening checkout | |
| Synthetic `scenario=` URL | Preview only, no external shop and no saved-key changes | |

Hidden downgrade cards and the early-extension prompt are current implementation behavior; record any desired policy adjustments separately from product-routing defects.

## Localized layout review

Pending Thunderbird review after the localization pass: try a language with long labels and one CJK language at normal and narrow widths. Check selection and terms headings, purchase buttons, the expiry badge, Domain coverage and Add users text, email help, validation errors and the checkout notice. Names and email addresses must remain unchanged when switching identities. Verify locale-formatted dates. Vietnamese should use the established English registration fallback while its What's New section remains translated.
