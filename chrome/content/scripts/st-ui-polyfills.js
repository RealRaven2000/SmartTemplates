"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


/* globals 
  WL
*/



(function smartTemplateUIPolyfills() {
  const Util = window.SmartTemplate4.Util;
  Util.logDebug ("Polyfills loading in window:", window.location.href);
  var Services =
    globalThis.Services || ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

  const willy =
    typeof WL !== "undefined" ? WL : window.SmartTemplate4?.WL || window.SmartTemplate4_WLM;

  if (!willy) {
    Util.logHighlight(
      "Can't polyfill menu items, no WindowListener in:",
      "pink",
      "rgb(40,0,0)",
      `window location= ${window.location.href}`
    );
    return;
  }

  // Style all menu items.
  willy.injectCSS("chrome://Smarttemplate4/content/skin/common/st-menus.css");

  // Tb143+ override
  // Deals with [issue 390] Thunderbird 143: all menu icons of all popups broken
  if (Util.versionGreaterOrEqual(Services.appinfo.version, "143")) {
    willy.injectCSS("chrome://Smarttemplate4/content/skin/common/st-menus-143.css");
  }

  // Future regression patches can be added here
})();