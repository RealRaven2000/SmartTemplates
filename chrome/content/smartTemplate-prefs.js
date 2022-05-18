"use strict"

/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK
*/

SmartTemplate4.Preferences = {
	Prefix: "extensions.smartTemplate4.",
	service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

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
    return SmartTemplate4.Preferences.getMyBoolPref("BackgroundParser");
  },
	
	getStringPref: function getStringPref(p) {
    let prefString ='',
		    key = this.Prefix + p;
    try {
		  const Ci = Components.interfaces, Cc = Components.classes;
			prefString = 
				this.service.getStringPref ?
				this.service.getStringPref(key) :
        this.service.getCharPref(key);
    }
    catch(ex) {
      SmartTemplate4.Util.logDebug("Could not find string pref: " + p + "\n" + ex.message);
    }
    finally {
      return prefString;
    }
	},
	
	setStringPref: function setStringPref(p, v) {
		if (this.service.setStringPref)
			return this.service.setStringPref(this.Prefix + p, v);
		else 
			return this.service.setCharPref(this.Prefix + p, v);
	},

	getIntPref: function(p) {
		return this.service.getIntPref(p);
	},

	setIntPref: function(p, v) {
		return this.service.setIntPref(p, v);
	},

	getBoolPref: function(p) {
		try {
			return this.service.getBoolPref(p);
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
			return this.service.setBoolPref(p, v);
		} catch(e) {
			let s="Err:" +e;
			return false;
		}
	} ,

	setMyStringPref: function(p, v) {
		return this.service.setCharPref(this.Prefix + p, v);
	} ,

	getMyStringPref: function(p) {
		return this.service.getCharPref(this.Prefix + p);
	} ,

	existsCharPref: function(pref) {
		try {
			if(this.service.prefHasUserValue(pref))
				return true;
			if (this.service.getCharPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	existsBoolPref: function(pref) {
		try {
			if(this.service.prefHasUserValue(pref))
				return true;
			if (this.service.getBoolPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	getBoolPrefSilent: function(pref) {
		try {
			return this.service.getBoolPref(pref);
		}
		catch(e) {
			return false;
		}
	}

}
