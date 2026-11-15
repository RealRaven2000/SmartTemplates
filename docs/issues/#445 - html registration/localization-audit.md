# Registration localization audit

Snapshot: 2026-11-15. Read all 23 `_locales/*/messages.json` catalogs directly as UTF-8 and inspected `_l10nstatus.message` before assessing coverage. No catalogs were changed.

The audit covers 39 unique keys: the `__MSG_*__` references in `register.xhtml`, literal `getBundleString()` calls in `smartTemplate-register-dlg.js`, and the two dynamically selected `licenseTerms.show` / `licenseTerms.hide` keys. This measures present, nonempty entries, not translation accuracy or whether the wording matches current licensing behavior.

## Missing entries

| Locale | Declared scope | Missing registration keys |
| --- | --- | --- |
| de | SPLASH+UI | `email.label` |
| es | SPLASH+UI | `pricing.title`, `pricing.section`, `pricing.section.hint` |
| fr | SPLASH+UI | `pricing.title`, `pricing.section`, `pricing.section.hint` |
| it | SPLASH+UI | `email.label`, `pricing.title`, `pricing.section`, `pricing.section.hint` |
| ja | SPLASH+UI | `pricing.title`, `pricing.section`, `pricing.section.hint` |
| id_ID | UI | `buyPremiumLicense.button`, `buyPremiumLicense.instruct`, `buyStandardLicense.button`, `buyStandardLicense.instruct`, `email.label`, `licenseComparison`, `notification.premium.btn.upgrade`, `pricing.title`, `pricing.section`, `pricing.section.hint`, `testDriveS` |
| vi | SPLASH | 38 of 39 keys absent; only `updates.title` is present |

All 39 entries are present in `ca`, `cs`, `el`, `en`, `fi`, `nl`, `pl`, `pt`, `pt_BR`, `ru`, `sl`, `sr`, `sv`, `uk`, `zh_CN`, and `zh_TW`. Of these, `uk` declares `UI`; the others declare `SPLASH+UI`.

Non-English values identical to English are limited to `email.label` in `el` and `uk`, and `updates.title` in `nl`. Identical text can be legitimate (for example, “Updates” in Dutch); this is not evidence of an untranslated entry by itself. Other translations may still be stale or inaccurate despite differing from English.

## Scope and follow-up

Maintainer context: the English fallback for the Vietnamese shop UI may have been an intentional, pragmatic choice rather than unfinished translation. The historical rationale is uncertain; the maintainer also recalls concerns about supporting an Indonesian shop flow. These are distinct locales (`vi` and `id_ID`), so do not infer that they had the same decision or change either scope without review.

FastSpring supports only a limited set of checkout languages, according to the maintainer. A translated add-on registration page does not imply that checkout supports the same language. Keep three decisions separate: the locale's general add-on translation scope, whether its registration/shop introduction is translated or intentionally falls back to English, and the checkout languages FastSpring actually offers. The current supported FastSpring language list has not been verified here. Do not promise a matching checkout language or force one based solely on the add-on locale.

- Preserve each locale's scope and existing translations. `UI` is an actual declared value in this repository and should not be silently treated as `SPLASH`.
- Vietnamese's `SPLASH` scope means missing general feature UI entries are not a blanket completeness failure. The replacement must support default-English fallback. Do not bulk-fill feature UI keys to make counts match.
- Licensing and onboarding explanations remain relevant to all locales, including `SPLASH`. Review which registration/terms messages belong to this content after its behavior and wording are settled, while preserving any intentional English shop fallback. A shop-specific fallback is not a reason to skip unrelated licensing, onboarding, news, or release translations.
- For locales receiving UI localization, the missing entries above are concrete coverage gaps. Preserve prefix-free reusable keys when filling them later.
- Review the English licensing claims against each add-on's actual behavior first, then propagate approved wording to applicable locales. Presence of a translation does not establish that its premium-feature or post-expiry claims are current.
- Verify fallback, placeholders, parser markup, and layout in the HTML implementation. The current audit does not verify runtime fallback or render every language.
