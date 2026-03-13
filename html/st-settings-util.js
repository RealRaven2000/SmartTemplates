/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

/*
	globals
    SmartTemplates: readonly,
		getPref: readonly,
*/

// -------------------------------------------------------
// TO DO - REIMPLEMENT THE FOLLOWING FUNCTIONS:
//    -   showLicenseDialog()   - go through background page, don't close tab?
// -------------------------------------------------------
import { Util } from "../scripts/st-util.mjs.js";
import { logMissingFunction } from "./st-log.mjs";


SmartTemplates.Util = {
	ADDON_ID: "smarttemplate4@thunderbird.extension",
  ADDON_TITLE: "SmartTemplates",
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
    messenger.runtime.sendMessage({ command:"showHomePage" });
  },
  showHomePage: function() {
    messenger.runtime.sendMessage({ command:"showATNHomePage" });
  },
  showYouTubePage: function(videoId=null) {
    messenger.runtime.sendMessage({ 
      command:"showYouTubePage",
      video: videoId
    });
  },
  showStationeryPage: function(topic) {
    // topic == "snippets"
    messenger.runtime.sendMessage({ 
      command:"showStationeryePage",
      topic: topic
    });
  },
  showBugsAndFeaturesPage: function() {
    messenger.runtime.sendMessage({ command:"showIssuesPage" });
  },
  showPremiumFeaturesPage: function() {
    messenger.runtime.sendMessage({ command:"showPremiumFeaturePage" });
  },
	popupAlert: function (title, text, icon) {
		try {
      // in legacy codem it used nsIAlertsService.showAlertNotification()
			if (!icon) {
				icon = "../chrome/content/skin/icon32x32.png";
      }
      Util.slideAlert(title, text, icon);
		}
		catch {
			// prevents runtime error on platforms that don't implement nsIAlertsService
		}
	},
	isDebug: async function() {
		return await getPref("debug");
	},

  isDebugOption: async function(option) { // granular debugging
		if (await this.isDebug()===false) {
			return false;
    }
		try {
			return getPref("debug." + option);
		}
		catch {return false;}
	},

  logDebug: async function (_msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (await this.isDebug()) {
      this.logToConsole(...arguments);
    }
	},

  /** 
  * only logs if debug mode is set and specific debug option are active
  * 
  * @optionString {string}: comma delimited options
  * @msg {string}: text to log 
  */   
  logDebugOptional: async function(optionString, _msg) {
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
    catch {;}
    return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
  },

  // first argument is the option tag
  logWithOption: function logWithOption(_a) {
    arguments[0] =  "SmartTemplates "
      +  '{' + arguments[0].toUpperCase() + '} ' 
      + this.logTime() + "\n";
    console.log(...arguments);
  },  

	logToConsole: function (_a) {
    let msg = "SmartTemplates Settings\n";
    console.log(msg, ...arguments);
  },  
  logException: function (aMessage, ex) {
		let stack = '';
		if (typeof ex.stack!='undefined') {
			// eslint-disable-next-line no-unused-vars
			stack = ex.stack.replace("@","\n  ");
		}

		let srcName = ex.fileName ? ex.fileName : "";
		console.warn(aMessage + "\n", 
		  `${srcName}:${ex.lineNumber}`, 
			`\n${ex.message}\n`, 
			ex.stack ? ex.stack.replace("@","\n  ") : "", );
		// this.logError(aMessage + "\n" + ex.message, srcName, stack, ex.lineNumber, 0, 0x1); // use warning flag, as this is an exception we caught ourselves
	} ,

	logHighlightDebug: async function(txt, color="white", background="rgb(80,0,0)", ...args) {
		if (await this.isDebug()) {
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
      s = id;
      this.logToConsole ("Could not retrieve bundle string: " + id + "");
    }
    return s;
  },

  gracePeriodText: function (days) {
    let txt = (days>=0) ?
      this.getBundleString("st.trialDays").replace("{0}", days) :
      this.getBundleString("st.trialExpiry").replace("{0}", -days);
    return txt;
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