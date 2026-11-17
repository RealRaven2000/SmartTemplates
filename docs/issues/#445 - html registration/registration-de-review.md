# German registration wording review

German-first review pass, 2026-11-17. The live catalog is `_locales/de/messages.json`; this table is a review snapshot. Other UI locales have not been translated in this pass. Vietnamese retains its SPLASH scope and existing English shop fallback.

English payment-based terms and the separate Standard ? Pro upgrade rule are now implemented in the live registration page.

Unicode checks cover strict UTF-8 decoding, umlauts, ?, ellipses, en dashes, the ?? controls, rich-text formatting and placeholders. Thunderbird visual checks remain pending, particularly long German buttons, warning text, contact fields and the terms view.

| Entity (registration.) | English | German |
| --- | --- | --- |
| `title` | {+extensionName} · Your license | {+extensionName} · Ihre Lizenz |
| `brand` | {+extensionName} | {+extensionName} |
| `development` | Registration test | Registrierungstest |
| `eyebrow` | Your license | Ihre Lizenz |
| `heading` | Your style. Less effort. | Ihr Stil. Weniger Aufwand. |
| `subtitle` | Choose the right license for your workflow. | Wählen Sie die passende Lizenz für Ihre Arbeitsweise. |
| `enterKey` | Enter license key… | Lizenzschlüssel eingeben… |
| `options` | License options | Lizenzoptionen |
| `annual` | Annual licenses | Jahreslizenzen |
| `selection.intro` | Choose Standard for everyday email, Pro for all features, or Domain for your team. | Wählen Sie Standard für alltägliche E-Mails, Pro für alle Funktionen oder Domäne für Ihr Team. |
| `contact.heading` | Who is this license for? | Für wen ist diese Lizenz? |
| `account` | Mail account | E-Mail-Konto |
| `email` | Email address | E-Mail-Adresse |
| `email.help` | About licensed email addresses | Informationen zu lizenzierten E-Mail-Adressen |
| `email.hint` | Your personal license works across multiple devices. | Ihre persönliche Lizenz gilt auf mehreren Geräten. |
| `email.rules` | Licensed email address rules | Regeln zur lizenzierten E-Mail-Adresse |
| `email.help.heading` | Your email is your license | Ihre E-Mail-Adresse ist Ihre Lizenz |
| `email.help.close` | Close email help | E-Mail-Hilfe schließen |
| `email.personal.heading` | Standard and Pro licenses | Standard- und Pro-Lizenzen |
| `email.personal` | Your license is tied to this email address. You can use it on multiple devices. Configure this address as an account’s {bold}default identity{/bold} in Thunderbird on each device. | Ihre Lizenz ist an diese E-Mail-Adresse gebunden. Sie können sie auf mehreren Geräten verwenden. Richten Sie diese Adresse auf jedem Gerät in Thunderbird als {bold}Standardidentität{/bold} eines Kontos ein. |
| `learnMore` | Learn more… | Mehr erfahren… |
| `email.domain.heading` | Domain licenses | Domänenlizenzen |
| `email.domain` | Different rules apply: the configured email address must belong to the licensed domain. | Hier gelten andere Regeln: Die eingerichtete E-Mail-Adresse muss zur lizenzierten Domäne gehören. |
| `firstName` | First name | Vorname |
| `lastName` | Last name | Nachname |
| `contact.note` | These details will prefill checkout. You can edit them here. | Diese Angaben werden beim Kauf im Shop vorausgefüllt. Sie können sie hier bearbeiten. |
| `plan.standard.kicker` | Everyday essentials | Das Wichtigste für jeden Tag |
| `edition.standard` | Standard | Standard |
| `plan.standard.description` | Make everyday emails your own. | Geben Sie alltäglichen E-Mails Ihre persönliche Note. |
| `plan.standard.scope` | For your own email | Für Ihre eigenen E-Mails |
| `plan.pro.kicker` | All the features | Alle Funktionen |
| `edition.pro` | Pro | Pro |
| `plan.pro.description` | You put email to work. Save time every day. | Sie setzen E-Mails produktiv ein. Sparen Sie jeden Tag Zeit. |
| `plan.pro.scope` | For your own email | Für Ihre eigenen E-Mails |
| `plan.domain.kicker` | For your team | Für Ihr Team |
| `edition.domain` | Domain | Domäne |
| `plan.domain.description` | All features for your whole team, under one license. | Alle Funktionen für Ihr gesamtes Team, unter einer Lizenz. |
| `plan.domain.scope` | For a shared domain | Für eine gemeinsame Domäne |
| `renewal.hint` | Renewing or extending your license adds another year and typically costs less than buying a new license. | Die Erneuerung oder Verlängerung Ihrer Lizenz fügt ein weiteres Jahr hinzu und kostet in der Regel weniger als eine neue Lizenz. |
| `checkout.note` | Prices, tax, and available discounts are shown in the shop. | Preise, Steuern und verfügbare Rabatte werden im Shop angezeigt. |
| `terms.intro` | {+extensionName} has kept pace with Thunderbird since $1. {+extensionName} licenses fund ongoing development, new features, and compatibility updates. Each license lasts one year, helping support the work needed to keep pace with Thunderbird. | {+extensionName} hält seit $1 mit Thunderbird Schritt. Lizenzen für {+extensionName} finanzieren die laufende Entwicklung, neue Funktionen und Kompatibilitätsupdates. Jede Lizenz gilt ein Jahr und unterstützt die Arbeit, die nötig ist, um mit Thunderbird Schritt zu halten. |
| `terms.annual.heading` | One year at a time | Ein Jahr nach dem anderen |
| `terms.annual` | A license covers one year. Renew an expired license or extend a current one to continue with your chosen edition. | Eine Lizenz gilt ein Jahr. Erneuern Sie eine abgelaufene Lizenz oder verlängern Sie eine gültige, um Ihre gewählte Edition weiterzuverwenden. |
| `renewal.personal` | {bold}Personal licenses{/bold}{br}A new license runs for one year from payment. When renewing or extending the same edition, you receive a full year from payment or one year beyond your existing expiry date, whichever gives you more time. | {bold}Persönliche Lizenzen{/bold}{br}Eine neue Lizenz gilt ein Jahr ab Zahlung. Bei der Erneuerung oder Verlängerung derselben Edition erhalten Sie ein volles Jahr ab Zahlung oder ein Jahr über Ihr bisheriges Ablaufdatum hinaus – je nachdem, was Ihnen mehr Zeit gibt. |
| `renewal.upgrade` | {bold}Standard → Pro upgrades{/bold}{br}Your Pro license runs for one year from the upgrade payment date. Remaining time on your Standard license does not extend that period. | {bold}Upgrades von Standard auf Pro{/bold}{br}Ihre Pro-Lizenz gilt ein Jahr ab Zahlung des Upgrades. Verbleibende Zeit Ihrer Standard-Lizenz verlängert diesen Zeitraum nicht. |
| `renewal.domain` | {bold}Domain licenses{/bold}{br}Renewal normally adds one year to the previous expiry date, including when ordering or payment is late. | {bold}Domänenlizenzen{/bold}{br}Eine Erneuerung fügt normalerweise ein Jahr zum bisherigen Ablaufdatum hinzu, auch bei verspäteter Bestellung oder Zahlung. |
| `renewal.previous` | {bold}Existing license{/bold}{br}Your current license is passed to the shop so the new expiry date can be calculated. | {bold}Bestehende Lizenz{/bold}{br}Ihre aktuelle Lizenz wird an den Shop übergeben, damit das neue Ablaufdatum berechnet werden kann. |
| `terms.manualRenewal` | Licenses {bold}do not renew automatically{/bold}. {+extensionName} will remind you before your license expires. | Lizenzen werden {bold}nicht automatisch erneuert{/bold}. {+extensionName} erinnert Sie vor Ablauf Ihrer Lizenz. |
| `terms.savings` | {bold}Start with Pro, then save on future years.{/bold} Renewing or extending your Pro license costs substantially less than buying a new one. | {bold}Starten Sie mit Pro und sparen Sie in den Folgejahren.{/bold} Die Erneuerung oder Verlängerung Ihrer Pro-Lizenz kostet deutlich weniger als eine neue Lizenz. |
| `terms.support` | Your support helps fund development, compatibility updates, and repairs. | Ihre Unterstützung hilft, Entwicklung, Kompatibilitätsupdates und Fehlerbehebungen zu finanzieren. |
| `terms.email.heading` | Your email, your license | Ihre E-Mail-Adresse, Ihre Lizenz |
| `terms.email` | A personal license is tied to your email address. You can use it on multiple Thunderbird installations when the licensed address is configured as the {bold}default identity{/bold} of an account in each installation. | Eine persönliche Lizenz ist an Ihre E-Mail-Adresse gebunden. Sie können sie in mehreren Thunderbird-Installationen verwenden, wenn die lizenzierte Adresse in jeder Installation als {bold}Standardidentität{/bold} eines Kontos eingerichtet ist. |
| `terms.otherAccounts` | The licensed features also work with all your other email accounts in Thunderbird. No separate licenses needed. | Die lizenzierten Funktionen stehen auch allen Ihren anderen E-Mail-Konten in Thunderbird zur Verfügung. Dafür sind keine separaten Lizenzen nötig. |
| `terms.domain` | A Domain license covers users with matching addresses under the licensed domain. | Eine Domänenlizenz gilt für Benutzer mit passenden Adressen innerhalb der lizenzierten Domäne. |
| `terms.edition.heading` | Choose your edition | Wählen Sie Ihre Edition |
| `terms.edition` | Standard and Pro offer different levels of functionality. Compare the editions to find the right fit. | Standard und Pro bieten unterschiedliche Funktionsumfänge. Vergleichen Sie die Editionen, um die passende zu finden. |
| `compare` | Compare Standard and Pro | Standard und Pro vergleichen |
| `terms.checkout.heading` | Checkout in your browser | Kauf in Ihrem Browser |
| `terms.checkout` | Select a license to continue to the shop. Your price depends on the edition, country, tax, and any applicable discounts. | Wählen Sie eine Lizenz, um zum Shop zu gelangen. Der Preis hängt von Edition, Land, Steuern und möglichen Rabatten ab. |
| `terms.referrer` | Renewals and upgrades pass your previous license to the shop for eligibility checks. | Bei Erneuerungen und Upgrades wird Ihre bisherige Lizenz zur Prüfung Ihrer Berechtigung an den Shop übergeben. |
| `terms.draft` | Draft terms: detailed trial and post-expiry feature behavior will be reviewed before release. | Vorläufige Lizenzbedingungen: Einzelheiten zur Testphase und zum Funktionsumfang nach Lizenzablauf werden vor der Veröffentlichung geprüft. |
| `footer` | Made for Thunderbird. Supported by you. | Für Thunderbird gemacht. Von Ihnen unterstützt. |
| `test.note` | Checkout opens in your browser. | Der Shop öffnet sich in Ihrem Browser. |
| `selection.label` | License selection | Lizenzauswahl |
| `selection.heading` | A year of easier email. | Ein Jahr lang einfacher mailen. |
| `terms.label` | License terms | Lizenzbedingungen |
| `terms.heading` | How your license works. | So funktioniert Ihre Lizenz. |
| `terms.show` | Show license terms 🡇 | Lizenzbedingungen anzeigen 🡇 |
| `terms.hide` | 🡇 Continue to License Selection 🡇 | 🡇 Weiter zur Lizenzauswahl 🡇 |
| `showLess` | Show less | Weniger anzeigen |
| `status.Valid` | Valid | Gültig |
| `status.Expired` | Expired | Abgelaufen |
| `status.Empty` | Free edition | Gratisversion |
| `status.Invalid` | Invalid license | Ungültige Lizenz |
| `status.NotValidated` | Not validated | Nicht geprüft |
| `status.MailNotConfigured` | Licensed address not configured | Lizenzierte Adresse nicht eingerichtet |
| `status.MailDifferent` | License email mismatch | Lizenz-E-Mail stimmt nicht überein |
| `status.Unknown` | License unavailable | Lizenz nicht verfügbar |
| `license.none` | No license configured | Keine Lizenz eingerichtet |
| `license.edition` | $1 license | $1-Lizenz |
| `date.valid` | Your license is valid until $1. | Ihre Lizenz ist gültig bis $1. |
| `date.expired` | Your license expired on $1. | Ihre Lizenz ist am $1 abgelaufen. |
| `date.none` | Choose a license below or enter your existing key. | Wählen Sie unten eine Lizenz oder geben Sie Ihren vorhandenen Schlüssel ein. |
| `action.buy` | Buy $1 | $1 kaufen |
| `action.renew` | Renew License | Lizenz erneuern |
| `action.extend` | Extend License | Lizenz verlängern |
| `action.upgrade` | Upgrade to Pro | Upgrade auf Pro |
| `action.current` | Current edition | Aktuelle Edition |
| `identity.none` | No eligible mail accounts found. You can enter your contact details manually. | Keine geeigneten E-Mail-Konten gefunden. Sie können Ihre Kontaktdaten manuell eingeben. |
| `identity.empty` | Enter details manually | Angaben manuell eingeben |
| `load.error` | Unable to load your license or accounts. Reload this tab to try again. | Ihre Lizenz oder Konten konnten nicht geladen werden. Laden Sie diesen Tab neu, um es erneut zu versuchen. |
| `checkout.preview` | Test preview: $1 for $2. No shop was opened. | Testvorschau: $1 für $2. Es wurde kein Shop geöffnet. |
| `checkout.unconfirmed` | This upgrade route needs confirmation before checkout can be enabled. No shop was opened. | Dieser Upgrade-Kaufweg muss bestätigt werden, bevor der Kauf freigeschaltet werden kann. Es wurde kein Shop geöffnet. |
| `test.menu` | Registration to Web Shop | Registrierung zum Webshop |
| `fixture.checkoutNote` | Synthetic data: checkout opens a preview only. | Beispieldaten: Beim Kauf wird nur eine Vorschau geöffnet. |
| `checkout.opened` | The shop has opened in your browser. You can keep this tab open. | Der Shop wurde in Ihrem Browser geöffnet. Sie können diesen Tab geöffnet lassen. |
| `checkout.error` | Unable to open the shop. Please try again. | Der Shop konnte nicht geöffnet werden. Bitte versuchen Sie es erneut. |
| `settings.error` | Unable to open license settings. Please try again. | Die Lizenzeinstellungen konnten nicht geöffnet werden. Bitte versuchen Sie es erneut. |
| `checkout.guidance` | {bold}To keep your renewal or upgrade benefits, continue with the product opened from this page.{/bold} For choosing a {i}different license{/i}, simply start from here again. | {bold}Um Ihre Erneuerungs- oder Upgrade-Vorteile zu behalten, fahren Sie mit dem von dieser Seite aus geöffneten Produkt fort.{/bold} Wenn Sie eine {i}andere Lizenz{/i} wählen möchten, beginnen Sie einfach wieder hier. |
| `renewal.entitlements` | Renewal and upgrade benefits depend on license information passed to the shop. Switching products in the shop or security software removing that information can prevent the shop from applying your existing entitlement. | Erneuerungs- und Upgrade-Vorteile hängen von den Lizenzinformationen ab, die an den Shop übergeben werden. Wenn Sie im Shop das Produkt wechseln oder Sicherheitssoftware diese Informationen entfernt, kann der Shop Ihre bestehende Berechtigung möglicherweise nicht berücksichtigen. |
| `checkout.dismiss` | Dismiss checkout notice | Kaufhinweis schließen |
| `terms.back` | License selection | Lizenzauswahl |
| `navigation` | License navigation | Lizenznavigation |
| `domain.proWarning` | Pro is a separate personal license, not a Domain renewal. Your Domain license covers you on installations with a mail account using your registered company domain, within your purchased seats. A separate Pro license can cover a home installation where you cannot use that account. To continue your team's coverage, choose Renew License in the Domain panel. | Pro ist eine separate persönliche Lizenz, keine Erneuerung Ihrer Domänenlizenz. Ihre Domänenlizenz gilt im Rahmen der erworbenen Plätze auf Installationen mit einem E-Mail-Konto Ihrer registrierten Firmendomäne. Eine separate Pro-Lizenz kann eine Installation zu Hause abdecken, auf der Sie dieses Konto nicht verwenden können. Wählen Sie im Bereich Domäne „Lizenz erneuern“, um Ihr Team weiter abzudecken. |
| `domain.seatsLink` | Add users | Weitere Benutzer hinzufügen |
| `domain.seatsNote` | to your existing Domain license. | – für Ihre bestehende Domänenlizenz. |
| `domain.seatsQuestion` | Need more seats? | Benötigen Sie mehr Plätze? |
| `license.domain` | Domain license | Domänenlizenz |
| `action.buyDomain` | Buy Domain License | Domänenlizenz erwerben |
