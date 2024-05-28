/* load help.js first */

function initXHTML() {
  // avoid running xul code:
  if (findOrigin() == "html") {
    // EARLY EXIT, let's run help-html.js instead
    console.log("help.js early exit...");
    return;
  }
  // [mx l10n] 
  var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
  let extension = ExtensionParent.GlobalManager.getExtension("smarttemplate4@thunderbird.extension");
  Services.scriptloader.loadSubScript(
    extension.rootURI.resolve("chrome/content/i18n.js"),
    window,
    "UTF-8"
  );
  window.i18n.updateDocument({extension});

  fixClipboardNote();
  initSearch();
} 

window.document.addEventListener('DOMContentLoaded', 
initXHTML, 
{ once: true });

