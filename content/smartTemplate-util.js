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
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You can download a copy of the GNU General Public License at
http://www.gnu.org/licenses/gpl-3.0.txt or get a free printed
copy by writing to:
  Free Software Foundation, Inc.,
  51 Franklin Street, Fifth Floor,
  Boston, MA 02110-1301, USA.
  
END LICENSE BLOCK 
*/

gSmartTemplate.Util = {
  HARDCODED_EXTENSION_VERSION : "0.8.1",
  HARDCODED_EXTENSION_TOKEN : ".hc",
  ADDON_ID: "smarttemplate4@thunderbird.extension",
  VersionProxyRunning: false,
  mAppver: null,
  mAppName: null,
  mHost: null,
  mExtensionVer: null,
  ConsoleService: null,
  lastTime: 0,
    
  getBundleString: function(id, defaultText) { 
    try {
      var s= gSmartTemplate.Properties.getLocalized(id);
    }
    catch(e) {
      s= defaultText;
      this.logException ("Could not retrieve bundle string: " + id, e);
    }
    return s;
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
    var appVer=this.AppverFull().substr(0,3); // only use 1st three letters - that's all we need for compatibility checking!
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
      if (gSmartTemplate.Util.mExtensionVer // early exit, we got the version!
        ||
          gSmartTemplate.Util.VersionProxyRunning) // no recursion...
        return; 
      gSmartTemplate.Util.VersionProxyRunning = true;
      gSmartTemplate.Util.logDebug("Util.VersionProxy() started.");
      let myId = gSmartTemplate.Util.ADDON_ID;
      if (Components.utils.import) {
        Components.utils.import("resource://gre/modules/AddonManager.jsm");

        AddonManager.getAddonByID(myId, function(addon) {
          gSmartTemplate.Util.mExtensionVer = addon.version;
          gSmartTemplate.Util.logDebug("AddonManager: gSmartTemplate extension's version is " + addon.version);
          let versionLabel = window.document.getElementById("smartTemplate-options-version");
          if(versionLabel) versionLabel.setAttribute("value", addon.version);

        });
      }
      gSmartTemplate.Util.logDebug("AddonManager.getAddonByID .. added callback for setting extensionVer.");

    }
    catch(ex) {
      gSmartTemplate.Util.logToConsole("SmartTemplate4 VersionProxy failed - are you using an old version of " + gSmartTemplate.Util.Application + "?"
        + "\n" + ex);
    }
    finally {
      gSmartTemplate.Util.VersionProxyRunning=false;
    }
  },
  
  get Version() {
    //returns the current QF version number.
    if(gSmartTemplate.Util.mExtensionVer)
      return gSmartTemplate.Util.mExtensionVer;
    var current = gSmartTemplate.Util.HARDCODED_EXTENSION_VERSION + gSmartTemplate.Util.HARDCODED_EXTENSION_TOKEN;
    
    if (!Components.classes["@mozilla.org/extensions/manager;1"]) {
      // Addon Manager: use Proxy code to retrieve version asynchronously
      gSmartTemplate.Util.VersionProxy(); // modern Mozilla builds.
                        // these will set mExtensionVer (eventually)
                        // also we will delay FirstRun.init() until we _know_ the version number
    }
    else  // --- older code: extensions manager.
    {
      try {
        if(Components.classes["@mozilla.org/extensions/manager;1"])
        {
          var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
            .getService(Components.interfaces.nsIExtensionManager);
          current = gExtensionManager.getItemForID(gSmartTemplate.Util.ADDON_ID).version;
        }
        else {
          current = current + "(?)";
        }
        gSmartTemplate.Util.mExtensionVer = current;

      }
      catch(ex) {
        current = current + "(?ex?)" // hardcoded, program this for Tb 3.3 later
        gSmartTemplate.Util.logToConsole("gSmartTemplate Version retrieval failed - are you using an old version of " + gSmartTemplate.Util.Application + "?");
      }
    }
    return current;
  } ,

  get VersionSanitized() {
    function strip(version, token) {
      let cutOff = version.indexOf(token);
      if (cutOff > 0) {   // make sure to strip of any pre release labels
        return version.substring(0, cutOff);
      }
      return version;
    }
      
    var pureVersion = strip(gSmartTemplate.Util.Version, 'pre');
    pureVersion = strip(pureVersion, 'beta');
    pureVersion = strip(pureVersion, 'alpha');
    return strip(pureVersion, '.hc');
  },
   
  popupAlert: function (title, text, icon) {
    try {
      if (!icon)
        icon = "chrome://smartTemplate4/skin/icon32x32.png";
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
      this.logToConsole("showStatusMessage - " +  ex);
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
      timePassed = '[' + elapsed + ' ms]   ';
      this.lastTime = endTime; // remember last time
    }
    catch(e) {;}
    return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
  },

  logToConsole: function (msg) {
    if (gSmartTemplate.Util.ConsoleService === null)
      gSmartTemplate.Util.ConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
                  .getService(Components.interfaces.nsIConsoleService);
    gSmartTemplate.Util.ConsoleService.logStringMessage("gSmartTemplate " + this.logTime() + "\n"+ msg);
  },

  // flags
  // errorFlag    0x0   Error messages. A pseudo-flag for the default, error case.
  // warningFlag    0x1   Warning messages.
  // exceptionFlag  0x2   An exception was thrown for this case - exception-aware hosts can ignore this.
  // strictFlag     0x4
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
    if (gSmartTemplate.Preferences.Debug)
      this.logToConsole(msg);
  },

  logDebugOptional: function (option, msg) {
    if (gSmartTemplate.Preferences.isDebugOption(option))
      this.logToConsole(msg);
  },  

  // dedicated function for email clients which don't support tabs
  // and for secured pages (donation page).
  openLinkInBrowserForced: function(linkURI) {
    let Ci = Components.interfaces;
    try {
      this.logDebug("openLinkInBrowserForced (" + linkURI + ")");
      if (gSmartTemplate.Util.Application==='SeaMonkey') {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
        var browser = windowManager.getMostRecentWindow( "navigator:browser" );
        if (browser) {
          let URI = linkURI;
          setTimeout(function() {  browser.currentTab = browser.getBrowser().addTab(URI); if (browser.currentTab.reload) browser.currentTab.reload(); }, 250);
        }
        else {
          this.getMail3PaneWindow().window.openDialog(getBrowserURL(), "_blank", "all,dialog=no", linkURI, null, 'gSmartTemplate');
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
    if (gSmartTemplate.Util.Application === 'Thunderbird') {
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

    if (gSmartTemplate.Util.Application==='SeaMonkey' || gSmartTemplate.Util.Application==='Postbox')
    {
      this.openLinkInBrowserForced(URL);
      if(null!=evt) evt.stopPropagation();
    }
    else {
      if (this.openURLInTab(URL) && null!=evt) {
        if (evt.preventDefault)  evt.preventDefault();
        if (evt.stopPropagation)  evt.stopPropagation();
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
        sTabMode = (gSmartTemplate.Util.Application === "Thunderbird" && gSmartTemplate.Util.Appver >= 3) ? "contentTab" : "3pane";
        tabmail.openTab(sTabMode,
        {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, gSmartTemplate_TabURIregexp._thunderbirdRegExp);"});
      }
      else {
        window.openDialog("chrome://messenger/content/", "_blank",
                  "chrome,dialog=no,all", null,
        { tabType: "contentTab", tabParams: {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, gSmartTemplate_TabURIregexp._thunderbirdRegExp);", id:"gSmartTemplate_Weblink"} } );
      }
    }
    catch(e) { return false; }
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
    var version = gSmartTemplate.Util.VersionSanitized;

    var sPrompt = gSmartTemplate.Util.getBundleString("gSmartTemplate.confirmVersionLink", "Display version history for smartTemplate4")
    if (!ask || confirm(sPrompt + " " + version + "?")) {
      gSmartTemplate.Util.openURL(null, "http://smarttemplate4.mozdev.org/version.html#" + version);
    }
  } ,
  
  showDonatePage: function () {
    gSmartTemplate.Util.openURLInTab('http://smarttemplate4.mozdev.org/donate.html');
  }  ,
  
  showHomePage: function () {
    gSmartTemplate.Util.openURLInTab('http://smarttemplate4.mozdev.org/index.html');
  }
};

;