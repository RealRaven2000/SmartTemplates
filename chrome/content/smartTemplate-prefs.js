"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK
*/

SmartTemplate4.Preferences = {
	Prefix: "extensions.smartTemplate4.",
	service: Services.prefs,

	get isDebug() {
		return this.getMyBoolPref("debug");
	},

	isDebugOption: function(option) { // granular debugging
		if (!this.isDebug)
			return false;
		try {
			return this.getMyBoolPref("debug." + option);
		}
		catch(e) {return false;}
	},
  
  isBackgroundParser: function() {
    // switch for [issue 184] - background parsing & composer processing [mx]
    return SmartTemplate4.Preferences.getMyBoolPref("BackgroundParser");
  },
	
	getStringPref: function getStringPref(p) {
    let prefString ='',
		    key = this.Prefix + p;
    try {
		  const Ci = Components.interfaces, Cc = Components.classes;
			prefString = 
				Services.prefs.getStringPref ?
				Services.prefs.getStringPref(key) :
        Services.prefs.getCharPref(key);
    }
    catch(ex) {
      SmartTemplate4.Util.logDebug("Could not find string pref: " + p + "\n" + ex.message);
    }
    finally {
      return prefString;
    }
	},
	
	setStringPref: function setStringPref(p, v) {
    return Services.prefs.setStringPref(this.Prefix + p, v);
	},

	getIntPref: function(p) {
		return Services.prefs.getIntPref(p);
	},

	setIntPref: function(p, v) {
		return Services.prefs.setIntPref(p, v);
	},

	getBoolPref: function(p) {
		try {
			return Services.prefs.getBoolPref(p);
		} catch(e) {
			let s="Err:" +e;
			SmartTemplate4.Util.logToConsole("getBoolPref("+p+") failed:\n" + s);
			return false;
		}
	},

	getMyBoolPref: function(p) {
		return SmartTemplate4.Preferences.getBoolPref(this.Prefix + p);
	},

	setMyBoolPref: function(p, v) {
		return SmartTemplate4.Preferences.setBoolPref(this.Prefix + p, v);
	},

	getMyIntPref: function(p) {
		return SmartTemplate4.Preferences.getIntPref(this.Prefix + p);
	},

	setMyIntPref: function(p, v) {
		return this.setIntPref(this.Prefix + p, v);
	},

	setBoolPref: function(p, v) {
		try {
			return Services.prefs.setBoolPref(p, v);
		} catch(e) {
			let s="Err:" +e;
			return false;
		}
	} ,

	setMyStringPref: function(p, v) {
		return Services.prefs.setCharPref(this.Prefix + p, v);
	} ,

	getMyStringPref: function(p) {
		return Services.prefs.getCharPref(this.Prefix + p);
	} ,

	existsCharPref: function(pref) {
		try {
			if(Services.prefs.prefHasUserValue(pref))
				return true;
			if (Services.prefs.getCharPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	existsBoolPref: function(pref) {
		try {
			if(Services.prefs.prefHasUserValue(pref))
				return true;
			if (Services.prefs.getBoolPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	getBoolPrefSilent: function(pref) {
		try {
			return Services.prefs.getBoolPref(pref);
		}
		catch(e) {
			return false;
		}
	}

}
