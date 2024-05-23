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
		let CurId = this.fillIdentityListPopup();
    this.logMissingFunction("implement onLoad");
    
  } ,
  onUnload: async function() {
    this.logMissingFunction("implement onUnload");
  } ,


  // ============================== Settings Object END
}

/**********
 * UTILITY FUNCTIONS
 */

async function setPref(key,value) {
  let target = key;
  if (!key.startsWith("extensions.smartTemplate4.")) {
    target = "extensions.smartTemplate4." + key;
  }
  await messenger.LegacyPrefs.setPref(target, value);
}

async function getPref(key) {
  let target = key;
  if (!key.startsWith("extensions.smartTemplate4.")) {
    target = "extensions.smartTemplate4." + key;
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

// add UI event listeners
function addUIListeners() {
  // activate all tab listeners.
  for (let button of document.querySelectorAll(".actionTabs button")) {
    button.addEventListener("click", activateTab);
  }
  

}

async function onLoad() {
  debugger;
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
