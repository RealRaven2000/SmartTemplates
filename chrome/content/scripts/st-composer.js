var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

//original lds this after xul!!

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-compose.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-overlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-prefs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-signature.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-fileTemplates.js", window, "UTF-8");

// this script will call initListener in order to be ready for NotifyComposeBodyReady:
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-composer.js", window, "UTF-8");
/**/

var mylisteners = {};

async function onLoad(activatedWhileWindowOpen) {
  window.SmartTemplate4.Util.logHighlightDebug("st-composer.js - onLoad()", "yellow");
  let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay.css");
  
  // Version specific code / style fixes
  if (window.SmartTemplate4.Util.versionGreaterOrEqual(window.SmartTemplate4.Util.AppverFull, "102")) {
    WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-overlay-102.css");
  }

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
      is="toolbarbutton-menu-button"
			oncommand="SmartTemplate4.composer.selectTemplateFromMenu(this);">
      <menupopup id="button-TemplatePopup">
      </menupopup>      
    </toolbarbutton>
    
    <toolbarbutton 
		  id="smarttemplate4-insertSnippet" 
			class="toolbarbutton-1 AG"
			label="__MSG_insertSnippet.button__"
			tooltiptext="__MSG_insertSnippet.tooltip__"
      type="menu-button"
      is="toolbarbutton-menu-button"
			oncommand="SmartTemplate4.composer.selectSnippetFromMenu(this);">
      <menupopup id="button-SnippetPopup">
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
    
  // WL.injectCSS("chrome://SmartTemplate4/content/skin/compose-overlay.css");    not working for editor document!
  WL.injectCSS("chrome://Smarttemplate4/content/skin/st-toolbar-overlay.css");

  // tried to call initListener here but it was too late already ... 

  window.SmartTemplate4.Util.notifyTools.enable();
  await window.SmartTemplate4.Util.init();
  // window.SmartTemplate4.composer.onLoad(); // TOO LATE FOR WRAPPING ComposeStartup !!!
  // possibly reload the file template dropdown from toolbar button
  window.addEventListener("SmartTemplates.BackgroundUpdate", window.SmartTemplate4.composer.initLicensedUI.bind(window.SmartTemplate4.composer));
  // add the style sheet, buttons for cleaning and template selector
	//	util.logDebug("Calling SmartTemplate4.composer.load from window: " + txt);
	window.SmartTemplate4.composer.load();
  
  window.SmartTemplate4.composer.initTemplateMenu(); // since this is expensive, let's not call it from ComposeStartup it can be done later.
  window.SmartTemplate4.composer.initSnippetMenu();
  
  mylisteners["updateTemplateMenus"] = window.SmartTemplate4.composer.initTemplateMenu.bind(window.SmartTemplate4.composer);
  mylisteners["updateSnippetMenus"] =  window.SmartTemplate4.composer.initSnippetMenu.bind(window.SmartTemplate4.composer);
  for (let m in mylisteners) {
    window.addEventListener(`SmartTemplates.BackgroundUpdate.${m}` , mylisteners[m]); 
  }  
}

function onUnload(isAddOnShutDown) {
  try {
    window.SmartTemplate4.Util.notifyTools.disable();
    window.removeEventListener("SmartTemplates.BackgroundUpdate", window.SmartTemplate4.composer.initLicensedUI);
    for (let m in mylisteners) {
      window.removeEventListener(`SmartTemplates.BackgroundUpdate.${m}`, mylisteners[m]);
    }    
    
    window.document.getElementById('smarttemplate4-cleandeferred').remove();  
    window.document.getElementById('smarttemplate4-changeTemplate').remove();  
    window.document.getElementById('smarttemplate4-insertSnippet').remove();  
    window.document.getElementById('SmartTemplate4-ComposerPopupSet').remove();
    // see: SmartTemplate4.init()
    let origLoadIdFunc = window.SmartTemplate4.original_LoadIdentity;
    if (origLoadIdFunc && LoadIdentity!=origLoadIdFunc) {
      // restore original LoadIdentity function
      LoadIdentity = origLoadIdFunc;
    }    
    // deprecated test code (from 3.12.3pre***)
    if (window.SmartTemplate4.Util.versionGreaterOrEqual(window.SmartTemplate4.Util.Appver, "102")) {
      let origComposeStartup = window.SmartTemplate4.original_ComposeStartup;
      if (origComposeStartup && origComposeStartup!=ComposeStartup) {
        // restore original function
        ComposeStartup = origComposeStartup;
      }
    }
  }
  catch(ex) {
    
  }
}
