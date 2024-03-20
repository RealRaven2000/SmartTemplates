var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

/* obsolete
let patchHeaderMenu; 
var reactNotification;
*/

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

  window.SmartTemplate4_WLM = WL; // keep a reference to the correct WindowListener. [issue 271]
                                  // it can only patch stuff in its own window!
  const WAIT_FOR_3PANE = window.SmartTemplate4.Preferences.getMyIntPref("fileTemplates.menus.delayMessagePane");
  window.SmartTemplate4.Util.logDebug(`============INJECT==========\nst-messagePane.js onLoad(${activatedWhileWindowOpen})`);

  WL.injectCSS("chrome://smartTemplate4/content/skin/common/smartTemplate-toolButton.css");

  const contentDoc = window.document;
  const HEADERSELECTOR = '[data-extensionid="smarttemplate4@thunderbird.extension"].message-header-view-button';
  // [data-extensionid="smarttemplate4@thunderbird.extension"].message-header-view-button
  let headerButton = contentDoc.querySelector(HEADERSELECTOR); //  getElementById(HEADERBARID);
  if (!headerButton) return;
  if (window.SmartTemplate4.Preferences.getMyBoolPref("toolbar.hideLabel")) {
    headerButton.classList.add("force-label-hidden");
  } else {
    headerButton.classList.remove("force-label-hidden");
  }

  // early exit
  if (window.SmartTemplate4?.fileTemplates.isAPIpatched) {
    return;
  }

  /* obsolete
  // ==================================================================
  // old code...
  const HEADERBARID = "smarttemplate4_thunderbird_extension-messageDisplayAction-toolbarbutton";
  headerButton = contentDoc.getElementById(HEADERBARID);
  if (headerButton) { // patch button
    window.setTimeout(
      (win = window) => {
        win.SmartTemplate4_WLM = WL; // make a separate WindowListener instance for message pagen context.
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
    win.SmartTemplate4_WLM = WL;
    if (win.SmartTemplate4.patchHeaderPane.bind(win.SmartTemplate4)) {
      await win.SmartTemplate4.fileTemplates.initMenus(true, {toolbarType:"messageheader"});
    }
  } 
  window.SmartTemplate4.Util.notifyTools.registerListener(reactNotification);
  */

}

function onUnload(isAddOnShutDown) {
 //  window.SmartTemplate4.Util.notifyTools.removeListener(reactNotification);
}

