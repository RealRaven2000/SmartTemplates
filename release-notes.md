The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.20) 

Important for Release channel users (**154 and later**): With Thunderbird's new 2-week release cycle, there is an elevated risk of unexpected breakages. While I regularly test SmartTemplates against daily builds, timely fixes depend on **early reporting** from Release users. Please follow the <a href='https://github.com/RealRaven2000/SmartTemplates/issues'>issue tracker</a> and report any regressions promptly to help maintain compatibility.

Additional regressions are expected within the Thunderbird release branch and will be addressed as they occur. Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes.

**Improvements**

- SmartTemplates is now compatible with Thunderbird 155.
- Moved settings storage from Thunderbird's global configuration database (`about:config`) to `storage.local` — #422. Going forward, add-ons should minimize their reliance on global preferences.

  *Note:* Uninstalling SmartTemplates now resets its settings to their defaults.
- To ensure compatibility with Thunderbird 155, URL-based scripts are now loaded using the script loader's `allowUnsafe` parameter — #421. According to [Bugzilla 1974213](https://bugzilla.mozilla.org/show_bug.cgi?id=1974213), add-on scripts can no longer be loaded using the standard `scriptloader.loadSubScript()` method in Thunderbird 155.
- Added various theme fixes to the settings tab, including corrections to category-menu items and other color adjustments.
- **Maintenance version 4.20.1** - v4.20 didn't load the correct Account Templates.
