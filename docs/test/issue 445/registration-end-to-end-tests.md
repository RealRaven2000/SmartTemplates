# Registration end-to-end tests

Manual checks for #445. Unchecked items are pending; automated tests do not establish a Thunderbird or shop pass. The longer [checkout test matrix](../../issues/%23445%20-%20html%20registration/test-matrix.md) lists individual products, routes, date rules and boundary cases.

## Entry points and window behavior

- [x] Settings → Licenses: open registration using Buy, Upgrade, Extend or Renew as available. Confirm the correct edition and action are highlighted. Passed in German on 2026-11-17: all reported Settings scenarios with valid, soon-to-expire and expired licenses, including Standard upgrade.
- [ ] Notification bubbles: click their license action. Registration should open in front, with its owning Thunderbird window focused, while the composer remains open and its draft unchanged. Repeat with an existing registration tab in another main window.

  Passed in German on 2026-11-17: a Standard license using Pro features offers the upgrade action and opens registration with Pro highlighted and Upgrade auf Pro. Other bubble states and the multi-window case remain pending. The screenshot also exposed English fallback text for feature descriptions; the missing German composer-notification entities were added afterward and their displayed translations were subsequently verified with Standard and no license.

- [ ] Premium-feature and both template category-limit warnings: follow the registration action and confirm it opens the modern page.
- [ ] General message dialog: its license button opens the modern page.
- [ ] Installed/updated welcome pages: test renewal, extension, upgrade and promotional actions. The welcome page closes only after registration opens successfully.
- [x] What's New: “I want to buy a license” and the sale icon open registration rather than going straight to the shop. Passed on 2026-11-17: opens the new registration page.
- [x] Tab reuse: leave registration open, then trigger another entry point. Passed on 2026-11-17: the existing registration tab is reused.
- [ ] Tab context reset: specifically verify that a later visit clears an earlier explicit extension intent or synthetic test case and selects the appropriate actions for the new entry point.
- [x] Emergency legacy menu: Legacy License Registration still opens the old XHTML dialog. Passed on 2026-11-17.

Reported on 2026-11-17: the maintainer tested focusing registration from the composer bubble and found the focus change natural. The multi-window case above remains a separate check.

German notification localization was also tested with a Standard license and without a license on 2026-11-17: displayed body text and actions passed. The screenshot exposed the remaining hardcoded “licence” badge; it was subsequently localized to Lizenz and confirmed fixed in a follow-up screenshot on the same day. This localization result does not mark the remaining registration routes or multi-window behavior passed.

## License validation with real keys

Test through Settings → Licenses → Validate, using copies of genuine keys. Save the original key first: validation stores the entered key even when it is invalid. Start each alteration from the untouched original, and restore it afterward. Do not include real keys in committed results or screenshots.

The production validator is `scripts/Licenser.mjs.js`. Automated tests cover date, email and prefix comparisons, but supply a synthetic RSA decryption result. These checks verify the real decryption and Settings/background integration.

| Check | Expected result | Result / notes |
| --- | --- | --- |
| Untouched current Pro key (`ST-`) | Valid, correct edition and actual expiry date | |
| Untouched current Standard key (`S1-`) | Valid, correct edition and actual expiry date | Passed, 2026-11-18: pasting the key also validated it and displayed the valid-until date. |
| Untouched current Domain key (`STD-`) with an eligible configured domain account | Valid, correct edition and actual expiry date | |
| Untouched expired genuine key with a matching account | Expired, not Invalid; renewal remains available | Passed with a Standard key, 2026-11-18. |
| Change only the readable expiry date before `;`, leaving encrypted text untouched | Invalid; the altered date does not grant or extend licensed access. Unlike the old behavior, a mismatch is now explicitly rejected | |
| Change only the readable email address | Email mismatch (`MailDifferent`), not Valid | |
| Change only a genuine Pro key's prefix from `ST-` to `S1-`, or a Standard key's prefix from `S1-` to `ST-` | Invalid; an edition cannot be changed by editing its readable prefix | |
| Change only the prefix to `QF-` | Invalid; a foreign product prefix is rejected even if the encrypted portion came from SmartTemplates | |
| Enter an actual QuickFolders key | Invalid; Settings shows its different-add-on explanation | |
| Change a character in the encrypted portion | Invalid, with a visible validation message | |
| Use an otherwise genuine key whose licensed account is not configured in the test profile | Licensed address not configured (`MailNotConfigured`), not Valid | Passed, 2026-11-17: missing-account warning displayed with Buy License action. |
| Restore the untouched valid key after a failure, then restart Thunderbird | Valid again; status, expiry and edition remain correct after restart, without stale errors | |

Prioritize acceptance of all three genuine license types, date tampering and the Pro/Standard prefix swap. Repeat the readable-date check with each edition when matching real test keys are available. If testing an existing supported alias-license setup, confirm it still validates without changing that setup.

## Sales flow and checkout

- [ ] Fresh Standard: Standard card hidden, Upgrade to Pro available. Near expiry, Standard extension becomes actionable; an expired Standard offers renewal. Near-expiry extension and expired renewal, plus both Pro upgrade destinations and referrers, passed on 2026-11-18; fresh Standard remains pending.
- [x] Valid and expired Pro: appropriate Extend License or Renew License action; Standard hidden. Both passed on 2026-11-18, including the shop destination and existing-key referrer.
- [x] Valid and expired Domain: Domain is highlighted and always says Renew License. Standard is hidden; Pro is an unhighlighted separate personal purchase with the coverage explanation. Both passed on 2026-11-18, including the renewal destination and existing-key referrer.
- [x] Domain Add users link opens the additional-seats product. Passed on 2026-11-18: opens `product/smarttemplate_domainseat` without a referrer.
- [ ] No license: Free edition badge and fresh purchase choices, without a previous license key passed as a renewal referrer.
- [ ] Open the relevant purchase, renewal and upgrade products without completing payment. Verify the selected product, contact prefill and existing-key referrer where applicable. Do not rely solely on prototype scenarios: their checkout is deliberately simulated.
- [ ] Include a Unicode name and an address containing `+` in a contact-prefill check. Switching accounts updates the contact fields correctly; manual edits survive switching between selection and terms.
- [ ] Registration → Enter license key returns to Settings → Licenses. After successful validation, reopen registration and confirm the new state.

## Messages, localization and layout

- [ ] Orange expiry badge appears in the intended pre-expiry period and is absent for a fresh one-year license and an expired license.
- [ ] Check both the invalid-key message plus email-mismatch warning and the longer wrong-add-on message. They wrap without overlapping the action button; when the action wraps below, it is centered. Messages use the full width when there is no action.
- [ ] Try a language with long labels and a CJK language at normal and narrow widths. Check headings, buttons, Domain warnings, the seats link, email help, localized dates and expanded license terms for wrapping and intact characters.
- [ ] Expanded terms distinguish new personal licenses, same-edition renewal/extension and Standard → Pro upgrades. New licenses and upgrades run from payment; remaining Standard time does not extend the one-year Pro upgrade period.
- [ ] Close/reopen the terms and email-help panel, including Escape and keyboard navigation. Contact entries are retained.
