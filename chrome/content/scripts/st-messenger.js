var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");


//original lds this after xul!!

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/scripts/hackToolbarbutton.js", window.SmartTemplate4, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

async function onLoad(activatedWhileWindowOpen) {
  console.log (Services.appinfo.version);
  let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
  
  const util = window.SmartTemplate4.Util;
  util.logDebug("onLoad(" + activatedWhileWindowOpen + ")...");

  WL.injectElements(`
  
  <!-- # THUNDERBIRD (TOOLBAR) # -->
  <toolbarpalette id="MailToolbarPalette">
    <toolbarbutton id="SmartTemplate4Button"
                   label="__MSG_smartTemplate4.settings.label__"
                   tooltiptext="__MSG_smartTemplate4.settings.tooltip__"
                   class="toolbarbutton-1 chromeclass-toolbar-additional"
                   oncommand="window.openDialog('chrome://SmartTemplate4/content/settings.xhtml', 'Preferences', 'chrome,titlebar,toolbar,dependent,centerscreen,resizable');" />
 
  
  </toolbarpalette>
  <!-- #### STATUSBAR BUTTON OVERLAY IN MAIN WINDOW #### -->
  <hbox id="status-bar">
    <toolbarbutton id="SmartTemplate4Messenger"
                   class="statusbarpanel-iconic"
                   label="__MSG_smartTemplate4.settings.label__"
                   tooltiptext="__MSG_smartTemplate4.settings.tooltip__"
                   insertafter="totalMessageCount"
                   oncommand="SmartTemplate4.Util.clickStatusIcon(this);"/>
  </hbox>

  `);

  util.logDebug("notifyTools.enable...");
  window.SmartTemplate4.Util.notifyTools.enable();
  util.logDebug("Util.init...");
  await window.SmartTemplate4.Util.init();
  util.logDebug("startUp...");
  window.SmartTemplate4.startUp();
  util.logDebug("Util.firstRun.init...");
  window.SmartTemplate4.Util.firstRun.init();
  
  window.addEventListener("SmartTemplates.BackgroundUpdate", window.SmartTemplate4.initLicensedUI.bind(window.SmartTemplate4));
  window.addEventListener("SmartTemplates.BackgroundUpdate.updateTemplateMenus", window.SmartTemplate4.fileTemplates.initMenusWithReset.bind(window.SmartTemplate4.fileTemplates));
  window.SmartTemplate4.fileTemplates.initMenusWithReset();
  
}

function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  window.SmartTemplate4.Util.notifyTools.disable();
  window.removeEventListener("SmartTemplates.BackgroundUpdate", window.SmartTemplate4.initLicensedUI);
  window.removeEventListener("SmartTemplates.BackgroundUpdate.updateTemplateMenus", window.SmartTemplate4.fileTemplates.initMenusWithReset);
  
  util.logDebug("onUnload(" + isAddOnShutDown + ")...");
    
  // remove UI modifications + clean up all listeners
  window.SmartTemplate4.shutDown(true); // true = this is a main window - remove all message listeners established
  
  util.logDebug("onUnload(" + isAddOnShutDown + ") FINISHED");
}

