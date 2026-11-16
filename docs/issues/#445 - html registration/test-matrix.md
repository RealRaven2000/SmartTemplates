# Registration checkout test matrix

Manual test plan for #445. Open **SmartTemplates → Test → New registration tab** with the starting license installed. Results below are expectations, not completed tests.

Use normal mode for real shop checks. URLs containing `scenario=` use synthetic data and never open checkout. `?intent=extend` in normal mode uses the actual license and explicitly reveals early Standard extension. Save your previous license before replacing it: validation saves the entered key, including an invalid one.

## Products to click

| ID | Starting license | Card/button to click | Expected shop route after `/quickfolders/` | Referrer | Result / notes |
| --- | --- | --- | --- | --- | --- |
| P01 | No license | Buy Standard | `product/smarttemplatestandard` | Originating feature, if supplied; otherwise absent | |
| P02 | No license | Buy Pro | `instant/smarttemplate4` | Originating feature, if supplied; otherwise absent | |
| P03 | No license | Buy Domain | `product/smarttemplate4domain` | Originating feature, if supplied; otherwise absent | |
| S01 | Valid Standard, fewer than 30 days left | Extend Standard | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S02 | Valid Standard, exactly 30 days left | Current edition | No checkout; Standard action disabled | None sent | |
| S03 | Valid Standard, more than 30 days left | Current edition | No checkout; Standard action disabled | None sent | |
| S04 | Valid Standard, 30+ days left; open with `?intent=extend` | Extend Standard | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S05 | Valid Standard, near expiry | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| S06 | Valid Standard, well before expiry | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| S07 | Expired Standard, recently expired | Renew Standard | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S08 | Expired Standard, long expired | Renew Standard | `instant/smarttemplateStdrenew` | Existing Standard key | |
| S09 | Expired Standard, recently expired | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| S10 | Expired Standard, long expired | Upgrade to Pro | `product/smarttemplateupgrade` | Existing Standard key | |
| R01 | Valid Pro, near expiry | Extend Pro | `instant/smarttemplate4renew` | Existing Pro key | |
| R02 | Valid Pro, well before expiry | Extend Pro | `instant/smarttemplate4renew` | Existing Pro key | |
| R03 | Expired Pro, recently expired | Renew Pro | `instant/smarttemplate4renew` | Existing Pro key | |
| R04 | Expired Pro, long expired | Renew Pro | `instant/smarttemplate4renew` | Existing Pro key | |
| D01 | Valid Domain | Extend Domain | `product/smarttemplatesdomainrenewal` | Existing Domain key | |
| D02 | Expired Domain, recently expired | Renew Domain | `product/smarttemplatesdomainrenewal` | Existing Domain key | |
| D03 | Expired Domain, long expired | Renew Domain | `product/smarttemplatesdomainrenewal` | Existing Domain key | |

For a short first pass, run P01–P03, S01, S05, S07, S09, R01, R03, and D01–D02. Then check long-expired licenses, the Standard 30-day boundary, and explicit early extension.

## License dates and pricing

These are shop/license-generator checks. Opening a product page alone does not prove the issued expiry date; record that separately when testing generated output.

| Action | Expected date rule | Result / notes |
| --- | --- | --- |
| Buy a new personal license | Full year from purchase | |
| Extend a valid Standard or Pro license | One year beyond the existing expiry date | |
| Renew an expired Standard or Pro license | Full year from purchase | |
| Upgrade valid Standard to Pro | Shop upgrade calculation, capped at one year after purchase | |
| Upgrade expired Standard to Pro | Same product and shop rule as valid Standard; capped at one year after purchase | |
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
| Valid or expired Domain | Standard and Pro cards hidden | |
| Invalid key, missing licensed account, or email mismatch | Show the corresponding state; offer fresh purchases without passing the invalid key | |
| No eligible identities | Permit manual contact entry; require a valid email before opening checkout | |
| Synthetic `scenario=` URL | Preview only, no external shop and no saved-key changes | |

Hidden downgrade cards and the early-extension prompt are current implementation behavior; record any desired policy adjustments separately from product-routing defects.
