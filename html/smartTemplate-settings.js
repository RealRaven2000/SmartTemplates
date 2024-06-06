
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/


// we can only do this if we load this file itself as a module.
// import {Preferences} from "../scripts/st-prefs.mjs.js"; 
// debugger;


// -------------------------------------------------------
// TO DO - REIMPLEMENT THE FOLLOWING FUNCTIONS:
//     -    SmartTemplates.Settings.selectDefaultTemplates
//     -    cleanupUnusedPrefs() - extend LegacyPrefs to remove branches!
//     -    disable support menu if no license ??? search "supportTab"
//     -    toggleExamples() + loadTemplatesFrame() to hide examples tab
//     -    onCodeWord() receiver for events from help.xhtml
//     -    getFileName() to retrieve a file from dialog - via experiment?
//     -    getHeaderArgument()
//     -    selectFileCase()
//     -    insertAtCaret()
//     -    fontSize()
//     -		resolveAB_onClick()
//     - 		updateStatusBar()
//     -    setStatusIconMode() - backend function!
//     Account json save / load
//     -		fileAccountSettings()  
//   check currentAccountName  !!! should probably not use .label
// -------------------------------------------------------

var licenseInfo;

import { SettingsUI } from "./st-settings-ui.mjs";
import { logMissingFunction } from "./st-log.mjs";

// use a global variable, similar to background script.
var fileTemplates = {
  Entries: [], 
  MRU_Entries: [],
	isModified: false  // global flag to trigger saving to back end at some stage (WIP)
}; // copy of recent and configured file templates from SmartTemplate4.fileTemplates

async function initFileTemplates(data) {
	// let's use an experiment function to retrieve the "data" - see background page
	fileTemplates.Entries = data.Entries;
	fileTemplates.MRU_Entries = data.MRU_Entries;
}


async function initLicenseInfo() {
  licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  document.getElementById("txtLicenseKey").value = licenseInfo.licenseKey;
  
  if (licenseInfo.licenseKey) {
		await SmartTemplates.Settings.validateLicenseInOptions(true);
  }
  
  // add an event listener for changes:
  // window.addEventListener("QuickFolders.BackgroundUpdate", validateLicenseInOptions);
  
  messenger.runtime.onMessage.addListener (
    (data, sender) => {
      if (data.msg=="updatedLicense") {
        licenseInfo = data.licenseInfo;
        SmartTemplates.Settings.updateLicenseOptionsUI(false); // we may have to switch off silent if we cause this
        configureBuyButton();
        return Promise.resolve(true); // returns a promise of "undefined"
      }
    }
  );
}



// namespace from settings.js - renaming SmartTemplate4 to SmartTemplates
// var SmartTemplates = {};
// console.log({Preferences});
// SmartTemplates.Preferences = Preferences;
// Uncaught SyntaxError: import declarations may only appear at top level of a module
// COPIED CODE from st-prefs.mjs.js
SmartTemplates.Preferences = {
	Prefix: "extensions.smartTemplate4.",
  isDebug: async function() {
    return await messenger.LegacyPrefs.getPref(this.Prefix + "debug");
  },
	isDebugOption: async function(option) { // granular debugging
		if (!await this.isDebug)
			return false;
		try {
			return await this.getMyBoolPref("debug." + option);
		}
		catch(e) {
      return false;
    }
	},  
  isBackgroundParser: async function() {
    return await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.BackgroundParser");
  },
	getStringPref: async function getStringPref(p) {
    let prefString ="",
		    key = this.Prefix + p;
    try {
			prefString = await messenger.LegacyPrefs.getPref(key);
    }
    catch(ex) {
      console.log("%cCould not find string pref: " + p, "color:red;", ex.message);
    }
    finally {
      return prefString;
    }
	},  
	setStringPref: async function setStringPref(p, v) {
    return await messenger.LegacyPrefs.setPref(this.Prefix + p, v);
	},
	getIntPref: async function(p) {
		return await messenger.LegacyPrefs.getPref(p);
	},
	setIntPref: async function(p, v) {
		return await messenger.LegacyPrefs.setPref(p, v);
	},
	getBoolPref: async function(p) {
		try {
			return await messenger.LegacyPrefs.getPref(p);
		} catch(e) {
			let s="Err:" +e;
			console.log("%cgetBoolPref("+p+") failed:\n" + s, "color:red;");
			return false;
		}
	},
	setBoolPref: async function(p, v) {
		try {
			return await messenger.LegacyPrefs.setPref(p, v);
		} catch(e) {
			let s="Err:" +e;
			return false;
		}
	} ,  

	getMyBoolPref: async function(p) {
		return await this.getBoolPref(this.Prefix + p);
	},

	setMyBoolPref: async function(p, v) {
		return await this.setBoolPref(this.Prefix + p, v);
	},

	getMyIntPref: async function(p) {
		return await this.getIntPref(this.Prefix + p);
	},

	setMyIntPref: async function(p, v) {
		return await this.setIntPref(this.Prefix + p, v);
	},
  
	setMyStringPref: async function(p, v) {
		return await messenger.LegacyPrefs.setPref(this.Prefix + p, v);
	} ,

	getMyStringPref: async function(p) {
		return await messenger.LegacyPrefs.getPref(this.Prefix + p);
	} ,
  
  // possibly move this class (or better make an instance immediately) to st-prefs.msj.js
  // SmartTemplates.Preferences.prefs [= new classPref()] I only need a single instance??
  // so why would I need a class
  identityPrefs: { // was classPref() from smartTemplate.overlay.js
      // use where ST4.pref is used! Preferences.identityPrefs
      // rename to pref and add to SmartTemplates. import from st-prefs.msj.js as needed?
      // all member functions have account idKey as parameters, so I don't think this object
      // has statefulness
    // -----------------------------------
    // get preference
    // returns default value if preference cannot be found.
    getCom: async function(prefstring, defaultValue)	{
      if (typeof defaultValue == "string") {
        return await messenger.LegacyPrefs.getPref(prefstring, defaultValue);
      }
      else {
        let v = await messenger.LegacyPrefs.getPref(prefstring);
        if (v==null) v = defaultValue;
        return v;
      }
    },

    // -----------------------------------
    // get preference(branch)
    getWithBranch: async function(idKey, defaultValue) {
      return await this.getCom(SmartTemplates.Preferences.Prefix + idKey, defaultValue); //
    },

    // idKey Account
    // composeType: rsp, fwd, new
    // def: true = common
    // "Disable default quote header"
    isDeleteHeaders: async function(idKey, composeType, def) {
      // xxxhead
      return await this.getWithIdkey(idKey, composeType + "head", def)
    },

    isReplaceNewLines: async function(idKey, composeType, def) {
      // xxxnbr
      return await this.getWithIdkey(idKey, composeType + "nbr", def)
    },

    isUseHtml: async function(idKey, composeType, def) {
      // xxxhtml
      return await this.getWithIdkey(idKey, composeType + "html", def)
    },

    getTemplate: async function(idKey, composeType, def) {
      return await this.getWithIdkey(idKey, composeType + "msg", def);
    },

    getQuoteHeader: async function(idKey, composeType, def) {
      return await this.getWithIdkey(idKey, composeType + "header", def);
    },

    isTemplateActive: async function(idKey, composeType, def) {
      let isActive = await this.getWithIdkey(idKey, composeType, def);
      if (!isActive) return false; // defaults to empty string
      return isActive;
    },

    // whether an Identity uses the common account
    isCommon: async function(idkey) {
      return await this.getWithBranch(idkey + ".def", true);
    },
    

    // -----------------------------------
    // Get preference with identity key
    getWithIdkey: async function(idkey, pref, def) {    
      // fix problems in draft mode...
      if (!pref) 
        return ""; // draft etc.
      // extensions.smarttemplate.id8.def means account id8 uses common values.
      if (await this.getWithBranch(idkey + ".def", true)) { // "extensions.smartTemplate4." + "id12.def"
        // common preference - test with .common!!!!
        return await this.getWithBranch("common." + pref, def);
      }
      else {
        // Account specific preference
        return await this.getWithBranch(idkey + "." + pref, def);
      }
    }  
    
  } // identityPrefs
    
// OBSOLETE: existsCharPref, existsBoolPref, getBoolPrefSilent
  
}

const SMARTTEMPLATES_EXTPREFIX = SmartTemplates.Preferences.Prefix;

SmartTemplates.Settings = {
  // OBSOLETE PARTS:
  preferenceElements : [],

  // USED:
	accountKey : ".common",  // default to common; .file for files
	get accountId() {
		// empty for ".common"
		return (this.accountKey !== '.common') ? this.accountKey : ''; 
	},	
  get currentId() {
    let key = document.getElementById('msgIdentity').value;
    return key;
  },
	
	get currentIdSelector() {
		let s = this.currentId;
		return (s!="common") ? ('.'+ s) : "";
	} ,
  
  get currentAccountName() {
    let theMenu = document.getElementById("msgIdentity"),
        menuEntry = theMenu.value,
        end = menuEntry.indexOf(' <');
    if (end>0) {
      return menuEntry.substring(0, end);
		}
		return menuEntry;
  },
  

  isDebug: true, ///// TEST
  logDebug: async function (msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (this.isDebug) {
      this.logToConsole(...arguments);
    }
	},
  // first argument is the option tag
  logWithOption: function(a) {
    arguments[0] =  "SmartTemplates "
      +  '{' + arguments[0].toUpperCase() + '} ' 
			// + Util.logTime()
      + "\n";
    console.log(...arguments);
  },  	
	logDebugOptional: async function (optionString, msg) {
    optionString = arguments[0];
    let options = optionString.split(','); // allow multiple switches
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (await SmartTemplates.Preferences.isDebugOption(option)) {
        this.logWithOption(...arguments);
        break; // only log once, in case multiple log switches are on
      }
    }
	},
	logToConsole: function (a) {
    let msg = "SmartTemplates Settings\n";
    console.log(msg, ...arguments);
  },
	logException: function(aMessage, ex) {
		let stack = '';
		if (typeof ex.stack!='undefined') {
			stack = ex.stack.replace("@","\n  ");
		}

		let srcName = ex.fileName ? ex.fileName : "";
		console.warn(aMessage + "\n", 
		  `${srcName}:${ex.lineNumber}`, 
			`\n${ex.message}\n`, 
			ex.stack ? ex.stack.replace("@","\n  ") : "", );
	} ,

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
	showCommonPlaceholder : function (isCommon, accountId = this.accountId) {
		const id = "default.deckB";
		let deck = document.getElementById(id + accountId);
		if (deck){ 
			deck.selectedIndex = isCommon ? 1 : 0; 
			if (isCommon) {
				deck.querySelector(".tabbox").classList.remove("deck-selected");
				deck.querySelector(".placeholder").classList.add("deck-selected");
			} else {
				deck.querySelector(".tabbox").classList.add("deck-selected");
				deck.querySelector(".placeholder").classList.remove("deck-selected");
			}			
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
		if (el) { debugger; }
		
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
    logMissingFunction("cleanupUnusedPrefs ()");
    return;
		const util = SmartTemplate4.Util;
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

	selectCategoryMenu: function(id) {
		let el = document.getElementById(id);
		if (!el.getAttribute("disabled")) {
			let evt = new Event( "click", { bubbles: true } )
			el.dispatchEvent(evt);
		}
	} ,



  onLoad: async function() {
    // let isAdvancedPanelOpen = getPref('expandSettings'); // may be obsolete?
    let composeType = null;

    this.logDebug("onLoad() …");
		// Check and set common preference
		await this.setPref1st("extensions.smartTemplate4.");
		await this.disableWithCheckbox();

		// Set account popup, duplicate DeckB to make account isntances
		// let CurId = 
		await this.fillIdentityListPopup();

		// get inn params from querystring
		const params = new URLSearchParams(window.location.search);
		const CurId = params.get("id");
		composeType = params.get("composeType");

		this.switchIdentity(CurId || 'common', composeType);

		// disable Use default (common account)
		getElement("use_default").setAttribute("disabled", "true");
    // [issue 170] support license date extension
    getElement("licenseDate").addEventListener("click", SmartTemplates.Settings.showExtensionButton);


		// if (!util.hasLicense(false) && SmartTemplate4.Util.licenseInfo.status != "Expired") {
    //   SmartTemplate4.Settings.showTrialDate();
		// }

		// // we could move the donate button to the bottom of the category  menu (see settings)
		// this.configExtra2Button();

    // window.addEventListener("SmartTemplates.BackgroundUpdate", SmartTemplate4.Settings.validateLicenseFromEvent);

  	const defaultMethod =  await getPref("defaultTemplateMethod");
		switch (defaultMethod) {
			case 1:
				getElement("useAccountTemplate").checked = true;
				break;
			case 2:
				getElement("useLastTemplate").checked = true;
				break;
		}
		
    logMissingFunction("implement onLoad completion => remaining details...");


    
  } ,
  onUnload: async function() {
    logMissingFunction("implement onUnload!");
  } ,


	// Setup cloned nodes and replace preferences strings
	// Tb >= 63 add new Preferences handler
	//--------------------------------------------------------------------
	prefCloneAndSetup : function (el, branch) {
		logMissingFunction("Implement prefCloneAndSetup()");
		this.logDebug("prefCloneAndSetup(" + el + ", " + branch + ")");
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
				this.logDebug("Added Preference: " + p.id);
			}
		}
		this.logDebug("prefCloneAndSetup COMPLETE");
	} ,


	//******************************************************************************
	// Identity Functions
	//******************************************************************************

	// Add identity - clone a new deck
	//--------------------------------------------------------------------
	addIdentity : async function (menuvalue) {
		const isCommon = (menuvalue == "common"),
		      branch = isCommon ? ".common" : "." + menuvalue; 

    logMissingFunction(`implement (${menuvalue})`);
    this.logDebug(`addIdentity() - branch: ${branch}`);

		try {
			// Add preferences, if preferences is not create.
			let prefRoot = "extensions.smartTemplate4" + branch + ".";
			await this.setPref1st(prefRoot);

			// Clone and setup a preference window tags.
			const el = document.getElementById("deckA.per_account");

			// fix painting over of decks
			el.classList.remove("deck-selected"); 

			const clone = el.cloneNode(true);
			// collapse clone for now.
			clone.classList.remove("deck-selected");

			this.prefCloneAndSetup(clone, branch);
			let appendedChild = el.parentNode.appendChild(clone);
			let spacers = appendedChild.querySelectorAll(".tabs-left");
			
			if (spacers[1] && (spacers[1].previousSibling == spacers[0])) {
				this.logDebug("addIdentity() - removing first spacer");
				spacers[0].remove();
			}

			// Disabled or Hidden DOM node
			this.accountKey = branch;    // change current id for pref library
			
			let useCommon = 
			  isCommon ? false : await getPref(prefRoot + "def"); // this.isChecked("use_default" + branch)
			this.showCommonPlaceholder(useCommon, this.accountId);

			this.disableWithCheckbox();
		} catch(ex) {
			this.logException("Exception in addIdentity(" + menuvalue  +")", ex);
		} finally {
			this.logDebug("addIdentity COMPLETE");
		}
	} ,

  // Fill identities menu
	// this also clones the deck as many times as there are identities in order to fill in 
	// the specific templates [see addIdentity()]
	fillIdentityListPopup: async function(CurId = null) {
  	// this.logDebug("***fillIdentityListPopup");
    const accounts = await messenger.accounts.list(false);
		let currentId = 0;
		let theMenu = document.getElementById("msgIdentity"),
		    iAccounts = accounts.length;
				
		const useCommonPlaceHolder = document.getElementById("commonPlaceholder"),
		      useCommonCmd = SmartTemplates.Util.getBundleString("pref_def.label");
		useCommonPlaceHolder.textContent = SmartTemplates.Util.getBundleString("pref_def.cap", useCommonCmd);;

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
      if (!(["imap","pop3","nntp"].includes(account.type))) {
        continue;
      }

			for (let j = 0; j < account.identities?.length; j++) {
        // https://webextension-api.thunderbird.net/en/stable/identities.html#identities-mailidentity
				let identity = account.identities[j];

				// CurId will be transmitted when calling from any 3pane window to preselect account
				if (CurId == identity) {
					currentId = theMenu.itemCount; // remember position
				}
        
				const identityLabel = `${identity.name} <${identity.email}>`;
        // remove account name 
        let idText = "", acc = "";
				// identity.id hopefully maps to identity.key
        if (await getPref( "identities.showIdKey")) {
          idText = identity.id + " - ";
        }
        if (await getPref("identities.showAccountName")) {
          acc = `${account.name}  - `;  // incomingServer.prettyName doesn't exist in API
        }

        let newOption = document.createElement("option");
        newOption.text = idText + acc + identityLabel;
        newOption.value = identity.id;
        theMenu.appendChild(newOption);
				// theMenu.appendItem(lbl, identity.key, "");
				// will unselect the current item? (e.g. Common)
				await this.addIdentity(identity.id);
				
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

		const common = document.getElementById("deckA.per_account");

		if (!CurId) { //  [issue 290]
			common.classList.add("deck-selected"); 
		}		

		// hide use common checkbox on first account, and add explanation
		const common1st = common.querySelector(".commonContainer label");
		common1st.style.visibility="hidden";
		const commonContainer = common.querySelector(".commonContainer");
		const commonExplainer = document.createElement("label");
		commonExplainer.id = "commonSettingsExplainer";
		commonExplainer.textContent = 
			SmartTemplates.Util.getBundleString("pref_def.explainer", SmartTemplates.Util.getBundleString("pref_def.label"));
		commonContainer.appendChild(commonExplainer);

		
		return (CurId) ? CurId.key : null;
		
  
  },


	// Switch Identity (from account setting window)	
	//--------------------------------------------------------------------
	switchIdentity : function(idKey, composeType)	{
		let wasSwitched = false;
    composeType = composeType || null;
		this.logDebug("switchIdentity(" + idKey + ")");
		document.getElementById("msgIdentity").value = idKey;
		this.selectIdentity(idKey);
		wasSwitched = true;

    // select the correct compose type tab
		/* THIS WILL BE HANDLED SEPARATELY! 
		if (idKey=='fileTemplates' && composeType) {
      let fileTemplatesTabs = document.getElementById('fileTemplatesTabs'),
          panelId = composeType + '-fileTemplates',
          idx = 0;
      switch (composeType) {
        case 'new': idx = 0; break;
        case 'rsp': idx = 1; break;
        case 'fwd': idx = 2; break;
        case 'snippets': idx = 3; break;
      }
      fileTemplatesTabs.selectedPanel = document.getElementById(panelId);
      fileTemplatesTabs.selectedIndex = idx;
      // attract attention to the picker button
      document.getElementById('btnPickTemplate').classList.add('pulseRed');
    }
		*/
    
		this.logDebug("functions", "switchIdentity(" + idKey + ") COMPLETE");
    return wasSwitched;

	} ,

	getCurrentDeck : function (accountId) {
		return (accountId != ".common")
		  ? 'deckB.nodef' + accountId
			: 'deckB.nodef';
	} ,

	// Select identity (from xul)
	//--------------------------------------------------------------------
	selectIdentity : async function (idkey)	{
		await this.logDebugOptional("identities", "selectIdentity(" + idkey +  ")");

		let currentDeck = this.getCurrentDeck(this.accountId),
		    tabbox = document.getElementById(currentDeck);
		if (!tabbox) {
			alert("A problem has occured\nCannot find account settings for deck: " + currentDeck); // this shouldn't happen, ever!
		}
		let tabIndex = tabbox.getAttribute("selectedIndex"); 
		if (tabIndex<0) tabIndex=0;

		const branch = (idkey == "common") ? ".common" : "." + idkey;

		// Display identity.
		let deck = document.getElementById("account_deckA"),
		    idx = 0,
		    searchDeckName = ("deckA.per_account" + branch).replace(".common",""),
		    found = false;

    let newSelected;
		for (let el of document.querySelectorAll("#account_deckA .accountDeck")) {
			if (el.id == searchDeckName) {
				newSelected = el; 
				deck.selectedIndex = idx;
				found = true;
			} else {
				el.classList.remove("deck-selected");
			}
			idx++;
		}
		
		if (found) {
			newSelected.classList.add("deck-selected");
		}

		// nothing found, then we are in common! (changed from previous behavior where common accountKey was "", now it is ".common"
		if (!found) {
			deck.selectedIndex = 0; // choice for file templates will be inserted below this.
		}
		this.accountKey = branch;

		await this.logDebugOptional("identities", "" + (searchDeckName ? "found" : "could not find") + " deck:" + searchDeckName);
    let chkUseCommon = document.getElementById('use_default' + this.currentIdSelector);
    if (chkUseCommon && found) {
      chkUseCommon.checked = await getPref("extensions.smartTemplate4" + this.currentIdSelector + ".def");
		}

		//reactivate the current tab: new / respond or forward!
		currentDeck = this.getCurrentDeck(this.accountId);
		tabbox = document.getElementById(currentDeck);
		if (tabbox) {
			tabbox.selectedIndex = tabIndex; //must b set this way because it is custom element, need to call setter
			//tabbox.setAttribute("selectedIndex",tabIndex);
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
		await this.logDebugOptional("identities", "selectIdentity(" + idkey + ") COMPLETE");

	} ,
	
	
  resolveAB_onClick: function(el) {
    // if it was already checked we are now unchecking it...
    let nickBox = document.getElementById('chkResolveABNick'),
		    displayNameBox = document.getElementById('chkResolveABDisplay'),
        replaceMail = document.getElementById('chkResolveABRemoveMail');
    setTimeout(
      function() {
        let isResolveAB = el.checked;
        if (!isResolveAB) {
          nickBox.checked = false;
        }
        displayNameBox.disabled = !isResolveAB;
        nickBox.disabled = !isResolveAB;
        replaceMail.disabled = !isResolveAB;
      }
    );
  } ,

	fileAccountSettings: function(mode, jsonData, fname) {
	  logMissingFunction("fileAccountSettings()");
	} ,

  store: async function() {
		// let's get all the settings from the key and then put them in a json structure:
    let currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
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
    this.fileAccountSettings('save', json, this.currentAccountName);
  } ,
  
  // load a Template file (not this module!)
  load: async function() {
    let currentDeck = this.getCurrentDeck(SmartTemplate4.Settings.accountId),
        tabbox = document.getElementById(currentDeck),
        txt = tabbox.getElementsByTagName('html:textarea'), // changed from textbox
        chk = tabbox.getElementsByTagName('checkbox');
		this.fileAccountSettings('load', {
			key: this.currentId, 
			textboxes: txt, 
			checkboxes: chk
		});
  } ,
  	
	
	/** LICENSE INTERFACE */

	// reads new license key from textarea and
  // sends the key to background page for validation
  validateNewKey: async function () {
    this.trimLicense();
    let input = document.getElementById('txtLicenseKey'),
        key = input.value;
    // The background script will validate the new key and send a broadcast to all consumers on sucess.
    // let rv = await SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateLicense", key: key });
		const result = await messenger.runtime.sendMessage({ 
			command: "updateLicenseKey", 
			key: key
		});
		SmartTemplates.Util.logDebug(`validateNewKey() returned ${result}`);
		// now retrieve licenseInfo from background!
		licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
		this.logDebug(licenseInfo);
		await this.validateLicenseInOptions();
  } ,	

  trimLicense: function() {
    let txtBox = document.getElementById('txtLicenseKey'),
        strLicense = txtBox.value.toString();
    SmartTemplates.Util.logDebug('trimLicense() : ' + strLicense);
    // Remove line breaks and extra spaces:
		let trimmedLicense =  
		  strLicense.replace(/\r?\n|\r/g, ' ') // replace line breaks with spaces
				.replace(/\s\s+/g, ' ')            // collapse multiple spaces
        .replace('\[at\]','@')
				.trim();
    txtBox.value = trimmedLicense;
    SmartTemplates.Util.logDebug('trimLicense() result : ' + trimmedLicense);
    return trimmedLicense;
  } ,	

  // make a validation message visible but also repeat a notification for screen readers.
  showValidationMessage: function (el, silent=true) {
    if (el.getAttribute("collapsed") != false) {
      el.setAttribute("collapsed", false);
      if (!silent) {
        SmartTemplates.Util.popupAlert (SmartTemplates.Util.ADDON_TITLE, el.textContent);
			}
    }
  } ,		

  enablePremiumConfig: function (isEnabled) {
		/* enables Pro features */
		for (let el of document.querySelectorAll(".premiumFeature")) {
			el.disabled = !isEnabled;
		}
		this.enableStandardConfig(isEnabled);
  } ,

	enableStandardConfig: function(isEnabled) {
		for (let el of document.querySelectorAll(".standardFeature")) {
			el.disabled = !isEnabled;
		}
		document.getElementById("useLastTemplate").disabled = !isEnabled;
	} ,	

	showTrialDate: function() {
    let licenseDate = document.getElementById('licenseDate'),
        licenseDateLbl = document.getElementById('licenseDateLabel'),
        txtGracePeriod= SmartTemplates.Util.gracePeriodText(licenseInfo.trialDays);
        
    if (!licenseDateLbl.getAttribute("originalContent")) { // save original label!
      licenseDateLbl.setAttribute("originalContent", licenseDateLbl.textContent);
    }
    licenseDateLbl.textContent = txtGracePeriod;
    licenseDateLbl.classList.add('important');
    licenseDate.classList.remove('valid'); // [issue 170]
    licenseDate.textContent = "";
  },	

  // [issue 170] allow license extension
  // show the extension button if user is elligible
  showExtensionButton: function() {
    if (licenseInfo.status == "Valid") {
      if (licenseInfo.keyType!=2) { // PRO +Domain
        let btnLicense = document.getElementById("btnLicense");
        SmartTemplates.Settings.labelLicenseBtn(btnLicense, "extend");
      } else { // standard function - go to License screen to upgrade!
        SmartTemplates.Util.showLicenseDialog("licenseTab");  
      }
    }
  } ,

	// put appropriate label on the license button and pass back the label text as well
	labelLicenseBtn: function(btnLicense, validStatus) {
		switch(validStatus) {
			case  "extend":
				let txtExtend = SmartTemplates.Util.getBundleString("st.notification.premium.btn.extendLicense");
				btnLicense.setAttribute("collapsed", false);
				btnLicense.textContent = txtExtend; // text should be extend not renew
				btnLicense.setAttribute('tooltiptext',
					SmartTemplates.Util.getBundleString("st.notification.premium.btn.extendLicense.tooltip"));
				return txtExtend;
			case "renew":
				let txtRenew = SmartTemplates.Util.getBundleString("st.notification.premium.btn.renewLicense");
				btnLicense.textContent = txtRenew;
			  return txtRenew;
			case "buy":
				let buyLabel = SmartTemplates.Util.getBundleString("st.notification.premium.btn.getLicense");
				btnLicense.textContent = buyLabel;
			  return buyLabel;
			case "upgrade":
				let upgradeLabel = SmartTemplates.Util.getBundleString("st.notification.premium.btn.upgrade");
				btnLicense.textContent = upgradeLabel;
				btnLicense.classList.add('upgrade'); // stop flashing
			  return upgradeLabel;
		}
		return "";
	} ,
	

  // this function is called on load and from validateLicenseInOptions
  // was decryptLicense
  updateLicenseOptionsUI: async function (silent = false) {
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
        licenseDate            = getElement('licenseDate'),
        licenseDateLabel       = getElement('licenseDateLabel'),
        decryptedMail = licenseInfo.email, 
        decryptedDate = licenseInfo.expiryDate,
				result = licenseInfo.status;
		validationStandard.setAttribute("collapsed", true);
    validationPassed.setAttribute("collapsed", true);
    validationFailed.setAttribute("collapsed", true);
    validationExpired.setAttribute("collapsed", true);
		validationInvalidAddon.setAttribute("collapsed", true);
    validationInvalidEmail.setAttribute("collapsed", true);
    validationEmailNoMatch.setAttribute("collapsed", true);
		validationDate.setAttribute("collapsed", false);
		validationDateSpace.setAttribute("collapsed", false);
    this.enablePremiumConfig(false); //also disables standard features.
    try {
      let niceDate = decryptedDate;
      if (decryptedDate) {
        try { 
          let d = new Date(decryptedDate);
          niceDate =d.toLocaleDateString();
        }
        catch(ex) { niceDate = decryptedDate; }
      }
      switch(result) {
        case "Valid":
					if (licenseInfo.keyType==2) { // standard license
            this.showValidationMessage(validationStandard, silent);
						this.enableStandardConfig(true);
					}
					else {
						this.showValidationMessage(validationPassed, silent);
						this.enablePremiumConfig(true);
					}
          licenseDate.textContent = niceDate;
          licenseDate.classList.add('valid'); // [issue 170]
          licenseDateLabel.textContent = SmartTemplates.Util.getBundleString("label.licenseValid");
          break;
        case "Invalid":
				  validationDate.setAttribute("collapsed", true);
					validationDateSpace.setAttribute("collapsed", true);
				  let addonName = '';
				  switch (licenseInfo.licenseKey.substr(0,2)) {
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
							this.showValidationMessage(validationFailed, silent);
					}
					if (addonName) {
						let txt = validationInvalidAddon.textContent;
						txt = txt.replace('{0}','SmartTemplates').replace('{1}','ST'); // keys for {0} start with {1}
						if (txt.indexOf(addonName) < 0) {
							txt += " " + SmartTemplates.Util.getBundleString("st.licenseValidation.guessAddon").replace('{2}',addonName);
						}
						validationInvalidAddon.textContent = txt;
						this.showValidationMessage(validationInvalidAddon, silent);
					}
          break;
        case "Expired":
          licenseDateLabel.textContent = SmartTemplates.Util.getBundleString("st.licenseValidation.expired");
          licenseDate.textContent = niceDate;
          this.showValidationMessage(validationExpired, false); // always show
          break;
        case "MailNotConfigured":
				  validationDate.setAttribute("collapsed", true);
					validationDateSpace.setAttribute("collapsed", true);
          this.showValidationMessage(validationInvalidEmail, silent);
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
          break;
        case "MailDifferent":
				  validationDate.setAttribute("collapsed", true);
					validationDateSpace.setAttribute("collapsed", true);
          this.showValidationMessage(validationFailed, true);
          this.showValidationMessage(validationEmailNoMatch, silent);
          break;
        case "Empty":
          SmartTemplate4.Settings.showTrialDate();
				  // validationDate.collapsed=true;
					// validationDateSpace.collapsed=true;
          break;
        default:
          window.alert(null,SmartTemplates.Util.ADDON_TITLE,'Unknown license status: ' + result);
          break;
      }
			
			// restore original label.
			if (!validationDate.getAttribute("collapsed")) {
				let licenseDateLbl = getElement('licenseDateLabel'),
				    lTxt = licenseDateLbl.getAttribute("originalContent");
				if (lTxt) {
					licenseDateLbl.textContent = lTxt;
					licenseDateLbl.classList.remove('important');
				}
			}
			
			// show support tab if license is not empty 
			// let isSupportEnabled = (licenseInfo.licenseKey) ? true : false;
			// document.getElementById('supportTab').setAttribute("collapsed",  !(isSupportEnabled));
      
    } catch(ex) {
      SmartTemplates.Util.logException("Error in SmartTemplate4.Settings.updateLicenseOptionsUI():\n", ex);
    }
		return result;
  } ,	

  pasteLicense: async function () {
		// see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#examples
		let finalLicense = "";
		const clipText = await navigator.clipboard.readText();
    if (clipText) {
			let txtBox = document.getElementById('txtLicenseKey');
			txtBox.value = clipText;
			finalLicense = this.trimLicense();
    }
    if (finalLicense) {
      SmartTemplates.Settings.validateNewKey();
    }
  } ,	

  validateLicenseFromEvent: async function() {
    await SmartTemplates.Settings.validateLicenseInOptions(false);
  },
  
  validateLicenseInOptions: async function (silent = false) {
		function replaceCssClass(el,addedClass) {
			try {
				el.classList.add(addedClass);
				if (addedClass!='paid')	el.classList.remove('paid');
				if (addedClass!='expired') el.classList.remove('expired');
				if (addedClass!='free')	el.classList.remove('free');
			} catch(ex) {
				SmartTemplates.Util.logException("replaceCssClass(" + el + "):\n", ex);
			}
		}
    let getElement = document.getElementById.bind(document),
        btnLicense = getElement("btnLicense"),
				proTab = getElement("catLicense"),
				beautyTitle = getElement("SmartTemplate4AboutLogo");
        
    // old call to decryptLicense was here
    // 1 - sanitize License
    // 2 - validate license
    try {      
      // 3 - update options ui with reaction messages; make expiry date visible or hide!; 
      this.updateLicenseOptionsUI(silent);  // async! // was settings.decryptLicense
			switch(licenseInfo.status) {
				case "Valid":
					let today = new Date(),
					    later = new Date(today.setDate(today.getDate()+32)), // pretend it's a month later:
							dateString = later.toISOString().substr(0, 10);
					// if we were a month ahead would this be expired?
					if (licenseInfo.expiryDate < dateString) {
						this.labelLicenseBtn(btnLicense, "extend");
					}
					else {
						if (licenseInfo.keyType==2) { // standard license
							btnLicense.classList.add('upgrade'); // removes "pulsing" animation
							this.labelLicenseBtn(btnLicense, "upgrade");
						}
						else {
							btnLicense.setAttribute("collapsed", true);
						}
					}
					replaceCssClass(proTab, 'paid');
					replaceCssClass(btnLicense, 'paid');
					beautyTitle.classList.remove('aboutLogo');
					beautyTitle.classList.add('aboutLogoPro');
				  break;
				case "Expired":
					this.labelLicenseBtn(btnLicense, "renew");
				  btnLicense.setAttribute("collapsed", false);
					replaceCssClass(proTab, 'expired');
					replaceCssClass(btnLicense, 'expired');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/content/skin/logo-pro.png");
					break;
				default: // no license
					this.labelLicenseBtn(btnLicense, "buy");
				  btnLicense.setAttribute("collapsed", false);
					replaceCssClass(proTab, 'free');
					beautyTitle.setAttribute('src', "chrome://smarttemplate4/content/skin/logo.png");
					beautyTitle.classList.add('aboutLogo');
					beautyTitle.classList.remove('aboutLogoPro');
			}
			SmartTemplates.Util.logDebug('validateLicense - license status = ' + licenseInfo.status);
			// make sure to refresh the file template menus!
			fileTemplates.isModified = true; 
    } catch(ex) {
      SmartTemplates.Util.logException("Error in SmartTemplate4.Settings.validateLicenseInOptions():\n", ex);
    }
  } ,

	setSupportMode: function (elem) {
		const btnSupport = document.getElementById('composeSupportMail');
		// force user to select a topic.
		let topic = elem.value;
		btnSupport.disabled = (topic) ? false : true;
	} ,
	
	sendMail: function (mailto) {
    const subjectTxt = document.getElementById('txtSupportSubject'),
		    	supportType = document.getElementById('supportType').value,
					version = document.getElementById('versionBox').textContent,
		    	subjectline = supportType + " (" + version + ") " + subjectTxt.value,
		    	sURL="mailto:" + mailto + "?subject=" + encodeURI(subjectline);
		logMissingFunction(`sendMail() \n ${sURL}`);
		return;
/*		, // urlencode
		    // make the URI
		let ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
		    aURI = ioService.newURI(sURL, null, null);
		// open new message
		MailServices.compose.OpenComposeWindowWithURI (null, aURI);
*/
	},	

	selectDefaultTemplates: function(el) {
		SmartTemplate4.Preferences.setMyIntPref("defaultTemplateMethod", el.value);
	},	


  dummy: function() {

  }
  
  
  // ============================== Settings Object END  

};  // Settings


/**********
 * UTILITY FUNCTIONS (global scope)
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

const getElement = window.document.getElementById.bind(window.document);

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
          // debugger;
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
			debugger;
			console.error("Unexpected preference element", element);
		}
    
    // Wire up individual event handlers
    element.addEventListener("change", savePref);
    
	}  
}

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

async function showRegistrationDlg(feature) {
	messenger.runtime.sendMessage({ 
    command: "showRegistrationDialog", 
    feature: feature
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
  // activate all write/reply/forward tab listeners.
  for (let button of document.querySelectorAll(".actionTabs button")) {
    button.addEventListener("click", activateTab);
  }

	// add bool preference reactions
	for (let chk of document.querySelectorAll("input[type=checkbox]")) {	
		let dataPref = chk.getAttribute("data-pref-name").replace(SMARTTEMPLATES_EXTPREFIX,"");
		// right-click show details from about:config
		let filterConfig="", readOnly=true, retVal=null;
		// get my bool pref:
		switch (dataPref) {
			case "debug":
				chk.addEventListener("change", (event) => {
					SettingsUI.toggleBoolPreference(chk); // <== QF.Options
				});				
				filterConfig="smartTemplate4.debug"; retVal=false;
				break;
			case "parseSignature":
				filterConfig = "extensions.smartTemplate4.parseSignature"; retVal=false;
				break;
			case "showStatusIcon":
				filterConfig = "extensions.smartTemplate4.showStatusIcon"; retVal=true;
				/*
					oncontextmenu=
						SmartTemplate4.Util.showAboutConfig(this, 'extensions.smartTemplate4.statusIconLabelMode'); 
						SmartTemplate4.updateStatusBar(this.checked);
        */
				break;
		}

		switch(chk.id) {
			case "chkResolveAB":
				chk.addEventListener("click", (event) => {
					SmartTemplates.Settings.resolveAB_onClick(chk);
				});
				break;
			case "chkBackgroundParser":
				chk.addEventListener("click", (event) => {
					alert('The mx parser is experimental\nPlease reload SmartTemplates to effect this change!');
				});
				break;
			case "chkHideExamples":
				// oncommand="SmartTemplate4.Settings.toggleExamples(chk);"
				chk.addEventListener("click", (event) => {
					logMissingFunction("SmartTemplate4.Settings.toggleExamples()");
				});
				break;
			case "chkStatusButton":
				chk.addEventListener("click", (event) => {
					logMissingFunction("SmartTemplate4.updateStatusBar(!chk.checked);");
				});
				break;
		}

		/* RIGHTCLICK HANDLERS */
		if (filterConfig) {
			addConfigEvent(chk,filterConfig);
		}	
	}

	for (let chk of document.querySelectorAll(".settingDisabler")) {	
		chk.addEventListener("change", (event) => {
			SmartTemplates.Settings.disableWithCheckbox(chk); // <== QF.Options
		});			
	}
	
  // radio button handlers
	document.getElementById("useAccountTemplate").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.selectDefaultTemplates(target)");
	});
	document.getElementById("useLastTemplate").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.fileTemplates.selectDefaultTemplates(target)");
	});	
	

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
		SmartTemplates.Util.showStationeryPage("snippets"); // contains an anchor
	});

	// command handlers for licensing
	document.getElementById("btnPasteLicense").addEventListener("click", (event) => {
		SmartTemplates.Settings.pasteLicense();
	});
	document.getElementById("btnValidateLicense").addEventListener("click", (event) => {
		SmartTemplates.Settings.validateNewKey(event.target);
	});
	document.getElementById("btnLicense").addEventListener("click", (event) => {
		// oncommand="
	  //    SmartTemplate4.Util.showLicenseDialog('licenseTab'); 
		//    setTimeout( function() {window.close();}, 500 );"
		showRegistrationDlg("licenseTab"); // do we need to close the settings tab??
	});

	
	// select elements
	document.getElementById("msgIdentity").addEventListener("change", (event) => {
		SmartTemplates.Settings.selectIdentity(event.target.value);
	});
	document.getElementById("iconType").addEventListener("change", (event) => {
		// go through background => legacy code for the UI update at least.
		// avoid passing element itself, change parameter to select.value!
		logMissingFunction("SmartTemplate4.setStatusIconMode(event.target)");
	});
	document.getElementById("fontSmaller").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.Settings.fontSize(-1);");
	});
	document.getElementById("fontLarger").addEventListener("click", (event) => {
		logMissingFunction("SmartTemplate4.Settings.fontSize(+1);");
	});


	// toolbar for the template tools
	document.getElementById("helpTemplates").addEventListener("click", (event) => {
		SmartTemplates.Util.showStationeryPage("templateFiles");
	});
	document.getElementById("btnSaveTemplate").addEventListener("click", (event) => {
		SmartTemplates.Settings.store();
	});
	document.getElementById("btnLoadTemplate").addEventListener("click", (event) => {
		SmartTemplates.Settings.load();
	});

	// document.getElementById("btnAdvanced").addEventListener("click", (event) => {
	// 	logMissingFunction("SmartTemplates.Settings.openAdvanced()");
	// });
	// document.getElementById("btnCloseAdvanced").addEventListener("click", (event) => {
	// 	logMissingFunction("SmartTemplates.Settings.closeAdvanced()");
	// });
	for (let btn of document.querySelectorAll(".youtube")) { 
		let video=null;
		switch(btn.id) {
			case "btnYouTube-accounts":
				video = "list";
				break;
			case "btnYouTube-filetemplates":
				video = "stationery";
				break;
		}
		btn.addEventListener("click", (event) => {
			SmartTemplates.Util.showYouTubePage(video);
		});
	}

	// about page handlers
	for (let btn of document.querySelectorAll(".buttonLinks button")) {	
		btn.addEventListener("click", (event) => {
			// SmartTemplates.Settings.disableWithCheckbox(this)
			switch(btn.id) {
				case "aboutShowSplash":
				case "btnNewsSplash":
					// oncommand=
					//   SmartTemplate4.Util.viewSplashScreen()
					//   setTimeout( function() {window.close();}, 200 );"
					SmartTemplates.Util.viewSplashScreen();
					break;
				case "aboutSupport":
				case "supportPaneSupportLink":
					// oncommand=
					//   SmartTemplate4.Util.showSupportPage(); 
					//   setTimeout( function() {window.close();}, 200 );"
					SmartTemplates.Util.showSupportPage();
					break;
				case "aboutHomePage":
				case "supportPaneHomePage":
					// oncommand=
					//   SmartTemplate4.Util.showHomePage(); 
					//   setTimeout( function() {window.close();}, 200 );
					SmartTemplates.Util.showHomePage();
					break;
				case "aboutIssues": 
				case "supportPaneIssues":
					// oncommand=
					//   SmartTemplate4.Util.showBugsAndFeaturesPage(); 
					//   setTimeout( function() {window.close();}, 200 );
					SmartTemplates.Util.showBugsAndFeaturesPage();
					break;
				case "btnVersionInfo":
					messenger.Utilities.showVersionHistory();
					break;
			}
		});			
	}	

	for (let el of document.querySelectorAll(".plain-link")) {	
		el.addEventListener("click", (event) => {
			switch(el.id) {
				case "lnkShowPremium":
					logMissingFunction("SmartTemplates.Util.showPremiumFeatures()");
					// onclick="SmartTemplate4.Util.showPremiumFeatures();"
					SmartTemplates.Util.showPremiumFeaturesPage();
					break;
			}

		});
	}

	// more checkboxes
	for (let el of document.querySelectorAll(".commonSwitch")) {
		el.addEventListener("change", (event) => {
			SmartTemplates.Settings.showCommonPlaceholder(el.checked);
		});
	}
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

	document.getElementById("closeDisclaimer").addEventListener("click", (event) => {
		event.target.parentElement.remove();
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
	
	// =========== SUPPORT PAGE
	document.getElementById("supportType").addEventListener("change", (event) => {
		// SmartTemplate4.Settings.setSupportMode(this);
		SmartTemplates.Settings.setSupportMode(event.target);
	});		


	document.getElementById("composeSupportMail").addEventListener("click", (event) => {
		const SUPPORT_MAIL = "axel.grude@gmail.com";
		SmartTemplates.Settings.sendMail(SUPPORT_MAIL);
	});	
	
	
	// ==== NEW: PAGES
	for (let li of document.querySelectorAll("#categories li")) {
		li.addEventListener("click",(event) => {
			// 1 - hide other pages
			let activePage = li.getAttribute("page") || null;
			li.setAttribute("selected",true);
			for (let other of document.querySelectorAll("#categories li")) {
				if (other == li) {
					continue;
				}
				let currentActive;
				if (other.getAttribute("selected")) {
					other.removeAttribute("selected");
					currentActive = other.getAttribute("page");
				}
				if (currentActive) {
					document.getElementById(currentActive).classList.remove("pageActive");
				}
			}
			// make page visible
			if (activePage) {
				document.getElementById(activePage).classList.add("pageActive");
				if (activePage == "catVariables") {
					let frame = document.getElementById("helpFrame");
					logMissingFunction("To Do: localize help frame!")
				}
			}
		});
	}

  // replace SmartTemplate4.Util.showAboutConfig command handlers
	addConfigEvent(document.getElementById("identityLabel"), "extensions.smartTemplate4.identities");

	document.getElementById("versionBox").addEventListener("click", (event) => {
		messenger.Utilities.showVersionHistory();
	});

	// load examples...
	document.getElementById("templatesIFrame").src="https://smarttemplates.quickfolders.org/templates.html?nav=none"
	
}

async function onLoad() {
  i18n.updateDocument();
  // this api function can do replacements for us
  //  h1.innerText = messenger.i18n.getMessage('heading-installed', addonName);
// this builds all elements of the dialog
  await SmartTemplates.Settings.onLoad();

	loadPrefs();
	initLicenseInfo();

	// now read data from Preferences
  addUIListeners();

	// [issue 121] currently shown selection
	// special settings (omit selecting an identit from the accounts dropdown)
	const params = new URLSearchParams(window.location.search);
	const mode = params.get("mode");

	switch(mode) {
		case "fileTemplates":
			SmartTemplates.Settings.selectCategoryMenu("catFileTemplates");
			break;
		case "variables":
			SmartTemplates.Settings.selectCategoryMenu("catVariables");
			break;
		case "licenseKey":
			SmartTemplates.Settings.selectCategoryMenu("catLicense");
			let txtLicense = getElement('txtLicenseKey');
			setTimeout(function() {txtLicense.focus();}, 200);
			break;
	}
	SettingsUI.initVersionPanel();

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
