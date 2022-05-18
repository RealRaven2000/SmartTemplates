"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


/* creates the SmartTemplates namespace by importing from other ESR modules */

import {Preferences} from "./st-prefs.mjs.js";
import {Util} from "./st-util.mjs.js";
import * as classSmartTemplate from "./st-compose.mjs.js";
import {composer} from "./st-composer.mjs.js";
import {Styles} from "./st-styles.mjs.js";
import {Sig} from "./st-signature.mjs.js";
import {classPref, classGetHeaders, clsGetAltHeader, mimeDecoder, parseModifier, regularize} from "./st-overlay.mjs.js";


let SmartTemplates = { 
  Util, 
  Preferences, 
  ...classSmartTemplate,
  classPref, classGetHeaders, clsGetAltHeader, mimeDecoder, parseModifier, regularize,
  composer,
  Sig
}


SmartTemplates.pref = new SmartTemplates.classPref(); // but what if this is used in one of the sub modules???????
// this is used in st-compose.mjs.js , st-overlay.mjs.js , st-util.mjs.js
// but according to John this would be a circular reference.


export { SmartTemplates };