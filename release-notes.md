The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.14) 


Some users may have seen a false incompatibility warning after updating from Thunderbird to v142. This was caused by cached compatibility information in Thunderbird, which sometimes fails to refresh correctly. The previous version of SmartTemplates was already fully compatible with 142. 

I raised a bug with Thunderbird to fix this: <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1986027">[Bugzilla 1986027]</a>, please add your observations there if you experienced this problem.

**Improvements**
*   Made compatible with Thunderbird 143. 
*   Variable documentation: Improve searching to search `%variable%` fields [issue #388]
*   Added "Minimal news" mode to show for badge 🟠 for new updates instead of the 'Read the News' label - enable this in Settings » Licenses under 'Updates'. This will make the work with SmartTemplates less intrusive, while still signalling news about possible important changes. As always, the badge and blue background will disappear as soon as clicking on the 'Latest news' menu entry.
*   Added a warning for Standard License requirement for `%file%`, `%dateformat%`  instead of triggering premium feature warning. Also removed the message about requiring a license [issue #391]


**Bug Fixed**
*   Fixed a minor issue with the line "Click a heading or Expand All"
*   Fixed a problem with escaped commas from clipboard [issue #386]
*   Fixed for Thunderbird 143: all menu icons of all popups broken [issue #390]
