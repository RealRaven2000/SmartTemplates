# Composer notification localization

Completed on 2026-11-17 after German testing exposed English fallback text beside licensed features.

The shared bubble serves both #441 (licensing, trials and feature-use allowances) and #442 (template-processing issues and issue actions). The screenshot's feature-description sentence belongs to licensing; the Issue row, per-issue Dismiss action and Copy template source belong to template diagnostics. Existing localized parser diagnostics remain in use.

All 26 `notification.compose.*` entities are present in every `SPLASH+UI` and `UI` locale, including German, Indonesian and Ukrainian. The remaining 20 UI locales each received the same 13 missing messages already added for German: exhausted allowances, blocked-feature messages, expand/collapse and dismissal labels, daily counting explanations, feature descriptions and remaining uses. Three additional Indonesian gaps were filled: licensing help, the Pro upgrade action and remaining trial days. A subsequent screenshot exposed the hardcoded “licence” badge; it now uses `notification.compose.license`, translated in all 23 catalogs, including Vietnamese licensing content.

Vietnamese retains `SPLASH` scope. Licensing/onboarding text is translated, including allowance explanations, licensed-feature descriptions and purchase/renewal/upgrade actions. General composer/error UI remains on default-English fallback: blocked summary and unresolved-variable warning, expand/collapse, notification dismissal, copying template source, Issue/Template issues and per-issue dismissal. No general feature-UI entities were added to this locale. Registration/shop UI retains its separate documented English fallback.

Related visible licensing action labels, the comparison action, licensing help and trial-day message were checked across all catalogs. Legacy keyboard access-key entities may continue to inherit their default values; these are not displayed labels in the modern bubble.

Translations were written directly as UTF-8, preserving all pre-existing catalog values and metadata. New entries were inserted alphabetically; an existing Vietnamese allowance explanation was moved into its alphabetical position. Unrelated catalog formatting and order were retained. Automated checks validate strict UTF-8, absence of replacement characters and duplicate keys, scope-aware completeness, substitutions, rich-text tokens and composer entity order. Thunderbird layout, keyboard navigation and native-speaker review remain manual checks.

Run `node --test tests/notification-localization.test.mjs` for catalog validation. The #441 and #442 functional suites remain separate from localization checks.

## Manual German review

On 2026-11-17 the maintainer tested the bubble with a Standard license and without a license, reporting that all displayed strings were translated. This confirms the notification body and actions in those cases. The remaining English “licence” badge was identified in the screenshot and localized afterward. A follow-up screenshot confirmed the German badge, Lizenz, is fixed and displays correctly. Other languages and notification states remain pending manual review.
