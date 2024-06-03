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

	isDebug: async function() {
		return await getPref("debug");
	},

  isDebugOption: async function(option) { // granular debugging
		if (!this.isDebug)
			return false;
		try {
			return getPref("debug." + option);
		}
		catch(e) {return false;}
	},

  logDebug: function (msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (this.isDebug) {
      this.logToConsole(...arguments);
    }
	},

  /** 
  * only logs if debug mode is set and specific debug option are active
  * 
  * @optionString {string}: comma delimited options
  * @msg {string}: text to log 
  */   
  logDebugOptional: async function(optionString, msg) {
    let options = optionString.split(',');
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (await this.isDebugOption(option)) {
        this.logWithOption(...arguments);
        break; // only log once, in case multiple log switches are on
      }
    }
  },

  logTime: function logTime() {
    let timePassed = '',
        end = new Date(),
        endTime = end.getTime();
    try { // AG added time logging for test
      if (this.lastTime==0) {
        this.lastTime = endTime;
        return "[logTime init]"
      }
      let elapsed = new String(endTime - this.lastTime); // time in milliseconds
      timePassed = '[' + elapsed + ' ms]   ';
      this.lastTime = endTime; // remember last time
    }
    catch(e) {;}
    return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
  },

  // first argument is the option tag
  logWithOption: function logWithOption(a) {
    arguments[0] =  "SmartTemplates "
      +  '{' + arguments[0].toUpperCase() + '} ' 
      + this.logTime() + "\n";
    console.log(...arguments);
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


  getBundleString: function (id, substitions = []) { // moved from local copies in various modules.
    // [mx-l10n]
    let localized = browser.i18n.getMessage(id, substitions);
    let s = "";
    if (localized) {
      s = localized;
    }
    else {
      s = defaultText;
      this.logToConsole ("Could not retrieve bundle string: " + id + "");
    }
    return s;
  },
  
  openLinkInTab: function(uri) {
    browser.tabs.create(
      {active:true, url: uri}
    );
  },

  showLicenseDialog: function() {
    logMissingFunction("SmartTemplates.Util.showLicenseDialog()");
  }

}