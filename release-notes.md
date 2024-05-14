The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.5) 

**Enhancements**

* You can now use percent "%" sign within a text parameter, e.g. `%header.set(subject,"save 25%")%` \[issue #287\]
* Added a button for editing external templates. You can set up any external editor, preferrably it would be a HTML editor with Syntax highlighting. \[issue #282\]
* Added text transformation parameters for search functions: Use the parameters `capitalize` / `uppercase` / `lowercase` / `camelcase` after the group parameter. This can also be compared with the `toclipboard` parameter. \[issue #288\] 
 
Examples:

  ```    
  %matchTextFromSubject("Customer.*\\n\\-+\\n(.*)\\n",1,uppercase)%
  %matchTextFromBody("Customer.*\\n\\-+\\n(.*)\\n",1,lowercase)%
  %header.prefix.matchFromBody(subject,"Customer.*\\n\\-+\\n(.*)\\n",1,capitalize)%  
  %matchTextFromBody("Customer.*\\n\\-+\\n(.*)\\n",1,capitalize,toclipboard)%
  ```

*  The following keywords are supported
    -  `capitalize` Capitalizes the first letter of each word. Useful for Names.
    -  `camelcase` Converts the first character of the entire string lowercase.
    -  `lowercase` Transforms the entire match to lower case.
    -  `uppercase` Transforms the entire match to upper case.

* Support `selection` as parameter for replaceText - so we can transform selected (formatted) text from smart fragments. \[issue #289\] Syntax: `%replaceText("find","replace",selection)%` For example, the following can be used as a smart fragment script to generate a nicer menu path from a string like "Menu >> submenu >> command" into "_Menu » submenu » command_". Note that we can use HTML markup, like in any smart fragment.

  ```    
    &lt;i&gt;%replaceText(">>","»",selection)%&lt;/i&gt;
  ```    
    

**Bug Fixes**

* The settings dialog was missing important toolbar buttons (beside account selector) when opened from Add-ons manager. \[issue #291\]
* Fixed: Opening SmartTemplates settings in "Common" can show a disabled / missing UI underneath. Only after selecting another entry from accounts the templates area became visible. \[issue #290\]
* All spaces after/before text in %header.set(subject," text ")% were removed. From now on, preserve all spaces in any text argument. \[issue #292\]