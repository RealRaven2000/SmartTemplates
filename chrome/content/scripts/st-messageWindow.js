var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

//original lds this after xul!!
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/scripts/hackToolbarbutton.js", window.SmartTemplate4, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

async function onLoad(activatedWhileWindowOpen) {
  let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");

  window.SmartTemplate4.Util.notifyTools.enable();
  await window.SmartTemplate4.Util.init();
  window.SmartTemplate4.startUp();
  
  window.addEventListener("SmartTemplates.BackgroundUpdate.updateTemplateMenus", window.SmartTemplate4.fileTemplates.initMenusWithReset.bind(window.SmartTemplate4.fileTemplates));
  window.SmartTemplate4.fileTemplates.initMenusWithReset();
  
}

function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  util.logDebug("Single Message Window - onUnload(" + isAddOnShutDown + ")…");
  
  window.SmartTemplate4.Util.notifyTools.disable();
  window.removeEventListener("SmartTemplates.BackgroundUpdate.updateTemplateMenus", window.SmartTemplate4.fileTemplates.initMenusWithReset);
  
  if(isAddOnShutDown) {
    window.SmartTemplate4.shutDown();
  }
  util.logDebug("Single Message Window - onUnload(" + isAddOnShutDown + ") FINISHED");
}
