# Registration localization audit

## Remaining locales completed, 2026-11-17

All 110 `registration.*` entities are now translated in the 20 remaining UI locales: Catalan, Czech, Greek, Spanish, Finnish, French, Indonesian, Italian, Japanese, Dutch, Polish, Portuguese, Brazilian Portuguese, Russian, Slovenian, Serbian, Swedish, Ukrainian, Simplified Chinese and Traditional Chinese. Together with the approved English and German catalogs, 22 locales have complete registration coverage. The English and German catalogs were not edited during this pass.

Vietnamese retains its documented default-English registration/shop UI fallback and has no new registration entities. Its existing licensing/onboarding translations remain intact. The Registration and Settings section of `whats-new-list` is translated in all 21 remaining non-English/German locales, including Vietnamese, in the same position and with the same issue references as the approved source.

New registration entries are alphabetically ordered. Existing entries outside registration retain their order, formatting, metadata and values, apart from the added release-news section. The previously translated registration menu is preserved; Renew/Extend action translations are harmonized with the new terms and Domain warnings, distinguishing an extension of time from an expansion of functionality. UTF-8 is read and written directly, with placeholders, substitution definitions, rich-text tokens and parser issue references preserved.

Automated checks now cover every catalog's scope, registration completeness, registration entity order, strict UTF-8, replacement characters, substitutions, rich-text tokens and release-news section/issue order. These are structural checks, not a substitute for native-speaker review. Thunderbird visual review remains pending, particularly long buttons and headings, two-line slogans, Domain warnings and seats links, expanded terms, email help, localized dates and narrow-window wrapping. Checkout language remains independent of add-on localization.

## German-first review pass, 2026-11-17

The maintainer requested German first for wording and Unicode review before propagation to other locales. `_locales/de/messages.json` now translates all 109 current `registration.*` entities, including explicit Domain purchase and license-summary labels. German uses Domäne/Domänenlizenz and the purchase button Domänenlizenz erwerben. The English source and live terms also include the approved payment-based personal-license rules and separate Standard → Pro upgrade rule: upgrades run for one year from payment without adding remaining Standard time.

See [German wording review](registration-de-review.md) for the English/German comparison. The live locale catalog is authoritative; the table is a review snapshot. Existing non-registration German entities, locale scope, placeholders and parser formatting are preserved. No other locale was expanded in this pass. `UI` locales remain eligible for later UI translation; Vietnamese retains its established `SPLASH` scope and shop fallback.

Automated checks cover complete German registration keys, strict UTF-8 decoding, absence of replacement characters, matching substitution and rich-text tokens, add-on-name expansion, umlauts, ß, ellipses, en dashes and the 🡇 controls. Visual checks in Thunderbird remain pending: headings and long purchase buttons, Domain warnings and seats links, the email-help popup, expanded terms, checkout notices, narrow layouts and locale-formatted dates. Translating the add-on page does not select or promise a German shop checkout.

## Initial implementation

Registration now uses the established `__MSG_entity__` mechanism through `html/i18n.js` for static text and attributes, followed by shared formatting of dedicated rich-text leaves. Runtime code does not read `data-l10n-id`: retained attributes identify legacy source entities solely as cleanup/transfer hints. They do not prove an entity is unused; Settings and other remaining consumers must be checked before removal.

The independent page now lives under `html/registration/`. All its entities use `registration.*`, in `_locales/en/messages.json` only, per the maintainer's subsequent implementation decision. Where existing dialog wording was adapted, the entity's `description` records the original ID. This supersedes reuse of the original keys for the new page; the standalone prototype annotations below remain the source inventory. Legacy catalog entities and the original dialog are unchanged. English fallback supplies the new page until translations are reviewed. The existing formatter is shared through `html/localized-format.js`, with explicit formatting only.

## Prototype implementation annotations

The prototype's `data-l10n-id` attributes identify existing English `messages.json` entities to reuse or revise during implementation. They are planning annotations, not active localization bindings or a claim that the current translations already match the draft. Unmarked new copy needs new entities. Preserve nested inputs, links, icons, emphasis, and dynamic dates when implementing localization; do not replace an annotated element's entire contents blindly. The terms toggle switches its annotation between `licenseTerms.show` and `licenseTerms.hide` with its text.

Replace literal SmartTemplates references in reusable localized copy with the `{+extensionName}` placeholder during implementation, supplying the current add-on name. Keep the rendered name in the standalone prototype for readability. This allows shared wording to be reused in quickFilters and QuickFolders; edition names, feature claims, licensing rules, and comparison URLs still need add-on-specific review. For `buyPremiumLicense.instruct`, translate “put email to work” by meaning (making email more useful and productive), rather than literally.

The terms introduction revises `licenseTypes`; the highlighted personal-license paragraph separates `yearlyLicense.usageTerm` (multiple clients and the licensed account identity) from `yearlyLicense.usageTerm1` (other email accounts need no separate license). The inline renewal hint revises `notification.premium.btn.extendLicense.tooltip` as visible contextual help. Button mappings identify the existing action entity even where the draft label adds an edition name or uses “Explore” instead of “Buy”. New slogans and the new Pro savings paragraph remain unmarked because they have no direct existing entity.

The terms introduction now opens with “SmartTemplates has kept pace with Thunderbird since 2011.” This connects paid licensing to sustained compatibility work. During implementation, supply the add-on name through `{+extensionName}` and the first-release year through a substitution sourced from shared add-on metadata, not a date translators maintain in `messages.json`. SmartTemplates was first officially published on 2011-08-09 as version 0.7.4, verified by the maintainer. The maintainer reports 139 versions released as of 2026-11-16; this is a dated snapshot, not an automatically maintained count. Use 2011-08-09 for its first-release metadata and establish each other add-on's own date independently. Prefer “since {year}” to a calculated age so the statement stays current without anniversary calculations. No runtime metadata or catalogs are changed by this standalone preview.

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
