/* eslint-disable object-shorthand */
const { setTimeout, clearTimeout } = ChromeUtils.importESModule(
  "resource://gre/modules/Timer.sys.mjs"
);

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var Services = globalThis.Services || ChromeUtils.import(
	"resource://gre/modules/Services.jsm"
	).Services;


// might be better to get the parent window of the current window
// because we may be screwed otherwise.
var win = Services.wm.getMostRecentWindow("mail:3pane"); 

var Utilities = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {    

    return {
    
      Utilities: {
        collapseTimeout: null, // timeout id for gathering save timeouts
        UPDATE_INTERVAL: 2000,
  
        logDebug (text) {
          win.SmartTemplate4.Util.logDebug(text);
        },
        
        showToolbarPopup: function() {
          let win = Services.wm.getMostRecentWindow("mail:3pane");  
          win.SmartTemplate4.Util.showToolbarPopup();
        },

        getUserName : function () {
          let Accounts = win.SmartTemplate4.Util.Accounts; 
          for (let account of Accounts) {
            if (account.defaultIdentity) 
            { 
              let name = account.defaultIdentity.fullName;
              if (name) return name;
            }
          }    
          return "user"; // anonymous
        },

        showVersionHistory: function() {
          const util = win.SmartTemplate4.Util;
          win.SmartTemplate4.Util.showVersionHistory(false); // no prompt before showing
        },
        
        showXhtmlPage: function(uri) {
          let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane");  
          mail3PaneWindow.openDialog(uri).focus();
        },

        getCommandsEnabled: async function(commands, tabId) {
          // Get a real tab from a tab ID:
          let tabObject = context.extension.tabManager.get(tabId);
          // let realTab = tabObject.nativeTab;
          let realTabWindow = tabObject.window;

          let results = [];
          if (realTabWindow.DefaultController.isCommandEnabled) {
            for (let cmd of commands) {
              let ctrl = realTabWindow.getEnabledControllerForCommand(cmd);
              if (!ctrl) {
                results.push(false);
                continue;
              }
              results.push(ctrl.isCommandEnabled(cmd));
            }
          } else {
            for (let cmd of commands) {
              results.push(true); // default to true in case this fails
            }      
          }

          return results;

        },

        beforeSend: async function(tabId, composeDetails) { // [issue 284] tidy up all fields when user hits [Send] button
          let tabObject = context.extension.tabManager.get(tabId);
          let realTabWindow = tabObject.window;
          let rv = await realTabWindow.SmartTemplate4.composer.beforeSend(composeDetails);
          return rv;
        },

        readTemplateMenus: async function() { // replaces SmartTemplate4.fileTemplates.readStringFile()
          let profileDir = PathUtils.profileDir,
          path = PathUtils.join(profileDir, "extensions", "smartTemplates.json"),
          isExist = await IOUtils.exists(path);
          if (!isExist) { // [issue 227] default smartTemplates.json data
            let defaultContent = `{
              "templatesNew": [
              ],
              "templatesRsp": [
              ],
              "templatesFwd": [
              ],
              "snippets": [
              ]
            }
            `;
            return JSON.parse(defaultContent);
          }
          let promise = IOUtils.readJSON(path, { encoding: "utf-8" }); // Read the complete file as an json object
      
          return promise;        
        },

        updateTemplates: async function(entries, immediate = false) {
          if (this.collapseTimeout) {
            clearTimeout(this.collapseTimeout);
          }

          if (immediate) {
            this.logDebug("SmartTemplates Experiment - sending fileTemplate Entries...");
            win.SmartTemplate4.fileTemplates.updateTemplatesDataFromBackEnd(entries);
            return;
          }

          this.collapseTimeout = setTimeout(() => {
            this.logDebug("SmartTemplates Experiment - sending fileTemplate Entries...");
            win.SmartTemplate4.fileTemplates.updateTemplatesDataFromBackEnd(entries);
          }, this.UPDATE_INTERVAL);
        },

        // item: {path, label, category}
        editTemplateExternal: async function(item) {
          // opens external editor to edit template in background.
          // there is no need to update anything in Thunderbird as path remains the same!
          win.SmartTemplate4.fileTemplates.edit(item);
        },

        // Get file path of existing html template / css file.
        // itemParams: template menu item from listbox {path, label, filter}
        // should return path and name (label) of the file
        openFileExternal: async function(itemParams) {
          let result = await win.SmartTemplate4.fileTemplates.openTemplateFileExternal(itemParams);
          return result;
        },

        fileAccountSettings: async function(mode, jsonData, fname="") {

          function rememberPath(path) {
            // Remember last path
            let lastSlash = path.lastIndexOf("/");
            if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
            let lastPath = path.substr(0, lastSlash);
            win.SmartTemplate4.Util.logDebug("Storing Path: " + lastPath);
            win.SmartTemplate4.Preferences.setStringPref('files.path', lastPath);            
          }
          const Cc = Components.classes,
                Ci = Components.interfaces,
                NSIFILE = Ci.nsIFile || Ci.nsILocalFile;
          // [issue 285]
          // util.popupLicenseNotification(mode + "_template", true, true); // save_template, load_template
                
          let filterText; //localized text for filePicker filter menu
          
          let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
              fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;
              
          // "Remember save location"
          if (win.SmartTemplate4.Preferences.getStringPref('files.path')) {
            let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
            defaultPath.initWithPath(win.SmartTemplate4.Preferences.getStringPref('files.path'))
            fp.displayDirectory = defaultPath; // nsILocalFile
          }    
          fp.init(win.SmartTemplate4.Util.getFileInitArg(win), "", fileOpenMode); // second parameter: prompt
          filterText = win.SmartTemplate4.Util.getBundleString("fpJsonFile");
          fp.appendFilter(filterText, "*.json");
          fp.defaultExtension = 'json';
          if (mode == 'save') {
            fp.defaultString = fname + '.json';
          }
          // ************************************************************ END PREP
          const logDebug = this.logDebug;
          let load = async function(fp) {
            const path = fp.file.path;
            let data = await IOUtils.readJSON(path, { encoding: "utf-8" });
            return data;
          }
          
          let save = async function(fp, jsonData) {
            logDebug("attempting to save file", fp, jsonData);
            let path = fp.file.path;
            // force appending correct file extension!
            if (!path.toLowerCase().endsWith('.json')) {
              path += '.json';
            }
            let isDelete = await IOUtils.remove(path);
            try {
              let countBytes = await IOUtils.writeUTF8(path, jsonData); 
              win.SmartTemplate4.Util.logDebug (
                `Successfully saved account data (${countBytes} bytes) to:\n${path}`);
              return true;
            }
            catch(ex) {
              // console.log(path, jsonData);
              win.SmartTemplate4.Util.logException("Couldn't write data to file!", ex);
              return false;
            }
          }

          let result = await new Promise(resolve => { fp.open(resolve); } );
          // if (fp.open) {
          //   fp.open(fpCallback);		
          // }
          if (result != Ci.nsIFilePicker.returnOK && result != Ci.nsIFilePicker.returnReplace) {
            return false; // cancelled
          }
          if (!fp.file) {
            return false; // cancelled
          }
          const path = fp.file.path;
          rememberPath(path);

          // passing the promise as callback
          switch(mode) {
            case "load":
              return await load(fp)
              
            case "save":
              return await save(fp, jsonData);
          }          
          throw new Error(`fileAccountSettings() unsupported mode: ${mode}`);
        } 
      }
    }
  };
}
