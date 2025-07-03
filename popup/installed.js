/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
// Script for splash screen displayed when installing this Extension

/*
 globals
   ariaPoliteUpdate,
   addAriaHint,
   formatAll,
   i18n,
   openSupportForm,
   show, 
   updateActions,
   */

addEventListener("click", async (event) => {
	if (event.target.id.startsWith("register")) {
	  messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/smarttemplate4?referrer=landing-install");
	}
	if (
    event.target.id.startsWith("extend") ||
    event.target.id.startsWith("renew") ||
    event.target.id.startsWith("upgrade")
  ) {
    messenger.Utilities.showXhtmlPage("chrome://smarttemplate4/content/register.xhtml");
    window.close();
  }
	if (event.target.id.startsWith("donate")) {
	  messenger.windows.openDefaultBrowser("https://smarttemplates.quickfolders.org/contribute.html#donate");
	}
  if (event.target.id == "whatsNew") {
    messenger.Utilities.showVersionHistory();
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
    addonVer = manifest.version,
    appVer = browserInfo.version;

  // force replacement for __MSG_xx__ entities
  // using John's helper method (which calls i18n API)
  i18n.updateDocument();

  const h1 = document.getElementById("heading-installed");
  ariaPoliteUpdate(h1, messenger.i18n.getMessage('heading-installed', addonName));
  
  const thanksInfo = document.getElementById('thanks-for-installing-intro');
  ariaPoliteUpdate(thanksInfo, messenger.i18n.getMessage("thanks-for-installing-intro", addonName));
  
  const verInfo = document.getElementById("active-version-info");
  // HTML replacement
  ariaPoliteUpdate(verInfo,
    messenger.i18n.getMessage("active-version-info", [addonVer, appVer])
      .replace("{boldStart}","<b class='versionnumber'>")
      .replace("{boldEnd}","</b>"),
    true
  );   
  
  const suggestion = document.getElementById("support-suggestion");
  ariaPoliteUpdate(suggestion, messenger.i18n.getMessage("support-suggestion", addonName));
  
  const preference = document.getElementById("support-preference");
  ariaPoliteUpdate(preference, messenger.i18n.getMessage("support-preference", addonName));
  

  const ongoing = document.getElementById("ongoing-work");
  ariaPoliteUpdate(ongoing, messenger.i18n.getMessage("ongoing-work", addonName));
  
  const title = document.getElementById("window-title");
  ariaPoliteUpdate(title, messenger.i18n.getMessage("window-title", addonName));
  
  updateActions(addonName);

  ariaPoliteUpdate(
    document.getElementById("newsIntro"),
    formatAll(messenger.i18n.getMessage("newsSection.intro")),
    true
  );

  ariaPoliteUpdate(
    document.getElementById("newsImportant"),
    formatAll(messenger.i18n.getMessage("newsSection.important")),
    true
  );

  const innerWrapper = document.getElementById("innerwrapper");
  innerWrapper.querySelectorAll("a.contactsupport").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
        const topic = link.dataset.topic || null;
        openSupportForm(topic);
    });
  });
  
  setTimeout(
    () => {
      show("newsHead");
      show("newsIntro");
      show("newsImportant");
      show("newsSection");
    },
    150
  );

  //  you can close the window using ESC
  addAriaHint(); 
});  
  





