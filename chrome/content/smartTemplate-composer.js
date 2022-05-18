"use strict";


SmartTemplate4.composer = {
  load: function st4_composerLoad() {
    const Ci = Components.interfaces,
          Cc = Components.classes,
          util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
          
    
    util.logDebug("SmartTemplate4.composer.load");
    
    // NOTE: tried to remove this and replace with 
    //       WL.injectCSS("chrome://SmartTemplate4/content/skin/compose-overlay.css");
    //       in st-copmposer.js
    //       BUT IT DIDN'T WORK
    // **********>>
    
    // we cannot use the old way of adding the style sheet in the xul overlay...
    // .. because it doesn't affect the content area
    // I do not want to inject any of these rules into the Editor's document
    // because I want to avoid polluting the markup with stuff that is strictly
    // reserved to the composing stage
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
          ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
          uri = ios.newURI("chrome://SmartTemplate4/content/skin/compose-overlay.css", null, null);
          
    // for some reason this affects the 3pane window, too
    if(!sss.sheetRegistered(uri, sss.USER_SHEET))
      sss.loadAndRegisterSheet(uri, sss.USER_SHEET);    
    
    // <<**********
    
    // thanks to Joerg K. for pointing this one out:
    window.document.getElementById("msgcomposeWindow").addEventListener("compose-send-message", 
      function (e) { 
        util.composerSendMessage(e); // pass on event in case we need it.
      }
    );
    
    let toolbarId = "composeToolbar2";
    
    // add toolbarbutton for changing template
    if (prefs.getMyBoolPref ('changeTemplate.button.install')) {
      setTimeout (
        function st4_installChangeTemplateBtn() {
          if (util.installButton(toolbarId, "smarttemplate4-changeTemplate", "button-save"))
            prefs.setMyBoolPref('changeTemplate.button.install', false); // log the fact we installed it to avoid re-adding it.
        }
        , 1000
      );
    }
    
    // add toolbarbutton for deferred variables
    if (!prefs.getMyBoolPref('cleanDeferredButton.installer')) {
      setTimeout (
        function st4_installCleanBtn() {
          if (util.installButton(toolbarId, "smarttemplate4-cleandeferred", "button-save"))
            prefs.setMyBoolPref('cleanDeferredButton.installer', true); // log the fact we installed it to avoid re-adding it.
        }
        , 4000
      );
    }
    
    // add toolbarbutton for insert snippet
    if (prefs.getMyBoolPref ('insertSnippet.button.install')) {
      setTimeout (
        function st4_installChangeTemplateBtn() {
          util.logDebug("Adding insert Snippet button...")
          if (util.installButton(toolbarId, "smarttemplate4-insertSnippet", "button-save"))
            prefs.setMyBoolPref('insertSnippet.button.install', false); // log the fact we installed it to avoid re-adding it.
        }
        , 1000
      );
    }
    
    
  }, // load ()
  
  initTemplateMenu: function initTemplateMenu() {
    SmartTemplate4.Util.logDebug("composer.initTemplateMenu() ...");
    // load menu with templates to button-save
    const Ci = Components.interfaces,
          fT = SmartTemplate4.fileTemplates,
          prefs = SmartTemplate4.Preferences;
    let templatePopup = window.document.getElementById('button-TemplatePopup');
    if (!templatePopup) return;
    
    // clear previous menu (in case we haven't added the button to the toolbar)
    // the Template Menu is rebuilt if it is being clicked
    for (let j=templatePopup.childNodes.length-1; j>=0; j--) {
      let cN = templatePopup.childNodes[j];
      if (cN.tagName == "menuseparator" || cN.tagName == "menuitem" || cN.tagName == "menu" || cN.tagName == "menupopup")
        templatePopup.removeChild(cN);
    }
    
    fT.loadCustomMenu(false).then(
      function smartTemplatesLoaded() {
        let compCase = "",
            entries = null;
        const msgComposeType = Ci.nsIMsgCompType;
        switch(gMsgCompose.type) {
          case msgComposeType.Template: // Tb template
          case msgComposeType.New:
          case msgComposeType.NewsPost:
          case msgComposeType.MailToUrl:
          case msgComposeType.EditAsNew: // do we allow this? not now.
            compCase="new";
            entries = fT.Entries.templatesNew;
            break;
          case msgComposeType.Reply:
          case msgComposeType.ReplyAll:
          case msgComposeType.ReplyToSender:
          case msgComposeType.ReplyToGroup:
          case msgComposeType.ReplyToSenderAndGroup:
          case msgComposeType.ReplyToList:
            compCase="rsp";
            entries = fT.Entries.templatesRsp;
            break;
          case msgComposeType.ForwardAsAttachment:
          case msgComposeType.ForwardInline:
            compCase="fwd";
            entries = fT.Entries.templatesFwd;
            break;
          case msgComposeType.EditTemplate:
          case msgComposeType.Draft:
            break;
        }
        if (compCase) {
          fT.configureMenu(entries, templatePopup, compCase, false); // build appropriate menu, minus the configuration option.
        }
        else
          templatePopup.disabled = true;
      }
    );
  } ,
  
  initSnippetMenu : function() {
    SmartTemplate4.Util.logDebug("composer.initSnippetMenu() ...");
    // load menu with templates to button-save
    const Ci = Components.interfaces,
          fT = SmartTemplate4.fileTemplates,
          prefs = SmartTemplate4.Preferences;
    let snippetPopup = window.document.getElementById('button-SnippetPopup');
    if (!snippetPopup) return;
    // clear previous menu (in case we haven't added the button to the toolbar)
    // the Template Menu is rebuilt if it is being clicked
    for (let j=snippetPopup.childNodes.length-1; j>=0; j--) {
      let cN = snippetPopup.childNodes[j];
      if (cN.tagName == "menuseparator" || cN.tagName == "menuitem" || cN.tagName == "menu" || cN.tagName == "menupopup")
        snippetPopup.removeChild(cN);
    }    
    
    fT.loadCustomMenu(false).then(
      function smartTemplatesLoaded() {
        let compCase = "snippets",
            entries = fT.Entries.snippets;
        fT.configureMenu(entries, snippetPopup, compCase, true); // build appropriate menu, PLUS the configuration option.
      }
    );    
  } , 
  
  
  selectTemplateFromMenu : function selectTemplateFromMenu(element) {
    const util = SmartTemplate4.Util;
    let isHandled = false;
    if (!SmartTemplate4.fileTemplates.armedEntry || !SmartTemplate4.fileTemplates.armedEntry.path) {
      if (element && element.id == "smarttemplate4-changeTemplate") {
        if (element.hasMenu()) {
          element.setAttribute("open","true");
          element.openMenu(true);
          isHandled = true;
        }
      }
      if (!isHandled) {
        let wrn = util.getBundleString("st.fileTemplates.selectFromMenu");
        SmartTemplate4.Message.display(
          wrn,
          "centerscreen,titlebar,modal,dialog",
          { ok: function() {  
                  // get last composer window and bring to foreground
                  let composerWin = Services.wm.getMostRecentWindow("msgcompose");
                  if (composerWin) {
                    // refresh the template menu
                    SmartTemplate4.composer.initTemplateMenu(); // make sure there are some menu items now.
                    composerWin.focus();
                  }
                }
          }, 
          window
        );
      }
    }
    else
      SmartTemplate4.notifyComposeBodyReady(null, true, window);
    // SmartTemplate4.fileTemplates.onItemClick(menuitem, msgPopup.parentNode, fT, composeType, theTemplate.path, theTemplate.label, event); 
  },
  
  selectSnippetFromMenu: function(element) {
    let isHandled = false;
    if (!SmartTemplate4.fileTemplates.armedEntry || !SmartTemplate4.fileTemplates.armedEntry.path) {
      if (element && element.id == "smarttemplate4-insertSnippet") {
        if (element.hasMenu()) {
          element.setAttribute("open","true");
          element.openMenu(true);
          isHandled = true;
        }
      }
      if (!isHandled)        
        SmartTemplate4.Util.popupAlert("SmartTemplates", 
          "An error occured with the selected file. Either it can't be found or there was a problem accessing it.");
        
    }
    else {
      SmartTemplate4.fileTemplates.insertFileEntryInComposer(SmartTemplate4.fileTemplates.armedEntry);
    }
  },
  
  // update for license changes
  initLicensedUI: function () {
   
  }
  
};


(
function() 
  {
    // return; // let's do this from the background script!
    const util = SmartTemplate4.Util,
          logDebugOptional = util.logDebugOptional.bind(util),
          isDebugComposer = SmartTemplate4.Preferences.isDebugOption('composer');
          
    let txt = "unknown";
    if (isDebugComposer) debugger;
    try { txt = window.document.firstElementChild.getAttribute('windowtype'); }
    catch(ex) {;}
    logDebugOptional('composer', "Adding compose-window-init event listener for msgcomposeWindow...");
    
    let composer = document.getElementById("msgcomposeWindow");
    composer.addEventListener("compose-window-init", SmartTemplate4.initListener, false);
    
    SmartTemplate4.init();
    
    // safety for when the compose-window-init event does not fire (Tb 67+)
    if (typeof ComposeStartup == 'function') {
      if (!SmartTemplate4.ComposeStartup) {
        if (isDebugComposer) debugger;
        SmartTemplate4.ComposeStartup = ComposeStartup;
        ComposeStartup = function() {
          logDebugOptional('composer','Calling ComposeStartup from Wrapper');
          SmartTemplate4.ComposeStartup();
          logDebugOptional('composer','Calling initListener');
          SmartTemplate4.initListener(true);
          // SmartTemplate4.composer.initTemplateMenu();
        }
      }
    }
  }
)();
