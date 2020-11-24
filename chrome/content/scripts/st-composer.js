var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

//original lds this after xul!!

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-compose.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-overlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-rsa.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-register.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-signature.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-composer.js", window, "UTF-8");
/**/
function onLoad(activatedWhileWindowOpen) {
 console.log("st-compose");
    let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
    
    WL.injectElements(`
 
	<!-- Toolbar -->
	<toolbarpalette id="MsgComposeToolbarPalette">
		<toolbarbutton 
		  id="smarttemplate4-cleandeferred" 
			class="toolbarbutton-1 AG"
			label="&smartTemplate4.cleandeferred.label;"
			tooltiptext="&smartTemplate4.cleandeferred.tooltip;"
			context=""
			onclick="SmartTemplate4.Util.cleanupDeferredFields();"
			>
		</toolbarbutton>
		<!-- [issue 24] Select a different template in Composer..	-->

    <toolbarbutton 
		  id="smarttemplate4-changeTemplate" 
			class="toolbarbutton-1 AG"
			label="&smartTemplate4.changeTemplate.label;"
			tooltiptext="&smartTemplate4.changeTemplate.tooltip;"
      type="menu-button"
			context=""
			oncommand="SmartTemplate4.composer.selectTemplateFromMenu();">
        <menupopup id="button-TemplatePopup">
        </menupopup>      
      </toolbarbutton>
    
    
	</toolbarpalette>
	
  <window id="msgcomposeWindow">
		<popupset id="SmartTemplate4-ComposerPopupSet">
			<menupopup id="SmartTemplate4-ComposerPopup" 
			           class="SmartTemplate4-ComposerPopup">
				<menuitem id="SmartTemplate4-replaceDeferred"
				          label="&smartTemplate4.deferredcontext.update;"
				          oncommand="SmartTemplate4.Util.resolveDeferred(gMsgCompose.editor, event.originalTarget.parentElement.targetNode, false);" 
				          class="cmd menuitem-iconic"
				          />
				<menuitem id="SmartTemplate4-cleanupDeferred"
				          label="&smartTemplate4.deferredcontext.cleanup;"
				          oncommand="SmartTemplate4.Util.resolveDeferred(gMsgCompose.editor, event.originalTarget.parentElement.targetNode, true);" 
				          class="cmd menuitem-iconic"
				          />
				<menuitem id="SmartTemplate4-deleteDeferred"
				          label="&smartTemplate4.deferredcontext.delete;"
				          oncommand="SmartTemplate4.Util.removeDeferred(event.originalTarget.parentElement.targetNode);" 
				          class="cmd menuitem-iconic"
				          />
			</menupopup>
		</popupset>
	</window>
	    
    `, ["chrome://smartTemplate4/locale/smartTemplate-overlay.dtd"]);

    let test = false;
    if (test) {
		const st4 = window.SmartTemplate4,
          util = st4.Util,
					logDebugOptional = util.logDebugOptional.bind(util),
					isDebugComposer = st4.Preferences.isDebugOption('composer');
          
		let txt = "unknown";
    if (isDebugComposer) debugger;
		try { txt	= window.document.firstElementChild.getAttribute('windowtype'); }
		catch(ex) {;}
		logDebugOptional('composer', "Adding compose-window-init event listener for msgcomposeWindow...");
		
		let composer = document.getElementById("msgcomposeWindow");
		composer.addEventListener("compose-window-init", st4.initListener, false);
		
		st4.init();
		// debugger;
		
		util.logDebug("Calling SmartTemplate4.composer.load from window: " + txt);
		// safety for when the compose-window-init event does not fire (Tb 67+)
		if (typeof ComposeStartup == 'function') {
			// if (util.versionGreaterOrEqual(util.AppverFull, "61")) 
			if (!st4.ComposeStartup) {
				if (isDebugComposer) debugger;
				st4.ComposeStartup = ComposeStartup;
				ComposeStartup = function() {
					logDebugOptional('composer','Calling ComposeStartup Wrapper');
					st4.ComposeStartup();
					logDebugOptional('composer','Calling initListener');
					st4.initListener(true);
          st4.composer.initTemplateMenu();
				}
			}
		}
    // add the style sheet.
		st4.composer.load();
    }

}

function onUnload(isAddOnShutDown) {
  try {
    window.document.getElementById('smarttemplate4-cleandeferred').remove();  
    window.document.getElementById('smarttemplate4-changeTemplate').remove();  
    window.document.getElementById('SmartTemplate4-ComposerPopupSet').remove();
  }
  catch(ex) {
    
  }
}
