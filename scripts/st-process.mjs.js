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
              let info = { rawTemplate: data.rawTemplate };
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
        let startup, flags, fileTemplateSource;
        // await SmartTemplates.insertTemplate(startup, flags, fileTemplateSource);
        
        let info = this.hasComposer(composeTab.id) ?  this.getComposer(composeTab.id) : { };
        info.composeDetails = await messenger.compose.getComposeDetails(composeTab.id);
        info.composeDetails.subject = "This is a test";
        
        this.addComposer(composeTab.id, info);
            
        //let template = (ComposeAction?.template) ? ComposeAction.template : "test" ; // if
        let template = info.rawTemplate || "test - messageCompose Listener";
        
        // load the real template...
        // insertTemplate
        // TO DO NEXT: getProcessedText
        
        
        
        // manipulate html
        if (info.composeDetails.isPlainText) {
          delete info.composeDetails.body;
          info.composeDetails.plainTextBody = template;
        }
        else {
          delete info.composeDetails.plainTextBody;
          info.composeDetails.body = template;
        }
        
        // write modified stuff to composer
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
  async notifyComposeBodyReady (evt, isChangeTemplate, win=null)  {
    
  }


  // -------------------------------------------------------------------
  // A handler to switch identity - in legacy: was a monkeypatch for LoadIdentity
  // -------------------------------------------------------------------
  async loadIdentity(startup, previousIdentity) {
    // previousIdentity = gCurrentIdentity;
    
      
  }

  // Needs to be localizable with explicite locales passed.
  calendar = {
     // TO DO!!
    init: function(forcedLocale) {
      
    }
  }
  
}


