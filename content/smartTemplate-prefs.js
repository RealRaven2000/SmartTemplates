
"use strict"
// smartTemplate-prefs.js

SmartTemplate4.Preferences = {
	Prefix: "extensions.smartTemplate4.",
	service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

	get Debug() {
		return this.getMyBoolPref("debug");
	},

	isDebugOption: function(option) { // granular debugging
		if (!this.Debug)
			return false;
		try {
			return this.getMyBoolPref("debug." + option);
		}
		catch(e) {return false;}
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
			var s="Err:" +e;
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
			var s="Err:" +e;
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
	},
	
	get isStationerySupported() {
		return this.getMyBoolPref('stationery.supported');
	}

}
