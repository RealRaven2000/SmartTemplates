"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/
// [issue 184] Replacement for smartTemplate-prefs.js - SmartTemplates.Preferences
//             original namespace: SmartTemplate4.Preferences


SmartTemplates.Preferences = {
  isBackgroundParser: async function() {
    return await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.BackgroundParser");
  }
}
