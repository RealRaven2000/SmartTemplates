/*
 * Documentation:
 * https://github.com/thundernest/addon-developer-support/wiki/Using-the-WindowListener-API-to-convert-a-Legacy-Overlay-WebExtension-into-a-MailExtension-for-Thunderbird-78
 */

async function main() {
    messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/quickfoldersDefaults.js");
    
    messenger.WindowListener.registerChromeUrl([ 
        ["content", "smarttemplate4", "chrome/content/"],
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
 
    messenger.WindowListener.registerOptionsPage("chrome://quickfolders/content/options.xhtml"); 
    
 //attention: each target window (like messenger.xul) can appear only once
 // this is different from chrome.manifest
 // xhtml for Tb78
    // messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/qf-messenger.js");
    /* not necessary in Tb78+    */
    messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xul", "chrome/content/scripts/st-messenger.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose.xul", "chrome/content/scripts/st-composer.js");
 //   messenger.WindowListener.registerWindow("chrome://messenger/content/FilterListDialog.xul", "chrome/content/scripts/qf-filterlist.js");
//    messenger.WindowListener.registerWindow("chrome://messenger/content/SearchDialog.xul", "chrome/content/scripts/qf-searchDialog.js");
//    messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xul", "chrome/content/scripts/qf-customizetoolbar.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xul", "chrome/content/scripts/st-messageWindow.js");
    
    messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/st-messenger.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose.xhtml", "chrome/content/scripts/st-composer.js");
//    messenger.WindowListener.registerWindow("chrome://messenger/content/FilterListDialog.xhtml", "chrome/content/scripts/qf-filterlist.js");
//    messenger.WindowListener.registerWindow("chrome://messenger/content/SearchDialog.xhtml", "chrome/content/scripts/qf-searchDialog.js");
//    messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/scripts/qf-customizetoolbar.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xhtml", "chrome/content/scripts/st-messageWindow.js");  
  
    messenger.WindowListener.registerStartupScript("chrome/content/scripts/qf-startup.js");
    messenger.WindowListener.registerShutdownScript("chrome/content/scripts/qf-shutdown.js");

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */


    messenger.WindowListener.startListening();
}

main();
