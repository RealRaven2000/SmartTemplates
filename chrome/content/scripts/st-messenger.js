var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");


//original lds this after xul!!

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/scripts/hackToolbarbutton.js", window.SmartTemplate4, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

var mylisteners = {};

async function onLoad(activatedWhileWindowOpen) {
  let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");

  const util = window.SmartTemplate4.Util;
  
  // for version specific code / style fixes
  if (util.versionGreaterOrEqual(util.AppverFull, "102")) {
    WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay-102.css");
  }
  
  util.logDebug("onLoad(" + activatedWhileWindowOpen + ")...");

  WL.injectElements(`
  
  <!-- # THUNDERBIRD (TOOLBAR) # -->
  <toolbarpalette id="MailToolbarPalette">
    <toolbarbutton id="SmartTemplate4Button"
                   label="__MSG_smartTemplate4.settings.label__"
                   tooltiptext="__MSG_smartTemplate4.settings.tooltip__"
                   class="toolbarbutton-1 chromeclass-toolbar-additional"
                   oncommand="SmartTemplate4.Util.openPreferences(this);" />
 
  
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

  window.SmartTemplate4.doCommand = function (el) {
    if (!el) {
      return;
    }
    const SmartTemplates = window.SmartTemplate4;
    switch (el.id) {
      case "smartTemplates-write":
        SmartTemplates.Util.logIssue213("Write with template");
        break;
      case "smartTemplates-reply":
        SmartTemplates.Util.logIssue213("Reply with template");
        break;
      case "smartTemplates-forward":
        SmartTemplates.Util.logIssue213("Forward with template");
        break;
      case "smartTemplates-news":
        SmartTemplates.Util.notifyTools.notifyBackground({ func: "splashScreen" });
        break;
      case "smartTemplates-settings":
        SmartTemplates.Util.openPreferences(el);
        break;
      case "smartTemplates-installed":
        SmartTemplates.Util.notifyTools.notifyBackground({ func: "splashInstalled" });
        break;
      case "smartTemplates-support":
        SmartTemplates.Util.logIssue213("Show Support Tab");
        break;
      case "smartTemplates-variables":
        SmartTemplates.Util.logIssue213("Show Variables Tab");
        break;
      case "smartTemplates-templatemenus":
        SmartTemplates.Util.notifyTools.notifyBackground({ func: "updateTemplateMenus" });
        break;
      case "smartTemplates-labelUpdate":
        SmartTemplates.Util.notifyTools.notifyBackground({event: "updateNewsLabels"});
        // update the status bar label too:
        SmartTemplates.Util.notifyTools.notifyBackground({event:"initLicensedUI"});  
        break;
      default:
        console.log("Unknown SmartTemplates command", el.id || "id: N/A", el);
    }
  }

  window.SmartTemplate4.WL = WL; // we need this in patchMailPane();
  util.logDebug("notifyTools.enable...");
  window.SmartTemplate4.Util.notifyTools.enable();
  util.logDebug("Util.init...");
  await window.SmartTemplate4.Util.init();
  util.logDebug("startUp...");
  window.SmartTemplate4.startUp();

  // The following will only work if we are currently in a mail pane (ATN update)
  // otherwise, we need to call this again in a tab listener
  window.SmartTemplate4.patchMailPane(); 
  window.SmartTemplate4.addTabEventListener();

  // set up updating the label at midnight
  window.SmartTemplate4.Util.setMidnightTimer();
  
  // these events are repackaged in util-init() from notifications
  mylisteners["BackgroundUpdate"] = window.SmartTemplate4.initLicensedUI.bind(window.SmartTemplate4);
  mylisteners["updateTemplateMenus"] = window.SmartTemplate4.fileTemplates.initMenusWithReset.bind(window.SmartTemplate4.fileTemplates);
  mylisteners["updateNewsLabels"] = window.SmartTemplate4.updateNewsLabels.bind(window.SmartTemplate4);
  mylisteners["firstRun"] = util.firstRun.init.bind(util.firstRun);
  mylisteners["forwardWithTemplate"] = 
    (event) => {
      window.SmartTemplate4.fileTemplates.onExternalMailProcess.call(
        window.SmartTemplate4.fileTemplates, event.detail, "fwd"
      ); 
    }

  mylisteners["replyWithTemplate"] = 
    (event) => { 
      window.SmartTemplate4.fileTemplates.onExternalMailProcess.call(
        window.SmartTemplate4.fileTemplates, event.detail, "rsp"
      ) 
    }; 

  for (let m in mylisteners) {
    if (m == "BackgroundUpdate")
      window.addEventListener("SmartTemplates.BackgroundUpdate" , mylisteners[m]);
    else {
      window.addEventListener(`SmartTemplates.BackgroundUpdate.${m}` , mylisteners[m]); 
      // add more listeners here...
    }
  }
  
  window.SmartTemplate4.fileTemplates.initMenusWithReset(); // this func is now async  
}

function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  window.SmartTemplate4.Util.notifyTools.disable();
  
  for (let m in mylisteners) {
    if (m == "BackgroundUpdate")
      window.removeEventListener("SmartTemplates.BackgroundUpdate", mylisteners[m]);
    else
      window.removeEventListener(`SmartTemplates.BackgroundUpdate.${m}`, mylisteners[m]);
  }
  
  window.removeEventListener("SmartTemplates.BackgroundUpdate", window.SmartTemplate4.initLicensedUI);
  window.removeEventListener("SmartTemplates.BackgroundUpdate.updateTemplateMenus", window.SmartTemplate4.fileTemplates.initMenusWithReset);
  
  util.logDebug("onUnload(" + isAddOnShutDown + ")...");
    
  // remove UI modifications + clean up all listeners
  window.SmartTemplate4.shutDown(true); // true = this is a main window - remove all message listeners established
  
  util.logDebug("onUnload(" + isAddOnShutDown + ") FINISHED");
}

