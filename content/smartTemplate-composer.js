"use strict";


SmartTemplate4.composer = {
	load: function st4_composerLoad() {
		const Ci = Components.interfaces,
					Cc = Components.classes,
					util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences;
		
		util.logDebug("SmartTemplate4.composer.load");
		
		// we cannot use the old way of adding the style shee in the xul overlay...
		// .. because it doesn't affect the content area
		// I do not want to inject any of these rules into the Editor's document
		// because I want to avoid polluting the markup with stuff that is strictly
		// reserved to the composing stage
		const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
		      ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
		      uri = ios.newURI("chrome://SmartTemplate4/skin/default/compose-overlay.css", null, null);
					
		// for some reason this affects the 3pane window, too
		if(!sss.sheetRegistered(uri, sss.USER_SHEET))
			sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
		
		// thanks to Joerg K. for pointing this one out:
		window.document.getElementById("msgcomposeWindow").addEventListener("compose-send-message", 
		  function (e) { 
			  util.composerSendMessage(e); // pass on event in case we need it.
			}
	  );
		
		// add toolbarbutton for deferred variables
		if (!prefs.getMyBoolPref('cleanDeferredButton.installer')) {
			setTimeout (
				function st4_setToolbarId() {
					let toolbarId;
					switch(util.Application) {
						case 'Thunderbird':
							toolbarId = "composeToolbar2";
							break;
						case 'SeaMonkey':
							toolbarId = "composeToolbar";
							break;
						case 'Postbox':
							toolbarId = "composeToolbar5";
							break;
					}
					if (util.installButton(toolbarId, "smarttemplate4-cleandeferred", "button-save"))
						prefs.setMyBoolPref('cleanDeferredButton.installer', true); // log the fact we installed it to avoid re-adding it.
				}
				, 4000
			);
		}
	} // load ()
};

// window.setTimeout (
(
function() 
  {
		const util = SmartTemplate4.Util,
					logDebugOptional = util.logDebugOptional.bind(util),
					isDebugComposer = SmartTemplate4.Preferences.isDebugOption('composer');
		let txt = "unknown";
		try { txt	= window.document.firstElementChild.getAttribute('windowtype'); }
		catch(ex) {;}
		logDebugOptional('composer', "Adding compose-window-init event listener for msgcomposeWindow...");
		
		let composer = document.getElementById("msgcomposeWindow");
		composer.addEventListener("compose-window-init", SmartTemplate4.initListener, false);
		
		SmartTemplate4.init();
		// debugger;
		
		util.logDebug("Calling SmartTemplate4.composer.load from window: " + txt);
		// safety for when the compose-window-init event does not fire (Tb 67+)
		if (typeof ComposeStartup == 'function') {
			// if (util.versionGreaterOrEqual(util.AppverFull, "61")) 
			if (!SmartTemplate4.ComposeStartup) {
				if (isDebugComposer) debugger;
				SmartTemplate4.ComposeStartup = ComposeStartup;
				ComposeStartup = function() {
					logDebugOptional('composer','Calling ComposeStartup Wrapper');
					SmartTemplate4.ComposeStartup();
					logDebugOptional('composer','Calling initListener');
					SmartTemplate4.initListener(true);
				}
			}
		}
    // add the style sheet.
		SmartTemplate4.composer.load();
  }
)();
//,10 
// );

