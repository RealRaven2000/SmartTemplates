import {Licenser} from "./scripts/Licenser.mjs.js";
import {SmartTemplates} from "./scripts/st-main.mjs.js";
import {SmartTemplatesProcess} from "./scripts/st-process.mjs.js";
import {compareVersions} from "./scripts/mozilla-version-comparator.js";



var stProcess = new SmartTemplatesProcess(); // use stProcess.composer
console.log(SmartTemplates, stProcess);
SmartTemplates.Util.log("test", "test2");

var currentLicense;
const GRACEPERIOD_DAYS = 28;
const GRACEDATE_STORAGE = "extensions.smartTemplate4.license.gracePeriodDate";
const DEBUGLICENSE_STORAGE = "extensions.smartTemplate4.debug.premium.licenser";
const CARDBOOK_APPNAME = "cardbook@vigneau.philippe";

var startupFinished = false;
var callbacks = [];

// Remove console error “receiving end does not exist”
function logReceptionError(x) {
  if (x.message.includes("Receiving end does not exist.")) {
    // no need to log - CardBook is not installed or disabled.
  } else { 
    console.log(x); 
  }  
}

// Helper function to walk through a menu data structure and create WebExtension
// menu entries. 
// TO DO: use this to recreate SmartTemplates header menus from the back-end [issue 253]
async function addMenuEntries(entries, parentId) {
  for (let entry of entries) {
    let config = {
      id: entry.id,
      contexts: ["browser_action_menu"],
    }
    if (entry.separator) {
      config.type = "separator";
    } else {
      config.title = entry.label || browser.i18n.getMessage(entry.id);
    }
    if (parentId) {
      config.parentId = parentId;
    }
    if (entry.disabled) {
      config.enabled = false;
    }
    await browser.menus.create(config);
    if (entry.subEntries) {
      await addMenuEntries(entry.subEntries, entry.id);
    }
  }
}



// example on building reply menus
function get_XML_replyMenus() {
  return `
    <menu label="__MSG_pref_rsp.tab__" id="smartTemplates-reply-menu" class="menu-iconic" controller="cmd_reply" accesskey="__MSG_st.menuaccess.reply__">
      <menupopup>
        <menuitem id="smartTemplates-reply-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-rsp st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-reply-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </menupopup>
    </menu>
    <menu label="__MSG_st.menu.replyAll__" id="smartTemplates-reply-all-menu" class="menu-iconic" controller="cmd_replyall" accesskey="__MSG_st.menuaccess.replyAll__">
      <menupopup>
        <menuitem id="smartTemplates-reply-all-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-rsp st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-reply-all-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </menupopup>
    </menu>
    <menu label="__MSG_st.menu.replyList__" id="smartTemplates-reply-list-menu" class="menu-iconic" controller="cmd_replylist" accesskey="__MSG_st.menuaccess.replyList__">
      <menupopup>
        <menuitem id="smartTemplates-reply-list-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-rsp st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-reply-list-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </menupopup>
    </menu>
  `;
}
function get_XML_forwardMenus() {
  return `
          <menu label="__MSG_pref_fwd.tab__" id="smartTemplates-forward-menu" class="menu-iconic" controller="cmd_forward"  accesskey="__MSG_st.menuaccess.forward__">
            <menupopup>
              <menuitem id="smartTemplates-forward-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-fwd st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              <menuitem id="smartTemplates-forward-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
            </menupopup>
          </menu>
  `;
}

const replyMenus = [
  { type:"menu", id:"smartTemplates-reply-menu", classList:"menu-iconic", 
    label:"pref_rsp.tab", accesskey:"st.menuaccess.reply",
    controller:"cmd_reply", 
    popupItems: [
      { id:"smartTemplates-reply-last", label:"st.menu.template.last", classList:"menuitem-iconic st-last-rsp st-mru" },
      { id:"smartTemplates-reply-default", label:"st.menu.template.default", classList:"menuitem-iconic" }
    ]
  }, 
  { type:"menu", id:"smartTemplates-reply-all-menu", classList:"menu-iconic", 
    label:"st.menu.replyAll", accesskey:"st.menuaccess.replyAll",
    controller:"cmd_replyall", 
    popupItems: [
      { id:"smartTemplates-reply-all-last", label:"st.menu.template.last", classList:"menuitem-iconic st-last-rsp st-mru" },
      { id:"smartTemplates-reply-all-default", label:"st.menu.template.default", classList:"menuitem-iconic" }
    ]
  }, 
  { type:"menu", id:"smartTemplates-reply-list-menu", classList:"menu-iconic", 
    label:"st.menu.replyList", accesskey:"st.menuaccess.replyList",
    controller:"cmd_replylist", 
    popupItems: [
      { id:"smartTemplates-reply-list-last", label:"st.menu.template.last", classList:"menuitem-iconic st-last-rsp st-mru" },
      { id:"smartTemplates-reply-list-default", label:"st.menu.template.default", classList:"menuitem-iconic" }
    ]
  }, 
];

const forwardMenus = [
  { type:"menu", id:"smartTemplates-forward-menu", classList:"menu-iconic", 
    label:"pref_fwd.tab", accesskey:"st.menuaccess.forward",
    controller:"cmd_reply", 
    popupItems: [
      { id:"smartTemplates-forward-last", label:"st.menu.template.last", classList:"menuitem-iconicst-last-fwd st-mruu" },
      { id:"smartTemplates-forward-default", label:"st.menu.template.default", classList:"menuitem-iconic" }
    ]
  }  
];



async function createHeaderMenu() {
  // helper function to insert accelerator key
  function injectAccessKey(txt, accesskey=null) {
    if (accesskey) {
      let p = txt.indexOf(accesskey);
      if (p>=0) {
        // inject "&"
        txt = txt.slice(0, p) + "&" + txt.slice(p);
      } else {
        txt = `&${accesskey} ${txt}`; // for non-latin languages or non-matchint translations
      }
    }
    return txt;
  }

  let isDebug =  await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.headerPane"); 
  // let menuProps = {
  //   contexts: ["message_display_action_menu"],
  //   onclick: async (event) => {    
  //     if (isDebug) { console.log("SmartTemplates header context menu", event); }
  //     // const menuItem = { id: TOGGLEICON_ID };   // fake menu item to pass to doCommand

  //     // determine email of email(s) shown in preview pane:
  //     // const selectedMail = event?.selectedMail || null;

  //     messenger.NotifyTools.notifyExperiment( 
  //       { 
  //         event: "checkMailAction", 
  //         detail: { 
  //           commandItem: menuItem, 
  //           selectedMail: event?.selectedMail
  //         } 
  //       } 
  //     );
  //   },
  //   icons: { // list-style-image: var(--icon-reply);
  //     "16": "chrome://messenger/skin/icons/new/compact/reply.svg"
  //   } ,
  //   enabled: true,
  //   id: "smartTemplates-reply-menu",
  //   title: messenger.i18n.getMessage("pref_rsp.tab")
  // } 
  // how to retrieve a css variable (according to Arndt)
  // getComputedStyle(document.documentElement).getPropertyValue('--icon-reply')
  // getComputedStyle(document.documentElement).setProperty('--icon-reply', 'whatever-value')
  // let idToggle = await messenger.menus.create(menuProps); // id of menu item

  // https://webextension-api.thunderbird.net/en/latest/menus.html#create-createproperties-callback
  if (isDebug) {
    console.log("SmartTemplates: createHeaderMenu (through API)")
  }
  for (let m of [...replyMenus, ...forwardMenus]) { // iterate all popups.
    //
    let menuProps = {
      contexts: ["message_display_action_menu"],
      enabled: true,
      // icons: ...,
      id: m.id, // string
      parentId: "", // string
      title: injectAccessKey(messenger.i18n.getMessage(m.label), m?.accesskey), // we are missing m.accesskey !!
      visible: true  // can we have a callback function here?

    }
    let idNew = await messenger.menus.create(menuProps);
    if (m.popupItems?.length) {
      for(let p of m.popupItems) {
        let itemProps = {
          contexts: ["message_display_action_menu"],
          enabled: true,
          // icons: ...,
          id: p.id, // string
          parentId: idNew, // string
          title: injectAccessKey(messenger.i18n.getMessage(p.label), p?.accesskey),
          visible: true  // can we have a callback function here?    
        }
        await messenger.menus.create(itemProps);
      }
    }
  
  }
  // to do: add controller and accesskey attribute
}

 

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
          messenger.NotifyTools.notifyExperiment({event: "firstRun"});
        }
        break;
      // see below
      case "update":
        {
          setTimeout(
            async function() {
              let ver = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.version","0");
              const manifest = await messenger.runtime.getManifest();
              // get pure version number / remove pre123 indicator
              let installedVersion = manifest.version.replace(/pre.*/,""); 
              if (isDebug) console.log(`SmartTemplates Update:  old=${ver}  new=${installedVersion}`);
              // compare versions to support beta builds
              // we probably need to manage prerelease installs with a separate flag!
              if (compareVersions(installedVersion,ver)>0) { 
                if (isDebug) console.log("Setting hasNews flag!");
                messenger.LegacyPrefs.setPref("extensions.smartTemplate4.hasNews", true);
              }
              if (ver != installedVersion ) {
                if (isDebug) console.log("Storing new version number " + manifest.version);
                // STORE VERSION CODE!
                // prefs.setMyStringPref("version", pureVersion); // store sanitized version! (no more alert on pre-Releases + betas!)
                messenger.LegacyPrefs.setPref("extensions.smartTemplate4.version", installedVersion);
              }              
              
              messenger.NotifyTools.notifyExperiment({event: "updateNewsLabels"});
              messenger.NotifyTools.notifyExperiment({event: "firstRun"});
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

function showSplashInstalled() {
  const url = browser.runtime.getURL("popup/installed.html");
  let screenH = window.screen.height,
      windowHeight = (screenH > 870) ? 870 : screenH-20;  
  messenger.windows.create({ url, type: "popup", width: 910, height: windowHeight, allowScriptsToClose : true});
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

      case "splashInstalled":
        showSplashInstalled();
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
        break;

      case "patchHeaderMenu":
        // Broadcast about:messenger to run patch / refresh Header Menus
        // To do rewrite with api [issue 253]
        messenger.NotifyTools.notifyExperiment({event: "patchHeaderMenu"});
        break;

      case "patchHeaderMenuAPI":
        createHeaderMenu(); // use API to build the menu
        break;
        
      case "updateSnippetMenus":
        messenger.NotifyTools.notifyExperiment({event: "updateSnippetMenus"});
        break;
        
      case "updateNewsLabels":
        messenger.NotifyTools.notifyExperiment({event: "updateNewsLabels"});
        break;

      case "setActionTip":
        // https://webextension-api.thunderbird.net/en/stable/browserAction.html#settitle-details
        messenger.browserAction.setTitle({title:data.text});
        break;

      case "setActionLabel":
        // https://webextension-api.thunderbird.net/en/stable/browserAction.html#setlabel-details
        messenger.browserAction.setLabel({label:data.text});
        break;
          
      // refresh license info (at midnight) and update label afterwards.
      case "updateLicenseTimer":
        {
          await currentLicense.updateLicenseDates();

          messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info});
          messenger.NotifyTools.notifyExperiment({event: "updateNewsLabels"});
          // update the status bar label too:
          messenger.NotifyTools.notifyExperiment({event:"initLicensedUI"});  
        }
        break;
        
      case "initLicensedUI":
        // main window update reacting to license status change
        messenger.NotifyTools.notifyExperiment({event:"initLicensedUI"}); 
        break;

      case "parseVcard" :
        {
          // https://webextension-api.thunderbird.net/en/stable/how-to/contacts.html
          // Get JSON representation of the vCard data (jCal).
          let dataString = data.vCard;
          return ICAL.parse(dataString);
        }
        

      case "cardbook.getContactsFromMail":
        try {
          let queryObject = {
            query: "smartTemplates.getContactsFromMail", 
            mail: data.mail
          }
          if (data.preferredDirId) {
            queryObject.dirPrefId = data.preferredDirId;
          }

          let cards = await messenger.runtime.sendMessage( CARDBOOK_APPNAME, queryObject ).catch(
            (x) => { logReceptionError(x); cards=null; }
          );
          return cards;
        }
        catch(ex) {
          console.exception(ex);
          return null;
        }
        
      case "openPrefs":
        {
          const settingsUrl = "/html/smartTemplate-settings.html";
          let url = browser.runtime.getURL(settingsUrl) + "*";
          let [oldTab] = await browser.tabs.query({url}); // dereference first 
          if (oldTab) {
            await browser.windows.update(oldTab.windowId, {focused:true});
          } else {
            // open a new tab with settings
            browser.tabs.create ({active: true, url: browser.runtime.getURL(settingsUrl)});
          }
        }

      case "patchUnifiedToolbar":
        return await messenger.NotifyTools.notifyExperiment({event: "patchUnifiedToolbar"});
        break;

      case "openLinkInTab":
        // https://webextension-api.thunderbird.net/en/stable/tabs.html#query-queryinfo
        {
          let baseURI = data.baseURI || data.URL;
          let found = await browser.tabs.query( { url:baseURI } );
          if (found.length) {
            let tab = found[0]; // first result
            await browser.tabs.update(
              tab.id, 
              {active:true, url: data.URL}
            );
            return;
          }
          browser.tabs.create(
            { active:true, url: data.URL }
          );        
        }
        break;        
    }
  });
  
  
  browser.runtime.onMessageExternal.addListener( async  (message, sender) =>  
  {
    // { command: "forwardMessageWithTemplate", messageHeader: msgKey, templateURL: data.fileURL }
    let isDebug = await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug");
    switch(message.command) {
      case "forwardMessageWithTemplate":
        messenger.NotifyTools.notifyExperiment(
            {event: "forwardWithTemplate", 
             detail : { messageHeader: message.messageHeader, templateURL: message.templateURL} }
        ).then(
          (data) => {
            if (isDebug) console.log (`SmartTemplates forwarded '${message.messageHeader.subject}' successfully.`);
            return true;
          }
        );
        break;
      case "replyMessageWithTemplate":
        messenger.NotifyTools.notifyExperiment(
          {event: "replyWithTemplate", detail : { messageHeader: message.messageHeader, templateURL: message.templateURL} }).then(
          (data) => {
            if (isDebug) console.log (`SmartTemplates replied to '${message.messageHeader.subject}' successfully.`);
            return true;
          }
        );
        break;      
    }
  }

  
  ); 

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
  // inject a separate script for header pane!
  messenger.WindowListener.registerWindow("about:message", "chrome/content/scripts/st-messagePane.js");


  messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome/content/scripts/st-composer.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/scripts/st-customizetoolbar.js");
  
  /* add a background script to the settings window - needed for browser element! */
  messenger.WindowListener.registerWindow("chrome://smarttemplate4/content/settings.xhtml", "chrome/content/scripts/st-settings.js");  
  
  
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
  
  let browserInfo = await messenger.runtime.getBrowserInfo();
  // [issue 209] Exchange account validation
  messenger.accounts.onCreated.addListener( async(id, account) => {
    if (currentLicense.info.status == "MailNotConfigured") {
      // redo license validation!
      if (isDebugLicenser) console.log("Account added, redoing license validation", id, account); // test
      currentLicense = new Licenser(key, { forceSecondaryIdentity, debug: isDebugLicenser });
      await currentLicense.validate();
      if(currentLicense.info.status != "MailNotConfigured") {
        if (isDebugLicenser) console.log("notify experiment code of new license status: " + currentLicense.info.status);
        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info});
      }
      if (isDebugLicenser) console.log("SmartTemplates license info:", currentLicense.info); // test
    }
    else {
      if (isDebugLicenser) console.log("SmartTemplates license state after adding account:", currentLicense.info)
    }
  });

  /// message selection listener
  browser.mailTabs.onSelectedMessagesChanged.addListener(
    (tab, selectedMessages) => {
      // selectedMessages = list - see messages member. add logic to decide whether to show:
      // replyAll
      // replyList
      // redirect

      /* only 1 message may be selected */

    }
  )
  
  

}

main();
