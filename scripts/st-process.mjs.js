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
            // let [tab] = await messenger.tabs.query({ currentWindow:true, active: true });
            let composeTab;
            
            ComposeAction.template = data.template;
            switch (data.composeType) {
              case "new":
                composeTab = await messenger.compose.beginNew(); //
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
            
            // create global struct for PreprocessingFlags, armedEntry, armedQueue?
            let info = { composeType: data.composeType };
            if (composeTab) {
              info.composeDetails = await messenger.composer.getComposeDetails(composeTab.id);
              SmartTemplates.addComposer(composeTab.id, info);
            }
            await messenger.setComposeDetails(composeTab.id, 
              {
                subject: "This is a test"
              }
            )
            
          }
          break;
      }
    });
    
    messenger.tabs.onRemoved.addListener(
      (tabId) => {
        SmartTemplates.discardComposer(tabId);
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
        await SmartTemplates.insertTemplate(startup, flags, fileTemplateSource);
        

        let template = (ComposeAction?.template) ? ComposeAction.template : "test" ; // if
        
        let details = await messenger.compose.getComposeDetails(composeTab.id);
        // manipulate html
        if (details.isPlaintext) {
          delete details.body;
          details.plainTextBody = template;
        }
        else {
          delete details.plainTextBody;
          details.body = template;
        }
        
        await messenger.compose.setComposeDetails(composeTab.id, details);
        
        
        
        ComposeAction = {}; // set to consumed
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
    this.composers.get(tabId);
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


