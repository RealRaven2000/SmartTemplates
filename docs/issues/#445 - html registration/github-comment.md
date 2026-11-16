A first standalone HTML prototype is ready for review. It uses an **expired Standard license** as sample data and leaves the existing registration dialog and its functions untouched.

- **HTML prototype:** [Open interactive preview](https://smarttemplates.quickfolders.org/staging/registration/) · [View source](https://github.com/RealRaven2000/SmartTemplates/blob/ad75608a003bd7c1fb94bd55fc909bef0e7df3ed/docs/issues/%23445%20-%20html%20registration/prototype.html). Responsive layout, three license cards, editable sample account details, email-license help, and switching between license selection and terms. Light mode is forced for now; checkout is disabled.
- [Business logic and Mermaid diagrams](https://github.com/RealRaven2000/SmartTemplates/blob/ad75608a003bd7c1fb94bd55fc909bef0e7df3ed/docs/issues/%23445%20-%20html%20registration/business-logic.md): licensing flows, caption states, referrer handling, current-code discrepancies, and questions still to resolve.
- [Active shop products](https://github.com/RealRaven2000/SmartTemplates/blob/ad75608a003bd7c1fb94bd55fc909bef0e7df3ed/docs/issues/%23445%20-%20html%20registration/license-products.md): existing FastSpring product inventory.
- [Localization audit](https://github.com/RealRaven2000/SmartTemplates/blob/ad75608a003bd7c1fb94bd55fc909bef0e7df3ed/docs/issues/%23445%20-%20html%20registration/localization-audit.md): registration-string coverage, locale scopes, and intentional English fallback considerations.

**To try the UI:** use the interactive preview above. For local testing, download or check out the repository and open `docs/issues/#445 - html registration/prototype.html` in a browser or VS Code HTML preview. Keep its sibling CSS/JS files and the repository's icon assets in place. The GitHub source link displays code rather than running the page.

The terms copy is provisional, especially around premium features, trial restrictions, and behavior after expiry. These need review against each add-on's current behavior. SmartTemplates and QuickFolders have Standard, Pro, and Domain editions; quickFilters has Pro and Domain only.

Feedback is welcome on the layout, the two-view interaction, and clarity of the license explanations. A Thunderbird tab is the current direction under consideration; integration will follow separately after UI and business-rule review.
