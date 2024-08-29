
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

SmartTemplates.Listener = {
	listen: function(evt) {
    const getElement = window.document.getElementById.bind(window.document);
    switch (evt.type) {
      case "SmartTemplate4CodeWord":
        const code = evt.target.getAttribute('codeWord'),
              className = evt.target.className;
        // window.onCodeWord(code, className); // was window.opener.onCodeWord when help was in its own window
        // copy to clipboard instead!
        navigator.clipboard.write(code);
        break;
      case "SmartTemplate4CAD":
        const tabbox = getElement('rightPane'),
              txtDefaultFormat = getElement('default_address_format');
				tabbox.selectedPanel = getElement('advancedSettingsTab');
				tabbox.selectedIndex = 2;
        
        txtDefaultFormat.classList.add('highlighted');
        txtDefaultFormat.focus();
        break;
      case "SmartTemplate4Website":
        const href = evt.target.getAttribute('href');
        if (href) {
          SmartTemplates.Util.openLinkInTab(href);
				}
        break;
    }
	}
}

SmartTemplates.Help = {
	onBodyClick : function onClick (element, evt) {
		SmartTemplates.Util.logDebug("Help.onBodyClick (" + element.tagName + ") ");
	},
  onLoad: async function () {
		// custom event listener for clicking code words
		document.addEventListener("SmartTemplate4CodeWord",
      SmartTemplates.Listener.listen,
      false,
      true); // The last value is a Mozilla-specific value to indicate untrusted content is allowed to trigger the event
		// custom event listener for scrolling
		document.addEventListener("SmartTemplate4ScrollVariables",
      (evt) => {
        // scroll variables back to top
        debugger;
        document.getElementById("variablesPane").scrollIntoView({block:"start"});
      }, 
      false,
      true);

  }

}
