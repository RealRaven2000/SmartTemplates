var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

//original lds this after xul!!
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/scripts/hackToolbarbutton.js", window.SmartTemplate4, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-rsa.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-register.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/settings.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {
    let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
    

    WL.injectElements(`
    <!-- #### TOOLBAR BUTTON OVERLAY #### --> 
    <stringbundleset id="stringbundleset">
      <stringbundle id="smarttemplate4-strings" src="chrome://smartTemplate4/locale/smartTemplate-overlay.dtd" />
    </stringbundleset>
  `, ["chrome://smartTemplate4/locale/smartTemplate-overlay.dtd"]);

   
  window.SmartTemplate4.startUp();
}

function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  util.logDebug("Single Message Window - onUnload(" + isAddOnShutDown + ")…");
  if(isAddOnShutDown) {
    window.SmartTemplate4.shutDown();
  }
  util.logDebug("Single Message Window - onUnload(" + isAddOnShutDown + ") FINISHED");
}
