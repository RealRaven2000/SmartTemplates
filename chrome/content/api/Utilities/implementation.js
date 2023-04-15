/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

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
        }
  
        // get may only return something, if a value is set
      }
    }
  };
}
