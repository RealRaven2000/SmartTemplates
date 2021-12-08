/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
// Script for splash screen displayed when updating this Extension

// whether these are shown depends on the "endSale" variable in popup.js!
const discountPro = "33%";
const discountRenewal = "25%";
const discountUpgrade = "50%";

  addEventListener("click", async (event) => {
    switch(event.target.id) {
      case "register":    // fall-through
      case "bargainIcon":
        if (event.target.classList.contains("upgrade")) {
          let licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
          messenger.windows.openDefaultBrowser("http://sites.fastspring.com/quickfolders/product/smarttemplateupgrade?referrer=" + licenseInfo.licenseKey);
        }
        else {
          messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/smarttemplate4?referrer=landing-update");
        }
        break;
	    case "bargainRenewIcon":
	    case "bargainUpgradeIcon":
	      messenger.Utilities.showXhtmlPage("chrome://smarttemplate4/content/register.xhtml");
	      window.close(); 
	      break;
      case "stdLink":
        messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/smarttemplatestandard?referrer=splashScreen-standard");
        break;
      case "proLink":
        messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/smarttemplate4?referrer=splashScreen-standard");
        break;
      case "compLink":
        messenger.windows.openDefaultBrowser("https://smarttemplates.quickfolders.org/premium.html#featureComparison");
        break;
      case "whatsNew":
        messenger.Utilities.showVersionHistory();
        break;
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
          userName = await messenger.Utilities.getUserName(),
          addonVer = manifest.version,
          appVer = browserInfo.version,
          remindInDays = 10;

    // internal functions
    function hideSelectorItems(cId) {
      let elements = document.querySelectorAll(cId);
      for (let el of elements) {
        el.setAttribute('collapsed',true);
      }	    
    }
    // force replacement for __MSG_xx__ entities
    // using John's helper method (which calls i18n API)
    i18n.updateDocument();
    
    let h1 = document.getElementById("heading-updated");
    if (h1) {
      // this api function can do replacements for us
      h1.innerText = messenger.i18n.getMessage("heading-updated", addonName);
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
      let expiry = messenger.i18n.getMessage("special-offer-expiry");
      // note: expiry day is set in popup.js "endSale" variable
      specialOffer.innerHTML = messenger.i18n.getMessage("special-offer-content", [expiry, discountPro])
          .replace(/\{boldStart\}/g,"<b>")
          .replace(/\{boldEnd\}/g,"</b>")
          .replace(/\{linkStart\}/, "<a id='stdLink'>")
          .replace(/\{linkEnd\}/g, "</a>")
          .replace(/\{linkStartPro\}/, "<a id='proLink'>");
          
    }
    
    let specialRenew = document.getElementById("specialOfferRenewTxt");
    if (specialRenew) {
      let expiry = messenger.i18n.getMessage("special-offer-expiry");
      // note: expiry day is set in popup.js "endSale" variable
      specialRenew.innerHTML = 
        messenger.i18n.getMessage("special-offer-renew", [expiry, discountRenewal])
          .replace(/\{boldStart\}/g,"<b>")
          .replace(/\{boldEnd\}/g,"</b>");
    }
        
    
    let specialOfferUpgrade = document.getElementById("specialOfferUpgradeTxt");
    if (specialOfferUpgrade) {
      let expiry = messenger.i18n.getMessage("special-offer-expiry");
      // note: expiry day is set in popup.js "endSale" variable
      specialOfferUpgrade.innerHTML = messenger.i18n.getMessage("special-offer-upgrade", [expiry, discountUpgrade])
          .replace(/\{boldStart\}/g,"<b>")
          .replace(/\{boldEnd\}/g,"</b>")
          .replace(/\{linkStart\}/, "<a id='stdLink'>")
          .replace(/\{linkEnd\}/, "</a>");
    }
    
    
    let elementsC = document.querySelectorAll(".featureComparison"),
        txtComp = messenger.i18n.getMessage("licenseComparison")
          .replace(/\{linkStart\}/, "<a id='compLink'>")
          .replace(/\{linkEnd\}/, "</a>");
    for (let el of elementsC) {
      el.innerHTML = txtComp;
    }
    
    let elements = document.querySelectorAll(".specialOfferHead"),
        txtHead = messenger.i18n.getMessage("special-offer-head", addonName);
    for (let el of elements) {
      el.textContent = txtHead;
    }    
          
    let elementsSI = document.querySelectorAll(".specialOfferIntro"),
        txtSI = messenger.i18n.getMessage('special-offer-intro', addonName)
                .replace(/\{boldStart\}/g,"<b>")
                .replace(/\{boldEnd\}/g,"</b>")
                .replace("{name}", userName);
    for (let el of elementsSI) {
      el.innerHTML = txtSI;
    }

    //
    let specialOfferStandard = document.getElementById('specialOfferStandard');
    if (specialOfferStandard) {
      let discount = "50%"; // Upgrade to Pro!
      specialOfferStandard.innerHTML =  messenger.i18n.getMessage('license-standard-special-offer', [userName,discount])
        .replace(/\{boldStart\}/g,"<b>")
        .replace(/\{boldEnd\}/g,"</b>");
    }
    let specialOfferTerms = document.getElementById('specialOfferTerms');
    if (specialOfferTerms) {
      let expiry = messenger.i18n.getMessage("special-offer-expiry");
      specialOfferTerms.innerHTML =  messenger.i18n.getMessage('license-standard-special-terms', [expiry])
        .replace(/\{boldStart\}/g,"<b>")
        .replace(/\{boldEnd\}/g,"</b>");
    } 
    
    let whatsNewLst = document.getElementById('whatsNewList');
    if (whatsNewLst) {
      whatsNewLst.innerHTML =  messenger.i18n.getMessage('whats-new-list')
        .replace(/\{L1\}/g,"<li>")
        .replace(/\{L2\}/g,"</li>")
        .replace(/\{image1\}/g,"<br><img src='snippets.png' style='width:400px;'>")
        .replace("%recipient%","<code>%recipient%</code>")
        .replace("%spellcheck%","<code>%spellcheck()%</code>")
        .replace("%quotePlaceholder%","<code>%quotePlaceholder%</code>");
    }
    
    let ongoing = document.getElementById('ongoing-work');
    if (ongoing) {
      ongoing.innerText = messenger.i18n.getMessage("ongoing-work", addonName);
      
    }
    
    let title = document.getElementById('window-title');
    title.innerText = messenger.i18n.getMessage("window-title", addonName);
           
    updateActions(addonName);

    // addAnimation('body');

  });  

  addEventListener("unload", async (event) => {
    let remindMe = document.getElementById("remind").checked;
  });  



