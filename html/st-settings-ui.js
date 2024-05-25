var SettingsUI = {
  // doing what instantApply really should provide...
  toggleBoolPreference: async function(cb, noUpdate = false) {
    const SMARTTEMPLATES_EXTPREFIX = "extensions.smartTemplate4.";
    
    let prefString = cb.getAttribute("data-pref-name");
    //  using the new preference system, this attribute should be the actual full string of the pref.
    //  pref = document.getElementById(prefString);
    
    if (prefString) {
      await LegacyPrefs.setBoolPref(prefString, cb.checked);  
    }
    
    if (noUpdate) return true;
    
    // UI messages create  message for main window - to pass on to background:
    switch (prefString) {
      case SMARTTEMPLATES_EXTPREFIX + "collapseCategories":
        // ////  ST.Util.notifyTools.notifyBackground({ func: "updateCategoryBox" });  
        // messenger.runtime.sendMessage({ command:"updateCategoryBox" });
        return false;
    }
    // messenger.runtime.sendMessage({ command:"updateMainWindow" });
    return true;
  },    

}