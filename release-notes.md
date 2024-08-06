The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.7) 

**Enhancements**

*   Added Refresh button for accounts dropdown. \[issue #307\]
*   Improved Chinese translations for term "account" - thanks to Y.D.X. \[issue #302\]

**Bug Fixes** 

*  New Settings dialog: In Account Templates one could not create Account settings for any new identity. The API used to write legacy settings to the global configuration database wasn't able to create any entries without default, which affects any Identities created by the user, including the default identity of a new mail account. This problem is now patched and back to work as expected. \[issue #300\]
*   Fixed: Clicking on Hide Button Label in header area button menu didn't work as expected. \[issue #304\]
*   in Tb128 - popup for restricted features: notification leads to exception + icon not displayed. \[issue #308\]

**Miscellaneous**

*   Removed vendor prefix from `-moz-appearance`
*   Reply with template from tab displays "cmd\_reply not available in this context". \[issue #309\]

**Known Issues**
* Owl accounts can currently not be license validated in Tb128. We are currently await a fix by Thunderbird core.
