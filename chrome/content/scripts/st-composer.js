var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

//original lds this after xul!!

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-compose.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-overlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-signature.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-composer.js", window, "UTF-8");
/**/
async function onLoad(activatedWhileWindowOpen) {
  let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
    
  WL.injectElements(`
 
	<toolbarpalette id="MsgComposeToolbarPalette">
		<toolbarbutton 
		  id="smarttemplate4-cleandeferred" 
			class="toolbarbutton-1 AG"
			label="__MSG_smartTemplate4.cleandeferred.label__"
			tooltiptext="__MSG_smartTemplate4.cleandeferred.tooltip__"
			context=""
			onclick="SmartTemplate4.Util.cleanupDeferredFields();"
			>
		</toolbarbutton>

    <toolbarbutton 
		  id="smarttemplate4-changeTemplate" 
			class="toolbarbutton-1 AG"
			label="__MSG_smartTemplate4.changeTemplate.label__"
			tooltiptext="__MSG_smartTemplate4.changeTemplate.tooltip__"
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
				          label="__MSG_smartTemplate4.deferredcontext.update__"
				          oncommand="SmartTemplate4.Util.resolveDeferred(gMsgCompose.editor, event.originalTarget.parentElement.targetNode, false);" 
				          class="cmd menuitem-iconic"
				          />
				<menuitem id="SmartTemplate4-cleanupDeferred"
				          label="__MSG_smartTemplate4.deferredcontext.cleanup__"
				          oncommand="SmartTemplate4.Util.resolveDeferred(gMsgCompose.editor, event.originalTarget.parentElement.targetNode, true);" 
				          class="cmd menuitem-iconic"
				          />
				<menuitem id="SmartTemplate4-deleteDeferred"
				          label="__MSG_smartTemplate4.deferredcontext.delete__"
				          oncommand="SmartTemplate4.Util.removeDeferred(event.originalTarget.parentElement.targetNode);" 
				          class="cmd menuitem-iconic"
				          />
			</menupopup>
		</popupset>
	</window>
	    
    `);

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

  window.SmartTemplate4.Util.notifyTools.enable();
  await window.SmartTemplate4.Util.init();
  // possibly reload the file template dropdown from toolbar button
  window.addEventListener("SmartTemplates.BackgroundUpdate", window.SmartTemplate4.composer.initLicensedUI.bind(window.composer));
}

function onUnload(isAddOnShutDown) {
  try {
    window.SmartTemplate4.Util.notifyTools.disable();
    window.removeEventListener("SmartTemplates.BackgroundUpdate", window.composer.initLicensedUI);
    
    window.document.getElementById('smarttemplate4-cleandeferred').remove();  
    window.document.getElementById('smarttemplate4-changeTemplate').remove();  
    window.document.getElementById('SmartTemplate4-ComposerPopupSet').remove();
    // see: SmartTemplate4.init()
    let origLoadIdFunc = window.SmartTemplate4.original_LoadIdentity;
    if (origLoadIdFunc && LoadIdentity!=origLoadIdFunc) {
      // restore original LoadIdentity function
      LoadIdentity = origLoadIdFunc;
    }    
  }
  catch(ex) {
    
  }
}
