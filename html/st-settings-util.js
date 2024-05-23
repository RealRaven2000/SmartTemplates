"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

SmartTemplates.Util = {
  showAboutConfig: function(filter, readOnly, updateUI=false) {
    // we put the notification listener into tablistener.js - should only happen in ONE main window!
    // el - cannot be cloned! let's throw it away and get target of the event
    messenger.runtime.sendMessage({ 
      command: "showAboutConfig", 
      filter: filter,
      readOnly: readOnly,
      updateUI: updateUI
    });

  }
}