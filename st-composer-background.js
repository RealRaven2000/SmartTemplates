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

SmartTemplates.composers = new Map(); // add persistent info based on tab id, destroy intabs.onclosed

SmartTemplates.addComposer = function (tabId, info) {
  SmartTemplates.composers.set(tabId, info);
}

SmartTemplates.discardComposer = function (tabId) {
  SmartTemplates.composers.delete(tabId);
}



SmartTemplates.isDebug = true;

SmartTemplates.logDebug = function(msg) {
  if (SmartTemplates.isDebug) {
    console.log(...arguments);
  }
}

SmartTemplates.insertTemplate = 
  async function insertTemplate(startup, flags, fileTemplateSource)	{
    /* LINE NUMBER in smartTemplate-compose.js - what it does */
    /* 900 - check and prepare "flags" to store states - see SmartTemplate4.initFlags()
       e.g. has signatur variable, omit sig, had cursor variable, has quote placeholder, 
       has template placeholder, is it a file template?
    */
    
    
    /* 908 - check if another template insert process is running to avoid duplication and abort */
    
    /* 909 - set a flag that we are now processing a template! (this is to avoid duplicate processing
             while files are streamed). THIS FLAG MUST BE PER COMPOSER WINDOW
       SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning = true; */
    
    /* 923 - retrieve identity from document / composer */
    let composeTab =  await messenger.tabs.getCurrent();  // current tab if we are in composer.
    let composeDetails = await messenger.compose.getComposeDetails(composeTab.id);
    let idKey = composeDetails.identity;
    SmartTemplates.logDebug("retrieved identity key: " + idKey);
    
  }

