"use strict";

// -----------------------------------------------------------------------------------
// ---------------------------- last edit at 06/10/2012 ------------------------------
// -----------------------------------------------------------------------------------
// ----------------------------------- Changelog -------------------------------------
// -----------------------------------------------------------------------------------
// 0.7.5: "use strict" suggested by Mozilla add-on review team
// -----------------------------------------------------------------------------------

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
	prefDisable : function()
	{
		for(var i = 1; i < arguments.length; i++){
			var el = document.getElementById(arguments[i] + this.accountId);
			if (arguments[0]) {
				el.disabled = false;
				el.removeAttribute("disabled");
			} else {
				el.disabled = true;
				el.setAttribute("disabled", "true");
			}
		}
		return arguments[0];
	},

	// Disable DOM node with identity key
	//--------------------------------------------------------------------
	prefHidden : function()
	{
		for(var i = 1; i < arguments.length; i++){
			var el = document.getElementById(arguments[i] + this.accountId);
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
	prefDeck : function(id, index)
	{
		var deck = document.getElementById(id + this.accountId);
		if (deck)
		  { deck.selectedIndex = index; }

		const idkey = document.getElementById("msgIdentity").value;
		const branch = (idkey == "common") ? ".common" : "." + idkey;
	} ,


	// Return checkbox is checked or not
	//--------------------------------------------------------------------
	isChecked : function(elId)
	{
		let com = elId.indexOf('.common');
		if (com>0)
		  elId = elId.substring(0, com); // cut off .common
		return document.getElementById(elId).checked;
	} ,

	// prepare a textbox to receive elements from the help window
	pasteFocus : function(element) {
		let hbox = element.parentNode;
		let vbox = hbox.parentNode.parentNode;
		var txtContainers = vbox.getElementsByClassName("pasteFocus");
		for (var i = 0; i < txtContainers.length; i++) {
			// add the arrow to the hbox that contains this textbox
			// and remove it from all others
			txtContainers[i].className = 
				(txtContainers[i].firstChild == element) ? "pasteFocus hasFocus" : "pasteFocus";
			
		}
		
		
	} ,

	// Disable DOM node depeding on checkboxes
	//--------------------------------------------------------------------
	disableWithCheckbox : function()
	{
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
	
	clickLogo : function() {
		let testString = prompt("Enter name of original string for conversion (empty for entering any text)", "extensions.smarttemplate.id*.rspmsg");
		let result = "";
		if (testString == '') {
			testString = prompt("Enter a string");
			result = SmartTemplate4.Util.convertPrefValue(testString, true);
		}
		else
			result = SmartTemplate4.Util.convertPrefValue(testString, true);
		
	},

	// Delete unused preferences.
	//--------------------------------------------------------------------
	cleanupUnusedPrefs : function()
	{
		SmartTemplate4.Util.logDebug('cleanupUnusedPrefs ()');

		var array = this.prefService.getChildList("extensions.smartTemplate4.", {});

		// AG new: preserve common and global settings!
		for (var i in array) {
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
	setPref1st : function(prefbranch)
	{
		try {
			this.prefService.getBoolPref(prefbranch + "def")
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
		} catch(e) { this.prefService.setBoolPref(prefbranch + "newnbr", true); }
		try {
			this.prefService.getBoolPref(prefbranch + "rspnbr");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "rspnbr", true); }
		try {
			this.prefService.getBoolPref(prefbranch + "fwdnbr");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "fwdnbr", true); }
		try {
			this.prefService.getBoolPref(prefbranch + "rsphead");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "rsphead", false); }
		try {
			this.prefService.getBoolPref(prefbranch + "fwdhead");
		} catch(e) { this.prefService.setBoolPref(prefbranch + "fwdhead", false); }
	} ,

	// Get preference without prefType
	getPref : function(prefstring)
	{
		switch (this.prefService.getPrefType(prefstring))
		{
			case Components.interfaces.nsIPrefBranch.PREF_STRING:
				return this.prefService.getComplexValue(prefstring,
									 Components.interfaces.nsISupportsString).data;
			case Components.interfaces.nsIPrefBranch.PREF_INT:
				return this.prefService.getIntPref(prefstring);
			case Components.interfaces.nsIPrefBranch.PREF_BOOL:
				return this.prefService.getBoolPref(prefstring);
			default:
				break;
		}
		return false;
	} ,

	// Set preference without prefType
	//--------------------------------------------------------------------
	setPref : function(prefstring, value)
	{
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
	reloadPrefs : function(el)
	{
		el = el.firstChild;
		while (el) {
			// Load preference
			if (el.tagName == "preference") {
				el.value = this.getPref(el.getAttribute("name"));
			}
			el = el.nextSibling;
		}
	} ,

	//******************************************************************************
	// Preferences
	//******************************************************************************

	// Setup default preferences and common settings
	//--------------------------------------------------------------------
	onLoad : function() // mod 0.3.2
	{
		// Check and set common preference
		this.setPref1st("extensions.smartTemplate4.");
		this.disableWithCheckbox();

		// Set account popup
		let CurId = this.fillIdentityListPopup();

		this.cleanupUnusedPrefs();

		// Switch account (from account setting)  // add 0.4.0
		if (window.arguments && window.arguments.length >= 1)	{
		  this.switchIdentity(window.arguments[0]);
		}
		else if(CurId) {
			this.switchIdentity(CurId);
		}

		// disable Use default (common account)
		document.getElementById("use_default").setAttribute("disabled", "true");

		window.onCodeWord = function(code, className) {
			SmartTemplate4.Settings.onCodeWord(code, className);
		};

		window.sizeToContent();
		// shrink width
		let deltaShrink = document.getElementById('decksContainer').scrollWidth - window.innerWidth;
		window.resizeBy(deltaShrink + 40, 0); // 40 pixels for paddings etc.

		// let's test if we can get this element
		let prefDialog = document.getElementById('smartTemplate_prefDialog');
		let hbox = document.getAnonymousElementByAttribute(prefDialog, 'class', 'prefWindow-dlgbuttons');

		let buttons = [];
		let maxHeight = 0;
		let i = 0;
		// build an array of visible dlg buttons and get their max height
		for (i=0; i < hbox.childNodes.length; i++ ) {
			let b = hbox.childNodes[i];
			let c = b.className;
			// let t = b.tagName;
			if (!b.hidden && (b.tagName == 'xul:button') && (c.indexOf('dialog-button') >= 0)) {
				buttons.push(b);
				let rect = b.getBoundingClientRect();
				let h = rect.bottom - rect.top;
				maxHeight = (h > maxHeight) ? h : maxHeight;
			}
		}

		// set height of buttons from that array
		let finalHeight = parseInt(maxHeight) - 2; // allow for border.
		for (i=0; i < buttons.length; i++ ) {
			buttons[i].height = finalHeight;
		}


		return true;
	} ,

	onCodeWord : function(code, className) {
		SmartTemplate4.Util.logDebugOptional("events","Preferences window retrieved code variable: " + code);

		let currentDeck = 'deckB.nodef' + SmartTemplate4.Settings.accountId ;
		
		let tabbox = document.getElementById(currentDeck);
		let templateMsgBoxId = '';
		let headerMsgBoxId = '';
		switch (tabbox.selectedIndex) {
			case 0:
				templateMsgBoxId='newmsg';
				if (className.indexOf('noNew') >= 0) {
					SmartTemplate4.Util.displayNotAllowedMessage(code);
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
			templateMsgBoxId += SmartTemplate4.Settings.accountId;
			if (headerMsgBoxId)
				headerMsgBoxId += SmartTemplate4.Settings.accountId;
			let editBox = document.getElementById(templateMsgBoxId);

			if (headerMsgBoxId) {
			// find out whether the header box has focus instead? => paste there instead.
				let headerBox = document.getElementById(headerMsgBoxId);
				if (headerBox.parentNode.className.indexOf('hasFocus') >=0 ) {
					editBox = headerBox;
				}
			}
			
			SmartTemplate4.Settings.insertAtCaret(editBox, code);
		}
	} ,

	onUnload : function() {
// 		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
	} ,

	// Setup cloned nodes and replace preferences strings
	//--------------------------------------------------------------------
	prefCloneAndSetup : function(el, branch)
	{
		// was called replaceAttr
		// AG added .common to the preference names to make it easier to add and manipulate global/debug settings
		function replacePrefName(_el,  key) {
			try {
				const _str = "smartTemplate4.common"; // was "smarttemplate"
				if (_el.hasAttribute("name")) {
					var _attr = _el.getAttribute("name");
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
	} ,

	//******************************************************************************
	// Identity
	//******************************************************************************

	// Add identity
	//--------------------------------------------------------------------
	addIdentity : function(menuvalue)
	{
		const  branch = menuvalue == "common" ? ".common" : "." + menuvalue;

		try {
			// Add preferences, if preferences is not create.
			this.setPref1st("extensions.smartTemplate4" + branch + ".");

			// Clone and setup a preference window tags.
			const el = document.getElementById("deckA.per_account");
			const clone = el.cloneNode(true);

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
	} ,


	// Fill identities menu
	//--------------------------------------------------------------------
	fillIdentityListPopup : function()	// mod 0.3.2
	{
		// get current identity
		SmartTemplate4.Util.logDebugOptional("settings","fillIdentityListPopup()");
		const accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].
									  getService(this.Ci.nsIMsgAccountManager).accounts;
		let currentId = 0;
		let CurId = null;
		
		// only when calling from the mail 3 pane window: 
		if (window.opener.GetSelectedMsgFolders) { 
			let folders = window.opener.GetSelectedMsgFolders();
			if (folders.length > 0)
				CurId = window.opener.getIdentityForServer(folders[0].server);
		}
		
		let theMenu = document.getElementById("msgIdentity");
		for (var idx = 0; idx < accounts.Count(); idx++) {
			const account = accounts.QueryElementAt(idx, this.Ci.nsIMsgAccount);

			if (!account.incomingServer)
				continue;

			for (var j = 0; j < account.identities.Count(); j++) {
				const identity = account.identities.QueryElementAt(j, this.Ci.nsIMsgIdentity);
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

	openAdvanced: function() {
		let advancedBox = document.getElementById('advancedBox');
		advancedBox.hidden = false;
		let wid = advancedBox.scrollWidth;
		window.resizeBy(wid, 0);
		SmartTemplate4.Help.onLoad();
		document.getElementById('btnAdvanced').hidden = true;
		document.getElementById('btnCloseAdvanced').hidden = false;
		document.getElementById('helpCaption').hidden = false;

		/*
		window.openDialog('chrome://smarttemplate4/content/help.xul', 'smartTemplate4-help',
		                  'chrome,titlebar,resizable,dependent,alwaysRaised,top=' + window.screenY.toString() + ',left=' + (window.screenX + window.outerWidth).toString(), null);
		window.sizeToContent();
		*/
		window.sizeToContent();

	} ,

	closeAdvanced: function() {
		let advancedBox = document.getElementById('advancedBox');
		let wid = advancedBox.scrollWidth;
		let helpCaption = document.getElementById('helpCaption');
		advancedBox.hidden = true;
		window.resizeBy(-wid, 0);
		SmartTemplate4.Help.onUnload();
		document.getElementById('btnAdvanced').hidden = false;
		document.getElementById('btnCloseAdvanced').hidden = true;
	} ,

	// Switch Identity (from account setting window)		// add 0.4.0 S
	//--------------------------------------------------------------------
	switchIdentity : function(idKey)
	{

		var el = document.getElementById("msgIdentityPopup").firstChild
		var index = 0;
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

	} , // add 0.4.0 E

	getCurrentDeck : function(accountId) {
		return (accountId != ".common")
		  ? 'deckB.nodef' + accountId
			: 'deckB.nodef';
	} ,

	// Select identity (from xul)
	//--------------------------------------------------------------------
	selectIdentity : function(idkey)
	{
		SmartTemplate4.Util.logDebugOptional("identities", "selectIdentity(" + idkey +  ")");
		let currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId);
		let tabbox = document.getElementById(currentDeck);
		if (!tabbox)
			alert("A problem has occured: Cannot find account settings: " + currentDeck); // this shouldn't happen, ever!
		let tabIndex = tabbox.selectedIndex;

		const  branch = (idkey == "common") ? ".common" : "." + idkey;

		// Display identity.
		let deck = document.getElementById("account_deckA");
		let index = 0;

		let searchDeckName = "deckA.per_account" + branch;
		let found = false;

		for (var el = deck.firstChild; el; el = el.nextSibling) {
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

		SmartTemplate4.Util.logDebugOptional("identities", "could " + (searchDeckName ? "" : "not") + " find deck:" + searchDeckName);

		//reactivate the current tab: new / respond or forward!
		currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId);
		tabbox = document.getElementById(currentDeck);
		if (tabbox)
			tabbox.selectedIndex = tabIndex;

	} ,

	insertAtCaret : function insertAtCaret(element, code) {
		// code = code + ' '; // this could be an option in a future version...
		if (!element) {
			SmartTemplate4.Util.logToConsole("insertAtCaret for variable '" + code + "' cannot be done - no element passed!");
			return;
		}

		var el =  '';
		el +=  element.id ? "  id=" + element.id : "";
		el +=  element.nodeName ? "  nodeName=" + element.nodeName : "";
		el +=  element.name ? "  name=" + element.name : "";
		SmartTemplate4.Util.logDebugOptional("events", "insertAtCaret(" + el + "): field Code = " + code);
		try {
			var node = element.nodeName;
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
				var startSel = element.selectionStart;
				var endSel = element.selectionEnd;
				if (!element.value)
					element.value = "" + code;
				else
					element.value = element.value.substring(0, startSel) + code + element.value.substring(endSel, element.value.length);
				element.selectionStart = startSel+code.length;
				element.selectionEnd = startSel+code.length;
			}
			window.focus(); // wahrscheinlich ueberfluessich
			element.focus();
		}
		catch(e) {
			SmartTemplate4.Util.logException("Exception in insertAtCaret; (nodeName=" + node  +")", e);
		}
	}




};