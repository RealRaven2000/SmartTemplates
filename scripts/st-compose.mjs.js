"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/
// [issue 184] Replacement for smartTemplate-compose.js - SmartTemplates
//             original namespace: SmartTemplate4.classSmartTemplate
//             was instanciated in: SmartTemplate4.smartTemplate

export
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
    // SmartTemplates.logDebug("retrieved identity key: " + idKey);
    
  }