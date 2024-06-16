/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var Services = globalThis.Services || ChromeUtils.import(
	"resource://gre/modules/Services.jsm"
	).Services;


// might be better to get the parent window of the current window
// because we may be screwed otherwise.
var win = Services.wm.getMostRecentWindow("mail:3pane"); 

var Utilities = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {    
    
    const PrefTypes = {
      [Services.prefs.PREF_STRING] : "string",
      [Services.prefs.PREF_INT] : "number",
      [Services.prefs.PREF_BOOL] : "boolean",
      [Services.prefs.PREF_INVALID] : "invalid"
    };

    return {
      Utilities: {

        logDebug (text) {
          win.SmartTemplate4.Util.logDebug(text);
        },
        
        showToolbarPopup: function() {
          let win = Services.wm.getMostRecentWindow("mail:3pane");  
          win.SmartTemplate4.Util.showToolbarPopup();
        },

        getUserName : function () {
          const util = win.SmartTemplate4.Util;
          let Accounts = util.Accounts; 
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
          util.showVersionHistory(false); // no prompt before showing
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

        updateTemplates: async function(entries) {
          this.logDebug("SmartTemplates Experiment - sending Entries...");
          win.SmartTemplate4.fileTemplates.updateTemplatesDataFromBackEnd(entries);
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
        }
      }
    }
  };
}
