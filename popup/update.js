/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
// Script for splash screen displayed when updating this Extension

/*
  globals
    ariaPoliteUpdate,
    addAriaHint,
    discountRate,
    formatAll,
    openSupportForm,
    updateActions,
    updateWithSafeHtml,
*/


// whether these are shown depends on the "sales_end" variable in popup.js!
//  import {discountRate, compatibleVer} from "./sales.js";

  addEventListener("click", async (event) => {
    if (
      event.target.id.startsWith("extend") ||
      event.target.id.startsWith("renew") ||
      event.target.id == "upgrade"
    ) {
      messenger.Utilities.showXhtmlPage("chrome://smarttemplate4/content/register.xhtml");
      window.close();
    }    
    switch (event.target.id) {
      case "register": // fall-through
      case "bargainIcon":
        if (event.target.classList.contains("upgrade")) {
          let licenseInfo = await messenger.runtime.sendMessage({ command: "getLicenseInfo" });
          messenger.windows.openDefaultBrowser(
            "http://sites.fastspring.com/quickfolders/product/smarttemplateupgrade?" +
              `contact_email=${licenseInfo.email}` +
              `&referrer=${licenseInfo.licenseKey}`
          );
        } else {
          messenger.windows.openDefaultBrowser(
            "https://sites.fastspring.com/quickfolders/product/smarttemplate4?referrer=landing-update"
          );
        }
        break;
      case "bargainRenewIcon":
      case "bargainUpgradeIcon":
        messenger.Utilities.showXhtmlPage("chrome://smarttemplate4/content/register.xhtml");
        window.close();
        break;
      case "stdLink":
        messenger.windows.openDefaultBrowser(
          "https://sites.fastspring.com/quickfolders/product/smarttemplatestandard?referrer=splashScreen-standard"
        );
        break;
      case "proLink":
        messenger.windows.openDefaultBrowser(
          "https://sites.fastspring.com/quickfolders/product/smarttemplate4?referrer=splashScreen-standard"
        );
        break;
      case "compLink":
        messenger.windows.openDefaultBrowser(
          "https://smarttemplates.quickfolders.org/premium.html#featureComparison"
        );
        break;
      case "whatsNew":
        messenger.Utilities.showVersionHistory();
        break;
    }
    
    if (event.target.classList.contains("issue")) {
      let issueId = event.target.getAttribute("no");
      if (issueId) {
        messenger.windows.openDefaultBrowser(`https://github.com/RealRaven2000/SmartTemplates/issues/${issueId}`);
      }
    }    

    if (event.target.classList.contains("bugzilla")) {
      let bugId = event.target.getAttribute("no");
      if (bugId) {
        messenger.windows.openDefaultBrowser(
          `https://bugzilla.mozilla.org/show_bug.cgi?id=${bugId}`
        );
      }
    }    
    

    if (event.target.id.startsWith("donate")) {
      messenger.windows.openDefaultBrowser("https://smarttemplates.quickfolders.org/contribute.html#donate");
    }
  });  

  window.addEventListener("keydown", (event) => {
    if (event.key == "Escape") {
      window.close();
    }
  });

  addEventListener("load", async (_event) => {
    const manifest = await messenger.runtime.getManifest(),
      browserInfo = await messenger.runtime.getBrowserInfo(),
      addonName = manifest.name,
      userName = await messenger.Utilities.getUserName(),
      addonVer = manifest.version,
      appVer = browserInfo.version;
    const salesEnd = messenger.i18n.getMessage("special-offer-expiry");

    // force replacement for __MSG_xx__ entities
    // using John's helper method (which calls i18n API)
    i18n.updateDocument();

    const h1 = document.getElementById("heading-updated");
    ariaPoliteUpdate(h1, messenger.i18n.getMessage("heading-updated", addonName));

    const thanksInfo = document.getElementById("thanks-for-updating-intro");
    ariaPoliteUpdate(thanksInfo, messenger.i18n.getMessage("thanks-for-updating-intro", addonName));

    const verInfo = document.getElementById("active-version-info");
    ariaPoliteUpdate(
      verInfo,
      messenger.i18n
        .getMessage("active-version-info", [addonVer, appVer])
        .replace("{boldStart}", "<b class='versionnumber'>")
        .replace("{boldEnd}", "</b>"),
      true
    );

    const preference = document.getElementById("support-preference");
    ariaPoliteUpdate(preference, messenger.i18n.getMessage("support-preference", addonName));

    const specialOffer = document.getElementById("specialOfferTxt");
    ariaPoliteUpdate(
      specialOffer,
      messenger.i18n
        .getMessage("special-offer-content", [salesEnd, discountRate.discountPro])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>")
        .replace(/\{linkStart\}/, "<a id='stdLink'>")
        .replace(/\{linkEnd\}/g, "</a>")
        .replace(/\{linkStartPro\}/, "<a id='proLink'>"),
      true
    );

    const specialRenew = document.getElementById("specialOfferRenewTxt");
    ariaPoliteUpdate(
      specialRenew,
      // note: expiry day is set in popup.js "sales_end" variable
      messenger.i18n
        .getMessage("special-offer-renew", [salesEnd, discountRate.discountRenewal])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>"),
      true
    );

    const specialOfferUpgrade = document.getElementById("specialOfferUpgradeTxt");
    ariaPoliteUpdate(
      specialOfferUpgrade,
      // note: expiry day is set in popup.js "sales_end" variable
      messenger.i18n
        .getMessage("special-offer-upgrade", [salesEnd, discountRate.discountUpgrade])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>")
        .replace(/\{linkStart\}/, "<a id='stdLink'>")
        .replace(/\{linkEnd\}/, "</a>"),
      true
    );

    const txtComp = messenger.i18n
        .getMessage("licenseComparison")
        .replace(/\{linkStart\}/, "<a id='compLink'>")
        .replace(/\{linkEnd\}/, "</a>"); 
    updateWithSafeHtml(".featureComparison", txtComp);

    // let elements = document.querySelectorAll(".specialOfferHead"),
    //     txtHead = messenger.i18n.getMessage("special-offer-head", addonName);
    // for (let el of elements) {
    //   el.textContent = txtHead;
    // }
    const txtSI = messenger.i18n
      .getMessage("special-offer-intro", addonName)
      .replace(/\{boldStart\}/g, "<b>")
      .replace(/\{boldEnd\}/g, "</b>")
      .replace("{name}", userName);
    updateWithSafeHtml(".specialOfferIntro", txtSI);

    //
    const specialOfferStandard = document.getElementById("specialOfferStandard");
    ariaPoliteUpdate(
      specialOfferStandard,
      messenger.i18n
        .getMessage("license-standard-special-offer", [userName, discountRate.discountUpgrade])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>"),
      true
    );

    const specialOfferTerms = document.getElementById("specialOfferTerms");
    ariaPoliteUpdate(
      specialOfferTerms,
      messenger.i18n
        .getMessage("license-standard-special-terms", [salesEnd])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>"),
      true
    );

    const whatsNewLst = document.getElementById("whatsNewList");
    ariaPoliteUpdate(
      whatsNewLst,
      `<ul>${formatAll(messenger.i18n.getMessage("whats-new-list"))}</ul>`,
      true
    );

    const introText = messenger.i18n.getMessage("newsSection.intro");
    const importantText = messenger.i18n.getMessage("newsSection.important");

    const newsIntro = document.getElementById("newsIntro");
    ariaPoliteUpdate(newsIntro, formatAll(introText), true);

    const newsImportant = document.getElementById("newsImportant");
    ariaPoliteUpdate(newsImportant, formatAll(importantText), true);

    const ongoing = document.getElementById("ongoing-work");
    ariaPoliteUpdate(ongoing, messenger.i18n.getMessage("ongoing-work", addonName));

    const title = document.getElementById("window-title");
    ariaPoliteUpdate(title, messenger.i18n.getMessage("window-title", addonName));

    updateActions(addonName);

    const innerWrapper = document.getElementById("innerwrapper");
    innerWrapper.querySelectorAll("a.contactsupport").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const topic = link.dataset.topic || null;
        openSupportForm(topic);
      });
    });

    //  you can close the window using ESC
    addAriaHint();
  });  



