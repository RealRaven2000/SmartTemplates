"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/


SmartTemplate4.Settings = {
  dialogHeight: 0,
	accountKey : ".common",  // default to common; .file for files
	preferenceElements : [],
	get isFileTemplates() {
		// let isEnabled = SmartTemplate4.Preferences.getMyBoolPref("fileTemplates");
		return true;
	} ,
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
	// @arg[0] = enabled
	// @arg[1] = accouint id ("", ".id1", ".id2" etc..)
	// @arg[2..n] = which options to disable / enable
	prefDisable : function prefDisable() {
		let enable = arguments[0],
		    accountId = arguments[1];
		for (let i = 2; i < arguments.length; i++){
			let el = document.getElementById(arguments[i] + accountId);
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

		const idkey = SmartTemplate4.Util.getIdentityKey(document),
		      branch = (idkey == "common") ? ".common" : "." + idkey;
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
	disableWithCheckbox : function disableWithCheckbox(el) {
		// change this to reading prefs instead! called during addidentity!!
		
		const account = this.accountId; // "", ".id1", ".id2" ...
		if (!el) {
			const prefs = SmartTemplate4.Preferences,
			      service = this.prefService,
						branch = ((account || ".common") + ".").substr(1);  // cut off leading [.] for getting bool pref
						
			// initialise all checkboxes for this account according to pref settings!
			if (this.prefDisable(prefs.getMyBoolPref(branch + "new"), account, "newmsg", "newhtml", "newnbr")) {
				this.prefDisable(prefs.getMyBoolPref(branch + "newhtml"), account, "newnbr");
			}
			if (this.prefDisable(prefs.getMyBoolPref(branch + "rsp"), account, "rspmsg", "rsphtml", "rspnbr", "rsphead", "rspheader")) {
				this.prefDisable(prefs.getMyBoolPref(branch + "rsphtml"), account, "rspnbr");
			}
			if (this.prefDisable(prefs.getMyBoolPref(branch + "fwd"), account, "fwdmsg", "fwdhtml", "fwdnbr", "fwdhead", "fwdheader")) {
				this.prefDisable(prefs.getMyBoolPref(branch + "fwdhtml"), account, "fwdnbr");
			}
		}
		else {
			let ids = (el.id).split('.'); 
			switch (ids[0]) { // eg "new" or "new.id1"
				case "new":
				  this.prefDisable(this.isChecked("new" + account), account, "newmsg", "newhtml", "newnbr");
				// fall through
				case "newhtml":
					this.prefDisable(this.isChecked("newhtml" + account), account, "newnbr");
					break;
				// ======================
				case "rsp":
					this.prefDisable(this.isChecked("rsp" + account), account, "rspmsg", "rsphtml", "rspnbr", "rsphead", "rspheader");
				// fall through
				case "rsphtml":					
					this.prefDisable(this.isChecked("rsphtml" + account), account, "rspnbr");
				  break;
				// ======================
				case "fwd":
					this.prefDisable(this.isChecked("fwd" + account), account, "fwdmsg", "fwdhtml", "fwdnbr", "fwdhead", "fwdheader");
				// fall through
				case "fwdhtml":
					this.prefDisable(this.isChecked("fwdhtml" + account), account, "fwdnbr");
					break;
			}
		}
	},
	
	clickLogo : function clickLogo() {
		const util = SmartTemplate4.Util;
		let testString = prompt("Enter name of original string for conversion (empty for entering any text)", "extensions.smarttemplate.id*.rspmsg"),
		    result = "";
		if (testString == '') {
			testString = prompt("Enter a string");
			result = util.convertPrefValue(testString, true);
		}
		else
			result = util.convertPrefValue(testString, true);
		
	},

	// Delete unused preferences.
	//--------------------------------------------------------------------
	cleanupUnusedPrefs : function cleanupUnusedPrefs() {
		const util = SmartTemplate4.Util;
		util.logDebug('cleanupUnusedPrefs ()');

		let array = this.prefService.getChildList("extensions.smartTemplate4.", {});

		// AG new: preserve common and global settings!
		for (let i in array) {
			let branch = array[i];
			if (document.getElementsByAttribute("name", branch).length === 0
			    &&
			    branch.indexOf("smartTemplate4.id") > 0 )  // AG from now on, we only delete the account specific settings "smartTemplate4.id<N>"
			{
				util.logDebug('deleting preference branch: ' + branch + ' …'); // ++++++ RAUS LOESCHEN
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
		function setStringPref(pref, val) {
      prefService.setStringPref(pref, val);
		}
		function getStringPref(pref) {
			if (prefService.getStringPref)
				return prefService.getStringPref(pref);
			else
				return prefService.getCharPref(pref);
		}
		const prefService = this.prefService;
		
		try {
			prefService.getBoolPref(prefbranch + "def");
		} catch(e) { prefService.setBoolPref(prefbranch + "def", true); }
		try {
			prefService.getBoolPref(prefbranch + "new");
		} catch(e) { prefService.setBoolPref(prefbranch + "new", false); }
		try {
			prefService.getBoolPref(prefbranch + "rsp");
		} catch(e) { prefService.setBoolPref(prefbranch + "rsp", false); }
		try {
			prefService.getBoolPref(prefbranch + "fwd");
		} catch(e) { prefService.setBoolPref(prefbranch + "fwd", false); }
		try {
			getStringPref(prefbranch + "newmsg");
		} catch(e) { setStringPref(prefbranch + "newmsg", ""); }
		try {
			getStringPref(prefbranch + "rspmsg");
		} catch(e) { setStringPref(prefbranch + "rspmsg", ""); }
		try {
			getStringPref(prefbranch + "rspheader");
		} catch(e) { setStringPref(prefbranch + "rspheader", ""); }
		try {
			getStringPref(prefbranch + "fwdmsg");
		} catch(e) { setStringPref(prefbranch + "fwdmsg", ""); }
		try {
			getStringPref(prefbranch + "fwdheader");
		} catch(e) { setStringPref(prefbranch + "fwdheader", ""); }
		try {
			prefService.getBoolPref(prefbranch + "newhtml");
		} catch(e) { prefService.setBoolPref(prefbranch + "newhtml", false); }
		try {
			prefService.getBoolPref(prefbranch + "rsphtml");
		} catch(e) { prefService.setBoolPref(prefbranch + "rsphtml", false); }
		try {
			prefService.getBoolPref(prefbranch + "fwdhtml");
		} catch(e) { prefService.setBoolPref(prefbranch + "fwdhtml", false); }
		try {
			prefService.getBoolPref(prefbranch + "newnbr");
		} catch(e) { prefService.setBoolPref(prefbranch + "newnbr", false); }  // bug 25571
		try {
			prefService.getBoolPref(prefbranch + "rspnbr");
		} catch(e) { prefService.setBoolPref(prefbranch + "rspnbr", false); }  // bug 25571
		try {
			prefService.getBoolPref(prefbranch + "fwdnbr");
		} catch(e) { prefService.setBoolPref(prefbranch + "fwdnbr", false); }  // bug 25571
		try {
			prefService.getBoolPref(prefbranch + "rsphead");
		} catch(e) { prefService.setBoolPref(prefbranch + "rsphead", false); }
		try {
			prefService.getBoolPref(prefbranch + "fwdhead");
		} catch(e) { prefService.setBoolPref(prefbranch + "fwdhead", false); }
	} ,

	// Get preference without prefType
	getPref : function getPref(prefstring)	{
		const PS = this.prefService;
		switch (PS.getPrefType(prefstring)) {
			case Components.interfaces.nsIPrefBranch.PREF_STRING:
			  if (typeof PS.getStringPref === 'function') 
					return PS.getStringPref(prefstring);
				else // outdated code, not used by anything modern:
					return PS.getComplexValue(prefstring, Components.interfaces.nsISupportsString).data;
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
	setPref : function setPref(prefstring, value) {
		const Ci = Components.interfaces;
		switch (this.prefService.getPrefType(prefstring)) {
			case Ci.nsIPrefBranch.PREF_STRING:
				let retval = this.prefService.setStringPref(prefstring, value);
				return retval;
			case Ci.nsIPrefBranch.PREF_INT:
				return this.prefService.setIntPref(prefstring, value);
			case Ci.nsIPrefBranch.PREF_BOOL:
				return this.prefService.setBoolPref(prefstring, value);
			default:
				break;
		}
		return false;
	} ,	
  
  resizeSettings: function(evt) {
		const util = SmartTemplate4.Util,
          settings = SmartTemplate4.Settings,
					getElement = window.document.getElementById.bind(window.document),
          dlg = getElement('smartTemplate_prefDialog');
    
    // only do something if height changes!
    if (settings.dialogHeight && dlg.clientHeight == settings.dialogHeight)
      return;
    settings.dialogHeight = dlg.clientHeight; // remember new height
    
    let decksWrapper = getElement('decksWrapper'),
        templateBoxes = decksWrapper.getElementsByClassName('template');
    for (let i=0; i<templateBoxes.length; i++) {
      let t = templateBoxes[i];
      t.style.height = (t.parentNode.clientHeight - 15) + "px";
    }
    
    let quoteBoxes = decksWrapper.getElementsByClassName('quote');
    for (let i=0; i<quoteBoxes.length; i++) {
      let t = quoteBoxes[i];
      t.style.height = (t.parentNode.clientHeight - 15) + "px";
    }
        
    let writeBoxes = decksWrapper.getElementsByClassName('templateWrite');
    for (let i=0; i<writeBoxes.length; i++) {
      let t = writeBoxes[i],
          cbs = t.parentNode.getElementsByTagName('checkbox'),
          cbHeight = 0;
      for (let j=0; j<cbs.length; j++) {
        cbHeight += cbs[j].clientHeight;
      }
      
      t.style.height = (t.parentNode.clientHeight - 25 - cbHeight) + "px";
    }
    
  },

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
    
		let isAdvancedPanelOpen = prefs.getMyBoolPref('expandSettings'),
        composeType = null;
					
		util.logDebugOptional("functions", "onLoad() …");

		// preferencesBindings waits for all its actions on DOMContentLoaded, 
		// not only for the init, but also for the load of values.
		// We need to wait with init until AFTER onDOMContentLoaded,
		// because we need to manipulate the DOM
		// When we are ready, we need to retrigger onDOMContentLoaded
		Services.scriptloader.loadSubScript("chrome://global/content/preferencesBindings.js", window, "UTF-8");

		// Check and set common preference
		this.setPref1st("extensions.smartTemplate4.");
		this.disableWithCheckbox();
    
		// Set account popup, duplicate DeckB to make account isntances
		let CurId = this.fillIdentityListPopup();
		this.loadPreferences(); // initialise instantApply attributes for all nodes (including cloned ones)
		// DOM is manipulated now, trigger preferencesBindings.js
		let fakeOnDOMContentLoaded = new Event('DOMContentLoaded');
		window.dispatchEvent(fakeOnDOMContentLoaded);
    
		// let's take this one out, to see...
		// this.cleanupUnusedPrefs();

		let args = window.arguments,
		    mode = null;
		// Switch account (from account setting)  // add 0.4.0
    try {
      if (args && args.length >= 1) {
        if (args[0])
          this.switchIdentity(args[0]);
        if (args.length >=2) {
          let inParams = args[1].inn;
          mode = inParams.mode;
          if (mode == "fileTemplates")
            isAdvancedPanelOpen = false; // simplify the window.
          if (inParams.composeType) {
            composeType = inParams.composeType;
          }
        }
      }
      else {
        this.switchIdentity(CurId ? CurId : 'common'); // also switch if id == 0! bug lead to common account checkboxes not operating properly!
      }
    }
    catch(ex) {
      util.logException("Settings onLoad() switching account", ex);
    }
			

		// disable Use default (common account)
		getElement("use_default").setAttribute("disabled", "true");

		window.onCodeWord = function(code, className) {
			settings.onCodeWord(code, className);
		};
    
		window.addEventListener('resize', settings.resizeSettings);

    window.setTimeout( 
		  function() {
				let actDropDown = getElement('msgIdentity');
				actDropDown.style.maxWidth = "350px"; // avoid the dialog getting super wide by restricting the hbox with the selected value.
				if (isAdvancedPanelOpen) {
					window.sizeToContent(); // times out on - get_editable@chrome://global/content/bindings/menulist.xml:134:1
					// shrink width
					let deltaShrink = getElement('decksContainer').scrollWidth - window.innerWidth;
					if (deltaShrink>40)
						window.resizeBy(deltaShrink + 40, 0); // 40 pixels for paddings etc.
				}
				if (util.HostSystem.toLowerCase().startsWith("linux"))
					window.resizeBy(0,55); // show Ok / Cancel buttons.
				// make sure we are not moved partly off screen
				if (window.opener && window.opener.document.documentURI.endsWith("messenger.xhtml")) {
					let parentWidth = window.opener.outerWidth,
					    parentX = window.opener.screenX,
							parentRight = parentX + parentWidth;
					
					let offScreenX = window.screenX + window.outerWidth;
					
					if (offScreenX > parentRight) {
						// move window to left if it's outside of right hand of screen
						window.moveBy (parentRight - offScreenX - 10, 0);
					}
					
							
				}
				
				setTimeout( function() {
					  actDropDown.style.maxWidth = null; // undo width restrictions 
				  }, 250
				);
				
				
				
				// let's test if we can get this element
				let prefDialog = getElement('smartTemplate_prefDialog'),
						hbox = util.getAnonymousElementByAttribute(prefDialog, 'class', 'prefWindow-dlgbuttons'),
//						hbox = document.getAnonymousElementByAttribute(prefDialog, 'class', 'prefWindow-dlgbuttons'),
						buttons = [],
						maxHeight = 0,
						i = 0;
				// build an array of visible dlg buttons and get their max height
				if (hbox) {
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
				}
				else
					util.logDebug("no prefWindow-dlgbuttons element!");				
				
			} 
		);

		// set fontsize to the size stored in prefs
		this.fontSize(0);		
		
		// wait some time so dialog can load first
		if (prefs.getMyBoolPref('hideExamples')) { 
			getElement('templatesTab').collapsed = true;
		}
		else {
			window.setTimeout(function() { settings.loadTemplatesFrame(); }, 5000);
		}
    
    let nickBox = getElement('chkResolveABNick'),
		    displayNameBox = getElement('chkResolveABDisplay'),
        replaceMail = getElement('chkResolveABRemoveMail'),
        abBox = getElement('chkResolveAB');
		
		let isResolveAddressBook = prefs.getMyBoolPref('mime.resolveAB');
    
    nickBox.disabled = !isResolveAddressBook || false;
		displayNameBox.disabled = !isResolveAddressBook || false;
    replaceMail.disabled = !isResolveAddressBook || false;
    abBox.disabled = false;
		
		const licenser = SmartTemplate4.Licenser; // problem?
					
    /*****  License  *****/
    settings.labelLicenseBtn(getElement("btnLicense"), "buy");
    // validate License key
    licenser.LicenseKey = prefs.getStringPref('LicenseKey');
    getElement('txtLicenseKey').value = licenser.LicenseKey;
    if (licenser.LicenseKey) {
      SmartTemplate4.Settings.validateLicenseInOptions(true);
    }
		
		if (isAdvancedPanelOpen) {
			settings.openAdvanced();
		}
		let tabbox = getElement("rightPane");
		// special settings (omit selecting an identit from the accounts dropdown)
		switch(mode) {
			case 'licenseKey': // open "ST Pro" tab
				tabbox.selectedPanel = getElement('SmartTemplate4-Options-goPro');
				tabbox.selectedIndex = 5;
			  settings.openAdvanced();  // issue 60
        isAdvancedPanelOpen = true;
				break;
			case 'fileTemplates': // set up file templates.
				let idMenu = getElement("msgIdentity");
				if (idMenu)
					idMenu.selectedIndex = 1;
				SmartTemplate4.Settings.switchIdentity("fileTemplates", composeType);
			  break;
		}
		
		let panels = getElement('ST4-Panels');
		panels.addEventListener('select', function(evt) { SmartTemplate4.Settings.onTabSelect(panels,evt); } );
		
		if (!util.hasLicense(false)) {
			if (prefs.isDebug) debugger;
			let licenseDate = getElement('licenseDate'),
			    licenseDateLbl = getElement('licenseDateLabel'),
					txtGracePeriod= util.gracePeriodText(SmartTemplate4.Licenser.GracePeriod);
          
			if (!licenseDateLbl.getAttribute("originalContent")) { // save original label!
				licenseDateLbl.setAttribute("originalContent", licenseDateLbl.textContent);
			}
			licenseDateLbl.textContent = txtGracePeriod;
			licenseDateLbl.classList.add('important');
			licenseDate.value = "";
		}

		// window.addEventListener('dialogaccept', function () {  });
		// window.addEventListener('dialogcancel', function () { });
		this.configExtra2Button();
		
		// hide get Stationery button in modern Thunderbird builds. 
		if (util.versionGreaterOrEqual(util.AppverFull, "61")) {
			getElement('btnGetStationery').collapsed = true;
			getElement('spcStationery').collapsed = true;
		}
		
		
		// Stationery replacement :)
		SmartTemplate4.fileTemplates.loadCustomMenu(true);
    
    if (mode == 'licenseKey') {
      let txtLicense = getElement('txtLicenseKey');
      setTimeout(function() {txtLicense.focus();}, 200);
    }
    
		util.logDebugOptional("functions", "onLoad() COMPLETE");
		return true;
	} ,
	
	onUnload : function() {
// 		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
		if (SmartTemplate4.fileTemplates.isModified) {
			let parentWin = 
			  (window.opener && window.opener.document.URL.endsWith("messenger.xhtml")) ?
					window.opener :
					SmartTemplate4.Util.Mail3PaneWindow;
			parentWin.setTimeout (
				function() {
					const st4 = parentWin.SmartTemplate4;
					st4.Util.logDebug("Refreshing fileTemplate menus...");
					st4.fileTemplates.initMenus(true); // force reset!
				} , 100
			);
		}
		
	} ,
	
	toggleExamples: function toggleExamples(el) {
		document.getElementById('templatesTab').collapsed = (el.checked);
	} ,
	
	loadTemplatesFrame: function loadTemplatesFrame() {
    // deferred loading of templates content
    let templatesIFrame = document.getElementById("templatesIFrame");
    if (!templatesIFrame.getAttribute("src"))
      templatesIFrame.setAttribute("src", "https://smarttemplates.quickfolders.org/templates.html");
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
      if (code.includes('%file')) {
        code = settings.getFileName(code, editBox, "file");
        return; // cancel
      }
      if (code.includes('%style')) {
        code = settings.getFileName(code, editBox, "style");
        return; // cancel
      }
      if (code.includes('%basepath(')) {
        code = settings.getFileName(code, editBox, "basepath");
        return; // cancel
      }
      if (code.includes('%attach')) {
        code = settings.getFileName(code, editBox, "attach");
        return; // cancel
      }
      if (code.includes('%header.')) {
        code = settings.getHeaderArgument(code);
      }
			
			settings.insertAtCaret(editBox, code);
		}
	} ,
  
  // %file(filePath,encoding)%
  // %file(imagePath,altText)%
	// %attach(filePath)%
  // %basepath(folderPath)%
  // @functionName: file / basepath / attach - corresponding to the ST4 variables %file% / %basepath% / %attach%
  getFileName: function getFileName(code, editBox, functionName='file') {
    const Cc = Components.classes,
          Ci = Components.interfaces;
    let fileType = "all",
		    //localized text for filePicker filter menu
		    strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		    bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties"),
        filterText;
    switch (functionName) {
      case "style":
        fileType = "style";
        break;
      case "file":
        if (code.includes('filePath'))
          fileType = "html";
        else if (code.includes('style'))
          fileType = "style";
        else if (code.includes('imagePath'))
          fileType = "image";
        else
          fileType = "unknown";	
        break;
      case "basepath":
        fileType = "folder";
        break;
    }
    if (fileType=='unknown')
      return false; // error
                   
    
    
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
    if (fileType=='folder')
      fp.init(window, "", fp.modeGetFolder);
    else
      fp.init(window, "", fp.modeOpen); // second parameter: prompt
    switch (fileType) {
      case 'folder':
        filterText = bundle.GetStringFromName("fpFolder");
        fp.appendFilter(filterText, "*.");
        break;
      case 'style':
        filterText = bundle.GetStringFromName("fpStyle");
        fp.appendFilter(filterText, "*.css");
        break;
      case 'html':
        filterText = bundle.GetStringFromName("fpHTMLFile");
        fp.appendFilter(filterText, "*.htm;*.html;*.txt");
        break;
      case 'image':
        filterText = bundle.GetStringFromName("fpImageFile");
         // fp.appendFilter(filterText, "*.png;*.jpg;*.jpeg;*.bmp;*.dib;*.ico;*.svg;*.gif;*.tif");
        fp.appendFilters(Ci.nsIFilePicker.filterImages);
        break;
			case 'all':
				// no filters - should use *.* by default
        break;
    }
    
    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK) {
        if (fp.file) {
          let path = fp.file.path;
          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          try {
            let st4Code = "%" + functionName + "(" + path + ")%"; //. .replace(/\\/g,"/")
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
  
	// Setup cloned nodes and replace preferences strings
	// Tb >= 63 add new Preferences handler
	//--------------------------------------------------------------------
	prefCloneAndSetup : function prefCloneAndSetup(el, branch) {
		const util = SmartTemplate4.Util;
		util.logDebugOptional("settings.prefs", "prefCloneAndSetup(" + el + ", " + branch + ")");
		// was called replaceAttr
		// AG added .common to the preference names to make it easier to add and manipulate global/debug settings
		function replacePrefName(_el,  key) {
			try {
				if (_el.hasAttribute("preference")) {
					let _attr = _el.getAttribute("preference");
          _el.setAttribute("preference", _attr.replace(".common", key));
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

		let key = branch.substr(1), // cut off leading '.'
		    deps = 0,
		    newPrefs = [];  // to gather the new preferences
		// iterate cloned deck.
		// note: this would be easier to rewrite & understand using recursion
		const ELEMENT_NODE = 1, TEXT_NODE = 3;
		while (el) {
			// Set id, name, prefname
			if (el.nodeType == ELEMENT_NODE) {
				replaceAttribute(el, "id", branch);
				replacePrefName(el, branch); 
				// build an array of all preference nodes which contain the preference types
				if (el.tagName == "preference") {
					newPrefs.push(el);
				}
			}

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

		// add pref type definitions to Preferences object
		if (newPrefs.length && typeof Preferences != "undefined") {
			for (let i=0; i<newPrefs.length; i++) {
				let it = newPrefs[i],
						p = { 
							id: it.getAttribute('name').replace('.common', branch), 
							type: it.getAttribute('type')
						}
            
				let pref = Preferences.add(p);
        
				this.preferenceElements.push (pref);
				util.logDebugOptional("settings.prefs", "Added Preference: " + p.id);
			}
		}
		util.logDebugOptional("settings.prefs", "prefCloneAndSetup COMPLETE");
	} ,

	//******************************************************************************
	// Identity
	//******************************************************************************

	// Add identity
	//--------------------------------------------------------------------
	addIdentity : function addIdentity(menuvalue) {
		const util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences,
					isCommon = (menuvalue == "common"),
		      branch = isCommon ? ".common" : "." + menuvalue;
		util.logDebugOptional("functions", "addIdentity(" + menuvalue + ")");

		try {
			// Add preferences, if preferences is not create.
			let prefRoot = "extensions.smartTemplate4" + branch + ".";
			this.setPref1st(prefRoot);

			// Clone and setup a preference window tags.
			const el = document.getElementById("deckA.per_account"),
			      clone = el.cloneNode(true);

			this.prefCloneAndSetup(clone, branch);
			el.parentNode.appendChild(clone);

			// Disabled or Hidden DOM node
			this.accountKey = branch;    // change current id for pref library
			
			let useCommon = 
			  isCommon ? false : prefs.getBoolPref(prefRoot + "def"); // this.isChecked("use_default" + branch)
			this.prefDeck("default.deckB", useCommon ? 1 : 0);

			this.disableWithCheckbox();
			// this.accountKey = "";
		}
		catch(ex) {
			util.logException("Exception in addIdentity(" + menuvalue  +")", ex);
		}
		finally {
			util.logDebugOptional("functions", "addIdentity COMPLETE");
		}
	} ,

	// Fill identities menu
	// this also clones the deck as many times as there are identities in order to fill in 
	// the specific templates [see addIdentity()]
	//--------------------------------------------------------------------
  // mod 0.3.2
	fillIdentityListPopup : function fillIdentityListPopup() {
		const util = SmartTemplate4.Util;
		// get current identity
		util.logDebugOptional("settings","fillIdentityListPopup()");
		const accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].
									  getService(this.Ci.nsIMsgAccountManager).accounts;
		let currentId = 0,
		    CurId = null;
		
		// only when calling from the mail 3 pane window: 
		if (window.opener && window.opener.GetSelectedMsgFolders) { 
			let folders = window.opener.GetSelectedMsgFolders();
			if (folders.length > 0) { // select the correct server that applies to the current folder.
			  
				const mailUtilsName =
				  util.versionGreaterOrEqual(util.AppverFull, "61") ?
					"MailUtils.jsm" : "MailUtils.js"; // why o why? 
			
				var { MailUtils } = 
				  ChromeUtils.import ?
					ChromeUtils.import("resource:///modules/" + mailUtilsName) :
					Components.utils.import("resource:///modules/" + mailUtilsName);
					
				CurId = (MailUtils && MailUtils.getIdentityForServer) ?
				  MailUtils.getIdentityForServer(folders[0].server) :
					window.opener.getIdentityForServer(folders[0].server);
			}
		}
		
		let theMenu = document.getElementById("msgIdentity"),
		    iAccounts = accounts.length;
				
		// (Stationery replacement) file lists: menupopup add below common?
		if (SmartTemplate4.Settings.isFileTemplates) {
			const label = util.getBundleString("SmartTemplate4.fileTemplates", "File Templates");
			theMenu.appendItem(label, "fileTemplates", "file templates: to replace Stationery");
		}
				
		for (let idx = 0; idx < iAccounts; idx++) {
			let account = accounts[idx];//.queryElementAt ?
				//accounts.queryElementAt(idx, this.Ci.nsIMsgAccount) :
				//accounts.GetElementAt(idx).QueryInterface(this.Ci.nsIMsgAccount);

			if (!account.incomingServer)
				continue;

			let iIdentities = (typeof account.identities.Count === 'undefined') ? account.identities.length : account.identities.Count();
			for (let j = 0; j < iIdentities; j++) {
				let identity = account.identities[j];//.queryElementAt ?
					//account.identities.queryElementAt(j, this.Ci.nsIMsgIdentity) :
					//account.identities.GetElementAt(j).QueryInterface(this.Ci.nsIMsgIdentity);

				if (CurId == identity)
					currentId = theMenu.itemCount; // remember position
				theMenu.appendItem(account.incomingServer.prettyName + " - " + identity.identityName, identity.key, "");
				this.addIdentity(identity.key);
			}
		}
		// update all Preference elements - do we need to wait for another event?
		for (let i=0; i<this.preferenceElements.length; i++ ) {
			this.preferenceElements[i].updateElements();
		}
		
		
		if (CurId && CurId.key && SmartTemplate4.Preferences.getMyBoolPref(CurId.key+".def")) { // use common?
			theMenu.selectedIndex = 0;
			CurId = null; // select common
		}
		else {
			// select the current identity from the drop down:
			theMenu.selectedIndex = currentId;
		}
		return (CurId) ? CurId.key : null;
		
	} ,

	openAdvanced: function openAdvanced() {
		const prefs = SmartTemplate4.Preferences;
		let advancedContainer = document.getElementById('advancedContainer');
		advancedContainer.hidden = false;
		let wid = advancedContainer.scrollWidth;
		window.resizeBy(wid, 0);
		SmartTemplate4.Help.onLoad();
		document.getElementById('btnAdvanced').hidden = true;
		document.getElementById('btnCloseAdvanced').hidden = false;
		prefs.setMyBoolPref('expandSettings', true);

		let versionBox = document.getElementById('versionBox');
		// let's get the "top" instance of st4, as we know that already knows the version number!!
		versionBox.value = SmartTemplate4.Util.Mail3PaneWindow.SmartTemplate4.Util.Version;
	} ,

	closeAdvanced: function closeAdvanced() {
		const prefs = SmartTemplate4.Preferences;
		let advancedContainer = document.getElementById('advancedContainer'),
		    wid = advancedContainer.scrollWidth;
		advancedContainer.hidden = true;
		window.resizeBy(-wid, 0);
		SmartTemplate4.Help.onUnload();
		document.getElementById('btnAdvanced').hidden = false;
		document.getElementById('btnCloseAdvanced').hidden = true;
		prefs.setMyBoolPref('expandSettings', false);
	} ,

	// Switch Identity (from account setting window)		// add 0.4.0 S
	//--------------------------------------------------------------------
	switchIdentity : function switchIdentity(idKey, composeType)	{
		let el = document.getElementById("msgIdentityPopup").firstChild,
		    index = 0;
    composeType = composeType || null;
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
    // select the correct compose type tab
		if (idKey=='fileTemplates' && composeType) {
      let fileTemplatesTabs = document.getElementById('fileTemplatesTabs'),
          panelId = composeType + '-fileTemplates',
          idx = 0;
      switch (composeType) {
        case 'new': idx = 0; break;
        case 'rsp': idx = 1; break;
        case 'fwd': idx = 2; break;
      }
      fileTemplatesTabs.selectedPanel = document.getElementById(panelId);
      fileTemplatesTabs.selectedIndex = idx;
      // attract attention to the picker button
      document.getElementById('btnPickTemplate').classList.add('pulseRed');
    }
    
		SmartTemplate4.Util.logDebugOptional("functions", "switchIdentity(" + idKey + ") COMPLETE");

	} , // add 0.4.0 E

	getCurrentDeck : function getCurrentDeck(accountId) {
		if (accountId.startsWith("file"))
			return "fileTemplatesTabs";
		return (accountId != ".common")
		  ? 'deckB.nodef' + accountId
			: 'deckB.nodef';
	} ,

	// Select identity (from xul)
	//--------------------------------------------------------------------
	selectIdentity : function selectIdentity(idkey)	{
		const util = SmartTemplate4.Util,
		      prefs = SmartTemplate4.Preferences,
					settings = SmartTemplate4.Settings;
		util.logDebugOptional("identities", "selectIdentity(" + idkey +  ")");
		let currentDeck = this.getCurrentDeck(settings.accountId),
		    tabbox = document.getElementById(currentDeck);
		if (!tabbox)
			alert("A problem has occured: Cannot find account settings: " + currentDeck); // this shouldn't happen, ever!
		let tabIndex = tabbox.selectedIndex;

		const branch = (idkey == "common") ? ".common" : "." + idkey;

		// Display identity.
		let deck = document.getElementById("account_deckA"),
		    idx = 0,
		    searchDeckName = "deckA.per_account" + branch,
		    found = false;

		for (let el = deck.firstChild; el; el = el.nextSibling) {
			if (el.id == searchDeckName) {
				deck.selectedIndex = idx;
				this.accountKey = branch;
				found = true;
				break;
			}
			idx++;
		}
		//
    let btnSave = document.getElementById("btnSaveTemplate"),
        btnLoad = document.getElementById("btnLoadTemplate"),
        tipHelp = document.getElementById("helpTemplates"),
        isShowTemplateSelector = (idkey == "fileTemplates");
		if (isShowTemplateSelector) {
			found = true;
			deck.selectedIndex = 1;
			this.accountKey = "files";
		}
    btnSave.collapsed = (isShowTemplateSelector);
    btnLoad.collapsed = (isShowTemplateSelector);
    tipHelp.collapsed = (!isShowTemplateSelector);

		// nothing found, then we are in common! (changed from previous behavior where common accountKey was "", now it is ".common"
		if (!found) {
			deck.selectedIndex = 0; // choice for file templates will be inserted below this.
			this.accountKey = branch;
		}

		util.logDebugOptional("identities", "" + (searchDeckName ? "found" : "could not find") + " deck:" + searchDeckName);
    let chkUseCommon = document.getElementById('use_default' + this.currentIdSelector);
    if (chkUseCommon && found && !isShowTemplateSelector)
      chkUseCommon.checked = prefs.getBoolPref("extensions.smartTemplate4" + this.currentIdSelector + ".def");

		//reactivate the current tab: new / respond or forward!
		currentDeck = this.getCurrentDeck(settings.accountId);
		tabbox = document.getElementById(currentDeck);
		if (tabbox) {
			tabbox.selectedIndex = tabIndex;
      let txtDump = '',
          tabboxArray = tabbox.getElementsByTagName('html:textarea'); // changed from textbox
      for (let i=0; i<tabboxArray.length; i++)
        txtDump += tabboxArray[i].value;  // append all texts
      // disable / enable Save button in case template is empty
			try {
				let disableSave = (txtDump.length===0) && (chkUseCommon.checked === true);
				document.getElementById('btnSaveTemplate').disabled = disableSave;
			}
			catch (ex) {;}
    }
		util.logDebugOptional("identities", "selectIdentity(" + idkey + ") COMPLETE");

	} ,

  selectFileCase : function selectFileCase(el, evt) {
		function moveFileControls(richListBoxId) {
			let fc = document.getElementById('fileControls'),
			    rlb = document.getElementById(richListBoxId);
			// move to the correct panel (if it's not already there)
			if (rlb.parentNode.lastChild != fc)
				rlb.parentNode.appendChild(fc);
		}
		const util = 	SmartTemplate4.Util;
		// get the tabbox to determine which case is selected.
		if (evt && evt.target.tagName != 'tabpanels') return;
		if (!el)
			el = document.getElementById('fileTemplatesTabs');
		
		util.logDebug("Selected " + el.id); // tabbox value
		switch (el.selectedIndex) {
			case 0:
				moveFileControls('templateList.new');
				break;
			case 1:
				moveFileControls('templateList.rsp');
				break;
			case 2:
				moveFileControls('templateList.fwd');
				break;
			default:
		}
	},
	
	
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
		    displayNameBox = document.getElementById('chkResolveABDisplay'),
        replaceMail = document.getElementById('chkResolveABRemoveMail');
    if (el.checked) {
      nickBox.checked = false;
		}
		displayNameBox.disabled = el.checked;
		nickBox.disabled = el.checked;
		replaceMail.disabled = el.checked;
  } ,
  
  get currentId() {
    let key = document.getElementById('msgIdentity').value;
    return key;
  },
	
	get currentIdSelector() {
		let s = this.currentId;
		return (s!="common") ? ('.'+ s) : "";
	} ,
  
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
			function isOrStartsWith(el, s) {
				return (el.id == s || el.id.startsWith(s + "."));
			}
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
				if (Preferences) {
					Preferences.userChangedValue (el); // .getAttribute('preference')
				}
				else { // old method
					evt.initEvent("change", true, false);
					el.dispatchEvent(evt);
				}
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
					// update enable / disable textboxes from checkbox data.
					if (isOrStartsWith(el, "new") || isOrStartsWith(el, "newhtml") ||
					    isOrStartsWith(el, "rsp") || isOrStartsWith(el, "rsphtml") ||
							isOrStartsWith(el, "fwd") || isOrStartsWith(el, "fwdhtml"))
						SmartTemplate4.Settings.disableWithCheckbox(el);
					
        }
      }                  
    }
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences,
					NSIFILE = Ci.nsIFile || Ci.nsILocalFile;
		util.popupLicenseNotification(mode + "_template", true, true); // save_template, load_template
					
    let //localized text for filePicker filter menu
		    strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		    bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties"),
        filterText;
    
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
        fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;
				
		// "Remember save location"
		if (prefs.getStringPref('files.path')) {
			let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
			defaultPath.initWithPath(prefs.getStringPref('files.path'))
			fp.displayDirectory = defaultPath; // nsILocalFile
		}    
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
          
					const {OS} = (typeof ChromeUtils.import == "undefined") ?
						Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
						ChromeUtils.import("resource://gre/modules/osfile.jsm", {});		
					
					// Remember last path
					let lastSlash = path.lastIndexOf("/");
					if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
					let lastPath = path.substr(0, lastSlash);
					util.logDebug("Storing Path: " + lastPath);
					prefs.setStringPref('files.path', lastPath);
					
          
          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          switch (mode) {
            case 'load':
              let promiseRead = OS.File.read(path, { encoding: "utf-8" }); //  returns Uint8Array
              promiseRead.then(
                function readSuccess(data) {
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
                  util.logDebug ('saveJSON()…'); 
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
    
    return true;    
  } ,
    
  store: function store() {
      // let's get all the settings from the key and then put them in a json structure:
    const util = SmartTemplate4.Util,
          settings = SmartTemplate4.Settings;
    let key = this.currentId,
        currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
        tabbox = document.getElementById(currentDeck),
        txt = tabbox.getElementsByTagName('html:textarea'), // changed from textbox
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
		const util = SmartTemplate4.Util;
    let currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
        tabbox = document.getElementById(currentDeck),
        txt = tabbox.getElementsByTagName('html:textarea'), // changed from textbox
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
    // Remove line breaks and extra spaces:
		let trimmedLicense =  
		  strLicense.replace(/\r?\n|\r/g, ' ') // replace line breaks with spaces
				.replace(/\s\s+/g, ' ')            // collapse multiple spaces
        .replace('\[at\]','@')
				.trim();
    txtBox.value = trimmedLicense;
    util.logDebug('trimLicense() result : ' + trimmedLicense);
    return trimmedLicense;
  } ,
  
  // make a validation message visible but also repeat a notification for screen readers.
  showValidationMessage: function showValidationMessage(el, silent=true) {
    const util = SmartTemplate4.Util;
    if (el.collapsed != false) {
      el.collapsed = false;
      if (!silent)
        util.popupAlert (util.ADDON_TITLE, el.textContent);
    }
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
  
  decryptLicense: function decryptLicense(silent = false) {
		const util = SmartTemplate4.Util,
		      licenser = SmartTemplate4.Licenser,
					prefs = SmartTemplate4.Preferences,
					globalLicenser = util.Licenser,
					ELS = licenser.ELicenseState,
					crypto = SmartTemplate4.Crypto;
					
    let getElement = document.getElementById.bind(document),
        validationPassed       = getElement('validationPassed'),
        validationStandard     = getElement('validationStandard'),
        validationFailed       = getElement('validationFailed'),
				validationInvalidAddon = getElement('validationInvalidAddon'),
        validationExpired      = getElement('validationExpired'),
        validationInvalidEmail = getElement('validationInvalidEmail'),
        validationEmailNoMatch = getElement('validationEmailNoMatch'),
				validationDate         = getElement('validationDate'),
				validationDateSpace    = getElement('validationDateSpace'),
        decryptedMail, decryptedDate,
				result = ELS.NotValidated;
		validationStandard.collapsed = true;
    validationPassed.collapsed = true;
    validationFailed.collapsed = true;
    validationExpired.collapsed = true;
		validationInvalidAddon.collapsed = true;
    validationInvalidEmail.collapsed = true;
    validationEmailNoMatch.collapsed = true;
		validationDate.collapsed = false;
		validationDateSpace.collapsed = false;
    this.enablePremiumConfig(false);
    try {
			var { Services } = 
			  ChromeUtils.import ?
			  ChromeUtils.import('resource://gre/modules/Services.jsm') :
				Components.utils.import('resource://gre/modules/Services.jsm'); // Thunderbird 52
			
      this.trimLicense();
      let txtBox = getElement('txtLicenseKey'),
          license = txtBox.value;
      // store new license key
			prefs.setStringPref('LicenseKey', license);
			if (!license) 
				crypto.key_type=0; //reset
      
      let maxDigits = crypto.maxDigits, // this will be hardcoded in production 
          LicenseKey,
          encrypted = licenser.getCrypto(license),
          mail = licenser.getMail(license),
          date = licenser.getDate(license);
      if (prefs.isDebug) {
        let test = 
            "┌───────────────────────────────────────────────────────────────┐\n"
          + "│ SmartTemplate4.Licenser found the following License components:\n"
          + "│ Email: " + mail + "\n"
          + "│ Date: " + date + "\n"
          + "│ Crypto: " + encrypted + "\n"
          + "└───────────────────────────────────────────────────────────────┘";
        util.logDebug(test);
      }
      if (encrypted)
        [result, LicenseKey] = licenser.validateLicense(license, maxDigits);
      else { // reset internal state of object if no encrypted can be found!
        result = ELS.Invalid;
				licenser.DecryptedDate = "";
				licenser.DecryptedMail = "";
			}
      decryptedDate = licenser.DecryptedDate;
      getElement('licenseDate').value = decryptedDate; // invalid ??
      decryptedMail = licenser.DecryptedMail;
      switch(result) {
        case ELS.Valid:
          this.enablePremiumConfig(true);
					if (licenser.key_type==2)
            SmartTemplate4.Settings.showValidationMessage(validationStandard, silent);
					else
						SmartTemplate4.Settings.showValidationMessage(validationPassed, silent);
          // test code
          // getElement('txtEncrypt').value = LicenseKey;
          break;
        case ELS.Invalid:
				  validationDate.collapsed=true;
					validationDateSpace.collapsed=true;
				  let addonName = '';
				  switch (license.substr(0,2)) {
						case 'QI':
						case 'Q2': // quickfilters standard
							addonName = 'quickFilters';
						  break;
						case 'QF':
						case 'Q1': // QuickFolders standard
							addonName = 'QuickFolders';
						  break;
						case 'ST':
						case 'S1':
						default: 
						  SmartTemplate4.Settings.showValidationMessage(validationFailed, silent);
					}
					if (addonName) {
						SmartTemplate4.Settings.showValidationMessage(validationInvalidAddon, silent);
						let txt = validationInvalidAddon.textContent;
						txt = txt.replace('{0}','SmartTemplate⁴').replace('{1}','ST'); // keys for {0} start with {1}
						if (txt.indexOf(addonName) < 0) {
							txt += " " + util.getBundleString("SmartTemplate4.licenseValidation.guessAddon", "(The key above may be for {2})").replace('{2}',addonName);
						}
						validationInvalidAddon.textContent = txt;
					}
          break;
        case ELS.Expired:
          SmartTemplate4.Settings.showValidationMessage(validationExpired, false); // always show
          break;
        case ELS.MailNotConfigured:
				  validationDate.collapsed=true;
					validationDateSpace.collapsed=true;
          SmartTemplate4.Settings.showValidationMessage(validationInvalidEmail, silent);
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
          break;
        case ELS.MailDifferent:
				  validationDate.collapsed=true;
					validationDateSpace.collapsed=true;
          SmartTemplate4.Settings.showValidationMessage(validationFailed, silent);
          SmartTemplate4.Settings.showValidationMessage(validationEmailNoMatch, silent);
          break;
        default:
          Services.prompt.alert(null,util.ADDON_TITLE,'Unknown license status: ' + result);
          break;
      }
			
			// restore original label.
			if (!validationDate.collapsed) {
				let licenseDateLbl = getElement('licenseDateLabel'),
				    lTxt = licenseDateLbl.getAttribute("originalContent");
				if (lTxt) {
					licenseDateLbl.textContent = lTxt;
					licenseDateLbl.classList.remove('important');
				}
			}
			
			// transfer License state to main instance Licenser
			globalLicenser.ValidationStatus =
						(result != ELS.Valid) ? ELS.NotValidated : result;
			globalLicenser.DecryptedDate = decryptedDate;
			globalLicenser.DecryptedMail = decryptedMail;
			globalLicenser.LicenseKey = LicenseKey;
			globalLicenser.wasValidityTested = true; // no need to re-validate there
      
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
		
		var { Services } =
		  ChromeUtils.import ?
			ChromeUtils.import('resource://gre/modules/Services.jsm') :
			Components.utils.import('resource://gre/modules/Services.jsm');
		
    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);

    trans.getTransferData("text/unicode", str, strLength);
    if (str && (strLength.value || str.value)) {
			let pastetext = str.value.QueryInterface(Components.interfaces.nsISupportsString).data,
					txtBox = document.getElementById('txtLicenseKey'),
					strLicense = pastetext.toString();
			txtBox.value = strLicense;
			finalLicense = this.trimLicense();
    }
    if (finalLicense) {
      SmartTemplate4.Settings.validateLicenseInOptions(false);
    }
  } ,
  
  validateLicenseInOptions: function validateLicenseInOptions(silent = false) {
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
					licenser = util.Licenser, // use global licenser? (stored in main window)
					ELS = licenser.ELicenseState,
					settings = SmartTemplate4.Settings,
          prefs = SmartTemplate4.Preferences;
					
    let wd = window.document,
        getElement = wd.getElementById.bind(wd),
        btnLicense = getElement("btnLicense"),
				proTab = getElement("SmartTemplate4-Pro"),
				beautyTitle = getElement("SmartTemplate4AboutLogo");
				
		if (prefs.isDebugOption("premium.licenser")) debugger;
    try {
			//let decrypt = SmartTemplate4.Settings.decryptLicense.bind(SmartTemplate4.Settings);
			let result = settings.decryptLicense(silent); // this.decrypt breaks internal scopes in licenser.validateLicense ?
			// show support tab if license is not empty - util.Licenser uses global licenser object!
			let isSupportEnabled = (licenser.LicenseKey) ? true : false;
			getElement('supportTab').collapsed = !(isSupportEnabled);
			if (isSupportEnabled) {
//				let mainUtil = util.Mail3PaneWindow.SmartTemplate4.Util,
//				    v = mainUtil.Version; // test
			}
			
      let silentUpdateOption = getElement("chkSilentUpdates");
			switch(result) {
				case ELS.Valid:
					let today = new Date(),
					    later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
							dateString = later.toISOString().substr(0, 10);
          silentUpdateOption.disabled = false;
					// if we were a month ahead would this be expired?
					if (licenser.DecryptedDate < dateString) {
						settings.labelLicenseBtn(btnLicense, "extend");
					}
					else {
						if (licenser.key_type==2) { // standard license
							btnLicense.classList.add('upgrade'); // removes "pulsing" animation
							settings.labelLicenseBtn(btnLicense, "upgrade");
						}
						else
							btnLicense.collapsed = true;
					}
					replaceCssClass(proTab, 'paid');
					replaceCssClass(btnLicense, 'paid');
					beautyTitle.classList.remove('aboutLogo');
					beautyTitle.classList.add('aboutLogoPro');
				  break;
				case ELS.Expired:
          silentUpdateOption.disabled = true;
					settings.labelLicenseBtn(btnLicense, "renew");
				  btnLicense.collapsed = false;
					replaceCssClass(proTab, 'expired');
					replaceCssClass(btnLicense, 'expired');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/content/skin/logo-pro.png");
					break;
				default: // no license
          silentUpdateOption.disabled = true;
          settings.labelLicenseBtn(btnLicense, "buy");
				  btnLicense.collapsed = false;
					replaceCssClass(proTab, 'free');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/content/skin/logo.png");
					beautyTitle.classList.add('aboutLogo');
					beautyTitle.classList.remove('aboutLogoPro');
			}
			util.logDebug('validateLicense - result = ' + result);
			// make sure to refresh the file template menus!
			SmartTemplate4.fileTemplates.isModified = true; 
    }
    catch(ex) {
      util.logException("Error in SmartTemplate4.Settings.validateLicenseInOptions():\n", ex);
    }
  } ,
	
  onTabSelect: function onTabSelect(element, event) {
    let el = event.target;
    if (el.selectedPanel) {
			SmartTemplate4.Settings.configExtra2Button(el);
      SmartTemplate4.Util.logDebug('Tab Select: ' + element.id + ' selected panel = ' + el.selectedPanel.id);
    }
  },
	
	configExtra2Button: function configExtra2Button(el) {
		const prefs = SmartTemplate4.Preferences,
		      util = SmartTemplate4.Util,
					options = SmartTemplate4.Settings,
		      licenser = util.Licenser,
					State = licenser.ELicenseState;
		if (!document.documentElement || !document.documentElement.getButton) {
			util.logDebug("Cannot configure extra2 button, likely because this is a modern version of Thunderbird.");
			return;
		}
		let donateButton = document.documentElement.getButton('extra2');
		// el.selectedPanel is schroedingers cat; it may not exist on load 
		// if the right hand side dialog is not expanded yet
		//setTimeout(
		//  function() {
				if(!el) el = document.getElementById("ST4-Panels");
				let selectedPanelId = el.selectedPanel ? el.selectedPanel.id : 'unknown';
				switch (selectedPanelId) {
					case 'SmartTemplate4-Options-goPro':
						donateButton.collapsed = true;
						break;
					default:
						donateButton.collapsed = false;
						if (!prefs.getStringPref('LicenseKey')) {
							options.labelLicenseBtn(donateButton, "buy");
							donateButton.addEventListener(
								"click", 
								function(event) { 
									setTimeout(function() { 
										SmartTemplate4.Licenser.showDialog('extra2'); // referrer 
										window.close(); 
									});	
								}, 
								false);
						}
						else {
							switch (licenser.ValidationStatus) {
								case State.Expired:
									options.labelLicenseBtn(donateButton, "renew");
									break;
								case State.Valid:
									donateButton.collapsed = true;
									break;
								case State.Invalid:
									options.labelLicenseBtn(donateButton, "buy");
									break;
								case State.NotValidated: // hide?
								default:
									options.labelLicenseBtn(donateButton, "buy");
									break;
							}
							
						}
				}			
		//	}, 500
		//);

	},
	


	// put appropriate label on the license button and pass back the label text as well
	labelLicenseBtn: function labelLicenseBtn(btnLicense, validStatus) {
		const prefs = SmartTemplate4.Preferences,
		      util = SmartTemplate4.Util;
					
		switch(validStatus) {
			case  "extend":
				let txtExtend = util.getBundleString("SmartTemplate4.notification.premium.btn.extendLicense", "Extend License!");
				btnLicense.collapsed = false
				btnLicense.label = txtExtend; // text should be extend not renew
				btnLicense.setAttribute('tooltiptext',
					util.getBundleString("SmartTemplate4.notification.premium.btn.extendLicense.tooltip", 
						"This will extend the current license date by 1 year. It's typically cheaper than a new license."));
				return txtExtend;
			case "renew":
				let txtRenew = util.getBundleString("SmartTemplate4.notification.premium.btn.renewLicense", "Renew License!");
				btnLicense.label = txtRenew;
			  return txtRenew;
			case "buy":
				let buyLabel = util.getBundleString("SmartTemplate4.notification.premium.btn.getLicense", "Buy License!");
				btnLicense.label = buyLabel;
			  return buyLabel;
			case "upgrade":
				let upgradeLabel = util.getBundleString("SmartTemplate4.notification.premium.btn.upgrade", "Upgrade to Pro");
				btnLicense.label = upgradeLabel;
				btnLicense.classList.add('upgrade'); // stop flashing
			  return upgradeLabel;
		}
		return "";
	},
	
	// Tb 63 compatibility.
	loadPreferences: function st4_loadPreferences() {
		const util = SmartTemplate4.Util;
		if (typeof Preferences == 'undefined') {
			util.logDebug("Skipping loadPreferences - Preferences object not defined");
			return; // older versions of Thunderbird do not need this.
		}		
		let myprefs = document.getElementsByTagName("preference");
		if (myprefs.length) {
			let prefArray = [],
          foundPreferences = [];
      
      
			for (let i=0; i<myprefs.length; i++) {
				let it = myprefs.item(i),
				    p = { id:   it.getAttribute('name'), 
                  type: it.getAttribute('type') };
                  
        // if (it.getAttribute('instantApply') == "true") p.instantApply = true;
        if (!foundPreferences.includes(p.id)) {
          prefArray.push(p);
          foundPreferences.push(p.id);
        }
        
			}
      
			if (Preferences) 
				Preferences.addAll(prefArray);
		}							
	},
	
	setSupportMode: function (elem) {
		const btnSupport = document.getElementById('composeSupportMail');
		// force user to select a topic.
		let topic = elem.value;
		btnSupport.disabled = (topic) ? false : true;
	} ,
	
	sendMail: function sendMail(mailto) {
    const util = SmartTemplate4.Util;
		
    let subjectTxt = document.getElementById('txtSupportSubject'),
		    supportType = document.getElementById('supportType').value,
				version = document.getElementById('versionBox').value,
		    subjectline = supportType + " (" + version + ") " + subjectTxt.value,
		    sURL="mailto:" + mailto + "?subject=" + encodeURI(subjectline), // urlencode
		    MessageComposer=Components.classes["@mozilla.org/messengercompose;1"].getService(Components.interfaces.nsIMsgComposeService),
		    // make the URI
		    ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
		    aURI = ioService.newURI(sURL, null, null);
		// open new message
		MessageComposer.OpenComposeWindowWithURI (null, aURI);
		// focus window?
	},	

	

};


/*
window.addEventListener('load', 
  function st4_loadEvent() {
    SmartTemplate4.Settings.onLoad();
  }
);

window.addEventListener('unload', 
  function st4_unloadEvent() {
    SmartTemplate4.Settings.onUnload();
  }
);
*/



