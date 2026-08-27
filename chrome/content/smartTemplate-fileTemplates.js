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

/*
  globals
    getEnabledControllerForCommand,
    ComposeMessage,
    Recipients2CompFields,
*/


SmartTemplate4.fileTemplates = {
	Entries: {
		templatesNew : [],
		templatesRsp : [],
		templatesFwd : [],
    snippets: [],
	},
  MRU_Entries: [], // [issue 263]

  ControllerMap : new Map([
    ["cmd_newMessage", "new"], 
    ["cmd_reply", "rsp"],
    ["cmd_replyAll", "rsp.all"],
    ["cmd_replyList", "rsp.list"],
    ["cmd_forward", "fwd"],
  ]),

  getComposeTypeFull: function(cmd)  {
    return this.ControllerMap.get(cmd);
  },
  isAPIpatched: false,
  ENTRY_TIMEOUT: 5000, 
	armedEntry: null,
  armedEntryReset: function() {
    if (this.armedEntry == null) { return; }
    if (!this.armedEntry?.messageCount || this.armedEntry.messageCount <= 1) {
      this.armedEntry = null;
      return;
    }
    if ((Date.now() - this.armedEntry.timeStamp > this.ENTRY_TIMEOUT)) {
      this.armedEntry = null;
      return;
    }
    this.armedEntry.messageCount--;
  },
  armEntry({ composeType, path, label, command }) {
    // [issue 379] Allow reply to multiple selected messages.
    const tabmail = document.getElementById("tabmail");
    const view = tabmail?.currentTabInfo?.chromeBrowser?.contentWindow?.threadTree?.view;
    const entry = {
      composeType,
      path,
      label,
      command,
      messageCount: view?.numSelected || 1,
      timeStamp: Date.now(),
    };

    this.armedEntry = entry;
    return entry;
  },
  tabConfigured: false,
	lastError: null,
	isModified: false, // set to true after editing moving / removing items
	// how many templates are stored altogether?
  // the "command" attribute is used to trigger the Tb command controller
  uniMenus : [
    {
      id : "smartTemplates-write-menu",
      composeType : "new",
      command : "cmd_newMessage",
      templates : "templatesNew",
    },
    {
      id : "smartTemplates-reply-menu",
      composeType : "rsp",
      command : "cmd_reply",
      templates : "templatesRsp",
    },
    {
      id : "smartTemplates-reply-all-menu",
      composeType : "rsp",
      command : "cmd_replyAll",
      templates : "templatesRsp",
    },
    {
      id : "smartTemplates-reply-list-menu",
      composeType : "rsp",
      command : "cmd_replyList",
      templates : "templatesRsp",
    },
    {
      id : "smartTemplates-forward-menu",
      composeType : "fwd",
      command : "cmd_forwardInline",
      templates : "templatesFwd",
    },
    {
      id : "mru-smartTemplates-unified",
    },
  ],
	get entriesLength() {
		let l = 0;
		for (let p in this.Entries) { // walk through ids, get all arrays and sum up items
		  if (!Array.isArray(this.Entries[p])) {
        continue;
      }
			l += this.Entries[p].length;
		}
		return l;
	} ,

  charset: "UTF-8",
  
  edit: async function(item) {
    const EditorPathSetting = "fileTemplates.editor.path";
    let editorPath = SmartTemplate4.Preferences.getStringPref(EditorPathSetting),
        wrn = SmartTemplate4.Util.getBundleString("prompt.fileTemplates.editor.setup");
            
    if (!editorPath) {
      const result = await SmartTemplate4.Util.showSmartTemplatesMessage({
        msg: wrn,
        features: ["ok", "cancel"],
      });

      if (result === "ok") {
        SmartTemplate4.Util.showAboutConfig(null, `smartTemplate4.${EditorPathSetting}`);
      }
      // no action needed on cancel
      return;
    }
    
    // editorPath = SmartTemplate4.Preferences.getStringPref(EditorPathSetting)
    if (!editorPath) { return; }

    const Cc = Components.classes,
      Ci = Components.interfaces;    

    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    try {
      try {
        file.initWithPath(editorPath);
      } catch (ex) {
        SmartTemplate4.Util.logException(`initializing Path ${editorPath} failed:`, ex);
      }
      if (!file.exists()) {
        throw "file doesn't exist";
      } 
    }
    catch(ex) {
      SmartTemplate4.Util.logException(`file.initWithPath(${editorPath}) failed with Exception` , ex);
      const message = SmartTemplate4.Util.getBundleString(
        "prompt.fileTemplates.editor.pathError",
        editorPath
      );

      const result = await SmartTemplate4.Util.showSmartTemplatesMessage({
        msg: message,
        features: ["ok", "cancel"],
      });

      if (result === "ok") {
        SmartTemplate4.Util.showAboutConfig(null, "smartTemplate4.fileTemplates.editor.path");
      }
      return;
    }

    
    let theProcess = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
    theProcess.init(file);
    let parameters = [item.path];
    theProcess.run(false, parameters, parameters.length);
  },
	
	// =====================   FILES   ===================== //	
  readStringFile: async function() {
    let profileDir = PathUtils.profileDir,
        path = PathUtils.join(profileDir, "extensions", "smartTemplates.json"),
        isExist = await IOUtils.exists(path);
    if (!isExist) { // [issue 227] default smartTemplates.json data
      let defaultContent = `{
        "templatesNew": [
        ],
        "templatesRsp": [
        ],
        "templatesFwd": [
        ],
        "snippets": [
        ]
      }
      `;
      return JSON.parse(defaultContent);
    }
    let promise = IOUtils.readJSON(path, { encoding: "utf-8" }); // Read the complete file as an json object

    return promise;
  } ,		

  makeLabel: function(entry) {
    let cat = entry.category || "";
    // use right pointing guillemet (left-pointing double angle quotation mark) as delimiter
    let retval = cat ? (cat + " » " + entry?.label) : entry?.label;
    return retval;
  },

  sanitizeLabel: function(lbl, c) {
    if (!c) {return lbl;}
    return lbl.replace(c + " » ", "");
  },
	

	// load template lists from file
  loadCustomMenu: async function() {
    const util = SmartTemplate4.Util;
    util.logDebug (`loadCustomMenu()...`); 

    try {
      const fileTemplates = this; // closure this
      const data = await this.readStringFile();
      util.logDebug ("loadCustomMenu() - data read"); 
      
      function fillEntries(source,target) {
        //empty list
        while (target.length) {
          target.pop();
        }
        if (!source) {
          return;
        }
        // populate the Entries array from read data
        for (let entry of source) {
          target.push({
            path: entry.path,
            label: entry.label,
            category: entry.category || "",
          });
        }
      }
      
      fillEntries(data.templatesNew, fileTemplates.Entries.templatesNew);
      fillEntries(data.templatesRsp, fileTemplates.Entries.templatesRsp);
      fillEntries(data.templatesFwd, fileTemplates.Entries.templatesFwd);
      fillEntries(data.snippets, fileTemplates.Entries.snippets);
    } catch (ex) {
      util.logException ('readStringFile() - Failure: ' + ex); 
      Services.prompt.alert(
        null,
        "SmartTemplate4.fileTemplates.loadCustomMenu()",
        `Reading the fileTemplates file failed\n${ex.toString()}`
      );
      // no changes to Entries array
      return Promise.reject("loadCustomMenu failed.");
    }
      
    // main window loading. this part is not necessary if we load into options window.
    return true;
  } ,

  // save to file
  saveCustomMenu: async function ()  {
    const util = SmartTemplate4.Util;
    
    try {
      let fileTemplates = this, // closure this
          profileDir = PathUtils.profileDir,
          path = PathUtils.join(profileDir, "extensions", "smartTemplates.json"),
          backPath = PathUtils.join(profileDir, "extensions", "smartTemplates.json.bak"),
          promiseDelete = IOUtils.exists(backPath) ?  IOUtils.remove(backPath) : Promise.resolve(),
          promiseBackup = promiseDelete.then(
					async function () { 
						util.logDebug ('IOUtils.move is next...'); 
            if (await IOUtils.exists(path)) {
						  IOUtils.move(path, backPath); 
            }
					},
					async function failedDelete(fileError) { 
						util.logDebug ('IOUtils.remove failed for reason:' + fileError); 
            if (await IOUtils.exists(path)) {
						  IOUtils.move(path, backPath); 
            }
					}
        );

      promiseBackup.then( 
        function backSuccess() {
          let entity = fileTemplates.Entries || '',
              outString = JSON.stringify(entity, null, '  '); // prettify
          try {
            // let theArray = new Uint8Array(outString); // writeJSON
            let promise = IOUtils.writeUTF8(path, outString);
            promise.then(
              function saveSuccess(byteCount) {
                util.logDebug (`Successfully saved ${fileTemplates.entriesLength} bookmarks [${byteCount} bytes] to file.`);
								fileTemplates.isModified = true;
                SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateTemplateMenus" });
                SmartTemplate4.Util.notifyTools.notifyBackground({ 
                  func: "updateFileTemplates",
                  Entries: fileTemplates.Entries,
                  MRU_Entries: fileTemplates.MRU_Entries,
                });
                SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateSnippetMenus" });
              },
              function saveReject(fileError) {  // IOUtils.Error
                util.logDebug ("saveCustomMenu error:" + fileError);
              }
            );
          }
          catch (ex) {
            util.logException("SmartTemplate4.fileTemplates.saveCustomMenu()", ex);
          }
        },
        function backupFailure(fileError) {
          util.logDebug (`promiseBackup error: ${fileError}`);
        }
      )
    }
    catch(ex) {
      util.logException("SmartTemplate4.fileTemplates.saveCustomMenu()", ex);
    }
        
  },

  // use this function to transmit menus from old dialog
  updateTemplatesDataFromBackEnd: async function(entries) {
    console.log("Experiment received Entries / original entries:", entries, this.Entries);
    // copy new data:
		this.Entries.templatesNew = entries.templatesNew;
		this.Entries.templatesRsp = entries.templatesRsp;
		this.Entries.templatesFwd = entries.templatesFwd;
		this.Entries.snippets = entries.snippets;
    this.saveCustomMenu();
  },

  createTemplateItem: function (doc, composeType, theTemplate) {
    let menuitem = doc.createXULElement("menuitem");

    menuitem.setAttribute("st4uiElement", "true");
    menuitem.setAttribute("st4composeType", composeType);
    menuitem.classList.add("st4template_entry");
    menuitem.classList.add("menuitem-iconic");
    if (theTemplate && theTemplate.path && theTemplate.path.endsWith(".css")) {
      menuitem.setAttribute("is","layout")
    }
    if (theTemplate.command) {
      menuitem.setAttribute("_command", theTemplate.command)
    }
    return menuitem;
  },

  lastTemplateLabel: function(template) {
    let noTemplate = `(not set)`;
    let mnuTemplateTitle = template ? `${template.label}` :  noTemplate;
    let finalLabel = `${SmartTemplate4.Util.getBundleString("st.menu.template.last")}: ${mnuTemplateTitle}`;
    return finalLabel;
  },

  addTemplateEvent: function (menuitem, popupParent, fT, composeType, template, singleParentWindow) {
    if (!template || !template.path) {
      return;
    }

    // Remove old listeners if they exist
    if (menuitem._stCommandHandler) {
      menuitem.removeEventListener("command", menuitem._stCommandHandler, true);
    }
    if (menuitem._stClickHandler) {
      menuitem.removeEventListener("click", menuitem._stClickHandler, true);
    }

    // Define new handlers and store references
    menuitem._stCommandHandler = function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      SmartTemplate4.Util.logDebugOptional(
        "fileTemplates",
        `Click event for fileTemplate:\ncomposeType=${composeType}\n` +
        `template= ${template.label}`,
        template
      );

      fT.onItemClick(menuitem, popupParent, fT, composeType, template.path, template.label, singleParentWindow);
      return false;
    };

    menuitem._stClickHandler = (event) => {
      event.stopPropagation();
    };

    // Attach them
    menuitem.addEventListener("command", menuitem._stCommandHandler, true);
    menuitem.addEventListener("click", menuitem._stClickHandler, true);
  },



  // =====================   UI   ===================== //	

/**
  * build a templates menu underneath a popup that's passed in
  * @param	templates      list of menu entries 
  * @param  msgPopup
  * @param	composeType    new, rsp, fwd, mru-smartTemplates-unified & mru-smartTemplates-header
  * @param  showConfigureItem  switch to create "configure menu" item.
  * */
	configureMenu: function (templatesList, msgPopup, composeType, showConfigureItem = true) {
    if (this.isAPIpatched) {
      if  (composeType=="mru-smartTemplates-header") {
        SmartTemplate4.Util.logDebugOptional("API.menus", `configureMenu(composeType = ${composeType}) early exit [API code]`);
        return;
      }
      let attr = msgPopup?.parentElement?.parentElement.getAttribute("data-action-menu");
      // we are not messing with this one!!
      if (attr == "messageDisplayAction") {
        SmartTemplate4.Util.logDebugOptional("API.menus", `configureMenu(composeType = ${composeType}) early exit [API code] [data-action-menu=${attr}]`);
        return;
      }
    }

		const util = SmartTemplate4.Util,
					fT = SmartTemplate4.fileTemplates;

    const isMRUmenu = composeType.startsWith("mru-");
    const isMainPopup = (msgPopup.getAttribute("data-action-menu") == "browserAction"); // header: "messageDisplayAction"

    const MAX_FREE_TEMPLATES = isMRUmenu ? 3 : 5,
          MAX_STANDARD_TEMPLATES = isMRUmenu ? 5 : 25,
					MAX_STANDARD_CATEGORIES = 3,
          MAX_MRU_CEILING = SmartTemplate4.Preferences.getMyIntPref("fileTemplates.mru.max"),
          isLicensed = util.hasLicense(false);
		let popupParent = msgPopup.parentNode, 
				singleParentWindow = null,
        doc = msgPopup.ownerDocument;

          
    function getAccessKey(acCode) {
      if (acCode<10) { return acCode.toString(); }
      if (acCode>34) { return ""; }
      return String.fromCharCode(65+acCode-10); // continue with A,B,C
    }
    try {
      let singleM = Services.wm.getMostRecentWindow("mail:messageWindow");
      if (window == singleM) { // check if current window is a single message
        singleParentWindow = window;
      }
    } catch {
      //NOP
    }
					
		util.logDebugOptional("fileTemplates", "Add " + composeType + " templatesList: " + templatesList.length + " entries to [" + (popupParent.id || 'anonymous') + "]");
		// first clear entries:
							
		let lastChild = msgPopup.lastChild,
        accelerator = 1, // [issue 96]
        acceleratorCat = 10,
        categories = [],
        catAccelerator = []; // [issue 147]

        
    // if this will be underneath any commands e.g. "new Message" / "Event" / "Task", then a separator is nice
    let templates; // will be a filtered list    
    if (isMRUmenu) {
      if (isMainPopup) { // only show write items
        templates = templatesList.filter(e => e.composeType =="new");
      } else {
        templates = templatesList.filter(e => e.composeType == "rsp" || e.composeType == "fwd");
      }
    } else {
      templates = templatesList; // take the full list
    }
    if (templates.length && msgPopup.childNodes.length && msgPopup.lastChild.tagName!="menuseparator") { 
      let menuseparator = doc.createXULElement("menuseparator");
      menuseparator.id = "fileTemplates-" + composeType + "msg-top";
      menuseparator.classList.add ("st4templateSeparator");
      msgPopup.appendChild(menuseparator);
    } 
    
    // add list of templates to popup menus
    for (let i=0; i<templates.length; i++) {
      let cat = templates[i].category,
          isAddNewCategory = false,
          isAddMaxCategoriesWarning = false;
      // if maximum number of "free / standard" submenus is exceeded, group into "other"
      if (!isMRUmenu && cat && !categories.includes(cat)) {
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
        let menu = doc.createXULElement("menu"),
            acCat = getAccessKey(acceleratorCat++);
        menu.classList.add("menuitem-iconic");
        menu.classList.add("st4template_category");
        menu.setAttribute("st4uiElement", "true");
        menu.setAttribute("accesskey", acCat); // A,B,C
        let lbl = acCat ? (acCat + " " + cat) : cat;
        if (cat == "Other") {
          // localized label
          lbl = util.getBundleString("template.category.other");
        }
        menu.setAttribute("label", lbl);
        let menupopup = doc.createXULElement("menupopup");
        menupopup.setAttribute("templateCategory", cat);
        menupopup.setAttribute("st4uiElement", "true");
        if (isAddMaxCategoriesWarning) {
          let wrn = util.getBundleString("st.fileTemplates.restrictTemplateCats", [MAX_STANDARD_CATEGORIES.toString()]);
          let menuitem = doc.createXULElement("menuitem");
          menuitem.classList.add("st4template_entry");
          menuitem.classList.add("menuitem-iconic");
          menuitem.setAttribute("label", wrn);
          menuitem.addEventListener("command",
            function(event) { 
              event.stopImmediatePropagation();
              // event.preventDefault();
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
    const delimiter = "\u00BB".toString(); // »

		for (let i=0; i<templates.length; i++) {
      if (isMRUmenu && i>MAX_MRU_CEILING) {
        break;
      }
			let theTemplate = templates[i];
      /* insert one item for each listed html template */
      if (isMRUmenu) { // [issue 263] need to determine the original composeType, reply probably extended to replyAll, replyList
        composeType = templates[i].composeType;
      }
			let menuitem = SmartTemplate4.fileTemplates.createTemplateItem(doc, composeType, theTemplate),
          acKey = "";

			if (!isLicensed && i>=MAX_FREE_TEMPLATES) {
				menuitem.disabled = true;
        menuHasRestrictions = true;
			}
      else if (!(util.hasProLicense) && i>=MAX_STANDARD_TEMPLATES) {
        menuitem.disabled = true;
        menuHasRestrictions = true;
      }

      SmartTemplate4.fileTemplates.addTemplateEvent(menuitem, popupParent, fT, composeType, theTemplate, singleParentWindow);
      if (!isMRUmenu) {
        menuitem.label = this.lastTemplateLabel(theTemplate);
      }
			
      let cat = theTemplate.category || "";
      let newLabel = theTemplate.label;
      if (cat && !isMRUmenu) {
        let popup = msgPopup.querySelector(`[templateCategory='${cat}']`);
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
      } else {
        acKey = getAccessKey(accelerator++);
        if (acKey) {
          menuitem.setAttribute("accesskey", acKey);
        }
        let controller; 
        if (isMRUmenu) {
          let actionId="";
          switch(theTemplate.cmd) {
            case "forward":
              actionId = "fwd.tab";
              controller = "cmd_forward"; 
              break;
            case "reply":
              actionId = "rsp.tab";
              controller = "cmd_reply"; 
              break;
            case "replyAll":
              actionId = "st.menu.replyAll";
              controller = "cmd_replyAll"; 
              break;
            case "replyList":
              actionId = "st.menu.replyList";
              controller = "cmd_replyList"; 
              break;
            case "write":
              actionId = "new.tab";
              controller = "cmd_newMessage"; 
              break;
            default: continue;
          }
          let lblAction = SmartTemplate4.Util.getBundleString(actionId);
          let title = theTemplate.label;
          // add category to label
          let catMenu = cat ? `${cat} ${delimiter} ` : "";
          newLabel = `${lblAction}: ${catMenu}${title}`;    
        }
        if (controller) {
          menuitem.setAttribute("controller",controller);
        }
        msgPopup.appendChild(menuitem);
      }
      menuitem.setAttribute("label", (acKey ? (acKey + " ") : "") + newLabel);
		}
    if (menuHasRestrictions) {
      // add an explanation about why some template items are disabled.
      let menuItem = doc.createXULElement ? doc.createXULElement("menuitem") : doc.createElement("menuitem");
      menuItem.setAttribute("label", util.getBundleString("st.fileTemplates.restrictionQuestion"));
      menuItem.setAttribute("st4uiElement", "true");
      menuItem.setAttribute("st4composeType", composeType);
      menuItem.classList.add("menuItem-iconic");
      menuItem.classList.add("st4templateInfo");      
      menuItem.addEventListener(
        "command",
        async (event) => {
          event.stopImmediatePropagation();
          const txt = util.getBundleString("st.fileTemplates.restrictTemplates", [
            MAX_FREE_TEMPLATES.toString(),
            MAX_STANDARD_TEMPLATES.toString(),
          ]);

          await SmartTemplate4.Util.showSmartTemplatesMessage({
            msg: txt,
            features: ["ok"],
            addonfeatures: ["FileTemplatesRestricted"], // passing as array or string
          });
          // no need to do anything on ok, just close dialog
          return false;
        },
        { capture: true },
        true
      );
      msgPopup.appendChild(menuItem);	
    }
		
    /* add an item for choosing ad hoc file template - uses file picker */
    // only the submenus have controllers
    let menuitem, menuTitle;
    const parentId = msgPopup.parentElement?.id || null;
    // [issue 269]
    const hasOpenFileItem = 
      ["smarttemplate4-changeTemplate","smarttemplate4-insertSnippet"].includes(parentId) || SmartTemplate4.fileTemplates.getController(msgPopup);
    
    if (hasOpenFileItem) {
      menuitem = doc.createXULElement ? doc.createXULElement("menuitem") : doc.createElement("menuitem");
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
          fT.onSelectAdHoc.call(
            fT, 
            { 
              composeType: composeType, 
              menuParent: popupParent, 
              parentWindow: singleParentWindow,
            });
          return false; 
        }, 
        {capture:true } , 
        true);
  		msgPopup.appendChild(menuitem);	
    }
      
    
		/* [item 29]  Add configuration item to file template menus. */
    if (showConfigureItem) {
      menuitem = doc.createXULElement ? doc.createXULElement("menuitem") : doc.createElement("menuitem");
      menuTitle = util.getBundleString("st.fileTemplates.configureMenu");
      menuitem.setAttribute("label", menuTitle);
			menuitem.setAttribute("st4uiElement", "true");
      menuitem.setAttribute("st4composeType", composeType);
      menuitem.classList.add("menuitem-iconic");
      menuitem.classList.add("st4templateConfig");
      
      menuitem.addEventListener("command", 
        function(event) { 
          event.stopImmediatePropagation();
          const win = SmartTemplate4.Util.Mail3PaneWindow;
          win.SmartTemplate4.doCommand(
            {
              id:"smartTemplates-settings",
            },
            {
              composeType: composeType,
              mode: "fileTemplates",
              option: "disableLicensePage",
            }
          );
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
    SmartTemplate4.fileTemplates.configureMenuMRU(msgPopup); // the last used template to the menu item!
		msgPopup.setAttribute("st4configured", true);
	} ,
  
	
  configureMenuMRU: function(msgPopup) {
    // uses the classes st-last-rsp st-last-new st-last-fwd for adding the name of the last used templates
    let menuitem = msgPopup.querySelector(".st-mru"); // should be only one per menu!
    if (!menuitem) {return;}
    let controller = msgPopup.parentElement.getAttribute("controller");
    let composeType = this.getComposeTypeFull(controller);
    if (!composeType) {return;}
    let setting = "fileTemplates.mru." + composeType,
        jsonTemplate = SmartTemplate4.Preferences.getStringPref(setting, ""),
        sEmptyLabel = "(not set)";
    // {path, label, category}
    let template = jsonTemplate ? JSON.parse(jsonTemplate) : {path:"", label:sEmptyLabel, category:""};
    const singleParentWindow = true;
    SmartTemplate4.fileTemplates.addTemplateEvent(
      menuitem, 
      msgPopup.parentNode, 
      SmartTemplate4.fileTemplates, 
      composeType.substring(0,3), 
      template, 
      singleParentWindow);
    menuitem.label = this.lastTemplateLabel(template);
  },
	// find menupopup in button's childNodes. If there is no menupopup, then append a new one.
	getPopup: function (buttonName, parent = null) {
		let doc = document,
				element;
		if (parent) {
			let tb = parent.getElementsByTagName('toolbar'); // toolbar collection
			if (tb.length) {
				// iterate NodeList:
				tb[0].childNodes.forEach( 
				  (cV, _cI, _id) => { 
					  if (cV.tagName=="toolbaritem") { // drill down into "smart" reply buttons - hdrSmartReplyButton item
							cV.childNodes.forEach(
							  function(bV, _bI, _id) {
									if (buttonName == bV.id ) {  // && !bV.getAttribute('hidden')
										element = bV;
									}
								}
							);
						} else {
							// make sure the button is not hidden!
							if (buttonName == cV.id ) {  // !cV.getAttribute('hidden')
								element = cV;
							}
            }
					}
				);
			}
		}
		else {
			element = document.getElementById(buttonName);
    }
		
		if (!element) {return null;}
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
	
  initMenusWithReset: async function() { 
    const isSingleMessage = (window.document.URL.endsWith("messageWindow.xhtml")),
          isAPI = SmartTemplate4.fileTemplates.isAPIpatched;
    SmartTemplate4.Util.logHighlightDebug("initMenusWithReset()\n","white","#8e0477a4",
      window.document.URL, `singleMessage=${isSingleMessage}  menu patched via API: ${isAPI}`
    );

    if (isAPI) {
      // update the data!
      await SmartTemplate4.Util.notifyTools.notifyBackground({ 
        func: "updateFileTemplates",
        Entries: this.Entries,
        MRU_Entries: this.MRU_Entries,
      });

      await SmartTemplate4.Util.notifyTools.notifyBackground({ 
        func: "patchHeaderMenuAPI", 
      });

      // only on main toolbar item until this is converted for API!
      await window.SmartTemplate4.fileTemplates.initMenus(true, {toolbarType:"unified"});
    } else {
      await window.SmartTemplate4.fileTemplates.initMenus(true);
      if (!isSingleMessage && window.gTabmail.currentTabInfo.mode.type == "mailTab") {
        SmartTemplate4.fileTemplates.tabConfigured = true;
      }
    }
  },
  

  /*
   *  @reset   : 
   *  @options : {
   *    toolbarType:"messageheader"   - only initialize header toolbar
   *    toolbarType:"unified"         - only initialize unified toolbar
   *    isMessenger:   set to true to force running regardless what type of tab we are in.
   *  }
   */
  initMenus: async function (reset = false, options={}) {
		const util = SmartTemplate4.Util;
    let loc = "";
    try { 
      if (window) { loc = window.document.URL; }
    }
    catch {;}

    util.logDebug(`fileTemplates.initMenus(reset=${reset}) ...\n`, options);

    if (window.document.URL.endsWith("messageWindow.xhtml")) { 
      // no tabmail!
      util.logDebug("initMenus - single message window");
    } else {
      // always patch only currentTab
      const tabmail = document.getElementById("tabmail"),
            currentTab = tabmail.selectedTab,
            currentTabMode = util.getTabMode(currentTab);
      if (!options.isMessenger &&  !["mail3PaneTab", "mailMessageTab"].includes(currentTabMode)) {
        return;
      }
      util.logDebugOptional("notifications.menus", `fileTemplates.initMenus()...[${loc}]\ntabMode=${currentTabMode}`);
    }

          
		function logDebug (t) {
			util.logDebugOptional("fileTemplates", t);
		} 

    // remove all old menu items
    function cleanup(doc) {
      // 0) clear all old items if they exist
      let separators = doc.getElementsByClassName("st4templateSeparator"),
          items = doc.getElementsByClassName("st4template_entry"),
          categories = doc.getElementsByClassName("st4template_category"),
          pickers = doc.getElementsByClassName("st4templatePicker"),
          configurators = doc.getElementsByClassName("st4templateConfig"),
          infoitems = doc.getElementsByClassName("st4templateInfo");

      // turn these HTMLCollections into Arrays
      Array.from(separators).forEach(el => { 
        let menu = el.parentNode;
        if (!menu.getAttribute('st4configured') || reset) {
          el.parentNode.removeChild(el); 
        }
      });
      Array.from(items).forEach(el => { 
          let menu = el.parentNode;
          if (!menu.getAttribute('st4configured') || reset) {
            el.parentNode.removeChild(el); 
          }
      });
      Array.from(pickers).forEach(el => { 
          let menu = el.parentNode;
          if (!menu.getAttribute('st4configured') || reset) {
            el.parentNode.removeChild(el); 
          }
      });
      Array.from(configurators).forEach(el => { 
          let menu = el.parentNode;
          if (!menu.getAttribute('st4configured') || reset) {
            el.parentNode.removeChild(el); 
          }
      });
      Array.from(categories).forEach(el => { 
          let menu = el.parentNode;
          if (!menu.getAttribute('st4configured') || reset) {
            el.parentNode.removeChild(el); 
          }
      });
      Array.from(infoitems).forEach(el => { 
          let menu = el.parentNode;
          if (!menu.getAttribute('st4configured') || reset) {
            el.parentNode.removeChild(el); 
          }
      });    
    }

    // load current template list
    const fileTemplates = SmartTemplate4.fileTemplates; // closure for the promise, just in case
    try {
      await fileTemplates.loadCustomMenu(false);
      let count = fileTemplates.entriesLength;
      logDebug("Loaded " + count + " templates, now preparing compose button submenus…");

      // single sections can be disabled by explicitely specifying which section
      // should be patched, via options.toolbarType
      const isHackUnified = !(options.toolbarType && options.toolbarType!="unified");
      // isHackMessageHeader = !(options.toolbarType && options.toolbarType!="messageheader");


      if (isHackUnified) { // unified toolbar button
        let doc = window.document;
        
        try {
          logDebug("Resetting all menus of unified toolbar button…");
          cleanup(doc);
        } catch (ex) {
          util.logException("cleaning unified toolbar button:", ex);
        }                       

        // this needs to be done from a tab listener too, to work when user updates the add-on from the manager tab
        let test = SmartTemplate4.hackToolbarbutton.updateMenuMRU(fileTemplates.uniMenus, doc, reset);
        if (SmartTemplate4.Preferences.isDebugOption("fileTemplates.menus")) {
          console.log("initMenus", test);
        }
      }
      // 4) ====  preview header area ==== //
      if (this.isAPIpatched) {
        return;
      }

    }
    catch (ex) {
      SmartTemplate4.Util.logException("loadCustomMenu", ex);
    }
		
	}	,
	
	pickFileFromSettings: function () { // legacy settings path?
    let el = document ?
      document.getElementById('btnPickTemplate') : null;
    if (el) {el.classList.remove('pulseRed');} // remove animation. we've found the button!
		this.pickFile(
		  async function(localFile) {
				const prefs = SmartTemplate4.Preferences;
				if (localFile) {
					document.getElementById('txtTemplatePath').value = localFile.path;
					// we could potentially parse the file 
					// and find the <title> tag!
					let name = localFile.leafName.replace(".html","").replace(".htm","").replace(".css","");
					document.getElementById('txtTemplateTitle').value = name;
					prefs.setStringPref('fileTemplates.path',localFile.parent.path); // store folder as default for next time.
				}
			},
      "fileTemplates.path"
		);
	} ,
	
  // @initialPathPref: defaults to the path setting from menu configuration (ST4 prefs dialog)
  //                   but can be overwritten for remembering a path when open file is selected from reply menu
	pickFile: function (lastCallback, initialPathPref='fileTemplates.path', fileType="template") {
    const Cc = Components.classes,
      Ci = Components.interfaces,
      util = SmartTemplate4.Util,
      prefs = SmartTemplate4.Preferences;
		
		let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
		// set default path
		if (prefs.getStringPref(initialPathPref)) {
      let defaultPath; 
      try {
        defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
        try {
          defaultPath.initWithPath(prefs.getStringPref(initialPathPref));
        } catch (x) {
          util.logException(`initializing Path ${prefs.getStringPref(initialPathPref)} failed:`, x);
        }
        if (!defaultPath.path || !defaultPath.exists()) {
          defaultPath.initWithPath(PathUtils.profileDir); // this one is hopefully legal
        } 
        if (defaultPath.exists()) {
          fp.displayDirectory = defaultPath; 
        }
      } catch (ex) {
        util.logException("Failed to open path: " + defaultPath, ex);
      }
		} 
		

    // [bug 1882701]
    let winarg = SmartTemplate4.Util.getFileInitArg(window);  // Tb 125
		fp.init(winarg, "", fp.modeOpen);

    switch (fileType) {
      case "template":
        fp.appendFilter(util.getBundleString("fpFilterHtmlTemplate"), "*.html; *.htm");
        fp.appendFilter(util.getBundleString("fpFilterStyleSheet"), "*.css");
        fp.defaultExtension = "html";
        break;
      case "templateList":
        fp.appendFilter(util.getBundleString("fpJsonTemplateList"), "*.json");
        fp.defaultExtension = "json";
        break;
    }

		
		
    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK) {
        if (fp.file) {
          try {
						// execut the last callback:
						lastCallback(fp.file);
          } catch(ex) {
            util.logException("filePickerCallback Failed:", ex);
          }
        }
      }
    }
    
		if (fp.open) { 
      fp.open(fpCallback);		
    }
    
    return true;    
  }  ,

  // Get file path of existing html template / css file.
  // itemParams: template menu item from listbox {path, label, filter}
  // should return path of the file
  openTemplateFileExternal:  async function(_itemParams) {
    let resolver; //placeholder for resolver callback, outside of promise
    let newPromise = new Promise(inner_res => {
        resolver = inner_res; //assign resolver callback as value to outside @res
    });
    // we can call resolver (from a callback) to resolve the promise.
    let returnedItem = {
      path:"", 
      name:"",
    }
    this.pickFile(
      async function (localFile) {
        // this will be execute _after_ file picker
        if (localFile) {
          returnedItem.path = localFile.path;
          // document.getElementById('txtTemplatePath').value = localFile.path;
          // we could potentially parse the file
          // and find the <title> tag!
          let name = localFile.leafName.replace(".html", "").replace(".htm", "").replace(".css", "");
          // document.getElementById('txtTemplateTitle').value = name;
          returnedItem.name = name;
          // store folder as default for next time.
          SmartTemplate4.Preferences.setStringPref("fileTemplates.path", localFile.parent.path);
        }
        resolver();
      }, 
      "fileTemplates.path"
    );
    await newPromise;
    return returnedItem;
  },

  openJsonFile: async function (params = {direction: "import"}) {
    let resolver; //placeholder for resolver callback, outside of promise
    let newPromise = new Promise((inner_res) => {
      resolver = inner_res; //assign resolver callback as value to outside @res
    });    
    let returnedItem = {
      path: "",
      name: "",
      data: [],
    };
    SmartTemplate4.Util.logDebugOptional("fileTemplates", "openJsonFile()", params);

    let settingName = "";
    switch (params?.direction) {
      case "import":
        settingName = "fileTemplates.jsonPath.import";
        break;
      case "export":
        settingName = "fileTemplates.jsonPath.export";
        break;
    }
    
    this.pickFile(
      async function (localFile) {
        // this will be execute _after_ file picker
        if (localFile) {
          returnedItem.path = localFile.path;
          // document.getElementById('txtTemplateTitle').value = name;
          returnedItem.name = localFile.leafName;
          // store folder as default for next time.
          SmartTemplate4.Preferences.setStringPref(settingName, localFile.parent.path);
          console.log("openJsonFile - picked file.");

          // Read the complete file as an json object
          let data = await IOUtils.readJSON(localFile.path, { encoding: "utf-8" });
          console.log("openJsonFile - read json data", data);
          if (typeof data == "object") {
            let finalData = {};
            console.log("Read json contents:", data);
            // now filter out the results, based on params.composeTypeFilter
            // we can also add a "does template file exist?" verification layer here later...
            switch (params?.composeTypeFilter) {
              case "new":
                finalData = data?.templatesNew;
                returnedItem.filteredResult = "templatesNew";
                break;
              case "rsp":
                finalData = data?.templatesRsp;
                returnedItem.filteredResult = "templatesRsp";
                break;
              case "fwd":
                finalData = data?.templatesFwd;
                returnedItem.filteredResult = "templatesFwd";
                break;
              case "snippets":
                finalData = data?.snippets;
                returnedItem.filteredResult = "snippets";
                break;
              case "all":
                finalData = data;
                break;
            }
            // additional filtering?
            returnedItem.data = finalData;
          }
        }
        resolver();
      },
      settingName,
      "templateList"
    );
    await newPromise;
    return returnedItem;
  },

  composeFromAPI: async function (menuEntry) {
    let composeType = this.getComposeTypeFull(menuEntry.controller);
    if (!composeType) {return;} // error
    let entry = { 
      command: menuEntry.controller,
      composeType: composeType.substring(0,3), 
      path: menuEntry.target.path, 
      label: menuEntry.target.label,
      type: menuEntry.control_type,
    };
    // fileTemplateInstance from the "correct" window?
    try {
      window.SmartTemplate4.fileTemplates.armedEntry = entry;

      if (!this.fireComposeCommand(entry)) {
        return;
      }
      this.storePreviousTemplate(composeType, entry);
      this.enterMRUitem(entry);
      // update api menus
      // we need to remove all mru- items from the top level!
      // not sure how to do it via the API
    } catch(ex) {
      SmartTemplate4.Util.logException("composeFromAPI()", ex);
    } finally {
      // update the data to the background first
      await SmartTemplate4.Util.notifyTools.notifyBackground({ 
        func: "updateFileTemplates",
        Entries: this.Entries,
        MRU_Entries: this.MRU_Entries,
      });

      SmartTemplate4.Util.notifyTools.notifyBackground({ 
        func: "updateHeaderMenuMRU", 
      });
    }

  },

  investigateFollowupHeaderBtn: function(command) {
    const currentInfo = SmartTemplate4.Util.tabmail?.currentTabInfo;
    if (!currentInfo) {
      return null;
    }
    if (currentInfo.mode.name==="mailMessageTab" ) {
      let ctlButtonId;
      // future extension: should we support hdrFollowupButton ?
      switch(command) {
        case "cmd_reply":
          ctlButtonId = "hdrReplyButton";
          break;
        case "cmd_replyall":
          ctlButtonId = "hdrReplyAllButton";
          break;
        case "cmd_replylist":
          ctlButtonId = "hdrReplyListButton";
          break;
        case "cmd_forward":
          ctlButtonId = "hdrForwardButton";
          break;
        default: return null; // not applicable
      }
      return currentInfo.chromeBrowser.contentDocument.getElementById(ctlButtonId)
    }
    return null;
  },

  // executes new, reply or forward, based on the 
  // appropriate structure in  this.uniMenus
  fireComposeCommand: function (entry) {
    // execute the command.
    let command = entry?.command; // cmd_replyall etc.
    if (!command) {
      SmartTemplate4.Util.logHighlight("fireComposeCommand failed", "white", "rgb(120,0,0)", "entry.command missing!");
      return false;
    }

    switch(entry.command) {
      case "cmd_replyAll": command = "cmd_replyall"; break;
      case "cmd_replyList": command = "cmd_replylist"; break;
    }

    let controller = getEnabledControllerForCommand(command);
    if (!controller) {
      // [issue 309] - not sure this should ever happen but it does
      // usually with mail in tab restored from a session

      let btn = this.investigateFollowupHeaderBtn(command);
      if (btn && !btn.getAttribute("hidden") && !btn.getAttribute("disabled"))  {
        btn.click();
        return true;
      }
      if (btn) {
        SmartTemplate4.Util.logToConsole(`the button ${btn.id} is either disabled or hidden, so no alternative follow up method is possible`)
      }

      SmartTemplate4.Util.logDebug(`No controller exists for the command ${command} `);  
      // async!
      SmartTemplate4.Util.showSmartTemplatesMessage({
        msg: SmartTemplate4.Util.getBundleString("st.fileTemplates.error.nocontroller", [command]),
        features: ["ok"],
      });
      return false;
    } 
    
    if (!controller.isCommandEnabled(command)) {
      SmartTemplate4.Util.logToConsole(`Cannot call command ${command} as it is disabled.`);
      return false;
    }
    controller.doCommand(command); // execute
    return true;
  },

  enterMRUitem(entry) {
    SmartTemplate4.Util.logDebug(`enterMRUitem(${this.makeLabel(entry)})`);
    let MAX_MRU_ITEMS = SmartTemplate4.Preferences.getMyIntPref("fileTemplates.mru.max") * 2; // default is 10 but can be raised in Pro
    let el = SmartTemplate4.fileTemplates.MRU_Entries.find(e => 
      e.path == entry.path && 
      (e.cmd == entry.cmd ||
       e.command == entry.command));

    if (!entry) {return false;}
    
    if (el) {
      let idx = SmartTemplate4.fileTemplates.MRU_Entries.indexOf(el);

      if (idx>=0 && entry.label) {
        // update label (according to menu) [issue 286]
        SmartTemplate4.fileTemplates.MRU_Entries[idx].label = entry.label;
      }
      if (idx>0) {
        let items = SmartTemplate4.fileTemplates.MRU_Entries.splice(idx,1);
        SmartTemplate4.fileTemplates.MRU_Entries.splice(0, 0, ...items); // insert old element at the top
      }
    } else {
      // insert new item on top.
      SmartTemplate4.fileTemplates.MRU_Entries.splice(0, 0, entry);
    }
    if (MAX_MRU_ITEMS < SmartTemplate4.fileTemplates.MRU_Entries.length) {
      SmartTemplate4.fileTemplates.MRU_Entries.pop();
    }
    SmartTemplate4.fileTemplates.storeMRU();
    return true;
  },

	// origin: "new", "rsp", "fwd"
	onItemClick: async function (menuitem, menuParent, fileTemplateInstance, composeType, path, label, singleMwindow) {
    /*   START NEW CODE -  [issue 184] */
    // use a pref switch for testing API processing...
    if (SmartTemplate4.Preferences.isBackgroundParser()) {
      // [issue 184]
      // Test string...
      let rawTemplate = 
      `<p>Dear %recipient(name)%</p>
       <p>%cursor%</p>
       <p>%identity(firstname)%</p>
      `;
      SmartTemplate4.Util.notifyTools.notifyBackground({ 
        func: "backgroundParser", 
        composeType, 
        rawTemplate,  // to do: read template from disk
      });
      return;
    }
    /* END NEW CODE  - [issue 184] */

    let btn = menuParent; // can be a button or a (new) menu on unifiedtoolbar button
		const util = SmartTemplate4.Util;
          
    let isSnippet = (btn && btn.id == "smarttemplate4-insertSnippet");
    if (isSnippet) {
      // overwrite with correct compose type
      composeType = util.getComposeType();
    }

    let entry = 
		  { 
				composeType: composeType, 
				path: path, 
				label: label,
			};

    const command = SmartTemplate4.fileTemplates.getController(menuitem);
    if (command) {
      entry.command = command; // only used by "adhoc" handler, but leaving it here just in case.
    }
      
    if (!isSnippet) {
      entry = fileTemplateInstance.armEntry(entry);
      // now remember the correct template for the next composer window!
      // - note: in single messafe windows this won't work as it cannot determine its "real" parent window
      //         therefore we must copy this into the most recent 3pane window to marshall this info through
      ////  originalEvent.view ? originalEvent.view.window.URL.endsWith("messageWindow.xul") : false;
      const isSingleMessage = singleMwindow ? true : false;
      if (isSingleMessage && singleMwindow == window) {
        const fTMain = util.Mail3PaneWindow.SmartTemplate4.fileTemplates;
        fTMain.armedEntry = fileTemplateInstance.armedEntry; // copy to last main window
      }
    }
			
		util.logDebug("fileTemplate.onItemClick\n" 
		  + "template:" + label + "\n"
			+ "path:" + path);
			
		let popup = menuitem.parentNode;
    if (btn.id=="smarttemplate4-changeTemplate") {  
      // [issue 24] select different template from composer window
      SmartTemplate4.notifyComposeBodyReady(true, window);
    } else if (btn.id == "smarttemplate4-insertSnippet") {
      // [issue 142] insert html Smart snippets within Composer at cursor
      SmartTemplate4.fileTemplates.insertFileEntryInComposer(entry);
    } else if (popup.getAttribute("st4configured") 
        || popup.getAttribute("templateCategory")) {
			util.logDebugOptional("fileTemplates","firing btn.click() …");
      if (menuParent.tagName == "menu")  {  // Tb115
        let entry = SmartTemplate4.fileTemplates.uniMenus.find(e => e.id == menuParent.id);
        if (entry) {
          SmartTemplate4.fileTemplates.fireComposeCommand(entry);
        }
      } else if (menuParent.getAttribute("type")=="menu" || menuParent.id == "SmartTemplate4Button") {
        // [issue 263] recent templates menu
        let recentEntry = { command: command };
        if (!command) {
          switch (composeType) {
            case "new":
              recentEntry.command = "cmd_newMessage";
              break;
            case "rsp":
              recentEntry.command = "cmd_reply";
              break;
            case "fwd":
              recentEntry.command = "cmd_forwardInline";
              break;
          }
        }
        SmartTemplate4.fileTemplates.fireComposeCommand(recentEntry);
      } else {
        // old code path???
        btn.click(); // or fire the standard command event? 
      }
		} else {
			util.logDebugOptional("fileTemplates","+======++++++======++++++======+\nNo click event fired for button id=" + btn.id);
		}
		// for retrieval we need to check this from composer window (by asking original window)
		// and then reset to null. fileTemplateInstance = mail3pane.SmartTemplate4.fileTemplates
		// should work when multiple mail windows are open, as long as we can determine the opener
		// of composer. also there should always only be one active at a time (after clicking teh create from template)
		// reset is absolutely necessary to not trigger the template functionality whe the "ordinary" write buttons 
		// are clicked.

    if (isSnippet) {
      return;
    }

    // update MRU item!
    // this stores the last entry per compose case.
    this.storePreviousTemplate(this.getComposeTypeFull (entry.command), entry); // do not update MRU yet.
    let cmd = "";
    switch(entry.composeType) {
      case "rsp":
        cmd = "reply";
        break;
      case "fwd":
        cmd = "forward";
        break;
      case "new":
        cmd = "write";
        break;
    }

    if (entry.command) {
      switch(entry.command.toLowerCase()) {
        case "cmd_replyall": cmd = "replyAll"; break;
        case "cmd_replylist": cmd = "replyList"; break;
      }
    }
    
    if (cmd) {
      SmartTemplate4.fileTemplates.enterMRUitem({
        cmd: cmd,
        label: entry.label,
        path: entry.path,
        composeType: entry.composeType,
        command: entry.command,
      } 
    );
    }
    // notify UI to update _after_ updating the MRU list.
    SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateTemplateMenus" });

    // update mru in header
    await SmartTemplate4.Util.notifyTools.notifyBackground({ 
      func: "updateFileTemplates",
      Entries: this.Entries,
      MRU_Entries: this.MRU_Entries,
    });
    SmartTemplate4.Util.notifyTools.notifyBackground({ 
      func: "updateHeaderMenuMRU", 
    });    

	} ,

  storePreviousTemplate: function(composeType, entry, updateMenus = false) {
    const normalizeForMRU = (entry) => {
      if (!entry) {
        return null;
      }
      const e = {
        composeType: entry.composeType,
        path: entry.path,
        label: entry.label,
      };
      if (entry.command) {
        e.command = entry.command;
      }
      return e;
    };

    const setting = "fileTemplates.mru." + composeType;
    const lastTemplate = normalizeForMRU(entry);
    let previous =  "";
    try { 
      previous = JSON.parse(SmartTemplate4.Preferences.getStringPref(setting)); 
    } catch { ; } // using external template for the first time

    if (lastTemplate) {
      // remember fileTemplates.mru.* setting for either of rsp, new, fwd
      SmartTemplate4.Preferences.setStringPref(setting, JSON.stringify(lastTemplate));
    }
    if (!updateMenus) {
      return;
    }
    if (previous 
        && previous.path 
        && previous.path == entry.path 
        && previous.composeType == entry.composeType) {
      SmartTemplate4.Util.logDebugOptional("fileTemplates", `same composeType + template selected [${entry.composeType},${entry.label}], no need to patch last used menuitem.`);
    } else {
      SmartTemplate4.Util.logDebugOptional("fileTemplates", `Patching Last Template[${composeType}], to ${entry.label}.`);
      SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateTemplateMenus" });
    }
  } ,
	
  insertFileEntryInComposer: async function (entry) {
    let theFileTemplate = entry;
    let fileTemplateSource = await SmartTemplate4.fileTemplates.retrieveTemplate(theFileTemplate);
    let html = fileTemplateSource.HTML;

    // update recipients!!
    try {
      Recipients2CompFields(gMsgCompose.compFields);
    } catch (ex) { 
      SmartTemplate4.Util.logException("insertFileEntryInComposer() updating compFields.", ex); 
    }

    const isFormatCSS = (theFileTemplate.path.endsWith(".css"));
    if (!html) {
      html = fileTemplateSource.Text;
    }
    
    // [issue 164] - placeholder for selected text
    if (!isFormatCSS && html.includes("*selection*")) {
      let sel = gMsgCompose.editor.selection,
          selectedText = "";
      if (sel && sel.anchorNode) {
        if (sel.rangeCount) {
          // sel.getRangeAt(0).toString();
          selectedText = SmartTemplate4.smartTemplate.unpackSelection(sel);  
        }
        if (selectedText && selectedText.length) {
          // html = html.replaceAll(",","\\,"); // replacing the commas will only work if snippet has no binary data in it
          // should only do this within ".." we need to investigate how...
          html = html.replace("*selection*", selectedText); 
        } else {
          html = html.replace("*selection*", "%cursor%");
        }
      } else {
        html = html.replace("*selection*", "%cursor%");
      }
      
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
      await SmartTemplate4.Util.showSmartTemplatesMessage({
        msg: text.replace("{0}", theFileTemplate.label).replace("{1}", `{P1}${theFileTemplate.path}{P2}`),
        features: ["ok"],
        // no direct callback support, so after awaiting, do the focus:
      });

      let composerWin = Services.wm.getMostRecentWindow("msgcompose");
      if (composerWin) {
        composerWin.focus();
      }      
    } else {
      flags.isFragment = true;
      flags.isFileTemplate = true;
      if (!flags.filePaths) {flags.filePaths = [];}
      SmartTemplate4.Util.logDebugOptional(
        "fileTemplates",
        `insertFileEntryInComposer: Add file to template stack: ${theFileTemplate.path}`
      );
      flags.filePaths.push(theFileTemplate.path); // remember the path. let's put it on a stack.
      let idkey = SmartTemplate4.Util.getIdentityKey(document);
      const ignoreHTML = true;
      let code;
      if (isFormatCSS) {
        // create a style block!
        let lastUnixPos = theFileTemplate.path.lastIndexOf("/"),
          lastWindowsPos = theFileTemplate.path.lastIndexOf("\\"),
          pos = Math.max(lastUnixPos, lastWindowsPos),
          name = theFileTemplate.path.substring(pos + 1);
        code = `
<!-- ${name} -->
<style>
  ${html}
</style>
        `;
      } else {
        code = await SmartTemplate4.smartTemplate.getProcessedText(
          html,
          idkey,
          SmartTemplate4.Util.getComposeType(),
          ignoreHTML
        );
      }

      // sanitize inserted markup: remove duplicated style blocks
      if (SmartTemplate4.Preferences.getMyBoolPref("sanitizeStyles.removeDuplicatesInFragments")) {
        const editor = SmartTemplate4.Util.CurrentEditor;
        const fragContainer = editor.document.createElement("div");
        SmartTemplate4.Util.insertHtmlSafely(fragContainer, code);
        SmartTemplate4.Util.removeDuplicateStyleBlocks(fragContainer, editor.document.body);
        code = fragContainer.innerHTML;
      }
      gMsgCompose.editor.insertHTML(code);
      
      // we should probably place the cursor at the end of the inserted HTML afterwards!

      let popped = flags.filePaths.pop();
      SmartTemplate4.Util.logDebugOptional(
        "fileTemplates",
        `insertFileEntryInComposer: Removed file from template stack: ${popped}`
      );
    }    
  } ,
  
  // [issue 173] function to trigger mailing with a template from a filter (FiltaQuilla feature issue 153)
  onExternalMailProcess: function(data, composeType) {
    const Ci = Components.interfaces;
    // similar to onItemClick / onSelectAdHoc
    SmartTemplate4.Util.logDebug("SmartTemplates.fileTemplates.onExternalMailProcess()", "composeType: " + composeType, data);
    
    if (SmartTemplate4.Preferences.isBackgroundParser()) { // [issue 184]
      alert("To do: external mail processing through background - [issue 184]\n"
        +  "This used to call ComposeMessage after adding item to SmartTemplate4.fileTemplates.armedQueue");
      return;
    }
    
    let msgHeader = data.messageHeader;
    
    // SmartTemplate4.fileTemplates.armedEntry = 
    if (!SmartTemplate4.fileTemplates.armedQueue) {
      SmartTemplate4.fileTemplates.armedQueue = [];
    }

    // simulate a reply to this message!
    let realMessage = SmartTemplate4.Util.extension.messageManager.get(msgHeader.id),
        uri = realMessage.folder.getUriForMsg(realMessage);
        
    SmartTemplate4.fileTemplates.armedQueue.push ({ 
      composeType: composeType, 
      path: data.templateURL, 
      message: msgHeader,
      isAutoSend: true,  // new flag 
      uri: uri,
    });
    
    SmartTemplate4.Util.logDebug("Sending SmartTemplate triggered by external Add-on", msgHeader);

    let msgUris = new Array(uri);
    let aCompType;
    switch(composeType) {
      case "fwd":
        aCompType = Ci.nsIMsgCompType.ForwardInline;
        break;
      case "rsp":
        // .ReplyAll  .ReplyToSender  .ReplyToGroup  .ReplyToSenderAndGroup  .ReplyToList:
        // what about special reply cases, like these?
        aCompType = Ci.nsIMsgCompType.Reply;
        break;
    }
    ComposeMessage(aCompType, Ci.nsIMsgCompFormat.Default, realMessage.folder, msgUris);
    SmartTemplate4.Util.logDebug("After calling ComposeMessage");
  },
  
	onSelectAdHoc : function(params) {
		// prepare a callback function for "arming" the template file info
    let composeType = params?.composeType,
        menuParent = params?.menuParent,        // will become obsolete with API ?
        singleMsgWindow = params?.parentWindow; // will become obsolete with API ?

    // API specific parameters:
    let controller = params?.controller;  // future use (API)

    // globals
    let cmd;
    if (!controller) {
      controller = SmartTemplate4.fileTemplates.getController(menuParent) || "";
      if (!controller) {
        if (menuParent.parentNode.getAttribute("data-action-menu") == "browserAction") {
          let fd = SmartTemplate4.fileTemplates.uniMenus.find(e => (e.id == menuParent.id));
          if (fd) {
            controller = fd.command;
          }
        }
      }      
    }

    let composeTypeFull = this.getComposeTypeFull(controller); // n/a when editing from draft.
    if (composeTypeFull) {
      composeType = composeTypeFull?.substring(0, 3);
      switch(controller) {
        case "cmd_reply": cmd = "reply"; break;
        case "cmd_replyAll": cmd = "replyAll"; break;
        case "cmd_replyList": cmd = "replyList"; break;
        case "cmd_newMessage": cmd = "write"; break;
        case "cmd_forward": cmd = "forward"; break;
        case "cmd_forwardInline": cmd = "forward"; break;
      }
    }


    // closure "this" (fileTemplates object) for the callback
    const theInstance = this;
    
		this.pickFile(
		  function(localFile) {
				const prefs = SmartTemplate4.Preferences,
              util = SmartTemplate4.Util;
				if (localFile) {
					// we could potentially parse the file 
					// and find the <title> tag!
					let name = localFile.leafName.replace(".html","").replace(".htm","").replace(".css","").replace("_"," ");
					// should we store folder as default for next time?
					// prefs.setStringPref('fileTemplates.path',localFile.parent.path); 

					
					// now remember the correct template for the next composer window!
          let templateEntry =  
						{ 
              cmd: cmd,
							composeType: composeType, 
							path: localFile.path, 
							label: name,
              command: controller,
						};

          if (cmd) {
            templateEntry.cmd = cmd;
          }
          let isStoreMRU = false;
            
          theInstance.armedEntry = templateEntry;
          if (singleMsgWindow) {
            let fTMain = util.Mail3PaneWindow.SmartTemplate4.fileTemplates;
            fTMain.armedEntry = theInstance.armedEntry; // copy to last main window
          }
            
          prefs.setStringPref('fileTemplates.instantPath', localFile.parent.path); // store folder as default for next time.

          // find whether a command exists
          let entry = SmartTemplate4.fileTemplates.uniMenus.find(e => e.command == controller && controller != "");
          if (entry) {
            SmartTemplate4.fileTemplates.fireComposeCommand(entry);
            // store MRU item and notify background
            SmartTemplate4.fileTemplates.storePreviousTemplate(composeTypeFull, templateEntry, true); 
            isStoreMRU = true;
          } else {
            switch(composeType) {
              case "snippets":
                SmartTemplate4.fileTemplates.insertFileEntryInComposer(templateEntry);
                break;
              case "rsp":
              case "fwd":
              case "new":
                if (menuParent && menuParent.id=="smarttemplate4-changeTemplate") {
                  // store MRU item and notify background
                  SmartTemplate4.fileTemplates.storePreviousTemplate(composeTypeFull, templateEntry, true); 
                  SmartTemplate4.notifyComposeBodyReady(true, window);
                } else {
                  SmartTemplate4.fileTemplates.fireComposeCommand(templateEntry);
                  SmartTemplate4.fileTemplates.storePreviousTemplate(composeTypeFull, templateEntry, true); 
                }
                isStoreMRU = true;
                break;
              default:
                SmartTemplate4.Util.logToConsole(`File picker callback - unknown composeType: ${composeType}`);
                break;
            }
          }
          if (isStoreMRU) {
            SmartTemplate4.fileTemplates.enterMRUitem(templateEntry);
          }
				}
			},
      'fileTemplates.instantPath'
		)
	},
	
	readHTMLTemplateFile : async function (template) {
		const Ci = Components.interfaces,
					Cc = Components.classes,
					util = SmartTemplate4.Util;	
		// template.filePath = templateUrlToRealFilePath(template.url);
		async function toUnicode(charset, data) {
			let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
			converter.charset = charset;
			try {
				return converter.ConvertToUnicode(data);
			}
			catch {
        const errText = util.getBundleString("st.fileTemplates.error.charSet").replace("{1}", charset);
      
        await SmartTemplate4.Util.showSmartTemplatesMessage({
          msg: errText,
          features: ["ok"],
        });
      
        const composerWin = Services.wm.getMostRecentWindow("msgcompose");
        if (composerWin) {composerWin.focus();}
      
        return data.toString();
			}
		}						
					
    const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
				
		try {
			// code from template-disk.jsm readHTMLTemplateFile()
			let //read file into a string so the correct identifier can be added
					fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
					inStream =		Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
			
			try {
				const localFile	=	new FileUtils.File(template.path);
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
				if (bom.charCodeAt(0) == 239 && bom.charCodeAt(1) == 187 && bom.charCodeAt(2) == 191) {bomCharset = 'UTF-8';} //UTF-8 BOM
				if (bom.charCodeAt(0) == 255 && bom.charCodeAt(1) == 254) {bomCharset = 'UTF-16LE';}  //UTF-16 LE BOM
				if (bom.charCodeAt(0) == 254 && bom.charCodeAt(1) == 255) {bomCharset = 'UTF-16BE';}  //UTF-16 BE BOM
				
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
						if (headStartIndex<0) {headStartIndex=0;}
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
						template.HTML = await toUnicode(charSet, template.HTML);
            template.charset = charSet;
					}
				}
				
				return true;
			} catch (e) {
				util.logException('readHTMLTemplateFile()', e);
				try { inStream.close(); } catch {;}
				try { fstream.close(); } catch {;}
			}
		} catch (e) {
			util.logException('readHTMLTemplateFile()', e);
		}
		return false;
	} ,
	
  // retrieve a html structure from the file template
	retrieveTemplate: async function(aFileTemplateArmedEntry) {
		const util = SmartTemplate4.Util;
		let template = { 
			Text: "", 
			HTML: "", 
			path: aFileTemplateArmedEntry.path, 
			label: aFileTemplateArmedEntry.label,
      failed: false,
      charset: null,			
		};
		if (await this.readHTMLTemplateFile(template)) {
      let html = "";
			try { 
				// let HTMLEditor = gMsgCompose.editor.QueryInterface(Components.interfaces.nsIHTMLEditor);
				if ('HTML' in template) { 
					html = template.HTML;
        } else {
					if ('Text' in template) {
						html = template.Text; // Stationery.plainText2HTML()
          }
				}
				// HTMLEditor.rebuildDocumentFromSource(html);
			} catch(ex) {
				util.logDebug("fileTemplates.applyTemplate()", ex, html);
				template.failed = true;
			} finally {
				// gMsgCompose.editor.endTransaction();
			}
		}
		else {
			template.failed = true;
    }
		
		return template;
	},

  getController: function(menuitem) {
    if (!menuitem) {return null;}
    let p = menuitem;
    while (p && p.tagName && p.tagName.startsWith("menu")) {
      let x = p.getAttribute("controller");
      if (x) {
        return x;
      }
      p = p.parentElement;
    }
    return null;
  },

  storeMRU: async function()  {
    const util = SmartTemplate4.Util;
    
    try {
      let fileTemplates = this, // closure this
          profileDir = PathUtils.profileDir,
          path = PathUtils.join(profileDir, "extensions", "smartTemplates_mru.json"),
          backPath = PathUtils.join(profileDir, "extensions", "smartTemplates_mru.json.bak"),
          promiseDelete = IOUtils.exists(backPath) ?  IOUtils.remove(backPath) : Promise.resolve(),  // delete backup only if it exists
          promiseBackup = promiseDelete.then(
					async function () { 
						util.logDebug ('IOUtils.move is next...'); 
            if (await IOUtils.exists(path)) {
						  IOUtils.move(path, backPath); 
            }
					},
					async function failedDelete(fileError) { 
						util.logDebug ('IOUtils.remove failed for reason:' + fileError); 
            if (await IOUtils.exists(path)) {
						  IOUtils.move(path, backPath); 
            }
					}
        );

      promiseBackup.then( 
        function backSuccess() {
          let mruArray = SmartTemplate4.fileTemplates.MRU_Entries || "[]",  // Array
              outString = JSON.stringify(mruArray, null, '  '); // prettify
          try {
            // let theArray = new Uint8Array(outString); // writeJSON
            let promise = IOUtils.writeUTF8(path, outString);
            promise.then(
              function saveSuccess(byteCount) {
                util.logDebug (`Successfully saved ${mruArray.length} MRU items [${byteCount} bytes] to file:\n`, path);
								fileTemplates.isModified = true;
              },
              function saveReject(fileError) {  // IOUtils.Error
                util.logDebug ("storeMRU error:" + fileError);
              }
            );
          }
          catch (ex) {
            util.logException("SmartTemplate4.fileTemplates.storeMRU()", ex);
          }
        },
        function backupFailure(fileError) {
          util.logDebug (`promiseBackup error: ${fileError}`);
        }
      )
    }
    catch(ex) {
      util.logException("SmartTemplate4.fileTemplates.storeMRU()", ex);
    }
        
  },

  loadMRU: async function() {
    const util = SmartTemplate4.Util;
    util.logDebug ("loadMRU()"); 
    try {
      let profileDir = PathUtils.profileDir,
      path = PathUtils.join(profileDir, "extensions", "smartTemplates_mru.json"),
      isExist = await IOUtils.exists(path);

      if (!isExist) { // [issue 227] default smartTemplates.json data
        return false;
      }
      let rv = await IOUtils.readJSON(path, { encoding: "utf-8" }); // Read the complete file as an json object
      if (typeof rv == "object") {
        SmartTemplate4.fileTemplates.MRU_Entries = [...rv]; // make a fresh array.
        return true;
      }
    } catch (ex) {
      util.logDebug ('loadMRU() - Failure: ' + ex); 
      Services.prompt.alert(null, 
        "SmartTemplate4.fileTemplates.loadMRU()", 
        "Reading the smartTemplates_mru.json file failed\n" + ex);
      // no changes to Entries array
      return false;
    }
  },
		
}
