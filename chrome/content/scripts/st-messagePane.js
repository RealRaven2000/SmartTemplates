var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

let patchHeaderMenu; // listener

var reactNotification;

async function onLoad(activatedWhileWindowOpen) {

  // copy namespace (we are in 3pane or about:message)
  switch (window.parent.document.URL) {
    case "about:3pane":
      window.SmartTemplate4 = window.parent.parent.SmartTemplate4;
      break;
    case "about:message":
      window.SmartTemplate4 = window.parent.SmartTemplate4; 
      break;
    default: // also messenger
      if (window.document.URL == "about:message") {
        window.SmartTemplate4 = window.parent.SmartTemplate4; 
      }
    }

  window.SmartTemplate4.WLM = WL;
  const WAIT_FOR_3PANE = window.SmartTemplate4.Preferences.getMyIntPref("fileTemplates.menus.delayMessagePane");
  window.SmartTemplate4.Util.logDebug(`============INJECT==========\nst-messagePane.js onLoad(${activatedWhileWindowOpen})`);

  WL.injectCSS("chrome://smartTemplate4/content/skin/common/smartTemplate-toolButton.css");
  
  // special elements - only for Pro users!
  /* deprecated. ¯\_(ツ)_/¯  Works in Betterbird
  WL.injectElements(`
  <hbox id="header-view-toolbar">
    <toolbarbutton id="SmartTemplates-smartReply"
                   class="statusbarpanel-iconic"
                   label="Reply with Template"
                   tooltiptext="Reply using an external Template"
                   oncommand="window.SmartTemplate4.doCommand(this);"/>
    <toolbarbutton id="SmartTemplates-smartForward"
                   class="statusbarpanel-iconic"
                   label="Forward with Template"
                   tooltiptext="Forward using an external Template"
                   oncommand="window.SmartTemplate4.doCommand(this);"/>
  </hbox>
  `);
  */

  const HEADERBARID = "smarttemplate4_thunderbird_extension-messageDisplayAction-toolbarbutton";
  const contentDoc = window.document;
  let headerButton = contentDoc.getElementById(HEADERBARID);

  if (headerButton) { // patch button
    window.setTimeout(
      (win = window) => {
        win.SmartTemplate4.WLM = WL; // make a separate WindowListener instance for message pagen context.
        win.SmartTemplate4.Util.logDebug("Patching Header Pane...")
        let result = win.SmartTemplate4.patchHeaderPane(contentDoc, headerButton);
        if (!result) {
          win.SmartTemplate4.Util.logDebug("patchHeaderPane() returned false!");
        }
        win.SmartTemplate4.fileTemplates.initMenus(true, {toolbarType:"messageheader"});
        if (win.SmartTemplate4.Preferences.getMyBoolPref("toolbar.hideLabel")) {
          headerButton.classList.add("force-label-hidden");
        } else {
          headerButton.classList.remove("force-label-hidden");
        }
      },
      WAIT_FOR_3PANE
    );
  }

  const messagePaneWindow = window;
  // listener for notifications from background
  reactNotification = (data) => {
    if (data.event) {
      if (!data.hasOwnProperty("window")) {
        let loc;
        try {
          loc = messagePaneWindow.document.location ? messagePaneWindow.document.location.href.toString() : messagePaneWindow.document.URL;
        } catch (ex) {
          loc = "N/A";
        }
        messagePaneWindow.SmartTemplate4.Util.logDebugOptional("notifications", 
        `reactNotification - event ${data.event}\n` +
        `in ${loc}`);
        switch(data.event) {
          case "patchHeaderMenu":
          case "updateTemplateMenus":
            patchHeaderMenu(messagePaneWindow); // closure for about:message
            break;
        }
      }       
    }      
  }

  // closure both window and this WL!
  patchHeaderMenu = async (win = window) => {
    win.SmartTemplate4.WLM = WL;
    if (win.SmartTemplate4.patchHeaderPane.bind(win.SmartTemplate4)) {
      await win.SmartTemplate4.fileTemplates.initMenus(true, {toolbarType:"messageheader"});
    }
  } 
  window.SmartTemplate4.Util.notifyTools.registerListener(reactNotification);

  // messenger.messageDisplayAction.setTitle("SmartTemplates")
  /* 
    https://webextension-api.thunderbird.net/en/latest/messageDisplayAction.html#seticon-details
    messenger.messageDisplayAction.setIcon(
      {
        imageData:ImageDataType,
        path: IconPath
      }
    )


    John:
    The menus are populated via the menus API. The context you need is message_display_action_menu

    For the first level you use the mentioned  context in menus.create(). 
    You also define an id for each entry. For the sublevels you use the parentId 
    property to define the menu entries to be children of the previously defined 
    top level entries. You probably do not need  to specify a context for 
    sublevel entries.

    You can hide/show entries in the onShown event, if you need dynamic menu entries, 
    depending  on the current message or UI state.

    Or actually update the entries.

    For patching, work in main: patchHeaderPane

    // access all browsers in 3pane:
    window[3].document.childNodes[1].querySelectorAll("browser") 

    // access messageHeader
    window[3].document.childNodes[1].querySelectorAll("browser")[1].contentDocument.querySelector("#messageHeader") 

  */
}

function onUnload(isAddOnShutDown) {
  window.SmartTemplate4.Util.notifyTools.removeListener(reactNotification);
}

