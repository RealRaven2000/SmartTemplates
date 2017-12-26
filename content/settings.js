"use strict";

// -----------------------------------------------------------------------------------
// ---------------------------- last edit at 06/10/2012 ------------------------------
// -----------------------------------------------------------------------------------
// ----------------------------------- Changelog -------------------------------------
// -----------------------------------------------------------------------------------
// 0.7.5: "use strict" suggested by Mozilla add-on review team
// -----------------------------------------------------------------------------------

if (SmartTemplate4.Util.Application == 'Postbox'){ 
  if (typeof XPCOMUtils != 'undefined') {
    XPCOMUtils.defineLazyGetter(this, "NetUtil", function() {
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
    return NetUtil;
    });
  }
  else {
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
  }
}


SmartTemplate4.Settings = {
	accountKey : ".common",  // default to common
	get accountId() {
		// empty for ".common"
		return (this.accountKey !== '.common') ? this.accountKey : ''; 
	},
	Ci : Components.interfaces,
	prefService : Components.classes["@mozilla.org/preferences-service;1"]
									.getService(Components.interfaces.nsIPrefService),
	//******************************************************************************
	// Common functions
	//******************************************************************************

	// Disable DOM node with identity key
	//--------------------------------------------------------------------
	prefDisable : function prefDisable() {
		for (let i = 1; i < arguments.length; i++){
			let el = document.getElementById(arguments[i] + this.accountId);
			el.disabled = arguments[0] ? false : true;
			if (arguments[0]) {
				el.removeAttribute("disabled");
			} 
			else {
				el.setAttribute("disabled", "true");
			}
		}
		return arguments[0];
	},

	// Disable DOM node with identity key
	//--------------------------------------------------------------------
	prefHidden : function prefHidden() {
		for (let i = 1; i < arguments.length; i++){
			let el = document.getElementById(arguments[i] + this.accountId);
			if (arguments[0]) {
				el.hidden = true;
				el.setAttribute("hidden", "true");
			} else {
				el.hidden = false;
				el.removeAttribute("hidden");
			}
		}
		return arguments[0];
	} ,

	// Select Deck with identity key
	//--------------------------------------------------------------------
	prefDeck : function prefDeck(id, index) {
		let deck = document.getElementById(id + this.accountId);
		if (deck)
		  { deck.selectedIndex = index; }

		const idkey = SmartTemplate4.Util.getIdentityKey(document);
		const branch = (idkey == "common") ? ".common" : "." + idkey;
	} ,


	// Return checkbox is checked or not
	//--------------------------------------------------------------------
	isChecked : function isChecked(elId) {
		let com = elId.indexOf('.common');
		if (com>0)
		  elId = elId.substring(0, com); // cut off .common
		return document.getElementById(elId).checked;
	} ,

	// prepare a textbox to receive elements from the help window
	pasteFocus : function pasteFocus(element) {
		let hbox = element.parentNode,
		    vbox = hbox.parentNode.parentNode,
		    txtContainers = vbox.getElementsByClassName("pasteFocus");
		for (let i = 0; i < txtContainers.length; i++) {
			// add the arrow to the hbox that contains this textbox
			// and remove it from all others
			txtContainers[i].className = 
				(txtContainers[i].firstChild == element) ? "pasteFocus hasFocus" : "pasteFocus";
			
		}
	} ,

	// Disable DOM node depeding on checkboxes
	//--------------------------------------------------------------------
	disableWithCheckbox : function disableWithCheckbox() {
		if (this.prefDisable(this.isChecked("new" + this.accountId), "newmsg", "newhtml", "newnbr")) {
			this.prefDisable(this.isChecked("newhtml" + this.accountId), "newnbr");
		}
		if (this.prefDisable(this.isChecked("rsp" + this.accountId), "rspmsg", "rsphtml", "rspnbr", "rsphead", "rspheader")) {
			this.prefDisable(this.isChecked("rsphtml" + this.accountId), "rspnbr");
		}
		if (this.prefDisable(this.isChecked("fwd" + this.accountId), "fwdmsg", "fwdhtml", "fwdnbr", "fwdhead", "fwdheader")) {
			this.prefDisable(this.isChecked("fwdhtml" + this.accountId), "fwdnbr");
		}
	},
	
	clickLogo : function clickLogo() {
		let testString = prompt("Enter name of original string for conversion (empty for entering any text)", "extensions.smarttemplate.id*.rspmsg"),
		    result = "";
		if (testString == '') {
			testString = prompt("Enter a string");
			result = SmartTemplate4.Util.convertPrefValue(testString, true);
		}
		else
			result = SmartTemplate4.Util.convertPrefValue(testString, true);
		
	},

	// Delete unused preferences.
	//--------------------------------------------------------------------
	cleanupUnusedPrefs : function cleanupUnusedPrefs() {
		SmartTemplate4.Util.logDebug('cleanupUnusedPrefs ()');

		let array = this.prefService.getChildList("extensions.smartTemplate4.", {});

		// AG new: preserve common and global settings!
		for (let i in array) {
			let branch = array[i];
			if (document.getElementsByAttribute("name", branch).length === 0
			    &&
			    branch.indexOf("smartTemplate4.id") > 0 )  // AG from now on, we only delete the account specific settings "smartTemplate4.id<N>"
			{
				SmartTemplate4.Util.logDebug('deleting preference branch: ' + branch + ' ...'); // ++++++ RAUS LOESCHEN
				this.prefService.deleteBranch(branch);
			}
		}
	} ,

	//******************************************************************************
	// Preferences library
	//******************************************************************************

	// Create preferences
	//--------------------------------------------------------------------
	setPref1st : function setPref1st(prefbranch) {
		try {
			this.prefService.getBoolPref(prefbranch + "def");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "def", true); }
		try {
			this.prefService.getBoolPref(prefbranch + "new");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "new", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "rsp");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "rsp", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "fwd");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "fwd", false); }
		try {
			this.prefService.getCharPref(prefbranch + "newmsg");
		} catch(e) { this.prefService.setCharPref(prefbranch + "newmsg", ""); }
		try {
			this.prefService.getCharPref(prefbranch + "rspmsg");
		} catch(e) { this.prefService.setCharPref(prefbranch + "rspmsg", ""); }
		try {
			this.prefService.getCharPref(prefbranch + "rspheader");
		} catch(e) { this.prefService.setCharPref(prefbranch + "rspheader", ""); }
		try {
			this.prefService.getCharPref(prefbranch + "fwdmsg");
		} catch(e) { this.prefService.setCharPref(prefbranch + "fwdmsg", ""); }
		try {
			this.prefService.getCharPref(prefbranch + "fwdheader");
		} catch(e) { this.prefService.setCharPref(prefbranch + "fwdheader", ""); }
		try {
			this.prefService.getBoolPref(prefbranch + "newhtml");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "newhtml", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "rsphtml");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "rsphtml", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "fwdhtml");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "fwdhtml", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "newnbr");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "newnbr", false); }  // bug 25571
		try {
			this.prefService.getBoolPref(prefbranch + "rspnbr");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "rspnbr", false); }  // bug 25571
		try {
			this.prefService.getBoolPref(prefbranch + "fwdnbr");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "fwdnbr", false); }  // bug 25571
		try {
			this.prefService.getBoolPref(prefbranch + "rsphead");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "rsphead", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "fwdhead");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "fwdhead", false); }
	} ,

	// Get preference without prefType
	getPref : function getPref(prefstring)	{
		const PS = this.prefService;
		switch (PS.getPrefType(prefstring)) {
			case Components.interfaces.nsIPrefBranch.PREF_STRING:
			  if (SmartTemplate4.Util.PlatformVersion < 57.0) 
					return PS.getComplexValue(prefstring, Components.interfaces.nsISupportsString).data;
				else
					return PS.getStringPref(prefstring);
			case Components.interfaces.nsIPrefBranch.PREF_INT:
				return PS.getIntPref(prefstring);
			case Components.interfaces.nsIPrefBranch.PREF_BOOL:
				return PS.getBoolPref(prefstring);
			default:
				break;
		}
		return false;
	} ,

	// Set preference without prefType
	//--------------------------------------------------------------------
	setPref : function setPref(prefstring, value) {
		switch (this.prefService.getPrefType(prefstring))
		{
			case Components.interfaces.nsIPrefBranch.PREF_STRING:
				return this.prefService.setCharPref(prefstring, value);
			case Components.interfaces.nsIPrefBranch.PREF_INT:
				return this.prefService.setIntPref(prefstring, value);
			case Components.interfaces.nsIPrefBranch.PREF_BOOL:
				return this.prefService.setBoolPref(prefstring, value);
			default:
				break;
		}
		return false;
	} ,


	// Reload preferences and update elements.
	//--------------------------------------------------------------------
	reloadPrefs : function reloadPrefs(el) {
		SmartTemplate4.Util.logDebugOptional("settings.prefs", "reloadPrefs()...");
		el = el.firstChild;
		while (el) {
			// Load preference
			if (el.tagName == "preference") {
				el.value = this.getPref(el.getAttribute("name"));
			}
			el = el.nextSibling;
		}
		SmartTemplate4.Util.logDebugOptional("settings.prefs", "reloadPrefs() COMPLETE");
	} ,

	//******************************************************************************
	// Preferences
	//******************************************************************************

	// Setup default preferences and common settings
	//--------------------------------------------------------------------
	onLoad : function onLoad() {
		const util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences,
					settings = SmartTemplate4.Settings,
					getElement = window.document.getElementById.bind(window.document);
		util.logDebugOptional("functions", "onLoad() ...");
		// Check and set common preference
		this.setPref1st("extensions.smartTemplate4.");
		this.disableWithCheckbox();

		// Set account popup
		let CurId = this.fillIdentityListPopup();

		this.cleanupUnusedPrefs();

		let args = window.arguments,
		    mode = null;
		// Switch account (from account setting)  // add 0.4.0
		if (args && args.length >= 1) {
			if (args[0])
				this.switchIdentity(args[0]);
			if (args.length >=2) {
				mode = args[1].inn.mode;
			}
		}
		else {
			this.switchIdentity(CurId ? CurId : 'common'); // also switch if id == 0! bug lead to common account checkboxes not operating properly!
		}
			

		// disable Use default (common account)
		getElement("use_default").setAttribute("disabled", "true");

		window.onCodeWord = function(code, className) {
			settings.onCodeWord(code, className);
		};

		window.sizeToContent();
		// shrink width
		let deltaShrink = getElement('decksContainer').scrollWidth - window.innerWidth;
		window.resizeBy(deltaShrink + 40, 0); // 40 pixels for paddings etc.

		// let's test if we can get this element
		let prefDialog = getElement('smartTemplate_prefDialog'),
		    hbox = document.getAnonymousElementByAttribute(prefDialog, 'class', 'prefWindow-dlgbuttons'),
		    buttons = [],
		    maxHeight = 0,
		    i = 0;
		// build an array of visible dlg buttons and get their max height
		for (i=0; i < hbox.childNodes.length; i++ ) {
			let b = hbox.childNodes[i],
			    c = b.className;
			// let t = b.tagName;
			if (!b.hidden && (b.tagName == 'xul:button') && (c.indexOf('dialog-button') >= 0)) {
				buttons.push(b);
				let rect = b.getBoundingClientRect(),
				    h = rect.bottom - rect.top;
				maxHeight = (h > maxHeight) ? h : maxHeight;
			}
		}

		// set height of buttons from that array
		let finalHeight = parseInt(maxHeight) - 2; // allow for border.
		for (i=0; i < buttons.length; i++ ) {
			buttons[i].height = finalHeight;
		}

		// set fontsize to the size stored in prefs
		this.fontSize(0);		
		
		// show update button, but only if we run Thunderbird and it is an outdated version:
		if (util.Application === "Thunderbird" 
		    && 
				util.versionSmaller(util.AppverFull, '17.0.8')) {
			getElement("btnUpdateThunderbird").collapsed = false;
		}
		// wait some time so dialog can load first
		if (prefs.getMyBoolPref('hideExamples')) { 
			getElement('templatesTab').collapsed = true;
		}
		else {
			window.setTimeout(function() { settings.loadTemplatesFrame(); }, 5000);
		}
    
    let nickBox = getElement('chkResolveABNick'),
        replaceMail = getElement('chkResolveABRemoveMail'),
        abBox = getElement('chkResolveAB'),
        isPostbox = (util.Application === "Postbox");
    if (isPostbox) {
      prefs.setMyBoolPref('mime.resolveAB', false);
      prefs.setMyBoolPref('mime.resolveAB.preferNick', false);
    }
    
    nickBox.disabled = !abBox.checked || isPostbox;
    replaceMail.disabled = !abBox.checked || isPostbox;
    abBox.disabled = isPostbox;
		
		const licenser = util.Licenser;
					
    /*****  License  *****/
    let buyLabel = util.getBundleString("SmartTemplate4.notification.premium.btn.getLicense", "Buy License!");

    getElement("btnLicense").label = buyLabel;
    // validate License key
    licenser.LicenseKey = prefs.getStringPref('LicenseKey');
    getElement('txtLicenseKey').value = licenser.LicenseKey;
    if (licenser.LicenseKey) {
      this.validateLicenseInOptions(false);
    }
		
		settings.openAdvanced();
		let tabbox = getElement("rightPane");
		// open "ST Pro" tab
		if (mode=='licenseKey') {
			tabbox.selectedPanel = getElement('SmartTemplate4-Options-goPro');
			tabbox.selectedIndex = 5;
		}
    
		util.logDebugOptional("functions", "onLoad() COMPLETE");
		return true;
	} ,
	
	toggleExamples: function toggleExamples(el) {
		document.getElementById('templatesTab').collapsed = (el.checked);
	} ,
	
	loadTemplatesFrame: function loadTemplatesFrame() {
    // deferred loading of templates content
    let templatesIFrame = document.getElementById("templatesIFrame");
    if (!templatesIFrame.getAttribute("src"))
      templatesIFrame.setAttribute("src", "http://smarttemplate4.mozdev.org/templates.html");
	} ,

	onCodeWord : function onCodeWord(code, className) {
    const util = SmartTemplate4.Util,
          settings = SmartTemplate4.Settings;
		util.logDebugOptional("events","Preferences window retrieved code variable: " + code);

		let currentDeck = 'deckB.nodef' + settings.accountId,
		    tabbox = document.getElementById(currentDeck),
		    templateMsgBoxId = '',
		    headerMsgBoxId = '';
		switch (tabbox.selectedIndex) {
			case 0:
				templateMsgBoxId='newmsg';
				if (className.indexOf('noWrite') >= 0) {
					util.displayNotAllowedMessage(code);
					return;
				}
				break;
			case 1:
				templateMsgBoxId = 'rspmsg';
				headerMsgBoxId = 'rspheader';
				break;
			case 2:
				templateMsgBoxId='fwdmsg';
				headerMsgBoxId = 'fwdheader';
				break;
			default: // unknown!
				break;
		}
		if (templateMsgBoxId) {
			templateMsgBoxId += settings.accountId;
			if (headerMsgBoxId)
				headerMsgBoxId += settings.accountId;
			let editBox = document.getElementById(templateMsgBoxId);

			if (headerMsgBoxId) {
			// find out whether the header box has focus instead? => paste there instead.
				let headerBox = document.getElementById(headerMsgBoxId);
				if (headerBox.parentNode.className.indexOf('hasFocus') >=0 ) {
					editBox = headerBox;
				}
			}
      if (code.indexOf('%file')==0) {
        code = settings.getFileName(code,editBox);
        return; // cancel
      }
      if (code.indexOf('%header.')==0) {
        code = settings.getHeaderArgument(code);
      }
			
			settings.insertAtCaret(editBox, code);
		}
	} ,
  
  // %file(filePath,encoding)%
  // %file(imagePath,altText)%
  getFileName: function getFileName(code,editBox) {
    const Cc = Components.classes,
          Ci = Components.interfaces;
    let fileType = (code.indexOf('filePath')>0) ? 'html' :
                   ((code.indexOf('imagePath')>0) ? 'image' : 'unknown'),
		    //localized text for filePicker filter menu
		    strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		    bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties"),
        filterText;
    
    if (fileType=='unknown')
      return false; // error
    
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
		fp.init(window, "", fp.modeOpen); // second parameter: prompt
    switch (fileType) {
      case 'html':
        filterText = bundle.GetStringFromName("fpHTMLFile");
        fp.appendFilter(filterText, "*.htm;*.html;*.txt");
        break;
      case 'image':
        filterText = bundle.GetStringFromName("fpImageFile");
         // fp.appendFilter(filterText, "*.png;*.jpg;*.jpeg;*.bmp;*.dib;*.ico;*.svg;*.gif;*.tif");
        fp.appendFilters(Ci.nsIFilePicker.filterImages);
        break;
    }
    
    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK) {
        if (fp.file) {
          let path = fp.file.path;
          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          try {
            let st4Code = "%file(" + path + ")%"; //. .replace(/\\/g,"/")
            SmartTemplate4.Settings.insertAtCaret(editBox, st4Code);
          }
          catch(ex) {
            ;
          }
        }
      }
    }
    
		if (fp.open)
			fp.open(fpCallback);		
		else { // Postbox
		  fpCallback(fp.show());
		}
    
    return true;    
  } ,

  // header.set(subject,"text")
  // header.set(to,"abc@de.com")
  getHeaderArgument: function getHeaderArgument(code) {
		const Cc = Components.classes,
          Ci = Components.interfaces,
          strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		      bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties");
    let txtArg;
    if (code.indexOf('subject')>0)  {
      txtArg = prompt(bundle.GetStringFromName('prompt.text'));
      return code.replace("text", txtArg);
    }
    else {
      txtArg = prompt(bundle.GetStringFromName('prompt.email'));
      return code.replace("abc@de.com", txtArg);
    }
  } ,
  
	onUnload : function() {
// 		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
	} ,

	// Setup cloned nodes and replace preferences strings
	//--------------------------------------------------------------------
	prefCloneAndSetup : function prefCloneAndSetup(el, branch) {
		SmartTemplate4.Util.logDebugOptional("functions", "prefCloneAndSetup(" + el + ", " + branch + ")");
		// was called replaceAttr
		// AG added .common to the preference names to make it easier to add and manipulate global/debug settings
		function replacePrefName(_el,  key) {
			try {
				const _str = "smartTemplate4.common"; // was "smarttemplate"
				if (_el.hasAttribute("name")) {
					let _attr = _el.getAttribute("name");
					if (_attr.indexOf(_str, 0) >= 0) {
						_el.setAttribute("name", _attr.replace(_str, "smartTemplate4." + key));
					}
				}
			} catch(ex) {}
		}

		// was called appendAttr; this will append the key id to the setting.
		// Note this does not include the .common part
		function replaceAttribute(_el, _attrname, _key) {
			try {
				if (_el.hasAttribute(_attrname)) {
					_el.setAttribute(_attrname, _el.getAttribute(_attrname) + _key);
				}
			} catch(ex) {}
		}

		let key = branch.substr(1); // cut off leading '.'
		let deps = 0;
		// iterate cloned deck.
		// note: this would be easier to rewrite & understand using recursion
		while (el) {
			// Set id, name, prefname
			replaceAttribute(el, "id", branch);
			replacePrefName(el, key); // applies only to preference nodes themselves
			replaceAttribute(el, "preference", branch);

			// Get next node or parent's next node
			if (el.hasChildNodes()) {
				el = el.firstChild;
				deps++;
			}
			else {
				while (deps > 0 && !el.nextSibling) {
					el = el.parentNode;
					deps--;
				}
				el = el.nextSibling;
			}
		}
		SmartTemplate4.Util.logDebugOptional("functions", "prefCloneAndSetup COMPLETE");
	} ,

	//******************************************************************************
	// Identity
	//******************************************************************************

	// Add identity
	//--------------------------------------------------------------------
	addIdentity : function addIdentity(menuvalue) {
		SmartTemplate4.Util.logDebugOptional("functions", "addIdentity(" + menuvalue + ")");
		const  branch = menuvalue == "common" ? ".common" : "." + menuvalue;

		try {
			// Add preferences, if preferences is not create.
			this.setPref1st("extensions.smartTemplate4" + branch + ".");

			// Clone and setup a preference window tags.
			const el = document.getElementById("deckA.per_account"),
			      clone = el.cloneNode(true);

			this.prefCloneAndSetup(clone, branch);
			el.parentNode.appendChild(clone);

			// Reload preferences
			this.reloadPrefs(document.getElementById("templates" + branch));

			// Disabled or Hidden DOM node
			this.accountKey = branch;    // change current id for pref library
			this.prefDeck("default.deckB", this.isChecked("use_default" + branch)?1:0);

			this.disableWithCheckbox();
			// this.accountKey = "";
		}
		catch(ex) {
			SmartTemplate4.Util.logException("Exception in addIdentity(" + menuvalue  +")", ex);
		}
		finally {
			SmartTemplate4.Util.logDebugOptional("functions", "addIdentity COMPLETE");
		}
	} ,

	// Fill identities menu
	//--------------------------------------------------------------------
  // mod 0.3.2
	fillIdentityListPopup : function fillIdentityListPopup() {
		// get current identity
		SmartTemplate4.Util.logDebugOptional("settings","fillIdentityListPopup()");
		const accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].
									  getService(this.Ci.nsIMsgAccountManager).accounts;
		let currentId = 0,
		    CurId = null;
		
		// only when calling from the mail 3 pane window: 
		if (window.opener.GetSelectedMsgFolders) { 
			let folders = window.opener.GetSelectedMsgFolders();
			if (folders.length > 0)
				CurId = window.opener.getIdentityForServer(folders[0].server);
		}
		
		let theMenu = document.getElementById("msgIdentity"),
		    iAccounts = (typeof accounts.Count === 'undefined') ? accounts.length : accounts.Count();
		for (let idx = 0; idx < iAccounts; idx++) {
			let account = accounts.queryElementAt ?
				accounts.queryElementAt(idx, this.Ci.nsIMsgAccount) :
				accounts.GetElementAt(idx).QueryInterface(this.Ci.nsIMsgAccount);

			if (!account.incomingServer)
				continue;

			let iIdentities = (typeof account.identities.Count === 'undefined') ? account.identities.length : account.identities.Count();
			for (let j = 0; j < iIdentities; j++) {
				let identity = account.identities.queryElementAt ?
					account.identities.queryElementAt(j, this.Ci.nsIMsgIdentity) :
					account.identities.GetElementAt(j).QueryInterface(this.Ci.nsIMsgIdentity);

				if (CurId == identity)
					currentId = theMenu.itemCount; // remember position
				theMenu.appendItem(account.incomingServer.prettyName + " - " + identity.identityName, identity.key, "");
				this.addIdentity(identity.key);
			}
		}
		// now select the current identity from the drop down
		theMenu.selectedIndex = currentId;
		return (CurId) ? CurId.key : null;
		
	} ,

	openAdvanced: function openAdvanced() {
		let advancedContainer = document.getElementById('advancedContainer');
		advancedContainer.hidden = false;
		let wid = advancedContainer.scrollWidth;
		window.resizeBy(wid, 0);
		SmartTemplate4.Help.onLoad();
		document.getElementById('btnAdvanced').hidden = true;
		document.getElementById('btnCloseAdvanced').hidden = false;

		let versionBox = document.getElementById('versionBox');
		// let's get the "top" instance of st4, as we know that already knows the version number!!
		versionBox.value = SmartTemplate4.Util.Mail3PaneWindow.SmartTemplate4.Util.Version;
		/*
		window.openDialog('chrome://smarttemplate4/content/help.xul', 'smartTemplate4-help',
		                  'chrome,titlebar,resizable,dependent,alwaysRaised,top=' + window.screenY.toString() + ',left=' + (window.screenX + window.outerWidth).toString(), null);
		window.sizeToContent();
		*/

	} ,

	closeAdvanced: function closeAdvanced() {
		let advancedContainer = document.getElementById('advancedContainer');
		let wid = advancedContainer.scrollWidth;
		advancedContainer.hidden = true;
		window.resizeBy(-wid, 0);
		SmartTemplate4.Help.onUnload();
		document.getElementById('btnAdvanced').hidden = false;
		document.getElementById('btnCloseAdvanced').hidden = true;
	} ,

	// Switch Identity (from account setting window)		// add 0.4.0 S
	//--------------------------------------------------------------------
	switchIdentity : function switchIdentity(idKey)	{
		let el = document.getElementById("msgIdentityPopup").firstChild,
		    index = 0;
		SmartTemplate4.Util.logDebugOptional("identities", "switchIdentity(" + idKey + ")");
		while (el) {
			if (el.getAttribute("value") == idKey) {
			// el.value could not access.. why??
				document.getElementById("msgIdentity").selectedIndex = index;
				// no fire event with set selectedIndex/selectedItem.. why??
				this.selectIdentity(idKey);
				break;
			}
			el = el.nextSibling; index++;
		}
		SmartTemplate4.Util.logDebugOptional("functions", "switchIdentity(" + idKey + ") COMPLETE");

	} , // add 0.4.0 E

	getCurrentDeck : function getCurrentDeck(accountId) {
		return (accountId != ".common")
		  ? 'deckB.nodef' + accountId
			: 'deckB.nodef';
	} ,

	// Select identity (from xul)
	//--------------------------------------------------------------------
	selectIdentity : function selectIdentity(idkey)	{
		SmartTemplate4.Util.logDebugOptional("identities", "selectIdentity(" + idkey +  ")");
		let currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
		    tabbox = document.getElementById(currentDeck);
		if (!tabbox)
			alert("A problem has occured: Cannot find account settings: " + currentDeck); // this shouldn't happen, ever!
		let tabIndex = tabbox.selectedIndex;

		const branch = (idkey == "common") ? ".common" : "." + idkey;

		// Display identity.
		let deck = document.getElementById("account_deckA"),
		    index = 0,
		    searchDeckName = "deckA.per_account" + branch,
		    found = false;

		for (let el = deck.firstChild; el; el = el.nextSibling) {
			if (el.id == searchDeckName) {
				deck.selectedIndex = index;
				this.accountKey = branch;
				found = true;
				break;
			}
			index++;
		}

		// nothing found, then we are in common! (changed from previous behavior where common accountKey was "", now it is ".common"
		if (!found) {
			deck.selectedIndex = 0;
			this.accountKey = branch;
		}

		SmartTemplate4.Util.logDebugOptional("identities", "" + (searchDeckName ? "found" : "could not find") + " deck:" + searchDeckName);

		//reactivate the current tab: new / respond or forward!
		currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId);
		tabbox = document.getElementById(currentDeck);
		if (tabbox) {
			tabbox.selectedIndex = tabIndex;
      let txtDump = '',
          tabboxArray = tabbox.getElementsByTagName('textbox');
      for (let i=0; i<tabboxArray.length; i++)
        txtDump += tabboxArray[i].value;  // append all texts
      // disable / enable Save button in case template is empty
      let disableSave = (txtDump.length===0) && (document.getElementById('use_default.' + this.currentId).checked === true);
      document.getElementById('btnSaveTemplate').disabled = disableSave;
    }
		SmartTemplate4.Util.logDebugOptional("identities", "selectIdentity(" + idkey + ") COMPLETE");

	} ,

	insertAtCaret : function insertAtCaret(element, code) {
		// code = code + ' '; // this could be an option in a future version...
		if (!element) {
			SmartTemplate4.Util.logToConsole("insertAtCaret for variable '" + code + "' cannot be done - no element passed!");
			return;
		}

		let el, node;
		el =  element.id ? "  id=" + element.id : "";
		el += element.nodeName ? "  nodeName=" + element.nodeName : "";
		el += element.name ? "  name=" + element.name : "";
		SmartTemplate4.Util.logDebugOptional("events", "insertAtCaret(" + el + "): field Code = " + code);
		try {
			node = element.nodeName;
			element.focus();
			if (node=="HTML") { // Composer Windows /
			    if (window.getSelection && window.getSelection().getRangeAt) {
			        range = window.getSelection().getRangeAt(0);
			        node = range.createContextualFragment(code);
			        range.insertNode(node);
			    } else if (document.selection && document.selection.createRange) {
			        document.selection.createRange().pasteHTML(code);
			    }
			}
			else {
				let startSel = element.selectionStart;
				let endSel = element.selectionEnd;
				if (!element.value)
					element.value = "" + code;
				else
					element.value = element.value.substring(0, startSel) + code + element.value.substring(endSel, element.value.length);
				//element.preference.getElementValue (element); 
				// make sure pref is updated! => Nils Maier Review
				let evt = document.createEvent("Events");
				evt.initEvent("change", true, false);
				element.dispatchEvent(evt);
				
				element.selectionStart = startSel+code.length;
				element.selectionEnd = startSel+code.length;
			}
			window.focus(); // wahrscheinlich ueberfluessich
			element.focus();
		}
		catch(e) {
			SmartTemplate4.Util.logException("Exception in insertAtCaret; (nodeName=" + node  +")", e);
		}
	} , 
	
	textDropped: function textDropped(evt) {
	  // drop event is still ongoing, so we set a timeout to make sure the text is inserted first
		let element = evt.target;
		window.setTimeout(function() {
			let newEvent = document.createEvent("Events");
			newEvent.initEvent("change", true, false);
			element.dispatchEvent(newEvent);
			},250); // 250ms should be sufficient
	} ,

	fontSize: function fontSize(change) {
		// find class rule for .templateBox and change font-size
		let ss;
		let size = SmartTemplate4.Preferences.getMyIntPref("font.size");
		
		size = size + change;
		if (size < 7) 
			size = 7;
		if (size > 16) 
			size = 16;

		let fs = document.getElementById('txtFontSize');
		if (fs)
			fs.value = size;
			
		let fontSizeString = size.toString() + 'pt',
		    off = new Object();
		off.offset = 0;
		// iterate all style sheets! off.offset will be increased to continue from the last find.
		while ( (ss = SmartTemplate4.Styles.getMyStyleSheet('chrome://global/skin/style.css', "SmartTemplateSettings", off)) ) {
			SmartTemplate4.Styles.setElementStyle(ss, '.templateBox', 'font-size', fontSizeString, true);
		}
		SmartTemplate4.Preferences.setMyIntPref("font.size", size);
	} ,
  
  resolveAB_onClick: function resolveAB_onClick(el) {
    // if it was already checked we are now unchecking it...
    let nickBox = document.getElementById('chkResolveABNick'),
        replaceMail = document.getElementById('chkResolveABRemoveMail');
    if (el.checked) {
      nickBox.checked = false;
      nickBox.disabled = true;
      replaceMail.disabled = true;
    }
    else {
      nickBox.disabled = false;
      replaceMail.disabled = false;
    }
  } ,
  
  get currentId () {
    let key = document.getElementById('msgIdentity').value;
    return key;
  },
  
  get currentAccountName() {
    const  Ci = Components.interfaces,
           accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].
									  getService(Ci.nsIMsgAccountManager).accounts;
    let theMenu = document.getElementById("msgIdentity"),
        menuEntry = theMenu.label,
        end = menuEntry.indexOf(' <');
    if (end>0)
      return menuEntry.substring(0, end);
    else
      return menuEntry;
  },
  
  fileAccountSettings: function fileAccountSettings(mode, jsonData, fname) {
    // readData: this function does the actual work of interpreting the read data
    // and setting the UI values of currently selected deck accordingly:
    function readData(data) {
      function updateElement(el, stem, targetId) {
        // id target is common, append .id#, otherwise replace the .id#
        let oldId = targetId ? el.id.replace(targetId, stem) : el.id + stem,
            evt = document.createEvent("Events");
        // set element value (text / checkbox) from json data
        if (el.tagName == 'checkbox')
          el.checked = settings[oldId];
        else
          el.value = settings[oldId]; // textbox
        // force preference update
        evt.initEvent("change", true, false);
        el.dispatchEvent(evt);
      }
      let settings = JSON.parse(data);
      // jsonData = the key
      // every identifier ends with id#; we need to replace the number with the current key!
      // or match the string up to .id!
      
      // we need to read one keyname of one (the first) json member
      // e.g "newmsg.id1"
      let sourceId = Object.keys(settings)[0];
      if (sourceId) {
        // cut off variable before .id1
        // find out if specific identity or common
        // and only then append identity extension
        // jsonData.key has target identity and this can be "common"
        let isSrcIdentity = (sourceId.indexOf('.id') > 0),
            stem = isSrcIdentity ? sourceId.substr(sourceId.lastIndexOf('.')) : '', // use empty key for common case
            isTargetIdentity = (jsonData.key!='common' || jsonData.key==''),
            targetId = isTargetIdentity ? ('.' + jsonData.key) : '';
        if (isTargetIdentity) {
          // uncheck 'use common' checkbox
          document.getElementById('use_default' + targetId).checked = false;
          SmartTemplate4.Settings.prefDeck('default.deckB', 0);
        }
        for (let i=0; i<jsonData.textboxes.length; i++) {
          updateElement(jsonData.textboxes[i], stem, targetId);
          // check use_default
        }
        for (let i=0; i<jsonData.checkboxes.length; i++) {
          // e.g newmsg.id1
          let el = jsonData.checkboxes[i];
          updateElement(el, stem, targetId);
        }
        // update enable / disable textboxes from checkbox data.
        SmartTemplate4.Settings.disableWithCheckbox();
      }                  
    }
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = SmartTemplate4.Util;
		util.popupProFeature(mode + "_template", true, false); // save_template, load_template
					
    let //localized text for filePicker filter menu
		    strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		    bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties"),
        filterText;
    
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
        fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;
    
		fp.init(window, "", fileOpenMode); // second parameter: prompt
    filterText = bundle.GetStringFromName("fpJsonFile");
    fp.appendFilter(filterText, "*.json");
    fp.defaultExtension = 'json';
    if (mode == 'save') {
      fp.defaultString = fname + '.json';
    }
    
    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
        if (fp.file) {
          let path = fp.file.path;
          if (util.Application=='Postbox') {
            switch (mode) {
              case 'load':
                let settings = SmartTemplate4.Settings.Postbox_readFile(path);
                readData(settings);
                return;
              case 'save':
                SmartTemplate4.Settings.Postbox_writeFile(path, jsonData)
                return;
            }
            throw ('invalid mode: ' + mode);
          }
          
          const {OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
          
          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          switch (mode) {
            case 'load':
              let promiseRead = OS.File.read(path, { encoding: "utf-8" }); //  returns Uint8Array
              promiseRead.then(
                function readSuccess(data) {
                  debugger;
                  readData(data);
                },
                function readFailed(ex) {
                  util.logDebug ('read() - Failure: ' + ex); 
                }
              )
              break;
            case 'save':
              // if (aResult == Ci.nsIFilePicker.returnReplace)
              let promiseDelete = OS.File.remove(path);
              // defined 2 functions
              util.logDebug ('Setting up promise Delete');
              promiseDelete.then (
                function saveJSON() {
                  util.logDebug ('saveJSON()...'); 
                  // force appending correct file extension!
                  if (!path.toLowerCase().endsWith('.json'))
                    path += '.json';
                  let promiseWrite = OS.File.writeAtomic(path, jsonData, { encoding: "utf-8"});
                  promiseWrite.then(
                    function saveSuccess(byteCount) {
                      util.logDebug ('successfully saved ' + byteCount + ' bytes to file');
                    },
                    function saveReject(fileError) {  // OS.File.Error
                      util.logDebug ('bookmarks.save error:' + fileError);
                    }
                  );
                },
                function failDelete(fileError) {
                  util.logDebug ('OS.File.remove failed for reason:' + fileError); 
                }
              );
              break;
          }
        }
      }
    }
    
		if (fp.open)
			fp.open(fpCallback);		
		else { // Postbox
		  fpCallback(fp.show());
		}
    
    return true;    
  } ,
  
  Postbox_writeFile: function Pb_writeFile(path, jsonData) {
    const Ci = Components.interfaces,
          Cc = Components.classes;
    
    let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile); // Postbox specific. deprecated in Tb 57
    file.initWithPath(path);
    // stateString.data = aData;
    // Services.obs.notifyObservers(stateString, "sessionstore-state-write", "");

    // Initialize the file output stream.
    let ostream = Cc["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    ostream.init(file, 
                 0x02 | 0x08 | 0x20,   // write-only,create file, reset if exists
                 0x600,   // read+write permissions
                 ostream.DEFER_OPEN); 

    // Obtain a converter to convert our data to a UTF-8 encoded input stream.
    let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";

    // Asynchronously copy the data to the file.
    let istream = converter.convertToInputStream(jsonData); // aData
    NetUtil.asyncCopy(istream, ostream, function(rc) {
      if (Components.isSuccessCode(rc)) {
        // do something for success
      }
    });
  } ,
  
  Postbox_readFile: function Pb_readFile(path) {
    const Ci = Components.interfaces,
          Cc = Components.classes;
    let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile); // Postbox specific. deprecated in Tb 57
    file.initWithPath(path);
          
    let fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Ci.nsIFileInputStream);
    fstream.init(file, -1, 0, 0);

    let cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Ci.nsIConverterInputStream);
    cstream.init(fstream, "UTF-8", 0, 0);

    let string  = {};
    cstream.readString(-1, string);
    cstream.close();
    return string.value;    
  }, 
  
  store: function store() {
      // let's get all the settings from the key and then put them in a json structure:
    const util = SmartTemplate4.Util,
          settings = SmartTemplate4.Settings;
    let key = this.currentId,
        currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
        tabbox = document.getElementById(currentDeck),
        txt = tabbox.getElementsByTagName('textbox'),
        chk = tabbox.getElementsByTagName('checkbox'),
        entry = {};
        
        // anonymize by truncating id# ?
    for (let i=0; i<txt.length; i++) {
      let t = txt[i];
      entry[t.id] = t.value;
    }
    for (let i=0; i<chk.length; i++) {
      let c = chk[i];
      entry[c.id] = c.checked ? true : false;
    }
    let json = JSON.stringify(entry, null, '  '); // prettified with indentation
    settings.fileAccountSettings('save', json, this.currentAccountName);
  } ,
  
  load: function load() {
    let currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
        tabbox = document.getElementById(currentDeck),
        txt = tabbox.getElementsByTagName('textbox'),
        chk = tabbox.getElementsByTagName('checkbox');
    SmartTemplate4.Settings.fileAccountSettings('load', 
        {key: this.currentId, 
         textboxes:txt, 
         checkboxes:chk}
    );
  } ,
	
  trimLicense: function trimLicense() {
		const util = SmartTemplate4.Util;
    let txtBox = document.getElementById('txtLicenseKey'),
        strLicense = txtBox.value.toString();
    util.logDebug('trimLicense() : ' + strLicense);
    strLicense = strLicense.replace(/^\s+|\s+$/g, ''); // remove line breaks
    strLicense = strLicense.replace('\[at\]','@');
    txtBox.value = strLicense;
    util.logDebug('trimLicense() result : ' + strLicense);
    return strLicense;
  } ,
  
  enablePremiumConfig: function enablePremiumConfig(isEnabled) {
		/* future function: enables premium configuration UI
    let getElement      = document.getElementById.bind(document),
        premiumConfig   = getElement('premiumConfig'),
        quickJump       = getElement('chkQuickJumpHotkey'),
        quickMove       = getElement('chkQuickMoveHotkey'),
        quickCopy       = getElement('chkQuickCopyHotkey'),
        quickJumpTxt    = getElement('qf-QuickJumpShortcut'),
        quickMoveTxt    = getElement('qf-QuickMoveShortcut'),
        quickCopyTxt    = getElement('qf-QuickCopyShortcut'),
        quickMoveFormat = getElement('menuQuickMoveFormat'),
        quickMoveDepth  = getElement('quickmove-path-depth'),
        multiCategories = getElement('chkCategories');
    premiumConfig.disabled = !isEnabled;
    quickJump.disabled = !isEnabled;
    quickMove.disabled = !isEnabled;
    quickCopy.disabled = !isEnabled;
    quickJumpTxt.disabled = !isEnabled;
    quickMoveTxt.disabled = !isEnabled;
    quickCopyTxt.disabled = !isEnabled;
    quickMoveFormat.disabled = !isEnabled;
    quickMoveDepth.disabled = !isEnabled;
    multiCategories.disabled = !isEnabled;
		*/
  },
  
  decryptLicense: function decryptLicense(testMode) {
		const util = SmartTemplate4.Util,
		      licenser = util.Licenser,
					State = licenser.ELicenseState;
    let getElement = document.getElementById.bind(document),
        validationPassed       = getElement('validationPassed'),
        validationFailed       = getElement('validationFailed'),
        validationExpired      = getElement('validationExpired'),
        validationInvalidEmail = getElement('validationInvalidEmail'),
        validationEmailNoMatch = getElement('validationEmailNoMatch'),
        decryptedMail, decryptedDate,
				result = State.NotValidated;
    validationPassed.collapsed = true;
    validationFailed.collapsed = true;
    validationExpired.collapsed = true;
    validationInvalidEmail.collapsed = true;
    validationEmailNoMatch.collapsed = true;
    this.enablePremiumConfig(false);
    try {
      this.trimLicense();
      let txtBox = getElement('txtLicenseKey'),
          license = txtBox.value;
      // store new license key
      if (!testMode) // in test mode we do not store the license key!
        SmartTemplate4.Preferences.setStringPref('LicenseKey', license);
      
      let maxDigits = SmartTemplate4.Crypto.maxDigits, // this will be hardcoded in production 
          LicenseKey,
          crypto = licenser.getCrypto(license),
          mail = licenser.getMail(license),
          date = licenser.getDate(license);
      if (SmartTemplate4.Preferences.isDebug) {
        let test = 
            "┌───────────────────────────────────────────────────────────────┐\n"
          + "│ SmartTemplate4.Licenser found the following License components:\n"
          + "│ Email: " + mail + "\n"
          + "│ Date: " + date + "\n"
          + "│ Crypto: " + crypto + "\n"
          + "└───────────────────────────────────────────────────────────────┘";
        if (testMode)
          util.alert(test);
        util.logDebug(test);
      }
      if (crypto)
        [result, LicenseKey] = licenser.validateLicense(license, maxDigits);
      else { // reset internal state of object if no crypto can be found!
        result = State.Invalid;
				licenser.DecryptedDate = "";
				licenser.DecryptedMail = "";
			}
      decryptedDate = licenser.DecryptedDate;
      getElement('licenseDate').value = decryptedDate; // invalid ??
      decryptedMail = licenser.DecryptedMail;
      switch(result) {
        case State.Valid:
          this.enablePremiumConfig(true);
          validationPassed.collapsed=false;
          // test code
          // getElement('txtEncrypt').value = LicenseKey;
          break;
        case State.Invalid:
          validationFailed.collapsed=false;
          break;
        case State.Expired:
          validationExpired.collapsed=false;
          break;
        case State.MailNotConfigured:
          validationInvalidEmail.collapsed=false;
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
          break;
        case State.MailDifferent:
          validationFailed.collapsed=false;
          validationEmailNoMatch.collapsed=false;
          break;
        default:
          Services.prompt.alert(null,"SmartTemplate4",'Unknown license status: ' + result);
          break;
      }
      if (testMode) {
      //  getElement('txtEncrypt').value = 'Date = ' + decryptedDate + '    Mail = ' +  decryptedMail +  '  Result = ' + result;
      }
      else {
        // reset License status of main instance
				util.Licenser.ValidationStatus =
              result != State.Valid ? State.NotValidated : result;
        util.Licenser.wasValidityTested = true; // no need to re-validate there
      }
      
    }    
    catch(ex) {
      util.logException("Error in SmartTemplate4.Settings.decryptLicense():\n", ex);
    }
		return result;
  } ,
  
  pasteLicense: function pasteLicense() {
    let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable),
        str       = {},
        strLength = {},
        finalLicense = '';        
    trans.addDataFlavor("text/unicode");
    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);

    trans.getTransferData("text/unicode", str, strLength);
    if (strLength.value) {
      if (str) {
        let pastetext = str.value.QueryInterface(Components.interfaces.nsISupportsString).data,
            txtBox = document.getElementById('txtLicenseKey'),
            strLicense = pastetext.toString();
        txtBox.value = strLicense;
        finalLicense = this.trimLicense();
      }    
    }
    if (finalLicense) {
      this.validateLicenseInOptions(false);
    }
  } ,
  
  validateLicenseInOptions: function validateLicenseInOptions(testMode) {
		function replaceCssClass(el,addedClass) {
			try {
				el.classList.add(addedClass);
				if (addedClass!='paid')	el.classList.remove('paid');
				if (addedClass!='expired') el.classList.remove('expired');
				if (addedClass!='free')	el.classList.remove('free');
			}
			catch(ex) {
				util.logException("replaceCssClass(" + el + "):\n", ex);
			}
		}
		const util = SmartTemplate4.Util,
					State = util.Licenser.ELicenseState; 
    let wd = window.document,
        getElement = wd.getElementById.bind(wd),
        btnLicense = getElement("btnLicense"),
				proTab = getElement("SmartTemplate4-Pro"),
				beautyTitle = getElement("SmartTemplate4AboutLogo");
    try {
			let result = this.decryptLicense(testMode);
			switch(result) {
				case State.Valid:
				  btnLicense.collapsed = true;
					replaceCssClass(proTab, 'paid');
					replaceCssClass(btnLicense, 'paid');
					beautyTitle.classList.remove('aboutLogo');
					beautyTitle.classList.add('aboutLogoPro');
				  break;
				case State.Expired:
					btnLicense.label = util.getBundleString("SmartTemplate4.notification.premium.btn.renewLicense", "Renew License!");
				  btnLicense.collapsed = false;
					replaceCssClass(proTab, 'expired');
					replaceCssClass(btnLicense, 'expired');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/skin/logo-pro.png");
					break;
				default:
				  btnLicense.collapsed = false;
					replaceCssClass(proTab, 'free');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/skin/logo.png");
				  btnLicense.label = util.getBundleString("SmartTemplate4.notification.premium.btn.getLicense", "Buy License!");
					beautyTitle.classList.add('aboutLogo');
					beautyTitle.classList.remove('aboutLogoPro');
			}
			util.logDebug('validateLicense - result = ' + result);
    }
    catch(ex) {
      util.logException("Error in SmartTemplate4.Settings.validateLicenseInOptions():\n", ex);
    }
  } 
	

};