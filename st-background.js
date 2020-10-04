/*
 * Documentation:
 * https://github.com/thundernest/addon-developer-support/wiki/Using-the-WindowListener-API-to-convert-a-Legacy-Overlay-WebExtension-into-a-MailExtension-for-Thunderbird-78
 */


//TODO
// skin


 async function main() {
    
   
   
   messenger.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
     // if (temporary) return; // skip during development
      switch (reason) {
        case "install":
          {
            const url = browser.runtime.getURL("popup/installed.html");
            //await browser.tabs.create({ url });
            await browser.windows.create({ url, type: "popup", height: 600, width: 600, });
          }
          break;
        // see below
        case "update":
          {
            const url = browser.runtime.getURL("popup/update.html");
            //await browser.tabs.create({ url });
            await browser.windows.create({ url, type: "popup", height: 600, width: 600, });
          }
          break;
        // see below
        }
    });
   
   
   
   
   
    messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/smartTemplate-defaults.js");
    
    messenger.WindowListener.registerChromeUrl([ 
        ["content", "smarttemplate4", "chrome/content/"],
        ["resource", "smarttemplate4", "chrome/content/"],
        ["locale", "smarttemplate4", "en-US", "chrome/locale/en-US/"],
        ["locale", "smarttemplate4", "cs", "chrome/locale/cs/"],
        ["locale", "smarttemplate4", "de", "chrome/locale/de/"],
        ["locale", "smarttemplate4", "es-ES", "chrome/locale/es-ES/"],
        ["locale", "smarttemplate4", "fi", "chrome/locale/fi/"],
        ["locale", "smarttemplate4", "fr", "chrome/locale/fr/"],
        ["locale", "smarttemplate4", "id-ID", "chrome/locale/id-ID/"],
        ["locale", "smarttemplate4", "it", "chrome/locale/it/"],
        ["locale", "smarttemplate4", "ja", "chrome/locale/ja/"],
        ["locale", "smarttemplate4", "nl", "chrome/locale/nl/"],
        ["locale", "smarttemplate4", "pl", "chrome/locale/pl/"],
        ["locale", "smarttemplate4", "pt-BR", "chrome/locale/pt-BR/"],
        ["locale", "smarttemplate4", "ru", "chrome/locale/ru/"],
        ["locale", "smarttemplate4", "sl", "chrome/locale/sl/"],
        ["locale", "smarttemplate4", "sr", "chrome/locale/sr/"],
        ["locale", "smarttemplate4", "sv-SE", "chrome/locale/sv-SE/"],
        ["locale", "smarttemplate4", "uk", "chrome/locale/uk/"],
        ["locale", "smarttemplate4", "zh-CN", "chrome/locale/zh-CN/"],
        ["locale", "smarttemplate4", "zh-TW", "chrome/locale/zh-TW/"],
        ["locale", "smarttemplate4", "oc", "chrome/locale/oc/"],
   ]);
 
    messenger.WindowListener.registerOptionsPage("chrome://smarttemplate4/content/settings.xhtml"); 
    
 //attention: each target window (like messenger.xhtml) can appear only once
 // this is different from chrome.manifest
 // xhtml for Tb78
    
    messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/st-messenger.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome/content/scripts/st-composer.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xhtml", "chrome/content/scripts/st-messageWindow.js");  
  
   // messenger.WindowListener.registerStartupScript("chrome/content/scripts/qf-startup.js");
   // messenger.WindowListener.registerShutdownScript("chrome/content/scripts/qf-shutdown.js");

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */


    messenger.WindowListener.startListening();
}

main();
