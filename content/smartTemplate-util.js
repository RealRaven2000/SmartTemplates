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

var SmartTemplate4_TabURIregexp = {
	get _thunderbirdRegExp() {
		delete this._thunderbirdRegExp;
		return this._thunderbirdRegExp = new RegExp("^http://smarttemplate4.mozdev.org");
	}
};

SmartTemplate4.Util = {
	HARDCODED_EXTENSION_VERSION : "0.9.2",
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
	VersionPage:     "http://smarttemplate4.mozdev.org/version.html",
	StationeryHelpPage: "http://smarttemplate4.mozdev.org/stationery.html",
	AxelAMOPage:     "https://addons.mozilla.org/thunderbird/user/66492/",
	MarkyAMOPage:    "https://addons.mozilla.org/thunderbird/user/2448736/",
	ArisAMOPage:     "https://addons.mozilla.org/firefox/user/5641642/",
	Tool8AMOPage:    "https://addons.mozilla.org/thunderbird/user/5843412/",
	NoiaHomepage:    "http://carlitus.deviantart.com/",
	FlagsHomepage:   "http://flags.blogpotato.de/",
	StationeryPage:  "https://addons.mozilla.org/thunderbird/addon/stationery",

	get mailDocument() {
	  return gMsgCompose.editor.document;
	} ,
	
	getComposeType: function() {
		let msgComposeType = Components.interfaces.nsIMsgCompType;
		let st4composeType = '';
		
		switch (gMsgCompose.type) {
			// new message -----------------------------------------
			//	(New:0 / NewsPost:5 / MailToUrl:11)
			case msgComposeType.New:
			case msgComposeType.NewsPost:
			case msgComposeType.MailToUrl:
				// composeCase = 'new';
				st4composeType = 'new';
				break;

			// reply message ---------------------------------------
			// (Reply:1 / ReplyAll:2 / ReplyToSender:6 / ReplyToGroup:7 /
			// ReplyToSenderAndGroup:8 / ReplyToList:13)
			case msgComposeType.Reply:
			case msgComposeType.ReplyAll:
			case msgComposeType.ReplyToSender:
			case msgComposeType.ReplyToGroup:
			case msgComposeType.ReplyToSenderAndGroup:
			case msgComposeType.ReplyToList:
				// composeCase = 'reply';
				st4composeType = 'rsp';
				break;

			// forwarding message ----------------------------------
			// (ForwardAsAttachment:3 / ForwardInline:4)
			case msgComposeType.ForwardAsAttachment:
			case msgComposeType.ForwardInline:
				// composeCase = 'forward';
				st4composeType = 'fwd';
				break;

			// do not process -----------------------------------
			// (Draft:9/Template:10/ReplyWithTemplate:12)
			case msgComposeType.Draft:
				// composeCase = 'draft';
				let messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);
				let msgDbHdr = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).QueryInterface(Components.interfaces.nsIMsgDBHdr);
				const nsMsgKey_None = 0xffffffff;
				if(msgDbHdr) {
					if (msgDbHdr.threadParent && (msgDbHdr.threadParent != nsMsgKey_None)) {
						st4composeType = 'rsp(draft)'; // just guessing, of course it could be fwd as well
					}
					if (msgDbHdr.numReferences == 0)
						st4composeType = 'new(draft)';
				}
				break;
			default:
				st4composeType = "";
				break;
		}
		return st4composeType;

	} ,
	
	getBundleString: function(id, defaultText) {

		let strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
			 getService(Components.interfaces.nsIStringBundleService);
		let bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/messages.properties");
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

	get Mail3PaneWindow() {
		let windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
				.getService(Components.interfaces.nsIWindowMediator);
		let win3pane = windowManager.getMostRecentWindow("mail:3pane");
		return win3pane;
	} ,

	get PlatformVer() {
		let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.platformVersion;
	} ,
	
	get AppverFull() {
		let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.version;
	},

	get Appver() {
		if (null === this.mAppver) {
			let appVer=this.AppverFullPlatformVer; // no more truncation
			this.mAppver = parseFloat(appVer).toString(); // quick n dirty!
		}
		return this.mAppver;
	},

	get Application() {
		if (null===this.mAppName) {
		let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
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
			let runTime = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULRuntime);
			let osString = runTime.OS;
			this.mHost = osString.toLowerCase();
			// 
			if (window.navigator)
				this.mHost = window.navigator.oscpu;
			
			
			if (runTime.inSafeMode)
				this.mHost += ' [Safe Mode]';
			
			
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

			SmartTemplate4.Util.logDebug("Util.VersionProxy()...");

			let bAddonManager = true;
			// old builds! (pre Tb3.3 / Gecko 2.0)
			if (Components.classes["@mozilla.org/extensions/manager;1"]) {
				SmartTemplate4.Util.logDebug("Util.VersionProxy() extensions/manager: old code branch");
				bAddonManager = false;
				let gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
					.getService(Components.interfaces.nsIExtensionManager);
				let currentVersion = gExtensionManager.getItemForID(SmartTemplate4.Util.ADDON_ID).version;
				SmartTemplate4.Util.mExtensionVer = currentVersion;
				SmartTemplate4.Util.VersionProxyRunning = false;
				SmartTemplate4.Util.logDebug("extensions/manager: detected currentVersion: " + currentVersion);
				SmartTemplate4.Util.firstRun.init();
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
			SmartTemplate4.Util.logDebug("Util.VersionProxy ends()");
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
		this.logDebug("Version() = " + current);

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
			var sb = this.Mail3PaneWindow.document.getElementById('status-bar');
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
	// errorFlag		  0x0 	Error messages. A pseudo-flag for the default, error case.
	// warningFlag		0x1 	Warning messages.
	// exceptionFlag	0x2 	An exception was thrown for this case - exception-aware hosts can ignore this.
	// strictFlag 		0x4
	logError: function (aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags)
	{
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
		                               .getService(Components.interfaces.nsIConsoleService);
		var aCategory = 'chrome javascript';

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
					this.Mail3PaneWindow.window.openDialog(getBrowserURL(), "_blank", "all,dialog=no", linkURI, null, 'SmartTemplate4');
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
			if (this.Application!='Thunderbird') {
				this.openLinkInBrowserForced(URL);
				return true;
			}
			
			var sTabMode="";
			var tabmail;
			tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				var mail3PaneWindow = this.Mail3PaneWindow;
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
			if (tabmail) {
				sTabMode = (SmartTemplate4.Util.Application === "Thunderbird" && this.versionGreaterOrEqual(this.AppverFull, "3")) ? "contentTab" : "3pane";
				tabmail.openTab(sTabMode,
				{contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, SmartTemplate4_TabURIregexp._thunderbirdRegExp);"});
			}
			else {
				window.openDialog("chrome://messenger/content/", "_blank",
									"chrome,dialog=no,all", null,
				{ tabType: "contentTab", tabParams: {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, SmartTemplate4_TabURIregexp._thunderbirdRegExp);", id:"gSmartTemplate_Weblink"} } );
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
		let mainWindow = SmartTemplate4.Util.Mail3PaneWindow;
		let util = mainWindow.SmartTemplate4.Util;
		
		let version = util.VersionSanitized;

		let sPrompt = util.getBundleString("SmartTemplate4.confirmVersionLink", "Display the change log?")+" [version {1}]";
		sPrompt = sPrompt.replace("{1}", version);
		if (!ask || confirm(sPrompt)) {
			util.openURL(null, util.VersionPage + "#" + version);
		}
	} ,

	showBugsAndFeaturesPage: function() {
		SmartTemplate4.Util.openURLInTab(this.BugPage);
	} ,

	showDonatePage: function () { SmartTemplate4.Util.openURLInTab(this.DonatePage); }  ,
	showHomePage: function () { SmartTemplate4.Util.openURLInTab(this.AMOHomepage); } ,
	showSupportPage: function () { SmartTemplate4.Util.openURLInTab(this.SupportHomepage); } ,
	showAxelAMOPage: function () { SmartTemplate4.Util.openURLInTab(this.AxelAMOPage); } ,
	showMarkyAMOPage: function () { SmartTemplate4.Util.openURLInTab(this.MarkyAMOPage); } ,
	showArisAMOPage: function () { SmartTemplate4.Util.openURLInTab(this.ArisAMOPage); } ,
	showTool8AMOPage: function () { SmartTemplate4.Util.openURLInTab(this.Tool8AMOPage); } ,
	showNoiaHomepage: function () { SmartTemplate4.Util.openURLInTab(this.NoiaHomepage); } ,
	showFlagsHomepage: function () { SmartTemplate4.Util.openURLInTab(this.FlagsHomepage); } ,
	showStationeryPage: function () { SmartTemplate4.Util.openURLInTab(this.StationeryPage); } ,
	showStationeryHelpPage: function () { SmartTemplate4.Util.openURLInTab(this.StationeryHelpPage); } ,

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
					// for security, we lock down about:config so users do not accidentally change stuff they shouldn't
					flt.setAttribute('readonly',true);
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

		let bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/messages.properties");
		let ErrorString1 = '';
		try{
			//try writing an error to the Error Console using the localized string; if it fails write it in English
			ErrorString1 = bundle.GetStringFromName("contextError");
		} catch (e) {
			ErrorString1 = bundle.GetStringFromName("The Variable {1} can not be used for *new* messages!\nPlease refer to help for a list of permitted variables");
		}
		let errorText = ErrorString1.replace("{1}", decoratedWord);

		SmartTemplate4.Message.display(errorText,
		                              "centerscreen,titlebar",
		                              function() { ; }
		                              );
		this.logDebug (errorText);
	} ,

/**
* Returns the week number for this date. dowOffset is the day of week the week
* "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
* the week returned is the ISO 8601 week number.
* @param int dowOffset
* @return int
*/
	getIsoWeek : function (tm, dowOffset) {
	/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.epoch-calendar.com */
		if (!tm) {
			return ("No valid time passed to getIsoWeek!");
		}
		if (isNaN(dowOffset)) {
			return ("cwIso(offset) needs a number as offset! e.g. cwIso(0)");
		}
		SmartTemplate4.Util.logDebugOptional('functions', 'Util.getIsoWeek(' + tm + ', ' + dowOffset + ')');

		dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero

		let newYear = new Date(tm.getFullYear(),0,1);
		let day = newYear.getDay() - dowOffset; //the day of week the year begins on
		day = (day >= 0 ? day : day + 7);
		let daynum = Math.floor((tm.getTime() - newYear.getTime() -
		             (tm.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
		let weeknum;
		//if the year starts before the middle of a week
		if(day < 4) {
			weeknum = Math.floor((daynum+day-1)/7) + 1;
			if(weeknum > 52) {
				nYear = new Date(tm.getFullYear() + 1,0,1);
				nday = nYear.getDay() - dowOffset;
				nday = nday >= 0 ? nday : nday + 7;
				/*if the next year starts before the middle of
				the week, it is week #1 of that year*/
				weeknum = nday < 4 ? 1 : 53;
			}
		}
		else {
			weeknum = Math.floor((daynum+day-1)/7);
		}
		SmartTemplate4.Util.logDebugOptional('functions', 'Util.getIsoWeek() returns weeknum: ' + weeknum);
		return weeknum;
	},
	
  // moved from settings diaLog as there were problems calling this on program start
	cancelConvert : function() {
		// conversion routine to 0.9 was cancelled
		// user will have to create new settings from scratch!
		// this is a dummy function, it doesn't do anything
	} ,
	
	// convert a extension.smarttemplate. setting to an extension.smartTemplate4. one
	convertPrefValue : function (oldPrefName, test, realString) {
		let converted = true;
		let debugText = "";
		debugText += 'CONVERT: ' + oldPrefName;
		
		let thePreference = realString ? realString : SmartTemplate4.Settings.getPref(oldPrefName);
		let newPrefString = oldPrefName.indexOf('smarttemplate.id') > 0 ?
		                    oldPrefName.replace('smarttemplate', 'smartTemplate4') :
		                    oldPrefName.replace('smarttemplate', 'smartTemplate4.common');

		debugText += ' => ' + newPrefString + '\n';
		SmartTemplate4.Settings.setPref(newPrefString, thePreference);
		switch (typeof thePreference) {
			case 'string':
				if (thePreference.indexOf('{')>0 || thePreference.indexOf('}')>0) {
					convertedBracketExpressions++;
					// hmmmffff....
					thePreference = thePreference
					                .replace("\{","[[").replace("{","[[")
					                .replace("\}","]]").replace("}","]]");
					debugText += '\nbracketed conversion:\n:   ' + thePreference;
				}
				if (test) 
					alert(newPrefString + "\n" + thePreference);
				else
					SmartTemplate4.Settings.prefService.setCharPref(newPrefString, thePreference);
				break;
			case 'number':
				SmartTemplate4.Settings.prefService.setIntPref(newPrefString, thePreference);
				break;
			case 'boolean':
				SmartTemplate4.Settings.prefService.setBoolPref(newPrefString, thePreference);
				break;
			default:
				converted = false;
				break;
		}
		SmartTemplate4.Util.logDebug(debugText);
		return converted;
	},

	convertOldPrefs : function() {
		let countConverted = 0;
		let convertedBracketExpressions = 0;
		SmartTemplate4.Util.logDebug('CONVERSION OF OLD SMARTTEMPLATE PREFERENCES');

		try {
			let array = SmartTemplate4.Settings.prefService.getChildList("extensions.smarttemplate.", {});

			// AG new: import settings to new format
			for (var i in array) {

				let oldPrefName = array[i];
				if (this.convertPrefValue(oldPrefName))
					countConverted ++;
				
				// keep a backup, for now ??
				// this.prefService.deleteBranch(array[i]);
			}
		}
		catch (ex) {
			SmartTemplate4.Util.logException("convertOldPrefs failed: ", ex);
		}
		if (countConverted)
			SmartTemplate4.Settings.prefService.setIntPref("extensions.smartTemplate4.conversions.total", countConverted);
		if (convertedBracketExpressions)
			SmartTemplate4.Settings.prefService.setIntPref("extensions.smartTemplate4.conversions.curlyBrackets", convertedBracketExpressions);

	},

	isFormatLink : function(format) {
		let formattedHTML = (format.search(/\,link\)$/, "i") != -1);
	  return formattedHTML;
	} ,
	
	showPlatformWarning: function() {
	 
	  let msg = SmartTemplate4.Util.getBundleString (
		                 "SmartTemplate4.updateThunderbird1",
		                 "Did you know? Thunderbird 24 will be released in September 2013 - the current release version of Thunderbird is {1} or greater."
		                 ).replace('{1}', '17.0.7'); // in future, we need to get this number (current release number) from the web...
		msg += " " + SmartTemplate4.Util.getBundleString (
		                 "SmartTemplate4.updateThunderbird2",
		                 "You are still running an old version [Gecko {2}] which exposes your system to a number of security vulnerabilities."
		                 ).replace('{2}', this.PlatformVer);
		msg += "\n" + SmartTemplate4.Util.getBundleString (
		                 "SmartTemplate4.updateThunderbird3",
		                 "Why not try the automatic update by going to Help > About > Check for updates."
		                 );
		msg += "\n" + SmartTemplate4.Util.getBundleString (
		                 "SmartTemplate4.updateThunderbird4",
		                 "Shall we check for updates now?"
		                 );

		SmartTemplate4.Message.display(msg,
		                               "centerscreen,titlebar",
							                     function() { SmartTemplate4.Util.updateThunderbird();},
							                     function() { SmartTemplate4.Util.cancelUpdate();} );
	},
	
	updateThunderbird: function() {
		window.setTimeout(
		function() {
		  // older versions have checkForUpdates function in root
			if (SmartTemplate4.Util.Mail3PaneWindow.checkForUpdates)
				SmartTemplate4.Util.Mail3PaneWindow.checkForUpdates();
			else
				SmartTemplate4.Util.Mail3PaneWindow.openAboutDialog();
		});
	},
	
	cancelUpdate: function() {
		alert(SmartTemplate4.Util.getBundleString (
		                 "SmartTemplate4.updateThunderbirdCancelled",
		                 "Future versions of SmartTemplate4 will likely require the up to date code base of Thunderbird; please consider updating at a later stage. Thanks!"
		                 ));		
	} ,
	
	getServerInfo: function(idKey) {
		let Ci = Components.interfaces;
		let serverInfo = '';
		try {
			let account = null;
			let acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]  
														.getService(Ci.nsIMsgAccountManager);  
			let accounts = acctMgr.accounts;
			let iAccounts = (typeof accounts.Count === 'undefined') ? accounts.length : accounts.Count();
			for (var i = 0; i < iAccounts; i++) {
				account = accounts.queryElementAt ?
					accounts.queryElementAt(i, Ci.nsIMsgAccount) :
					accounts.GetElementAt(i).QueryInterface(Ci.nsIMsgAccount);
				if (account.defaultIdentity && account.defaultIdentity.key == idKey)
					break;
			}
			let srv = account ? account.incomingServer : null;
			serverInfo = srv ? 'server{?}:      ' + srv.hostName + ' [' + srv.type + ']' + '\n ': '';
		}
		catch(ex) { this.logException("could not find server for identity " + idKey , ex); }
    return serverInfo;
  },

	getSignatureInner: function(sig, isRemoveDashes) {
		function removeDashes(elem, isPlainText) {
			// also fix removing dashes from plain text sig:
			if (isPlainText) {
				return elem.replace('-- \<br\>', '');
			}
		
			// [Bug 25483] when using %sig(2)% signature is missing on new mails in HTML mode
			let newSig = elem;
			if (elem.childNodes.length) {
				if (elem.childNodes.length == 1)
					newSig = removeDashes(elem.firstChild);
				else {
					if (elem.firstChild.nodeValue == "-- ") {
						elem.removeChild(elem.firstChild); //remove '-- '
					}
					if (elem.firstChild.tagName == 'BR') {
						elem.removeChild(elem.firstChild); //remove 'BR'
					}
				}
			}
			return newSig;
		}
		// the actual function
		try {
			SmartTemplate4.Util.logDebugOptional('regularize','getSignatureInner(' + isRemoveDashes + ')');
			if (sig != null) {
				SmartTemplate4.sigInTemplate = true;
				if (typeof sig === "string")
					return isRemoveDashes ? removeDashes(sig, true) : sig;
					
				if (!sig.children || sig.children.length==0) {
					SmartTemplate4.Util.logDebugOptional('regularize','getSignatureInner(): signature has no child relements.');

					return sig.innerHTML ? sig.innerHTML : sig.outerHTML;  // deal with DOM String sig (non html)
				}
				if (isRemoveDashes) {
				  removeDashes(sig, false);
				}
				return sig.innerHTML;
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logException('regularize.getSignatureInner() failed', ex);
		}
		return "";
	}
	

	
	/* 
	,
	
  setCursorPosition : function(editor) { 
		try {
			let caretSpan = editor.rootElement.childNodes[0].ownerDocument.getElementById('_AthCaret');
			if (caretSpan) {
				editor.selection.collapse(caretSpan, 0);
				caretSpan.parentNode.removeChild(caretSpan);
			}
		} catch(e) {}
	}	
	*/
		
	

};  // .Util


SmartTemplate4.Util.firstRun =
{
	update: function(previousVersion) {
		// upgrade routines for future use...
		// SmartTemplate4.Util.logDebug('convert { %% } to [[ ]] ');

	} ,

	init: function() {

		function buildUpgradeMessage09() {
			let s = "\n" + SmartTemplate4.Util.getBundleString (
		                 "SmartTemplate4.updateMessageNewBrackets1",
		                 "Dear SmartTemplate4 user, we are excited to announce that from this version on, SmartTemplate4 also supports the usage of curly braces { } and the <style> tag so that you can now add advanced styling within your signature."
		                 ) ;
			s += "\n" + SmartTemplate4.Util.getBundleString (
			                 "SmartTemplate4.updateMessageNewBrackets2",
			                 "From now on, the specific syntax for bracketed expressions is changed: Instead of curly braces {%optional_variables%} use double square brackets [[%optional_variables%]].")
			                 ;
			s += "\n" + SmartTemplate4.Util.getBundleString (
			                 "SmartTemplate4.updateMessageNewBrackets3",
			                 "SmartTemplate4 will now convert your existing templates so you can keep using them in the new version. Press [Ok] to continue.");
			return s;
		}

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
			var versionPage = SmartTemplate4.Util.VersionPage + "#" + pureVersion;
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

					// Display the modeless update message
					window.setTimeout(function(){
						if (SmartTemplate4.Util.versionSmaller(prev, '0.9')) {
							// we are only running the old prefs routine for versions < .9
							upgradeMessage = buildUpgradeMessage09();
							// let's show the cancel button only if the conversion to the new prefbranch has been done before
							let showCancel = (SmartTemplate4.Preferences.existsBoolPref("extensions.smartTemplate4.id1.def"));

							SmartTemplate4.Message.display(updateVersionMessage + upgradeMessage,
							                              "centerscreen,titlebar",
							                              function() { SmartTemplate4.Util.convertOldPrefs();},
							                              showCancel ? function() {SmartTemplate4.Util.cancelConvert();} : null );
							;
						}
						else
							SmartTemplate4.Util.popupAlert ("SmartTemplate4", updateVersionMessage);
					}, 3000);

				}
				// test of updateMessage:
				if (SmartTemplate4.Preferences.isDebugOption('test.update'))
					window.setTimeout(function(){
						// call a modeless message window,
						// pass 2 functions that are either executed depending on whether ok or cancel is clicked
						SmartTemplate4.Message.display(updateVersionMessage + buildUpgradeMessage09(),
						                              "centerscreen,titlebar",
						                              function() {alert('[test callback function] {ok} was pressed')},
						                              function() {alert('[test callback function] {cancel} was pressed')},
						                              function() {alert('[test callback function] {yes} was pressed')},
						                              function() {alert('[test callback function] {no} was pressed')}
						                              );
					}, 3000);
			}

			// =============================================
			// STORE CURRENT VERSION NUMBER!
			if (prev != pureVersion && current != '?' && (current.indexOf(SmartTemplate4.Util.HARDCODED_EXTENSION_TOKEN) < 0)) {
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

		// // fire this on application launch, which includes open-link-in-new-window
		// window.addEventListener("load",function(){ SmartTemplate4.Util.firstRun.init(); },true);
		window.addEventListener("load", function(){ SmartTemplate4.updateStatusBar(); },true);

	} 

};  // .Util.firstRun

// this object is used to configure the modeless smartTemplate-msg window
// the display() Method it takes 2 callback functions one for [Ok] and one for [Cancel]
// these are executed when the button is pressed, and the window will be closed.
// if a callback for [Cancel] [Yes] [No] is not passed then the Cancel button is hidden
SmartTemplate4.Message = {
	okCALLBACK : null ,
	cancelCALLBACK : null,
	yesCALLBACK : null ,
	noCALLBACK : null ,
	myWindow : null,
	display : function(text, features, okCallback, cancelCallback, yesCallback, noCallback) {
		var watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);

		if (okCallback)
			this.okCALLBACK = okCallback;
		if (cancelCallback)
			this.cancelCALLBACK = cancelCallback;
		if (yesCallback)
			this.yesCALLBACK = yesCallback;
		if (noCallback)
			this.noCALLBACK = noCallback;

		// pass some data as args. we allow nulls for the callbacks
		// avoid using "this" in here as it confuses Tb3?
		let params =
		{
			messageText:    text,
			okCallback:     SmartTemplate4.Message.okCALLBACK,
			cancelCallback: SmartTemplate4.Message.cancelCALLBACK,
			yesCallback:    SmartTemplate4.Message.yesCALLBACK,
			noCallback:     SmartTemplate4.Message.noCALLBACK
		};

		// open message with main as parent

		let main = SmartTemplate4.Util.Mail3PaneWindow;
		main.openDialog("chrome://smarttemplate4/content/smartTemplate-msg.xul", "st4message", "chrome,alwaysRaised,dependent,close=no," + features, params)
		    .QueryInterface(Components.interfaces.nsIDOMWindow);
// 		let win = watcher.openWindow(main, "chrome://smarttemplate4/content/smartTemplate-msg.xul", "st4message", "chrome," + features, params)
// 		                 .QueryInterface(Components.interfaces.nsIDOMWindow);

	} ,

	// default function (probably not used)
	okMessage : function() {
		if (this.okCALLBACK) {
			this.okCALLBACK();
			this.okCALLBACK = null;
		}
		window.close();
	} ,

	// default function (probably not used)
	cancelMessage : function() {
		if (this.cancelCALLBACK) {
			this.cancelCALLBACK();
			this.cancelCALLBACK = null;
		}
		window.close();
	} ,

	// default function (probably not used)
	yesMessage : function() {
		if (this.yesCALLBACK) {
			this.yesCALLBACK();
			this.yesCALLBACK = null;
		}
		window.close();
	} ,

	noMessage : function() {
		if (this.noCALLBACK) {
			this.noCALLBACK();
			this.noCALLBACK = null;
		}
		window.close();
	} ,

	loadMessage : function () {
		try {
			if (window.arguments && window.arguments.length) {
				let params = window.arguments[0];  // leads to errors in tb3?
				let msgDiv = document.getElementById('innerMessage');

				let theMessage = window.arguments[0].messageText;
				// split text (passed in with /n as delimiter) into paragraphs
				let textNodes = theMessage.split("\n");
				let i = 0;
				for (i = 0; i < textNodes.length; i++) {
					// empty nodes will be <br>
					let par = textNodes[i].length ? document.createElement('p') : document.createElement('br');
					if (textNodes[i].length)
						par.textContent = textNodes[i]; // we want this to wrap. won't use unescape for the moment
					msgDiv.appendChild(par);
				}
				// contents.innerHTML = 'Element Number '+num+' has been added! <a href=\'#\' onclick=\'removeElement('+divIdName+')\'>Remove the div "'+divIdName+'"</a>';

				document.getElementById('ok').addEventListener("click", window.arguments[0].okCallback, true);
				window.st4OkListener = window.arguments[0].okCallback;
				if (window.arguments[0].cancelCallback) {
					let cancelBtn = document.getElementById('cancel');
					cancelBtn.addEventListener("click", window.arguments[0].cancelCallback, true);
					cancelBtn.hidden = false;
					window.st4CancelListener = window.arguments[0].cancelCallback;
				}
				if (window.arguments[0].yesCallback) {
					let yesBtn = document.getElementById('yes');
					yesBtn.addEventListener("click", window.arguments[0].yesCallback, true);
					yesBtn.hidden = false;
					window.st4YesListener = window.arguments[0].yesCallback;
				}
				if (window.arguments[0].noCallback) {
					let noBtn = document.getElementById('no');
					noBtn.addEventListener("click", window.arguments[0].noCallback, true);
					noBtn.hidden = false;
					window.st4NoListener = window.arguments[0].noCallback;
				}
			}
			else
				alert('window.arguments: ' + window.arguments);
		}
		catch(ex) {
			alert("Exception in loadMessage:" + ex);
			SmartTemplate4.Util.logException("Exception in loadMessage:", ex);
		}
		window.sizeToContent();
	} ,

	unloadMessage : function (win) {
		this.okCALLBACK = null;
		this.cancelCALLBACK = null;
		this.yesCALLBACK = null;
		this.noCALLBACK = null;
		this.myWindow = null;
		if (win.st4OkListener) {
			document.getElementById('ok').removeEventListener("click", win.st4OkListener, false);
		}
		if (win.st4CancelListener) {
			document.getElementById('cancel').removeEventListener("click", win.st4CancelListener, false);
		}
		if (win.st4YesListener) {
			document.getElementById('yes').removeEventListener("click", win.st4YesListener, false);
		}
		if (win.st4NoListener) {
			document.getElementById('no').removeEventListener("click", win.st4NoListener, false);
		}
		win.close();
	} 
	
}  // .Message
