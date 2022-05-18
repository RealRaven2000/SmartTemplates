"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/
// [issue 184] Replacement for smartTemplate-util.js - SmartTemplates.Util
//             original namespace: SmartTemplate4.Util

import {Preferences} from "./st-prefs.mjs.js"; // we need this.


export function slideAlert(title, text, icon) {
  try {
    // we need permissions to use messenger.notifications
    // ex_notifications doesn't quite work (code from c-c) 
		messenger.notifications.create({
			type: "basic",
			title,
			message: text,
			iconUrl: icon || "/chrome/content/skin/icon32x32.png"
		});
  }
  catch(ex) {
    console.log(ex);
  }
}

export function log(msg, data, mode = "log") { // log, info, warn, error
	console[mode](msg, data);
}

export let Util = {
  log: function(txt) {
    console.log(...arguments);
  }
}