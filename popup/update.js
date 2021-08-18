/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
// Script for splash screen displayed when updating this Extension

  addEventListener("click", async (event) => {
    if (event.target.id.startsWith("register") || event.target.id == 'bargainIcon') {
      if (event.target.classList.contains("upgrade")) {
        let licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});

        messenger.windows.openDefaultBrowser("http://sites.fastspring.com/quickfolders/product/smarttemplateupgrade?referrer=" + licenseInfo.licenseKey);
      }
      else {
        messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/smarttemplate4?referrer=landing-update");
      }
    }
    if (event.target.id=='whatsNew') {
      messenger.Utilities.showVersionHistory();    
    }
    if (event.target.id.startsWith("extend") || event.target.id.startsWith("renew") || event.target.id=="upgrade") {
      messenger.Utilities.showXhtmlPage("chrome://smarttemplate4/content/register.xhtml");
      window.close(); // not allowed by content script!
    }
    if (event.target.id.startsWith("donate")) {
      messenger.windows.openDefaultBrowser("https://smarttemplates.quickfolders.org/contribute.html#donate");
    }
  });  



  addEventListener("load", async (event) => {
    const manifest = await messenger.runtime.getManifest(),
          browserInfo = await messenger.runtime.getBrowserInfo(),
          addonName = manifest.name,
          addonVer = manifest.version,
          appVer = browserInfo.version,
          remindInDays = 10;

    // force replacement for __MSG_xx__ entities
    // using John's helper method (which calls i18n API)
    i18n.updateDocument();
    
    let h1 = document.getElementById('heading-updated');
    if (h1) {
      // this api function can do replacements for us
      h1.innerText = messenger.i18n.getMessage('heading-updated', addonName);
    }
    
    let thanksInfo = document.getElementById('thanks-for-updating-intro');
    if (thanksInfo) {
      thanksInfo.innerText = messenger.i18n.getMessage("thanks-for-updating-intro", addonName);
    }
    
    let verInfo = document.getElementById('active-version-info');
    if (verInfo) {
      // use the i18n API      
      // You are now running <b class="versionnumber">version {version}</b> on Thunderbird {appver}.
      // for multiple replacements, pass an array
      verInfo.innerHTML = messenger.i18n.getMessage("active-version-info", [addonVer, appVer])
        .replace("{boldStart}","<b class='versionnumber'>")
        .replace("{boldEnd}","</b>");
    }
    
    let timeAndEffort =  document.getElementById('time-and-effort');
    if (timeAndEffort) {
      timeAndEffort.innerText = messenger.i18n.getMessage("time-and-effort", addonName);
    }
    
    
    let suggestion = document.getElementById('support-suggestion');
    if (suggestion) {
      suggestion.innerText = messenger.i18n.getMessage("support-suggestion", addonName);
    }
    
    let preference = document.getElementById('support-preference');
    if (preference) {
      preference.innerText = messenger.i18n.getMessage("support-preference", addonName);
    }
    
    let remind = document.getElementById('label-remind-me');
    if (remind) {
      remind.innerText = messenger.i18n.getMessage("label-remind-me", remindInDays);
      
    }
    
    let specialOffer = document.getElementById('specialOfferTxt');
    if (specialOffer) {
      let discount = "33%";
      specialOffer.innerHTML = messenger.i18n.getMessage("special-offer-content", [discount])
          .replace(/\{boldStart\}/g,"<b>")
          .replace(/\{boldEnd\}/g,"</b>");
    }
          
    let userName = await messenger.Utilities.getUserName();
    let specialIntro = document.getElementById('specialOfferIntro');
    if (specialIntro) {
      specialIntro.innerHTML =  messenger.i18n.getMessage('special-offer-intro')
        .replace(/\{boldStart\}/g,"<b>")
        .replace(/\{boldEnd\}/g,"</b>")
        .replace("{name}", userName);
    }
    let specialOfferStandard = document.getElementById('specialOfferStandard');
    if (specialOfferStandard) {
      let discount = "40%";
      specialOfferStandard.innerHTML =  messenger.i18n.getMessage('license-standard-special-offer', [userName,discount])
        .replace(/\{boldStart\}/g,"<b>")
        .replace(/\{boldEnd\}/g,"</b>");
    }
    let specialOfferTerms = document.getElementById('specialOfferTerms');
    if (specialOfferTerms) {
      specialOfferTerms.innerHTML =  messenger.i18n.getMessage('license-standard-special-terms')
        .replace(/\{boldStart\}/g,"<b>")
        .replace(/\{boldEnd\}/g,"</b>");
    } 
    
    let whatsNewLst = document.getElementById('whatsNewList');
    if (whatsNewLst) {
      whatsNewLst.innerHTML =  messenger.i18n.getMessage('whats-new-list')
        .replace(/\{L1\}/g,"<li>")
        .replace(/\{L2\}/g,"</li>");
      
    }
    
    let ongoing = document.getElementById('ongoing-work');
    if (ongoing) {
      ongoing.innerText = messenger.i18n.getMessage("ongoing-work", addonName);
      
    }
    
    let title = document.getElementById('window-title');
    title.innerText = messenger.i18n.getMessage("window-title", addonName);
           
    updateActions(addonName);

    addAnimation('body');

  });  

  addEventListener("unload", async (event) => {
    let remindMe = document.getElementById("remind").checked;
  });  



