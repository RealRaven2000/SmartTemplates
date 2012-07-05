"use strict";

/* BEGIN LICENSE BLOCK

for detail, please refer to license.txt in the root folder of this extension

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or (at your option) any later version.

If you use large portions of the code please attribute to the authors
(Axel Grude)

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
GNU General Public License for more details.

You can download a copy of the GNU General Public License at
http://www.gnu.org/licenses/gpl-3.0.txt or get a free printed
copy by writing to:
	Free Software Foundation, Inc.,
	51 Franklin Street, Fifth Floor,
	Boston, MA 02110-1301, USA.

END LICENSE BLOCK
*/

SmartTemplate4.Util = {
	HARDCODED_EXTENSION_VERSION : "0.9",
	HARDCODED_EXTENSION_TOKEN : ".hc",
	ADDON_ID: "smarttemplate4@thunderbird.extension",
	VersionProxyRunning: false,
	mAppver: null,
	mAppName: null,
	mHost: null,
	mExtensionVer: null,
	ConsoleService: null,
	lastTime: 0,
	AMOHomepage:     "https://addons.mozilla.org/thunderbird/addon/324497/",
	SupportHomepage: "http://smarttemplate4.mozdev.org/index.html",
	BugPage:         "http://smarttemplate4.mozdev.org/bugs.html",
	DonatePage:      "http://smarttemplate4.mozdev.org/contribute.html",


	getBundleString: function(id, defaultText) {

		let strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
			 getService(Components.interfaces.nsIStringBundleService);
		let bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/errors.properties");
		let theText = '';
		try{
			//try writing an error to the Error Console using the localized string; if it fails write it in English
			theText = bundle.GetStringFromName(id);
		} catch (e) {
			theText = defaultText;
			this.logException ("Could not retrieve bundle string: " + id, e);
		}
		theText = theText.replace("&lt;","<");
		return theText.replace("&gt;",">");
	} ,

	getMail3PaneWindow: function() {
		var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
				.getService(Components.interfaces.nsIWindowMediator);
		var win3pane = windowManager.getMostRecentWindow("mail:3pane");
		return win3pane;
	} ,

	get AppverFull() {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.version;
	},

	get Appver() {
		if (null === this.mAppver) {
			var appVer=this.AppverFull.substr(0,3); // only use 1st three letters - that's all we need for compatibility checking!
			this.mAppver = parseFloat(appVer); // quick n dirty!
		}
		return this.mAppver;
	},

	get Application() {
		if (null===this.mAppName) {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
			const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
			const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
			const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";
			const POSTBOX_ID = "postbox@postbox-inc.com";
			switch(appInfo.ID) {
				case FIREFOX_ID:
					return this.mAppName='Firefox';
				case THUNDERBIRD_ID:
					return this.mAppName='Thunderbird';
				case SEAMONKEY_ID:
					return this.mAppName='SeaMonkey';
				case POSTBOX_ID:
					return this.mAppName='Postbox';
				default:
					this.mAppName=appInfo.name;
					this.logDebug ( 'Unknown Application: ' + appInfo.name);
					return appInfo.name;
			}
		}
		return this.mAppName;
	},

	get HostSystem() {
		if (null===this.mHost) {
			var osString = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULRuntime).OS;
			this.mHost = osString.toLowerCase();
		}
		return this.mHost; // linux - winnt - darwin
	},

	// this is done asynchronously, so it respawns itself
	VersionProxy: function() {
		try {
			if (SmartTemplate4.Util.mExtensionVer // early exit, we got the version!
				||
					SmartTemplate4.Util.VersionProxyRunning) // no recursion...
				return;

			let bAddonManager = true;
			// old builds! (pre Tb3.3 / Gecko 2.0)
			if (Components.classes["@mozilla.org/extensions/manager;1"]) {
				bAddonManager = false;
				let gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
					.getService(Components.interfaces.nsIExtensionManager);
				let currentVersion = gExtensionManager.getItemForID(SmartTemplate4.Util.ADDON_ID).version;
				SmartTemplate4.Util.mExtensionVer = currentVersion;
				SmartTemplate4.Util.VersionProxyRunning = false;
				return;
			}

			SmartTemplate4.Util.VersionProxyRunning = true;
			SmartTemplate4.Util.logDebug("Util.VersionProxy() started.");
			let myId = SmartTemplate4.Util.ADDON_ID;
			if (Components.utils.import) {
				Components.utils.import("resource://gre/modules/AddonManager.jsm");

				AddonManager.getAddonByID(myId, function(addon) {

					let versionLabel = window.document.getElementById("qf-options-header-description");
					if (versionLabel) versionLabel.setAttribute("value", addon.version);

					let u = SmartTemplate4.Util;
					u.mExtensionVer = addon.version;
					u.logDebug("AddonManager: SmartTemplate4 extension's version is " + addon.version);
					u.logDebug("SmartTemplate4.VersionProxy() - DETECTED SmartTemplate4 Version " + u.mExtensionVer + "\n"
					           + "Running on " + u.Application
					           + " Version " + u.AppverFull);
					// make sure we are not in options window
					if (!versionLabel)
						u.firstRun.init();

					SmartTemplate4.Util.mExtensionVer = addon.version;
					SmartTemplate4.Util.logDebug("AddonManager: SmartTemplate4 extension's version is " + addon.version);
					let versionLabel = window.document.getElementById("smartTemplate-options-version");
					if(versionLabel)
						versionLabel.setAttribute("value", addon.version);

				});
			}
			SmartTemplate4.Util.logDebug("AddonManager.getAddonByID .. added callback for setting extensionVer.");

		}
		catch(ex) {
			SmartTemplate4.Util.logToConsole("SmartTemplate4 VersionProxy failed - are you using an old version of " + SmartTemplate4.Util.Application + "?"
				+ "\n" + ex);
		}
		finally {
			SmartTemplate4.Util.VersionProxyRunning = false;
		}
	},

	get Version() {
		//returns the current QF version number.
		if(SmartTemplate4.Util.mExtensionVer)
			return SmartTemplate4.Util.mExtensionVer;
		var current = SmartTemplate4.Util.HARDCODED_EXTENSION_VERSION + SmartTemplate4.Util.HARDCODED_EXTENSION_TOKEN;

		if (!Components.classes["@mozilla.org/extensions/manager;1"]) {
			// Addon Manager: use Proxy code to retrieve version asynchronously
			SmartTemplate4.Util.VersionProxy(); // modern Mozilla builds.
												// these will set mExtensionVer (eventually)
												// also we will delay firstRun.init() until we _know_ the version number
		}
		else	// --- older code: extensions manager.
		{
			try {
				if(Components.classes["@mozilla.org/extensions/manager;1"])
				{
					var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
						.getService(Components.interfaces.nsIExtensionManager);
					current = gExtensionManager.getItemForID(SmartTemplate4.Util.ADDON_ID).version;
				}
				else {
					current = current + "(?)";
				}
				SmartTemplate4.Util.mExtensionVer = current;

			}
			catch(ex) {
				current = current + "(?ex?)" // hardcoded, program this for Tb 3.3 later
				SmartTemplate4.Util.logToConsole("SmartTemplate4 Version retrieval failed - are you using an old version of " + SmartTemplate4.Util.Application + "?");
			}
		}
		return current;
	} ,

	get VersionSanitized() {
		function strip(version, token) {
			let cutOff = version.indexOf(token);
			if (cutOff > 0) { 	// make sure to strip of any pre release labels
				return version.substring(0, cutOff);
			}
			return version;
		}

		var pureVersion = strip(SmartTemplate4.Util.Version, 'pre');
		pureVersion = strip(pureVersion, 'beta');
		pureVersion = strip(pureVersion, 'alpha');
		return strip(pureVersion, '.hc');
	},

	popupAlert: function (title, text, icon) {
		try {
			if (!icon)
				icon = "chrome://smarttemplate4/skin/icon32x32.png";
			Components.classes['@mozilla.org/alerts-service;1'].
								getService(Components.interfaces.nsIAlertsService).
								showAlertNotification(icon, title, text, false, '', null);
		}
		catch(e) {
			// prevents runtime error on platforms that don't implement nsIAlertsService
		}
	},

	showStatusMessage: function(s) {
		try {
			var sb = this.getMail3PaneWindow().document.getElementById('status-bar');
			var el, sbt;
			if (sb) {
				for(var i = 0; i < sb.childNodes.length; i++)
				{
					el = sb.childNodes[i];
					if (el.nodeType === 1 && el.id === 'statusTextBox') {
						sbt = el;
							break;
					}
				}
				for(var i = 0; i < sbt.childNodes.length; i++)
				{
					el = sbt.childNodes[i];
					if (el.nodeType === 1 && el.id === 'statusText') {
							el.label = s;
							break;
					}
				}
			}
			else
				MsgStatusFeedback.showStatusString(s);
		}
		catch(ex) {
			this.logException("showStatusMessage - ", ex);
			MsgStatusFeedback.showStatusString(s);
		}
	} ,

	logTime: function() {
		var timePassed = '';
		try { // AG added time logging for test
			var end= new Date();
			var endTime = end.getTime();
			if (this.lastTime === 0) {
				this.lastTime = endTime;
				return "[logTime init]"
			}
			var elapsed = new String(endTime - this.lastTime); // time in milliseconds
			timePassed = '[' + elapsed + ' ms]	 ';
			this.lastTime = endTime; // remember last time
		}
		catch(e) {;}
		return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
	},

	logToConsole: function (msg, optionalTitle) {
		if (SmartTemplate4.Util.ConsoleService === null)
			SmartTemplate4.Util.ConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
									.getService(Components.interfaces.nsIConsoleService);
		let title = "SmartTemplate4";
		if (typeof optionalTitle !== 'undefined')
			title += " {" + optionalTitle.toUpperCase() + "}"

		SmartTemplate4.Util.ConsoleService.logStringMessage(title + " " + this.logTime() + "\n"+ msg);
	},

	// flags
	// errorFlag		0x0 	Error messages. A pseudo-flag for the default, error case.
	// warningFlag		0x1 	Warning messages.
	// exceptionFlag	0x2 	An exception was thrown for this case - exception-aware hosts can ignore this.
	// strictFlag 		0x4
	logError: function (aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags)
	{
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
																	 .getService(Components.interfaces.nsIConsoleService);
		var aCategory = '';

		var scriptError = Components.classes["@mozilla.org/scripterror;1"].createInstance(Components.interfaces.nsIScriptError);
		scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
		consoleService.logMessage(scriptError);
	} ,

	logException: function (aMessage, ex) {
		var stack = '';
		if (typeof ex.stack!='undefined')
			stack= ex.stack.replace("@","\n  ");

		let srcName = ex.fileName ? ex.fileName : "";
		this.logError(aMessage + "\n" + ex.message, srcName, stack, ex.lineNumber, 0, 0x1); // use warning flag, as this is an exception we caught ourselves
	} ,

	logDebug: function (msg) {
		if (SmartTemplate4.Preferences.Debug)
			this.logToConsole(msg);
	},

	logDebugOptional: function (option, msg) {
		if (SmartTemplate4.Preferences.isDebugOption(option))
			this.logToConsole(msg, option);
	},

	// dedicated function for email clients which don't support tabs
	// and for secured pages (donation page).
	openLinkInBrowserForced: function(linkURI) {
		let Ci = Components.interfaces;
		try {
			this.logDebug("openLinkInBrowserForced (" + linkURI + ")");
			if (SmartTemplate4.Util.Application==='SeaMonkey') {
				var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
				var browser = windowManager.getMostRecentWindow( "navigator:browser" );
				if (browser) {
					let URI = linkURI;
					setTimeout(function() {  browser.currentTab = browser.getBrowser().addTab(URI); if (browser.currentTab.reload) browser.currentTab.reload(); }, 250);
				}
				else {
					this.getMail3PaneWindow().window.openDialog(getBrowserURL(), "_blank", "all,dialog=no", linkURI, null, 'SmartTemplate4');
				}

				return;
			}
			var service = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
				.getService(Ci.nsIExternalProtocolService);
			var ioservice = Components.classes["@mozilla.org/network/io-service;1"].
						getService(Ci.nsIIOService);
			var uri = ioservice.newURI(linkURI, null, null);
			service.loadURI(uri);
		}
		catch(e) { this.logDebug("openLinkInBrowserForced (" + linkURI + ") " + e.toString()); }
	},


	// moved from options.js
	// use this to follow a href that did not trigger the browser to open (from a XUL file)
	openLinkInBrowser: function(evt,linkURI) {
		let Cc = Components.classes;
		let Ci = Components.interfaces;
		if (SmartTemplate4.Util.Application === 'Thunderbird') {
			var service = Cc["@mozilla.org/uriloader/external-protocol-service;1"]
				.getService(Ci.nsIExternalProtocolService);
			var ioservice = Cc["@mozilla.org/network/io-service;1"].
						getService(Ci.nsIIOService);
			service.loadURI(ioservice.newURI(linkURI, null, null));
			if(null !== evt)
				evt.stopPropagation();
		}
		else {
			this.openLinkInBrowserForced(linkURI);
		}
	},

	// moved from options.js (then called
	openURL: function(evt,URL) { // workaround for a bug in TB3 that causes href's not be followed anymore.
		var ioservice,iuri,eps;

		if (SmartTemplate4.Util.Application==='SeaMonkey' || SmartTemplate4.Util.Application==='Postbox')
		{
			this.openLinkInBrowserForced(URL);
			if(null!=evt) evt.stopPropagation();
		}
		else {
			if (this.openURLInTab(URL) && null!=evt) {
				if (evt.preventDefault)  evt.preventDefault();
				if (evt.stopPropagation)	evt.stopPropagation();
			}
		}
	},

	openURLInTab: function (URL) {
		try {
			var sTabMode="";
			var tabmail;
			tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				var mail3PaneWindow = this.getMail3PaneWindow();
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
			if (tabmail) {
				sTabMode = (SmartTemplate4.Util.Application === "Thunderbird" && this.versionGreaterOrEqual(this.AppverFull, "3")) ? "contentTab" : "3pane";
				tabmail.openTab(sTabMode,
				{contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, gSmartTemplate_TabURIregexp._thunderbirdRegExp);"});
			}
			else {
				window.openDialog("chrome://messenger/content/", "_blank",
									"chrome,dialog=no,all", null,
				{ tabType: "contentTab", tabParams: {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, gSmartTemplate_TabURIregexp._thunderbirdRegExp);", id:"gSmartTemplate_Weblink"} } );
			}
		}
		catch(e) {
			this.logException('openURLInTab(' + URL + ')', e);
			return false;
		}
		return true;
	} ,

	versionGreaterOrEqual: function(a, b) {
		/*
			Compares Application Versions
			returns
			- is smaller than 0, then A < B
			-  equals 0 then Version, then A==B
			- is bigger than 0, then A > B
		*/
		let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
														.getService(Components.interfaces.nsIVersionComparator);
		return (versionComparator.compare(a, b) >= 0);
	} ,

	versionSmaller: function(a, b) {
		/*
			Compares Application Versions
			returns
			- is smaller than 0, then A < B
			-  equals 0 then Version, then A==B
			- is bigger than 0, then A > B
		*/
		let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
														.getService(Components.interfaces.nsIVersionComparator);
		 return (versionComparator.compare(a, b) < 0);
	} ,


	showVersionHistory: function(ask) {
		var version = SmartTemplate4.Util.VersionSanitized;

		var sPrompt = SmartTemplate4.Util.getBundleString("SmartTemplate4.confirmVersionLink", "Display the change log for SmartTemplate4?")
		if (!ask || confirm(sPrompt + " " + version + "?")) {
			SmartTemplate4.Util.openURL(null, "http://smarttemplate4.mozdev.org/version.html#" + version);
		}
	} ,

	showBugsAndFeaturesPage: function() {
		SmartTemplate4.Util.openURLInTab(this.BugPage);
	} ,

	showDonatePage: function () {
		SmartTemplate4.Util.openURLInTab(this.DonatePage);
	}  ,

	showHomePage: function () {
		SmartTemplate4.Util.openURLInTab(this.AMOHomepage);
	} ,

	showSupportPage: function () {
		SmartTemplate4.Util.openURLInTab(this.SupportHomepage);
	} ,

	showAboutConfig: function(filter) {

		const name = "Preferences:ConfigManager";
		const uri = "chrome://global/content/config.xul";

		var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var w = mediator.getMostRecentWindow(name);

		if (!w) {
			var watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
			w = watcher.openWindow(null, uri, name, "chrome,resizable,centerscreen,width=500px,height=350px", null);
		}
		w.focus();
		w.setTimeout(
			function () {
				var flt = w.document.getElementById("textbox");
				if (flt) {
					 flt.value=filter;
					 flt.focus();
					 if (w.self.FilterPrefs)
					 w.self.FilterPrefs();
				}
			}, 300);
	} ,

	displayNotAllowedMessage: function(reservedWord) {
		let strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
			 getService(Components.interfaces.nsIStringBundleService);
		// wrap variable in % but only if necessary
		let decoratedWord =
			((reservedWord[0] != '%') ? '%' : '')
			+ reservedWord
			+ ((reservedWord[reservedWord.length - 1] != '%') ? '%' : '');

		let bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/errors.properties");
		let ErrorString1 = '';
		let ErrorString2 = '';
		try{
			//try writing an error to the Error Console using the localized string; if it fails write it in English
			ErrorString1 = bundle.GetStringFromName("contextError1");
			ErrorString2 = bundle.GetStringFromName("contextError2");
		} catch (e) {
			ErrorString1 = bundle.GetStringFromName("SmartTemplate4: The variable");
			ErrorString2 = bundle.GetStringFromName("can't be used for NEW Messages!\nListing of usable variables see Help");
		}
		let errorText = ErrorString1 + " " + decoratedWord + " " + ErrorString2;
		alert(errorText)
		this.logDebug (errorText);
	}

};


SmartTemplate4.Util.firstRun =
{
	update: function(previousVersion) {
		// upgrade routines for future use...
		// SmartTemplate4.Util.logDebug('convert { %% } to [[ ]] ');

	} ,

	init: function() {
		// avoid running firstRun.init in messenger compose again!
		if (typeof SmartTemplate4.Settings === 'undefined')
			return;
		SmartTemplate4.Util.logDebugOptional('functions', 'Util.firstRun.init()');
		let prev = -1, firstRun = true;
		let showFirsts = true, debugFirstRun = false;
		let prefBranchString = "extensions.smartTemplate4.";

		let svc = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		var ssPrefs = svc.getBranch(prefBranchString);

		try { debugFirstRun = Boolean(ssPrefs.getBoolPref("debug.firstRun")); } catch (e) { debugFirstRun = false; }

		SmartTemplate4.Util.logDebugOptional ("firstRun","SmartTemplate4.Util.firstRun.init()");
		if (!ssPrefs) {
			SmartTemplate4.Util.logDebugOptional ("firstRun","Could not retrieve prefbranch for " + prefBranchString);
		}

		var current = SmartTemplate4.Util.Version;
		SmartTemplate4.Util.logDebug("Current SmartTemplate4 Version: " + current);

		try {
			SmartTemplate4.Util.logDebugOptional ("firstRun","try to get setting: getCharPref(version)");
			try {
				prev = SmartTemplate4.Preferences.getMyStringPref("version");
			}
			catch (e) {
				prev = "?";
				SmartTemplate4.Util.logDebugOptional ("firstRun","Could not determine previous version - " + e);
			} ;

			SmartTemplate4.Util.logDebugOptional ("firstRun","try to get setting: getBoolPref(firstRun)");
			try { firstRun = ssPrefs.getBoolPref("firstRun"); } catch (e) { firstRun = true; }


			if (firstRun) {
				// previous setting found? not a new installation!
				if (SmartTemplate4.Preferences.existsBoolPref("extensions.smarttemplate.def"))
					firstRun = false;
				SmartTemplate4.Util.logDebugOptional ("firstRun","setting firstRun=false");
				SmartTemplate4.Preferences.setMyBoolPref("firstRun", false);
			}

			// enablefirstruns=false - allows start pages to be turned off for partners
			SmartTemplate4.Util.logDebugOptional ("firstRun","try to get setting: getBoolPref(enablefirstruns)");
			try { showFirsts = ssPrefs.getBoolPref("enablefirstruns"); } catch (e) { showFirsts = true; }


			SmartTemplate4.Util.logDebugOptional ("firstRun", "Settings retrieved:"
					+ "\nprevious version=" + prev
					+ "\ncurrent version=" + current
					+ "\nfirstrun=" + firstRun
					+ "\nshowfirstruns=" + showFirsts
					+ "\ndebugFirstRun=" + debugFirstRun);

		}
		catch(e) {
			SmartTemplate4.Util.logException("Exception in SmartTemplate4-util.js: \n"
				+ "\n\ncurrent: " + current
				+ "\nprev: " + prev
				+ "\nfirstrun: " + firstRun
				+ "\nshowFirstRuns: " + showFirsts
				+ "\ndebugFirstRun: " + debugFirstRun, e);
		}
		finally {
			SmartTemplate4.Util.logDebugOptional ("firstRun","finally - firstRun=" + firstRun);

			// AG if this is a pre-release, cut off everything from "pre" on... e.g. 1.9pre11 => 1.9
			var pureVersion = SmartTemplate4.Util.VersionSanitized;
			SmartTemplate4.Util.logDebugOptional ("firstRun","finally - pureVersion=" + pureVersion);
			// change this depending on the branch
			var versionPage = "http://smarttemplate4.mozdev.org/version.html#" + pureVersion;
			SmartTemplate4.Util.logDebugOptional ("firstRun","finally - versionPage=" + versionPage);

			let updateVersionMessage = SmartTemplate4.Util.getBundleString (
			                             "SmartTemplate4.updateMessageVersion",
			                             "SmartTemplate4 was successfully upgraded to version {1}!").replace("{1}",current);

			// NOTE: showfirst-check is INSIDE both code-blocks, because prefs need to be set no matter what.
			if (firstRun){
				/* EXTENSION INSTALLED FOR THE FIRST TIME! */
				SmartTemplate4.Util.logDebug ("firstRun code");

				if (showFirsts) {
					// Insert code for first run here
					// on very first run, we go to the index page - welcome blablabla
					SmartTemplate4.Util.logDebugOptional ("firstRun","setTimeout for content tab (index.html)");
					window.setTimeout(function() {
						SmartTemplate4.Util.openURL(null, "http://smarttemplate4.mozdev.org/index.html");
					}, 1500); //Firefox 2 fix - or else tab will get closed (leave it in....)

				}

			}
			else {

				// check for update of pure version (everything before pre, beta, alpha)
				if (prev!=pureVersion && current.indexOf(SmartTemplate4.Util.HARDCODED_EXTENSION_TOKEN) < 0) {
					/* EXTENSION UPDATED */
					SmartTemplate4.Util.logDebug("ST4 Test  - SmartTemplate4 Update Detected:\n **PREVIOUS**:" + prev + "\npure Version: " + pureVersion + "\ncurrent: " + current);

					let isUpdated = this.update(prev);
					SmartTemplate4.Util.logDebugOptional ("firstRun","prev!=current -> upgrade case.");
					// upgrade case!!
					let upgradeMessage = "";

					if (SmartTemplate4.Util.versionSmaller(current, '0.9')) {
						upgradeMessage = "\n\n" + SmartTemplate4.Util.getBundleString (
						                 "SmartTemplate4.updateMessageNewBrackets1",
						                 "Dear SmartTemplate4 user, we are excited to announce that from this version on, SmartTemplate4 also supports the &lt;style&gt; tag so that you can now do advanced styling within your signature.");
						upgradeMessage += SmartTemplate4.Util.getBundleString (
						                 "SmartTemplate4.updateMessageNewBrackets2",
						                 "In order to make this possible we had to redefined the specific syntax for bracketed expressions: {  %optional_variables% }  to use double brackets instead: [[ %optional_variables% ]].")
						                 + "\n\n";
						upgradeMessage += SmartTemplate4.Util.getBundleString (
						                 "SmartTemplate4.updateMessageNewBrackets3",
						                 "For your convenience, we will now convert your existing templates so you can keep using them in the new version.");
					}

					if (showFirsts) {
						// version is different => upgrade (or conceivably downgrade)

						// DONATION PAGE
						// display donation page - disable by right-clicking label above version jump panel
						if ((SmartTemplate4.Preferences.getBoolPrefSilent("extensions.smarttemplate4.donateNoMore")))
							SmartTemplate4.Util.logDebugOptional ("firstRun","Jump to donations page disabled by user");
						else {
							SmartTemplate4.Util.logDebugOptional ("firstRun","setTimeout for donation link");
							window.setTimeout(function() {SmartTemplate4.Util.showDonatePage();}, 2000);
						}

						// VERSION HISTORY PAGE
						// display version history - disable by right-clicking label above show history panel
						if (!SmartTemplate4.Preferences.getBoolPrefSilent("extensions.smarttemplate4.hideVersionOnUpdate")) {
							SmartTemplate4.Util.logDebugOptional ("firstRun","open tab for version history, QF " + current);
							window.setTimeout(function(){SmartTemplate4.Util.showVersionHistory(false);}, 2200);
						}
					}

					window.setTimeout(function(){
						if (SmartTemplate4.Util.versionSmaller(prev, '0.9')) {
							alert(updateVersionMessage + upgradeMessage); // lets replace this with a window
							// we are only running the old prefs routine for versions < .9
							SmartTemplate4.Settings.convertOldPrefs();
						}
						else
							SmartTemplate4.Util.popupAlert ("SmartTemplate4", updateVersionMessage + upgradeMessage);
					}, 20000);


				}
			}

			// =============================================
			// STORE CURRENT VERSION NUMBER!
			if (prev != pureVersion && current != '?' && (current.indexOf(SmartTemplate4.Util.HARDCODED_EXTENSION_TOKEN) < 0)) {
				if (SmartTemplate4.Preferences.Debug)
					alert("SmartTemplate4 Test (Debug)  - Previous Version Number:" + prev + "\n"
					      + "Storing current version number: " + pureVersion);
				SmartTemplate4.Util.logDebug ("Storing new version number " + current);
				// STORE VERSION CODE!
				SmartTemplate4.Preferences.setMyStringPref("version", pureVersion); // store sanitized version! (no more alert on pre-Releases + betas!)
			}
			else {
				SmartTemplate4.Util.logDebugOptional ("firstRun","No need to store current version: " + current
					+ "\nprevious: " + prev.toString()
					+ "\ncurrent!='?' = " + (current!='?').toString()
					+ "\nprev!=current = " + (prev!=current).toString()
					+ "\ncurrent.indexOf(" + SmartTemplate4.Util.HARDCODED_EXTENSION_TOKEN + ") = " + current.indexOf(SmartTemplate4.Util.HARDCODED_EXTENSION_TOKEN).toString());
			}

			SmartTemplate4.Util.logDebugOptional ("firstRun","finally { } ends.");
		} // end finally

	}


// // fire this on application launch, which includes open-link-in-new-window
// window.addEventListener("load",function(){ SmartTemplate4.Util.firstRun.init(); },true);

};


