The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.17) 


**Improvements**

*   Set Compatibility with Thunderbird 148 - unfortunately the current review policies for Add-ons with "experimental" APIs do not allow us to remove `strict_max_version` from manifest.json
*   Support replying to multiple selected messages with same html template. [issue #379] When multiple emails are selected, the header SmartTemplates button is hidden. Use the dropdown menu on the main SmartTemplates toolbar button to select the reply type and the corresponding template.


**Bug Fixes**

*   Fixed: When set to "Use the external template last selected from the drop-down menu." SmartTemplates did not select the matching template for correct the reply type (reply all, reply list, reply to sender) [issue #409]
*   Fixed: when replying to an email that opened from an eml file: no SmartTemplates functionality works [issue #406]
*   Intermittently, `%spellcheck()%` switch doesn't work when loading the template during reply [issue #407]
*   Fixed: Reply template unexpectedly removed meta info lines within quoted text [issue #408]


**Codebase Improvements**

*   Consolidated pseudo tags in localisation `{P}` `{/P}`, `{L}` `{/L}`  etc.
*   Fixed mismatched closing `</div>` tags (was `</vbox>`)
*   Trim leading spaces and fix dangling doublequotes in some variables  see: `combineEscapedParams()` c00739aa41c4f74a0a2b9bd0f255415b956f477f