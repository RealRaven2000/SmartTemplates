"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


/* creates the SmartTemplates namespace by importing from other ESR modules */

import {Util} from "./st-util.mjs.js";
import {Preferences} from "./st-prefs.mjs.js";
import * as classSmartTemplate from "./st-compose.mjs.js";

export let SmartTemplates = { 
  Util, 
  Preferences, 
  ...classSmartTemplate 
}


