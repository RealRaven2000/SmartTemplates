The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.18.1) 

**Maintenance Release 4.18.1**

*   Compatibility with Thunderbird 150
*   Remove unnecessary Warning when changing Identity (often caused by Identity Chooser Add-on) [issue #415]
*   All menu Icons should reflect the main theme color [issue #416]

**Improvements**

*   Enhancement: Import external templates menus from other profile [issue #414]. When opening a smartTemplates.json file from another profile, which is typically stored in the profile/extensions subfolder,this will import the list from the selected editing mode (write / reply / forward or snippets). 

All imported menu items are moved to the top of the list in he order read from the file contents.

If the an entry exists with the same name / category, or with the same file path (within the current editing mode), then it will be replaced with the entry from the imported file. So this could also be used to reorganize or rename existing templates.
*   Enhancement: Import members of a Named Mailing List from template (using %header.set%) [issue #411].

Example: `%header.set(to,"list:listName")%` this will read all standard address books (not cardbook) and searches for lists named _listName_. Uses the primary email address of all members  of the list, so you can set to, cc or bcc.
*   Support relative file paths for `%attach()%` [issue #335]
*   Improvements for correcting "Lastname, Firstname" [issue #305]
*   Added documentation for setting priority to variables window. [issue #412]
*   Modernized icons of external template toolbar. 


**Miscellaneous**

*   removed Console chatter about Cardbook and any matched address book cards.

