"use strict";
/* 
	BEGIN LICENSE BLOCK
	
	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension
	
	END LICENSE BLOCK 
*/

// replace basic Stationery functionality:
// support external files that can be selected during the button press
// write / reply and forward.



SmartTemplate4.fileTemplates = {
	Entries: {
		templatesNew : [],
		templatesRsp : [],
		templatesFwd : []
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
					
    let mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator),
        getWindowEnumerator = 
            (util.isLinux) ?
            mediator.getXULWindowEnumerator :
            mediator.getZOrderXULWindowEnumerator;
		// Thunderbird 63 getNext throws!	
		let en =getWindowEnumerator ('addon:SmartTemplate4', true); 		
		if (en.hasMoreElements()) {
			try {
				let optionsWindow = en.getNext().QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
				return optionsWindow;
			}
			catch(ex) { ; }
		}
		return null;
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
			default:
				return null;
		}
    return this.RichList(flavor);
  },
	
	RichList: function (flavour) {
		return this.document.getElementById('templateList.' + flavour)
	},
	
  populateMenu: function populateMenu(doc, menu) {	
		const util = SmartTemplate4.Util,
		      createElement = doc.createXULElement ? doc.createXULElement.bind(doc) : doc.createElement.bind(doc);
		// alert("to do: populate Menus under write / reply buttons (main window)");
	},
	
	// adds an item to currently visible list
  addItem: function addItem(path, label, lb) {
    let listbox = lb || this.ListBox;
    if (listbox)
      listbox.appendItem(label, path);
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
        let entry = this.CurrentEntries[i];
        // populate the options list
        this.addItem(entry.path, entry.label);
        // populate the Entries array; fallback to browser bookmark type if undefined
      }
    }
    // main menu
    let win = SmartTemplate4.Util.Mail3PaneWindow,
        doc = win.document;
    win.SmartTemplate4.fileTemplates.populateMenu(doc);
  },
	
	// label was changed, auto update the list!
  onEditLabel: function onEditLabel(txt) {
    const util = SmartTemplate4.Util;
    // check if one is selected and we just changed it]
    let path = this.document.getElementById('txtTemplatePath').value,
        label = this.document.getElementById('txtTemplateTitle').value,
        listbox = this.ListBox,
        idx = listbox.selectedIndex;
		util.logDebugOptional("fileTemplates","onEdit();");
    if (idx ==-1) return;
    let e = this.CurrentEntries[idx];
    // check if path matches
		if (e.path != this.document.getElementById("txtTemplatePath").value)
			return; // this is not a match. Let's not change the label
		
		if (e.label == label) {
			return;
		}
		
		// change label in listm then savee & reload.
		e.label = txt.value;

    this.saveCustomMenu();
    this.repopulate(true); // rebuild menu
		listbox.selectedIndex = idx; // reselect item
  } ,  	
	
	onSelect: function(rlb) {
		let richlistitem = rlb.getSelectedItem(0);
		if (richlistitem) {
			document.getElementById('txtTemplatePath').value = richlistitem.value;
			document.getElementById('txtTemplateTitle').value = richlistitem.label;
		}
	} ,
	
  update: function update(isNew) {
    const util = SmartTemplate4.Util,
		      getBundleString = util.getBundleString.bind(util),
					FT = SmartTemplate4.fileTemplates;
					
		var { Services } = 
			ChromeUtils.import ?
			ChromeUtils.import('resource://gre/modules/Services.jsm') :
			Components.utils.import('resource://gre/modules/Services.jsm'); // Thunderbird 52

    let path = document.getElementById('txtTemplatePath').value,
        label = document.getElementById('txtTemplateTitle').value,
        existingEntry = null, 
        existingIndex = null;
		
		
    // check if it exists and replace label
		const msgTitle = getBundleString('SmartTemplate4.fileTemplates.wrnSelectUpdateItem.caption','Templates - update')
    if (!isNew) {
      let lb = FT.ListBox;      
      existingIndex = lb.selectedIndex;
      if (existingIndex<0) {
				let txt = getBundleString('SmartTemplate4.fileTemplates.wrnSelectUpdateItem','You have to select an item from the list to update!');
        Services.prompt.alert(null, msgTitle, txt);
        return;
      }
      existingEntry = FT.CurrentEntries[existingIndex];
      existingEntry.path = path;
      existingEntry.label = label;
    }
				
    if (!label.trim()) {
			let txt = getBundleString('SmartTemplate4.fileTemplates.wrnEnterTitle','Please enter a title!');
      Services.prompt.alert(null, msgTitle, txt);
      return;
    }
    if (!path.trim()) {
			let txt = getBundleString('SmartTemplate4.fileTemplates.wrnEnterPath','Please enter a valid path!');
      Services.prompt.alert(null, msgTitle, txt);
      return;
    }
    
    // TO DO:
    // should we allow changing the URL ? (for selected item only)
    // do a match of first n characters and display a confirmation?
    if (!existingEntry) {
      FT.addItem(path, label);
      FT.CurrentEntries.push({path:path, label:label});
    }
    else {
      // update existing item (label)
      util.logDebug('Updating existing item: ' + existingEntry.label + '  [' + existingEntry.path +']');
      let lb = FT.ListBox;
      lb.ensureIndexIsVisible(existingIndex);
      lb.getItemAtIndex(existingIndex).firstChild.value = label;
      FT.CurrentEntries[existingIndex].label = label;
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
		
		const { FileUtils } = 
			ChromeUtils.import ?
			ChromeUtils.import('resource://gre/modules/FileUtils.jsm') :
			Components.utils.import("resource://gre/modules/FileUtils.jsm");
		
		return FileUtils.getFile("ProfD", path); // implements nsIFile
  } ,	
  	
  readStringFile: function readStringFile() {
    // To read content from file
    // const {OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {}); // TextDecoder
		
		const {OS} = (typeof ChromeUtils.import == "undefined") ?
		  Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
		  ChromeUtils.import("resource://gre/modules/osfile.jsm", {});
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
							let entry = E[i];
							// populate the options list(s)
							if (fromOptions) {
								fileTemplates.addItem(entry.path, entry.label, lb);
							}
							// populate the Entries array from read data
							T.push({ path:entry.path, label:entry.label });
						}
						
					}
          
          let data = JSON.parse(CustomMenuData);  
					fillEntries(data.templatesNew, fileTemplates.Entries.templatesNew, fromOptions ? fileTemplates.RichList('new') : null);
					fillEntries(data.templatesRsp, fileTemplates.Entries.templatesRsp, fromOptions ? fileTemplates.RichList('rsp') : null);
					fillEntries(data.templatesFwd, fileTemplates.Entries.templatesFwd, fromOptions ? fileTemplates.RichList('fwd') : null);
					
					
          // util.logDebug ('parsed ' + entries.length + ' entries'); 
        },
        function onFailure(ex) {
          util.logDebug ('readStringFile() - Failure: ' + ex); 
          if (ex.becauseNoSuchFile) {
            // File does not exist);
          }
          else {
            // Some other error
						Components.utils.import("resource://gre/modules/Services.jsm");
            Services.prompt.alert(null, 'SmartTemplate⁴ - loadCustomMenu', 'Reading the fileTemplates file failed\n' + ex);
          }     
          // no changes to Entries array
        }
      );
      
			// main window loading. this part is not necessary if we load into options window.
			if (!fromOptions) {
				promise3 = promise2.then(
					function promise2_populateMenu() {
						const mwin = util.Mail3PaneWindow,
									doc = mwin.document;
						util.logDebug ('promise2.then populateMenu() ...'); 
						mwin.SmartTemplate4.fileTemplates.populateMenu(doc);
						return promise2; // make loadCustomMenu chainable
					},
					function promise2_onFail(ex) {
						util.logDebug ('promise2.then onFail():\n' + ex); 
						Components.utils.import("resource://gre/modules/Services.jsm");
						Services.prompt.alert(null, 'SmartTemplate⁴ - promise2.then', 'Did not load main menu\n' + ex);
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

  saveCustomMenu: function saveCustomMenu()  {
    const util = SmartTemplate4.Util;
    
    try {
      // const {OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
			const {OS} = (typeof ChromeUtils.import == "undefined") ?
				Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
				ChromeUtils.import("resource://gre/modules/osfile.jsm", {});
				
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

	prepareAddTemplateButton_STationery : function() {
		let button = document.getElementById('stationery-button-add-template');
		let menupopup = document.getElementById('stationery-button-add-template-menupopup');
		
		//delete all old items
		for (let i = 0; i < menupopup.childNodes.length; ++i)
			menupopup.childNodes[i].parentNode.removeChild(menupopup.childNodes[i]);
		
		//iterate handlers and add menus
		for (let menuitem of Stationery.templates.getHandlerOptionsAddMenuitemIterator(document)) {
			menupopup.appendChild(
			  Stationery.setupElement(menuitem, {
				  events: [ {name: 'command', value: addTemplateHandler } ],
				}) 
			);
		}
	},
	
	// lbl: [new, rsp, fwd]
	configureMenu: function (templates, msgPopup, composeType) {
		const util = SmartTemplate4.Util,
					fT = SmartTemplate4.fileTemplates,
					maxFreeItems = 3,
					isLicensed = util.hasLicense(false);
		let parent = msgPopup.parentNode;			
					
		util.logDebugOptional("fileTemplates", "Add " + composeType + " templates: " + templates.length + " entries to [" + (parent.id || 'anonymous') + "]");
		// first clear entries:
							
		let lastChild = msgPopup.lastChild;
		for (let i=0; i<templates.length; i++) {
			let theTemplate = templates[i];
			// this will be underneath any commands e.g. "new Message" / "Event" / "Task", so a separator is nice
			if (i==0 && msgPopup.childNodes.length && msgPopup.lastChild.tagName!="menuseparator") { 
				let menuseparator = document.createXULElement ? document.createXULElement("menuseparator") : document.createElement("menuseparator");
				menuseparator.id = "fileTemplates-" + composeType + "msg-top";
				menuseparator.classList.add ("st4templateSeparator");
				msgPopup.appendChild(menuseparator);
			}
			
      /* insert one item for each listed html template */
			let menuitem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem");
			menuitem.setAttribute("label", theTemplate.label);
			menuitem.setAttribute("st4composeType", composeType);
			menuitem.classList.add("st4templateEntry");
			menuitem.classList.add("menuitem-iconic");
			if (!isLicensed && i>=maxFreeItems) {
				menuitem.disabled = true;
			}
			
			// if this is a non-native menupopup (we created it)
			// we need to add an event handler to notify the parent button.
			menuitem.addEventListener("click", 
				function(event) { 
					event.stopImmediatePropagation();
					if (event.target.disabled) {
						let txt = util.getBundleString("SmartTemplate4.notification.restrictTemplates", "You need a SmartTemplate⁴ license to use more than {1} templates!");
						
						SmartTemplate4.Message.display(
							txt.replace("{1}", maxFreeItems), 
							"centerscreen,titlebar,modal,dialog",
							{ ok: function() { ; }},
							util.Mail3PaneWindow
						);
						return false;
					}
					
					util.logDebugOptional("fileTemplates", "Click event for fileTemplate:\n"
						+ "composeType=" + composeType + "\n"
						+ "template=" + theTemplate.label);
					fT.onItemClick(menuitem, msgPopup.parentNode, fT, composeType, theTemplate.path, theTemplate.label, event); 
					return false; 
				}, 
				{capture:true } , 
				true);
			// stop command event from bubbling up.
			menuitem.addEventListener("command", function(event) { event.stopImmediatePropagation(); } );
			
			msgPopup.appendChild(menuitem);									 
		}
		/* add an item for choosing ad hoc file template - uses file picker */
		let menuseparator = document.createXULElement ? document.createXULElement("menuseparator") : document.createElement("menuseparator");
		menuseparator.id = "fileTemplates-" + composeType + "msg-bottom";
		menuseparator.classList.add ("st4templateSeparator");
		msgPopup.appendChild(menuseparator);
		
		let menuitem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem"),
		    menuTitle = util.getBundleString("SmartTemplate4.fileTemplates.openFile","Open SmartTemplate⁴ file template…");
		
		menuitem.setAttribute("label", menuTitle);
		menuitem.setAttribute("st4composeType", composeType);
		menuitem.classList.add("st4templatePicker");
		menuitem.classList.add("menuitem-iconic");
		// add a file open mechanism
		menuitem.addEventListener("click", 
			function(event) { 
			  event.stopImmediatePropagation();
				util.logDebugOptional("fileTemplates", "Click event for open file Template - stopped propagation.\n"
					+ "composeType=" + composeType);
				// fT.onItemClick(menuitem, msgPopup.parentNode, fT, composeType, theTemplate.path, "File Template"); 
				fT.onSelectAdHoc(fT, composeType, msgPopup, msgPopup.parentNode);
				return false; 
			}, 
			{capture:true } , 
			true);
		// stop the oncommand event bubbling up.
		menuitem.addEventListener("command",
			function(event) { 
				event.stopImmediatePropagation();
			}
		);
		msgPopup.appendChild(menuitem);	
    
		/* [item 29]  Add configuration item to file template menus. */
    menuitem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem");
		menuTitle = util.getBundleString("SmartTemplate4.fileTemplates.configureMenu","Configure menu items…");
		menuitem.setAttribute("label", menuTitle);
		menuitem.setAttribute("st4composeType", composeType);
		menuitem.classList.add("menuitem-iconic");
		menuitem.classList.add("st4templateConfig");

		menuitem.addEventListener("click", 
			function(event) { 
			  event.stopImmediatePropagation();
        let win = SmartTemplate4.Util.Mail3PaneWindow,
            params = {inn:{mode:"fileTemplates",tab:-1, message: "", instance: win.SmartTemplate4, composeType: composeType}, out:null};
				win.openDialog('chrome://smarttemplate4/content/settings.xul', 
          'Preferences', 
          'chrome,titlebar,toolbar,centerscreen,dependent,resizable',
          null,
					params);
				return false; 
			}, 
			{capture:true } , 
			true);
		// stop the oncommand event bubbling up.
		menuitem.addEventListener("command",
			function(event) { 
				event.stopImmediatePropagation();
			}
		);
		msgPopup.appendChild(menuitem);	
    
		
		// push stationery separator down to the bottom - Stationery appends its own items dynamically.
		if (lastChild && lastChild.tagName == 'menuseparator') {
			msgPopup.appendChild(lastChild);
		}
		msgPopup.setAttribute("st4configured", true);
	} ,
	
	// find menupopup in button's childNodes. If there is no menupopup, then append a new one.
	getPopup: function (buttonName, parent) {
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
		// we do not want to add the click handler on the hdr buttons as the button click is alreayd triggered. (?)
		// if (!parent)  // issue 14
			menupopup.setAttribute("st4nonNative", true);
		element.appendChild(menupopup);
		return menupopup;		
	} ,
	
  initMenus: function (reset = false) {
		const util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
		function logDebug (t) {
			util.logDebugOptional("fileTemplates", t);
		} 
    function needsConfig(menu) {
      if (!menu) return false;
      if (reset) return true;
      return (!menu.getAttribute('st4configured'));
    }
		// check for toolbar 1st
		let toolbar = document.getElementById('mail-bar3');
		logDebug("initMenus() - toolbar: " + toolbar);
		if (toolbar) {
			// load current template list
			const fT = SmartTemplate4.fileTemplates; // closure for the promise, just in case
			fT.loadCustomMenu(false).then(
				function smartTemplatesLoaded() {
					let count = fT.entriesLength;
					logDebug("Loaded " + count + " templates, now preparing compose button submenus…");
					
					// 0) clear all old items if they exist
					let separators = document.getElementsByClassName("st4templateSeparator"),
							items = document.getElementsByClassName("st4templateEntry"),
							pickers = document.getElementsByClassName("st4templatePicker"),
              configurators = document.getElementsByClassName("st4templateConfig");
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
					} catch (ex) {;}
			
					// 1) write new entries --------------------
					let newMsgPopup = document.getElementById('button-newMsgPopup');
					if (!newMsgPopup) {
						let btn = document.getElementById("button-newmsg");
						newMsgPopup = fT.getPopup(btn.id); 
						if (!newMsgPopup.id) {
							newMsgPopup.id='button-newMsgPopup';
							btn.type = "menu-button";
							// we have a problem of a duplicate composer window in Tb60:
							if (util.versionSmaller(util.AppverFull, "68")) {
								logDebug("Remove st4nonNative flag from newMsgPopup");
								newMsgPopup.removeAttribute("st4nonNative"); // Tb60: avoid triggering btn.click again.
							}
							// attach the menupopup
							btn.appendChild(newMsgPopup);
						}
					}
          
					if (needsConfig(newMsgPopup)) {
						fT.configureMenu(fT.Entries.templatesNew, newMsgPopup, "new");
          }
					
					// 2a) reply entries     --------------------
					//    calling getPopup() - if it doesn't exist, the popup will be automatically created & appended to button
					let replyPopup = fT.getPopup("button-reply"); 
					if (replyPopup) {
						let btn = document.getElementById("button-reply");
						if (!replyPopup.id) {
							replyPopup.id='button-replyMsgPopup';
							btn.type = "menu-button";
							// attach the menupopup
							btn.insertBefore(replyPopup, btn.firstChild);
						}
            if (needsConfig(replyPopup))
						  fT.configureMenu(fT.Entries.templatesRsp, replyPopup, "rsp");
					}
					
					// 2b) reply all entries     --------------------
					replyPopup = fT.getPopup("button-replyall"); 
					if (replyPopup) {
						let btn = document.getElementById("button-replyall");
						if (!replyPopup.id) {
							replyPopup.id='button-replyAllPopup';
							btn.type = "menu-button";
							// attach the menupopup
							btn.insertBefore(replyPopup, btn.firstChild);
						}
            if (needsConfig(replyPopup))
              fT.configureMenu(fT.Entries.templatesRsp, replyPopup, "rsp");
					}
					
					// 3) forwarding entries --------------------
					let fwdMsgPopup = document.getElementById('button-ForwardPopup');
					if (needsConfig(fwdMsgPopup)) {
            fT.configureMenu(fT.Entries.templatesFwd, fwdMsgPopup, "fwd");
          }
					
					// ====  preview header area ==== //
					let headerToolbox = document.getElementById('header-view-toolbox');
					if (headerToolbox) {
						logDebug("headerToolbox found; adding template file menus…");
						
						// 4) (header) reply entries     -------------------- 
            let hrBtns=["hdrReplyButton","hdrReplyAllButton","hdrReplyListButton","hdrFollowupButton","hdrReplyToSenderButton","button-reply","button-replyall"];
            for (let b=0; b<hrBtns.length; b++) {
              let id = hrBtns[b],
                  theB = document.getElementById(id);
              if (theB && theB.parentNode.Id == 'hdrSmartReplyButton') { // skip these and deal with them directly
                if (prefs.isDebugOption("fileTemplates.menus")) debugger;
                replyPopup = fT.getPopup(id, null);
              }
              else
                replyPopup = fT.getPopup(id, headerToolbox); // compactHeader support
              if (needsConfig(replyPopup)) {
                let btn = replyPopup.parentNode;
                if (!replyPopup.id) {
                  replyPopup.id='button-replyMsgPopup'+b;
                  btn.type = "menu-button";
                  // attach the menupopup
                  btn.insertBefore(replyPopup, btn.firstChild);
                }
                fT.configureMenu(fT.Entries.templatesRsp, replyPopup, "rsp");
              }
              if(!replyPopup) logDebug("not found: " + id);            
            }
            
            // 4.1) smart reply button - submenus! parent is
            let smartSM=["hdrReplyAll_ReplyAllSubButton","hdrReplySubButton"];
            for (let b=0; b<smartSM.length; b++) {
              let id=smartSM[b];
              replyPopup = fT.getPopup(id, headerToolbox); // compactHeader support
              if (needsConfig(replyPopup)) {
                let btn = replyPopup.parentNode;
                if (!replyPopup.id) {
                  replyPopup.id='button-replyMsgPopup'+b;
                  btn.type = "menu-button";
                  // attach the menupopup
                  btn.insertBefore(replyPopup, btn.firstChild);
                }
                fT.configureMenu(fT.Entries.templatesRsp, replyPopup, "rsp");
              }
              if(!replyPopup) logDebug("not found: " + id);            
            }

						
						// 5) (header) forwarding entries --------------------
						// what about hdrDualForwardButton ?
            let hfBtns=['hdrForwardButton','hdrDualForwardButton','button-forward'];
            for (let b=0; b<hfBtns.length; b++) {
              let id=hfBtns[b];
              if (prefs.isDebugOption("fileTemplates.menus")) debugger;
              fwdMsgPopup = fT.getPopup(id, headerToolbox); // compactHeader support 'hdrDualForwardButton'
              if (needsConfig(fwdMsgPopup)) {
                let btn = fwdMsgPopup.parentNode;
                btn.type = "menu-button";
                fT.configureMenu(fT.Entries.templatesFwd, fwdMsgPopup, "fwd");
                btn.insertBefore(fwdMsgPopup, btn.firstChild);
                logDebug("added fwdMsgPopup to: " + id);
              }
              if(!fwdMsgPopup) logDebug("not found: " + id);
            }

					}
					else {
						logDebug("headerToolbox NOT found!");
					}
				}
			);
		}
		
	}	,
	
	makeElement: function(doc, elementName, v) {
		if (!('createElement' in doc)) doc = doc.ownerDocument; 
		return this.setupElement(doc.createElement('' + elementName), v);
  },
	
	generateMenuitem: function(document, context) {
    return this.makeElement(document, 'menuitem', {
      label: Stationery._('template.file.menuitem.label'), 
      tooltip: Stationery._('template.file.menuitem.tip'),
    });
  },
	
	setupElement: function(element, v) {
		v = v || {};
		if ('id' in v) element.setAttribute('id', v.id);
		if ('label' in v) element.setAttribute('label', v.label);
		if ('tooltip' in v) element.tooltipText = v.tooltip;
		if ('class' in v) Stationery.addClass(element, v.class);

		if ('attr' in v) for (let a of fixIterator(v.attr)) {
			if ('remove' in a) element.removeAttribute(a.name);
			if ('value' in a) {
				if (('checkbox' in a && a.checkbox && !a.value) || (a.value === null)) {
					Stationery.setCheckboxLikeAttributeToElement(element, a.name, a.value);
				} else {
					element.setAttribute(a.name, a.value);
				}
			}
		}
		if ('events' in v) {
			for (let e of fixIterator(v.events)) {
				element.addEventListener(e.name, e.value, 'useCapture' in e ? e.useCapture : false );
			}
		}
		return element;
	} ,
	
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
		)
	} ,
	
	pickFile: function fileTemplates_pickFile(lastCallback) {
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = SmartTemplate4.Util,
					prefs = SmartTemplate4.Preferences,
					NSIFILE = Ci.nsIFile || Ci.nsILocalFile;
		
    let //localized text for filePicker filter menu
		    strBndlSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
		    bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties"),
        filterText;
		
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
				
		// set default path
		if (prefs.getStringPref('fileTemplates.path')) {
			let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
			defaultPath.initWithPath(prefs.getStringPref('fileTemplates.path'))
			fp.displayDirectory = defaultPath; // nsILocalFile
		} 
		
		fp.init(window, "", fp.modeOpen);
		try {
			filterText = bundle.GetStringFromName("fpFilterHtmlTemplate");
		}
		catch (ex) { 
			filterText ="HTML Template"; 
		}
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
		else { // Postbox
		  fpCallback(fp.show());
		}
    
    return true;    
  }  ,
	
	// origin: "new", "rsp", "fwd"
	onItemClick: function fileTemplate_onItemClick (menuitem, btn, fileTemplateInstance, composeType, path, label, originalEvent) {
		const util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
		// now remember the correct template for the next composer window!
		fileTemplateInstance.armedEntry = 
		  { 
				composeType: composeType, 
				path: path, 
				label: label
			};
			
		util.logDebug("fileTemplate_onItemClick\n" 
		  + "template:" + label + "\n"
			+ "path:" + path);
			
		let popup = menuitem.parentNode,
        isSmartReplyBtn = 
          (btn.parentElement.id == "hdrSmartReplyButton"); // contains all "smart" buttons
        
    
		if (popup.getAttribute("st4nonNative") 
			  || btn.id=="button-newmsg"
			  || btn.id=="button-forward"  
			  || btn.id=="button-reply"
        || isSmartReplyBtn) {
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
	
	onSelectAdHoc : function onSelectAdHoc(fileTemplateInstance, composeType, popup, btn) {
		// prepare a callback function for "arming" the template file info
		this.pickFile(
		  function(localFile) {
				const prefs = SmartTemplate4.Preferences;
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
						
					// we need to trigger the button.
					// in Thunderbird 68 for some reason it is not done on the message header pagen buttons automatically. 
					// Guess they have event handlers on the submenu items cmd_forwardInline and cmd_forwardAttachment
					// we may want to control which of these 2 are triggered (inline or attach), but I guess 
					// without specifying it will likely be the Thunderbird account defaults
					btn.click();
				}
			}
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
				let parentWin = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getMostRecentWindow("msgcompose"),
				    errText = util.getBundleString("SmartTemplate4.fileTemplates.error.charSet",
						  "Problems converting a HTML template from charset [{1}]\n"
							+ "Using raw string data instead.\n"
							+ "If this results in garbled characters, try adding an explicit 'meta charset=' to the head section. Maybe try ISO-8859-1?");
				SmartTemplate4.Message.display(
				  errText.replace("{1}", charset),
					"centerscreen,titlebar,modal,dialog",
				  { ok: function() {  
					        // get last composer window and bring to foreground
									let composerWin = Cc["@mozilla.org/appshell/window-mediator;1"]
										.getService(Ci.nsIWindowMediator).getMostRecentWindow("msgcompose");
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
			
			
			// let file = Stationery.XPCOM('nsIFile');
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
					// template.loadingError = Stationery._f('template.file.not.exists', [template.url])
					let text = util.getBundleString("SmartTemplate4.fileTemplates.error.filePath",
						 "Could not load the file template '{0}' from path:\n{1}\nThe file may have been removed or renamed.");
					
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
		// Stationery_.ApplyHTMLTemplate code
		// 
		let template = { 
			Text:"", 
			HTML:"", 
			path: aFileTemplateArmedEntry.path, 
			label: aFileTemplateArmedEntry.label,
      failed: false			
		};
		if (this.readHTMLTemplateFile(template)) {
			try { 
				// gMsgCompose.editor.beginTransaction();

				// let HTMLEditor = gMsgCompose.editor.QueryInterface(Components.interfaces.nsIHTMLEditor);
				let html = '';
				if ('HTML' in template) 
					html = template.HTML;
				else 
					if ('Text' in template)
						html = Stationery.plainText2HTML(template.Text);
								
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