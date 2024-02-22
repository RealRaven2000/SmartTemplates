"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/

// this module will replace .classSmartTemplate and this.smartTemplate
// which are defined in smartTemplate-compose

import {SmartTemplates} from "./st-main.mjs.js";
import {Parser} from "./st-parser.mjs.js"; // imports getProcessedText
import {Preferences} from "./st-prefs.mjs.js"; // needed for account templates

export class SmartTemplatesProcess { 
  constructor() {
    this.composers = new Map(); // add persistent info based on tab id, destroy intabs.onclosed

    messenger.NotifyTools.onNotifyBackground.addListener(async (data) => {
      let isLog = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.notifications");
      switch (data.func) {
        // process file or prefs template.
        case "backgroundParser": // [issue 184]
          {
            if (isLog && data.func) {
              console.log ("=========================\n" +
                           " backgroundParser EVENT received: " + data.func + "\n" +
                           "=========================");
            }
            let [tab] = await messenger.tabs.query({ currentWindow:true, active: true });
            let composeTab;
            
            // ComposeAction.template = data.template;
            switch (data.composeType) {
              case "new":
                composeTab = await messenger.compose.beginNew(); 
                break;
              case "fwd":
                {
                  let message = await messenger.messageDisplay.getDisplayedMessage(tab.id);
                  composeTab = await messenger.compose.beginForward(message.id);
                }
                break;
              case "rsp":
                {
                  let message = await messenger.messageDisplay.getDisplayedMessage(tab.id);
                  composeTab = await messenger.compose.beginReply(message.id);
                }
                break;
            }
            if (!this.hasComposer(composeTab.id)) {
              let info = { rawTemplate: data.rawTemplate, composeType: data.composeType };
              // info.composeDetails = await messenger.compose.getComposeDetails(composeTab.id);
              
              this.addComposer(composeTab.id, info);
            }
          }
          break;
      }
    });
    
    messenger.tabs.onRemoved.addListener(
      (tabId) => {
        this.discardComposer(tabId);
      }
    );

    browser.tabs.onCreated.addListener(async composeTab => {     
      if (composeTab.type == "messageCompose") {
        // get template from id or from ComposeAction.template
        // api listener for prefs
        let isBackgroundParser = await SmartTemplates.Preferences.isBackgroundParser();
        if (!isBackgroundParser || isBackgroundParser=="false") return;

        // process the template:
        // let startup, flags, fileTemplateSource;
        // await SmartTemplates.insertTemplate(startup, flags, fileTemplateSource);
        let isInfoInitialized = this.hasComposer(composeTab.id),
            info = isInfoInitialized ? this.getComposer(composeTab.id) : { };
        info.composeDetails = await messenger.compose.getComposeDetails(composeTab.id);
        info.composeTabId = composeTab.id;
        // load defaults from pref
        
        // info.composeDetails.subject = "This is a test";
        
        this.addComposer(composeTab.id, info);
            
        //let template = (ComposeAction?.template) ? ComposeAction.template : "test" ; // if
        let rawTemplate = info.rawTemplate || "test - messageCompose Listener";
        
        // load the real template...
        // insertTemplate
        // TO DO NEXT: getProcessedText => move to st-overlay module!!
        const ignoreHTML = true; // false for quote header, getSmartTemplate; true for Thunderbird & file templates
        let idKey = info.composeDetails.identityId;
        // moved flags outside as they are a side effect from a global variable
        // TO DO - instanciate this!
        // or integrate into composers / info class
        // instead of initFlags
        let flags = SmartTemplates.PreprocessingFlags; // this needs to be instanciated later from / with / through  
                                                       // SmartTemplatesProcess.getComposer(tabId).flags
        
        info.composeCase = "";
        // can already be set on the way in?
        if (!info.composeType) {
          switch (info.composeDetails.type) {
            case "draft":
              info.composeType = "new";
              info.composeCase = "draft";
              break;
            case "new":
              info.composeType = "new";
              break;
            case "redirect": // [issue 184] TO DO
              info.composeType = "fwd";  // NEW CASE WE PROBABLY NEED TO BYPASS ST FOR THIS ONE!!
              break;
            case "reply":
              info.composeCase = "reply";
              info.composeType = "rsp";
              break;
            case "forward":
              info.composeType = "fwd";
              break;
            case "template": // NOT SUPPORTED YET??
              info.composeType = "?"; // [issue 184] TO DO
              info.composeCase = "tbtemplate";
              break;
            default:
              info.composeCase = "undefined";
              break;
          }
        }
        // insert beginning logic from classSmartTemplate.insertTemplate - in order to load account settings.
        if (!isInfoInitialized) { // identityPrefs replaces SmartTemplate.prefs
          let isActiveOnAccount = await Preferences.identityPrefs.isTemplateActive(idKey, info.composeType, false);
          if (info.composeCase == "draft") { // flags.isFileTemplate
            isActiveOnAccount = false;
          }
          // handle 3rd case of file template outside of (!isInfoInitialized)
          if (isActiveOnAccount) {
            if (info.composeCase == "tbtemplate") {
              rawTemplate = "";
            }
            else {
              rawTemplate = await Preferences.identityPrefs.getTemplate(idKey, info.composeType, "");
            }
          }
        }
        // TO DO:
        // we could rewrite insertTemplate to pass in the original mail body as node (or html string)
        // to do quote / quote header preprocessing.
        
        // changing third parameter to info (instead of info.composeType) 
        // so  we can also transmit composeDetails
        let parser = new Parser(info);
        let processedTemplate = await parser.getProcessedText(rawTemplate, idKey, ignoreHTML, flags);                
        
        // Will this call insertTemplate instead / before / after?
        // for now, write modified stuff to composer.
        // manipulate html
        if (info.composeDetails.isPlainText) {
          delete info.composeDetails.body;
          info.composeDetails.plainTextBody = processedTemplate;
        }
        else {
          delete info.composeDetails.plainTextBody;
          info.composeDetails.body = processedTemplate;
        }
        
        await messenger.compose.setComposeDetails(composeTab.id, info.composeDetails);
        
        // ComposeAction = {}; // set to consumed
      }
    });
  }
  
  /* ============================= */
  /*  mx specific stuff            */
  addComposer (tabId, info) {
    this.composers.set(tabId, info);
  }

  discardComposer (tabId) {
    this.composers.delete(tabId);
  }

  getComposer (tabId) {
    return this.composers.get(tabId);
  } 
  
  hasComposer (tabId) {
    return this.composers.has(tabId);
  }

  /* =============================*/
  /*  from smartTemplates-main.js */
  async notifyComposeBodyReady (isChangeTemplate, win=null)  {
    
  }

  // -------------------------------------------------------------------
  // A handler to switch identity - in legacy: was a monkeypatch for LoadIdentity
  // -------------------------------------------------------------------
  async loadIdentity(startup, previousIdentity) {
    // previousIdentity = gCurrentIdentity;
    
  }


  
}


