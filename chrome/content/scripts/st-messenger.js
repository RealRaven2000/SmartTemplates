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
      default:
        console.log("Unknown SmartTemplates command", el.id || "id: N/A", el);
    }
  }

  // THUNDERBIRD 115
  // fix selectors
  let mainButton = document.querySelector("button[extension='smarttemplate4@thunderbird.extension']");
  if (mainButton) {
    mainButton.id = "SmartTemplate4Button";
    mainButton.setAttribute("popup", "smartTemplatesMainPopup");

    // this method worked in quickFilters:
    // overload the menupopup based on the id we just added:
    WL.injectElements(`
      <button id="SmartTemplate4Button">
        <menupopup id="smartTemplatesMainPopup">
          <menu label="__MSG_pref_new.tab__"  id="smartTemplates-write-menu" class="menu-iconic">
            <menupopup>
              <menuitem id="smartTemplates-write" label="last template" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              <menuitem id="smartTemplates-write-account" label="account template (reset)" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
            </menupopup>
          </menu>
          <menu label="__MSG_pref_rsp.tab__" id="smartTemplates-reply-menu" class="menu-iconic">
            <menupopup>
              <menuitem id="smartTemplates-reply" label="last template" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              <menuitem id="smartTemplates-reply-account" label="account template (reset)" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
            </menupopup>
          </menu>
          <menu label="__MSG_pref_fwd.tab__" id="smartTemplates-forward-menu" class="menu-iconic">
            <menupopup>
              <menuitem id="smartTemplates-forward" label="last template" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              <menuitem id="smartTemplates-forward-account" label="account template (reset)" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
            </menupopup>
          </menu>
          
          <menuitem id="smartTemplates-news" label="__MSG_newsHead__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
          <menuitem id="smartTemplates-settings" label="__MSG_pref_dialog.title__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>

          <menu id="smartTemplates-docs" label="Documentation" class="menu-iconic">
            <menupopup>
              <menuitem id="smartTemplates-support" label="Support Site…" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              <menuitem id="smartTemplates-variables" label="Variables…" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
            </menupopup>
          </menu>

          <menu id="smartTemplates-tests" label="Test" class="menu-iconic">
            <menupopup>
              <menuitem id="smartTemplates-installed" label="Splashscreen - After Installation" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              <menuitem id="smartTemplates-templatemenus" label="Update Template Menus!" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
            </menupopup>
          </menu>

        </menupopup>
      </button>
    `); 
  }


  util.logDebug("notifyTools.enable...");
  window.SmartTemplate4.Util.notifyTools.enable();
  util.logDebug("Util.init...");
  await window.SmartTemplate4.Util.init();
  util.logDebug("startUp...");
  window.SmartTemplate4.startUp();
  
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

