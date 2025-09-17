The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.15.1) 


Some users may have seen a false incompatibility warning after updating from Thunderbird to v142. This was caused by cached compatibility information in Thunderbird, which sometimes fails to refresh correctly. The previous version of SmartTemplates was already fully compatible with 142. 

I raised a bug with Thunderbird to fix this: [Bugzilla 1986027](https://bugzilla.mozilla.org/show_bug.cgi?id=1986027), please add your observations there if you experienced this problem.

**Hotfix 4.15.1**
*   Fixed a serious regression in New/Answer/Forward templates caused by `%cursor%` + forced paragraph mode, which could cause parts of the template to appear out of order [issue #397]

**Improvements**
*   Removed unsafe assignments to `innerHTML` and added code santisation [issue #393]
*   Further improvements to the New button badge 🟠 – to display this streamlined status, open Settings » Licenses. Under 'Updates', enable the option "Do not display news label on update" [issue #396]
*   Added optional notification when reusing the last template [issue #395]

**Bug Fixed**
*   Fixed cursor automatic positioning when using `%quotePlaceHolder%` in templates
*   Fixed `%dateformat.current%` triggering the warning "NOT SUPPORTED: Replace deferred smartTemplate variable" [issue #394]
*   Fixed: Deleted Template Still Appearing and Triggering in SmartTemplates _Last Template_ item [issue #389]
