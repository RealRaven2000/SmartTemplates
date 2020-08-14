var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

//original lds this after xul!!
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-compose.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content//smartTemplate-overlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content//smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-rsa.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-register.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-signature.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-composer.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {
    let layout = WL.injectCSS("chrome://smarttemplate4/skin/smartTemplate-overlay.css");
    
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

 
    window.QuickFolders.Util.logDebug('Adding Compose xul...');
}

function onUnload(isAddOnShutDown) {
}
