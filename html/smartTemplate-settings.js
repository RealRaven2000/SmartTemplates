"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

// namespace from settings.js - renameing SmartTemplate4 to SmartTemplates
var SmartTemplates = {};

const SMARTTEMPLATES_EXTPREFIX = "extensions.smartTemplate4.";

SmartTemplates.Settings = {
  isDebug: true, ///// TEST
  logDebug: function (msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (this.isDebug) {
      this.logToConsole(...arguments);
    }
	},
	logToConsole: function (a) {
    let msg = "SmartTemplates Settings\n";
    console.log(msg, ...arguments);
  },

	accountKey : ".common",  // default to common; .file for files
	preferenceElements : [],
	get accountId() {
		return (this.accountKey !== '.common') ? this.accountKey : '';  // empty for ".common"
	},
	//******************************************************************************
	// Common functions
	//******************************************************************************

	// Disable DOM node with identity key
	//--------------------------------------------------------------------
	// @arg[0] = enabled
	// @arg[1] = accouint id ("", ".id1", ".id2" etc..)
	// @arg[2..n] = which options to disable / enable
	prefDisable : function () {
		const enable = arguments[0],
		      accountId = arguments[1];
    let errors = "";
		for (let i = 2; i < arguments.length; i++){
      const elementId = arguments[i] + accountId;
			let el = document.getElementById(arguments[i] + accountId);
      if (!el) {
        errors+=`\nMissing Element ${elementId} - skipping...`
        continue;
      }
			el.disabled = enable ? false : true;
			if (enable) {
				el.removeAttribute("disabled");
			} else {
				el.setAttribute("disabled", "true");
			}
		}
    if (errors) {
      this.logDebug("Errors in prefDisable()" + errors);
    }
		return enable;
	},
	// Disable DOM node with identity key
	//--------------------------------------------------------------------
	prefHidden : function () {
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
	showCommonPlaceholder : function (isCommon) {
		const id = "default.deckB";
		let deck = document.getElementById(id + this.accountId);
		if (deck){ 
			deck.selectedIndex = isCommon ? 1 : 0; 
		}
	} ,  

	// Return checkbox is checked or not
	//--------------------------------------------------------------------
	isChecked : function(elId) {
		let com = elId.indexOf('.common');
		if (com>0)
		  elId = elId.substring(0, com); // cut off .common
		return document.getElementById(elId).checked;
	} ,

  // >>>>>>>>>>>>>>
  // REVIEW FOR DIFFERENT IMPLEMENTATION:
	// prepare a textbox to receive elements from the help window
	pasteFocus : function(element) {
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
	disableWithCheckbox : async function (el) {
		// change this to reading prefs instead! called during addidentity!!
		
		const account = this.accountId; // "", ".id1", ".id2" ...
		if (!el) {
			const branch = ((account || ".common") + ".").substring(1);  // cut off leading [.] for getting bool pref
						
			// initialise all checkboxes for this account according to pref settings!
			if (this.prefDisable(await getPref(branch + "new"), account, "newmsg", "newhtml", "newnbr")) {
				this.prefDisable(await getPref(branch + "newhtml"), account, "newnbr");
			}
			if (this.prefDisable(await getPref(branch + "rsp"), account, "rspmsg", "rsphtml", "rspnbr", "rsphead", "rspheader")) {
				this.prefDisable(await getPref(branch + "rsphtml"), account, "rspnbr");
			}
			if (this.prefDisable(await getPref(branch + "fwd"), account, "fwdmsg", "fwdhtml", "fwdnbr", "fwdhead", "fwdheader")) {
				this.prefDisable(await getPref(branch + "fwdhtml"), account, "fwdnbr");
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

	// Delete unused preferences.
	//--------------------------------------------------------------------
	cleanupUnusedPrefs : function() {
		const util = SmartTemplate4.Util;
    logMissingFunction("cleanupUnusedPrefs ()");
    return;
    // this needs to be implemented via LegacyPrefs:

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
	
	// Create preferences branch for new account
	//--------------------------------------------------------------------
	setPref1st : async function (prefbranch) {
    async function testPref(key, defaultValue) {
      const targetKey =  prefbranch + key;
      try {
        await getPref(targetKey);
      } catch (ex) {
        await setPref(targetKey,defaultValue);
      }
    }

    await testPref("def", true); 
		await testPref("new", false); 
    await testPref("rsp", false); 
    await testPref("fwd", false); 
    await testPref("newmsg", ""); 
		await testPref("rspmsg", ""); 
		await testPref("rspheader", ""); 
		await testPref("fwdmsg", ""); 
		await testPref("fwdheader", ""); 
		await testPref("newhtml", false); 
		await testPref("rsphtml", false);
    await testPref("fwdhtml", false); 
		await testPref("newnbr", false); 
    await testPref("rspnbr", false); 
		await testPref("fwdnbr", false); 
    await testPref("rsphead", false); 
		await testPref("fwdhead", false); 
	} ,  

  onLoad: async function() {
    let isAdvancedPanelOpen = getPref('expandSettings'); // may be obsolete?
    let composeType = null;

    this.logDebug("onLoad() …");
		// Check and set common preference
		await this.setPref1st("extensions.smartTemplate4.");
		await this.disableWithCheckbox();

		// Set account popup, duplicate DeckB to make account isntances
		let CurId = await this.fillIdentityListPopup();
    logMissingFunction("implement onLoad");
    
  } ,
  onUnload: async function() {
    logMissingFunction("implement onUnload");
  } ,


	// Setup cloned nodes and replace preferences strings
	// Tb >= 63 add new Preferences handler
	//--------------------------------------------------------------------
	prefCloneAndSetup : function (el, branch) {
		logMissingFunction("Implement prefCloneAndSetup()");
		const util = SmartTemplates.Util;
		util.logDebugOptional("settings.prefs", "prefCloneAndSetup(" + el + ", " + branch + ")");
		// was called replaceAttr
		// AG added .common to the preference names to make it easier to add and manipulate global/debug settings
		function replacePrefName(_el,  key) { // replace "preference" attribute with "data-pref-name"
			try {
				if (_el.hasAttribute("data-pref-name")) {
					let _attr = _el.getAttribute("data-pref-name");
          _el.setAttribute("data-pref-name", _attr.replace(".common", key));
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

	// Add identity - clone a new deck
	//--------------------------------------------------------------------
	addIdentity : function (menuvalue) {
		const isCommon = (menuvalue == "common"),
		      branch = isCommon ? ".common" : "." + menuvalue; 

    logMissingFunction(`implement (${menuvalue})`);
    this.logDebug(`addIdentity() - branch: ${branch}`);

		try {
			// Add preferences, if preferences is not create.
			let prefRoot = "extensions.smartTemplate4" + branch + ".";
			this.setPref1st(prefRoot);

			// Clone and setup a preference window tags.
			const el = document.getElementById("deckA.per_account");

			// fix painting over of decks
			el.classList.remove("deck-selected"); 

			const clone = el.cloneNode(true);

			this.prefCloneAndSetup(clone, branch);
			let appendedChild = el.parentNode.appendChild(clone);
			let spacers = appendedChild.querySelectorAll(".tabs-left");
			
			if (spacers[1] && (spacers[1].previousSibling == spacers[0])) {
				SmartTemplates.Util.logDebug("addIdentity() - removing first spacer");
				spacers[0].remove();
			}

			// Disabled or Hidden DOM node
			this.accountKey = branch;    // change current id for pref library
			
			let useCommon = 
			  isCommon ? false : prefs.getBoolPref(prefRoot + "def"); // this.isChecked("use_default" + branch)
			this.showCommonPlaceholder(useCommon);

			this.disableWithCheckbox();
			// this.accountKey = "";
		} catch(ex) {
			SmartTemplates.Util.logException("Exception in addIdentity(" + menuvalue  +")", ex);
		} finally {
			SmartTemplates.Util.logDebug("addIdentity COMPLETE");
		}
	} ,

  // Fill identities menu
	// this also clones the deck as many times as there are identities in order to fill in 
	// the specific templates [see addIdentity()]
	fillIdentityListPopup: async function() {

    const accounts = await messenger.accounts.list(false);
  	// this.logDebug("***fillIdentityListPopup");

		let currentId = 0, CurId = null;
		
		// only when calling from the mail 3 pane window: 
    /*
    *** TO DO: 
    ***        determine previous mail tab, current identity to preselect the correct one!
		** if (window.opener && window.opener.GetSelectedMsgFolders) { 
		** let folders = window.opener.GetSelectedMsgFolders();
		** if (folders.length > 0) { // select the correct server that applies to the current folder.
		** 	var { MailUtils } = ChromeUtils.import("resource:///modules/MailUtils.jsm");
		** 		[CurId] = MailUtils.getIdentityForServer(folders[0].server);
		** }
    */
		
		let theMenu = document.getElementById("msgIdentity"),
		    iAccounts = accounts.length;
				
    /* 
     ***  TO DO: 
     ***      we will handle these via the category switch catFileTemplates instead!
		const label = messenger.i18n.getMessage(("st.fileTemplates");
		theMenu.appendItem(label, "fileTemplates", "file templates: to replace Stationery");
    */
				
		for (let idx = 0; idx < iAccounts; idx++) {
      // https://webextension-api.thunderbird.net/en/stable/accounts.html#accounts-mailaccount
			let account = accounts[idx];

			// if (!account.incomingServer)
      if (!(["imap","pop","nntp"].includes(account.type))) {
        continue;
      }

			for (let j = 0; j < account.identities?.length; j++) {
        // https://webextension-api.thunderbird.net/en/stable/identities.html#identities-mailidentity
				let identity = account.identities[j];

				if (CurId == identity) {
					currentId = theMenu.itemCount; // remember position
				}
        
        // remove account name 
        let idText = "", acc = "";
        if (await getPref( "identities.showIdKey")) {
          idText = identity.key + " - ";
        }
        if (await getPref("identities.showAccountName")) {
          acc = account.incomingServer.prettyName + " - ";
        }
        let newOption = document.createElement("option");
        newOption.text = idText + acc + identity.identityName;
        newOption.value = identity.key;
        theMenu.appendChild(newOption);
				// theMenu.appendItem(lbl, identity.key, "");
				// will unselect the current item? (e.g. Common)
				this.addIdentity(identity.key);
				
			}
		}
		// update all Preference elements - do we need to wait for another event?
		for (let i=0; i<this.preferenceElements.length; i++ ) {
			this.preferenceElements[i].updateElements();
		}
		
		if (CurId && CurId.key && await getPref(CurId.key+".def")) { // use common?
			theMenu.selectedIndex = 0;
			CurId = null; // select common
		} else {
			// select the current identity from the drop down:
			theMenu.selectedIndex = currentId;
		}

		if (!CurId) { //  [issue 290]
			let common = document.getElementById("deckA.per_account");
			common.classList.add("deck-selected"); 
		}		
		return (CurId) ? CurId.key : null;
		
  
  },
  dummy: function() {

  }
  
  
  // ============================== Settings Object END  
};


/**********
 * UTILITY FUNCTIONS
 */

async function setPref(key,value) {
  let target = key;
  if (!key.startsWith(SMARTTEMPLATES_EXTPREFIX)) {
    target = SMARTTEMPLATES_EXTPREFIX + key;
  }
  await messenger.LegacyPrefs.setPref(target, value);
}

async function getPref(key) {
  let target = key;
  if (!key.startsWith(SMARTTEMPLATES_EXTPREFIX)) {
    target = SMARTTEMPLATES_EXTPREFIX + key;
  }  
  return await messenger.LegacyPrefs.getPref(target);
}

async function savePref(event) {
  let target = event.target,
      prefName = target.dataset.prefName; // automatically added from data-pref-name
  
	if (target instanceof HTMLInputElement) {
		if (target.getAttribute("type") === "checkbox") {
			await browser.LegacyPrefs.setPref(prefName, target.checked);
		} 
    else if (target.getAttribute("type") === "text" ||
			target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else if (target.getAttribute("type") === "number") {
			await browser.LegacyPrefs.setPref(prefName, parseInt(target.value, 10));
		} 
    else if (target.getAttribute("type") === "radio" && target.checked) {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    }    
    else if (target.getAttribute("type") === "color") {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    }    
    else {
			console.error("Received change event for input element with unexpected type", event);
		}
	} 
  else if (target instanceof HTMLSelectElement) {
		if (target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else {
      let v = isNaN(target.value) ? target.value : parseInt(target.value, 10);
			await browser.LegacyPrefs.setPref(prefName, v);
		}
	} 
  else if (element instanceof HTMLTextAreaElement) {
    await browser.LegacyPrefs.setPref(prefName, target.value);
  }  
  else {
		console.error("Received change event for unexpected element", event);
	}  
}


function logMissingFunction(txt) {
  // Log missing items for Conversion to Thunderbird 115
  console.log(`SmartTemplates %c[issue 213] to do: %c${txt}`, "color:red", "background: darkblue; color:white;");
}

/********** 
 * UI FUNCTIONS
 ***/
// add event listeners for tabs
const activateTab = (event) => {
  const btn = event.target,
        tabbox = btn.closest(".tabbox"),
        tabContent = tabbox.querySelector(".tabcontent-container");
  const tabSheets = tabContent.querySelectorAll("section"),
        tabs = tabbox.querySelectorAll(".tabbox button");
  Array.from(tabSheets).forEach(tabSheet => {
    tabSheet.classList.remove("active");
  });
  Array.from(tabs).forEach(button => {
    button.classList.remove("active");
  });

  btn.classList.add("active");
  // get <li> <btn> index:
  debugger;
  let idx = Array.from(btn.parentNode.parentElement.children).indexOf(btn.parentNode);
  tabContent.children[idx].classList.add("active");
  /*
  // store last selected tab ??
  browser.LegacyPrefs.setPref("extensions.quickfolders.lastSelectedOptionsTab", 
    btn.getAttribute("tabNo"));
    */
		
}





/********** 
 * Load / Unload
 ***/


async function loadPrefs() {
  console.log("loadPrefs");
  // use LegacyPrefs
	const prefElements = Array.from(document.querySelectorAll("[data-pref-name]"));
	for (let element of prefElements) {
		let prefName = element.dataset.prefName;
		if (!prefName) {
			console.error("Preference element has unexpected data-pref attribute", element);
			continue;
		}
		if (element instanceof HTMLInputElement) {
      if (element.getAttribute("type") === "checkbox") {
        element.checked = await browser.LegacyPrefs.getPref(prefName);
        if (element.checked != await browser.LegacyPrefs.getPref(prefName)) {
          debugger;
        }
      } else if (element.getAttribute("type") === "text" ||
        element.dataset.prefType === "string"
      ) {
        element.value = await browser.LegacyPrefs.getPref(prefName);
      }  else if (element.getAttribute("type") === "number") {
        element.value = (await browser.LegacyPrefs.getPref(prefName)).toString();
      } else if (element.getAttribute("type") === "radio") {
        let radioVal = (await browser.LegacyPrefs.getPref(prefName)).toString();
        if (element.value === radioVal) {
          element.checked = true;
        }
      } else if (element.getAttribute("type") === "color") {
        element.value = await browser.LegacyPrefs.getPref(prefName);
      } else {
        console.error("Input element has unexpected type", element);
      }
		} else if (element instanceof HTMLSelectElement) {
			if (element.dataset.prefType === "string") {
				element.value = await browser.LegacyPrefs.getPref(prefName);
			} else {
				element.value = (await browser.LegacyPrefs.getPref(prefName)).toString();
			}
		} else if (element instanceof HTMLTextAreaElement) {
      element.value = await browser.LegacyPrefs.getPref(prefName);
    } else {
			console.error("Unexpected preference element", element);
		}
    
    // Wire up individual event handlers
    element.addEventListener("change", savePref);
    
	}  
}

// we cannot transmit the element, so removing the first parameter
async function dispatchAboutConfig(filter, readOnly, updateUI=false) {
  // we put the notification listener into quickfolders-tablistener.js - should only happen in ONE main window!
  // el - cannot be cloned! let's throw it away and get target of the event
  messenger.runtime.sendMessage({ 
    command: "showAboutConfig", 
    filter: filter,
    readOnly: readOnly,
    updateUI: updateUI
  });
}

function addConfigEvent(el, filterConfig) {
	// add right-click event to containing label
	if (!el) return;
	let eventNode = el.parentNode.querySelector(".configSettings");
	let eventType;
	if (eventNode) {
		eventType = "click";
	} else {
		eventNode = el.parentNode;
		eventType = "contextmenu";
	}
	eventNode.addEventListener(eventType, async(event) =>  {
		event.preventDefault();
		event.stopPropagation();
		await dispatchAboutConfig(filterConfig, true, true);
		// if (null!=retVal) return retVal;
	});
}

// add UI event listeners
function addUIListeners() {
  // activate all tab listeners.
  for (let button of document.querySelectorAll(".actionTabs button")) {
    button.addEventListener("click", activateTab);
  }

	// add bool preference reactions
	for (let chk of document.querySelectorAll("input[type=checkbox]")) {	
		let dataPref = chk.getAttribute("data-pref-name").replace(SMARTTEMPLATES_EXTPREFIX,"");
		// get my bool pref:
		switch (dataPref) {
			case "debug":
				chk.addEventListener("change", (event) => {
					SettingsUI.toggleBoolPreference(chk); // <== QF.Options
				});				
				break;
		}

		/* RIGHTCLICK HANDLERS */
		// right-click show details from about:config
		let filterConfig="", readOnly=true, retVal=null;
		switch(dataPref) {
			case "debug":
				// + options.toggleBoolPreference(chk,true); beforehand!
				filterConfig="smartTemplate4.debug"; retVal=false;
				break;
		}

		if (filterConfig) {
			addConfigEvent(chk,filterConfig);
		}	
	}

	for (let chk of document.querySelectorAll(".settingDisabler")) {	
		chk.addEventListener("change", (event) => {
			// SmartTemplates.Settings.disableWithCheckbox(this)
			disableWithCheckbox(chk); // <== QF.Options
		});			
	}
	
  // these were oncommand events - for the file templates list
	document.getElementById("btnAdd").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.update(true)");
	});
	document.getElementById("btnUpdate").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.update(false)");
	});
	document.getElementById("btnRemove").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.remove()");
	});
	document.getElementById("btnUp").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.up()");
	});
	document.getElementById("btnDown").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.down()");
	});
	document.getElementById("btnEdit").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.edit()");
	});
	document.getElementById("helpSnippets").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.Util.showStationeryHelpPage('snippets')");
	});

	// select element
	document.getElementById("msgIdentity").addEventListener("change", (event) => {
		logMissingFunction("SmartTemplates.Settings.selectIdentity(this.value)");
	});

	// toolbar for the template tools
	document.getElementById("helpTemplates").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.Util.showStationeryHelpPage('templateFiles')");
	});
	document.getElementById("btnSaveTemplate").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplates.Settings.store()");
	});
	document.getElementById("btnLoadTemplate").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplates.Settings.load()");
	});
	document.getElementById("btnYouTube").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.Util.showYouTubePage()");
	});
	document.getElementById("btnAdvanced").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplates.Settings.openAdvanced()");
	});
	document.getElementById("btnCloseAdvanced").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplates.Settings.closeAdvanced()");
	});

	// more checkboxes
	document.getElementById("use_default").addEventListener("change", (event) => {
		logMissingFunction("SmartTemplates.Settings.showCommonPlaceholder(this.checked)");
	});
	// file picker button
	document.getElementById("btnPickTemplate").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.pickFileFromSettings()");
	});	


	// textareas:
	// drag + drop
  for (let textarea of document.querySelectorAll(".templateBox")) {
		textarea.addEventListener("drop", (event) => {
			logMissingFunction("SmartTemplates.Settings.textDropped(event)");
		});	
  }
	// focus (for pasting)
  for (let textarea of document.querySelectorAll(".pasteFocus textarea")) {
		textarea.addEventListener("focus", (event) => {
			logMissingFunction("SmartTemplates.Settings.pasteFocus(this)");
		});	
  }

  // tabs for file templates (new, write, fwd, snippets)
	document.getElementById("fileTemplatesTabs").addEventListener("change", (event) => {
		logMissingFunction("SmartTemplates.Settings.selectFileCase(this, event)");
	});	
	// not sure whether this one is needed??
	document.getElementById("fileTemplateContainer").addEventListener("change", (event) => {
		logMissingFunction("SmartTemplates.Settings.selectFileCase(this, event)");
	});	
	
	
	// template lists
	// .fileTemplateList richlistbox ==> select
  for (let textarea of document.querySelectorAll(".fileTemplateList")) {
		textarea.addEventListener("change", (event) => {
			logMissingFunction("SmartTemplate4.fileTemplates.onSelect(this)");
		});	
  }

  // ============================
	// == template file details  ==
  // ============================
	let txtTitle = document.getElementById("txtTemplateTitle");
	txtTitle.addEventListener("blur",(event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.onEditLabel(this)");
	});	
	txtTitle.addEventListener("focus",(event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.updateInputGlobal(this)");
	});	

	let txtCategory = document.getElementById("txtTemplateCategory");
	txtCategory.addEventListener("blur",(event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.onEditLabel()");
	});	
	txtCategory.addEventListener("focus",(event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.updateInputGlobal(this)");
	});	

	



	


	addConfigEvent(document.getElementById("identityLabel"), "extensions.smartTemplate4.identities");


}

async function onLoad() {
  i18n.updateDocument();
  // this api function can do replacements for us
  //  h1.innerText = messenger.i18n.getMessage('heading-installed', addonName);
  loadPrefs();
  SmartTemplates.Settings.onLoad();
  addUIListeners();

}



addEventListener("load", async (event) => {
  const manifest = await messenger.runtime.getManifest(),
        browserInfo = await messenger.runtime.getBrowserInfo(),
        addonVer = manifest.version;
  onLoad();

});  

addEventListener("unload", async (event) => {
  SmartTemplates.Settings.onUnload();
});  
