
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

/*
	globals
		SmartTemplates: readonly,
    formatAll: readonly,
    ariaPoliteUpdate: readonly,
*/

// we can only do this if we load this file itself as a module.
// import {Preferences} from "../scripts/st-prefs.mjs.js"; 
// debugger;
// listbox.getItemAtIndex() ==> listbox.item()

// -------------------------------------------------------
// TO DO - REIMPLEMENT THE FOLLOWING FUNCTIONS:
//     -    SmartTemplates.Settings.selectDefaultTemplates
//  FILE TEMPLATES!
//  Editing / Managing (Account) Templates
//     -    insertAtCaret()
//     -    onCodeWord() receiver for events from help.xhtml
//     -    getHeaderArgument()
//     -    cleanupUnusedPrefs() - extend LegacyPrefs to remove branches!
//  UI
//     -    fontSize()
//     -		resolveAB_onClick()
//     -    disable support menu if no license ??? search "supportTab"
//     -    toggleExamples() + loadTemplatesFrame() to hide examples tab
//     Account json save / load
//     -		fileAccountSettings()  
//   check currentAccountName  !!! should probably not use .label
// -------------------------------------------------------

var licenseInfo;

import { SettingsUI } from "./st-settings-ui.mjs";
import { logMissingFunction } from "./st-log.mjs";

// use a global variable, similar to background script.
var fileTemplates = {
  Entries: {
    templatesNew: [],
    templatesRsp: [],
    templatesFwd: [],
    snippets: [],
  },
  isModified: false, // global flag to trigger saving to back end at some stage (WIP)

  get rawEntries() {
    // Function to remove all _sortId members - these are not necessary for the UI / storage
    let entries = this.Entries;
    const sanitized = {};
    for (const key in entries) {
      if (Array.isArray(entries[key])) {
        sanitized[key] = entries[key].map(({ _sortId, ...rest }) => ({ ...rest }));
      } else {
        // preserve any non-array properties (metadata, settings, etc.)
        sanitized[key] = entries[key];
      }
    }
    return sanitized;
  },

  get activeFileList() {
    //  was ListBox()
    const container = document.querySelector("#fileTemplateContainer section.active");
    if (!container) {
      return null;
    }
    const select = container.querySelector(".fileTemplateList");
    return select;
  },

  get CurrentEntries() {
    try {
      const activeSection = document.querySelector("#fileTemplateContainer section.active");
      switch (activeSection.id) {
        case "new-fileTemplates":
          return this.Entries.templatesNew;
        case "rsp-fileTemplates":
          return this.Entries.templatesRsp;
        case "fwd-fileTemplates":
          return this.Entries.templatesFwd;
        case "snippets-fileTemplates":
          return this.Entries.snippets;
      }
    } catch { ; }
    return [];
  },

  // delete list (only of currently selected flavor)
  clearList: function (onlyUI) {
    if (!onlyUI) {
      SmartTemplates.Settings.logDebug("clearList() - empty templateFile list");
      let entries = this.CurrentEntries;
      if (entries) {
        while (entries.length) {
          entries.pop();
        }
      }
    }
    SmartTemplates.Settings.logDebug("clearList() - empty listbox");
    let theList = this.activeFileList;
    if (theList) {
      while (theList.lastElementChild) {
        theList.removeChild(theList.lastElementChild);
      }
    }
  },

  // repopulates richlistbox and rebuilds menu!
  repopulate: function (isRichList, startIndex = 0) {
    // richlistbox
    if (isRichList) {
			if (startIndex <= 0) {
				this.clearList(true);
			} else { 
				// only remove trailing items for performance
				const select = this.activeFileList;
        for (let o = select.options.length - 1; o >= startIndex; o--) {
          select.remove(o);
        }
			}
      for (let i = startIndex; i < this.CurrentEntries.length; i++) {
        let entry = this.CurrentEntries[i],
          cat = entry.category || "";
        this.addItem(entry.path, fileTemplates.makeLabel(entry), cat, null, i, entry._sortId);
        // populate the Entries array; fallback to browser bookmark type if undefined
      }
    }
  },



  onSelect: async function (select) {
    SmartTemplates.Settings.logDebug("onSelect", select);
    let listItem = select.selectedOptions[0]; // can be multiple items
    if (listItem) {
      let p,
        c = "",
        v = listItem.value;
      try {
        v = JSON.parse(listItem.value);
        p = v.path;
        c = v.category || "";
      } catch {
        p = v;
      }
      document.getElementById("txtTemplatePath").value = p;
      document.getElementById("txtTemplateCategory").value = c;
      document.getElementById("txtTemplateTitle").value = fileTemplates.sanitizeLabel(
        listItem.label,
        c
      );
    }
  },

  // was SmartTemplate4.fileTemplates.update()
  updateEntry: async function (isNew = false, entry) {
    const getData = (id, e) => {
      if (e) {
        return e;
      }
      return document.getElementById(id).value;
    }

    const path = getData("txtTemplatePath", entry?.path),
      label = getData("txtTemplateTitle", entry?.label),
      category = getData("txtTemplateCategory", entry?.category);

    if (!path.trim() && !entry) {
      alert(SmartTemplates.Util.getBundleString("st.fileTemplates.wrnEnterPath"));
      const pickRow = document.querySelector(".templateFilePicker");
      pickRow.classList.add("highlight");
      return;
    }

    if (!label.trim() && !entry) {
      alert(SmartTemplates.Util.getBundleString("st.fileTemplates.wrnEnterTitle"));
      return;
    }

    let existingEntry,
      selectedIndex,
      targetIndex = 0;
    if (!isNew) {
      // update case
      selectedIndex = this.activeFileList.selectedIndex;
      if (selectedIndex < 0) {
        alert(SmartTemplates.Util.getBundleString("st.fileTemplates.wrnSelectUpdateItem"));
        return;
      }
      existingEntry = this.CurrentEntries[selectedIndex];
      existingEntry.path = path;
      existingEntry.label = label;
      existingEntry.category = category || "";
    }

    if (isNew) {
      if (this.activeFileList?.selectedOptions.length || entry) {
        targetIndex = this.activeFileList.selectedIndex + 1;
      } else {
        targetIndex = this.CurrentEntries.length;
      }
      if (entry) {
        // { __sortId, category, label, path }
        // if item exists, remove it first and then append the new version:
        if (!isNaN(entry._sortId)) {
          targetIndex = entry._sortId;
        }
      }
    }

    if (!existingEntry) {
      let entry = {
        path: path,
        label: label,
        category: category,
        _sortId: targetIndex >= 0 ? targetIndex + 1 : this.CurrentEntries.length + 1,
      };
      this.addItem(
        path,
        fileTemplates.makeLabel(entry),
        category,
        this.activeFileList,
        targetIndex,
        entry._sortId
      );
      if (targetIndex == null || targetIndex < 0) {
        // append at end
        this.CurrentEntries.push(entry);
      } else {
        // insert new item at position!
        this.CurrentEntries.splice(targetIndex, 0, entry);
      }

      // reindex _sortId for all entries
      this.CurrentEntries.forEach((e, i) => {
        e._sortId = i + 1;
      });
      fileTemplates.repopulate(true, targetIndex);
      this.activeFileList.selectedIndex = targetIndex;
    } else {
      // update existing item (label)
      SmartTemplates.Settings.logDebug(
        `Updating existing item: ${existingEntry.label} [${existingEntry.path} , ${existingEntry.category} ]`
      );
      // this.activeFileList.ensureIndexIsVisible(targetIndex);
      this.CurrentEntries[selectedIndex].label = label;
      this.activeFileList.item(selectedIndex).label = fileTemplates.makeLabel(
        this.CurrentEntries[selectedIndex]
      );
      // update path!
      this.activeFileList.item(selectedIndex).value = JSON.stringify({
        path: path,
        category: category,
        position: selectedIndex,
      });
    }
    // update backend
    messenger.Utilities.updateTemplates(fileTemplates.rawEntries);
  },
  addEntry: async function () {
    this.updateEntry(true);
  },
  importEntry: async function(entry) {
    // entry = { __sortId, category, label, path }
    const entries = fileTemplates.CurrentEntries;
    const position =
      Number.isInteger(entry?._sortId) ? (entry._sortId-1) : null;

    // find existing entry
    const existingIndex = entries.findIndex(
      e => e.category === entry.category && e.label === entry.label
    );      
    // remove existing entry first
    if (existingIndex !== -1) {
      entries.splice(existingIndex, 1);
    }
    // must be same path within the same compose type array:
    const existingFileIndex = entries.findIndex(
      (e) => e.path === entry.path,
    );
    if (existingFileIndex !== -1) {
      entries.splice(existingFileIndex, 1);
    }    

    // insert new entry
    if (position === null || position >= entries.length) {
      entries.push(entry);
    } else {
      entries.splice(position, 0, entry);
    }
  },
  removeEntry: async function () {
    let currentPos = fileTemplates.activeFileList.selectedIndex;
    if (currentPos < 0) {
      return;
    }
    fileTemplates.CurrentEntries.splice(currentPos, 1);
    fileTemplates.activeFileList.remove(currentPos);

    // renumber _sortId starting from 1
    fileTemplates.CurrentEntries.forEach((entry, i) => {
      entry._sortId = i + 1;
    });

    // update backend
    messenger.Utilities.updateTemplates(fileTemplates.Entries);
    // refresh list on screen (starting from deleted position)
    fileTemplates.repopulate(true, currentPos);

    // restore selection
    const newIndex = Math.min(currentPos, fileTemplates.CurrentEntries.length - 1);
    fileTemplates.activeFileList.selectedIndex = newIndex;
  },
  moveEntryUp: async function () {
    let currentPos = fileTemplates.activeFileList.selectedIndex;
    if (currentPos <= 0) {
      return;
    }
    // move the item in the datastructure:
    array_move(fileTemplates.CurrentEntries, currentPos, currentPos - 1);
    // update backend
    messenger.Utilities.updateTemplates(fileTemplates.Entries);
    // refresh list on screen:
    fileTemplates.repopulate(true);
    this.activeFileList.selectedIndex = currentPos - 1;
  },
  moveEntryDown: async function () {
    let currentPos = fileTemplates.activeFileList.selectedIndex;
    if (currentPos < 0) {
      return;
    }
    if (currentPos + 1 >= fileTemplates.activeFileList.length) {
      return;
    }
    // move the item in the datastructure:
    array_move(fileTemplates.CurrentEntries, currentPos, currentPos + 1);
    // update backend
    messenger.Utilities.updateTemplates(fileTemplates.Entries);
    // refresh list on screen:
    fileTemplates.repopulate(true);
    this.activeFileList.selectedIndex = currentPos + 1;
  },
  editEntry: async function () {
    if (this.activeFileList.selectedIndex < 0) {
      return;
    }
    const item = fileTemplates.CurrentEntries[this.activeFileList.selectedIndex];
    messenger.Utilities.editTemplateExternal(item);
  },
  openFilePicker: async function () {
    let result = await messenger.Utilities.openFileExternal({
      path: "",
      filter: "*.html;*.css",
    });
    console.log("Returned file info", result);
    if (result.path) {
      const pickRow = document.querySelector(".templateFilePicker");
      pickRow.classList.remove("highlight");
      document.getElementById("txtTemplatePath").value = result.path;
      document.getElementById("txtTemplateTitle").value = result.name;
    }
  },
  importTemplates: async function() {
    let result = await messenger.Utilities.openTemplateList({
      path: "",
      filter: "*.json",
      direction: "import",
      composeTypeFilter: SmartTemplates.Settings.currentListType,
    });

    // composeTypeFilter = use "" or "all" for the complete file?
    if (!result.path) {
      return;
    }
    fileTemplates.activeFileList.selectedIndex = -1;
    document.getElementById("txtTemplateTitle").value = "";
    document.getElementById("txtTemplatePath").value = "";
    document.getElementById("txtTemplateCategory").value = "";

    // this one should return a list of templates:
    // - html files that have invalid file path (we could use this to highlight invalid entries with red color etc)
    // - html files that overwrite existing items?
    // - new html files
    // or we could look at all local data and verify it "file for file" through a call to the experimental API?
    // messenger.Utilities.stageImportTemplates(result.path);
    if (!result.data) {
      return; // do nothing
    }
    console.log(`import ${result.data.length} entries...`);
    for (const entry of result.data) {
      console.log(entry);
      // entry = { __sortId, category, label, path }
      fileTemplates.importEntry(entry);
    }
    fileTemplates.CurrentEntries.forEach ((el,idx) => el._sortId = idx+1);
    // filter out _sortId (for any other metada we need to add this to the rawEntries getter)
    messenger.Utilities.updateTemplates(fileTemplates.rawEntries);

    fileTemplates.repopulate(true, 0);
    
  },
  dropFiles: function (event) {
    if (event.dataTransfer.files.length == 0) {
      return false;
    }
    const option = event.target,
      target = JSON.parse(option.value);

    logMissingFunction("fileTemplates.dropFiles");
    console.log(event.dataTransfer.files);
    console.log(`target[${target.position}]:\npath=${target.path}\nvategory=${target.category}`);
    // we cannot determine the path, but we could send a message to the backgrouound page tp:
    // - look for the file in the last location (or a root folder for templates)
    // - when a file of matching name is found:
    //   > display the file open dialog and prepopulate it with path and file name!
    alert(
      "Sorry, at the moment dropping files is not supported - as we are not allowed to see the folder location from a web extension. We will find a workaround in the future!"
    );
    return true;
  },
  onDragOver: function (event) {
    event.preventDefault();
    return false;
  },
  onDragEnter: function (event) {
    let dataString = event.dataTransfer.getData("text/plain");
    if (!dataString) {
      return;
    }
    const data = JSON.parse(dataString);
    const option = event.target;
    const targetSortId = option.dataset.sortId; // read _sortId from attribute

    const arr = fileTemplates.CurrentEntries;

    const sourceIndex = arr.findIndex((e) => e._sortId == data.sortId);
    const targetIndex = arr.findIndex((e) => e._sortId == targetSortId);

    if (sourceIndex < targetIndex) {
      // drag below target!
      this.classList.add("overBottom");
      SmartTemplates.Settings.logDebug(
        `drag below ${this.label}: source=${sourceIndex}  target=${targetIndex}`,
        data
      );
    } else {
      // drag above target
      this.classList.add("overTop");
      SmartTemplates.Settings.logDebug(
        `drag above ${this.label}: source=${sourceIndex}  target=${targetIndex}`,
        data
      );
    }
  },
  onDragLeave: function (_event) {
    this.classList.remove("overTop");
    this.classList.remove("overBottom");
  },
  onDragStart: function (event) {
    // this => points to event element
    this.style.opacity = "0.4";
    event.dataTransfer.effectAllowed = "move";
    const optionData = JSON.parse(this.value);
    // event.dataTransfer.setData("text/plain", this.value); // instead of transfering the plain json, add sortId!
    // transfer _sortId instead of position
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        sortId: this.getAttribute("data-sort-id") || null,
        path: optionData.path,
        category: optionData.category,
      })
    );
  },
  onDrop: async function (event) {
    let dataString = event.dataTransfer.getData("text/plain");
    if (!dataString && event.dataTransfer.files) {
      if (fileTemplates.dropFiles(event)) {
        return false;
      }
    }
    if (!dataString) {
      return false;
    } // could not read
    const data = JSON.parse(dataString);
    const option = event.target;
    option.classList.remove("overTop");
    option.classList.remove("overBottom");

    const target = JSON.parse(option.value);

    const arr = fileTemplates.CurrentEntries;
    const sourceIndex = arr.findIndex((e) => e._sortId == data.sortId);
    const targetSortId = option.dataset.sortId;
    const targetIndex = arr.findIndex((e) => e._sortId == targetSortId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return false;
    }
    if (await SmartTemplates.Preferences .isDebug()) {
      console.log(`dropped[${sourceIndex}]:\npath=${data.path}\ncategory=${data.category} `);
      console.log(`target[${targetIndex}]:\npath=${target.path}\ncategory=${target.category}`);
    }
    // move the item in the datastructure:
    array_move(fileTemplates.CurrentEntries, sourceIndex, targetIndex);
    // update backend
    messenger.Utilities.updateTemplates(fileTemplates.rawEntries);
    // refresh list on screen:
    fileTemplates.repopulate(true);
    this.activeFileList.selectedIndex = targetIndex;
    return true;
  },
  onDragEnd: function (event, option) {
    if (!option.parentElement) {
      return;
    }
    option.style.opacity = "1";
    const pId = `#${option.parentElement.id} option`;
    const items = document.querySelectorAll(pId);
    items.forEach((item) => {
      item.classList.remove("overTop");
      item.classList.remove("overBottom");
    });
  },

  // adds an item to currently visible list
  addItem: function (path, label, cat, sel, pos, sortId) {
    const select = sel || this.activeFileList;
    if (!select) {
      return false;
    }
    if (!cat) {
      cat = "";
    }
    const option = document.createElement("option");
    option.value = JSON.stringify({ path: path, category: cat, position: pos });
    option.text = label;
    option.setAttribute("draggable", true);

    if (sortId !== undefined) {
      option.setAttribute("data-sort-id", sortId);
    }
    option.addEventListener("drop", async (event) => {
      event.stopPropagation();
      event.preventDefault();
      fileTemplates.onDrop(event);
    });
    option.addEventListener("dragstart", fileTemplates.onDragStart);
    option.addEventListener("dragover", fileTemplates.onDragOver);
    option.addEventListener("dragenter", fileTemplates.onDragEnter);
    option.addEventListener("dragleave", fileTemplates.onDragLeave);
    option.addEventListener("dragend", (event) => {
      fileTemplates.onDragEnd(event, option);
    });

		let newIndex = -1;
		if (pos != null && pos >= 0 && pos < select.options.length) {
			select.add(option, select.options[pos]); // insert at position
			newIndex = pos;
		} else {
			select.add(option); // fallback: append
			newIndex = select.options.length - 1;
		}		
    // make sure new item is selected and visible
    select.selectedIndex = newIndex;
    // select.ensureIndexIsVisible(newIndex);
  },

  fillEntries: function (Entries, T, selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
      console.log(`fillEntries fails - can't find select input ${selectId}`);
      return false;
    }
    if (!Entries) {
      console.log("missing Entries param");
      return false;
    }
    while (T.length) {
      T.pop();
    }
    for (let i = select.options.length - 1; i >= 0; i--) {
      select.remove(i);
    }
    for (let i = 0; i < Entries.length; i++) {
      let entry = Entries[i],
        c = entry.category || "";

      if (entry._sortId === undefined) {
        entry._sortId = i + 1; // sequential numeric index
      }

      // populate the options list(s)
      let theLabel = this.makeLabel(entry);
      this.addItem(entry.path, theLabel, c, select, i, entry._sortId);
      // populate the Entries array from read data
      T.push({
        path: entry.path,
        label: entry.label,
        category: entry.category || "",
        _sortId: entry._sortId,
      });
    }
  },

  makeLabel: function (entry) {
    let cat = entry.category || "";
    // use right pointing guillemet (left-pointing double angle quotation mark) as delimiter
    let retval = cat ? cat + " » " + entry?.label : entry?.label;
    return retval;
  },

  sanitizeLabel: function (lbl, c) {
    if (!c) {
      return lbl;
    }
    return lbl.replace(c + " » ", "");
  },

  loadCustomMenu: async function () {
    // replaces setting.js onLoad {
    // 	SmartTemplate4.fileTemplates.loadCustomMenu(true);
    // }
    // moved SmartTemplate4.fileTemplates.readStringFile() to experiment
    // This reads the menus directly from File!
    let data = await messenger.Utilities.readTemplateMenus();
    SmartTemplates.Settings.logDebug("after reading smartTemplates.json:", data);
    this.fillEntries(data.templatesNew, fileTemplates.Entries.templatesNew, "templateList_new");
    this.fillEntries(data.templatesRsp, fileTemplates.Entries.templatesRsp, "templateList_rsp");
    this.fillEntries(data.templatesFwd, fileTemplates.Entries.templatesFwd, "templateList_fwd");
    this.fillEntries(data.snippets, fileTemplates.Entries.snippets, "templateList_snippets");
  },

  // save to file
  saveCustomMenu: async function () {
    logMissingFunction("saveCustomMenu");
  },
}; // copy of recent and configured file templates from SmartTemplate4.fileTemplates

async function initLicenseInfo() {
  licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  document.getElementById("txtLicenseKey").value = licenseInfo.licenseKey;
  
  if (licenseInfo.licenseKey) {
		await SmartTemplates.Settings.validateLicenseInOptions(true);
  }
  
  // add an event listener for changes:
  // window.addEventListener("QuickFolders.BackgroundUpdate", validateLicenseInOptions);
  
  messenger.runtime.onMessage.addListener (
    (data, _sender) => {
      if (data.msg=="updatedLicense") {
        licenseInfo = data.licenseInfo;
        SmartTemplates.Settings.updateLicenseOptionsUI(false); // we may have to switch off silent if we cause this
        // configureBuyButton();
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
		if (!await this.isDebug()){
			return false;
		}
		try {
			return await this.getMyBoolPref("debug." + option);
		} catch {
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
    } catch(ex) {
      console.log("%cCould not find string pref: " + p, "color:red;", ex.message);
    }
		return prefString;
	},  
	setStringPref: async function (p, v) {
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
		} catch {
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
        if (v==null) {v = defaultValue;}
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
      if (!isActive) {return false;} // defaults to empty string
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
      if (!pref) {
        // draft etc.
        return "";
      } 
      // extensions.smarttemplate.id8.def means account id8 uses common values.
      if (await this.getWithBranch(idkey + ".def", true)) {
        // "extensions.smartTemplate4." + "id12.def"
        // common preference - test with .common!!!!
        return await this.getWithBranch("common." + pref, def);
      } else {
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
	__currentComposeType: "",

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
  
  get currentAccountLabel() {
    let theMenu = document.getElementById("msgIdentity"),
        menuEntry = theMenu.selectedOptions[0].label,
        end = menuEntry.indexOf(' <');
    if (end>0) {
      return menuEntry.substring(0, end);
		}
		return menuEntry;
  },

  get currentListType() {
    const currentTab = document.querySelector(
      "#fileTemplatesTabs .actionTabs ul li button.active",
    );
    if (currentTab) {
      return currentTab.getAttribute("composeType");
    }
    return "";
  },

	get currentComposeType() {
		return this.__currentComposeType;
	},

	set currentComposeType(t) {
		this.__currentComposeType = t;
	},
  

  logDebug: async function (...args) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (await SmartTemplates.Preferences .isDebug()) {
      this.logToConsole(...args);
    }
	},
  // first argument is the option tag
  logWithOption: function(...args) {
    arguments[0] =  "SmartTemplates "
      +  '{' + arguments[0].toUpperCase() + '} ' 
			// + Util.logTime()
      + "\n";
    console.log(...args);
  },  	
	logDebugOptional: async function (optionString, ...rest) {
    optionString = arguments[0];
    let options = optionString.split(','); // allow multiple switches
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (await SmartTemplates.Preferences.isDebugOption(option)) {
        this.logWithOption(...rest);
        break; // only log once, in case multiple log switches are on
      }
    }
	},
	logToConsole: function (...args) {
    let msg = "SmartTemplates Settings\n";
    console.log(msg, ...args);
  },
	logException: function(aMessage, ex) {
		const srcName = ex.fileName ? ex.fileName : "";
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
	// @arg[1] = account id ("", ".id1", ".id2" etc..)
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
		const deck = document.getElementById(id + accountId);
		if (!deck) {return;}

		deck.selectedIndex = isCommon ? 1 : 0; 

		const tabbox = deck.querySelector(".tabbox");
		const placeholder = deck.querySelector(".placeholder");
		const checkbox = document.getElementById(`use_default.${accountId}`);
		const description = document.getElementById(`commonPlaceholder.${accountId}`);

		// common deck
		if (isCommon) {
      tabbox.classList.remove("deck-selected");
      placeholder.classList.add("deck-selected");
      // Ensure screen reader reads the description
      if (checkbox && description) {
        checkbox.setAttribute("aria-describedby", `commonPlaceholder.${accountId}`);
        description.removeAttribute("aria-hidden");
      }
			return;
    } 

		// identity decks 
		tabbox.classList.add("deck-selected");
		placeholder.classList.remove("deck-selected");

		// Hide from screen reader
		if (checkbox && description) {
			checkbox.removeAttribute("aria-describedby");
			description.setAttribute("aria-hidden", "true");
		}
		
	} ,  

	// Return checkbox is checked or not
	//--------------------------------------------------------------------
	isChecked : function(elId) {
    let com = elId.indexOf(".common");
    if (com > 0) {
      // cut off .common
      elId = elId.substring(0, com);
    } 
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
			return;
		} 

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
	},  

	// Delete unused preferences.
	//--------------------------------------------------------------------
	cleanupUnusedPrefs : function() {
    logMissingFunction("cleanupUnusedPrefs ()");
    return;
		// const util = SmartTemplate4.Util;
		// let array = this.prefService.getChildList("extensions.smartTemplate4.", {});

		// // AG new: preserve common and global settings!
		// for (let i in array) {
		// 	let branch = array[i];
		// 	if (document.getElementsByAttribute("name", branch).length === 0
		// 	    &&
		// 	    branch.indexOf("smartTemplate4.id") > 0 )  // AG from now on, we only delete the account specific settings "smartTemplate4.id<N>"
		// 	{
		// 		util.logDebug('deleting preference branch: ' + branch + ' …'); // ++++++ RAUS LOESCHEN
		// 		this.prefService.deleteBranch(branch);
		// 	}
		// }
	} ,  

	//******************************************************************************
	// Preferences library
	//******************************************************************************
	
	// Create preferences branch for new account
	//--------------------------------------------------------------------
	setPref1st : async function (prefbranch) {
    async function testPref(key, defaultValue) {
			const dummy="****N/A(this is an impossible test result to check existence of user default)***"
      const targetKey =  prefbranch + key;
      try {
				const testResult = await getPref(targetKey, dummy);
				if (testResult == dummy) {
					await createPref(targetKey, defaultValue);
				}
      } catch {
				// eslint-disable-next-line no-debugger
				debugger; // there is no default config setting... create one!
				// [issue ]
        await createPref(targetKey,defaultValue);
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
		return el;
	} ,

  patchAbout: function() {
		/* create note on external pages with a link to translation services */
		const message = browser.i18n.getMessage("urls.linkDescription"),
		  // Use a regular expression to capture the part of the string that needs to be a link
		  linkLabelPattern = /{{linkStart}}(.*?){{linkEnd}}/,
		  match = message.match(linkLabelPattern);
		if (!match) {
			return;
		}
		
		const linkLabel = match[1]; // The text between the {{linkStart}} and {{linkEnd}}

		// Find the positions for before and after the link
		const linkStartIndex = message.indexOf(match[0]),
		  linkEndIndex = linkStartIndex + match[0].length;

		// Create a reference to the note element
		const noteElement = document.getElementById("externalPagesNote");
		if (noteElement) {
			// Clear the children of the note element (avoid innerHTML)
			noteElement.textContent = ""; // Clear existing content

			// Create the text nodes for the parts before and after the link
			const beforeText = message.slice(0, linkStartIndex),
			  afterText = message.slice(linkEndIndex),
			  userLocale = browser.i18n.getUILanguage(),
			  translateUrl = `https://translate.google.com/?sl=en&tl=${userLocale.split('-')[0]}&op=websites`;

			// Create the <a> tag for the link
			const link = document.createElement("a");
			link.href = translateUrl;
			link.target = "_blank";
			link.textContent = linkLabel;

			// Append everything to the note element
			noteElement.appendChild(document.createTextNode(beforeText)); // Before link
			noteElement.appendChild(link); // The link itself
			noteElement.appendChild(document.createTextNode(afterText)); // After link
		}	
	} ,

  onLoad: async function() {
    // let isAdvancedPanelOpen = getPref('expandSettings'); // may be obsolete?
    let composeType = null;
    this.logDebug("onLoad() …");
		// Check and set common preference
		await this.setPref1st("extensions.smartTemplate4.common.");
		await this.disableWithCheckbox();

		// Set account popup, duplicate DeckB to make account isntances
		// let CurId = 
		await this.fillIdentityListPopup();

		// get inn params from querystring
		const params = new URLSearchParams(window.location.search);
		const CurId = params.get("id");
		composeType = params.get("composeType");

		await this.switchIdentity(CurId || 'common', composeType);
		this.patchAbout();

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
		
		await fileTemplates.loadCustomMenu(true);
  } ,
  onUnload: async function() {
    logMissingFunction("implement onUnload!");
  } ,


	// Setup cloned nodes and replace preferences strings
	// Tb >= 63 add new Preferences handler
	//--------------------------------------------------------------------
	prefCloneAndSetup : function (el, branch) {
		this.logDebug("prefCloneAndSetup(" + el + ", " + branch + ")");
		// was called replaceAttr
		// AG added .common to the preference names to make it easier to add and manipulate global/debug settings
		function replacePrefName(_el,  key) { // replace "preference" attribute with "data-pref-name"
			try {
				if (_el.hasAttribute("data-pref-name")) {
					let _attr = _el.getAttribute("data-pref-name");
          _el.setAttribute("data-pref-name", _attr.replace(".common", key));
				}
			} catch {;}
		}

		// was called appendAttr; this will append the key id to the setting.
		// Note this does not include the .common part
		function replaceAttribute(_el, _attrname, _key) {
			try {
				if (_el.hasAttribute(_attrname)) {
					_el.setAttribute(_attrname, _el.getAttribute(_attrname) + _key);
				}
			} catch {;}
		}

		let deps = 0; 
		// iterate cloned deck.
		// note: this would be easier to rewrite & understand using recursion
		const ELEMENT_NODE = 1; // TEXT_NODE = 3;
		while (el) {
			// Set id, name, prefname
			if (el.nodeType == ELEMENT_NODE) {
				replaceAttribute(el, "id", branch);
				replacePrefName(el, branch); 
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
			let commonExplainer = clone.querySelector("#commonSettingsExplainer");
			if (commonExplainer) {
				commonExplainer.remove();
			}
			
			// collapse clone for now.
			clone.classList.remove("deck-selected");

			this.prefCloneAndSetup(clone, branch);
			el.parentNode.appendChild(clone);

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

	// remove a deck (for refreshing the dropdown!)
	// id = {common, id1, id2 ...}
	removeIdentity: async function(id) {
		const idSelector = `.${id}`;
		const deck = document.getElementById(`deckA.per_account${idSelector}`);
		if (deck) {
			deck.remove();
		}
	},
	// updates the identities dropwdown...
	refreshIdentities: async function() {
		// remember currently selected identity 
		const currentId = this.currentId;
		//  async iteration!
		for await (const option of document.querySelectorAll('#msgIdentity option')) {
			const id = option.value;
			if ("common" == id) {
				// keep common!
				continue;
			} 
			await this.removeIdentity(id);
			document.getElementById("msgIdentity").removeChild(option);
		}
		
		await this.fillIdentityListPopup(currentId, false);
		await loadPrefs("#account_deckA");  // reinitialise all decks from data store
		// add event listeners to the tabs
		for (let button of document.querySelectorAll(".accountDeck:not(:first-child) .actionTabs button")) {
			button.addEventListener("click", activateTabEvent);
		}
		for (let el of document.querySelectorAll(".accountDeck:not(:first-child) .commonSwitch")) {
			el.removeAttribute("disabled");
			// Ensure correct initial state +GPT!!
			// SmartTemplates.Settings.showCommonPlaceholder(el.checked, el.dataset.accountId);	
			el.addEventListener("change", (_event) => {
				SmartTemplates.Settings.showCommonPlaceholder(el.checked);
			});
		}

		await this.switchIdentity(currentId || 'common', this.currentComposeType);
	} ,
  // Fill identities menu
	// this also clones the deck as many times as there are identities in order to fill in 
	// the specific templates [see addIdentity()]
	fillIdentityListPopup: async function(CurId = null, isInitial = true) {
  	// this.logDebug("***fillIdentityListPopup");
    const accounts = await messenger.accounts.list(false);
		let currentId = 0;
		const theMenu = document.getElementById("msgIdentity"),
		    	iAccounts = accounts.length;
				
		const useCommonPlaceHolder = document.getElementById("commonPlaceholder"),
		      useCommonCmd = SmartTemplates.Util.getBundleString("common.use");
		useCommonPlaceHolder.textContent = SmartTemplates.Util.getBundleString("common.use.title", useCommonCmd);

		const common = document.getElementById("deckA.per_account");
		const common1st = common.querySelector(".commonContainer label");
		if (!isInitial) {
			common1st.style.display=""; // reset if we re-fill the accounts dropdown, so that clones are visible!
		}

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
				// let's allow for owl and "extension:*" once that is implemented!
				if (!account.type || account.type=="local") {
        	continue;
				}
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

		if (!CurId) { //  [issue 290]
			common.classList.add("deck-selected"); 
		}		

    // we only refresh the dropdown contents, early exit
		// if (!isInitial) { return (CurId) ? CurId.key : null; } 

		// hide use common checkbox on first account, and add explanation
		common1st.style.display="none";
		if (isInitial) {
			const commonContainer = common.querySelector(".commonContainer");
			const commonExplainer = document.createElement("label");
			commonExplainer.id = "commonSettingsExplainer";
			commonExplainer.textContent = 
				SmartTemplates.Util.getBundleString("common.use.tip", SmartTemplates.Util.getBundleString("common.use"));
			commonContainer.appendChild(commonExplainer);
		}
		
		return (CurId) ? CurId.key : null;
	},


	// Switch Identity (from account setting window)	
	//--------------------------------------------------------------------
	switchIdentity : async function(idKey, composeType)	{
		let wasSwitched = false;
    composeType = composeType || null;
 		// remember so we can set it when switching identities		
		SmartTemplates.Settings.currentComposeType = composeType;
		this.logDebug("switchIdentity(" + idKey + ")");
		document.getElementById("msgIdentity").value = idKey;
		await this.selectIdentity(idKey);
		wasSwitched = true;

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
	selectIdentity : async function (idkey, fromClickEvent = false)	{
		await this.logDebugOptional("identities", "selectIdentity(" + idkey +  ")");

		let currentDeck = this.getCurrentDeck(this.accountId),
		    tabbox = document.getElementById(currentDeck);
		if (!tabbox) {
			alert("A problem has occured\nCannot find account settings for deck: " + currentDeck); // this shouldn't happen, ever!
		}
		let tabIndex = tabbox.getAttribute("selectedIndex"); 
		if (tabIndex<0) {tabIndex=0;}

		const branch = (idkey == "common") ? ".common" : "." + idkey;

		// Display identity.
		let idx = 0,
				found = false,
				justSelected;
		const deck = document.getElementById("account_deckA"),
		    	searchDeckName = ("deckA.per_account" + branch).replace(".common","");
		    

		for (let el of document.querySelectorAll("#account_deckA .accountDeck")) {
			if (el.id == searchDeckName) {
				justSelected = el; 
				deck.selectedIndex = idx;
				found = true;
			} else {
				el.classList.remove("deck-selected");
			}
			idx++;
		}
		
		if (found) {
			justSelected.classList.add("deck-selected");
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
      let txtDump = '';
      const tabboxArray = tabbox.getElementsByTagName('textarea'); // changed from textbox
      for (let i=0; i<tabboxArray.length; i++) {
        txtDump += tabboxArray[i].value;  // append all texts
			}
      // disable / enable Save button in case template is empty
			try {
				let disableSave = (this.currentId!="common") && (txtDump.length===0) && (chkUseCommon.checked === true);
				if (disableSave) {
					document.getElementById('btnSaveTemplate').setAttribute("disabled", true);	
				} else {
					document.getElementById('btnSaveTemplate').removeAttribute("disabled");
				}
			}
			catch {;}
    }
		// select composeCase!
		if (fromClickEvent && SmartTemplates.Settings.currentComposeType) {
			// user dropped down to another account,
			// let's select the same compose type
			selectComposeType(SmartTemplates.Settings.currentComposeType, idkey);
		}

		// Update Save Template tooltip for the selected identity
		const saveBtn = document.getElementById('btnSaveTemplate');
		const loadBtn = document.getElementById('btnLoadTemplate');
		saveBtn.title = saveBtn.alt = browser.i18n.getMessage(
			"btnSaveTemplate.tooltip",
			SmartTemplates.Settings.currentAccountLabel
		);

		loadBtn.title = loadBtn.alt = browser.i18n.getMessage(
			"btnLoadTemplate.tooltip",
			SmartTemplates.Settings.currentAccountLabel
		);


		await this.logDebugOptional("identities", "selectIdentity(" + idkey + ") COMPLETE");

	} ,
	
	// move the file buttons to the correct field
  selectFileCase : function (section) {
		function moveFileControls(select) {
			let fc = document.getElementById('fileControls'),
			    selectInput = document.getElementById(select);
			// move to the correct panel (if it's not already there)
			if (selectInput.parentNode.lastChild != fc) {
				selectInput.parentNode.appendChild(fc);
			}
		}
		if (!section) {
			return;
			// section = document.getElementById('fileTemplatesTabs');
		}
		
		// TO DO:  replace tabbox!!

		SmartTemplates.Util.logDebug(`Selected [${section.id}] ${section.id}`, section); 
		switch (section.id) {
			case "new-fileTemplates":
				moveFileControls('templateList_new');
				break;
			case "rsp-fileTemplates":
				moveFileControls('templateList_rsp');
				break;
			case "fwd-fileTemplates":
				moveFileControls('templateList_fwd');
				break;
			case "snippets-fileTemplates":
				moveFileControls('templateList_snippets');
				break;
		}
	},

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

	fileAccountSettings: async function(mode, jsonData, fname="") {
		let result = await messenger.Utilities.fileAccountSettings(mode, jsonData, fname);
		return result;
	} ,

  storeAccount: async function() {
		// let's get all the settings from the key and then put them in a json structure:
    const currentDeck = this.getCurrentDeck(SmartTemplates.Settings.accountId),
					tabbox = document.getElementById(currentDeck),
					txt = tabbox.getElementsByTagName('textarea'), // changed from textbox
					chk = tabbox.querySelectorAll('input[type=checkbox]'),
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
    await this.fileAccountSettings('save', json, this.currentAccountLabel);
  } ,
  
  // load a Template file (not this module!)
  loadAccount: async function() {
		function isOrStartsWith(el, s) {
			return (el.id == s || el.id.startsWith(s + "."));
		}
		
		function updateElement(settings, el, stem, targetId) {
			// id target is common, append .id#, otherwise replace the .id#
			let oldId = targetId ? el.id.replace(targetId, stem) : el.id + stem;
			// set element value (text / checkbox) from json data
			switch (el.tagName.toLowerCase()) {
				case "input":
					if (el.getAttribute("type") == "checkbox") {
						el.checked = settings[oldId];
					}
					break;
				case "textarea"	:
					el.value = settings[oldId];
					break;
				default:
					return;
			}
			// force preference update
			const evt = new Event("change", {bubbles:true, cancelable:false})
			el.dispatchEvent(evt);
		}

		let data = await this.fileAccountSettings('load', JSON.stringify({ key: this.currentId }));
		if (!data) {
			return;
		}
		console.log("Successfully read json data", data);
    const currentDeck = this.getCurrentDeck(SmartTemplates.Settings.accountId),
					tabbox = document.getElementById(currentDeck),
					textAreas = tabbox.getElementsByTagName('textarea'), // html collection
					checkboxes = tabbox.querySelectorAll('input[type=checkbox]'); // nodelist


		// jsonData = the key
		// every identifier ends with id#; we need to replace the number with the current key!
		// or match the string up to .id!
		// we need to read one keyname of one (the first) json member
		// e.g "newmsg.id1"
		let sourceId = Object.keys(data)[0];
		if (sourceId) {
			// cut off variable before .id1
			// find out if specific identity or common
			// and only then append identity extension
			// data.key has target identity and this can be "common"
			let isSrcIdentity = sourceId.indexOf(".id") > 0,
        stem = isSrcIdentity ? sourceId.substring(sourceId.lastIndexOf(".")) : "", // use empty key for common case
        isTargetIdentity = (data.key && data.key != "common") || data.key == "",
        targetId = isTargetIdentity ? "." + data.key : "";
			if (isTargetIdentity) {
				// uncheck 'use common' checkbox
				document.getElementById('use_default' + targetId).checked = false;
				SmartTemplates.Settings.showCommonPlaceholder(false);
			} else {
				targetId = SmartTemplates.Settings.accountId;
			}
			for (let i=0; i<textAreas.length; i++) {
				updateElement(data, textAreas[i], stem, targetId);
				// check use_default
			}
			for (let i=0; i<checkboxes.length; i++) {
				// e.g newmsg.id1
				let el = checkboxes[i];
				updateElement(data, el, stem, targetId);
				// update enable / disable textboxes from checkbox data.
				if (
          isOrStartsWith(el, "new") ||
          isOrStartsWith(el, "newhtml") ||
          isOrStartsWith(el, "rsp") ||
          isOrStartsWith(el, "rsphtml") ||
          isOrStartsWith(el, "fwd") ||
          isOrStartsWith(el, "fwdhtml")
        ) {
          SmartTemplates.Settings.disableWithCheckbox(el);
        }
			}
		}                  
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
        .replace('[at]','@')
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
		if (isEnabled) {
			document.getElementById("SmartTemplate4AboutLogo").classList.remove("standard");
		}
  } ,

	enableStandardConfig: function(isEnabled) {
		for (let el of document.querySelectorAll(".standardFeature")) {
			el.disabled = !isEnabled;
		}
		document.getElementById("useLastTemplate").disabled = !isEnabled;
	} ,	

	showTrialDate: function() {
    const licenseDate = document.getElementById('licenseDate'),
			licenseDateLbl = document.getElementById('licenseDateLabel'),
			txtGracePeriod= SmartTemplates.Util.gracePeriodText(licenseInfo.trialDays);
        
    if (!licenseDateLbl.getAttribute("originalContent")) { // save original label!
      licenseDateLbl.setAttribute("originalContent", licenseDateLbl.textContent);
    }
    licenseDateLbl.textContent = txtGracePeriod;
    licenseDateLbl.classList.add('important');
    licenseDate.classList.remove('valid'); // [issue 170]
    licenseDate.value = "";
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
			case  "extend": {
				const txtExtend = SmartTemplates.Util.getBundleString(
          "st.notification.premium.btn.extendLicense"
        );
				btnLicense.setAttribute("collapsed", false);
				btnLicense.textContent = txtExtend; // text should be extend not renew
				btnLicense.setAttribute('tooltiptext',
					SmartTemplates.Util.getBundleString("st.notification.premium.btn.extendLicense.tooltip"));
				return txtExtend;
			}
			case "renew": {
				const txtRenew = SmartTemplates.Util.getBundleString("st.notification.premium.btn.renewLicense");
				btnLicense.textContent = txtRenew;
			  return txtRenew;
			}
			case "buy": {
				const buyLabel = SmartTemplates.Util.getBundleString("st.notification.premium.btn.getLicense");
				btnLicense.textContent = buyLabel;
			  return buyLabel;
			}
			case "upgrade": {
				const upgradeLabel = SmartTemplates.Util.getBundleString(
          "st.notification.premium.btn.upgrade"
        );
				btnLicense.textContent = upgradeLabel;
				btnLicense.classList.add('upgrade'); // stop flashing
			  return upgradeLabel;
			}
		}
		return "";
	} ,
	

  // this function is called on load and from validateLicenseInOptions
  // was decryptLicense
  updateLicenseOptionsUI: async function (silent = false) {
    const getElement = document.getElementById.bind(document),
      validationPassed = getElement("validationPassed"),
      validationStandard = getElement("validationStandard"),
      validationFailed = getElement("validationFailed"),
      validationInvalidAddon = getElement("validationInvalidAddon"),
      validationExpired = getElement("validationExpired"),
      validationInvalidEmail = getElement("validationInvalidEmail"),
      validationEmailNoMatch = getElement("validationEmailNoMatch"),
      validationDate = getElement("validationDate"),
      validationDateSpace = getElement("validationDateSpace"),
      licenseDate = getElement("licenseDate"),
      licenseDateLabel = getElement("licenseDateLabel"),
      logo = getElement("SmartTemplate4AboutLogo"),
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
        catch { niceDate = decryptedDate; }
      }
      switch(result) {
        case "Valid":
					if (licenseInfo.keyType==2) { // standard license
            this.showValidationMessage(validationStandard, silent);
						this.enableStandardConfig(true);
						logo.classList.add("standard");

					} else {
						this.showValidationMessage(validationPassed, silent);
						this.enablePremiumConfig(true);
					}
          licenseDate.value = niceDate;
          licenseDate.classList.add('valid'); // [issue 170]
          licenseDateLabel.textContent = SmartTemplates.Util.getBundleString("label.licenseValid");
          break;
        case "Invalid": {
					logo.classList.add("standard");
				  validationDate.setAttribute("collapsed", true);
					validationDateSpace.setAttribute("collapsed", true);
				  let addonName = '';
				  switch (licenseInfo.licenseKey.substring(0, 2)) {
            case "QI":
            case "Q2": // quickfilters standard
              addonName = "quickFilters";
              break;
            case "QF":
            case "Q1": // QuickFolders standard
              addonName = "QuickFolders";
              break;
            case "ST":
            case "S1":
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
				} break;
        case "Expired":
					logo.classList.add("standard");
          licenseDateLabel.textContent = SmartTemplates.Util.getBundleString("st.licenseValidation.expired");
          licenseDate.value = niceDate;
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
				if (addedClass!='paid')	{el.classList.remove('paid');}
				if (addedClass!='expired') {el.classList.remove('expired');}
				if (addedClass!='free')	{el.classList.remove('free');}
			} catch(ex) {
				SmartTemplates.Util.logException("replaceCssClass(" + el + "):\n", ex);
			}
		}
    const getElement = document.getElementById.bind(document),
			btnLicense = getElement("btnLicense"),
			proTab = getElement("catLicense"),
			logo = getElement("SmartTemplate4AboutLogo");
        
    // old call to decryptLicense was here
    // 1 - sanitize License
    // 2 - validate license
    try {      
      // 3 - update options ui with reaction messages; make expiry date visible or hide!; 
      this.updateLicenseOptionsUI(silent);  // async! // was settings.decryptLicense
			switch(licenseInfo.status) {
				case "Valid": {
					const today = new Date(),
            later = new Date(today.setDate(today.getDate() + 32)), // pretend it's a month later:
            dateString = later.toISOString().substring(0, 10);
					// if we were a month ahead would this be expired?
					if (licenseInfo.expiryDate < dateString) {
						this.labelLicenseBtn(btnLicense, "extend");
					} else {
						if (licenseInfo.keyType==2) { // standard license
							btnLicense.classList.add('upgrade'); // removes "pulsing" animation
							this.labelLicenseBtn(btnLicense, "upgrade");
						} else {
							btnLicense.setAttribute("collapsed", true);
						}
					}
					replaceCssClass(proTab, 'paid');
					replaceCssClass(btnLicense, 'paid');
					logo.classList.remove('aboutLogo');
					logo.classList.add('aboutLogoPro');
				  break;
				}
				case "Expired":
					this.labelLicenseBtn(btnLicense, "renew");
				  btnLicense.setAttribute("collapsed", false);
					replaceCssClass(proTab, 'expired');
					replaceCssClass(btnLicense, 'expired');
					logo.setAttribute('src', "chrome://smarttemplate4/content/skin/logo-pro.png");
					break;
				default: // no license
					this.labelLicenseBtn(btnLicense, "buy");
				  btnLicense.setAttribute("collapsed", false);
					replaceCssClass(proTab, 'free');
					logo.setAttribute('src', "chrome://smarttemplate4/content/skin/logo.png");
					logo.classList.add('aboutLogo');
					logo.classList.remove('aboutLogoPro');
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
			subjectline = supportType + " (" + version + ") " + subjectTxt.value;
		// sURL ="mailto:" + mailto + "?subject=" + encodeURI(subjectline);
		messenger.compose.beginNew({
			to: mailto,
			subject: subjectline
		});

		return;
/*		, // urlencode
		    // make the URI
		let ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
		    aURI = ioService.newURI(sURL, null, null);
		// open new message
		MailServices.compose.OpenComposeWindowWithURI (null, aURI);
*/
	},	

	selectDefaultTemplates: async function(el) {
  	await SmartTemplates.Preferences.setMyIntPref("defaultTemplateMethod", parseInt(el.value,10));
	},	

	updateStatusBar: async function(showStatus) {
		await setPref("showStatusIcon", showStatus);
		messenger.runtime.sendMessage({ 
			command: "updateStatusbarIcon"
		});
	},

	setStatusIconMode: async function(element) {
		const mode = parseInt(element.value);
		await setPref("statusIconLabelMode", mode);
		this.updateStatusBar(document.getElementById("chkStatusButton").checked);
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

async function createPref(key,value) {
  let target = key;
  if (!key.startsWith(SMARTTEMPLATES_EXTPREFIX)) {
    target = SMARTTEMPLATES_EXTPREFIX + key;
  }
  await messenger.LegacyPrefs.createPref(target, value);
}

async function getPref(key, defaultVal=null) {
  let target = key;
  if (!key.startsWith(SMARTTEMPLATES_EXTPREFIX)) {
    target = SMARTTEMPLATES_EXTPREFIX + key;
  }  
  return await messenger.LegacyPrefs.getPref(target, defaultVal);
}

async function savePref(event) {
  let target = event.target,
      prefName = target.dataset.prefName; // automatically added from data-pref-name
  
	if (target instanceof HTMLInputElement) {
		if (target.getAttribute("type") === "checkbox") {
			await browser.LegacyPrefs.setPref(prefName, target.checked);
		} else if (target.getAttribute("type") === "text" ||
			target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} else if (target.getAttribute("type") === "number") {
			await browser.LegacyPrefs.setPref(prefName, parseInt(target.value, 10));
		} else if (target.getAttribute("type") === "radio" && target.checked) {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    } else if (target.getAttribute("type") === "color") {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    } else {
			console.error("Received change event for input element with unexpected type", event);
		}
	} else if (target instanceof HTMLSelectElement) {
		if (target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} else {
      let v = isNaN(target.value) ? target.value : parseInt(target.value, 10);
			await browser.LegacyPrefs.setPref(prefName, v);
		}
	} else if (target instanceof HTMLTextAreaElement) {
    await browser.LegacyPrefs.setPref(prefName, target.value);
  } else {
		console.error("Received change event for unexpected element", event);
	}  
}

function array_move(arr, old_index, new_index) {
  while (old_index < 0) {
    old_index += arr.length;
  }
  while (new_index < 0) {
    new_index += arr.length;
  }
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);

  // reassign _sortId sequentially after move
  arr.forEach((e, i) => {
    e._sortId = i + 1;
  });

  return arr; // for testing purposes
};


const getElement = window.document.getElementById.bind(window.document);

/********** 
 * UI FUNCTIONS
 ***/
// add event listeners for tabs
const activateTabEvent = (event) => {
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
		button.parentElement.removeAttribute("aria-selected"); // li
  });

  btn.classList.add("active");
	btn.parentElement.setAttribute("aria-selected", true); // li

  // get <li> <btn> index:
  let idx = Array.from(btn.parentNode.parentElement.children).indexOf(btn.parentNode);
	const section = tabContent.children[idx];
  section.classList.add("active");
	if (section.classList.contains("fileTemplatePanel")) {
		// move toolbar
		SmartTemplates.Settings.selectFileCase(section);
	}

  /*
		// store last selected tab ??
		browser.LegacyPrefs.setPref("extensions.quickfolders.lastSelectedOptionsTab", 
			btn.getAttribute("tabNo"));
	*/
}





/********** 
 * Load / Unload
 ***/


async function loadPrefs(parentSelector = "") {
  console.log(`loadPrefs(${parentSelector})`);
  // use LegacyPrefs
	const dataSelector = parentSelector ? `${parentSelector} [data-pref-name]` : "[data-pref-name]";
	const prefElements = Array.from(document.querySelectorAll(dataSelector));
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
			if (await SmartTemplates.Preferences.isDebugOption("settings")) {
				// eslint-disable-next-line no-debugger
				debugger;
			}
			if (!element.classList.contains("passivePref")) { 
				// use label.passivePref for a config button without interactive UI element
				console.error("Unexpected preference element", element);
			}
			continue; // no event listener!
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
    addonfeatures: feature
  });
}


function addConfigEvent(el, filterConfig) {
	// add right-click event to containing label
	if (!el) {return;}
  // Use closest to find the nearest .configSettings button, or fallback to parent if not found
  let eventNode = el.closest(".hasConfigEvent").querySelector(".configSettings");
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

/**** FLOATING TOOLTIPS ===> **** */
// Function to update the tooltip's position
async function updateTooltipPosition(e, el, tip) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const buttonRect = el.getBoundingClientRect();
  const VERTICAL_OFFSET = 18;
  const HORIZONTAL_OFFSET = 15;

  // Temporarily place tooltip off-screen to get accurate width/height
  tip.style.left = "1px";
  tip.style.top = "1px";
  tip.style.visibility = "hidden";
  tip.style.opacity = 0;

  // Force reflow to measure size
  const tipWidth = tip.offsetWidth;
  const tipHeight = tip.offsetHeight;

  // Log calculated values for debugging:
	if (await SmartTemplates.Preferences.isDebug()) {
		console.log("Button Rect:", buttonRect);
		console.log("Tooltip Size:", { tipWidth, tipHeight });
		console.log("Viewport Size:", { viewportWidth, viewportHeight });
	}

  // Calculate tooltip position
  let left = buttonRect.right + HORIZONTAL_OFFSET;
  let top = buttonRect.bottom + VERTICAL_OFFSET;

  // Adjust if tooltip overflows right edge
  if (left + tipWidth > viewportWidth - 20) {
    left = Math.max(10, viewportWidth - tipWidth - 10);
  }

  // Prevent tooltip from going off-screen at the bottom
  if (top + tipHeight > viewportHeight - 10) {
    top = viewportHeight - tipHeight - 10;
  }

  // Apply the correct position
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.style.visibility = "visible";
  tip.style.opacity = 1;
}

// Function to show the tooltip
async function showTooltip(evt, el) {
  let tip = el.querySelector(".tooltip"); // Reuse existing tooltip if it exists

  // If no tooltip exists, create a new one
  if (!tip) {
    tip = document.createElement("div");
    tip.classList.add("tooltip");
    // Set aria-live and role for screen reader announcement
    tip.setAttribute("aria-live", "assertive");
		tip.setAttribute("role", "alert"); // status =  Less urgent than alert, for some reason it is not read.
    el.appendChild(tip);
  }

  // Force screen reader to detect change by clearing & re-adding text
  const txt = el.getAttribute("clickyTooltip");
  if (!txt) {return;}
  tip.innerText = ""; // Clear existing text first
  tip.style.visibility = "visible"; // Ensure visibility before setting text
  tip.style.opacity = 0.05; // Ensure it's not faded out - we will set this to 1 in updateTooltipPosition!
  const btn = tip.parentElement;

  setTimeout(async () => {
    if (btn.classList.contains("containsHTML")) {
      // if the tooltip contains HTML, we need to set it as innerHTML instead of innerText
      ariaPoliteUpdate(tip, txt, true);
    } else {
      // Set the tooltip text (forces the aria-live announcement)
      tip.innerText = txt;
    }

    // Wait for position to be updated before continuing
    await updateTooltipPosition(evt, el, tip);

    // Listen for mouse move and leave events
    el.addEventListener("mousemove", (e) => updateTooltipPosition(e, el, tip));
    el.addEventListener("mouseleave", () => hideTooltip(tip));
  }, 160); // Small delay to trigger the text update
}

// Function to hide the tooltip (just make it invisible)
function hideTooltip(tip) {
	if (!tip) {return;}
  tip.style.visibility = "hidden"; // Make the tooltip invisible
  tip.style.opacity = 0; // Hide with fade effect
}


/**** <=== FLOATING TOOLTIPS **** */

// add UI event listeners
function addUIListeners() {
	const lblMore = SmartTemplates.Util.getBundleString("aria.moreInfo");
  for (let button of document.querySelectorAll(".toolTipButton")) {
    button.setAttribute("aria-label", lblMore); // screenreader support
    button.addEventListener("click", async (evt) => {
      const el = evt?.target;
      if (!el) {return;}
      await showTooltip(evt, el); // Show tooltip on click
      // el.setAttribute("aria-expanded", "true"); // Indicate tooltip is visible
    });
		button.addEventListener("blur", async (evt) => {
			const el = evt?.target;
			if (!el) {return;}

			hideTooltip(el.querySelector(".tooltip"));
			// el.setAttribute("aria-expanded", "false"); // Indicate tooltip is hidden
		});		
  }

  // activate all write/reply/forward tab listeners.
  for (let button of document.querySelectorAll(".actionTabs button")) {
    button.addEventListener("click", activateTabEvent);
  }

  // add bool preference reactions
  for (let chk of document.querySelectorAll("input[type=checkbox]")) {
    let dataPref = chk.getAttribute("data-pref-name").replace(SMARTTEMPLATES_EXTPREFIX, "");
    // right-click show details from about:config
    let filterConfig = "";
    // get my bool pref:
    switch (dataPref) {
      case "debug":
        chk.addEventListener("change", (_event) => {
          SettingsUI.toggleBoolPreference(chk); // <== QF.Options
        });
        filterConfig = "smartTemplate4.debug";
        break;
      case "parseSignature":
        filterConfig = "extensions.smartTemplate4.parseSignature";
        break;
      case "showStatusIcon":
        filterConfig = "extensions.smartTemplate4.showStatusIcon";
        break;
    }

    switch (chk.id) {
      case "chkResolveAB":
        chk.addEventListener("click", (_event) => {
          SmartTemplates.Settings.resolveAB_onClick(chk);
        });
        break;
      case "chkBackgroundParser":
        chk.addEventListener("click", (_event) => {
          alert(
            "The mx parser is experimental\nPlease reload SmartTemplates to effect this change!"
          );
        });
        break;
      case "chkHideExamples":
        // oncommand="SmartTemplate4.Settings.toggleExamples(chk);"
        chk.addEventListener("click", (_event) => {
          logMissingFunction("SmartTemplate4.Settings.toggleExamples()");
        });
        break;
      case "chkStatusButton":
        chk.addEventListener("click", (event) => {
          SmartTemplates.Settings.updateStatusBar(!event.target.checked);
        });
        break;
    }

    /* CONFIG HANDLERS */
    if (filterConfig) {
      addConfigEvent(chk, filterConfig);
    }
  }
	const styleSanitiseSection = document.getElementById("styleSanitation");
	addConfigEvent(styleSanitiseSection, "extensions.smartTemplate4.sanitizeStyles");
	

  for (let chk of document.querySelectorAll(".settingDisabler")) {
    chk.addEventListener("change", (_event) => {
      SmartTemplates.Settings.disableWithCheckbox(chk); // <== QF.Options
    });
  }

  // radio button handlers
  document.getElementById("useAccountTemplate").addEventListener("click", (event) => {
    SmartTemplates.Settings.selectDefaultTemplates(event.target);
  });
  document.getElementById("useLastTemplate").addEventListener("click", (event) => {
    SmartTemplates.Settings.selectDefaultTemplates(event.target);
  });

  // these were oncommand events - for the file templates list
  document.getElementById("btnAdd").addEventListener("click", (_event) => {
    fileTemplates.addEntry();
  });
  document.getElementById("btnUpdate").addEventListener("click", (_event) => {
    fileTemplates.updateEntry();
  });  
  document.getElementById("btnRemove").addEventListener("click", (event) => {
    fileTemplates.removeEntry(event.target);
  });
  document.getElementById("btnUp").addEventListener("click", (event) => {
    fileTemplates.moveEntryUp(event.target);
  });
  document.getElementById("btnDown").addEventListener("click", (event) => {
    fileTemplates.moveEntryDown(event.target);
  });
  document.getElementById("btnEdit").addEventListener("click", (_event) => {
    fileTemplates.editEntry();
  });
  document.getElementById("btnImportTemplates").addEventListener("click", (_event) => {
    fileTemplates.importTemplates();
  });

  
  document.getElementById("btnPushUI").addEventListener("click", (_event) => {
    SmartTemplates.Settings.logDebug("Sending entries data to experiment...");

    // rawEntries this removes all _sortId members - these are not necessary for the UI / storage
    messenger.Utilities.updateTemplates(fileTemplates.rawEntries);
  });

  document.getElementById("helpSnippets").addEventListener("click", (_event) => {
    SmartTemplates.Util.showStationeryPage("snippets"); // contains an anchor
  });

  // command handlers for licensing
  document.getElementById("btnPasteLicense").addEventListener("click", (_event) => {
    SmartTemplates.Settings.pasteLicense();
  });
  document.getElementById("btnValidateLicense").addEventListener("click", (event) => {
    SmartTemplates.Settings.validateNewKey(event.target);
  });
  document.getElementById("btnLicense").addEventListener("click", (_event) => {
    // oncommand="
    //    SmartTemplate4.Util.showLicenseDialog('licenseTab');
    //    setTimeout( function() {window.close();}, 500 );"
    showRegistrationDlg("licenseTab"); // do we need to close the settings tab??
  });

  // select elements
  document.getElementById("msgIdentity").addEventListener("change", (event) => {
    SmartTemplates.Settings.selectIdentity(event.target.value, true);
  });
  document.getElementById("iconType").addEventListener("change", (event) => {
    // go through background => legacy code for the UI update at least.
    // avoid passing element itself, change parameter to select.value!
    SmartTemplates.Settings.setStatusIconMode(event.target);
  });
  document.getElementById("fontSmaller").addEventListener("click", (_event) => {
    logMissingFunction("SmartTemplate4.Settings.fontSize(-1);");
  });
  document.getElementById("fontLarger").addEventListener("click", (_event) => {
    logMissingFunction("SmartTemplate4.Settings.fontSize(+1);");
  });

  // toolbar for the template tools
  document.getElementById("helpTemplates").addEventListener("click", (_event) => {
    SmartTemplates.Util.showStationeryPage("templateFiles");
  });
  document.getElementById("btnSaveTemplate").addEventListener("click", (_event) => {
    SmartTemplates.Settings.storeAccount();
  });
  document.getElementById("btnLoadTemplate").addEventListener("click", (_event) => {
    SmartTemplates.Settings.loadAccount();
  });
  document.getElementById("btnRefreshAccounts").addEventListener("click", (_event) => {
    SmartTemplates.Settings.refreshIdentities();
  });

  // document.getElementById("btnAdvanced").addEventListener("click", (_event) => {
  // 	logMissingFunction("SmartTemplates.Settings.openAdvanced()");
  // });
  // document.getElementById("btnCloseAdvanced").addEventListener("click", (_event) => {
  // 	logMissingFunction("SmartTemplates.Settings.closeAdvanced()");
  // });
  for (let btn of document.querySelectorAll(".youtube")) {
    let video = null;
    switch (btn.id) {
      case "btnYouTube-accounts":
        video = "list";
        break;
      case "btnYouTube-filetemplates":
        video = "stationery";
        break;
    }
    btn.addEventListener("click", (_event) => {
      SmartTemplates.Util.showYouTubePage(video);
    });
  }

  // about page handlers
  for (let btn of document.querySelectorAll(".buttonLinks button")) {
    btn.addEventListener("click", (_event) => {
      // SmartTemplates.Settings.disableWithCheckbox(this)
      switch (btn.id) {
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
    el.addEventListener("click", (_event) => {
      switch (el.id) {
        case "lnkShowPremium":
          SmartTemplates.Util.showPremiumFeaturesPage();
          break;
      }
    });
  }

  // more checkboxes
  for (let el of document.querySelectorAll(".commonSwitch")) {
    el.addEventListener("change", (_event) => {
      SmartTemplates.Settings.showCommonPlaceholder(el.checked);
    });
  }
  // file picker button
  document.getElementById("btnPickTemplate").addEventListener("click", (_event) => {
    fileTemplates.openFilePicker();
  });

  // textareas:
  // drag + drop
  for (let textarea of document.querySelectorAll(".templateBox")) {
    textarea.addEventListener("drop", (_event) => {
      logMissingFunction("SmartTemplates.Settings.textDropped(event)");
    });
  }
  // focus (for pasting)
  for (let textarea of document.querySelectorAll(".pasteFocus textarea")) {
    textarea.addEventListener("focus", (_event) => {
      logMissingFunction("SmartTemplates.Settings.pasteFocus(this)");
    });
  }


  // template lists
  // .fileTemplateList richlistbox ==> select
  for (let textarea of document.querySelectorAll(".fileTemplateList")) {
    textarea.addEventListener("change", (_event) => {
      logMissingFunction("SmartTemplate4.fileTemplates.onSelect(this)");
    });
  }

  // ============================
  // == template file details  ==
  // ============================
  for (let select of document.querySelectorAll("#fileTemplateContainer select.fileTemplateList")) {
    select.addEventListener("change", (_evt) => {
      fileTemplates.onSelect(select);
    });
  }

  // =========== SUPPORT PAGE
  document.getElementById("supportType").addEventListener("change", (event) => {
    SmartTemplates.Settings.setSupportMode(event.target);
  });

  document.getElementById("composeSupportMail").addEventListener("click", (_event) => {
    const SUPPORT_MAIL = "axel.grude@gmail.com";
    SmartTemplates.Settings.sendMail(SUPPORT_MAIL);
  });

	document
    .querySelector("#categories")
    .setAttribute("aria-label", SmartTemplates.Util.getBundleString("aria.settings.nav"));


  function activateTab(li, focusTab = false) {
    let activePage = li.getAttribute("page") || null;
    li.setAttribute("selected", true);
    li.setAttribute("aria-checked", true);
		li.setAttribute(
      "aria-label",
      `${li.querySelector(".category-name").textContent} - ${SmartTemplates.Util.getBundleString(
        "aria.settings.nav.selected"
      )}`
    );
    // 1 - hide other pages

    // Remove "selected" attribute from other tabs
    for (let other of document.querySelectorAll("#categories li")) {
      if (other === li) {continue;}

      let currentActive;
      if (other.getAttribute("selected")) {
        other.removeAttribute("selected");
        other.removeAttribute("aria-checked");
				other.removeAttribute("aria-label");
        currentActive = other.getAttribute("page");
      }

      // Hide other page content
      if (currentActive) {
        document.getElementById(currentActive).classList.remove("pageActive");
      }
    }

    // Show the content of the active page
    if (activePage) {
      document.getElementById(activePage).classList.add("pageActive");

			// If the user triggered a focus, find the first focusable element (like <h1>)
			if (focusTab) {
				const pageId = li.getAttribute("page");
				const activePageContent = document.getElementById(pageId);
				if (!activePageContent) { return; }
				// Focus the first element inside the active page content
				const firstFocusableElement = activePageContent.querySelector(
          'h1, [tabindex]:not([tabindex="-1"]), button, input, select, textarea'
        );
				if (firstFocusableElement) {
					firstFocusableElement.focus();
				}
			}			
    }
  }

  // ==== NEW: PAGES
  for (let li of document.querySelectorAll("#categories li")) {
    // Accessibility improvements
		const anchor = li.querySelector("a");
		if (!anchor) { return; }    
		
		li.addEventListener("click", (event) => {
			// Prevent the click handler if the Enter/Space key was pressed
			if (event.detail !== 0) { // not a mouse event
				activateTab(li);
			}
    });

    li.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        // Select tab on Enter/Space key
        event.preventDefault();
				event.stopPropagation();
        activateTab(li, true);
        return;
      }

      // Move to the next tab on ArrowRight
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        const nextTab =
          li.nextElementSibling || document.querySelector("#categories li:first-child");
        nextTab.focus(); // Focus next tab
        event.preventDefault();
      }

      // Move to the previous tab on ArrowLeft
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        const prevTab =
          li.previousElementSibling || document.querySelector("#categories li:last-child");
        prevTab.focus(); // Focus previous tab
        event.preventDefault();
      }
    });

		// Handle keyboard selection on the <a> - the anchor tag will get focused by screenreaders.
		anchor.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				event.stopPropagation(); // Prevent bubbling up to the <li>
				activateTab(li, true);
			}
		});

		// Handle Enter key on <a> because browsers (screen readers?) convert Enter to click
		anchor.addEventListener("click", (event) => {
			// apparently this event is only triggered by Enter from the screenreaders.
			event.stopPropagation(); // Prevent double event
			activateTab(li, true);
		});		
  }

  // replace SmartTemplate4.Util.showAboutConfig command handlers
  addConfigEvent(document.getElementById("identityLabel"), "extensions.smartTemplate4.identities");

	document.getElementById('versionBox').addEventListener('focus', function(event) {
		var version = event.target.textContent.trim();
		// Update the live region to trigger the screen reader announcement
		document.getElementById('versionAnnouncement').textContent = 
		  "SmartTemplates is version " + version;
	});

	// Ensure aboutContent is read when focused
	document.getElementById('aboutContent').addEventListener('focus', function(event) {
		event.target.setAttribute("aria-live", "polite");
	});
	
  document.getElementById("versionBox").addEventListener("click", (_event) => {
    messenger.Utilities.showVersionHistory();
  });

  // load examples...
  document.getElementById("templatesIFrame").src =
    "https://smarttemplates.quickfolders.org/templates.html?nav=none";
}

async function selectComposeType(forceType=null, forceKey = null) {
	const params = new URLSearchParams(window.location.search);
	const composeType = forceType || params.get("composeType");
	const idKey = forceKey || params.get("id") || "common";
	// select the correct compose type tab
	let btnSelector;
	switch (composeType) {
		case 'snippets': {
			const tab = document.querySelector(".SnippetsTab"); // it's a unique element
			tab.click();
			return;
		}
		case 'new': 
			btnSelector=".NewTab";
			break;
		case 'rsp': 
			btnSelector=".RespondTab";
			break;
		case 'fwd': 
			btnSelector=".ForwardTab";
			break;
		default:
			return;
	}
	if (!btnSelector) {
		return;
	}
	const idSelector = idKey ? "." + idKey : "";
	const currentDeck = SmartTemplates.Settings.getCurrentDeck(idSelector);
	if (currentDeck) {
		const tab = document.getElementById(currentDeck).querySelector(btnSelector);
		if (tab) {
			tab.click();
		}
	}
	// [issue 318]
	const tabFT = document.getElementById("fileTemplatesTabs")?.querySelector(btnSelector);
	if (tabFT) {
		tabFT.click();
	}
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
	await SmartTemplates.Help.onLoad(); // event listeners for help frame

	// [issue 121] currently shown selection
	// special settings (omit selecting an identit from the accounts dropdown)

	const params = new URLSearchParams(window.location.search);
	const mode = params.get("mode") || 
	      (params.get("composeType") == "snippets" ? "fileTemplates" : null);

	const topic = params.get("topic");
	if (topic) {
		const dropdown = document.getElementById("supportType");
		for (let option of dropdown.options) {
			if (option.getAttribute("topic") === topic.toLowerCase()) {
				dropdown.value = option.value;
				SmartTemplates.Settings.setSupportMode(dropdown);
				break;
			}
		}
	}		

	let selectedElement = null; // a11y
	switch(mode) {
		case "fileTemplates":
			selectedElement = SmartTemplates.Settings.selectCategoryMenu("catFileTemplates");
			break;
		case "variables":
			selectedElement = SmartTemplates.Settings.selectCategoryMenu("catVariables");
			break;
		case "licenseKey": {
			selectedElement = SmartTemplates.Settings.selectCategoryMenu("catLicense");
			const txtLicense = getElement('txtLicenseKey');
			if (txtLicense) {
				setTimeout(() => txtLicense.focus(), 200);
			}
		} break;
		case "supportEmail":
			selectedElement = SmartTemplates.Settings.selectCategoryMenu("catSupport");
			break;
		default:
			selectedElement = SmartTemplates.Settings.selectCategoryMenu("catAccountTemplates");
			break;
	}
	selectComposeType();
	
	SettingsUI.initVersionPanel();
	if (selectedElement) {
		// set focus to the document pane?
		setTimeout(() => { selectedElement.focus(); }, 250);
	}

	browser.runtime.onMessage.addListener((msg, _sender) => {
		// check on the msg
		if (msg?.command == "focusSettingsTab") {
			const tabs = document.getElementById("categories").querySelectorAll(".category"); 
			let isSelected = false;
			for (let t of tabs) {
        if (t.getAttribute("selected")) {
					// select previously selected tab
          SmartTemplates.Settings.selectCategoryMenu(t.id).focus();
					isSelected = true;
          break;
        }
      }
			if (!isSelected) { // if nothing was preselected, let's go to file templates.
				SmartTemplates.Settings.selectCategoryMenu("catFileTemplates").focus();
			}
			return Promise.resolve();
    }
		return false;
	});

  const updateHtmlTooltips = (buttonId, bundleKey) => {
    const btn = document.getElementById(buttonId);
    if (!btn) {
      return;
    }

    const txt = SmartTemplates.Util.getBundleString(bundleKey);
    btn.setAttribute("clickyTooltip", formatAll(txt));
  };
  // update any tooltips that contain HTML pseudocode such as {i} [[button]] {P} etc.
  updateHtmlTooltips("removeSigOnIdChangeAfterEdits-tip", "removeSigOnIdChangeAfterEdits.tip");
  updateHtmlTooltips("chkResolveAB-tip", "resolveABRemoveMail.tip");
  updateHtmlTooltips("forceParagraphs-tip", "forceParagraphs.tip");

}



addEventListener("load", async (_event) => {
  onLoad();
});  

addEventListener("unload", async (_event) => {
	console.log("settings - UNLOAD!");
  SmartTemplates.Settings.onUnload();

});  

addEventListener("keydown", (event) => {
	console.log(event);
	if (event.code == "F4") {
		// forward event to help
		console.log("smartTemplate-settings.html keydown", event);
		event.preventDefault();
		event.stopPropagation();
	}
});
