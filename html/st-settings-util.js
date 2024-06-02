"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

SmartTemplates.Util = {
  __isDebug: false,
  get isDebug() {
    return this.__isDebug;
  },
  set isDebug(v) {
    this.__isDebug = v;
  },
  showAboutConfig: function(filter, readOnly, updateUI=false) {
    // we put the notification listener into tablistener.js - should only happen in ONE main window!
    // el - cannot be cloned! let's throw it away and get target of the event
    messenger.runtime.sendMessage({ 
      command: "showAboutConfig", 
      filter: filter,
      readOnly: readOnly,
      updateUI: updateUI
    });
  },
  viewSplashScreen: function() {
    messenger.runtime.sendMessage({ command:"showSplashMsg" });
  },
  showSupportPage: function() {
    messenger.runtime.sendMessage({ command:"showHomePageMsg" });
  },
  showHomePage: function() {
    messenger.runtime.sendMessage({ command:"showATNHomePageMsg" });
  },
  showBugsAndFeaturesPage: function() {
    messenger.runtime.sendMessage({ command:"showIssuesPageMsg" });
  },
  showPremiumFeaturesPage: function() {
    messenger.runtime.sendMessage({ command:"showPremiumFeaturePageMsg" });
  },


  logDebug: function (msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (this.isDebug) {
      this.logToConsole(...arguments);
    }
	},
	logToConsole: function (a) {
    let msg = "SmartTemplates Settings\n";
    console.log(msg, ...arguments);
  },  
  logException: function (aMessage, ex) {
		let stack = '';
		if (typeof ex.stack!='undefined') {
			stack = ex.stack.replace("@","\n  ");
		}

		let srcName = ex.fileName ? ex.fileName : "";
		console.warn(aMessage + "\n", 
		  `${srcName}:${ex.lineNumber}`, 
			`\n${ex.message}\n`, 
			ex.stack ? ex.stack.replace("@","\n  ") : "", );
		// this.logError(aMessage + "\n" + ex.message, srcName, stack, ex.lineNumber, 0, 0x1); // use warning flag, as this is an exception we caught ourselves
	} ,

	logHighlightDebug: function(txt, color="white", background="rgb(80,0,0)", ...args) {
		if (this.isDebug) {
			console.log(`SmartTemplates %c${txt}`, `color: ${color}; background: ${background}`, ...args);
		}
	},  

}