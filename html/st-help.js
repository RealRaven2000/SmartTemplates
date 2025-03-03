
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

SmartTemplates.Help = {
	onBodyClick : function onClick (element, evt) {
		SmartTemplates.Util.logDebug("Help.onBodyClick (" + element.tagName + ") ");
	},
  onLoad: async function () {
    // custom event listener for clicking code words
    browser.runtime.onMessage.addListener(
      (message, sender) => {
        switch (message.msg) {
          case "SmartTemplate4CodeWord":
            console.log(`st-help: Received ${message.msg} from:`, { sender });
            navigator.clipboard.write(message.code); // copy element to clipboard!
            return true;
          case "SmartTemplate4CAD": // default address book settings
            // open advanced page
            SmartTemplates.Settings.selectCategoryMenu("catSettingsAdvanced");
            // highlight & focus settings input
            const txtDefaultFormat = document.getElementById("default_address_format");
            txtDefaultFormat.classList.add("highlighted");
            txtDefaultFormat.focus();
            console.log(`st-help: Received ${message.msg} for ${message.code} from:`, { sender });
            return true;
          case "SmartTemplate4Website":
            console.log(`st-help: Received ${message.msg} from:`, { sender });
            const href = message.href;
            if (href) {
              SmartTemplates.Util.openLinkInTab(href);
            }
            return true;
        }
        return false;
      }
    )

    const variablesDocument = document.getElementById("helpFrame")?.contentDocument;
    const preheaderDesc = variablesDocument?.getElementById("preHeaderText");
    if (preheaderDesc) {
      preheaderDesc.innerHTML = SmartTemplates.Util.getBundleString("preheader.text", [
        "<span class='paramLiteral'>clipboard</span>",
        "<span class='paramLiteral'>*selection*</span>",
        "<span class='paramLiteral'>*clipboard*</span>",
      ]);
    }
  }

}
