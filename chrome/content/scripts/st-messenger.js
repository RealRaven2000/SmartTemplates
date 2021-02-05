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
    console.log (Services.appinfo.version);
    let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
    
    const util = window.SmartTemplate4.Util;
    util.logDebug("onLoad(" + activatedWhileWindowOpen + ")...");

    WL.injectElements(`
    
    <!-- #### TOOLBAR BUTTON OVERLAY #### --> 
    <stringbundleset id="stringbundleset">
      <stringbundle id="smarttemplate4-strings" src="chrome://smartTemplate4/locale/smartTemplate-overlay.dtd" />
    </stringbundleset>
    
    <!-- # THUNDERBIRD (TOOLBAR) # -->
    <toolbarpalette id="MailToolbarPalette">
      <toolbarbutton id="SmartTemplate4Button"
                     label="&smartTemplate4.settings.label;"
                     tooltiptext="&smartTemplate4.settings.tooltip;"
                     class="toolbarbutton-1 chromeclass-toolbar-additional"
                     oncommand="window.openDialog('chrome://SmartTemplate4/content/settings.xhtml', 'Preferences', 'chrome,titlebar,toolbar,dependent,centerscreen,resizable');" />
   
    
    </toolbarpalette>
    <!-- #### STATUSBAR BUTTON OVERLAY IN MAIN WINDOW #### -->
    <hbox id="status-bar">
      <toolbarbutton id="SmartTemplate4Messenger"
                     class="statusbarpanel-iconic"
                     label="&smartTemplate4.settings.label;"
                     tooltiptext="&smartTemplate4.settings.tooltip;"
                     insertafter="totalMessageCount"
                     oncommand="SmartTemplate4.Util.clickStatusIcon(this);"/>
    </hbox>
  
    `, ["chrome://smartTemplate4/locale/smartTemplate-overlay.dtd"]);


    window.SmartTemplate4.startUp();
}

function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  util.logDebug("onUnload(" + isAddOnShutDown + ")...");
    
  // remove UI modifications + clean up all listeners
  window.SmartTemplate4.shutDown(true); // true = this is a main window - remove all message listeners established
  
  util.logDebug("onUnload(" + isAddOnShutDown + ") FINISHED");
}

