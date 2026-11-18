# Registration tab development

Open **SmartTemplates → Test → New registration tab** after loading the updated add-on. Settings → Licenses purchase/renew/extend buttons also open this tab and close Settings only after registration opens successfully. Clicking the Standard license date passes explicit early-extension intent. Other existing registration entry points still open the original XHTML dialog.

Use the [manual checkout test matrix](../../docs/issues/%23445%20-%20html%20registration/test-matrix.md) to record starting licenses, product clicks, and shop results.

The branding image reuses `../../chrome/content/skin/icon128x128.png` rather than duplicating it here. Once the legacy XHTML references become obsolete, consider moving this and other shared icons into a common asset directory outside `chrome/`, updating remaining consumers together. The separately hosted staging preview still needs its own asset copy.

Choosing **Enter license key…** opens/reuses Settings in `licenseKey` mode, then closes the registration tab after a successful open. If Settings cannot open, registration remains available. This mirrors the Settings-to-registration handoff and avoids leaving both tabs open during key entry.

The new tab reads the current license through the existing `getLicenseInfo` runtime request, and reads accounts/default identities through the standard MailExtension APIs. The existing secondary-identity preference is read through the explicit LegacyPrefs API. Contact fields remain editable and retain edits when switching views or refreshing license status.

**Normal mode opens real checkout in the default browser.** Purchases use the existing product routes, with editable contact details and the previous license key for renewals, extensions, and eligible upgrades. The registration tab stays open, and errors allow retrying without losing contact edits. Personal-license holders can buy Domain through the new Domain purchase product, whether their personal license is valid or expired; this is a new purchase, not a Domain renewal. Valid and expired Standard licenses both use the existing Standard-to-Pro upgrade product, matching the original dialog. Synthetic scenarios remain preview-only and never send their test keys to the shop. Enter license key opens the existing Settings license tab and focuses its key field. Registration does not duplicate validation or save keys; returning to the registration tab refreshes the displayed license.

For synthetic scenarios, append one of these query strings to the extension page URL:

- `?scenario=expired-standard` matches the reviewed prototype.
- `?scenario=valid-standard` shows the current Standard edition and Pro upgrade.
- `?scenario=valid-standard&intent=extend` exposes early Standard extension.
- `?scenario=valid-pro` or `?scenario=expired-pro` shows Pro extension/renewal.
- `?scenario=valid-domain` or `?scenario=expired-domain` shows Domain extension/renewal.
- `?scenario=no-license` shows new purchases.
- `?scenario=no-identities` permits manual contact entry without an eligible identity.

Synthetic identities include a Unicode, multipart name. Name splitting retains the legacy first/last-token convention; users can correct it in the form. Normal mode refreshes license/account state when the tab regains focus, preserving contact edits. The personal-license extension prompt uses the registration dialog's strict 30-day boundary; `intent=extend` bypasses the prompt window.

All new page entities live under `registration.*` in the English catalog only. Descriptions identify source entities from the old dialog. Other locales use Thunderbird's English fallback until reviewed translations are added. Runtime metadata in `config.mjs` provides the first-publication date; `{+extensionName}` resolves the existing name entity. Cross-add-on transfer must adjust edition availability, introductory edition copy, routes, metadata, and licensing rules.

Static content and accessibility attributes use the normal `__MSG_registration.*__` placeholders and `../i18n.js`. Dedicated `.localized-markup` text leaves are then passed through the shared formatter; dynamic labels/dates and the release-year substitution use `getMessage()`. `data-l10n-id` is documentation only and names the corresponding legacy entity, not the new entity to render. Keep these hints and catalog descriptions as a migration inventory for the other add-ons. A legacy ID is only a retirement candidate: search all consumers, including Settings, before deleting it.

`../localized-format.js` contains the formatter extracted from `popup/popup.js`, shared with the popup/update/settings/message pages. It keeps the established custom markup syntax and nested substitutions, without automatic italics. Localize dedicated text spans rather than replacing form controls or links. No legacy registration scripts are loaded.

For standalone text leaves, `.localizedFormatting` opts into Markdown-style `**bold**`, `*italic*`, and ` `inline code` ` formatting. Keep complete sentences together in each translated message. Use this class separately from `.localized-markup`.

Validation: `node --test tests/registration.test.mjs` from the repository root. Lint uses the repository's legacy ESLint configuration (`ESLINT_USE_FLAT_CONFIG=false` with ESLint 9).
