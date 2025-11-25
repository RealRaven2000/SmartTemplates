The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.16) 


Some users may have seen a false incompatibility warning after updating from Thunderbird to v142. This was caused by cached compatibility information in Thunderbird, which sometimes fails to refresh correctly. The previous version of SmartTemplates was already fully compatible with 142. 

I raised a bug with Thunderbird to fix this: [Bugzilla 1986027](https://bugzilla.mozilla.org/show_bug.cgi?id=1986027), please add your observations there if you experienced this problem.


**Improvements**

*   4.16.4: Improved date variables — Fixed unreliable creation of month and weekday names in localized formats.
    - use date directly instead of calculating numeral values and converting to text again
    - converted μs based calculation to ms
    - removed remaining hard coded day / month names (long & shortened forms) from language files
*   4.16.3 - Fixed broken editing function in settings [issue #404]
*   4.16.2 - Fixed a regression with the wrong day name being calculated from the email date.[issue #403]
*   4.16.1 -  Improved inserting, updating and reordering template menu entries. Drag and drop is now much more reliable and new items are inserted below the currently selected item.
*   4.16 – made SmartTemplates compatible with Thunderbird 146.
*   Added new options to prevent duplicate `<style>` elements when merging into `<head>` [issue #399]
*   Clarified tooltips for loading and saving account templates: "Save templates (write, reply, forward) for $identity$…"
*   The news label when an update to SmartTemplates is downloaded is now disabled by default.
**Bug Fixes**

*   Brought back the status bar button which was missing in Thunderbird release (Tb 142+) [issue #401]

**Codebase Improvements**

*   Removed calendar string bundling and chrome/content/locale [issue #400]
*   Use API method (`browser.management.get`) instead of `AddonManager.getAddonByID` to check for Cardbook installation
*   Removed `createBundle` for retrieving forward / reply quote headers
