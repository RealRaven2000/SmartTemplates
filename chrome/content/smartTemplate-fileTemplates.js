"use strict";
/* 
	BEGIN LICENSE BLOCK
	
	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension
	
	END LICENSE BLOCK 
*/

// Support external HTML files that can be selected during the button press
// write / reply and forward.



SmartTemplate4.fileTemplates = {
	Entries: {
		templatesNew : [],
		templatesRsp : [],
		templatesFwd : [],
    snippets: []
	},
	armedEntry: null,
	lastError: null,
	isModified: false, // set to true after editing moving / removing items
	// how many templates are stored altogether?
	get entriesLength() {
		let l = 0;
		for (let p in this.Entries) { // walk through ids, get all arrays and sum up items
		  if (Array.isArray(this.Entries[p]))
				l += this.Entries[p].length;
		}
		return l;
	} ,
	// entries shown on screen.
	get CurrentEntries() {
		let entries = null;
		try {
			switch(document.getElementById('fileTemplatesTabs').selectedIndex) {
				case 0:
					entries = this.Entries.templatesNew;
					break;
				case 1:
					entries = this.Entries.templatesRsp;
					break;
				case 2:
					entries = this.Entries.templatesFwd;
					break;
        case 3:
					entries = this.Entries.snippets;
					break;
			}
		} catch(ex){;}
		return entries;
	},
  charset: "UTF-8",
  _document: null,
  get document() { // document of option window
    if (this._document) return this._document;
		let win = this.optionsWindow;
		this._document = win ? win.document : null;
    return  this._document;
  },
	
	get optionsWindow() {
		const Ci = Components.interfaces,
		      util = SmartTemplate4.Util;
          
    try {
      var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
      let windowManager = Services.wm,
          optionsWindow = windowManager.getMostRecentWindow('addon:SmartTemplate4'); 
      return optionsWindow;
    }
		catch(ex) { ; }
		
    let mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator),
        getWindowEnumerator = 
            (util.isLinux) ?
            mediator.getXULWindowEnumerator :
            mediator.getZOrderXULWindowEnumerator;
	} , 
	
  get ListBox() {
		let flavor;
		switch(document.getElementById('fileTemplatesTabs').selectedIndex) {
			case 0:
			  flavor = 'new';
				break;
			case 1:
			  flavor = 'rsp';
				break;
			case 2:
			  flavor = 'fwd';
				break;
      case 3:
			  flavor = 'snippets';
				break;
			default:
				return null;
		}
    return this.RichList(flavor);
  },
	
	RichList: function (flavour) {
		return this.document.getElementById('templateList.' + flavour)
	},
	
	// adds an item to currently visible list
  addItem: function addItem(path, label, cat="", lb) {
    let listbox = lb || this.ListBox;
    if (listbox)
      listbox.appendItem(label, JSON.stringify({path:path, category:cat})  );
  },
	
	// delete list (only of currently selected flavor)
  clearList: function clearList(onlyUI) {
    const util = SmartTemplate4.Util;
    if (!onlyUI) {
      util.logDebug ('clearList() - empty templateFile list'); 
			let entries = this.CurrentEntries;
			if (entries)
				while (entries.length)
					entries.pop();
    }
    if (this.document) {  // only if options window is visible
      util.logDebug ('clearList() - empty listbox'); 
      let theList = this.ListBox;
      if (theList) {
        while(theList.lastElementChild) {
          theList.removeChild(theList.lastElementChild);
        }
      }
    }
  },
	
  // repopulates richlistbox and rebuilds menu!
  repopulate: function repopulate(isRichList) {
    // richlistbox
    if (isRichList) {
      this.clearList(true);
      for (let i=0; i<this.CurrentEntries.length; i++) {
        let entry = this.CurrentEntries[i],
            cat = entry.category || "";
        this.addItem(entry.path, entry.label, cat);
        // populate the Entries array; fallback to browser bookmark type if undefined
      }
    }
  },
	
	// label was changed, auto update the list!
  onEditLabel: function onEditLabel(txt, forceIndex=null) {
    const util = SmartTemplate4.Util;
    SmartTemplate4.Util.logDebug("onEditLabel", txt);
    // check if one is selected and we just changed it]
    let path = this.document.getElementById('txtTemplatePath').value,
        label = this.document.getElementById('txtTemplateTitle').value.trim(),
        category = this.document.getElementById('txtTemplateCategory').value.trim(),
        listbox = this.ListBox,
        idx = forceIndex || listbox.selectedIndex;
		util.logDebugOptional("fileTemplates","onEdit();");
    if (idx ==-1) return;
    let e = this.CurrentEntries[idx];
    // check if path matches
		if (e.path != this.document.getElementById("txtTemplatePath").value)
			return; // this is not a match. Let's not change the label
		
		if (e.label == label && e.category == category) {
			return;
		}
		
		// change label in list then save & reload.
    if (txt)
      e.label = txt.value;
    e.category = category;

    if (forceIndex) {
      let item = listbox.getItemAtIndex(forceIndex);
      let v = JSON.parse(item.value),
          p = v.path,
          c = v.category || "";
      switch(LastInput.id) {
        case "txtTemplateCategory":
          c = document.getElementById("txtTemplateCategory").value; // update with new value
          item.value = JSON.stringify({path:p, category:c});
          break;
        case "txtTemplateTitle":
          let txt = document.getElementById("txtTemplateTitle").value;
          e.label = txt;
          item.firstChild.value = txt; 
          break;
      }
      this.saveCustomMenu();
      return;
    }
    this.saveCustomMenu();
    this.repopulate(true); // rebuild menu
		listbox.selectedIndex = idx; // reselect item
  } , 
  
  updateInputGlobal: function(input) {
    LastInput.id = input.id;
    LastInput.value = input.value;
    let listbox = this.ListBox,
        idx = listbox.selectedIndex;
    LastInput.listbox = listbox; // remember this listbox. we only update if clicking a different item in the same.
    LastInput.selectedIndex = idx;
  },
  
  checkModifications: function(evt) {
    // debugger;
    SmartTemplate4.Util.logDebug("checkModifications", evt);
  } ,
  
	onSelect: function(rlb) {
    SmartTemplate4.Util.logDebug("onSelect", rlb);
    if (LastInput.listbox == rlb) {
      if (LastInput.value != document.getElementById(LastInput.id).value) {
        // let lastListItem = rlb.getItemAtIndex(LastInput.selectedIndex);
        this.onEditLabel(null, LastInput.selectedIndex);
      }
    }
		let richlistitem = rlb.getSelectedItem(0);
		if (richlistitem) {
      let p, 
          c = "", 
          v = richlistitem.value;
      try {
        v = JSON.parse(richlistitem.value);
        p = v.path;
        c = v.category || "";
      }
      catch(ex) {
        p = v;
      }
			document.getElementById('txtTemplatePath').value = p;
			document.getElementById('txtTemplateCategory').value = c;
			document.getElementById('txtTemplateTitle').value = richlistitem.label;
		}
	} ,
	
  update: function update(isNew) {
    const util = SmartTemplate4.Util,
		      getBundleString = util.getBundleString.bind(util),
					FT = SmartTemplate4.fileTemplates;
					
    var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
    let path = document.getElementById('txtTemplatePath').value,
        label = document.getElementById('txtTemplateTitle').value,
        category = this.document.getElementById('txtTemplateCategory').value,
        existingEntry = null, 
        existingIndex = null;
		
		
    // check if it exists and replace label
		const msgTitle = getBundleString("st.fileTemplates.wrnSelectUpdateItem.caption")
    if (!isNew) {
      let lb = FT.ListBox;      
      existingIndex = lb.selectedIndex;
      if (existingIndex<0) {
				let txt = getBundleString("st.fileTemplates.wrnSelectUpdateItem");
        Services.prompt.alert(null, msgTitle, txt);
        return;
      }
      existingEntry = FT.CurrentEntries[existingIndex];
      existingEntry.path = path;
      existingEntry.label = label;
      existingEntry.category = category || ""; 
    }
				
    if (!label.trim()) {
			let txt = getBundleString("st.fileTemplates.wrnEnterTitle");
      Services.prompt.alert(null, msgTitle, txt);
      return;
    }
    if (!path.trim()) {
			let txt = getBundleString("st.fileTemplates.wrnEnterPath");
      Services.prompt.alert(null, msgTitle, txt);
      return;
    }
    
    // TO DO:
    // should we allow changing the URL ? (for selected item only)
    // do a match of first n characters and display a confirmation?
    if (!existingEntry) {
      FT.addItem(path, label, category);
      FT.CurrentEntries.push({path:path, label:label, category:category});
    }
    else {
      // update existing item (label)
      util.logDebug(`Updating existing item: ${existingEntry.label} [${existingEntry.path} , ${existingEntry.category} ]`);
      let lb = FT.ListBox;
      lb.ensureIndexIsVisible(existingIndex);
      lb.getItemAtIndex(existingIndex).firstChild.value = label; // hack to update the label. IMPLEMENTATION DEPENDENT! if we chanbge from richlist we need to rewrite this one
      FT.CurrentEntries[existingIndex].label = label;
      // update path!
      lb.getItemAtIndex(existingIndex).value = JSON.stringify({path:path, category:category});
    }
      
    SmartTemplate4.fileTemplates.repopulate(false); // rebuild menu
    SmartTemplate4.fileTemplates.saveCustomMenu();
  },
  
  remove: function remove() {
    if (SmartTemplate4.Preferences.isDebugOption("fileTemplates.menus")) debugger;
    let listbox = this.ListBox,
        idx = listbox.selectedIndex;
    if (idx<0) return;
    this.CurrentEntries.splice(idx, 1); // remove from array
		if (listbox.removeItemAt) // method was removed in Tb 61
			listbox.removeItemAt(idx);
		else { 
			listbox.getItemAtIndex(idx).remove();
		}
    this.repopulate(false); // rebuild menu
    this.saveCustomMenu();
  },
  
  up: function up() {
    let listbox = this.ListBox,
        idx = listbox.selectedIndex;
    if (idx>0) {
      let swap = this.CurrentEntries[idx-1];
      this.CurrentEntries[idx-1] = this.CurrentEntries[idx];
      this.CurrentEntries[idx] = swap;
      
      this.repopulate(true);
      this.saveCustomMenu();
      listbox.selectedIndex = idx-1;
    }
  },
  
  down: function down() {
    let listbox = this.ListBox,
        idx = listbox.selectedIndex;
    if (idx < this.CurrentEntries.length-1) {
      let swap = this.CurrentEntries[idx+1];
      this.CurrentEntries[idx+1] = this.CurrentEntries[idx];
      this.CurrentEntries[idx] = swap;
      
      this.repopulate(true);
      this.saveCustomMenu();
      listbox.selectedIndex = idx+1;
    }
  },
	
	// =====================   FILES   ===================== //	
	
  getLocalFile: function getLocalFile() {
    // get the "menuOnTop.json" file in the profile/extensions directory
    let path = new Array("extensions", "smartTemplates.json");
    // http://dxr.mozilla.org/comm-central/source/mozilla/toolkit/modules/FileUtils.jsm?from=FileUtils.jsm&case=true#41
		
		const { FileUtils } = ChromeUtils.import('resource://gre/modules/FileUtils.jsm');
		
		return FileUtils.getFile("ProfD", path); // implements nsIFile
  } ,	
  	
  readStringFile: function readStringFile() {
    // To read content from file
		const {OS} = ChromeUtils.import("resource://gre/modules/osfile.jsm", {});
    // To read & write content to file
    // const {TextDecoder, TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});  
    
    let profileDir = OS.Constants.Path.profileDir,
        path = OS.Path.join(profileDir, "extensions", "smartTemplates.json"),
        // decoder = new TextDecoder(),        // This decoder can be reused for several reads
        promise = OS.File.read(path, { encoding: "utf-8" }); // Read the complete file as an array - returns Uint8Array 
    return promise;
  } ,		
	
	// load template lists from file
  loadCustomMenu: function loadCustomMenu(fromOptions) {
    const util = SmartTemplate4.Util;
    fromOptions = fromOptions ? true : false;
    util.logDebug ('loadCustomMenu(' + fromOptions + ')...'); 
    let promise3;
    try {
      // let CustomMenuString='';
      let fileTemplates = this, // closure this
          promise2 = this.readStringFile().then (
        function onSuccess(CustomMenuData) {
          // populate the templates list
          util.logDebug ('readStringFile() - Success'); 
					
					function fillEntries(E,T,lb) {
						//empty list
						while (T.length)
					    T.pop();
						if (lb) { 
						  while(lb.itemCount)
								lb.removeItemAt(0);
						}
						if (!E) return;
						for (let i=0; i<E.length; i++) {
							let entry = E[i],
                  c = entry.category || "";
							// populate the options list(s)
							if (fromOptions) {
								fileTemplates.addItem(entry.path, entry.label, c, lb);
							}
							// populate the Entries array from read data
							T.push({ path:entry.path, label:entry.label, category:entry.category || "" });
						}
						
					}
          
          let data = JSON.parse(CustomMenuData);  
					fillEntries(data.templatesNew, fileTemplates.Entries.templatesNew, fromOptions ? fileTemplates.RichList('new') : null);
					fillEntries(data.templatesRsp, fileTemplates.Entries.templatesRsp, fromOptions ? fileTemplates.RichList('rsp') : null);
					fillEntries(data.templatesFwd, fileTemplates.Entries.templatesFwd, fromOptions ? fileTemplates.RichList('fwd') : null);
          fillEntries(data.snippets, fileTemplates.Entries.snippets, fromOptions ? fileTemplates.RichList('snippets') : null);
					
					
          // util.logDebug ('parsed ' + entries.length + ' entries'); 
        },
        function onFailure(ex) {
          util.logDebug ('readStringFile() - Failure: ' + ex); 
          var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
          if (ex.becauseNoSuchFile) {
            // File does not exist);
          }
          else {
            // Some other error
            Services.prompt.alert(null, 'SmartTemplates - loadCustomMenu', 'Reading the fileTemplates file failed\n' + ex);
          }     
          // no changes to Entries array
        }
      );
      
			// main window loading. this part is not necessary if we load into options window.
			if (!fromOptions) {
				promise3 = promise2.then(
					function promise2_populateMenu() {
						util.logDebug ('promise2.then populateMenus() [obsolete]'); 
						return promise2; // make loadCustomMenu chainable
					},
					function promise2_onFail(ex) {
						util.logDebug ('promise2.then onFail():\n' + ex); 
            var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
						Services.prompt.alert(null, 'SmartTemplates - promise2.then', 'Did not load main menu\n' + ex);
						return promise2; // make loadCustomMenu chainable
					}
				);
			}
    }
    catch(ex) {
      util.logException('SmartTemplate4.fileTemplates.loadCustomMenu()', ex);
    }
    return promise3;
  } ,

  // save to file
  saveCustomMenu: function saveCustomMenu()  {
    const util = SmartTemplate4.Util;
    
    try {
			const {OS} = ChromeUtils.import("resource://gre/modules/osfile.jsm", {});
				
      let fileTemplates = this, // closure this
          profileDir = OS.Constants.Path.profileDir,
          path = OS.Path.join(profileDir, "extensions", "smartTemplates.json"),
          backPath = OS.Path.join(profileDir, "extensions", "smartTemplates.json.bak"),
          promiseDelete = OS.File.remove(backPath),  // only if it exists
          promiseBackup = promiseDelete.then(
					function () { 
						util.logDebug ('OS.File.move is next...'); 
						OS.File.move(path, backPath); 
					},
					function failedDelete(fileError) { 
						util.logDebug ('OS.File.remove failed for reason:' + fileError); 
						OS.File.move(path, backPath); 
					}
        );

      promiseBackup.then( 
        function backSuccess() {
          let entity = fileTemplates.Entries || '',
              outString = JSON.stringify(entity, null, '  '); // prettify
          try {
            // let theArray = new Uint8Array(outString);
            let promise = OS.File.writeAtomic(path, outString, { encoding: "utf-8"});
            promise.then(
              function saveSuccess(byteCount) {
                util.logDebug ('successfully saved ' + fileTemplates.entriesLength + ' bookmarks [' + byteCount + ' bytes] to file');
								fileTemplates.isModified = true;
                SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateTemplateMenus" });
                SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateSnippetMenus" });
              },
              function saveReject(fileError) {  // OS.File.Error
                util.logDebug ('saveCustomMenu error:' + fileError);
              }
            );
          }
          catch (ex) {
            util.logException('MenuOnTop.TopMenu.saveCustomMenu()', ex);
          }
        },
        function backupFailure(fileError) {
          util.logDebug ('promiseBackup error:' + fileError);
        }
      )
    }
    catch(ex) {
      util.logException('MenuOnTop.TopMenu.saveCustomMenu()', ex);
    }
        
  },

  // =====================   UI   ===================== //	

	// lbl: [new, rsp, fwd]
	configureMenu: function (templates, msgPopup, composeType, showConfigureItem = true) {
		const util = SmartTemplate4.Util,
					fT = SmartTemplate4.fileTemplates,
          prefs = SmartTemplate4.Preferences,
					MAX_FREE_TEMPLATES = 5,
          MAX_STANDARD_TEMPLATES = 25,
					MAX_STANDARD_CATEGORIES=3,
          isLicensed = util.hasLicense(false);
		let parent = msgPopup.parentNode, 
				singleParentWindow = null;
          
    function getAccessKey(acCode) {
      if (acCode<10)
        return acCode.toString();
      if (acCode>34) 
        return "";
      return String.fromCharCode(65+acCode-10); // continue with A,B,C
    }
    try {
      var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
      let singleM = Services.wm.getMostRecentWindow("mail:messageWindow");
      if (window == singleM)
        singleParentWindow = window;
    }
    catch(ex) {
      
    }
					
		util.logDebugOptional("fileTemplates", "Add " + composeType + " templates: " + templates.length + " entries to [" + (parent.id || 'anonymous') + "]");
		// first clear entries:
							
		let lastChild = msgPopup.lastChild,
        accelerator = 1, // [issue 96]
        acceleratorCat = 10,
        categories = [],
        catAccelerator = []; // [issue 147]
        
    // if this will be underneath any commands e.g. "new Message" / "Event" / "Task", then a separator is nice
    if (templates.length && msgPopup.childNodes.length && msgPopup.lastChild.tagName!="menuseparator") { 
      let menuseparator = document.createXULElement("menuseparator");
      menuseparator.id = "fileTemplates-" + composeType + "msg-top";
      menuseparator.classList.add ("st4templateSeparator");
      msgPopup.appendChild(menuseparator);
    } 
    
    for (let i=0; i<templates.length; i++) {
      let cat = templates[i].category,
          isAddNewCategory = false,
          isAddMaxCategoriesWarning = false;
      // if maximum number of "free / standard" submenus is exceeded, group into "other"
      if (cat && !categories.includes(cat)) {
        if (!util.hasProLicense && categories.length>=MAX_STANDARD_CATEGORIES) {
          cat = "Other";
          templates[i].category = cat;  // write back to data!
          if (!categories.includes(cat)) {
            categories.push(cat);
            isAddNewCategory = true;
            isAddMaxCategoriesWarning = true;
          }
        }
        else {
          categories.push(cat);
          isAddNewCategory = true;
        }
      }
      if (isAddNewCategory) {
        catAccelerator.push(1);
        // add a menupopup for the category
        let menu = document.createXULElement("menu"),
            acCat = getAccessKey(acceleratorCat++);
        menu.classList.add("menuitem-iconic");
        menu.classList.add("st4templateCategory");
        menu.setAttribute("st4uiElement", "true");
        menu.setAttribute("accesskey", acCat); // A,B,C
        let lbl = acCat ? (acCat + " " + cat) : cat;
        if (cat == "Other") {
          // localized label
          lbl = util.getBundleString("template.category.other");
        }
        menu.setAttribute("label", lbl);
        let menupopup = document.createXULElement("menupopup");
        menupopup.setAttribute("templateCategory", cat);
        menupopup.setAttribute("st4uiElement", "true");
        if (isAddMaxCategoriesWarning) {
          let wrn = util.getBundleString("st.fileTemplates.restrictTemplateCats", [MAX_STANDARD_CATEGORIES.toString()]);
          let menuitem = document.createXULElement("menuitem");
          menuitem.classList.add("st4templateEntry");
          menuitem.classList.add("menuitem-iconic");
          menuitem.setAttribute("label", wrn);
          menuitem.addEventListener("command",
            function(event) { 
              event.stopImmediatePropagation();
              // open licenser
              util.showLicenseDialog("MAX_STANDARD_CATEGORIES"); 
              return false; 
            }, 
            {capture:true } ,  
            true
          );
          menupopup.appendChild(menuitem);
        }

        menu.appendChild(menupopup);
        msgPopup.appendChild(menu);
      }
    }
      
    let menuHasRestrictions = false; // set this if any maximum is exceeded!
		for (let i=0; i<templates.length; i++) {
			let theTemplate = templates[i];
      /* insert one item for each listed html template */
			let menuitem = document.createXULElement("menuitem"),
          acKey = "";

			menuitem.setAttribute("st4uiElement", "true");
			menuitem.setAttribute("st4composeType", composeType);
			menuitem.classList.add("st4templateEntry");
			menuitem.classList.add("menuitem-iconic");
			if (!isLicensed && i>=MAX_FREE_TEMPLATES) {
				menuitem.disabled = true;
        menuHasRestrictions = true;
			}
      else if (!(util.hasProLicense) && i>=MAX_STANDARD_TEMPLATES) {
        menuitem.disabled = true;
        menuHasRestrictions = true;
      }
			
			// if this is a non-native menupopup (we created it)
			// we need to add an event handler to notify the parent button.
			menuitem.addEventListener("command", 
				function(event) { 
          if (prefs.isDebugOption('fileTemplates.menus')) debugger;
					event.stopImmediatePropagation();
					
					util.logDebugOptional("fileTemplates", "Click event for fileTemplate:\n"
						+ "composeType=" + composeType + "\n"
						+ "template=" + theTemplate.label);
					fT.onItemClick(menuitem, msgPopup.parentNode, fT, composeType, theTemplate.path, theTemplate.label, event, singleParentWindow); 
					return false; 
				}, 
				{capture:true } , 
				true);
			// stop command event from bubbling up.
			// menuitem.addEventListener("command", function(event) { event.stopImmediatePropagation(); } );
			
      let cat = theTemplate.category;
      if (cat) {
        let popup = msgPopup.querySelector(`[templateCategory=${cat}]`);
        if (popup) {
          popup.appendChild(menuitem);
          acKey = getAccessKey(popup.childElementCount);
        }
        else { // fail
          acKey = getAccessKey(accelerator++);
          if (acKey) {
            menuitem.setAttribute("accesskey", acKey);
          }        
          msgPopup.appendChild(menuitem);
        }
      }
      else {
        acKey = getAccessKey(accelerator++);
        if (acKey) {
          menuitem.setAttribute("accesskey", acKey);
        }        
        msgPopup.appendChild(menuitem);
      }
      menuitem.setAttribute("label", (acKey ? (acKey + " ") : "") + theTemplate.label);
      
		}
    if (menuHasRestrictions) {
      // add an explanation about why some template items are disabled.
      let menuItem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem");
      menuItem.setAttribute("label", util.getBundleString("st.fileTemplates.restrictionQuestion"));
      menuItem.setAttribute("st4uiElement", "true");
      menuItem.setAttribute("st4composeType", composeType);
      menuItem.classList.add("menuItem-iconic");
      menuItem.classList.add("st4templateInfo");      
      menuItem.addEventListener("command", 
        function(event) { 
          event.stopImmediatePropagation();
          let txt = util.getBundleString("st.fileTemplates.restrictTemplates",[MAX_FREE_TEMPLATES.toString(), MAX_STANDARD_TEMPLATES.toString()]);
          let mainLicenser = util.Mail3PaneWindow.SmartTemplate4.Licenser;
          SmartTemplate4.Message.display(
            txt, 
            "centerscreen,titlebar,modal,dialog",
            { showLicenseButton: true, 
              feature: "FileTemplatesRestricted",
              ok: function() { ; }},
            
            
            singleParentWindow || util.Mail3PaneWindow
          );
          return false;
        }, 
        {capture:true } , 
        true
      );
      msgPopup.appendChild(menuItem);	
    }
		
		/* add an item for choosing ad hoc file template - uses file picker */
		let menuitem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem"),
		menuTitle = util.getBundleString("st.fileTemplates.openFile");		
		menuitem.setAttribute("label", menuTitle);
		menuitem.setAttribute("st4uiElement", "true");
		menuitem.setAttribute("st4composeType", composeType);
		menuitem.classList.add("st4templatePicker");
		menuitem.classList.add("menuitem-iconic");
		// add a file open mechanism
		menuitem.addEventListener("command", 
			function(event) { 
			  event.stopImmediatePropagation();
				util.logDebugOptional("fileTemplates", "Click event for open file Template - stopped propagation.\n"
					+ "composeType=" + composeType);
				// fT.onItemClick(menuitem, msgPopup.parentNode, fT, composeType, theTemplate.path, "File Template"); 
				fT.onSelectAdHoc(fT, composeType, msgPopup, msgPopup.parentNode, singleParentWindow);
				return false; 
			}, 
			{capture:true } , 
			true);
      
		msgPopup.appendChild(menuitem);	
    
		/* [item 29]  Add configuration item to file template menus. */
    if (showConfigureItem) {
      menuitem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem");
      menuTitle = util.getBundleString("st.fileTemplates.configureMenu");
      menuitem.setAttribute("label", menuTitle);
			menuitem.setAttribute("st4uiElement", "true");
      menuitem.setAttribute("st4composeType", composeType);
      menuitem.classList.add("menuitem-iconic");
      menuitem.classList.add("st4templateConfig");
      
      menuitem.addEventListener("command", 
        function(event) { 
          event.stopImmediatePropagation();
          let win = SmartTemplate4.Util.Mail3PaneWindow,
              params = {inn:{mode:"fileTemplates",tab:-1, message: "", instance: win.SmartTemplate4, composeType: composeType}, out:null};
          win.openDialog('chrome://smarttemplate4/content/settings.xhtml', 
            'Preferences', 
            'chrome,titlebar,toolbar,centerscreen,dependent,resizable',
            null,
            params);
          return false; 
        }, 
        { capture:true } , 
        true);

      msgPopup.appendChild(menuitem);	
    }
    
		// push stationery separator down to the bottom - Stationery appends its own items dynamically.
		if (lastChild && lastChild.tagName == 'menuseparator') {
			msgPopup.appendChild(lastChild);
		}
		msgPopup.setAttribute("st4configured", true);
	} ,
	
	// find menupopup in button's childNodes. If there is no menupopup, then append a new one.
	getPopup: function (buttonName, parent = null) {
		let doc = document,
				element;
		if (parent) {
			let tb = parent.getElementsByTagName('toolbar'); // toolbar collection
			if (tb.length) {
				// iterate NodeList:
				tb[0].childNodes.forEach( 
				  function(cV, cI, id) { 
					  if (cV.tagName=="toolbaritem") { // drill down into "smart" reply buttons - hdrSmartReplyButton item
							cV.childNodes.forEach(
							  function(bV, bI, id) {
									if (buttonName == bV.id ) {  // && !bV.getAttribute('hidden')
										element = bV;
									}
								}
							);
						}
						else
							// make sure the button is not hidden!
							if (buttonName == cV.id ) {  // !cV.getAttribute('hidden')
								element = cV;
							}
					}
				);
			}
		}
		else
			element = document.getElementById(buttonName);
		
		if (!element) return null;
		const nodes = element.childNodes;
		if (nodes.length) {
			for (let i = 0; i < nodes.length; ++i) {
				if (nodes[i].nodeName == 'menupopup') {
					return nodes[i];
				}
			}
		}
		
		// there is no existing menu popup, let's create one.
		let menupopup = doc.createXULElement ? doc.createXULElement('menupopup') : doc.createElement('menupopup');
		// we do not want to add the click handler on the hdr buttons as the button click is already triggered. (?)
		menupopup.setAttribute("st4nonNative", true);
    
		element.appendChild(menupopup);
		return menupopup;		
	} ,
	
  initMenusWithReset: function() {
    SmartTemplate4.Util.logDebug("Refreshing fileTemplate menus...");
    SmartTemplate4.fileTemplates.initMenus(true);
  },
  
  initMenus: function (reset = false) {
		const util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
    let loc = "";
    try { 
      if (window)
        loc = window.document.URL; 
    }
    catch(ex) {;}
          
    util.logDebugOptional("notifications.menus", "fileTemplates.initMenus()...[" + loc + "]");
		function logDebug (t) {
			util.logDebugOptional("fileTemplates", t);
		} 
    function needsConfig(menu) {
      if (!menu) return false;
      if (reset) return true;
      return (!menu.getAttribute('st4configured'));
    }
    function isInHeaderArea(popup) {
      let p = popup.parentNode;
      if (p) p = p.parentNode;
      if (p && p.id && p.id.startsWith("header-"))
        return true;
      return false;
    }
    // obsolete workaround (now replaced with TbSync's hackToolbarbutton script)
    // use a fake parent button for inserting
    // if we pass original btn, check if it is already a toolbarbuttion-menu-button and thus already has a menu
    function insertMenuTb78(popupId, btnId, originalBtn = null) {
      let theMsgPopup = document.getElementById(popupId),
          originalPopup = null;
      try {
        if (!theMsgPopup || !theMsgPopup.parentNode || !theMsgPopup.parentNode.id.endsWith('-ST')) {
          if (originalBtn && originalBtn.getAttribute("is")=="toolbarbutton-menu-button") {
            // already have a menu, find matching childElement
            for (let m of originalBtn.childNodes) {
              if (m.tagName == 'menupopup') {
                // originalPopup = m;
                return m; // return original popup
                break;
              }
            }
          }
          
          let btn = document.getElementById(btnId);
          if (btn) {
            theMsgPopup = SmartTemplate4.fileTemplates.getPopup(btn.id); 
            // TEST TEST TB78
            if (theMsgPopup.id) debugger;
            if (theMsgPopup && !theMsgPopup.id) {
              theMsgPopup.id = popupId;
              btn.type = "menu-button";
              // attach the menupopup
              btn.appendChild(theMsgPopup);
              //let subButton=SmartTemplate4.Util.getAnonymousElementByAttribute(btn, "label", "stwrite");
              
              // hide the main button, add negative margin using te class STfakePopupBtn:
              btn.firstChild.classList.add("STfakePopupBtn");
            }
            let originId = btn.getAttribute("insertafter");
            originalBtn = document.getElementById(originId);
          }
          // only show if the "original button" actually exists / is shown on toolbar.
          if (originalBtn) {
            btn.hidden = originalBtn.hidden || false;
            // btn.setAttribute("hidden", originalBtn.getAttribute("hidden"));
            // move to the correct position!
            originalBtn.parentNode.insertBefore(btn, originalBtn.nextSibling);
            // btn
          }
        }
      }
      catch(ex) {
        util.logException("insertMenuTb78(" + popupId + ", " + btnId + ")", ex);
      }
      return theMsgPopup;
    }
        
		// check for toolbar 1st
		let toolbar = document.getElementById('mail-bar3');
		logDebug("initMenus() - toolbar: " + toolbar);
		if (toolbar) {
			// load current template list
			const fileTemplates = SmartTemplate4.fileTemplates; // closure for the promise, just in case
			fileTemplates.loadCustomMenu(false).then(
				function smartTemplatesLoaded() {
					let count = fileTemplates.entriesLength;
					logDebug("Loaded " + count + " templates, now preparing compose button submenus…");
					
					// 0) clear all old items if they exist
					let separators = document.getElementsByClassName("st4templateSeparator"),
							items = document.getElementsByClassName("st4templateEntry"),
              categories = document.getElementsByClassName("st4templateCategory"),
							pickers = document.getElementsByClassName("st4templatePicker"),
              configurators = document.getElementsByClassName("st4templateConfig"),
              infoitems = document.getElementsByClassName("st4templateInfo");
					logDebug("Resetting all menus…");
          
					try {
						 // turn these HTMLCollections into Arrays
						Array.from(separators).forEach(el => { 
                let menu = el.parentNode;
                if (!menu.getAttribute('st4configured') || reset)
                  el.parentNode.removeChild(el); 
							} 
						);
						Array.from(items).forEach(el => { 
                let menu = el.parentNode;
                if (!menu.getAttribute('st4configured') || reset)
                  el.parentNode.removeChild(el); 
							} 
						);
						Array.from(pickers).forEach(el => { 
                let menu = el.parentNode;
                if (!menu.getAttribute('st4configured') || reset)
                  el.parentNode.removeChild(el); 
							} 
						);
						Array.from(configurators).forEach(el => { 
                let menu = el.parentNode;
                if (!menu.getAttribute('st4configured') || reset)
                  el.parentNode.removeChild(el); 
							} 
						);
            Array.from(categories).forEach(el => { 
                let menu = el.parentNode;
                if (!menu.getAttribute('st4configured') || reset)
                  el.parentNode.removeChild(el); 
							} 
						);
            Array.from(infoitems).forEach(el => { 
                let menu = el.parentNode;
                if (!menu.getAttribute('st4configured') || reset)
                  el.parentNode.removeChild(el); 
							} 
						);
          } catch (ex) {;}
          
					// 1) write new entries --------------------
					let newMsgPopup = SmartTemplate4.hackToolbarbutton.getMenupopupElement(window, "button-newmsg");
					if (needsConfig(newMsgPopup)) {
						fileTemplates.configureMenu(fileTemplates.Entries.templatesNew, newMsgPopup, "new");
					}
					
					// 2) reply entries     --------------------
					let rspBtns=["button-reply","button-replyall", "button-replylist"];
					for (let rspBtn of rspBtns) {
						//    calling getPopupElement() - if it doesn't exist, the popup will be automatically created & appended to button
						let replyPopup = SmartTemplate4.hackToolbarbutton.getMenupopupElement(window, rspBtn);
						if (replyPopup && !isInHeaderArea(replyPopup) && needsConfig(replyPopup)) {
								fileTemplates.configureMenu(fileTemplates.Entries.templatesRsp, replyPopup, "rsp");
						}
					}

					// 4) ====  preview header area ==== //
					let headerToolbox = document.getElementById('header-view-toolbox');
					if (headerToolbox) {
						logDebug("=============================\n"+
                     "headerToolbox found; adding its template file menus…");
            
						// 4.b) (header) reply entries     -------------------- 
            let hdrBtns=["hdrReplyButton","hdrReplyAllButton","hdrReplyListButton","hdrFollowupButton",
                        "hdrReplyToSenderButton"]; // ,"button-reply","button-replyall", "button-replylist"
            for (let hdrBtn of hdrBtns) {
							let popup = SmartTemplate4.hackToolbarbutton.getMenupopupElement(window, hdrBtn);
              if (needsConfig(popup)) {
                fileTemplates.configureMenu(fileTemplates.Entries.templatesRsp, popup, "rsp");
              }
            }
						
						// 4.d) (header) forwarding entries --------------------
						// what about hdrDualForwardButton => this one was from compactHeader.
            let hfBtns=['hdrForwardButton','button-forward','hdrDualForwardButton'];
            for (let hdrBtn of hfBtns) {
              let popup = SmartTemplate4.hackToolbarbutton.getMenupopupElement(window, hdrBtn);
              if (needsConfig(popup)) {
                fileTemplates.configureMenu(fileTemplates.Entries.templatesFwd, popup, "fwd");
              }
            }
					}
					else {
						logDebug("headerToolbox NOT found!");
					}
				}
			);
		}
		
	}	,
	
	pickFileFromSettings: function pickFileFromSettings() {
    let el = document ?
      document.getElementById('btnPickTemplate') : null;
    if (el) el.classList.remove('pulseRed'); // remove animation. we've found the button!
		this.pickFile(
		  function(localFile) {
				const prefs = SmartTemplate4.Preferences;
				if (localFile) {
					document.getElementById('txtTemplatePath').value = localFile.path;
					// we could potentially parse the file 
					// and find the <title> tag!
					let name = localFile.leafName.replace(".html","").replace(".htm","");
					document.getElementById('txtTemplateTitle').value = name;
					prefs.setStringPref('fileTemplates.path',localFile.parent.path); // store folder as default for next time.
				}
			}
		),
    'fileTemplates.path'
	} ,
	
  // @initialPathPref: defaults to the path setting from menu configuration (ST4 prefs dialog)
  //                   but can be overwritten for remembering a path when open file is selected from reply menu
	pickFile: function fileTemplates_pickFile(lastCallback, initialPathPref='fileTemplates.path') {
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences,
					NSIFILE = Ci.nsIFile || Ci.nsILocalFile;
		
    let filterText = util.getBundleString("fpFilterHtmlTemplate"); //localized text for filePicker filter menu
		
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
				
		// set default path
		if (prefs.getStringPref(initialPathPref)) {
      try {
        let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
        defaultPath.initWithPath(prefs.getStringPref(initialPathPref))
        fp.displayDirectory = defaultPath; // nsILocalFile
      }
      catch (ex) {
        util.logException("Failed to open path: " + defaultPath, ex);
      }
		} 
		
		fp.init(window, "", fp.modeOpen);

    fp.appendFilter(filterText, "*.html; *.htm");
    fp.defaultExtension = 'html';
		
		
    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK) {
        if (fp.file) {
          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          try {
						// execut the last callback:
						lastCallback(fp.file);
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
  }  ,
	
	// origin: "new", "rsp", "fwd"
	onItemClick: function fileTemplate_onItemClick (menuitem, btn, fileTemplateInstance, composeType, path, label, originalEvent, singleMwindow) {
		const util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
    let isSnippet = (btn && btn.id == "smarttemplate4-insertSnippet");
    if (isSnippet) {
      // overwrite with correct compose type
      composeType = util.getComposeType();
    }
    
    let entry = 
		  { 
				composeType: composeType, 
				path: path, 
				label: label
			};
      
    if (!isSnippet) {
      fileTemplateInstance.armedEntry = entry;
      // now remember the correct template for the next composer window!
      // - note: in single messafe windows this won't work as it cannot determine its "real" parent window
      //         therefore we must copy this into the most recent 3pane window to marshall this info through
      ////  originalEvent.view ? originalEvent.view.window.URL.endsWith("messageWindow.xul") : false;
      let isSingleMessage = singleMwindow ? true : false;
      if (isSingleMessage && singleMwindow == window) {
        let fTMain = util.Mail3PaneWindow.SmartTemplate4.fileTemplates;
        fTMain.armedEntry = fileTemplateInstance.armedEntry; // copy to last main window
      }
    }
			
		util.logDebug("fileTemplate_onItemClick\n" 
		  + "template:" + label + "\n"
			+ "path:" + path);
			
		let popup = menuitem.parentNode,
        isSmartReplyBtn = 
          (btn.parentElement.id == "hdrSmartReplyButton") ||
          (btn.id == "button-forward"); // contains all "smart" buttons
        
    if (btn.id=="smarttemplate4-changeTemplate") {  
      // [issue 24] select different template from composer window
      SmartTemplate4.notifyComposeBodyReady(null, true, window);
    }
    else if (btn.id == "smarttemplate4-insertSnippet") {
      // [issue 142] insert html Smart snippets within Composer at cursor
      SmartTemplate4.fileTemplates.insertFileEntryInComposer(entry);
    }
    else if (popup.getAttribute("st4configured") 
        || popup.getAttribute("templateCategory")  // [issue 162] reply button in main toolbar not working!
        || isSmartReplyBtn) {
      //    popup.getAttribute("st4nonNative") 
			//  || btn.id=="button-newmsg"
			//  || btn.id=="button-forward"  
			//  || btn.id=="button-reply"
			// we need to trigger the button.
			// in Thunderbird 68 for some reason it is not done on the message header page buttons automatically. 
			// Guess they have event handlers on the submenu items cmd_forwardInline and cmd_forwardAttachment
      // we may want to control which of these 2 are triggered (inline or attach), but I guess 
			// without specifying it will likely be the Thunderbird account defaults
			util.logDebugOptional("fileTemplates","firing btn.click() …");
      if (isSmartReplyBtn) {
        const isAlt = originalEvent.altKey, 
              isCtrl = originalEvent.ctrlKey, 
              isShift = originalEvent.shiftKey;
        let buttonNo = 0,
            buttons = btn.parentElement.childNodes,
            popupMenuItems = menuitem.parentElement.childNodes;
        
        /* select first second third or fourth button. default is the first one (usally reply all): */
        if (prefs.isDebugOption("fileTemplates.menus")) debugger;
        if (isShift) buttonNo = 1;
        if (isCtrl) buttonNo = 2;
        if (isShift && isCtrl) buttonNo = 3;
        // find out whether to chose the top (default) command or one below.
        let counter = 0;
        for (let c=0; c<popupMenuItems.length; c++) {
          if (popupMenuItems[c].tagName != "menuitem") continue;
          if (popupMenuItems[c].getAttribute('hidden')=='true') continue;
          if (buttonNo == counter) { 
            let ob = popupMenuItems[c].getAttribute('observes');
            if (ob) {
              originalEvent.stopPropagation();
              util.logDebugOptional("fileTemplates","triggering click event for command: " + ob);
              return popupMenuItems[c].click();
            }
            
            switch(popupMenuItems[c].id) {
              case "hdrReplyList_ReplyListSubButton":  // first item
              case "hdrReplyAll_ReplyAllSubButton":
              case "hdrRelplyList_ReplyAllSubButton": // genuine typo from Tb
              case "hdrReplyList_ReplyAllSubButton":  // in case they fix it :)
              case "hdrReplySubButton":
              case "hdrReplyList_ReplySubButton":
              case "button-ForwardAsInlineMenu":
              case "button-ForwardAsAttachmentMenu":
                util.logDebugOptional("fileTemplates","Clicking the menu item: " + popupMenuItems[c].id);
                return popupMenuItems[c].click();
              default:
                util.logDebugOptional("fileTemplates","Click direct, Smart Button id:"  + popupMenuItems[c].id);
                return btn.click(); // or fire the standard command event? 
            }
          }
          counter++;
        }
      }
      else
        btn.click(); // or fire the standard command event? 
		}
		else {
			util.logDebugOptional("fileTemplates","+======++++++======++++++======+\nNo click event fired for button id=" + btn.id);
		}
		// for retrieval we need to check this from composer window (by asking original window)
		// and then reset to null. fileTemplateInstance = mail3pane.SmartTemplate4.fileTemplates
		// should work when multiple mail windows are open, as long as we can determine the opener
		// of composer. also there should always only be one active at a time (after clicking teh create from template)
		// reset is absolutely necessary to not trigger the template functionality whe the "ordinary" write buttons 
		// are clicked.
	} ,
	
  insertFileEntryInComposer: function (entry) {
    let theFileTemplate = entry;
    let fileTemplateSource = SmartTemplate4.fileTemplates.retrieveTemplate(theFileTemplate);
    let html = fileTemplateSource.HTML;
    if (!html)
      html = tmpTemplate.Text;
    
    // [issue 164] - placeholder for selected text
    if (html.includes("*selection*")) {
      let sel = gMsgCompose.editor.selection,
          selectedText = "";
      if (sel && sel.anchorNode) {
        if (sel.rangeCount) {
          let range = sel.getRangeAt(0);
          selectedText = range.toString();
        }
        if (selectedText && selectedText.length)
          html = html.replace("*selection*", selectedText);
        else
          html = html.replace("*selection*", "%cursor%");
      }
      else
        html = html.replace("*selection*", "%cursor%");
      
      if (!SmartTemplate4.Util.hasProLicense) {
        SmartTemplate4.Util.addUsedPremiumFunction("snippetSelection");
        if (!SmartTemplate4.Util.hasLicense() || SmartTemplate4.Util.licenseInfo.keyType==2) {
          SmartTemplate4.Util.popupLicenseNotification(SmartTemplate4.Util.premiumFeatures, true, true);
        }  
        SmartTemplate4.Util.clearUsedPremiumFunctions();
      }
      
    }
    
    let flags = SmartTemplate4.PreprocessingFlags;
    SmartTemplate4.initFlags(flags);
    if (fileTemplateSource.failed) {
      let text = SmartTemplate4.Util.getBundleString("st.fileTemplates.error.filePath");
      SmartTemplate4.Message.display(
        text.replace("{0}", theFileTemplate.label).replace("{1}", theFileTemplate.path),
        "centerscreen,titlebar,modal,dialog",
        { ok: function() {  
                // get last composer window and bring to foreground
                let composerWin = Services.wm.getMostRecentWindow("msgcompose");
                if (composerWin)
                  composerWin.focus();
              }
        }, 
        ownerWin
      );
    }
    else {
      flags.isFileTemplate = true;
      if (!flags.filePaths) flags.filePaths = [];
      flags.filePaths.push(theFileTemplate.path); // remember the path. let's put it on a stack.
      //SmartTemplate4.smartTemplate.insertTemplate(false, window.SmartTemplate4.PreprocessingFlags, fileTemplateSource);
      let idkey = SmartTemplate4.Util.getIdentityKey(document);
      const ignoreHTML = true;
      let code =  
        SmartTemplate4.smartTemplate.getProcessedText(html, idkey, SmartTemplate4.Util.getComposeType(), ignoreHTML);
      gMsgCompose.editor.insertHTML(code); 
      // we should probably place the cursor at the end of the inserted HTML afterwards!
      
      flags.filePaths.pop();
    }    
  } ,
  
  onExternalMailProcess: function(data, composeType) {
    // similar to onItemClick / onSelectAdHoc
    console.log("SmartTemplates.fileTemplates.onExternalMailProcess()");
    console.log(composeType, data);
    let msgHeader = data.messageHeader;
    
    SmartTemplate4.fileTemplates.armedEntry = 
    { 
      composeType: composeType, 
      path: data.templateURL, 
      message: msgHeader
    };
    // simulate a reply to this message!
    debugger;
    let realMessage = SmartTemplate4.Util.extension.messageManager.get(msgHeader.id);
    let uri = realMessage.folder.getUriForMsg(realMessage);   
    
      
  },
  
	onSelectAdHoc : function onSelectAdHoc(fileTemplateInstance, composeType, popup, btn, singleMsgWindow) {
		// prepare a callback function for "arming" the template file info
		this.pickFile(
		  function(localFile) {
				const prefs = SmartTemplate4.Preferences,
              util = SmartTemplate4.Util;
				if (localFile) {
					// we could potentially parse the file 
					// and find the <title> tag!
					let name = localFile.leafName.replace(".html","").replace(".htm","");
					// should we store folder as default for next time?
					// prefs.setStringPref('fileTemplates.path',localFile.parent.path); 
					
					// now remember the correct template for the next composer window!
					fileTemplateInstance.armedEntry = 
						{ 
							composeType: composeType, 
							path: localFile.path, 
							label: name
						};
            
          if (singleMsgWindow) {
            let fTMain = util.Mail3PaneWindow.SmartTemplate4.fileTemplates;
            fTMain.armedEntry = fileTemplateInstance.armedEntry; // copy to last main window
          }
            
          prefs.setStringPref('fileTemplates.instantPath',localFile.parent.path); // store folder as default for next time.
					// we need to trigger the button.
					// in Thunderbird 68 for some reason it is not done on the message header pagen buttons automatically. 
					// Guess they have event handlers on the submenu items cmd_forwardInline and cmd_forwardAttachment
					// we may want to control which of these 2 are triggered (inline or attach), but I guess 
					// without specifying it will likely be the Thunderbird account defaults
					btn.click();
				}
			},
      'fileTemplates.instantPath'
		)
	},
	
	readHTMLTemplateFile : function readHTMLTemplateFile(template) {
		const Ci = Components.interfaces,
					Cc = Components.classes,
					util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences;	
		// template.filePath = templateUrlToRealFilePath(template.url);
		function toUnicode(charset, data) {
			let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
			converter.charset = charset;
			try {
				return converter.ConvertToUnicode(data);
			}
			catch(ex) {
        var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
				let parentWin = Services.wm.getMostRecentWindow("msgcompose"),
				    errText = util.getBundleString("st.fileTemplates.error.charSet");
				SmartTemplate4.Message.display(
				  errText.replace("{1}", charset),
					"centerscreen,titlebar,modal,dialog",
				  { ok: function() {  
					        // get last composer window and bring to foreground
									let composerWin = Services.wm.getMostRecentWindow("msgcompose");
									if (composerWin)
										composerWin.focus();
					      }
					}, 
					parentWin
				);
				return data.toString();
			}
		}						
					
		const { FileUtils } = 
			ChromeUtils.import ?
			ChromeUtils.import('resource://gre/modules/FileUtils.jsm') :
			Components.utils.import("resource://gre/modules/FileUtils.jsm");
				
		try {
			// code from template-disk.jsm readHTMLTemplateFile()
			let data = "",
					//read file into a string so the correct identifier can be added
					fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
					cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream),
					inStream =		Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream),
					countRead = 0;
			
			try {
				let isFU = FileUtils && FileUtils.File,
						localFile;

				if (isFU) {    // not in Postbox
					localFile	=	new FileUtils.File(template.path);
				}
				else {
					localFile	= Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
					localFile.initWithPath(template.path);
				}
				
				if (!localFile.exists()) {
					let text = util.getBundleString("st.fileTemplates.error.filePath");
					
					this.lastError = text.replace('{0}', template.label).replace('{1}', template.path);
					return false;
				}
				
				fstream.init(localFile, 1, 0, null);
				inStream.init(fstream);
				//read header, look for BOM (byte-order-mark) characters.
				let bom = inStream.read(3);
				fstream.seek(fstream.NS_SEEK_SET, 0);
				
				let bomCharset = false;
				// "a file with the first three bytes 0xEF,0xBB,0xBF is probably a UTF-8 encoded file"
				if (bom.charCodeAt(0) == 239 && bom.charCodeAt(1) == 187 && bom.charCodeAt(2) == 191) bomCharset = 'UTF-8'; //UTF-8 BOM
				if (bom.charCodeAt(0) == 255 && bom.charCodeAt(1) == 254) bomCharset = 'UTF-16LE';  //UTF-16 LE BOM
				if (bom.charCodeAt(0) == 254 && bom.charCodeAt(1) == 255) bomCharset = 'UTF-16BE';  //UTF-16 BE BOM
				
				if (bomCharset) {
					//This is kind of Unicode encoded file, it can't be read using simple scriptableinputstream, because it contain null characters (in terms of 8-bit strings). 
					inStream.close();
					//reinit "is" because inStream.close(); closes "is" too
					fstream.init(localFile, 1, 0, null);
					
					inStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream); // Stationery.XPCOM('nsIConverterInputStream');
					inStream.init(fstream, bomCharset, fstream.available(), inStream.DEFAULT_REPLACEMENT_CHARACTER);
					let str = {};
					while (inStream.readString(-1, str) != 0) {
						template.HTML = template.HTML + str.value;
					}
					inStream.close();
					
				} else {
					template.HTML = inStream.readBytes(inStream.available());
					inStream.close();

					//looking for charset definition in file, and recode file to unicode
					//try speed up, by copying all text till </head> into a variable
					let head;
					let headEndIndex = template.HTML.indexOf('</head');
					if (headEndIndex > -1) {
						let headStartIndex = template.HTML.indexOf('<head');
						if (headStartIndex<0) headStartIndex=0;
						head = template.HTML.substring(headStartIndex, headEndIndex);
						util.logDebugOptional("fileTemplates","Found a <head> element - determining charset next.");
					} else {
						head = template.HTML;
					}

					let charSet = head.match(/<\?.*xml .*encoding *= *["'](.*)["'].*\?>/i);
					if (charSet) {
						charSet = charSet[1];
					}
					else {
						charSet = head.match(/<meta charset="(.*)"/i);
						if (charSet) {
							charSet = charSet[1];
							util.logDebugOptional("fileTemplates","Found charset from HTML5 style meta tag: " + charSet);
						} 
						else {
							charSet = head.match(/<META +HTTP-EQUIV *= *["']Content-Type["'].*CONTENT *= *["'].*; *charset= *["']?(.*?)["']?["'].*>/i);
							if (charSet) {
								charSet = charSet[1];
								util.logDebugOptional("fileTemplates","Found charset from HTML4 HTTP-EQUIV tag: " + charSet);
							}
							else {
								charSet = head.match(/<META +CONTENT *= *["'].*; *charset= *["']?(.*?)["']?["'].*HTTP-EQUIV *= *["']Content-Type["'].*>/i);
								if (charSet) {
									charSet = charSet[1];
									util.logDebugOptional("fileTemplates","Found charset from HTML4 CONTENT tag: " + charSet);
								}
							}
						}
					}
					if (!charSet) {
						charSet =  "UTF-8"; // Stationery.getPref('DefaultTemplateEncoding');
						util.logDebugOptional("fileTemplates", "No charset found, defaulting to: " + charSet);
					}
					if (charSet) {
						template.HTML = toUnicode(charSet, template.HTML);
            template.charset = charSet;
					}
				}
				
				return true;
			} catch (e) {
				util.logException('readHTMLTemplateFile()', e);
				try { inStream.close(); } catch (e) {}
				try { fstream.close(); } catch (e) {}
			}
		} catch (e) {
			util.logException('readHTMLTemplateFile()', e);
		}
		return false;
	} ,
	
  // retrieve a html structure from the file template
	retrieveTemplate: function(aFileTemplateArmedEntry) {
		const util = SmartTemplate4.Util;
		let template = { 
			Text: "", 
			HTML: "", 
			path: aFileTemplateArmedEntry.path, 
			label: aFileTemplateArmedEntry.label,
      failed: false,
      charset: null			
		};
		if (this.readHTMLTemplateFile(template)) {
			try { 
				// let HTMLEditor = gMsgCompose.editor.QueryInterface(Components.interfaces.nsIHTMLEditor);
				let html = "";
				if ('HTML' in template) 
					html = template.HTML;
				else 
					if ('Text' in template)
						html = template.Text; // Stationery.plainText2HTML()
								
				// HTMLEditor.rebuildDocumentFromSource(html);
			}
			catch(ex) {
				util.logDebug("fileTemplates.applyTemplate()", ex);
				template.failed = true;
			}
			finally {
				// gMsgCompose.editor.endTransaction();
			}
		}
		else 
			template.failed = true;
		
		return template;
	}
	
		
}