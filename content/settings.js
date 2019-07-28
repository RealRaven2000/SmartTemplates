"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/


if (SmartTemplate4.Util.Application == 'Postbox'){ 
  if (typeof XPCOMUtils != 'undefined') {
    XPCOMUtils.defineLazyGetter(this, "NetUtil", function() {
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
    return NetUtil;
    });
  }
}


SmartTemplate4.Settings = {
	accountKey : ".common",  // default to common
	preferenceElements : [],
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
				util.logDebug('deleting preference branch: ' + branch + ' ...'); // ++++++ RAUS LOESCHEN
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
					getElement = window.document.getElementById.bind(window.document),
					isAdvancedPanelOpen = prefs.getMyBoolPref('expandSettings');
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

    window.setTimeout( 
		  function() {
				let actDropDown = getElement('msgIdentity');
				actDropDown.style.maxWidth = "350px"; // avoid the dialog getting super wide by restricting the hbox with the selected value.
				if (isAdvancedPanelOpen) {
					if (prefs.isDebug) debugger;
					window.sizeToContent(); // times out on - get_editable@chrome://global/content/bindings/menulist.xml:134:1
					// shrink width
					let deltaShrink = getElement('decksContainer').scrollWidth - window.innerWidth;
					if (deltaShrink>40)
						window.resizeBy(deltaShrink + 40, 0); // 40 pixels for paddings etc.
				}
				if (util.HostSystem.toLowerCase().startsWith("linux"))
					window.resizeBy(0,55); // show Ok / Cancel buttons.
				setTimeout( function() {
					  actDropDown.style.maxWidth = null; // undo width restrictions 
				  }, 250
				);
				
				
				// let's test if we can get this element
				let prefDialog = getElement('smartTemplate_prefDialog'),
						hbox = document.getAnonymousElementByAttribute(prefDialog, 'class', 'prefWindow-dlgbuttons'),
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
        abBox = getElement('chkResolveAB'),
        isPostbox = (util.Application === "Postbox");
    if (isPostbox) {
      prefs.setMyBoolPref('mime.resolveAB', false);
      prefs.setMyBoolPref('mime.resolveAB.preferNick', false);
    }
		
		let isResolveAddressBook = prefs.getMyBoolPref('mime.resolveAB');
    
    nickBox.disabled = !isResolveAddressBook || isPostbox;
		displayNameBox.disabled = !isResolveAddressBook || isPostbox;
    replaceMail.disabled = !isResolveAddressBook || isPostbox;
    abBox.disabled = isPostbox;
		
		const licenser = SmartTemplate4.Licenser; // problem?
					
    /*****  License  *****/
    settings.labelLicenseBtn(getElement("btnLicense"), "buy");
    // validate License key
    licenser.LicenseKey = prefs.getStringPref('LicenseKey');
    getElement('txtLicenseKey').value = licenser.LicenseKey;
    if (licenser.LicenseKey) {
      SmartTemplate4.Settings.validateLicenseInOptions(false);
    }
		
		if (isAdvancedPanelOpen) {
			settings.openAdvanced();
		}
		let tabbox = getElement("rightPane");
		// open "ST Pro" tab
		if (mode=='licenseKey') {
			tabbox.selectedPanel = getElement('SmartTemplate4-Options-goPro');
			tabbox.selectedIndex = 5;
		}
		
		let panels = getElement('ST4-Panels');
		panels.addEventListener('select', function(evt) { SmartTemplate4.Settings.onTabSelect(panels,evt); } );
		
		if (!util.hasLicense(false)) {
			if (prefs.isDebug) debugger;
			let licenseDate = getElement('licenseDate'),
			    licenseDateLbl = getElement('licenseDateLabel'),
					gracePeriod = SmartTemplate4.Licenser.GracePeriod,
					txtGracePeriod=util.getBundleString("SmartTemplate4.trialDays", "You have {0} trial days left.").replace("{0}", gracePeriod);
			if (!licenseDateLbl.getAttribute("originalContent")) { // save original label!
				licenseDateLbl.setAttribute("originalContent", licenseDateLbl.textContent);
			}
			licenseDateLbl.textContent = txtGracePeriod;
			licenseDateLbl.classList.add('important');
			licenseDate.value = "";
		}

		this.configExtra2Button();
    
		util.logDebugOptional("functions", "onLoad() COMPLETE");
		return true;
	} ,
	
	onUnload : function() {
// 		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
    
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
        code = settings.getFileName(code, editBox, "file");
        return; // cancel
      }
      if (code.indexOf('%attach')==0) {
        code = settings.getFileName(code, editBox, "attach");
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
	// %attach(filePath)%
  getFileName: function getFileName(code, editBox, functionName) {
    const Cc = Components.classes,
          Ci = Components.interfaces;
    let fileType = "all",
		    //localized text for filePicker filter menu
		    strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		    bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties"),
        filterText;
		if (functionName=="file") 
			fileType = (code.indexOf('filePath')>0) ? 'html' :
                   ((code.indexOf('imagePath')>0) ? 'image' : 'unknown');	
		if (!functionName) functionName='file'; // default %file%
    
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
				replacePrefName(el, key); // applies only to preference nodes themselves
				// build an array for adding to Preferences
				if (el.tagName == "preference") {
					newPrefs.push(el);
				}
				let prefName = el.getAttribute("preference");
				if (prefName) {
					replaceAttribute(el, "preference", branch);
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
		// add to Preferences object
		if (newPrefs.length && typeof Preferences != "undefined") {
			for (let i=0; i<newPrefs.length; i++) {
				let it = newPrefs[i],
						p = { 
							id: it.id, 
							name: it.getAttribute('name'), 
							type: it.getAttribute('type'), 
							instantApply: true 
						}
				let pref = Preferences.add(p);
				this.preferenceElements.push (pref);
				// pref.updateElements();  // is not called automatically because domecontentloaded is OVER
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
		      branch = (menuvalue == "common") ? ".common" : "." + menuvalue;
		util.logDebugOptional("functions", "addIdentity(" + menuvalue + ")");

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
					
				var { NetUtil } = 
				  ChromeUtils.import ?
					ChromeUtils.import("resource://gre/modules/NetUtil.jsm") :
					Components.utils.import("resource://gre/modules/NetUtil.jsm");
			
				CurId = (MailUtils && MailUtils.getIdentityForServer) ?
				  MailUtils.getIdentityForServer(folders[0].server) :
					window.opener.getIdentityForServer(folders[0].server);
			}
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
		// update all Preference elements - do we need to wait for another event?
		for (let i=0; i<this.preferenceElements.length; i++ ) {
			this.preferenceElements[i].updateElements();
		}
		
		// now select the current identity from the drop down
		theMenu.selectedIndex = currentId;
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
		const util = SmartTemplate4.Util,
		      prefs = SmartTemplate4.Preferences;
		util.logDebugOptional("identities", "selectIdentity(" + idkey +  ")");
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

		util.logDebugOptional("identities", "" + (searchDeckName ? "found" : "could not find") + " deck:" + searchDeckName);

		//reactivate the current tab: new / respond or forward!
		currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId);
		tabbox = document.getElementById(currentDeck);
		if (tabbox) {
			tabbox.selectedIndex = tabIndex;
      let txtDump = '',
          tabboxArray = tabbox.getElementsByTagName('html:textarea'); // changed from textbox
      for (let i=0; i<tabboxArray.length; i++)
        txtDump += tabboxArray[i].value;  // append all texts
      // disable / enable Save button in case template is empty
			try {
				let disableSave = (txtDump.length===0) && (document.getElementById('use_default' + this.currentIdSelector).checked === true);
				document.getElementById('btnSaveTemplate').disabled = disableSave;
			}
			catch (ex) {;}
    }
		util.logDebugOptional("identities", "selectIdentity(" + idkey + ") COMPLETE");

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
        }
        // update enable / disable textboxes from checkbox data.
        SmartTemplate4.Settings.disableWithCheckbox();
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
		
		// window.addEventListener('dialogaccept', function () {  });
		// window.addEventListener('dialogcancel', function () { });
		window.addEventListener('dialogextra2', function (event) { 
			setTimeout(function() { 
				SmartTemplate4.Licenser.showDialog('options_dialog'); // referrer 
				window.close(); 
			});	
    });			
		
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
      if (!testMode) // in test mode we do not store the license key!
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
        if (testMode)
          util.alert(test);
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
						validationStandard.collapsed=false;
					else
						validationPassed.collapsed=false;
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
						  validationFailed.collapsed=false;
					}
					if (addonName) {
						validationInvalidAddon.collapsed = false;
						let txt = validationInvalidAddon.textContent;
						txt = txt.replace('{0}','SmartTemplate⁴').replace('{1}','ST'); // keys for {0} start with {1}
						if (txt.indexOf(addonName) < 0) {
							txt += " " + util.getBundleString("SmartTemplate4.licenseValidation.guessAddon", "(The key above may be for {2})").replace('{2}',addonName);
						}
						validationInvalidAddon.textContent = txt;
					}
          break;
        case ELS.Expired:
          validationExpired.collapsed=false;
          break;
        case ELS.MailNotConfigured:
				  validationDate.collapsed=true;
					validationDateSpace.collapsed=true;
          validationInvalidEmail.collapsed=false;
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
          break;
        case ELS.MailDifferent:
				  validationDate.collapsed=true;
					validationDateSpace.collapsed=true;
          validationFailed.collapsed=false;
          validationEmailNoMatch.collapsed=false;
          break;
        default:
          Services.prompt.alert(null,"SmartTemplate4",'Unknown license status: ' + result);
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
			
      if (testMode) {
      //  getElement('txtEncrypt').value = 'Date = ' + decryptedDate + '    Mail = ' +  decryptedMail +  '  Result = ' + result;
      }
      else {
        // transfer License state to main instance Licenser
				globalLicenser.ValidationStatus =
              (result != ELS.Valid) ? ELS.NotValidated : result;
				globalLicenser.DecryptedDate = decryptedDate;
				globalLicenser.DecryptedMail = decryptedMail;
				globalLicenser.LicenseKey = licenser.LicenseKey;
        globalLicenser.wasValidityTested = true; // no need to re-validate there
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
					licenser = SmartTemplate4.Licenser,
					ELS = licenser.ELicenseState,
					settings = SmartTemplate4.Settings; 
    let wd = window.document,
        getElement = wd.getElementById.bind(wd),
        btnLicense = getElement("btnLicense"),
				proTab = getElement("SmartTemplate4-Pro"),
				beautyTitle = getElement("SmartTemplate4AboutLogo");
    try {
			//let decrypt = SmartTemplate4.Settings.decryptLicense.bind(SmartTemplate4.Settings);
			let result = settings.decryptLicense(testMode); // this.decrypt breaks internal scopes in licenser.validateLicense ?
			switch(result) {
				case ELS.Valid:
					let today = new Date(),
					    later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
							dateString = later.toISOString().substr(0, 10);
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
					settings.labelLicenseBtn(btnLicense, "renew");
				  btnLicense.collapsed = false;
					replaceCssClass(proTab, 'expired');
					replaceCssClass(btnLicense, 'expired');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/skin/logo-pro.png");
					break;
				default:
          settings.labelLicenseBtn(btnLicense, "buy");
				  btnLicense.collapsed = false;
					replaceCssClass(proTab, 'free');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/skin/logo.png");
					beautyTitle.classList.add('aboutLogo');
					beautyTitle.classList.remove('aboutLogoPro');
			}
			util.logDebug('validateLicense - result = ' + result);
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
		if(!el) el = document.getElementById("ST4-Panels");
		switch (el.selectedPanel.id) {
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
			let prefArray = [];
			for (let i=0; i<myprefs.length; i++) {
				let it = myprefs.item(i),
				    p = { id: it.id, name: it.getAttribute('name'), type: it.getAttribute('type') };
				if (it.getAttribute('instantApply') == "true") p.instantApply = true;
				prefArray.push(p);
			}
			if (Preferences)
				Preferences.addAll(prefArray);
		}							
	}

	

};
