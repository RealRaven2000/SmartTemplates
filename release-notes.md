The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.8.1) 

**Maintenance  Items 4.8.1**

*   Improved headline for Examples tab and added jump to support side.
*   New settings page: Fixed search highlighting and scrolling in variables tab. This also fixes weird scrollbar issues when expanding chapters. [issue #319]
*   Variables page now support dark mode.

**Enhancements in 4.8**

*   Improved icon designs for dark themes and clearer texts independent of installed fonts for icons with text. Removed font dependence in icons (converted all texts to path). [issue #310]
*   Added function to collapse all chapters in Variables page. \[issue #314\]
*   Implemented the command "configure menu items…" so to open the correct page in the new Settings dialog. \[issue #318\]
*   Implemented display settings for statusbar icon in new settings tab \[issue #313\]
*   Implemented search in Variables page on new settings page. Repeat search now with `F4` and `Shift`+`F4` \[issue #315\]
*   Completed Greek translations (provided by chat GPT)

**Bug Fixes in 4.8** 

*   Fixed: Template functions don't work when writing a new message in a newsgroup account. \[issue #311\]
*   Fixed: "expand all" inside new settings variables page \[issue #312\]

**Miscellaneous 4.8**

*   keyboard shortcut handler - Use `keydown` instead of deprecated `keypress` events.

**Resolved Issues**
* Thunderbird 128.2 fixed the verification of SmartTemplates licenses bound to an  exchange account when it is accessed using Owl. See also [issue #303] and [bug 1909005](https://bugzilla.mozilla.org/show_bug.cgi?id=1909005)