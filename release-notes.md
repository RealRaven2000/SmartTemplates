The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.20.2)

Important for Thunderbird Release channel users: With Thunderbird's new 2-week release cycle, there is an elevated risk of unexpected breakages. While I regularly test SmartTemplates against daily builds, timely fixes depend on **early reporting** from Release users. Please follow the <a href='https://github.com/RealRaven2000/SmartTemplates/issues'>issue tracker</a> and report any regressions promptly to help maintain compatibility.

Additional regressions are expected within the Thunderbird release branch and will be addressed as they occur. Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes.

**Maintenance version 4.20.2**

- Fixed address headers showing `??` in reply and forward quote headers. Missing or null preference defaults are repaired without resetting valid settings, and the original address header is preserved when both requested and default formatting are empty — #427.
- Fixed the Debug mode toggle after the settings storage migration and recovered its previously saved state — #422.
- Removed storage-context console logging that could cause a long freeze when opening a new message, reply or forward — #425.
- Improved account template imports by saving settings in sequence and synchronizing account preference changes with existing windows — #429.
- Handled empty template text safely when cleaning up line breaks.

**Previous changes in 4.20 and 4.20.1**

- Version 4.20 added compatibility with Thunderbird 155; version 4.20.1 extended support to Thunderbird 157.
- Moved settings storage from Thunderbird's global configuration database (`about:config`) to `storage.local` — #422. Going forward, add-ons should minimize their reliance on global preferences.

  *Note:* Uninstalling SmartTemplates now resets its settings to their defaults.
- To ensure compatibility with Thunderbird 155, URL-based scripts are now loaded using the script loader's `allowUnsafe` parameter — #421. According to [Bugzilla 1974213](https://bugzilla.mozilla.org/show_bug.cgi?id=1974213), add-on scripts can no longer be loaded using the standard `scriptloader.loadSubScript()` method in Thunderbird 155.
- Added various theme fixes to the settings tab, including corrections to category-menu items and other color adjustments.
- **Maintenance version 4.20.1** - Fixed account templates not loading correctly after updating to 4.20 — #423.
