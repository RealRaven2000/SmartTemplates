The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.21)

Important for Thunderbird Release channel users: With Thunderbird's new 2-week release cycle, there is an elevated risk of unexpected breakages. While I regularly test SmartTemplates against daily builds, timely fixes depend on **early reporting** from Release users. Please follow the <a href='https://github.com/RealRaven2000/SmartTemplates/issues'>issue tracker</a> and report any regressions promptly to help maintain compatibility.

Additional regressions are expected within the Thunderbird release branch and will be addressed as they occur. Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes.


**Enhancements**

- Download examples directly from the online snippet library. #437.
- Added smart snippets to the Composer right-click menu, with checkboxes in Settings to choose which appear. #432.
- Expanded the scopes of `deleteQuotedTags` and `replaceQuotedTags` with `head`, `body`, and `all` options to target the message head, entire body, or both. #436.
- Configure the external HTML editor in Advanced Settings. #430.
- Reorganized and updated variable help and translations. #435.


**Compatibility and documentation**

- Fixed intermittent missing compose context menus after inserting templates. #432.

- Added documentation for `%sig(none)%`. #434.

**Bug Fixes**

- Improved template and snippet list deletion with the Delete key and minimal scrolling.

- Fixed text box heights, rounded borders, section headings, and focused input colors in Settings, and corrected the news toolbar button hover background in Thunderbird 157. #431.

- Fixed template processing in Thunderbird 159 beta after removal of the legacy message-header lookup method; compatibility with Thunderbird 140 ESR is retained. #433.
