

//original lds this after xul!!

/* 
  globals
    WL: readonly,
*/

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/scripts/hackToolbarbutton.js", window.SmartTemplate4, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

let updateTemplateMenus; // listener function

// eslint-disable-next-line no-unused-vars
async function onLoad(activatedWhileWindowOpen) {
  // eslint-disable-next-line no-unused-vars
  const layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
  WL.injectCSS("chrome://smartTemplate4/content/skin/common/smartTemplate-toolButton.css");
  // [issue 390]
  Services.scriptloader.loadSubScript(
    "chrome://smarttemplate4/content/scripts/st-ui-polyfills.js",
    window,
    "UTF-8"
  );


  WL.injectCSS("chrome://smartTemplate4/content/skin/common/smartTemplate-actionButton.css?v=3");

  // for version specific code / style fixes
  if (
    window.SmartTemplate4.Util.versionGreaterOrEqual(window.SmartTemplate4.Util.AppverFull, "102")
  ) {
    WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay-102.css");
  }

  window.SmartTemplate4.Util.logDebug(
    "st-messageWindow - onLoad(" + activatedWhileWindowOpen + ")..."
  );

  window.SmartTemplate4.WL = WL;
  window.SmartTemplate4.Util.notifyTools.enable();
  await window.SmartTemplate4.Util.init();
  window.SmartTemplate4.startUp();

  if (window.SmartTemplate4.patchUnifiedToolbar()) {
    await window.SmartTemplate4.fileTemplates.initMenusWithReset();
  }

  updateTemplateMenus = window.SmartTemplate4.fileTemplates.initMenusWithReset.bind(
    window.SmartTemplate4.fileTemplates
  );
  window.addEventListener(
    "SmartTemplates.BackgroundUpdate.updateTemplateMenus",
    updateTemplateMenus
  );
}

// eslint-disable-next-line no-unused-vars
function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  util.logDebug("Single Message Window - onUnload(" + isAddOnShutDown + ")…");
  
  window.SmartTemplate4.Util.notifyTools.disable();
  window.removeEventListener("SmartTemplates.BackgroundUpdate.updateTemplateMenus", updateTemplateMenus);
  
  if(isAddOnShutDown) {
    window.SmartTemplate4.shutDown();
  }
  util.logDebug("Single Message Window - onUnload(" + isAddOnShutDown + ") FINISHED");
}
