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
    
 


    //messengeroverlay65
//------------------------------------

    WL.injectElements(`
    <toolbar id="mail-bar3">
      <toolbarbutton 
        id="button-newmsg-ST" 
        is="toolbarbutton-menu-button" 
        observes="cmd_newMessage" 
        label="" 
        insertafter="button-newmsg"
        oncommand="MsgNewMessage(event)" 
        class= "toolbarbutton-1">
      </toolbarbutton>
    </toolbar>
     `);
    
    /*
    setTimeout(function() {
      debugger;
      let b1 = document.getElementById('button-newmsg'),
          b2 = document.getElementById('button-newmsg-ST');
      b1.parentNode.insertBefore(b2,b1.nextSibling);
    },15000);
    */
    
    

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
	
    window.setTimeout(function() {
      if (window.document.URL.endsWith("messenger.xhtml"))
          window.SmartTemplate4.updateStatusBar("default");
    }, 2000);

}

function onUnload(isAddOnShutDown) {
    // remove my own function and restore the original
 

}

