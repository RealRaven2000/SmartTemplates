import * as util from "./scripts/st-util.mjs.js";
import {Licenser} from "./scripts/Licenser.mjs.js";

var currentLicense;
const GRACEPERIOD_DAYS = 28;
const GRACEDATE_STORAGE = "extensions.smartTemplate4.license.gracePeriodDate";
const DEBUGLICENSE_STORAGE = "extensions.smartTemplate4.debug.premium.licenser";

var startupFinished = false;
var callbacks = [];

  messenger.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    let isDebug = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug");
    // Wait until the main startup routine has finished!
    await new Promise((resolve) => {
      if (startupFinished) {
        if (isDebug) console.log("SmartTemplates - startup code finished.");
        resolve();
        // Looks like we missed the one sent by main()
      }
      callbacks.push(resolve);
    });
    if (isDebug) {
      console.log("SmartTemplates Startup has finished\n"
        + "currentLicense", currentLicense);
    }
    
    switch (reason) {
      case "install":
        {
          const url = browser.runtime.getURL("popup/installed.html");
          await messenger.windows.create({ url, type: "popup", width: 910, height: 750, allowScriptsToClose : true});
        }
        break;
      // see below
      case "update":
        {
          
          setTimeout(
            function() {
              messenger.LegacyPrefs.setPref("extensions.smartTemplate4.hasNews", true);
              messenger.NotifyTools.notifyExperiment({event: "updateNewsLabels"});
            },
            200
          ); 
          
          // TypeError: currentLicense is undefined
          if (isDebug) console.log("2. update() case");
          let currentLicenseInfo = currentLicense.info;
          let isLicensed = (currentLicenseInfo.status == "Valid"),  
              isStandardLicense = (currentLicenseInfo.keyType == 2); 
          if (isLicensed) {
            // suppress update popup for users with licenses that have been recently renewed
            let gpdays = currentLicenseInfo.licensedDaysLeft; 
            if (isDebug) console.log("Licensed - " + gpdays  + " Days left.");
          }
        }
        break;
      default:
        messenger.NotifyTools.notifyExperiment({event: "updateNewsLabels"});
      // see below
    }
  });


function showSplash() {
  // alternatively display this info in a tab with browser.tabs.create(...)  
  const url = browser.runtime.getURL("popup/update.html");
  let screenH = window.screen.height,
      windowHeight = (screenH > 870) ? 870 : screenH-20;  
  messenger.windows.create({ url, type: "popup", width: 1000, height: windowHeight, allowScriptsToClose: true,});
}


async function main() {
  
  // we need these helper functions for calculating an extension to License.info
  async function getGraceDate() {
    let graceDate = "", isResetDate = false, isDebug = false;
    try {
      graceDate = await messenger.LegacyPrefs.getPref(GRACEDATE_STORAGE);
      isDebug =  await messenger.LegacyPrefs.getPref(DEBUGLICENSE_STORAGE);
    }
    catch(ex) { 
      isResetDate = true; 
    }
    let today = new Date().toISOString().substr(0, 10); // e.g. "2019-07-18"
    if (!graceDate || graceDate>today) {
      graceDate = today; // cannot be in the future
      isResetDate = true;
    }
    else {
      // if a license exists & is expired long ago, use the last day of expiration date.
      if (currentLicense.info.status == "Expired") {
        if (graceDate < currentLicense.info.expiryDate) {
          if (isDebug) console.log("Extending graceDate from {0} to {1}".replace("{0}",graceDate).replace("{1}", currentLicense.info.expiryDate)); 
          graceDate = currentLicense.info.expiryDate;
          isResetDate = true;
        }
      }
    }
    if (isResetDate)
      await messenger.LegacyPrefs.setPref(GRACEDATE_STORAGE, graceDate);
    if (isDebug) console.log("Returning Grace Period Date: " + graceDate); 
    return graceDate;
  }
  
  async function getTrialDays() {
    let graceDate; // actually the install date for 2.1 or later.
    const period = GRACEPERIOD_DAYS,
          SINGLE_DAY = 1000*60*60*24; 
    try {
      if (currentLicense.info.status == "Expired") {
        // [issue 100] Trial period should restart on license expiry
        graceDate = currentLicense.info.expiryDate;
      }
      else
        graceDate = await messenger.LegacyPrefs.getPref(GRACEDATE_STORAGE);
      if (!graceDate) graceDate = getGraceDate(); // create the date
    }
    catch(ex) { 
      // if it's not there, set it now!
      graceDate = getGraceDate(); 
    }
    let today = (new Date()),
        installDate = new Date(graceDate),
        days = Math.floor( (today.getTime() - installDate.getTime()) / SINGLE_DAY);
    // later.setDate(later.getDate()-period);
    return (period-days); // returns number of days left, or -days since trial expired if past period
  }

  
  /* There is a general race condition between onInstall and our main() startup:
   * - onInstall needs to be registered upfront (otherwise we might miss it)
   * - but onInstall needs to wait with its execution until our main function has
   *   finished the init routine
   * -> emit a custom event once we are done and let onInstall await that
   */

  messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/smartTemplate-defaults.js");
   
  let key = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.LicenseKey"),
      forceSecondaryIdentity = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.licenser.forceSecondaryIdentity"),
      isDebug = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug"),
      isDebugLicenser = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.premium.licenser");

  currentLicense = new Licenser(key, { forceSecondaryIdentity, debug: isDebugLicenser});
  await currentLicense.validate();
  currentLicense.GraceDate = await getGraceDate();
  currentLicense.TrialDays = await getTrialDays();
  
  // All important stuff has been done.
  // resolve all promises on the stack
  if (isDebug) console.log("Finished setting up license startup code");
  callbacks.forEach(callback => callback());
  startupFinished = true;
  
  
  messenger.runtime.onMessage.addListener(async (data, sender) => {
    if (data.command) {
      switch (data.command) {
        case "getLicenseInfo": 
          return currentLicense.info;
      }
    }
  });  
   
  messenger.NotifyTools.onNotifyBackground.addListener(async (data) => {
    let isLog = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.notifications");
    if (isLog && data.func) {
      console.log ("=========================\n" +
                   "BACKGROUND LISTENER received: " + data.func + "\n" +
                   "=========================");
    }
    switch (data.func) {
      case "getLicenseInfo": 
        return currentLicense.info;
      
      case "getPlatformInfo": 
        return messenger.runtime.getPlatformInfo();

      case "getBrowserInfo": 
        return messenger.runtime.getBrowserInfo();

      case "getAddonInfo": 
        return messenger.management.getSelf();
        
      case "initKeyListeners": // might be needed
        // messenger.NotifyTools.notifyExperiment({event: "initKeyListeners"});
        break;
        
      case "splashScreen":
        showSplash();
        break;

      case "updateLicense":
        let forceSecondaryIdentity = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.licenser.forceSecondaryIdentity"),
            isDebugLicenser = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.premium.licenser");
        // we create a new Licenser object for overwriting, this will also ensure that key_type can be changed.
        let newLicense = new Licenser(data.key, { forceSecondaryIdentity, debug:isDebugLicenser });
        await newLicense.validate();
        newLicense.GraceDate = await getGraceDate();
        newLicense.TrialDays = await getTrialDays();
        
        // Check new license and accept if ok.
        // You may return values here, which will be send back to the caller.
        // return false;
        
        // Update background license.
        await messenger.LegacyPrefs.setPref("extensions.smartTemplate4.LicenseKey", newLicense.info.licenseKey);
        currentLicense = newLicense;
        // Broadcast
        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info}); // part of generic onBackgroundUpdates called in Util.init()
        return true;
        
      case "updateTemplateMenus":
        // Broadcast main windows to run updateTemplateMenus
        messenger.NotifyTools.notifyExperiment({event: "updateTemplateMenus"});
        break
        
      case "updateNewsLabels":
        messenger.NotifyTools.notifyExperiment({event: "updateNewsLabels"});
        break
        
        
      case "initLicensedUI":
        // main window update reacting to license status change
        messenger.NotifyTools.notifyExperiment({event:"initLicensedUI"}); 
        break;
    }
  });
   
   
  // content smarttemplate4-locales locale/
  // we still need this for explicitely setting locale for Calender localization!
  messenger.WindowListener.registerChromeUrl([ 
      ["content",  "smarttemplate4", "chrome/content/"],
      ["resource", "smarttemplate4", "chrome/content/"],
      ["content", "smarttemplate4-locales", "chrome/locale/"],
      ["locale", "smarttemplate4", "en", "chrome/locale/en/"],
      ["locale", "smarttemplate4", "ca", "chrome/locale/ca/"],
      ["locale", "smarttemplate4", "cs", "chrome/locale/cs/"],
      ["locale", "smarttemplate4", "de", "chrome/locale/de/"],
      ["locale", "smarttemplate4", "es", "chrome/locale/es/"],
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
      ["locale", "smarttemplate4", "sv", "chrome/locale/sv/"],
      ["locale", "smarttemplate4", "uk", "chrome/locale/uk/"],
      ["locale", "smarttemplate4", "zh-CN", "chrome/locale/zh-CN/"],
      ["locale", "smarttemplate4", "zh-TW", "chrome/locale/zh-TW/"],
  ]);

  messenger.WindowListener.registerOptionsPage("chrome://smarttemplate4/content/settings.xhtml"); 
  
  //attention: each target window (like messenger.xhtml) can appear only once
  // this is different from chrome.manifest
  // xhtml for Tb78
  
  messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xhtml", "chrome/content/scripts/st-messageWindow.js");  
  messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/st-messenger.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome/content/scripts/st-composer.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/scripts/st-customizetoolbar.js");
  
  
  /*
  TbSync "As manipulating Thunderbirds own preference page is probably not going to be possible with 
          WebExtensions, I also did not add support for that into the WL. 
          Your own options have to go in your own options dialog."
    NICE TO HAVE: A panel under Composition & addressing going to 
  
    messenger.WindowListener.registerWindow("chrome://messenger/content/am-addressing.xhtml", "chrome/content/scripts/st-am-adressing.js");
    messenger.WindowListener.registerWindow("chrome://messenger/content/am-identity-edit.xhtml", "chrome/content/scripts/st-am-adressing.js");
  */

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */

  messenger.WindowListener.startListening();
}

main();
