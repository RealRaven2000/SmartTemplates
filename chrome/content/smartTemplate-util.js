"use strict";

/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK
*/

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

var SmartTemplate4_TabURIregexp = {
	get _thunderbirdRegExp() {
		delete this._thunderbirdRegExp;
		return this._thunderbirdRegExp = new RegExp("^https://smarttemplates.quickfolders.org");
	}
};

SmartTemplate4.Util = {
	ADDON_ID: "smarttemplate4@thunderbird.extension",
  ADDON_TITLE: "SmartTemplates",
	mAppver: null,
	mAppName: null,
	mHost: null,
	mExtensionVer: null,
	ConsoleService: null,
	lastTime: 0,
	AMOHomepage:      "https://addons.thunderbird.net/thunderbird/addon/324497/",
	PremiumFeaturesPage: "https://smarttemplates.quickfolders.org/premium.html",
	VariablesPage:    "https://smarttemplates.quickfolders.org/variables.html",
	SupportHomepage:  "https://smarttemplates.quickfolders.org/index.html",
	BugPage:          "https://smarttemplates.quickfolders.org/bugs.html",
	LicensePage:      "https://smarttemplates.quickfolders.org/contribute.html",
  DonationsPage:    "https://smarttemplates.quickfolders.org/contribute.html#donate",
	VersionPage:      "https://smarttemplates.quickfolders.org/version.html",
	StationeryHelpPage: "https://smarttemplates.quickfolders.org/stationery.html",
	AxelAMOPage:      "https://addons.thunderbird.net/thunderbird/user/66492/",
	MarkyAMOPage:     "https://addons.thunderbird.net/thunderbird/user/2448736/",
	ArisAMOPage:      "https://addons.thunderbird.net/firefox/user/5641642/",
	Tool8AMOPage:     "https://addons.thunderbird.net/thunderbird/user/5843412/",
	NoiaHomepage:     "http://carlitus.deviantart.com/",
	FlagsHomepage:    "http://flags.blogpotato.de/",
	BeniBelaHomepage: "http://www.benibela.de/",
	YouTubePage:      "https://www.youtube.com/channel/UCCiqw9IULdRxig5e-fcPo6A",
	
  // Utils is used to keep contact with the background and will request the current state of
  // some values during init and will update them if the background does a broadcast.
  async init() {
    const onBackgroundUpdates = (data) => {
      if (data.licenseInfo) {
        SmartTemplate4.Util.licenseInfo = data.licenseInfo;
        SmartTemplate4.Util.logDebugOptional("notifications", "onBackgroundUpdates - dispatching licenseInfo ");
        const event = new CustomEvent("SmartTemplates.BackgroundUpdate");
        window.dispatchEvent(event); 
      }
      // Event forwarder - take event from background script and forward to windows with appropriate listeners
      if (data.event) {
        if (!data.hasOwnProperty("window") || data.window.includes(window.document.location.href.toString())) {
          SmartTemplate4.Util.logDebugOptional("notifications", 
            `onBackgroundUpdates - dispatching custom event SmartTemplates.BackgroundUpdate.${data.event}\n` +
            `into ${window.document?.location.href.toString()}`);
          const event = new CustomEvent(`SmartTemplates.BackgroundUpdate.${data.event}`, {detail: data.detail});
          window.dispatchEvent(event); 
        }       
      }      
    } 
    SmartTemplate4.Util.logDebugOptional("notifications","Util.init() STARTS... in window " + window.location)
    SmartTemplate4.Util.notifyTools.registerListener(onBackgroundUpdates);
    SmartTemplate4.Util.logDebugOptional("notifications","After notifyTools.registerListener.");
    
    // SmartTemplate4.composer.onLoad happens here!!!! (too early!!!)
    // can we register the Listener later? 
    // Or do we need it to call the following notifyBackground functions?
    
    SmartTemplate4.Util.licenseInfo = await SmartTemplate4.Util.notifyTools.notifyBackground({ func: "getLicenseInfo" });
    SmartTemplate4.Util.logDebugOptional("notifications","After notifyTools.getLicenseInfo", SmartTemplate4.Util.licenseInfo);
    SmartTemplate4.Util.platformInfo = await SmartTemplate4.Util.notifyTools.notifyBackground({ func: "getPlatformInfo" });
    SmartTemplate4.Util.logDebugOptional("notifications","After notifyTools.getPlatformInfo");
    SmartTemplate4.Util.browserInfo = await SmartTemplate4.Util.notifyTools.notifyBackground({ func: "getBrowserInfo" });
    SmartTemplate4.Util.addonInfo = await SmartTemplate4.Util.notifyTools.notifyBackground({ func: "getAddonInfo" });
    SmartTemplate4.Util.logDebugOptional("notifications","After notifyTools.getAddonInfo", SmartTemplate4.Util.addonInfo);
    SmartTemplate4.Util.logDebugOptional("notifications",
    {
      platformInfo: SmartTemplate4.Util.platformInfo,
      browserInfo: SmartTemplate4.Util.browserInfo,
      addonInfo: SmartTemplate4.Util.addonInfo,
    });
    
  },

  // special function for displaying the popup on the SmartTemplates toolbar button
  showToolbarPopup: function() {
    let button = document.querySelector("button[extension='smarttemplate4@thunderbird.extension']");
    if (!button) return;
    let p = button.querySelector("menupopup[data-action-menu]");
    if (p) {
      p.targetNode = button; 
      p.openPopup(button,'after_start', 0, -1,true,false); // no event
    }    
  },  	
  
  get mainInstance() {
    return this.Mail3PaneWindow.SmartTemplate4;
  } ,
	
	get CurrentEditor() {
		if (typeof GetCurrentEditor == 'function')
			return GetCurrentEditor();
		this.logDebug("CurrentEditor failed!");
		return null;
	} ,

	get globalComposeType() {
    return gComposeType; // global variable from Composer window, fallback only
	},

	get tabmail() {
		let doc = this.Mail3PaneWindow.document,
		    tabmail = doc.getElementById("tabmail");
		return tabmail;
	} ,	

	get tabContainer() {
		try{
			return this.tabmail.tabContainer;
		}
		catch(ex) {
			return null;
		}
	} ,	

	// not (yet) used:
	getControllerFromComposeType(composeType) {
		const msgComposeType = Ci.nsIMsgCompType;
		switch (composeType) {
			case msgComposeType.Template: // new type for 1.6 - Thunderbird 52 uses this in "Edit As New" case
				return "cmd_newMessage";
			// new message -----------------------------------------
			case msgComposeType.New:
			case msgComposeType.NewsPost:
			case msgComposeType.MailToUrl:
				return "cmd_newMessage";

			// reply message ---------------------------------------
			case msgComposeType.Reply:
			case msgComposeType.ReplyToSender:
				return "cmd_reply";
			case msgComposeType.ReplyAll:
				return "cmd_replyAll";

			case msgComposeType.ReplyToGroup:
			case msgComposeType.ReplyToSenderAndGroup:
			case msgComposeType.ReplyToList:
				return "cmd_replyList";

			// forwarding message ----------------------------------
			case msgComposeType.ForwardAsAttachment:
				return "cmd_forward";

			case msgComposeType.ForwardInline:
				return "cmd_forwardInline";

			// do not process -----------------------------------
			// (Draft:9/ReplyWithTemplate:12)
			case msgComposeType.Draft:
				return "cmd_newMessage";

			case msgComposeType.EditAsNew: 
				return "cmd_newMessage";

			case msgComposeType.EditTemplate: 
				return "cmd_newMessage";

			default:
				return ""; // unknown
		}		
	},

	getAnonymousNodes(doc,el) {
		let aN = [];
		for (let i = el.childNodes.length-1; i>0; i--) {
		  if (!el.childNodes[i].getAttribute("id") && !el.childNodes[i].getAttribute("name"))
        aN.push(el);
		}
		return aN;
  } ,


  getAnonymousElementByAttribute(el, attrName, attrValue) {
		//let aN = [];
		for (let i = el.childNodes.length-1; i>0; i--) {
      let child = el.childNodes[i];
      if (child.getAttribute("id")) // anonymous - should we add name, too?
        continue;
			if (child.getAttribute(attrName ) == attrValue ) 
        return child; 
      if (child.childElementCount) {
        let x = this.getAnonymousElementByAttribute(child, attrName, attrValue);
        if (x) return x;
      }
		}
		return null;
  } ,


  /* premiumFeatures: array of premium function used during getProcessedText calls.
   * this gathers all into a single consolidated notification.	
	 */
	premiumFeatures: new Array(),  // only the array in the main instance Util will be used
	addUsedPremiumFunction: function addUsedPremiumFunction(f) {
		if (!SmartTemplate4.Util.premiumFeatures.some(e => e == f))
			SmartTemplate4.Util.premiumFeatures.push(f);
	},
	
	clearUsedPremiumFunctions: function clearUsedPremiumFunctions() {
		while (SmartTemplate4.Util.premiumFeatures.length) {
			SmartTemplate4.Util.premiumFeatures.pop();
		}
	},
	
	get mailDocument() {
	  return gMsgCompose.editor.document;
	} ,
	
	getComposeType: function() {
		const Ci = Components.interfaces;
		let msgComposeType = Ci.nsIMsgCompType,
		    st4composeType = '';
		
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
				let messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
				let msgDbHdr = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).QueryInterface(Ci.nsIMsgDBHdr);
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
		SmartTemplate4.Util.logDebugOptional('functions', 'getComposeType: gMsgCompose.type = ' + gMsgCompose.type + ' (' + st4composeType + ')');
		return st4composeType;

	} ,

	isComposeTypeIsForwardInline: function() {
		const Ci = Components.interfaces;
		return gMsgCompose.type === Ci.nsIMsgCompType.ForwardInline;		
	},
	
	getBundleString: function(id, substitions = []) {
    // [mx-l10n]
    let localized = SmartTemplate4.Util.extension.localeData.localizeMessage(id, substitions);
    
		let theText = "";
		if (localized) {
			theText = localized;
		}
		else {
			theText = "Error in getBundleString";
			this.logToConsole ("Could not retrieve bundle string: " + id + "");
		}
		// theText = theText.replace("&lt;","<");
		return theText;
	} ,
  
  localize: function(window, buttons = null) {
		Services.scriptloader.loadSubScript(
		  SmartTemplate4.Util.extension.rootURI.resolve("chrome/content/i18n.js"),
		  window,
		  "UTF-8"
		);
	  window.i18n.updateDocument({extension: SmartTemplate4.Util.extension});
		if (buttons) {
			for (let [name, label] of Object.entries(buttons)) {
		    window.document.documentElement.getButton(name).label =  SmartTemplate4.Util.extension.localeData.localizeMessage(label); // apply
			}
		}
  } ,  

  get document3pane() {
    return window.gTabmail.currentTabInfo.chromeBrowser.contentDocument;
  } ,

  get documentMessageBrowser() {
		let win = window.gTabmail.currentAboutMessage;
		if (!win) return null;
		if (!win.document) return null;
		return win.document; 
	},

	// retrieves either the main unified toolbar button or the current command button of the header pane
	getCommandsButton: function (type) {
		switch (type) {
			case "unified":
				return document.querySelector("button[extension='smarttemplate4@thunderbird.extension']");
		  case "message_action":
				let doc = this.documentMessageBrowser;
			  return doc.querySelector("#smarttemplate4_thunderbird_extension-messageDisplayAction-toolbarbutton");
		}
		return null;
	},

  get threadPane() { 
    return this.document3pane.querySelector("#threadPane");
  } ,	

	get Mail3PaneWindow() {
		let windowManager = Services.wm,
		    win3pane = windowManager.getMostRecentWindow("mail:3pane");
		return win3pane;
	} ,

	get AppverFull() {
		let appInfo = Services.appinfo;
		return appInfo.version;
	},

	get Appver() {
		if (null === this.mAppver) {
			let appVer=this.AppverFull; // no more truncation
			this.mAppver = parseFloat(appVer).toString(); // quick n dirty!
		}
		return this.mAppver;
	},

	get Application() {
		if (null===this.mAppName) {
		let appInfo = Services.appinfo;
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
			let runTime = Services.appinfo;
			let osString = runTime.OS;
			this.mHost = osString.toLowerCase();
			// 
			if (window.navigator) {
				this.mHost = window.navigator.oscpu;
      }
			
			if (runTime.inSafeMode) {
				this.mHost += ' [Safe Mode]';
      }
		}
		return this.mHost; // linux - winnt - darwin
	},
	
	get isLinux() {
    // https://developer.mozilla.org/en-US/docs/OS_TARGET
    return (Services.appinfo.OS.indexOf('Linux')>=0);
  } ,

	get Version() {
    if (SmartTemplate4.Util.addonInfo) {
      SmartTemplate4.Util.logDebug("Version() getter. addonInfo:", SmartTemplate4.Util.addonInfo);
      return SmartTemplate4.Util.addonInfo.version;    
    }
    return "?"; // if we log this too early (before Util.init() is complete)
	} ,

	get VersionSanitized() {
		function strip(version, token) {
			let cutOff = version.indexOf(token);
			if (cutOff > 0) { 	// make sure to strip of any pre release labels
				return version.substring(0, cutOff);
			}
			return version;
		}

		let pureVersion = strip(SmartTemplate4.Util.Version, 'pre');
		pureVersion = strip(pureVersion, 'beta');
		pureVersion = strip(pureVersion, 'alpha');
		return strip(pureVersion, '.hc');
	},

  getIdentityKey  :  function getIdentityKey(doc) {
    let selected = doc.getElementById("msgIdentity").selectedItem;
    if (!selected) return "";
    let key = selected.getAttribute("identitykey");  // Tb 38.*
    if (!key)
        key = selected.getAttribute("value"); // Tb 31.*
    return key;
  }, 
  
	popupAlert: function (title, text, icon) {
		try {
			if (!icon)
				icon = "chrome://smarttemplate4/content/skin/icon32x32.png";
			Components.classes['@mozilla.org/alerts-service;1'].
								getService(Components.interfaces.nsIAlertsService).
								showAlertNotification(icon, title, text, false, '', null);
		}
		catch(e) {
			// prevents runtime error on platforms that don't implement nsIAlertsService
		}
	},
  
  /* SmartTemplate4 Pro / licensing features */
	// default to isRegister from now = show button for buying a license.
	// was popupProFeature, now renamed to popupLicenseNotification
	// isProFeature = true - show notification based on function used
	//              = false - show fact that a license is needed.
	popupLicenseNotification: function (featureList, isRegister, isProFeature, additionalText) {
		const util = SmartTemplate4.Util;
		let notifyBox,
				featureName = '',
				isList = false,
				hasLicense = util.hasLicense(),  // validation=false
				isStandardLicense = false;
				
		if (SmartTemplate4.Preferences.isDebugOption('premium.testNotification')) {
			util.logToConsole("Testing license warning - to restore normal validation of your license, please reset extensions.smartTemplate4.debug.premium.testNotification");
			hasLicense=false;
		}
				
    if (hasLicense) {
			if (isProFeature && util.hasStandardLicense)
				isStandardLicense = true; // popup for pro features
			else return;
		}
		
		// show no license reminder if user has standard license, unless this is a "pro feature" warning
		if (!isProFeature && isStandardLicense) return; 
		
		
		if (typeof featureList == 'string') {
			featureName = featureList;
		}
		else { // Array
			featureName = featureList.join('|'); // we use this in the referrer URL, but might need to concatenate.
			if (featureList.length > 1)
				isList=true;
		}
		
		util.logDebug('popupLicenseNotification(' + featureName + ')' );
		
		if (typeof specialTabs == 'object' && specialTabs.msgNotificationBar) { // Tb 68
			notifyBox = specialTabs.msgNotificationBar;
		}
		else if(typeof gNotification == 'object' && gNotification.notificationbox) { // Tb 68
			notifyBox = gNotification.notificationbox;
		}
		else {
      if (window.location.toString().endsWith("messengercompose.xhtml")) {
        notifyBox = gComposeNotification || document.getElementById ("attachmentNotificationBox"); // Tb91 vs 78
      }
			// composer/dialog windows fallback - show in main window if notification is not available in this window
			if (!notifyBox) { 
        notifyBox = util.Mail3PaneWindow.specialTabs.msgNotificationBar;        
			}
		}
		let title, theText, featureTitle='';
		if (isProFeature) {
			title = util.getBundleString("st.notification.premium.title");
			theText = 
				  isList 
						? util.getBundleString("st.notification.premium.text.plural")
						: util.getBundleString("st.notification.premium.text");
        featureTitle = 
				  isList ? featureList.join(', ') : featureName; // nice l10n name for pro features

			theText = theText.replace ("{1}", "'" + featureTitle + "'");
			if (additionalText)
				theText = theText + '  ' + additionalText;
		}
		else {
			title = "Licensing";
			theText = util.getBundleString("st.notification.license.text");
			let txtGracePeriod = util.gracePeriodText(util.licenseInfo.trialDays); 
			theText = theText + '  ' + txtGracePeriod;
		}
		
		let regBtn,
        hotKey = util.getBundleString("st.notification.premium.btn.hotKey"),
				nbox_buttons = [];
				
		switch(SmartTemplate4.Util.licenseInfo.status) {
			case "Expired":
				regBtn = util.getBundleString("st.notification.premium.btn.renewLicense");
			  break;
			default:
			  if (SmartTemplate4.Util.licenseInfo.keyType==2) { // standard license
					regBtn = util.getBundleString("st.notification.premium.btn.upgrade");
					hotKey = util.getBundleString("st.notification.premium.btn.upgrade.hotKey");
				}
				else
					regBtn = util.getBundleString("st.notification.premium.btn.getLicense");
		}
				
		if (!notifyBox) {
			alert("no notification");
			return;
		}
		let notificationKey = 
			(isProFeature) ? "SmartTemplate4-proFeature" : "SmartTemplate4-license";
		// let's force additional notifications for Pro features
		if (!isProFeature && notifyBox.getNotificationWithValue(notificationKey)) {
			// notification is already shown on screen.
			util.logDebug('notifyBox for [' + notificationKey + '] is already displayed, no action necessary.');
			return;
		}
		util.logDebug('Showing notifyBox for [' + notificationKey + ']...');
		
		// registration button
		if (isRegister) {
			nbox_buttons.push(
				{
					label: regBtn,
					accessKey: hotKey,   
					callback: function() {  
						util.showLicenseDialog(featureName); 
					},
					popup: null
				}
			)
		}
		
		// licensing buttons
		if (!isProFeature) {
			let donateMsg = util.getBundleString("st.notification.licensing");
			nbox_buttons.push(
				{
					label: donateMsg,
					accessKey: null, 
					callback: function() { 
						const theUtil = util.mainInstance.Util;
						theUtil.showLicensePage(); 
						// remove this message?
						// let item = notifyBox.getNotificationWithValue(notificationKey);
						// notifyBox.removeNotification(item, false);
					},
					popup: null
				}
			)
			// remind me later checkbox?
		}

		if (notifyBox) {
			let item = notifyBox.getNotificationWithValue(notificationKey);
			if (item)
				notifyBox.removeNotification(item, false);
		}
	
		// the standard license warning will be always shown on top of the other ones [PRIORITY_WARNING_HIGH]
		// it contains the number of free / trial days left
		const imgSrc = isProFeature ? "chrome://smarttemplate4/content/skin/proFeature.png" : "chrome://smarttemplate4/content/skin/licensing.png";
		
		let newNotification;
		if (notifyBox.shown) { // new notification format (Post Tb 99)
			newNotification = 
				notifyBox.appendNotification( 
					notificationKey, // "String identifier that can uniquely identify the type of the notification."
					{
						priority: isProFeature ? notifyBox.PRIORITY_INFO_HIGH : notifyBox.PRIORITY_WARNING_HIGH,
						label: theText,
						eventCallback: null
					},
					nbox_buttons
				);
		} else {
			newNotification = 
				notifyBox.appendNotification( 
					theText, 
					notificationKey, 
					imgSrc, 
					isProFeature ? notifyBox.PRIORITY_INFO_HIGH : notifyBox.PRIORITY_WARNING_HIGH, 
					nbox_buttons );
		}

		// setting img was removed in Tb91  
		if (newNotification.messageImage.tagName == "span") {
			let container = newNotification.shadowRoot.querySelector(".container");
			if (container) {
				let im = document.createElement("img");
				im.setAttribute("src", imgSrc);
				container.insertBefore(im, newNotification.shadowRoot.querySelector(".icon"));
			}
		}

	},  	

  // replaces Util.Licenser.showDialog(featureName);
  showLicenseDialog: function showLicenseDialog(featureName) {
		let params = {inn:{referrer:featureName, instance: SmartTemplate4}, out:null};
		SmartTemplate4.Util.Mail3PaneWindow.openDialog(
      "chrome://SmartTemplate4/content/register.xhtml",
      "smarttemplate4-register",
      "chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply",
      SmartTemplate4,
      params).focus();    
  },
  
	showStatusMessage: function(s) {
		try {
			let sb = this.Mail3PaneWindow.document.getElementById('status-bar');
			let el, sbt;
			if (sb) {
				for (let i = 0; i < sb.childNodes.length; i++)
				{
					el = sb.childNodes[i];
					if (el.nodeType === 1 && el.id === 'statusTextBox') {
						sbt = el;
							break;
					}
				}
				for (let i = 0; i < sbt.childNodes.length; i++)
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
	
  gracePeriodText: function gracePeriodText(days) {
    let txt = (days>=0) ?
      this.getBundleString("st.trialDays").replace("{0}", days) :
      this.getBundleString("st.trialExpiry").replace("{0}", -days);
    return txt;
  },
  
	debugVar: function debugVar(value) {
		let str = "Value: " + value + "\r\n";
		for (let prop in value) {
			str += prop + " => " + value[prop] + "\r\n";
		}
		this.logDebug(str);
	},

	logTime: function() {
		let timePassed = '';
    let end;
		try { // AG added time logging for test
			end = new Date();
			let endTime = end.getTime();
			if (this.lastTime === 0) {
				this.lastTime = endTime;
				return "[logTime init]";
			}
			let elapsed = new String(endTime - this.lastTime); // time in milliseconds
			timePassed = '[' + elapsed + ' ms]	 ';
			this.lastTime = endTime; // remember last time
		}
		catch(e) {;}
		return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
	},
  
  // first argument is the option tag
  logWithOption: function logWithOption(a) {
    arguments[0] =  "SmartTemplates "
      +  '{' + arguments[0].toUpperCase() + '} ' 
      + SmartTemplate4.Util.logTime() + "\n";
    console.log(...arguments);
  },  

	logToConsole: function (a) {
		const util = SmartTemplate4.Util;
    let msg = "SmartTemplates " + util.logTime() + "\n";
    console.log(msg, ...arguments);
  },

	// flags
	// errorFlag		  0x0 	Error messages. A pseudo-flag for the default, error case.
	// warningFlag		0x1 	Warning messages.
	// exceptionFlag	0x2 	An exception was thrown for this case - exception-aware hosts can ignore this.
	// strictFlag 		0x4
	logError: function (aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags)
	{
		let aCategory = "component javascript", // was: chrome javascript
		    scriptError = Components.classes["@mozilla.org/scripterror;1"].createInstance(Components.interfaces.nsIScriptError);
		scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
		Services.console.logMessage(scriptError);
	} ,

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

	logDebug: function (msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (SmartTemplate4.Preferences.isDebug && SmartTemplate4.Preferences.isDebugOption('default'))
			this.logToConsole(...arguments);
	},

  logIssue213: function(txt) {
		// Log missing items for Conversion to Thunderbird 115
    console.log(`SmartTemplates %c[issue 213] to do: %c${txt}`, "color:red", "background: darkblue; color:white;");
  },

	// optional logging for important points in flow.
	logHighlightDebug: function(txt, color="white", background="rgb(80,0,0)", ...args) {
		if (SmartTemplate4.Preferences.isDebug) {
			console.log(`SmartTemplates %c${txt}`, `color: ${color}; background: ${background}`, ...args);
		}
	},

	// forced highlight colored logging
	logHighlight: function(txt, color="white", background="rgb(80,0,0)", ...args) {
		console.log(`SmartTemplates %c${txt}`, `color: ${color}; background: ${background}`, ...args);
	},

	logDebugOptional: function (optionString, msg) {
    optionString = arguments[0];
    let options = optionString.split(','); // allow multiple switches
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (SmartTemplate4.Preferences.isDebugOption(option)) {
        this.logWithOption(...arguments);
        break; // only log once, in case multiple log switches are on
      }
    }
	},
	
	getTabInfoLength: function getTabInfoLength(tabmail) {
		if (tabmail.tabInfo)
		  return tabmail.tabInfo.length;
	  if (tabmail.tabOwners)
		  return tabmail.tabOwners.length;
		return null;
	} ,
	
	getTabInfoByIndex: function getTabInfoByIndex(tabmail, idx) {
		if (tabmail.tabInfo)
			return tabmail.tabInfo[idx];
		if (tabmail.tabOwners)
		  return tabmail.tabOwners[idx];
		return null;
	} ,
	
	getTabMode: function getTabMode(tabInfo) {
    // Tb 115: mailMessageTab or mail3PaneTab for mail related tabs
	  if (tabInfo && tabInfo.mode) {   // Tb / Sm
			return tabInfo.mode.name;
		}
		return "";
	},

  // @tabInfo - tabInfo object
  // @type - one of "folder", "message", "search", "mail" (for folders+single messages), "other"
  isTabMode: function(tabInfo, type) {
    if (!tabInfo) return false;
    switch (tabInfo.mode.name) {
      case "mail3PaneTab":
        return (["folder","mail"].includes(type));
      case "mailMessageTab":
        return (["folder","message", "mail"].includes(type));
      case "glodaSearch": case "glodaSearch-result":
        return (["search"].includes(type));
      default:
        return (["other"].includes(type));
    }
  },	

	getMessageBrowserDocument: function() {
		// isSingleMessageWindow ? 
		if (window.document.URL.endsWith("messageWindow.xhtml")){
			return  window.messageBrowser.contentDocument; // about:message
		}

    let currentTabMode = gTabmail.selectedTab?.mode?.name; // SmartTemplate4.Util.getTabMode();
    switch (currentTabMode) { // there are tab modes that have no access to document3pane! e.g. contentTab
      case "mailMessageTab":
        return SmartTemplate4.Util.document3pane;
      case "mail3PaneTab":
        let browser = SmartTemplate4.Util.document3pane.getElementById("messageBrowser");
        return browser.contentDocument; 
    }
		return null;
	},
	
	getBaseURI: function (URL) {
		let hashPos = URL.indexOf('#'),
				queryPos = URL.indexOf('?'),
				baseURL = URL;
				
		if (hashPos>0)
			baseURL = URL.substr(0, hashPos);
		else if (queryPos>0)
			baseURL = URL.substr(0, queryPos);
		if (baseURL.endsWith('/'))
			return baseURL.substr(0, baseURL.length-1); // match "x.com" with "x.com/"
		return baseURL;		
	} ,
	
	// dedicated function for email clients which don't support tabs
	// and for secured pages (donation page).
	openLinkInBrowserForced: function(linkURI) {
		const Ci = Components.interfaces,
		      Cc = Components.classes,
		      util = SmartTemplate4.Util;
		try {
			this.logDebug("openLinkInBrowserForced (" + linkURI + ")");
		  linkURI = 
			  linkURI.includes("smarttemplates.") ? util.makeUriPremium(linkURI) : linkURI;

			let service = Cc["@mozilla.org/uriloader/external-protocol-service;1"].getService(Ci.nsIExternalProtocolService),
			    ioservice = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
			    uri = ioservice.newURI(linkURI, null, null);
			service.loadURI(uri);
		}
		catch(e) { this.logDebug("openLinkInBrowserForced (" + linkURI + ") " + e.toString()); }
	},


	// moved from options.js
	// use this to follow a href that did not trigger the browser to open (from a XUL file)
	openLinkInBrowser: function(evt, linkURI) {
		const Cc = Components.classes,
		      Ci = Components.interfaces,
					util = SmartTemplate4.Util;
		let service = Cc["@mozilla.org/uriloader/external-protocol-service;1"]
			.getService(Ci.nsIExternalProtocolService);
		let ioservice = Cc["@mozilla.org/network/io-service;1"].
					getService(Ci.nsIIOService);
		// only add premium info if it is one of the support pages.
		let uri = 
			linkURI.includes("smarttemplates.") ? util.makeUriPremium(linkURI) : linkURI;
		service.loadURI(ioservice.newURI(uri, null, null));
		
		if(null !== evt) { evt.stopPropagation(); }			
	},


	openURLWithEvent: async function(URL,evt) {
		const util = SmartTemplate4.Util;
    if (await util.openURLInTab.call(util,URL) && null!=evt) {
			// workaround for a bug in TB3 that causes href's not be followed anymore.
      if (evt.preventDefault)  evt.preventDefault();
      if (evt.stopPropagation)	evt.stopPropagation();
    }
	} ,


	// moved from options.js (then called
	openURL: async function(URL) { 
		const util = SmartTemplate4.Util;
		return await util.openURLInTab.call(util, URL);
	},

	openURLInTab: async function (URL) {
		try {
			URL = SmartTemplate4.Util.makeUriPremium(URL);

			// use API. Look Ma, no tabmail!
			// getBaseURI to check if we already opened the page and need to 
			// jump to a different anchor.
			await SmartTemplate4.Util.notifyTools.notifyBackground(
				{ 
					func: "openLinkInTab", 
					URL: URL, 
					baseURI: SmartTemplate4.Util.getBaseURI(URL)
				}
			);
			return true;
		}
		catch(e) {
			SmartTemplate4.Util.logException('openURLInTab(' + URL + ')', e);
			return false;
		}
	} ,

	versionGreaterOrEqual: function(a, b) {
		/*
			Compares Application Versions
			returns
			- is smaller than 0, then A < B
			-  equals 0 then Version, then A==B
			- is bigger than 0, then A > B
		*/
		let versionComparator = Services.vc;
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
		let versionComparator = Services.vc;
		return (versionComparator.compare(a, b) < 0);
	} ,


	showVersionHistory: function(ask) {
		let mainWindow = SmartTemplate4.Util.Mail3PaneWindow,
		    util = mainWindow.SmartTemplate4.Util,
		    version = util.VersionSanitized,
		    sPrompt = util.getBundleString("st.confirmVersionLink")+" [version {1}]";
		sPrompt = sPrompt.replace("{1}", version);
		if (!ask || confirm(sPrompt)) {
			util.openURL(util.VersionPage + "#" + version);
			return true;
		}
		return false;
	} ,

	showBugsAndFeaturesPage: function() {
		SmartTemplate4.Util.openURL(this.BugPage);
	} ,

	showLicensePage: function () { SmartTemplate4.Util.openURL(this.LicensePage); } ,
	showHomePage: function () { SmartTemplate4.Util.openURL(this.AMOHomepage); } ,
	showSupportPage: function () { 
		SmartTemplate4.Util.openLinkInBrowserForced(this.SupportHomepage); 
	} ,
	showVariablesPage: function () { 
		SmartTemplate4.Util.openLinkInBrowserForced(this.VariablesPage); 
	} ,
	showPremiumFeatures: function () { 
		SmartTemplate4.Util.openLinkInBrowserForced(this.PremiumFeaturesPage); 
	} ,
	showYouTubePage: function () { SmartTemplate4.Util.openLinkInBrowserForced(this.YouTubePage); } ,
	showAxelAMOPage: function () { SmartTemplate4.Util.openURL(this.AxelAMOPage); } ,
	showMarkyAMOPage: function () { SmartTemplate4.Util.openURL(this.MarkyAMOPage); } ,
	showArisAMOPage: function () { SmartTemplate4.Util.openURL(this.ArisAMOPage); } ,
	showTool8AMOPage: function () { SmartTemplate4.Util.openURL(this.Tool8AMOPage); } ,
	showNoiaHomepage: function () { SmartTemplate4.Util.openURL(this.NoiaHomepage); } ,
	showFlagsHomepage: function () { SmartTemplate4.Util.openURL(this.FlagsHomepage); } ,
	showStationeryHelpPage: function (inPageLink) { 
    let urlLink = inPageLink ? ("#" + inPageLink) : "";
    SmartTemplate4.Util.openURL(this.StationeryHelpPage + urlLink); 
  } ,
	showBeniBelaHomepage: function () { SmartTemplate4.Util.openURL(this.BeniBelaHomepage); } ,
	

	showAboutConfig: function(clickedElement, filter) {
		const name = "Preferences:ConfigManager",
		      mediator = Services.wm,
          isTbModern = SmartTemplate4.Util.versionGreaterOrEqual(SmartTemplate4.Util.AppverFull, "85"),
          uri = (isTbModern) ? "about:config": "chrome://global/content/config.xhtml?debug";
		
		let w = mediator.getMostRecentWindow(name),
        win = (clickedElement && clickedElement.ownerDocument && clickedElement.ownerDocument.defaultView)
         		? clickedElement.ownerDocument.defaultView 
						: window;

		if (!w) {
			let watcher = Services.ww;
			w = watcher.openWindow(win, uri, name, "chrome,resizable,centerscreen,width=600px,height=350px", null);
		}
		w.focus();
    w.addEventListener('load', 
      function () {
        let id = (isTbModern) ? "about-config-search" : "textbox",
            flt = w.document.getElementById(id);
        if (flt) {
          flt.value=filter;
          // make filter box readonly to prevent damage!
					flt.setAttribute('readonly',true);
          if (w.self.FilterPrefs) {
            w.self.FilterPrefs();
          }
        }
      });
	} ,

	displayNotAllowedMessage: function(reservedWord) {
		// wrap variable in % but only if necessary
		let decoratedWord =
			((reservedWord[0] != '%') ? '%' : '')
			+ reservedWord
			+ ((reservedWord[reservedWord.length - 1] != '%') ? '%' : '');

		if (SmartTemplate4.Preferences.isDebugOption("adressbook")) {
			debugger;
		}
		let ErrorString1 = SmartTemplate4.Util.getBundleString("contextError");
		let errorText = ErrorString1.replace("{1}", decoratedWord);

		SmartTemplate4.Message.display(errorText,
		                              "centerscreen,titlebar",
		                              { ok: function() { ; }}
		);
		this.logDebug (errorText);
	} ,

	displayInvalidToken: function(reservedWord, params) {
		let theToken = `%${reservedWord+params}%`;
		console.warn("SmartTemplates - invalid token: " + theToken);
		let errorText = SmartTemplate4.Util.getBundleString("tokenError", theToken);
		SmartTemplate4.Message.display(errorText,
			"centerscreen,titlebar",
			{ ok: function() {  }}
		);
	},

	setMidnightTimer: function() {
		let today = new Date(),
		    tomorrow = new Date(today.getFullYear(),today.getMonth(),today.getDate()+1),
		    timeToMidnight = (tomorrow-today);
		var timer = setTimeout(
			function() {
				SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateNewsLabels" }); 
				SmartTemplate4.Util.setMidnightTimer();
			},
			timeToMidnight);
	},

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
				let nYear = new Date(tm.getFullYear() + 1,0,1);
				let nday = nYear.getDay() - dowOffset;
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

	isFormatLink : function(format) {
    if (!format) return false;
    if (format.charAt(0)=='(')
      format = format.slice(1);
    if (format.charAt(format.length-1)==')')
      format = format.slice(0, -1);
    
    let fs = format.split(',');
	  return (fs.indexOf('link') != -1);
	} ,
	
	getServerInfo: function(idKey) {
		let serverInfo = '';
		try {
      let found=false;
      for (let account of MailServices.accounts.accounts) {
        if (account.defaultIdentity && account.defaultIdentity.key == idKey) {
          found=true;
          let srv = account ? account.incomingServer : null;
          serverInfo = srv ? 'server{?}:      ' + srv.hostName + ' [' + srv.type + ']' + '\n ': '';
					break;
        }
      }        
		}
		catch(ex) { this.logException("could not find server for identity " + idKey , ex); }
    return serverInfo;
  },
  
  getIdentityKeyFromMail: function(email) {
    for (let account of MailServices.accounts.accounts) {
      
			for (let j = 0; j < account.identities.length; j++) {
				let identity = account.identities[j];
        if (identity.email.toLowerCase() == email.toLowerCase()) {
          return identity.key;
        }
			}
    }
    return null;    
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
		const util = SmartTemplate4.Util;
		try {
			util.logDebugOptional('regularize','getSignatureInner(' + isRemoveDashes + ')');
			if (sig != null) {
				SmartTemplate4.sigInTemplate = true;
				if (typeof sig === "string")
					return isRemoveDashes ? removeDashes(sig, true) : sig;
					
				if (!sig.children || sig.children.length==0) {
					util.logDebugOptional('regularize','getSignatureInner(): signature has no child relements.');

					return sig.innerHTML ? sig.innerHTML : 
                 (sig.outerHTML ? sig.outerHTML : '');  // deal with DOM String sig (non html)
				}
				if (isRemoveDashes) {
				  removeDashes(sig, false);
				}
				return sig.innerHTML;
			}
		}
		catch(ex) {
			util.logException('regularize.getSignatureInner() failed', ex);
		}
		return "";
	} ,
	
	// returns a list of available locales for a given package
	getAvailableLocales: function(packageName) {
		let chromeRegService = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService();
		let toolkitChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIToolkitChromeRegistry);
		let availableLocales = toolkitChromeReg.getLocalesForPackage(packageName); 
		return availableLocales;
	},
  
  toTitleCase: function toTitleCase(str) { // international version.
    let orig = str;
    try {
      let words = str.split(' ');
          
      for (let i=0; i<words.length; i++) {
        let word = words[i],
            findw = 0;
        while ("\\\"\'\{\[\(\)".indexOf(word.charAt(findw))>=0 && findw<word.length) {
          findw++; // skip these characters, so we hit alphabetics again
        }
        
        
        // Titlecase and re-append to Array
        words[i] = word.substring(0, findw)
                       .concat(word.charAt(findw).toLocaleUpperCase())
                       .concat(word.substring(findw + 1).toLocaleLowerCase());
        // deal with composite names, e.g. Klaus-Dieter
        let compositeName = words[i].split('-');
        if (compositeName.length>1) {
          let cname = '';
          for (let m=0; m<compositeName.length; m++) {
            if (m>0)
              cname += '-';
            cname += compositeName[m].charAt(0).toLocaleUpperCase() + compositeName[m].substring(1);
          }
          words[i] = cname;
        }
      }
      str = words.join(' ');
      return str;
    }
    catch(ex) {
      this.logException ("toTitleCase(" + orig + ") failed", ex);
      return orig;
    }
  } ,
	
 /**
  * @param global = true returns a regular expression from a quoted string
  *                 false returns a string from a quoted string
	*/
  unquotedRegex: function unquotedRegex(s, global) {
    if (s == "clipboard") { // [issue 183]
      if (!SmartTemplate4.Util.hasLicense()  || SmartTemplate4.Util.licenseInfo.keyType == 2) { 
        SmartTemplate4.Util.addUsedPremiumFunction("clipboard");
        return "";
      }
      return SmartTemplate4.Util.clipboardRead();
    }
		let quoteLess = s.substring(1, s.length-1);
	  if (global)
			return new RegExp( quoteLess, 'ig');
    // allow using \n and \t for new line and tabs characters
		return quoteLess.replace(/\\n/gi,"\n").replace(/\\t/gi,"\t");
	} ,

	unquoteParam: function(param) {
		if (param.startsWith('"')) {
			return param.substring(1,param.length-1);
		}
		return param;
	} ,
	
	// see MsgComposeCommands, loadBlockedImage()
	getFileAsDataURI : function getFileAsDataURI(aURL) {
		const util = SmartTemplate4.Util,
					Ci = Components.interfaces,
		      Cc = Components.classes,
          MimeService = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);
          
    let filename = aURL.substr(aURL.lastIndexOf("/") + 1);
    filename = decodeURIComponent(filename);
		util.logDebugOptional('images',"getFileAsDataURI()\nfilename=" + filename);
		
    let url = Services.io.newURI(aURL), // , null, null
        contentType;
    try {
      contentType = MimeService.getTypeFromURI(url);
    }
    catch(ex) {
      util.logException("MimeService failed to determine MIME type from url:\n"
        + "asciiSpec: " + url.asciiSpec + "\n"
        + "path: " + url.path + "\n"
        + "I cannot convert this into a data URI, therefore you may get security warnings when Composer loads content.\n"
        + "returning raw URL: " + aURL, ex);
      return aURL;
    }
    if (!contentType.startsWith("image/")) {
			util.logDebugOptional('images',"getFileAsDataURI()\nthe file is not an image\ncontentType = " + contentType);
			// non-image content-type; let Thunderbird show a warning after insertion
			return aURL;
    }

		try {
			let LoadInfoFlags = Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL   // Tb91
                      ||  Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL;         // Tb78
      let channel = 
          Services.io.newChannelFromURI(url, null, Services.scriptSecurityManager.getSystemPrincipal(), null, LoadInfoFlags, Ci.nsIContentPolicy.TYPE_OTHER);
			let stream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
			stream.setInputStream(channel.open());
			util.logDebugOptional('images',"opening image stream…");
			let encoded = btoa(stream.readBytes(stream.available()));
			stream.close();
			let encodedFileName = filename ? encodeURIComponent(filename) : "";
			util.logDebugOptional('images',"stream read. Adding data, including encoded filename part: " + encodedFileName);
			return "data:" + contentType + (filename ? ";filename=" + encodedFileName : "") + ";base64," + encoded;
		}
		catch (ex) {
			this.logToConsole("could not decode file: " + filename + "\n" + ex.toString());
			return aURL;
		}
  } ,
	
  isFilePathAbsolute : function isFilePathAbsolute(path) {
    if (!path) return false;
     
    // check for user folder / drive letter or double slash
    return (path.toLowerCase().startsWith('/user') || 
      /([a-zA-Z]:)/.test(path) || 
      path.startsWith("\\") || path.startsWith("/"));
  },
  
  // retrieve the folder path of a full file location (e.g. C:\user\myTemplate.html)
  // filePath - name of file or relative path of file to append or empty
  getPathFolder: function getPathFolder(path, filePath) {
    let slash = path.includes("/") ? "/" : "\\",
        noSlash = (slash=='/') ? "\\" : "/",
        fPart = path.lastIndexOf(slash),
        newPath = "",
        appendedPath = "";

		// [issue 237] allow navigating to parent folders.
		let jumpUp = 0;
    if (fPart) {
      newPath = path.substr(0,fPart);
		}
		while (filePath.startsWith("../")) {
			filePath = filePath.replace("../","");
			jumpUp++;
		}
		while (filePath.startsWith("..\\")) {
			filePath = filePath.replace("..\\","");
			jumpUp++;
		}

		let pA = newPath.split(slash);
		while (jumpUp > 0) {
			pA.pop();
			jumpUp--;
		}
		newPath = pA.join(slash);

		if (fPart) {
		  newPath = newPath + slash;
		}

    // issue 77 - %file()% path truncated at front by 1 letter on Mac OS
    if (filePath && newPath) {
      let slashUnifiedFilePath = filePath.replace(noSlash, slash);
      appendedPath = slashUnifiedFilePath.substr(slashUnifiedFilePath[0] == slash ? 1 : 0); // strip leading slash
    }
    return newPath + appendedPath;
  },
  
  // like hasPremiumLicense in QF, needs to be replaced with the notifyTools 
  hasLicense: function hasLicense(reset) {
    // ignore reset!
    return SmartTemplate4.Util.licenseInfo.status == "Valid";
  } ,
	
	get hasStandardLicense() {
    let result = (SmartTemplate4.Util.licenseInfo.keyType==2);
    SmartTemplate4.Util.logDebugOptional("premium.licenser", "util.hasStandardLicense = " + result);
    return result; // standard license - true 
	}, 
  
  get hasProLicense() {
    let result = (SmartTemplate4.Util.licenseInfo.keyType==1 || SmartTemplate4.Util.licenseInfo.keyType==0);
    SmartTemplate4.Util.logDebugOptional("premium.licenser", "util.hasProLicense = " + result);
    return result; // premium / domain license - true 
  },
	
	// appends user=pro OR user=proRenew if user has a valid / expired license
	makeUriPremium: function makeUriPremium(URL) {
		const util = SmartTemplate4.Util,
					isLicensed = SmartTemplate4.Util.hasLicense(),
					isExpired = SmartTemplate4.Util.licenseInfo.isExpired;
		try {
			let uType = "";
			if (isExpired)  {
				uType = (SmartTemplate4.Util.licenseInfo.keyType == 2) ? "std" : "proRenew";
      }
			else if (isLicensed) {
			  uType = (SmartTemplate4.Util.licenseInfo.keyType == 2) ? "std" : "pro";
      }
			// make sure we can sanitize all pages for our premium users!
      // [issue 68] After update to 2.11, SmartTemplates always displays nonlicensed support site
			if (   uType
			    && URL.indexOf("user=")==-1 
					&& URL.indexOf("smarttemplates.quickfolders.org")>0 ) {
				// remove #NAMED anchors
				let x = URL.indexOf("#"),
				    anchor = '';
				if (x>0) {
					anchor = URL.substr(x);
					URL = URL.substr(0, x)
				}
				if (URL.indexOf("?")==-1)
					URL = URL + "?user=" + uType;
				else
					URL = URL + "&user=" + uType;
				URL = URL + anchor;
			}
		}
		catch(ex) {
		}
		finally {
			return URL;
		}
	} ,
  
	viewLicense: function viewLicense() {
		let win = SmartTemplate4.Util.Mail3PaneWindow,
        params = {inn:{mode:"licenseKey", message: "", instance: win.SmartTemplate4}, out:null};
		// open options and open the last tab!
		// first param = identity (not set, unimportant)
		// second param = mode to open correct setting 
    win.openDialog('chrome://smarttemplate4/content/settings.xhtml',
				'Preferences','chrome,titlebar,centerscreen,dependent,resizable,alwaysRaised ',
				null,
				params).focus();
	}	,
	
	// HTML only:
	// headers that are currently not defined may be filled later.
	// e.g. adding a To address when writing a new email
	wrapDeferredHeader : async function wrapDeferredHeader(field, defaultValue, isHtml, isComposeNew) {
		
		const prefs = SmartTemplate4.Preferences,
		      util = SmartTemplate4.Util;
		if (prefs.isDebugOption("tokens.deferred")) debugger;
		
		let newComposeClass = isComposeNew ? " class='noWrite'" : ""; /* make field look pink for headers that are not available in New Emails */
		if (!isHtml) return defaultValue; // not supported in plain text for now
		
		SmartTemplate4.hasDeferredVars = true;
		
		if (!defaultValue) {  //  || defaultValue=='??'
			defaultValue = field;  // show the syntax of placeholder (without percent signs!)
		}
			
		// Add variables in "Write" window to standard features!
		field = field.replace(/%/g,'');

		let parensPos = field.indexOf('('),
		    generalFunction = (parensPos==-1) ? field : field.substr(0,parensPos);	

	  // instead of using title (which generates a "normal" html thumbnail)
		// let's use a new attribute st4title + CSS
		let tag = "<smarttemplate" +
					 " hdr='" + generalFunction + "'" +
					 " st4variable='" + field + "'" +
					 " st4title='" + field + "'" +
					 newComposeClass + 
					 ">" + defaultValue + "</smarttemplate>";
					 
		return tag;
	} ,
	
	// should be called when email is sent
	// [issue 284] - this is not called anymore we call cleanupDeferredFields() directly from 
	//               experiment API via SmartTemplate4.composer.beforeSend()
	composerSendMessage : async function (evt) {
		const Ci = Components.interfaces,
		      msgComposeType = Ci.nsIMsgCompType,
					nsIMsgCompDeliverMode = Ci.nsIMsgCompDeliverMode;
					
		let msgType = window.document.getElementById("msgcomposeWindow").getAttribute("msgtype");
		SmartTemplate4.Util.logDebug('composerSendMessage() - msgType=' + msgType);
		
		if (msgType == nsIMsgCompDeliverMode.Now || msgType == nsIMsgCompDeliverMode.Background || msgType == nsIMsgCompDeliverMode.Later) {
			switch (gMsgCompose.type) {
				case msgComposeType.New:
				case msgComposeType.NewsPost:
				case msgComposeType.MailToUrl:
				case msgComposeType.Reply:
				case msgComposeType.ReplyAll:
				case msgComposeType.ReplyToSender:
				case msgComposeType.ReplyToGroup:
				case msgComposeType.ReplyToSenderAndGroup:
				case msgComposeType.ReplyToList:
				case msgComposeType.ForwardAsAttachment:
				case msgComposeType.ForwardInline:
					// problem: this is now async! 
					await SmartTemplate4.Util.cleanupDeferredFields();
					break;
				default:
					return;
			}
		}
		
	} ,
  
	
	
	cleanupDeferredFields : async function(forceDelete) {
		const util = SmartTemplate4.Util,
					editor = gMsgCompose.editor;
          
  	function isQuotedNode(node) {
      if (!node) return false;
      if (node.nodeName && node.nodeName.toLowerCase() == 'blockquote') return true;
      if (!node.parentNode) return false;      
      return isQuotedNode(node.parentNode); //  if node is child of a quoted parent, it is also considered to be quoted.
    };
          
		try {
			let body = editor.rootElement,
			treeWalker = editor.document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT),
			nodeList = [];

			util.logDebug('cleanupDeferredFields()');
			while(treeWalker.nextNode()) {
				let node = treeWalker.currentNode;
				// omit all quoted material.
				if (isQuotedNode(node)) continue;
				if (node.tagName && node.tagName.toLowerCase()=='smarttemplate') {
					// update content of late deferred variables and add to nodeList for deletion
					await util.resolveDeferred(editor, node, true, nodeList); 
				}
			}	

			// replace all divs (working backwards.)
			while (nodeList.length) {
				let nL = nodeList.pop();
				if (nL.resolved) {
					nL.divNode.parentNode.insertBefore(nL.txtNode, nL.divNode);
				}
				// tidy up unresolved variables, if forced!
				if (nL.resolved || forceDelete) {
					editor.deleteNode(nL.divNode);
				}
			}
			return true;			

		}
		catch(ex) {
			util.logException("cleanupDeferredFields() failed", ex);
			return false;
		}

	} ,
	
	resolveDeferred: async function (editor, el, isReplaceField, nodeList) {
		const util = SmartTemplate4.Util;
    // [issue 204]  if no nodeList is passed in, this means we can replace immediately   
    // if (!nodeList) nodeList = []; // create a dummy node list for now.
		let div = el,
				st4 = div.getAttribute('st4variable'),
				alreadyResolved = (el.className == 'resolved'), // for removing _all_ smarttemplate divs
				resolved = false,
				tm;

		if (st4) {
			// isReplaceField is the final call where the deferred smarttemplate element is removed.
			// it's false when we click on the element (manual) so that we can refresh the content
			// multiple times
			if(!alreadyResolved || !isReplaceField) {
				let parensPos = st4.indexOf('('),
						generalFunction = (parensPos==-1) ? st4 : st4.substr(0,parensPos),
						argList = (parensPos==-1) ? "" : st4.match(/([\w-:=]+)\(([^)]+)\)*/);
				if (!generalFunction.length)
					return;
				// util.logDebugOptional('resolveDeferred','matched variable [' + i + ']: ' + matchPart[i]);
				let args=(argList.length<2) ? [] : argList[2].split(',');
				
				// 1st group: name of st4 variable, e.g. subject
				if (generalFunction=="date") generalFunction = "dateshort";
				if (generalFunction=="identity") generalFunction = "from";
				if (generalFunction=="recipient") generalFunction = "to";
        
        let composeDetails = GetComposeDetails(); // Refresh subject and address fields
        expandRecipients(); // [issue 167] - refresh lists!
        
				switch(generalFunction) {
					case 'subject':
						let sub = composeDetails.subject; // GetMsgSubjectElement();
						if (sub) {
							el.innerText = sub;
							resolved = true;
						}
						break;
					case 'from':  // fall through
					case 'to':    // fall through
					case 'cc':    // fall through
					case 'bcc':
            
						let charset = null,
								addressValue;
						
						if (generalFunction=='from') {
							addressValue = composeDetails[generalFunction];
						} else {
              // should be a comma separated string in case of multiple to / cc / bcc values
              addressValue = composeDetails[generalFunction];
						}
						
						if (addressValue) {
							// split seems to trigger a permature "send!"
							let token = await SmartTemplate4.mimeDecoder.split(addressValue, charset, argList[2], true);
							// if nothing is returned by mime decoder (e.g. empty name) we do not resolve the variable
							if (token || isReplaceField) {
								el.innerHTML = token; // [issue 186] - mimeDecoder already HTML encodes?
								resolved = true;
							}
						}
						
						break;
					case 'dateformat':
						tm = new Date();
						el.innerText = util.dateFormat(tm.getTime() * 1000, argList[2], 0);
						resolved = true;
						break;
					case "datelocal":  // fall through
					case "dateshort":
						tm = new Date(), 
						el.innerText = util.prTime2Str(tm.getTime() * 1000, generalFunction, 0);
						resolved = true;
						break;
					default:
            if (composeDetails[generalFunction]) {
              el.innerText = composeDetails[generalFunction];
            }
            else
              alert('NOT SUPPORTED: Replace deferred smartTemplate variable: %' + generalFunction + '%');
						break;
				}
			}
			
			if (alreadyResolved || resolved) {
				if (isReplaceField) {
					// called from "clean up all button"
					let txtNode = editor.document.createTextNode(el.innerText);
					if (nodeList) {
						// create an array of elements that will be replaced.
						// (can't do DOM replacements during the treeWalker)
						// replace div with a text node.
						nodeList.push ( { txtNode:txtNode, divNode: el, resolved: (alreadyResolved || resolved) } );
					}
					else { // called from context menu: remove the field and replace with content
						el.parentNode.insertBefore(txtNode, el);
						editor.deleteNode(el);
					}
				}
				else {
					el.className = "resolved";
				}
			}
      else {
				if (nodeList) {
        	nodeList.push ( { txtNode: null, divNode: el, resolved: false } );
				} else {
					util.logHighlight(`resolveDeferred(isReplaceField:${isReplaceField}) called without nodeList\n`,"white","red", el);
					util.logToConsole("Did you run template variables from smart snippets menu?\nAre you composing in plaintext mode?");
				}
      }
		}
	} ,
	
  // memorize all deferred fields <smarttemplate> of a type
	storeModifiedHeaders:  function(flags, type) {
		if (!flags.modifiedHeaders.some(e => e == type)) {
			flags.modifiedHeaders.push(type);
		}
	},
	
	// Find all remembered deferred variables and update their values once Editor is ready!
	resolveDeferredBatch: async function(editor) {
		// iterate all smartTemplates fields
		let body = editor.rootElement,
				treeWalker = editor.document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT);

		function isQuotedNode(node) {
			if (!node) return false;
			if (node.nodeName && node.nodeName.toLowerCase() == 'blockquote') return true;
			if (!node.parentNode) return false;      
			return isQuotedNode(node.parentNode); //  if node is child of a quoted parent, it is also considered to be quoted.
		};

		if (SmartTemplate4.Preferences.getMyBoolPref("deferred.autoUpdate")) {
			try {
				// let compType = SmartTemplate4.Util.getComposeType(); // do we need to know whether new or rsp/fwd case?
				while(treeWalker.nextNode()) {
					let node = treeWalker.currentNode;
					// omit all quoted material.
					if (isQuotedNode(node)) continue;
					if (node.tagName && node.tagName.toLowerCase()=='smarttemplate') {
						let hdr = node.getAttribute("hdr"); // this is the general function

						// the following variables are replaced during resolveDeferred()
						if (hdr=="identity") hdr = "from"; // perspective should always match, even when we reply / fwd!
						if (hdr=="recipient") hdr = "to";

						let v = node.getAttribute("st4variable");
						if (hdr && SmartTemplate4.PreprocessingFlags.modifiedHeaders.some((e) => e == hdr) ) {
							SmartTemplate4.Util.logDebug(`Modified Header found. Updating deferred variable ${hdr}\nst4 var = ${v}`);
							// update content of late deferred variables and add to nodeList for deletion
							await SmartTemplate4.Util.resolveDeferred(editor, node, false); 
						}
					}
				}
			}
			catch(ex) {
				SmartTemplate4.logException("resolveDeferredBatch() failed ", ex);
			}
		}
		SmartTemplate4.PreprocessingFlags.modifiedHeaders = []; // reset the headers array!
	},


	// add listeners for deferred variables (e.g. "from" in New Email)
	setupDeferredListeners: function st4_setupDeferredListeners(editor) {
		const util = SmartTemplate4.Util;
		let body = editor.rootElement,
		    el = body,
				treeWalker = editor.document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT);
				
				
		while(treeWalker.nextNode()) {
			let node = treeWalker.currentNode;
			if (node.tagName && node.tagName.toLowerCase()=='smarttemplate') {
				// add a click handler
				node.addEventListener(
					"click", 
					async function(event) { 
						await util.resolveDeferred(editor, event.target, false); 
						return false; 
					}, 
					false
				);
				
				// add context menu
				node.addEventListener(
					"contextmenu", 
					function(event) { 
					  let st4element = event.originalTarget,
					      popup = document.getElementById('SmartTemplate4-ComposerPopup'); // button.ownerDocument.getElementById
						// document.popupNode = button
						// document.getElementById('msgcomposeWindow').ownerDocument.getElementById('SmartTemplate4-ComposerPopup')
						popup.targetNode = event.target;
						popup.openPopup(st4element,'after_start', 0, 0, true, false, event);
					  event.preventDefault();
						return false; 
					}, 
					false
				);
				
			}
		}
	},
	
	removeDeferred: function removeDeferred(item) {
		let par = item.parentNode;
		gMsgCompose.editor.selection;
		// just a hack to move the cursor: insert a space, select it then remove it again.
    let space = gMsgCompose.editor.document.createTextNode('\u00a0');
		if (par) {
			par.insertBefore(space, item); 
			par.removeChild(item);
		}
		editor.selection.selectAllChildren(space);
		editor.selection.collapseToStart()
		par.removeChild(space);
	},
	
	
	checkIsURLencoded: function checkIsURLencoded(tok) {
		if (tok.length>=4) {
			let t = tok.substr(0,2); // hexcode, such as %5C
			if (/\%[0-9a-fA-F][0-9a-fA-F]/.test(t)) {
				this.logDebug("checkIsURLencoded()\n" +
				  "Ignoring character sequence as not a SmartTemplate because it looks like an URL encoded sequence:\n" +
					tok)
				return true;
			}
		}
		this.logDebug("checkIsURLencoded()\nNot an encoded string,  this may be a SmartTemplates header:\n" + tok);
		return false;
	}	,

  isAddressHeader: function	isAddressHeader(token='') {
    if (!token) return false;
    return RegExp(" " + token + " ", "i").test(
       " bcc cc disposition-notification-to errors-to from mail-followup-to mail-reply-to reply-to" +
       " resent-from resent-sender resent-to resent-cc resent-bcc return-path return-receipt-to sender to recipient"); // ALLOW recipient FOR FRAGMENTS.
  } ,
  
	// new function for manually formatting a time / date string in one go.
  // make additional parameters possible (enclose format string with "" to append 2nd parameter)
	dateFormat: function dateFormat(time, argument, timezone) {
		const util = SmartTemplate4.Util;
    let timeFormat,
        isClipboard = false;
    if (argument.startsWith("\"")) {
      let closeQuote = argument.lastIndexOf("\"");
      timeFormat = argument.substring(1,closeQuote);
      let args = argument.substring(closeQuote).split(",");
      if (args.length>1) {
        if (args.includes("toclipboard")) {
          isClipboard = true;
        }
      }
    }
    else {
      timeFormat = argument;
    }
    
		util.logDebugOptional('timeStrings','dateFormat(' + time + ', ' + timeFormat + ', ' + timezone  +')\n' + 
		  'Forced Timezone[' + SmartTemplate4.whatIsTimezone + ']= ' + util.getTimezoneOffset(SmartTemplate4.whatIsTimezone));
		util.addUsedPremiumFunction('dateFormat');
		if (!timezone) timezone=0;
		try {
			let tm = new Date();
			
			if (SmartTemplate4.whatIsDateOffset) {
				time += (SmartTemplate4.whatIsDateOffset*24*60*60*1000*1000); // add n days
			}
			if (SmartTemplate4.whatIsHourOffset || SmartTemplate4.whatIsMinuteOffset ) {
				time += (SmartTemplate4.whatIsHourOffset*60*60*1000*1000)
				      + (SmartTemplate4.whatIsMinuteOffset*60*1000*1000); // add m hours / n minutes
			}		
			if (SmartTemplate4.whatIsTimezone) { // subtract UTC offset for timezone
			  let nativeUtcOffset = tm.getTimezoneOffset(),
			      forcedOffset = util.getTimezoneOffset(SmartTemplate4.whatIsTimezone)*60; // calculate minutes
				time = time + (nativeUtcOffset + forcedOffset)*60*1000*1000;
			}
			
			// Set Time - add Timezone offset
			tm.setTime(time / 1000 + (timezone) * 60 * 1000);
			let d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); },
			    cal = SmartTemplate4.calendar,
			    isUTC = SmartTemplate4.whatIsUtc,
					year = isUTC ? tm.getUTCFullYear().toString() : tm.getFullYear().toString(),
					month = isUTC ? tm.getUTCMonth() : tm.getMonth(),
					day = isUTC ? tm.getUTCDate() : tm.getDate(),
					hour = isUTC ? tm.getUTCHours() : tm.getHours(),
					minute = isUTC ? tm.getUTCMinutes() : tm.getMinutes();
					
      //numeral replacements first					
			let timeString = 
			  timeFormat
					.replace('Y', year)
					.replace('y', year.slice(year.length-2))
					.replace('n', (month+1))
					.replace('m', d02(month+1))
					.replace('e', day)
					.replace('d', d02(day))
					.replace('k',     hour)
					.replace('H', d02(hour))
					.replace('l',    (((hour + 23) % 12) + 1))
					.replace('I', d02(((hour + 23) % 12) + 1))
					.replace('M', d02(minute))
					.replace('S', d02(tm.getSeconds()));
			
      // alphabetic-placeholders need to be inserted because otherwise we will replace
			// parts of day / monthnames etc.
			timeString=			
			  timeString
					.replace("tz_name", "##t")
					.replace('B', '##B')
					.replace('b', '##b')
				  .replace('A', '##A')
					.replace('a', '##a')
					.replace('p1', '##p1')
					.replace('p2', '##p2')
					.replace('p', '##p')
				
			timeString=
			  timeString
				  .replace('##t', isUTC ? 'UTC' : util.getTimeZoneAbbrev(tm, false))
					.replace('##B', cal.monthName(month))
					.replace('##b', cal.shortMonthName(month))
				  .replace('##A', cal.dayName(tm.getDay()))
					.replace('##a', cal.shortDayName(tm.getDay()))
					.replace('##p1', hour < 12 ? "a.m." : "p.m.")
					.replace('##p2', hour < 12 ? "A.M." : "P.M.")
					.replace('##p', hour < 12 ? "AM" : "PM")
					
					
			util.logDebugOptional('timeStrings', 'Created timeString: ' + timeString);
      if (isClipboard) {
        if (!util.hasLicense()  || util.licenseInfo.keyType == 2) { 
          util.addUsedPremiumFunction("toclipboard");
        }
        else {
          util.clipboardWrite(timeString);
          util.logDebugOptional("timeStrings", "Copied time to clipboard!");
        }
        return "";
      }
			return timeString;
			
		}
		catch (ex) {
			util.logException('util.dateFormat() failed', ex);
		}
		return '';
	} ,
	
	prTime2Str : function st4_prTime2Str(time, timeType, timezone) {
		const util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences,
		      Ci = Components.interfaces,
		      Cc = Components.classes;
		function getDateFormat(field) {
			return prefs.getStringPref("dateformat." + field);
		}
					
		util.logDebugOptional('timeStrings','prTime2Str(' + time + ', ' + timeType + ', ' + timezone + ')');
		try {
			let tm = new Date(),
					isOldDateFormat = (typeof Ci.nsIScriptableDateFormat !== "undefined"),
					fmt;
					
			if (isOldDateFormat) {
				// this interface was removed in Gecko 57.0
				fmt = Cc["@mozilla.org/intl/scriptabledateformat;1"].createInstance(Ci.nsIScriptableDateFormat);
			}
			else {
				// alternative date formatting
				// Cu.import("resource:///modules/ToLocaleFormat.jsm");
				// new Services.intl.
				let dateOptions = {
					hour12: false, // 24 hours
					hour: getDateFormat('hour'),
					minute: "2-digit"
				};
				// { dateStyle: "full", timeStyle: "long" } - not documented!
				switch (timeType) {
					case "datelocal":
						// no change
						dateOptions.weekday = "long";
					  dateOptions.day = getDateFormat('day');
					  dateOptions.month = "short";
					  dateOptions.year = "numeric";
						break;
					case "dateshort":
					default:
					  dateOptions.day = getDateFormat('day');
					  dateOptions.month = getDateFormat('month');
					  dateOptions.year = getDateFormat('year');
						break;
				}
				let localeString = util.getLocalePref();
				fmt = new Intl.DateTimeFormat(localeString, dateOptions);
				util.logDebugOptional('timeStrings',"DateTimeFormat(" + localeString + ") resolved options: ", fmt.resolvedOptions());
			}
      
			if (SmartTemplate4.whatIsDateOffset) {
				time += (SmartTemplate4.whatIsDateOffset*24*60*60*1000*1000); // add n days
				util.logDebugOptional('timeStrings', "Adding " + SmartTemplate4.whatIsDateOffset + " days to time");
			}
			if (SmartTemplate4.whatIsHourOffset || SmartTemplate4.whatIsMinuteOffset ) {
				time += (SmartTemplate4.whatIsHourOffset*60*60*1000*1000)
				      + (SmartTemplate4.whatIsMinuteOffset*60*1000*1000); // add n days
				util.logDebugOptional('timeStrings', 
				  "Adding " + SmartTemplate4.whatIsHourOffset  + ":" + SmartTemplate4.whatIsMinuteOffset + " hours to time");
			}
			
			// Set Time - add Timezone offset
			let nativeUtcOffset = tm.getTimezoneOffset(),
			    forceTimeZone = SmartTemplate4.whatIsTimezone; // UTC offset for current time,  in minutes
			if (forceTimeZone)  {
				let forceHours = util.getTimezoneOffset(forceTimeZone);
				timezone = nativeUtcOffset + forceHours*60; // offset in minutes!
				util.logDebug("Adding timezone offsets:\n" +
				  "UTC Offset: " + nativeUtcOffset/60 + 
					"\nForced Timezone[" + forceTimeZone + "]: " + forceHours);
			}
			tm.setTime(time / 1000 + (timezone) * 60 * 1000);

			// Format date string
			let dateFormat = null,
			    timeFormat = null;

			
			let timeString;
			if (isOldDateFormat) {
				switch (timeType) {
					case "datelocal":
						dateFormat = fmt.dateFormatLong;
						timeFormat = fmt.timeFormatSeconds;
						break;
					case "dateshort":
					default:
						dateFormat = fmt.dateFormatShort;
						timeFormat = fmt.timeFormatSeconds;
						break;
				}
				timeString = fmt.FormatDateTime(SmartTemplate4.pref.getLocalePref(),
												dateFormat, 
												timeFormat,
												tm.getFullYear(), tm.getMonth() + 1, tm.getDate(),
												tm.getHours(), tm.getMinutes(), tm.getSeconds());
			}
			else
				timeString = fmt.format(tm)
			util.logDebugOptional('timeStrings', "Created timeString: " + timeString);
			return timeString;
		}
		catch (ex) {
			util.logException('util.prTime2Str() failed', ex);
		}
		return '';
	} ,

	zoneFromShort: function st4_zoneFromShort(short) {
		let timezones = {
			"ACDT" : "Australian Central Daylight Time",
			"ACST" : "Australian Central Standard Time",
			"ACT"	 : "ASEAN Common Time",
			"ADT"	 : "Atlantic Daylight Time",
			"AEDT" : "Australian Eastern Daylight Time",
			"AEST" : "Australian Eastern Standard Time",
			"AUS"  : "Australian Time",
			"AFT"	 : "Afghanistan Time",
			"AKDT" : "Alaska Daylight Time",
			"AKST" : "Alaska Standard Time",
			"AMST" : "Armenia Summer Time",
			"AMT"	 : "Armenia Time",
			"ART"	 : "Argentina Time",
			"AST"	 : "Atlantic Standard Time",
			"AWDT" : "Australian Western Daylight Time",
			"AWST" : "Australian Western Standard Time",
			"AZOST": "Azores Standard Time",
			"AZT"	 : "Azerbaijan Time",
			"BDT"	 : "Brunei Time",
			"BIOT" : "British Indian Ocean Time",
			"BIT"	 : "Baker Island Time",
			"BOT"	 : "Bolivia Time",
			"BRT"	 : "Brasilia Time",
			"BST"	 : "British Summer Time (British Standard Time from Feb 1968 to Oct 1971)",
			"BTT"	 : "Bhutan Time",
			"CAT"	 : "Central Africa Time",
			"CCT"	 : "Cocos Islands Time",
			"CDT"	 : "Central Daylight Time (North America)",
			"CEDT" : "Central European Daylight Time",
			"CEST" : "Central European Summer Time (Cf. HAEC)",
			"CET"	 : "Central European Time",
			"CHADT": "Chatham Daylight Time",
			"CHAST": "Chatham Standard Time",
			"CHOT" : "Choibalsan",
			"ChST" : "Chamorro Standard Time",
			"CHUT" : "Chuuk Time",
			"CIST" : "Clipperton Island Standard Time",
			"CIT"	 : "Central Indonesia Time",
			"CKT"	 : "Cook Island Time",
			"CLST" : "Chile Summer Time",
			"CLT"	 : "Chile Standard Time",
			"COST" : "Colombia Summer Time",
			"COT"	 : "Colombia Time",
			"CST"	 : "Central Standard Time (North America)",
			"CT"   : "China time",
			"CVT"	 : "Cape Verde Time",
			"CWST" : "Central Western Standard Time (Australia)",
			"CXT"	 : "Christmas Island Time",
			"DAVT" : "Davis Time",
			"DDUT" : "Dumont d'Urville Time",
			"DFT"	 : "AIX specific equivalent of Central European Time",
			"EASST": "Easter Island Standard Summer Time",
			"EAST" : "Easter Island Standard Time",
			"EAT"	 : "East Africa Time",
			"ECT"	 : "Ecuador Time",
			"EDT"	 : "Eastern Daylight Time (North America)",
			"EEDT" : "Eastern European Daylight Time",
			"EEST" : "Eastern European Summer Time",
			"EET"	 : "Eastern European Time",
			"EGST" : "Eastern Greenland Summer Time",
			"EGT"	 : "Eastern Greenland Time",
			"EIT"	 : "Eastern Indonesian Time",
			"EST"	 : "Eastern Standard Time (North America)",
			"FET"	 : "Further-eastern_European_Time",
			"FJT"	 : "Fiji Time",
			"FKST" : "Falkland Islands Summer Time",
			"FKT"	 : "Falkland Islands Time",
			"FNT"	 : "Fernando de Noronha Time",
			"GALT" : "Galapagos Time",
			"GAMT" : "Gambier Islands",
			"GET"	 : "Georgia Standard Time",
			"GFT"	 : "French Guiana Time",
			"GILT" : "Gilbert Island Time",
			"GIT"	 : "Gambier Island Time",
			"GMT"	 : "Greenwich Mean Time",
			"GST"	 : "South Georgia and the South Sandwich Islands",
			"GYT"	 : "Guyana Time",
			"HADT" : "Hawaii-Aleutian Daylight Time",
			"HAEC" : "Heure Avanc\u00E9e d'Europe Centrale francised name for CEST",
			"HAST" : "Hawaii-Aleutian Standard Time",
			"HKT"	 : "Hong Kong Time",
			"HMT"	 : "Heard and McDonald Islands Time",
			"HOVT" : "Khovd Time",
			"HST"	 : "Hawaii Standard Time",
			"ICT"	 : "Indochina Time",
			"IDT"	 : "Israel Daylight Time",
			"I0T"	 : "Indian Ocean Time",
			"IRDT" : "Iran Daylight Time",
			"IRKT" : "Irkutsk Time",
			"IRST" : "Iran Standard Time",
			"IST"	 : "Irish Summer Time",
			"JST"	 : "Japan Standard Time",
			"KGT"	 : "Kyrgyzstan time",
			"KOST" : "Kosrae Time",
			"KRAT" : "Krasnoyarsk Time",
			"KST"	 : "Korea Standard Time",
			"LHST" : "Lord Howe Standard Time",
			"LINT" : "Line Islands Time",
			"MAGT" : "Magadan Time",
			"MART" : "Marquesas Islands Time",
			"MAWT" : "Mawson Station Time",
			"MDT"	 : "Mountain Daylight Time (North America)",
			"MET"	 : "Middle European Time Same zone as CET",
			"MEST" : "Middle European Saving Time Same zone as CEST",
			"MHT"	 : "Marshall_Islands",
			"MIST" : "Macquarie Island Station Time",
			"MIT"	 : "Marquesas Islands Time",
			"MMT"	 : "Myanmar Time",
			"MSK"	 : "Moscow Time",
			"MST"	 : "Mountain Standard Time (North America)",
			"MUT"	 : "Mauritius Time",
			"MVT"	 : "Maldives Time",
			"MYT"	 : "Malaysia Time",
			"NCT"	 : "New Caledonia Time",
			"NDT"	 : "Newfoundland Daylight Time",
			"NFT"	 : "Norfolk Time[1]",
			"NPT"	 : "Nepal Time",
			"NST"	 : "Newfoundland Standard Time",
			"NT"	 : "Newfoundland Time",
			"NUT"	 : "Niue Time",
			"NZDT" : "New Zealand Daylight Time",
			"NZST" : "New Zealand Standard Time",
			"OMST" : "Omsk Time",
			"ORAT" : "Oral Time",
			"PDT"	 : "Pacific Daylight Time (North America)",
			"PET"	 : "Peru Time",
			"PETT" : "Kamchatka Time",
			"PGT"	 : "Papua New Guinea Time",
			"PHOT" : "Phoenix Island Time",
			"PHT"	 : "Philippine Time",
			"PKT"	 : "Pakistan Standard Time",
			"PMDT" : "Saint Pierre and Miquelon Daylight time",
			"PMST" : "Saint Pierre and Miquelon Standard Time",
			"PONT" : "Pohnpei Standard Time",
			"PST"	 : "Pacific Standard Time (North America)",
			"RET"	 : "R\u00E9union Time",
			"ROTT" : "Rothera Research Station Time",
			"SAKT" : "Sakhalin Island time",
			"SAMT" : "Samara Time",
			"SAST" : "South African Standard Time",
			"SBT"	 : "Solomon Islands Time",
			"SCT"	 : "Seychelles Time",
			"SGT"	 : "Singapore Time",
			"SLT"	 : "Sri Lanka Time",
			"SRT"	 : "Suriname Time",
			"SST"	 : "Singapore Standard Time",
			"SYOT" : "Showa Station Time",
			"TAHT" : "Tahiti Time",
			"THA"	 : "Thailand Standard Time",
			"TFT"	 : "Indian/Kerguelen",
			"TJT"	 : "Tajikistan Time",
			"TKT"	 : "Tokelau Time",
			"TLT"	 : "Timor Leste Time",
			"TMT"	 : "Turkmenistan Time",
			"TOT"	 : "Tonga Time",
			"TVT"	 : "Tuvalu Time",
			"UCT"	 : "Coordinated Universal Time",
			"ULAT" : "Ulaanbaatar Time",
			"UTC"	 : "Coordinated Universal Time",
			"UYST" : "Uruguay Summer Time",
			"UYT"	 : "Uruguay Standard Time",
			"UZT"	 : "Uzbekistan Time",
			"VET"	 : "Venezuelan Standard Time",
			"VLAT" : "Vladivostok Time",
			"VOLT" : "Volgograd Time",
			"VOST" : "Vostok Station Time",
			"VUT"  : "Vanuatu Time",
			"WAKT" : "Wake Island Time",
			"WAST" : "West Africa Summer Time",
			"WAT"	 : "West Africa Time",
			"WEDT" : "Western European Daylight Time",
			"WEST" : "Western European Summer Time",
			"WET"  : "Western European Time",
			"WST"	 : "Western Standard Time",
			"YAKT" : "Yakutsk Time",
			"YEKT" : "Yekaterinburg Time"
		};

		let tz = timezones[short]; // Date().toString().replace(/^.*\(|\)$/g, "")
		return tz || short;
	} ,
	
	getTimezoneOffset: function st4_getTimezoneOffset(zone) {
		let offset = 0;
		// Offsets according to https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations
		switch (zone) {
			case "ACDT": return 10.5;
			case "ACST": return 9.5;
			case "ACT": return -5;
			case "ACWST": return 8.75;
			case "ADT": return -3;
			case "AEDT": return 11;
			case "AEST": return 10;
			case "AFT": return 4.5;
			case "ART": return -3;
			case "AKDT": return -8; // Alaska Daylight
			case "AKST": return -9;
			case "AMST": return -3;
			case "ART": return -3;
			case "AST": return -4;  //Atlantic Standard Time
			case "AWST": return 8;
			case "AZOST": return 0;
			case "AZOT": return -1;
			case "AZT": return 4;
			case "BDT": return 8;
			case "BIOT": return 6;
			case "BIT": return -12;
			case "BOT": return -4;
			case "BRST": return -2;
			case "BRT": return -3;
			case "BST": return 1; // British Summer Time
			case "BTT": return 6;
			case "CAT": return 2;
			case "CCT": return 6.5;
			case "CDT": return -5; // Central Daylight (North America)
			case "CEDT": return 2; // Central European Daylight Saving Time
			case "CEST": return 2; // Central European Summer Time
			case "CET": return 1;
			case "CHADT": return 13.75;
			case "CHAST": return 12.75;
			case "CHOT": return 8;
			case "CHIST": return 9;
			case "CHST": return 10;
			case "CHUT": return 10;
			case "CIST": return -8;
			case "CIT": return 8;
			case "CKT": return -10;
			case "CLST": return -3;
			case "CLT": return -4;
			case "COST": return -5;
			case "CST": return -6; // Central Standard Time (North America)
			case "CT": return 8;
			case "CVT": return -1;
			case "CWST": return -8.75; // Central Western Standard Time (Australia) unofficial
			case "CXT": return 7;
			case "DAVY": return 7;
			case "DDUT": return 10;
			case "DFT": return 1;
			case "EASST": return -5;
			case "EAST": return -6;
			case "EAT": return 3;
			case "ECT": return -4; //Eastern Caribbean Time 
			case "EDT": return -4; // Eastern Daylight Time (North America)
			case "EEST": return 3;
			case "EET": return 2;
			case "EGST": return -1;
			case "EGT": return -1;
			case "EIT": return 9;
			case "EST": return -5; // Eastern Standard Time (North America)
			case "FET": return 3;
			case "FJT": return 12;
			case "FKST": return -3;
			case "FKT": return -4;
			case "FNT": return -2;
			case "GAKT": return -6;
			case "GAMT": return -9;
			case "GFT": return -3;
			case "GILT": return 12;
			case "GIT": return -9;
			case "GMT": return 0;
			case "GST": return 4; //  	Gulf Standard Time
			case "GYT": return -4;
			case "HDT": return -9;
			case "HAEC": return 2;
			case "HST": return -10;
			case "HKT": return 8;
			case "HMT": return 5;
			case "HOVST": return 8;
			case "HOVT": return 7;
			case "ICT": return 7;
			case "IDLW": return -12;
			case "IDT": return 3;
			case "IOT": return 3;
			case "IRDT": return 4.5;
			case "IRKT": return 8;
			case "IRST": return 3.5;
			case "IST": return 5.5;
			case "JST": return 9;
			case "KALT": return 2;
			case "KGT": return 6;
			case "KOST": return 11;
			case "KRAT": return 7;
			case "KST": return 9;
			case "LHST": return 10.5; // Lord Howe Standard Time
			case "LINT": return 14;
			case "MAGT": return 12;
			case "MART": return -9.5;
			case "MAWT": return 5;
			case "MDT": return -6;
			case "MEET": return 1;
			case "MEST": return 2; // Middle European Summer Time 
			case "MESZ": return 2; // Middle European Summer Time 
			case "MHT": return 12;
			case "MIST": return 11;
			case "MIT": return -9.5;
			case "MMT": return 6.5;
			case "MSK": return 3;
			case "MST": return -7;  // Mountain Standard Time (North America)
			case "MUT": return 4;
			case "MVT": return 5;
			case "MYT": return 8;
			case "NCT": return 11;
			case "NDT": return -2.5;
			case "NFT": return 11;
			case "NPT": return 5.75;
			case "NST": return -3.5;
			case "NT": return -3.5;
			case "NUT": return -11;
			case "NZDY": return 13;
			case "NZST": return 12;
			case "OMST": return 6;
			case "ORAT": return 5;
			case "PDT": return -7;
			case "PET": return -5;
			case "PETT": return 12;
			case "PGT": return 10;
			case "PHOT": return 13;
			case "PHT": return 8;
			case "PKT": return 5;
			case "PMDT": return -2;
			case "PMST": return -3;
			case "PONT": return 11;
			case "PST": return -8;  //Pacific Standard Time (North America)
			case "PYST": return -3;
			case "PYT": return -4;
			case "RET": return 4;
			case "ROTT": return -3;
			case "SAKT": return 11;
			case "SAMT": return 4;
			case "SAST": return 2;
			case "SBT": return 11;
			case "SCT": return 4;
			case "SDT": return -10;
			case "SGT": return 8;
			case "SLST": return 5.5;
			case "SRET": return 11;
			case "SST": return 8;  //Singapore Standard Time
			case "SYOT": return 3;
			case "TAHT": return -10;
			case "THA": return 7;
			case "TFT": return 5;
			case "TJT": return 5;
			case "TKT": return 13;
			case "TLT": return 9;
			case "TMT": return 5;
			case "TRT": return 3;
			case "TOT": return 13;
			case "TVT": return 12;
			case "ULAST": return 9;
			case "ULAT": return 8;
			case "UTC": return 0;
			case "UYST": return -2;
			case "UYT": return -3;
			case "UZT": return 5;
			case "VET": return -4;
			case "VLAT": return 10;
			case "VOLT": return 4;
			case "VOST": return 6;
			case "VUT": return 11;
			case "WAKT": return 12;
			case "WAST": return 1;
			case "WAT": return 2;
			case "WEST": return 1;
			case "WET": return 0;
			case "WST": return 8;
			case "YAKT": return 9;
			case "YEKT": return 5;
		}
		return 0;
		
	} ,

	getTimeZoneAbbrev: function st4_getTimeZoneAbbrev(tm, isLongForm) {
		const util = SmartTemplate4.Util;
    function isAcronym(str) {
      return (str.toUpperCase() == str); // if it is all caps we assume it is an acronym
    }
		// return tm.toString().replace(/^.*\(|\)$/g, ""); HARAKIRIs version, not working.
		// get part between parentheses
		// e.g. "(GMT Daylight Time)"
		util.logDebugOptional ('timeZones', 'getTimeZoneAbbrev(time: ' + tm.toString() + ', long form: ' + isLongForm);
		let timeString =  tm.toTimeString(),
		    timeZone = timeString.match(/\(.*?\)/),
		    retVal = '';
		util.logDebugOptional ('timeZones', 'timeString = ' + timeString + '\n' 
		                                      + 'timeZone =' + timeZone);
		if (timeZone && timeZone.length>0) {
      // remove enclosing brackets and split
			let words = timeZone[0].substr(1,timeZone[0].length-2).split(' ');
			for (let i=0; i<words.length; i++) {
        let wrd = words[i];
				if (isLongForm) {
					retVal += ' ' + wrd;
				}
				else {
					if (wrd.length == 3 && wrd.match('[A-Z]{3}') 
					    ||
					    wrd.length == 4 && wrd.match('[A-Z]{4}')
              ||
              isAcronym(wrd))
          {
						retVal += wrd + ' ';  // abbrev contained
          }
					else {
						retVal += wrd[0];  // first letters cobbled together
          }
				}
			}
		}
		else {
			util.logDebugOptional ('timeZones', 'no timeZone match, building manual...');
			retVal = timeString.match('[A-Z]{4}');
			if (!retVal)
				retVal = timeString.match('[A-Z]{3}');
			// convert to long form by using hard-coded time zones array.
			util.logDebug('Cannot determine timezone string - Missed parentheses - from:\n' + timeString + ' regexp guesses: ' + retVal);
			if (isLongForm) {
				retVal = util.zoneFromShort(retVal);
			}
		}
		util.logDebugOptional ('timeZones', 'getTimeZoneAbbrev return value = ' + retVal);
		return retVal.trim();
	} ,
	
	// use this to add textFormatting modifiers ()
	// to all previous fields!
	splitFormatArgs: function (format)	{
    let formatArray = [];
    if (format) {
      // remove parentheses
      if (format.charAt(0)=='(')
        format = format.slice(1);
      if (format.charAt(format.length-1)==')')
        format = format.slice(0, -1);
      
      let fs=format.split(','); // lastname, firstname ?
			let lastTransformed = -1;   // remember the last transformed element
      for(let i=0; i<fs.length; i++) {
        let ff = fs[i].trim();
        // if next one is a link modifier, modify previous element and continue
        switch(ff.toLowerCase()) {
          case 'link':
            formatArray[formatArray.length-1].modifier = 'linkTo';
            continue;
          case 'islinkable':
            formatArray[formatArray.length-1].modifier = 'linkable';
            continue;
        }

				// format all previous results only!
				// example %recipient(firstname,lastname,capitalize,mail)%
				// this will capitalize the name portions but leave the mail alone
				if (this.isFormatString(ff)) {
					// if a previous element was already transformed, do not change it again.
					// this way we can do (firstname,lowercase,lastname,uppercase)
					for (let j = lastTransformed+1; j<formatArray.length; j++) {
						formatArray[j].transform = ff;
						lastTransformed = j;
					}
					continue;
				}

        formatArray.push ({ field: ff, modifier: ''}); // modifier: linkTo
      }
    }
		return formatArray;
	} ,
	

	// Repair Parameter Array (that was split using ,)
  // that has a string parameter containing an escaped comma \,
	//--------------------------------------------------------------------
	// @arr = Array of parameters
	// @paramPos = [optional] which parameter will be converted, defaults to 0 (first parameter) 
  combineEscapedParams: function (arr, paramPos = 0) {
    let finalParams = [];

    for (let i=0; i<paramPos; i++)  {
      finalParams.push(arr[i]);
    }

    if (arr[paramPos].endsWith("\\") && arr.length > 1) {
      // cut off the escape character, insert comma and combine 2 params into a single string
      finalParams.push(`${arr[paramPos].slice(0, -1)},${arr[paramPos+1]}`) ; 
      for (let i=paramPos+2; i<arr.length; i++) {
        finalParams.push(arr[i]);
      }
      // do it again, in case there are multiple commas in the first parameter!
      return this.combineEscapedParams(finalParams, paramPos); // do it again, in case next param is also cut off unintentionally
    } else {
      finalParams = arr;
    }
    return finalParams;
  } ,

  // take a full SmartTemplates command and extract an array of parameters
  extractParameters: function (cmd) {
    //  finds: (params)%  changed [^%]* to .+?
    let rx = new RegExp(/(\(.+?)\)%/gm),
        ar = rx.exec(cmd),
        paramString = (ar.length>1) ? ar[1] : ""; 
    // remove parentheses
    if (paramString.length>2) {
      paramString = paramString.substring(1);
    }

    // combine parameter parts. (allow \, within strings)
    let parameters = this.combineEscapedParams(paramString.split(","), 0);
    if (parameters.length>1) {
      parameters = this.combineEscapedParams(parameters, 1); // combine 2nd parameter parts
    }    
    return parameters;
  } ,

	// for regex expressions only, 1st Parameter: if a regex parameter is split
	// it will starts with " but doesn't finish with that "
	combineSplitStringParam: function(params) {
		if (params[0].startsWith('\"')) {
			if (params[0].endsWith('\"')) return;
			if (params.length<2) return;
		}
		let foundClosingPart = 0;
		for(let i=1; i<params.length; i++) {
			if (params[i].endsWith('\"')) {
				foundClosingPart = i;
			}
		}
		for (let i=0; i<foundClosingPart; i++) {
			params[1] = params[0] + params[1];
			params.shift();
		}
		this.logDebug("Combined parameters", {params});
	} ,


	// retrieve the (numeral) group argument of a pattern parameter
	// has to always be the second parameter?
	//    %matchTextFromBody(regularPattern,group,toclipboard)%
	//   
	extractMatchGroupArg: function(params) {
		if (!params || params.length<2) {
			return 0; // match all
		}
		if (isNaN(params[1])) return 0;
		return parseInt(params[1],10);
	} ,
	

  /**
   * Installs the toolbar button with the given ID into the given
   * toolbar, if it is not already present in the document.
   *
   * @param {string} toolbarId The ID of the toolbar to install to.
   * @param {string} id        The ID of the button to install.
   * @param {string} afterId   The ID of the element to insert after. @optional
   */	
	installButton: function installButton(toolbarId, id, afterId) {
    // if (!document.getElementById(id)) {
      this.logDebug("installButton(" + toolbarId + "," + id + "," + afterId + ")");

      let toolbar = document.getElementById(toolbarId),
          before = null;
      // If no afterId is given, then append the item to the toolbar
      if (afterId) {
        let elem = document.getElementById(afterId);
        if (elem && elem.parentNode == toolbar)
          before = elem.nextElementSibling;
				else {
					// get last item and insert before:
					before = toolbar.childNodes[toolbar.childNodes.length-1];
					this.logDebug("toolbar.childNodes length = " + toolbar.childNodes.length);
					// if there is a spacer, let's put element before that.
					if (before && before.previousElementSibling.tagName == "toolbarspring")
						before = before.previousElementSibling;
				}
      }
			if (!before) {
				return false;
			}

      this.logDebug("toolbar.insertItem(" + id  + "," + before + ")");
			if (before)
				toolbar.insertItem(id, before);
				
      toolbar.setAttribute("currentset", toolbar.currentSet);
      this.logDebug("document.persist" + toolbar.id + ")");
			if (document.persist)
				document.persist(toolbar.id, "currentset");
      return true;
    // }
  }  ,
	
	// -----------------------------------
	// get locale preference
	getLocalePref : function getLocalePref()	{
		const Ci = Components.interfaces,
		      Cc = Components.classes,
		      util = SmartTemplate4.Util;
		try {
			let locale,
			    forcedLocale = SmartTemplate4.calendar.currentLocale,  // check if the %language% variable was set
			    listLocales = '',
			    found = false;
			try {
				
				// Tb68: requestedLocale
				// Tb60: getRequestedLocale()
				// Tb52: getApplicationLocale().getCategory("NSILOCALE_TIME")
				let platformRequestedLocale 
				  = (typeof Services.locale.requestedLocale == "string") ? Services.locale.requestedLocale : 
					  (Services.locale.getRequestedLocale ? Services.locale.getRequestedLocale() : Services.locale.getApplicationLocale().getCategory("NSILOCALE_TIME"));
				
				locale =   // get locale from Operating System. note nslocaleservice was removed in Gecko 57
				           // removed Services.locale.getLocaleComponentForUserAgent()
			      Services.locale.appLocaleAsLangTag  
							|| platformRequestedLocale || Services.locale.lastFallbackLocale; // was Services.locale.getAppLocaleAsLangTag();
			}
			catch(ex) {
				util.logException("getLocalePref failed - fallback to en-US", ex);
				locale = "en-US";				
			}
			if (forcedLocale && forcedLocale != locale) {
				let availableLocales = util.getAvailableLocales("global"),
				    foundPartly=""; // list of installed locales
				while (availableLocales.hasMore()) {
					let aLocale = availableLocales.getNext();
					listLocales += aLocale.toString() + ', ';
					if (aLocale == forcedLocale) 
						found = true;
					else {
						if(aLocale.indexOf(forcedLocale)==0)
							foundPartly = aLocale; // partly matched, e.g. forcedLocale=de, language pack = de-DE
					}
				}
				if (!found && foundPartly) {
					util.logDebug("found requested language '{0}' matching partly: %language% selecting '{1}'"
					  .replace("{0}", forcedLocale)
					  .replace("{1}", foundPartly));
					// we found a variation of the root language requested:
					forcedLocale = foundPartly;
					found = true;
				}
				if (!found) {
					let requiredLocaleTxt =
					  " In order to use %datelocal% or %dateshort% with the requested language," +
					  " You will need the matching Language Pack [{0}]".replace('{0}', forcedLocale+".xpi")
						+ " from https://ftp.mozilla.org/pub/thunderbird/releases/" + util.AppverFull + "/yourOS/xpi";
				  let errorText =   'Invalid %language% id: ' + forcedLocale + '\n'
					                +  requiredLocaleTxt + '\n'
					                + 'Available Locales on your system: ' + listLocales.substring(0, listLocales.length-2);
					util.logToConsole(errorText);
				}
				else {
					util.logDebug('calendar - found global locales: ' + listLocales + '\nconfiguring ' + forcedLocale);
					locale = forcedLocale;
				}
			}

			util.logDebug('getLocalePref() returns: ' + locale);
			return locale;
		}
		catch (ex) {
			util.logException('getLocalePref() failed and defaulted to [en]', ex);
			return "en";
		}
	} ,
  
  // isDisabled - force disabled (on retry)
  setSpellchecker: async function(languages, isDisabled) {
		const Ci = Components.interfaces,
		      Cc = Components.classes,
		      util = SmartTemplate4.Util;
    
    let retry = util.retrySpellCheck || 0,
        inlineSpellChecker = gSpellChecker.mInlineSpellChecker || GetCurrentEditor().getInlineSpellChecker(true);
    try {
      let spellChecker = inlineSpellChecker.spellChecker;
      if (languages!='off') {
        if (enableInlineSpellCheck) {
          enableInlineSpellCheck(true);
        }
        else {
          gSpellChecker.enabled = true;
        }
        util.logDebug('Enabled automatic spellcheck');
        if (languages=='on') {  // we're done here.
          return;
        }
      }
      if (!isDisabled) {
        isDisabled = !(gSpellChecker.enabled);
      }
      if (isDisabled && languages!='off') {
        // temporarily enable
        gSpellChecker.enabled = true;
        spellChecker = inlineSpellChecker.spellChecker;
      }
      if (!spellChecker) {
        if (retry<5) {
          retry++;
          util.retrySpellCheck = retry;
          util.logDebug("spellChecker not available, retrying later...{ attempt " + retry + " }");
          // if spellChecker is not ready, we try again in 2 seconds.
          setTimeout(function() {
            SmartTemplate4.Util.setSpellchecker(languages, isDisabled); // force disabled if this is set globally.
          }, 2000);
          return;
        }
        else {
          let wrn = "Could not retrieve spellChecker, giving up after " + retry + " attempts.";
          util.retrySpellCheck=0;
          throw wrn;          
        }
      }
      if (languages=='off') {
        if (enableInlineSpellCheck)
          enableInlineSpellCheck(false);
        gSpellChecker.enabled = false; // restore disabled status if this is a global setting.
        util.logDebug('Disabled automatic spellcheck');
        return;
      }
      
      
      util.retrySpellCheck=0;
      // Cc['@mozilla.org/spellchecker/engine;1'].getService(Ci.mozISpellCheckingEngine).getDictionaryList(o1, o2);
      let dictList = spellChecker.GetDictionaryList(), 
          count = dictList.length,
          found = false;
      if (count==0) {
        let wrn = util.getBundleString("st.notification.spellcheck.noDictionary");
        throw wrn;
      }
      
      
      let langArray = languages.split(","),
          invalidLanguages = [];
      for (let l=0; l<langArray.length; l++) {
        let foundOne = false;
        let language = langArray[l];
        if (language.length>=2) {
          // exact match
          for (let i = 0; i < dictList.length; i++) {
            if (dictList[i] == language) {
              foundOne = true; found = true;
              language = dictList[i];
              break;
            }
          }
          // partial match
          if (!foundOne) {
            for (let i = 0; i < dictList.length; i++) {
              if (dictList[i].startsWith(language)) {
                foundOne = true; found = true;
                language = dictList[i];
                break;
              }
            }
          }
        }
        if (!foundOne) {
          invalidLanguages.push(langArray[l]);
        }
        // write back correct entry, eliminate invalid ones.
        langArray[l] = foundOne ? language : ""; 
      }
      
      if (found) {
        util.logDebug("Setting spellchecker / document language to: " + languages);
        document.documentElement.setAttribute("lang",""); // force resetting
        
        let passArray = langArray.filter(x => x!=""); // remove invalid entries!
        if(typeof gActiveDictionaries == "object") { // Tb102 supports multiple spellcheck languages active at the same time
          await ComposeChangeLanguage(passArray); 
        }
        else {
          await ComposeChangeLanguage(passArray[0]); // Tb91: only 1 single language supported // not async in 91, but await does no harm either
        }
        if (isDisabled) { // force restoring disabled status
          gSpellChecker.enabled = false; 
          util.logDebug('Disabling automatic spellcheck according to global setting.');
        }
      }
      else {
        let wrn = util.getBundleString("st.notification.spellcheck.notFound");
        throw wrn.replace("{0}", languages);
      }
      if (invalidLanguages.length) {
        console.log("%spellcheck()% didn't find the following language entries: \n" + invalidLanguages.toString());
      }
    }
    catch(ex) {
      let msg = util.getBundleString("st.notification.spellcheck.error");
      SmartTemplate4.Message.display(msg + "\n" + ex, 
        "centerscreen,titlebar,modal,dialog",
        { ok: function() { ; }},
        window
      );
    }
    
  },
  
	// helper function to find a child node of the passed class Name
	findChildNode: function findChildNode(node, className) {
		while (node) {
			if (node && node.className == className)
				return node;
			let n = this.findChildNode(node.firstChild, className);
			if (n)
				return n;
			node = node.nextSibling;
		}
		return null;
	},  
  
  removeHtmlEntities: function removeHtmlEntities(input){
    let text = input.replace(/&\w+?;/g, function( e ) {
      switch(e) {
        case '&nbsp;': return ' ';
        case '&tab;': return '  ';  // can't use literal \t at the moment.
        case '&copy;': return String.fromCharCode(169);
        case '&lt;': return '<';
        case '&gt;': return '>';
        default: return e;
      }
    }); 
    return text;    
  },
	
  clickStatusIcon: function(el) {
		// Open HTML Settings instead - TEST
		// extensions.smartTemplate4.settings.html = true to open new settings dlg from status button
		if (SmartTemplate4.Preferences.getMyBoolPref("settings.html")) {
			SmartTemplate4.Util.logIssue213("Show new HTML help dialog.");
			let CurId = null, 
			    serverKey = null;

			if (window.GetSelectedMsgFolders) { 
				let folders = window.GetSelectedMsgFolders();
				if (folders.length == 1) { // select the correct server that applies to the current folder.
					var { MailUtils } = ChromeUtils.import("resource:///modules/MailUtils.jsm");
					[CurId] = MailUtils.getIdentityForServer(folders[0].server);
				}
			}
			if (CurId) {
				serverKey = CurId.key;
			}
			SmartTemplate4.Util.logDebug(`Open new prefs tab, current server key: ${serverKey}`)
			SmartTemplate4.Util.notifyTools.notifyBackground({ 
				func: "openPrefs", 
				server: serverKey 
			});
			return;
		}

    let isLicenseWarning = false;
    if (el.classList.contains("alert") || el.classList.contains("alertExpired")) {
      isLicenseWarning = true;
    }
    if (el.classList.contains("newsflash")) {
      SmartTemplate4.Util.openPreferences(); // will show splash screen instead.
      return;
    }
    
    let params = {
			mode: isLicenseWarning ? "licenseKey" : "",
			message: "Test!", 
			instance: window.SmartTemplate4
		};
		SmartTemplate4.Util.openPreferences(params);
  },
  
  openPreferences: async function(params) { // open legacy preferences
    if (SmartTemplate4.Preferences.getMyBoolPref("hasNews")) {
      SmartTemplate4.Util.viewSplashScreen();
      SmartTemplate4.Preferences.setMyBoolPref("hasNews", false);
      SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateNewsLabels" }); 
      return;
    }
		let win = SmartTemplate4.Util.Mail3PaneWindow;
		let el = params?.element;
    if (el && el.classList && 
			  (el.classList.contains("alertExpired") || el.classList.contains("checkLicense"))
			 ) {
      SmartTemplate4.Util.viewLicense();
			return;
    }
		let inParams = { 
			mode: params.mode || "",
			instance: win.SmartTemplate4
		};
		if (params.hasOwnProperty("tab")) { inParams.tab = params.tab; }
		if (params.hasOwnProperty("message")) { inParams.message = params.message;}
		if (params.hasOwnProperty("composeType")) { inParams.composeType = params.composeType; }

		window.openDialog(
			"chrome://SmartTemplate4/content/settings.xhtml", 
			"Preferences", 
			"chrome,titlebar,toolbar,dependent,centerscreen,resizable", 
			SmartTemplate4,
			{
				inn: inParams, 
				out: null
			}
		);
    
  },
  
  viewSplashScreen: function() {
    SmartTemplate4.Util.notifyTools.notifyBackground({ func: "splashScreen" });
  },

	setMidnightTimer: function() {
		let today = new Date(),
		    tomorrow = new Date(today.getFullYear(),today.getMonth(),today.getDate()+1),
		    timeToMidnight = (tomorrow-today);
		setTimeout(
			() => {
				SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateLicenseTimer" }); 
				SmartTemplate4.Util.setMidnightTimer();
			},
			timeToMidnight);
	},	
  
  get Accounts() {
    var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm"); // replace account-manager
    
    let acMgr = MailServices.accounts,
        aAccounts = [];
        
    for (let ac of acMgr.accounts) {
      aAccounts.push(ac);
    };
    return aAccounts;    
  }, 
  
  clipboardRead: function() {
		const Ci = Components.interfaces,
		      Cc = Components.classes;
    let cp = "";
    try {
      const xferable = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
			function testFlavors() {
				const supportedFlavors = ["text/html","text/unicode","text/plain"]; // "text/rtf"
				for (let flavor of supportedFlavors) {
					if (Services.clipboard.hasDataMatchingFlavors([flavor], Services.clipboard.kGlobalClipboard))
					  return flavor;
				}
				return null;
			}
      if (!xferable) {
        SmartTemplate4.Util.logToConsole("Couldn't get the clipboard data due to an internal error (couldn't create a Transferable object).")
      }
      else {
        xferable.init(null);
        let finalFlavor = testFlavors();
        if (finalFlavor) {
          xferable.addDataFlavor(finalFlavor);
          // Get the data into our transferable.
          Services.clipboard.getData(xferable, Services.clipboard.kGlobalClipboard);
          
          const data = {};
          try {
            xferable.getTransferData(finalFlavor, data);
          } catch (e) {
            // Clipboard doesn't contain data in flavor, return null.
            SmartTemplate4.Util.logDebug(`No data with flavor ${finalFlavor} in clipboard! `);
            return "";
          }

          // There's no data available, return.
          if (!data.value) {
            SmartTemplate4.Util.logDebug("Clipboard is empty? ");
            return "";
          }

          cp = data.value.QueryInterface(Ci.nsISupportsString).data;              
        }
      }      
    }
    catch (ex) {
      SmartTemplate4.Util.logException('util.clipboardRead() failed', ex);
    }
    return cp; 
  },
  
  clipboardWrite: function(txt) {
    try {
      let oClipBoard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
      oClipBoard.copyString(txt);
      return true;
    }
    catch(ex) {
      SmartTemplate4.Util.logException("Failed copying string to clipboard!", ex);
      return false;
    }
  },

  // async version of string.replace()
  // takes an asynchronous callback function as last argument.
	// rewritten by TbSync
  replaceAsync: async function(string, searchValue, replacer) {
    try {
			if (typeof replacer === "function") {
				let  values = [];
				string.replace(searchValue, function () {
					values.push(arguments); // store the regexp split
					return ""; // this is a fake pass, we do not replace anything here
				});
				let resolvedValues = [];
				for (let args of values) {
					resolvedValues.push(await replacer(...args));
				}
				return string.replace(searchValue, function () {
					return resolvedValues.shift();
				});
			} else { // if a string is passed.
        return Promise.resolve(
          String.prototype.replace.call(string, searchValue, replacer)
        );
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }, 	

	initFormatter: function(argString) {
		// [issue 288]
		let formatter = {};
		let formatArgs = argString.split(",");
		formatArgs.shift();
		while  (formatArgs.length) {
			if (formatArgs[0].startsWith("capitalize")) {
				formatter.isCapitalize = true
			}
			if (formatArgs[0].startsWith("camelcase")) {
				formatter.isCamelcase = true
			}			
			if (formatArgs[0].startsWith("uppercase")) {
				formatter.isUppercase = true
			}
			if (formatArgs[0].startsWith("lowercase")) {
				formatter.isLowercase = true
			}
			if (formatArgs[0].startsWith("default")) {
				formatter.isDefault = true
			}    			
			formatArgs.shift();            
		}
		return formatter;
	},

	isFormatString: function(argString) {
		if (!argString) return false;
		return ["capitalize","camelcase","uppercase","lowercase","default"].includes(argString);
	},

  formatString: function (txt, formatter) {
		// [issue 288]
    if (!formatter) return txt;
    if (formatter?.isUppercase) return txt.toUpperCase();
    if (formatter?.isLowercase) return txt.toLowerCase();
		if (formatter?.isCamelcase) {
      const words = txt.split(" ");
      for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toLowerCase() + words[i].substr(1);
      }
      return words.join(" ");

		}
    if (formatter?.isCapitalize) {
      const words = txt.split(" ");

      for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1).toLowerCase();
      }
      return words.join(" ");
    }
    return txt;
  }

};  // ST4.Util



SmartTemplate4.Util.firstRun =
{
	silentUpdate: function st4_silentUpdate(previousVersion, newVersion) {
		let p = previousVersion.toString(),
		    n = newVersion.toString();
		if ( p=="3.8" && (n=="3.8.999")) {
			SmartTemplate4.Util.logToConsole(
				"Silent Update - no version history displayed because v{0} is a maintenance release for v{1}"
				.replace("{0}",n).replace("{1}",p));
			return true;
		}
		return false;
	} ,

	init: async function() {
		// avoid running firstRun.init in messenger compose again!
		if (typeof SmartTemplate4.composer !== 'undefined') {
      util.logDebug("Util.firstRun.init() - early exit - SmartTemplate4.composer exists");
			return;
    }
    
  	const util = SmartTemplate4.Util,
		      prefs = SmartTemplate4.Preferences;
		util.logDebug("Util.firstRun.init()");
		let prev = -1, firstRun = true,
		    debugFirstRun = false,
		    prefBranchString = "extensions.smartTemplate4.",
		    ssPrefs = Services.prefs.getBranch(prefBranchString);

		try { debugFirstRun = Boolean(ssPrefs.getBoolPref("debug.firstRun")); } catch (e) { debugFirstRun = false; }

		util.logDebugOptional ("firstRun","SmartTemplate4.Util.firstRun.init()");
		if (!ssPrefs) {
			util.logDebugOptional ("firstRun","Could not retrieve prefbranch for " + prefBranchString);
		}

		let current = util.Version;
		util.logDebug("Current SmartTemplates Version: " + current);

		try {
			util.logDebugOptional ("firstRun","try to get setting: getCharPref(version)");
			try {
				prev = prefs.getMyStringPref("version");
			}
			catch (e) {
				prev = "?";
				util.logDebugOptional ("firstRun","Could not determine previous version - " + e);
			} ;

			util.logDebugOptional ("firstRun","try to get setting: getBoolPref(firstRun)");
			try { firstRun = ssPrefs.getBoolPref("firstRun"); } catch (e) { firstRun = true; }


			if (firstRun) {
				// previous setting found? not a new installation!
				if (prefs.existsBoolPref("extensions.smarttemplate.def"))
					firstRun = false;
				util.logDebugOptional ("firstRun","setting firstRun=false");
				prefs.setMyBoolPref("firstRun", false);
			}
			else {
				// this is an update - start license timer if license is empty.
				if (!prefs.getStringPref('LicenseKey')) {
					util.logDebug("Days left without license: " + util.licenseInfo.trialDays);
				}
			}

			util.logDebugOptional ("firstRun", "Settings retrieved:"
					+ "\nprevious version=" + prev
					+ "\ncurrent version=" + current
					+ "\nfirstrun=" + firstRun
					+ "\ndebugFirstRun=" + debugFirstRun);
		}
		catch(e) {
			util.logException("Exception in SmartTemplate4-util.js: \n"
				+ "\n\ncurrent: " + current
				+ "\nprev: " + prev
				+ "\nfirstrun: " + firstRun
				+ "\ndebugFirstRun: " + debugFirstRun, e);
		}
		finally {
			util.logDebugOptional ("firstRun","finally - firstRun=" + firstRun);

			// AG if this is a pre-release, cut off everything from "pre" on... e.g. 1.9pre11 => 1.9
			let pureVersion = util.VersionSanitized;
			util.logDebugOptional ("firstRun","finally - pureVersion=" + pureVersion);
			// change this depending on the branch
			util.logDebugOptional ("firstRun","finally - versionPage=" + util.VersionPage + "#" + pureVersion);
			
			let isPremium = util.hasLicense(true),
			    updateVersionMessage = util.getBundleString ("st.updateMessageVersion").replace("{1}",current);

			// NOTE: showfirst-check is INSIDE both code-blocks, because prefs need to be set no matter what.
			if (firstRun){
				/* EXTENSION INSTALLED FOR THE FIRST TIME! */
				util.logDebug ("firstRun code");
				// Insert code for first run here
				// on very first run, we go to the index page - welcome blablabla
				util.logDebugOptional ("firstRun","setTimeout for content tab (index.html)");
				window.setTimeout(function() {
					util.openURL("https://smarttemplates.quickfolders.org/index.html");
				}, 1500); //Firefox 2 fix - or else tab will get closed (leave it in....)
			}
			else {

				// check for update of pure version (everything before pre, beta, alpha)
				if (prev!=pureVersion) {
					
					/* EXTENSION UPDATED */
					util.logDebug("===========================\n"+
					              "ST4 Test  - SmartTemplates Update Detected:\n" +
												" **PREVIOUS**:" + prev + 
												"\npure Version: " + pureVersion + 
												"\ncurrent: " + current +
                        "\nisPremium=" + isPremium);
					util.logDebugOptional ("firstRun","prev!=current -> upgrade case.");

					// VERSION HISTORY PAGE
					// display version history - disable by right-clicking label above show history panel
          let isSilentUpdate = prefs.getMyBoolPref("silentUpdate"); // allow this flag for all.
          if (isSilentUpdate) {
            util.logDebug("Supressing Change Log, as disabled by user.");
          }
          else if (!this.silentUpdate(prev,pureVersion)) {
						util.logDebugOptional ("firstRun","open tab for version history, ST " + current);
						window.setTimeout(function(){ util.showVersionHistory(false); }, 2200);
					}

					// Display update notification
					window.setTimeout(function(){
						util.popupAlert (util.ADDON_TITLE, updateVersionMessage); // OS notification
					}, 3000);

				}
			}

			// =============================================
			// STORE CURRENT VERSION NUMBER!
			if (prev != pureVersion && current != '?') {
				// util.logDebug ("Storing new version number " + current);
				// STORE VERSION CODE! (taken out!)
				// prefs.setMyStringPref("version", pureVersion); // store sanitized version! (no more alert on pre-Releases + betas!)
			}
			else {
				util.logDebugOptional ("firstRun","No need to store current version: " + current
					+ "\nprevious: " + prev.toString()
					+ "\ncurrent!='?' = " + (current!='?').toString()
					+ "\nprev!=current = " + (prev!=current).toString());
			}
			
			util.logDebugOptional ("firstRun","finally { } ends.");
		} // end finally

		// // fire this on application launch, which includes open-link-in-new-window
		// window.addEventListener("load",function(){ SmartTemplate4.Util.firstRun.init(); },true);
	
	} 

};  // ST4.Util.firstRun

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
	parentWindow : null,
	display: function(text, features, callbacksObj, parent, parsedVars="") {
    let countDown = callbacksObj.countDown || 0,
        licenser = callbacksObj.licenser || null;
    if (licenser) {
      if (licenser.TrialDays<0) {
        if (licenser.isExpired) {
          // license is expired
          // 0.5 sec penalty / week. (2secs per month)
          countDown = parseInt(licenser.TrialDays * (-1) / 14, 10); 
        }
        else {
          // no license: trial period is over
          // 1 sec penalty + 1 sec / week.
          countDown = parseInt((licenser.TrialDays * (-1) / 7), 10) + 1; 
        }
      }
    }
		// initialize callback functions
		this.okCALLBACK = callbacksObj.ok || null;
		this.cancelCALLBACK = callbacksObj.cancel || null;
		this.yesCALLBACK = callbacksObj.yes  || null;
		this.noCALLBACK = callbacksObj.no || null;
		// remember parent window
		if (parent) {
      this.parentWindow = parent;
      // if this is the composer window, check if countdown has already been (partically) spent...
      if ("SmartTemplate4_countDown" in parent) {
        countDown = parent.SmartTemplate4_countDown; // remaining seconds.
			} else {
        parent.SmartTemplate4_countDown = countDown; // remember seconds.
			}
    }

		// pass some data as args. we allow nulls for the callbacks
		// avoid using "this" in here as it confuses Tb3?
		let params =
		{
			messageText:    text,
      parsedVars:     parsedVars,
      countDown:      countDown,
      showLicenseButton: callbacksObj ? (callbacksObj.showLicenseButton || false) : false,
      feature: callbacksObj ? (callbacksObj.feature || ""): "",
			okCallback:     SmartTemplate4.Message.okCALLBACK,
			cancelCallback: SmartTemplate4.Message.cancelCALLBACK,
			yesCallback:    SmartTemplate4.Message.yesCALLBACK,
			noCallback:     SmartTemplate4.Message.noCALLBACK
		};

		// open message with main as parent

		let main = this.parentWindow || SmartTemplate4.Util.Mail3PaneWindow,
		    dispFeatures = "chrome,alwaysRaised,dependent,dialog=no," + features; //  close=no,
		main.openDialog("chrome://smarttemplate4/content/smartTemplate-msg.xhtml", "st4message", dispFeatures, params);
		this.parentWindow = null;

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

  windowKeyPress: function(e,dir) {
    function logEvent(eventTarget) {
			try {
				util.logDebugOptional("msg", "KeyboardEvent on unknown target" 
					+ "\n" + "  id: " + (eventTarget.id || '(no id)') 
					+ "\n" + "  nodeName: " + (eventTarget.nodeName || 'null')
					+ "\n" + "  tagName: "  + (eventTarget.tagName || 'none'));
			}
			catch (e) {;}
    }
		function logKey(event) {
			if (!prefs.isDebugOption('msg')) return;
      util.logDebugOptional("msg", 
				(isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') +
			  "charcode = " + e.charCode + " = "  + (String.fromCharCode(e.charCode)).toLowerCase() + "\n" +
        "keyCode = " + e.keyCode);
		}
    const util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences,
          VK_ESCAPE = 0x1B,
          VK_F4 = 0x73;
		let isAlt = e.altKey,
		    isCtrl = e.ctrlKey,
		    isShift = e.shiftKey,
        eventTarget = e.target,
        theKeyPressed = (String.fromCharCode(e.charCode)).toLowerCase();
        
    logKey(e);
    // disable closing window via keyboard:
    // Mac: Command+w
    // Windows,Linux: Alt+F4
    if ( e.keyCode == VK_ESCAPE || 
        (isAlt && e.keyCode == VK_F4) || 
        (theKeyPressed=='w' && e.getModifierState("Meta"))) {
      if (!SmartTemplate4.Message.allowClose) {
        e.preventDefault();
        e.stopPropagation();
      }
      else if (e.type=="keyup") {
        let c = document.getElementById("cancel");
        if (c) c.click();
      }
    }
  } ,
  
  boundKeyListener: false,
  allowClose: false,
  
	loadMessage : async function () {
    const MSG = SmartTemplate4.Message;
    // get important state info from background!
    await SmartTemplate4.Util.init();
    
    function startTimer(duration, label) {
      var timer = duration;
      if (duration < 0) return;
      if (duration == 0) label.setAttribute("collapsed", true);
      let fun = setInterval(
        function () {
          timer--;
          if (timer<=0) {
            clearInterval(fun);
            labellabel.setAttribute("collapsed", true); // hide the label if it is zero!
          }
          label.value = timer.toString(); // make sure the last number shown is 1...
        }, 1000);
    }    

    if (!MSG.boundKeyListener) {
      window.addEventListener("keypress", this.keyListen = function(e) {
        MSG.windowKeyPress(e,'down');
      }, true);
      window.addEventListener("keyup", function(e) {
        MSG.windowKeyPress(e,'up');
      }, true);
      MSG.boundKeyListener = true;
    }


		try {
      let countDown;
      function addButton(id, myCallback) {
        let btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener("click", myCallback, true);
          btn.hidden = false;
          if (countDown) btn.disabled = true;
        }
        return btn;
      }
      
			if (window.arguments && window.arguments.length) {
				let params = window.arguments[0],
				    msgDiv = document.getElementById('innerMessage'),
				    theMessage = params.messageText,
            // split text (passed in with /n as delimiter) into paragraphs
				    textNodes = theMessage.split("\n");
        
        countDown = params.countDown || 0;
        if (countDown) {
          let cdLabel = document.getElementById('countDown');
          startTimer(countDown, cdLabel);
        }
        else {
          SmartTemplate4.Message.allowClose = true;
				}
        
						
				for (let i = 0; i < textNodes.length; i++) {
					// empty nodes will be <br>
					let par = textNodes[i].length ? document.createElement('p') : document.createElement('br');
					if (textNodes[i].length)
						par.textContent = textNodes[i]; // we want this to wrap. won't use unescape for the moment
					msgDiv.appendChild(par);
				}
        let licenseBtnRow = document.getElementById("licensing"),
            removeLicenseButtons = true;
        if (params.parsedVars) {
          let div = document.createElement("div");
          div.id = "code";
          let parsedVars = params.parsedVars,
              varNodes = parsedVars.split("\n");
          for (let i = 0; i < varNodes.length; i++) {
            // empty nodes will be <br>
            let par = varNodes[i].length ? document.createElement('p') : document.createElement('br');
            if (varNodes[i].length)
              par.textContent = varNodes[i]; // we want this to wrap. won't use unescape for the moment
            div.appendChild(par);
          }
          msgDiv.appendChild(div);
				}

				if (licenseBtnRow) {
					const ST4 = SmartTemplate4.Util.mainInstance,
								showDialog = SmartTemplate4.Util.showLicenseDialog.bind(SmartTemplate4.Util),
								openURLInTab = ST4.Util.openURL.bind(ST4.Util),
								featureCompUrl = SmartTemplate4.Util.PremiumFeaturesPage + "#featureComparison";
					if (params.showLicenseButton) {
						removeLicenseButtons = false;
						let btnLicense = document.getElementById("btnShowLicenser"),
								btnFeatureCompare = document.getElementById("btnFeatureCompare"),
								feature = params.feature || "";
						btnLicense.addEventListener("click", 
							function() {
								showDialog(feature);
								window.close();  
							}, true
						);
						btnFeatureCompare.addEventListener("click", 
							function() {
								openURLInTab(featureCompUrl);
								window.close();  
							}, true
						);
						msgDiv.appendChild(licenseBtnRow);
					}
				}
        
        if (removeLicenseButtons) {
          licenseBtnRow.parentNode.removeChild(licenseBtnRow);
				}

				// contents.innerHTML = 'Element Number '+num+' has been added! <a href=\'#\' onclick=\'removeElement('+divIdName+')\'>Remove the div "'+divIdName+'"</a>';
        let buttons = [];

        // ok callback is mandatory!
        buttons.push(addButton('ok', params.okCallback));
				window.st4OkListener = params.okCallback; // this is the minimum
        
				if (params.cancelCallback) {
          buttons.push(addButton('cancel', params.cancelCallback));
					window.st4CancelListener = params.cancelCallback;
				}
				if (params.yesCallback) {
          buttons.push(addButton('yes', params.yesCallback));
					window.st4YesListener = params.yesCallback;
				}
				if (params.noCallback) {
          buttons.push(addButton('no', params.noCallback));
					window.st4NoListener = params.noCallback;
				}
        if (countDown) {
          // enable the buttons after countDown period.
          window.setTimeout( 
            function() {
              for (let i=0; i<buttons.length; i++) {
                if (buttons[i])
                  buttons[i].disabled = false;
              }
              SmartTemplate4.Message.allowClose = true;
            }, countDown*1000);
        }
			}
			else
				alert('window.arguments: ' + window.arguments);
		}
		catch(ex) {
			alert("Exception in loadMessage:" + ex);
			SmartTemplate4.Util.logException("Exception in loadMessage:", ex);
		}
		if (window.sizeToContent) {
			window.sizeToContent();
		}
	} ,

	unloadMessage : function (win) {
		this.okCALLBACK = null;
		this.cancelCALLBACK = null;
		this.yesCALLBACK = null;
		this.noCALLBACK = null;
		this.myWindow = null;
    let cdLabel = document.getElementById('countDown');
    if (cdLabel && cdLabel.value.length>0) {
      let remainingCountdown = parseInt(cdLabel.value,10);
      // composer should remember remaining seconds of countdown;
      win.opener.SmartTemplate4_countDown = remainingCountdown;
    }
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
	} ,
  
  l10n: function() {
    // [mx l10n] 
    SmartTemplate4.Util.localize(window); 
  },
	
};  // ST4.Message


var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
SmartTemplate4.Util.extension = ExtensionParent.GlobalManager.getExtension("smarttemplate4@thunderbird.extension");
// test:
// console.log(`SmartTemplates %cLoading notifyTools.js`, `color: white; background: rgb(180,0,0)`);
Services.scriptloader.loadSubScript(
  SmartTemplate4.Util.extension.rootURI.resolve("chrome/content/scripts/notifyTools.js"),
  SmartTemplate4.Util,
  "UTF-8"
);
