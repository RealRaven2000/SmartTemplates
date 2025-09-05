The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.14) 


Some users may have seen a false incompatibility warning after updating from Thunderbird to v142. This was caused by cached compatibility information in Thunderbird, which sometimes fails to refresh correctly. The previous version of SmartTemplates was already fully compatible with 142. 

I raised a bug with Thunderbird to fix this: <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1986027">[Bugzilla 1986027]</a>, please add your observations there if you experienced this problem.

**Improvements**
*   Fixed `{{%dateformat.current%}}` triggering the warning "NOT SUPPORTED: Replace deferred smartTemplate variable" [issue #394]
*   Further improvements to the New button badge 🟠 – to display this streamlined status, open Settings » Licenses. Under 'Updates', enable the option "$news.minimal$" [issue #396]
*   Added optional notification when reusing the last template [issue #395]

**Bug Fixed**
*   Fixed cursor automatic positioning when using `{{%quotePlaceHolder%}}` in templates
*   Removed unsafe assignments to `{{innerHTML}}` [issue #393]
