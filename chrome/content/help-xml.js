/* load help.js first */

function initXHTML() {
  // avoid running xul code:
  if (findOrigin() == "html") {
    // EARLY EXIT, let's run help-html.js instead
    console.log("help.js early exit...");
    return;
  }
  isDebugLegacyOption = function () {
    const isDebug = true;
    return isDebug;
  }
  // [mx l10n] 

  var { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");

  let extension = ExtensionParent.GlobalManager.getExtension("smarttemplate4@thunderbird.extension");
  Services.scriptloader.loadSubScript(
    extension.rootURI.resolve("chrome/content/i18n.js"),
    window,
    "UTF-8"
  );
  window.i18n.updateDocument({extension});

  var myheadings = Array.from(document.getElementsByClassName("helpchapter"));
  myheadings.forEach((el) => {
    // for purpose of search / focus()
    el.setAttribute("tabindex", -1);
  });  

  fixClipboardNote();
  initSearch();
} 

window.document.addEventListener('DOMContentLoaded', 
initXHTML, 
{ once: true });

