var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");


//original lds this after xul!!

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");

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


    //messengeroverlay65
//------------------------------------
    // replicate the write / reply / forward buttons on main toolbar
    // these are used for the dropdown functionality of file templates in the main toolbar.
    WL.injectElements(`
    <toolbar id="mail-bar3">
    
      <toolbarbutton 
        id="button-newmsg-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="button-newmsg"
        oncommand="MsgNewMessage(event);" 
        class= "toolbarbutton-1">
      </toolbarbutton>
      
      <toolbarbutton 
        id="button-reply-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="button-reply"
        oncommand="MsgReplySender(event);" 
        class= "toolbarbutton-1">
      </toolbarbutton>
      
      <toolbarbutton 
        id="button-replyall-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="button-replyall"
        oncommand="MsgReplyToAllRecipients(event);" 
        class= "toolbarbutton-1">
      </toolbarbutton>      
      
      <toolbarbutton 
        id="button-replylist-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="button-replylist"
        oncommand="MsgReplyList(event);" 
        class= "toolbarbutton-1">
      </toolbarbutton>      
      
    </toolbar>
     `);
    
    // replicate the write / reply / forward buttons on header toolbar
    // these are used for the dropdown functionality of file templates in the header area.
    WL.injectElements(` 
    <hbox id="header-view-toolbar" class="toolbar">
    
      <toolbarbutton 
        id="hdrReplyButton-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="hdrReplyButton"
        oncommand="MsgReplySender(event); RestoreFocusAfterHdrButton();" 
        class= "toolbarbutton-1">
      </toolbarbutton>
    
<!--    
      <toolbarbutton 
        id="hdrSmartReplyButton-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="hdrSmartReplyButton"
        oncommand="MsgReplySender(event); RestoreFocusAfterHdrButton();" 
        class= "toolbarbutton-1">
      </toolbarbutton>
-->
  
      <toolbarbutton 
        id="hdrReplyAllButton-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="hdrReplyAllButton"
        oncommand="MsgReplyToAllMessage(event); RestoreFocusAfterHdrButton();" 
        class= "toolbarbutton-1">
      </toolbarbutton>
  
      <toolbarbutton 
        id="hdrReplyListButton-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="hdrReplyListButton"
        oncommand="MsgReplyToListMessage(event); RestoreFocusAfterHdrButton();" 
        class= "toolbarbutton-1">
      </toolbarbutton>
  
      <toolbarbutton 
        id="hdrFollowupButton-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="hdrFollowupButton"
        oncommand="MsgReplyGroup(event); RestoreFocusAfterHdrButton();" 
        class= "toolbarbutton-1">
      </toolbarbutton>
  
      <toolbarbutton 
        id="hdrForwardButton-ST" 
        is="toolbarbutton-menu-button" 
        label="" 
        insertafter="hdrForwardButton"
        oncommand="MsgForwardMessage(event); RestoreFocusAfterHdrButton();" 
        class= "toolbarbutton-1">
      </toolbarbutton>
    
    </hbox>
     `);
    
    

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
  <!-- <statusbarpanel insertafter="totalMessageCount" id="SmartTemplate4Panel" class="statusbarpanel"> -->
              <toolbarbutton id="SmartTemplate4Messenger"
                                           class="statusbarpanel-iconic"
                                           label="&smartTemplate4.settings.label;"
                                           tooltiptext="&smartTemplate4.settings.tooltip;"
                                           insertafter="totalMessageCount"
                                           oncommand="window.openDialog('chrome://SmartTemplate4/content/settings.xhtml', 'Preferences', 'chrome,titlebar,toolbar,dependent,centerscreen,resizable');"/>
  <!-- </statusbarpanel> -->
    </hbox>
  
    `, ["chrome://smartTemplate4/locale/smartTemplate-overlay.dtd"]);


    
    window.SmartTemplate4.startUp();

}

function onUnload(isAddOnShutDown) {
  const util = window.SmartTemplate4.Util;
  util.logDebug("onUnload(" + isAddOnShutDown + ")...");
  
  // remove my own function and restore the original
  function removeElements(list) {
    for (let b=0; b<list.length; b++) {
      let id = list[b],
          el = document.getElementById(id);
      if(el)
        el.remove()
    }
  }
  util.logDebug("Remove main toolbar elements...");
  let mainButtons=["button-newmsg-ST", "button-reply-ST", "button-replyall-ST", "button-replylist-ST"];
  removeElements(mainButtons);
  
  util.logDebug("Remove header toolbar elements...");
  let hrBtns = ["hdrSmartReplyButton-ST","hdrReplyAllButton-ST","hdrReplyListButton-ST","hdrFollowupButton-ST", "hdrForwardButton-ST",
                "hdrReplyButton-ST","hdrReplyAllButton-ST","hdrReplyListButton-ST","hdrFollowupButton-ST",
                "hdrReplyToSenderButton-ST","button-reply-ST","button-replyall-ST", "button-replylist-ST"];
  removeElements(hrBtns);
  util.logDebug("onUnload(" + isAddOnShutDown + ") FINISHED");
  
  // clean up all listeners
  window.SmartTemplate4.shutDown(); 
}

