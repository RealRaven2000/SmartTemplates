// Likely Obsolete for THunderbird 78 
// Web Extensions will probably not be allowed to modify Thunderbird Options. :(
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-main.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://smarttemplate4/content/smartTemplate-accounts.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {
    let layout = WL.injectCSS("chrome://smarttemplate4/content/skin/smartTemplate-accounts.css");
 
    WL.injectElements(`
    
    <vbox flex="1" id="compositionAndAddressing">
      <groupbox>
        <label class="header"
               id="smartTemplate4_caption">&smarttemplate4_title;</label>
        <hbox>
          <button id="smartTemplate4_settings"
                  class="buttonIcon"
                  label="&smarttemplate4_button;"
                  oncommand="SmartTemplate4.openSettings();"
                  />
        </hbox>
      </groupbox>
    </vbox>
	
    
    `, ["chrome://smartTemplate4/locale/smartTemplate-accountManager.dtd"]);

}

function onUnload(isAddOnShutDown) {
  window.document.getElementById('smartTemplate4_caption').remove();
  window.document.getElementById('smartTemplate4_settings').remove();
}
