"use strict";

// -----------------------------------------------------------------------------------
// ---------------------------- last edit at 06/10/2012 ------------------------------
// -----------------------------------------------------------------------------------
// ----------------------------------- Changelog -------------------------------------
// -----------------------------------------------------------------------------------
// 0.7.5: "use strict" suggested by Mozilla add-on review team
// -----------------------------------------------------------------------------------

SmartTemplate4.Settings = {
	gCurId : "",
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
			var el = document.getElementById(arguments[i] + this.gCurId);
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
			var el = document.getElementById(arguments[i] + this.gCurId);
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
		var deck = document.getElementById(id + this.gCurId);
		if (deck)
		  { deck.selectedIndex = index; }

		const idkey = document.getElementById("msgIdentity").value;
		const branch = idkey == "common" ? "" : "." + idkey;
	} ,


	// Return checkbox is checked or not
	//--------------------------------------------------------------------
	isChecked : function(elid)
	{
		return document.getElementById(elid).checked;
	} ,


	// Disable DOM node depeding on checkboxes
	//--------------------------------------------------------------------
	disableWithCheckbox : function()
	{
		if (this.prefDisable(this.isChecked("new" + this.gCurId), "newmsg", "newhtml", "newnbr")) {
			this.prefDisable(this.isChecked("newhtml" + this.gCurId), "newnbr");
		}
		if (this.prefDisable(this.isChecked("rsp" + this.gCurId), "rspmsg", "rsphtml", "rspnbr", "rsphead")) {
			this.prefDisable(this.isChecked("rsphtml" + this.gCurId), "rspnbr");
		}
		if (this.prefDisable(this.isChecked("fwd" + this.gCurId), "fwdmsg", "fwdhtml", "fwdnbr", "fwdhead")) {
			this.prefDisable(this.isChecked("fwdhtml" + this.gCurId), "fwdnbr");
		}
	},

	// Delete unused preferences.
	//--------------------------------------------------------------------
	cleanupUnusedPrefs : function()
	{
		var array = this.prefService.getChildList("extensions.smarttemplate.", {});
		for (var i in array) {
			if (document.getElementsByAttribute("name", array[i]).length === 0) {
				this.prefService.deleteBranch(array[i]);
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
			this.prefService.getCharPref(prefbranch + "fwdmsg");
		} catch(e) { this.prefService.setCharPref(prefbranch + "fwdmsg", ""); }
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
				return this.prefService.getIntPref(prefstring);	  break;
			case Components.interfaces.nsIPrefBranch.PREF_BOOL:
				return this.prefService.getBoolPref(prefstring);	  break;
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
				return this.prefService.setCharPref(prefstring, value);	 break;
			case Components.interfaces.nsIPrefBranch.PREF_INT:
				return this.prefService.setIntPref(prefstring, value);	 break;
			case Components.interfaces.nsIPrefBranch.PREF_BOOL:
				return this.prefService.setBoolPref(prefstring, value);	 break;
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
		this.setPref1st("extensions.smarttemplate.");
		this.disableWithCheckbox();

		// Set account popup
		this.fillIdentityListPopup(); 				// mod 0.3.2

		this.cleanupUnusedPrefs();

		// Switch account (from account setting)  // add 0.4.0
		if (window.arguments && window.arguments.length >= 1)	{
		  this.switchIdentity(window.arguments[0]);
		}

		// disable Use default (common account)
		document.getElementById("use_default").setAttribute("disabled", "true");

		window.onCodeWord = function(code) {
			SmartTemplate4.Settings.onCodeWord(code);
		};

		return true;
	} ,

	onCodeWord : function(code) {
		SmartTemplate4.Util.logDebugOptional("events","Preferences window retrieved code variable: " + code);

		let currentDeck = (SmartTemplate4.Settings.gCurId) ? 'deckB.nodef' + SmartTemplate4.Settings.gCurId : 'deckB.nodef';
		let tabbox = document.getElementById(currentDeck);
		let templateMsgBoxId = '';
		switch (tabbox.selectedIndex) {
			case 0:
				templateMsgBoxId='newmsg';
				break;
			case 1:
				templateMsgBoxId='rspmsg';
				break;
			case 2:
				templateMsgBoxId='fwdmsg';
				break;
			default: // unknown!
				break;
		}
		if (templateMsgBoxId) {
			if (SmartTemplate4.Settings.gCurId)
				templateMsgBoxId += SmartTemplate4.Settings.gCurId;
			let editBox = document.getElementById(templateMsgBoxId);
			SmartTemplate4.Settings.insertAtCaret(editBox, code);
		}
	} ,

	onUnload : function() {
// 		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
	} ,

	// Setup cloned nodes and replace preferences strings
	//--------------------------------------------------------------------
	prefCloneAndSetup : function(el, str, key)
	{
		function replaceAttr(_el, _attrname, _str, _key) { try {
			if (_el.hasAttribute(_attrname)) {
				var _attr = _el.getAttribute(_attrname);
				if (_attr.indexOf(_str, 0) !== -1)
				  { _el.setAttribute(_attrname, _attr.replace(_str, _str + _key)); }
			}
		} catch(ex) {} }
		function appendAttr(_el, _attrname, _key) { try {
			if (_el.hasAttribute(_attrname))
			  { _el.setAttribute(_attrname, _el.getAttribute(_attrname) + _key); }
		} catch(ex) {} }

		var deps = 0;
		while (el) {
			// Set id, name, prefname
			appendAttr(el, "id", key);
			replaceAttr(el, "name", str, key);
			appendAttr(el, "preference", key);

			// Get next node or parent's next node
			if (el.hasChildNodes()) {
				el = el.firstChild;
				deps++;
			} else {
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
		const  branch = menuvalue == "common" ? "" : "." + menuvalue;

		// Add preferences, if preferences is not create.
		this.setPref1st("extensions.smarttemplate" + branch + ".");

		// Clone and setup a preference window tags.
		const el = document.getElementById("deckA.per_account");
		const clone = el.cloneNode(true);

		this.prefCloneAndSetup(clone, "smarttemplate", branch);
		el.parentNode.appendChild(clone);				// mod 0.3.2

		// Reload preferences
		this.reloadPrefs(document.getElementById("smarttemplate" + branch));

		// Disabled or Hidden DOM node
		this.gCurId = branch;    // change current id for pref library
		this.prefDeck("default.deckB", this.isChecked("use_default" + branch)?1:0);

		this.disableWithCheckbox();
		this.gCurId = "";
	} ,


	// Fill identities menu
	//--------------------------------------------------------------------
	fillIdentityListPopup : function()	// mod 0.3.2
	{
		SmartTemplate4.Util.logDebugOptional("settings","fillIdentityListPopup()");
		const accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].
									  getService(this.Ci.nsIMsgAccountManager).accounts;

		for (var idx = 0; idx < accounts.Count(); idx++) {
			const account = accounts.QueryElementAt(idx, this.Ci.nsIMsgAccount);

			if (!account.incomingServer)
				continue;

			for (var j = 0; j < account.identities.Count(); j++) {
				const identity = account.identities.QueryElementAt(j, this.Ci.nsIMsgIdentity);
				document.getElementById("msgIdentity")
						.appendItem(account.incomingServer.prettyName
									+ " - "
									+ identity.identityName, identity.key, "");
				this.addIdentity(identity.key);
			}
		}
	} ,


	// Switch Identity (from account setting window)		// add 0.4.0 S
	//--------------------------------------------------------------------
	switchIdentity : function(idKey)
	{
		var el = document.getElementById("msgIdentityPopup").firstChild
		var index = 0;
		SmartTemplate4.Util.logDebugOptional("settings","switchIdentity(" + idKey + ")");
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

	// Select identity (from xul)
	//--------------------------------------------------------------------
	selectIdentity : function(idkey)
	{
		const  branch = idkey == "common" ? "" : "." + idkey;

		// Display identity.
		var deck = document.getElementById("account.deckA");	// mod 0.3.2 S
		var index = 0;
		for (var el = deck.firstChild; el; el = el.nextSibling) {
			if (el.id == "deckA.per_account" + branch) {
				deck.selectedIndex = index;
				this.gCurId = branch;
				break;
			}
			index++;
		}

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