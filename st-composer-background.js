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
let SmartTemplates = { }

/* ============================= */
/*  mx specific stuff            */
SmartTemplates.composers = new Map(); // add persistent info based on tab id, destroy intabs.onclosed

SmartTemplates.addComposer = function (tabId, info) {
  SmartTemplates.composers.set(tabId, info);
}

SmartTemplates.discardComposer = function (tabId) {
  SmartTemplates.composers.delete(tabId);
}

/* =============================*/
/*  from smartTemplates-main.js */
SmartTemplates.notifyComposeBodyReady = 
  async function (evt, isChangeTemplate, win=null)  {
  
  }


// -------------------------------------------------------------------
// A handler to switch identity - in legacy: was a monkeypatch for LoadIdentity
// -------------------------------------------------------------------
SmartTemplates.loadIdentity = 
  async function (startup, previousIdentity) {
    // previousIdentity = gCurrentIdentity;
    
    
  }

// Needs to be localizable with explicite locales passed.
SmartTemplates.calendar = {
   // TO DO!!
  init: function(forcedLocale) {
    
  }
}



SmartTemplates.isDebug = true;

SmartTemplates.logDebug = function(msg) {
  if (SmartTemplates.isDebug) {
    console.log(...arguments);
  }
}



