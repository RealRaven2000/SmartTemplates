The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.11) 

**Enhancements**

*   Enhancement: Make Settings dialog more accessible (keyboard / screenreader friendly) [issue #361]
*   New `%dateformat.current()%` [issue #356]
*   Sandbox enhancements: Added more contextual parameters for sandbox: "$priority", "$cc", "$bcc"; avoid wrapping variables when called from Sandbox script.
*   Sandbox Script: new functions `composer_composeCase()` and `composer_composeType()`. [issue #357]
*   Set Fallback charset setting to UTF-8 to avoid mojibake (garbled text). [issue #338]

**Bug Fixes**

**Miscellaneous**

*   Made SmartTemplates compatible with Tb 136.*
*   Thunderbird 136 retires ChromeUtils.import - replace with importESModule [issue #358]
