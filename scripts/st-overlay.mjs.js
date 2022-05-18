"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/

// this module will replace all objects in smartTemplate-overlay.js


// possibly move this class (or better make an instance immediately) to st-prefs.msj.js
// SmartTemplates.Preferences.prefs [= new classPref()] I only need a single instance??
// so why would I need a class
export function classPref() { // from smartTemplate.overlay.js
  // rename to pref and add to SmartTemplates. import from st-prefs.msj.js as needed?
  // all member functions have account idKey as parameters, so I don't think this object
  // has statefulness
}

export function classGetHeaders(messageURI) { // from smartTemplate.overlay.js
  
}

export function clsGetAltHeader(msgDummyHeader) { // from smartTemplate.overlay.js
  
}

export let mimeDecoder = { // from smartTemplate.overlay.js
  
}

export function parseModifier(msg, composeType) { // from smartTemplate.overlay.js
   
}

export function regularize(msg, composeType, isStationery, ignoreHTML, isDraftLike) { // from smartTemplate.overlay.js
  
}