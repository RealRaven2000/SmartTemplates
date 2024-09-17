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

  var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
  var ESM = parseInt(AppConstants.MOZ_APP_VERSION, 10) >= 128;

  var { ExtensionParent } = ESM
    ? ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs")
    : ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

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

