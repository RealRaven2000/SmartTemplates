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
        
        // returns true if a valid license is there, but also when the license is expired.
        // this gives us an option to check whether to show extension links instead after 
        // we check for the license
        isLicensed(forceValidation) {
          let hasLicense =  // (win.quickFilters.Licenser).isValidated;
            win.SmartTemplate4.Util.hasLicense(forceValidation);
          if (!hasLicense)
            return win.SmartTemplate4.Licenser.isExpired; // if it is expired, we say it is still "licensed" for the purposes of this api!
          return hasLicense;
        },
        
        LicenseIsExpired() {
          return  win.SmartTemplate4.Licenser.isExpired;
        },

        LicenseIsStandardUser() {
          return (win.SmartTemplate4.Licenser.key_type == 2);
        },
        
        LicensedDaysLeft() {
          let today = new Date(),
              licensedDate = new Date(win.SmartTemplate4.Licenser.DecryptedDate),
              daysLeft = parseInt((licensedDate - today) / (1000 * 60 * 60 * 24)); 
          return daysLeft;
        },

        openLinkExternally: function(url) {
          let uri = url;
          if (!(uri instanceof Ci.nsIURI)) {
            uri = Services.io.newURI(url);
          }
          
          Cc["@mozilla.org/uriloader/external-protocol-service;1"]
            .getService(Ci.nsIExternalProtocolService)
            .loadURI(uri);
        },

        showXhtmlPage: function(uri) {
          let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow("mail:3pane");  
          mail3PaneWindow.openDialog(uri);
        }
  
        // get may only return something, if a value is set
      }
    }
  };
}
