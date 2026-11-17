While localization proceeds, these are the useful Thunderbird checks:
- Settings → Licenses: open registration using Buy, Upgrade, Extend, or Renew as available. Confirm the correct edition and action are highlighted.
- Notification bubbles: click their license action. It should open the modern registration page and leave the composer open.
- Premium feature/category-limit warnings: follow the registration action and confirm it opens the modern page.
- Installed/updated welcome pages: test their renewal, extension, upgrade, and promotional actions. The welcome page should close after registration opens successfully.
- Tab reuse: leave registration open, then trigger another entry point. It should reuse that tab and refresh its action/context.
- Emergency legacy menu: confirm Legacy License Registration still opens the old XHTML dialog.

Please specifically test Domain renewal: Domain should be highlighted, the button should say Renew License, and Pro should remain a secondary purchase option.

The automated routing tests pass; these checks cover Thunderbird’s actual window and tab behavior.