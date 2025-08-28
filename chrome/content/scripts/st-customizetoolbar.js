// Import any needed modules.
/* 
  globals
    WL

*/

// eslint-disable-next-line no-unused-vars
async function onLoad(activatedWhileWindowOpen) {
  WL.injectCSS("chrome://Smarttemplate4/content/skin/st-toolbar-overlay.css");
  WL.injectCSS("chrome://Smarttemplate4/content/skin/common/smartTemplate-toolButton.css");
}

// eslint-disable-next-line no-unused-vars
async function onUnload(isAddOnShutDown) {
  
}
