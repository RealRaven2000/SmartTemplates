"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/
// [issue 184] Replacement for smartTemplate-prefs.js - SmartTemplates.Preferences
//             original namespace: SmartTemplate4.Preferences

// CIRCULAR REFERENCES remove all calls to Util!. util may import preferences.


export let Preferences = {
	Prefix: "extensions.smartTemplate4.",
  isDebug: async function() {
    return await messenger.LegacyPrefs.getPref(this.Prefix + "debug");
  },
	isDebugOption: async function(option) { // granular debugging
		if (!await this.isDebug)
			return false;
		try {
			return await this.getMyBoolPref("debug." + option);
		}
		catch(e) {
      return false;
    }
	},  
  isBackgroundParser: async function() {
    return await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.BackgroundParser");
  },
	getStringPref: async function getStringPref(p) {
    let prefString ="",
		    key = this.Prefix + p;
    try {
			prefString = await messenger.LegacyPrefs.getPref(key);
    }
    catch(ex) {
      console.log("%cCould not find string pref: " + p, "color:red;", ex.message);
    }
    finally {
      return prefString;
    }
	},  
	setStringPref: async function setStringPref(p, v) {
    return await messenger.LegacyPrefs.setPref(this.Prefix + p, v);
	},
	getIntPref: async function(p) {
		return await messenger.LegacyPrefs.getPref(p);
	},
	setIntPref: async function(p, v) {
		return await messenger.LegacyPrefs.setPref(p, v);
	},
	getBoolPref: async function(p) {
		try {
			return await messenger.LegacyPrefs.getPref(p);
		} catch(e) {
			let s="Err:" +e;
			console.log("%cgetBoolPref("+p+") failed:\n" + s, "color:red;");
			return false;
		}
	},
	setBoolPref: async function(p, v) {
		try {
			return await messenger.LegacyPrefs.setPref(p, v);
		} catch(e) {
			let s="Err:" +e;
			return false;
		}
	} ,  

	getMyBoolPref: async function(p) {
		return await this.getBoolPref(this.Prefix + p);
	},

	setMyBoolPref: async function(p, v) {
		return await this.setBoolPref(this.Prefix + p, v);
	},

	getMyIntPref: async function(p) {
		return await this.getIntPref(this.Prefix + p);
	},

	setMyIntPref: async function(p, v) {
		return await this.setIntPref(this.Prefix + p, v);
	},
  
	setMyStringPref: async function(p, v) {
		return await messenger.LegacyPrefs.setPref(this.Prefix + p, v);
	} ,

	getMyStringPref: async function(p) {
		return await messenger.LegacyPrefs.getPref(this.Prefix + p);
	} ,
  
  // possibly move this class (or better make an instance immediately) to st-prefs.msj.js
  // SmartTemplates.Preferences.prefs [= new classPref()] I only need a single instance??
  // so why would I need a class
  identityPrefs: { // was classPref() from smartTemplate.overlay.js
      // use where ST4.pref is used! Preferences.identityPrefs
      // rename to pref and add to SmartTemplates. import from st-prefs.msj.js as needed?
      // all member functions have account idKey as parameters, so I don't think this object
      // has statefulness
    // -----------------------------------
    // get preference
    // returns default value if preference cannot be found.
    getCom: async function(prefstring, defaultValue)	{
      return await messenger.LegacyPrefs.getPref(prefstring, defaultValue);
    },

    // -----------------------------------
    // get preference(branch)
    getWithBranch: async function(idKey, defaultValue)
    {
      return await this.getCom(SmartTemplate4.Preferences.Prefix + idKey, defaultValue); //
    },

    // idKey Account
    // composeType: rsp, fwd, new
    // def: true = common
    // "Disable default quote header"
    isDeleteHeaders: async function(idKey, composeType, def) {
      // xxxhead
      return await this.getWithIdkey(idKey, composeType + "head", def)
    },

    isReplaceNewLines: async function(idKey, composeType, def) {
      // xxxnbr
      return await this.getWithIdkey(idKey, composeType + "nbr", def)
    },

    isUseHtml: async function(idKey, composeType, def) {
      // xxxhtml
      return await this.getWithIdkey(idKey, composeType + "html", def)
    },

    getTemplate: async function(idKey, composeType, def) {
      return await this.getWithIdkey(idKey, composeType + "msg", def);
    },

    getQuoteHeader: async function(idKey, composeType, def) {
      return await this.getWithIdkey(idKey, composeType + "header", def);
    },

    isTemplateActive: async function(idKey, composeType, def) {
      let isActive = await this.getWithIdkey(idKey, composeType, def);
      if (!isActive) return false; // defaults to empty string
      return isActive;
    },

    // whether an Identity uses the common account
    isCommon: async function(idkey) {
      return await this.getWithBranch(idkey + ".def", true);
    },
    

    // -----------------------------------
    // Get preference with identity key
    getWithIdkey: async function(idkey, pref, def) {    
      // fix problems in draft mode...
      if (!pref) 
        return ""; // draft etc.
      // extensions.smarttemplate.id8.def means account id8 uses common values.
      if (getWithBranch(idkey + ".def", true)) { // "extensions.smartTemplate4." + "id12.def"
        // common preference - test with .common!!!!
        return await this.getWithBranch("common." + pref, def);
      }
      else {
        // Account specific preference
        return await this.getWithBranch(idkey + "." + pref, def);
      }
    }  
    
  }
    
// OBSOLETE: existsCharPref, existsBoolPref, getBoolPrefSilent
  
}
