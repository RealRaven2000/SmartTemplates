The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.8) 

**Enhancements**

*   Improved icon layout for dark themes and removed font dependencies for icons with text. [issue #310]
*   Added function to collapse all chapters in Variables page. \[issue #314\]
*   Implemented the command "configure menu items…" so to open the correct page in the new Settings dialog. \[issue #318\]
*   Implemented display settings for statusbar icon in new settings tab \[issue #313\]

**Bug Fixes** 

*   Fixed: Template functions don't work when writing a new message in a newsgroup account. \[issue #311\]
*   Fixed: "expand all" inside new settings variables page \[issue #312\]

**Miscellaneous**

*   keyboard shortcut handler - Use `keydown` instead of deprecated `keypress` events.

**Known Issues**
* Currently the verification of SmartTemplates licenses fails when the license is bound to an  exchange account when it is accessed using Owl. This is due to a bug in the <a href="https://webextension-api.thunderbird.net/en/128-esr-mv2/accounts.html#accounts-api">extensions.accounts</a> Webextensions API - which doesn't include them when using <tt>accounts.list()</tt> - which the Thunderbird team is working on and is planned to land in one of the next   versions of ESR128. [issue #303]
