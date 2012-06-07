"use strict"; // "use strict" suggested by Mozilla add-on review team

var gSmartTemplateSettings = {};

//******************************************************************************
// Common
//******************************************************************************
gSmartTemplateSettings.gCurId = "";
gSmartTemplateSettings.Ci = Components.interfaces;
gSmartTemplateSettings.pref = Components.classes["@mozilla.org/preferences-service;1"].
                                                 getService(gSmartTemplateSettings.Ci.nsIPrefService);



//******************************************************************************
// Common library
//******************************************************************************

// Disable DOM node with identity key
//--------------------------------------------------------------------
gSmartTemplateSettings.prefDisable = function()
{
    for(var i = 1; i < arguments.length; i++){
        var el = document.getElementById(arguments[i] + gSmartTemplateSettings.gCurId);
        if (arguments[0]) {
            el.disabled = false;
            el.removeAttribute("disabled");
        } else {
            el.disabled = true;
            el.setAttribute("disabled", "true");
        }
    }
    return arguments[0];
}

// Disable DOM node with identity key
//--------------------------------------------------------------------
gSmartTemplateSettings.prefHidden = function()
{
    for(var i = 1; i < arguments.length; i++){
        var el = document.getElementById(arguments[i] + gSmartTemplateSettings.gCurId);
        if (arguments[0]) {
            el.hidden = true;
            el.setAttribute("hidden", "true");
        } else {
            el.hidden = false;
            el.removeAttribute("hidden");
        }
    }
    return arguments[0];
}

// Select Deck with identity key
//--------------------------------------------------------------------
gSmartTemplateSettings.prefDeck = function(id, index)
{
    var deck = document.getElementById(id + gSmartTemplateSettings.gCurId);
    if (deck)
      { deck.selectedIndex = index; }
      
    const idkey = document.getElementById("msgIdentity").value;
    const branch = idkey == "common" ? "" : "." + idkey;
      
}


// Return checkbox is checked or not
//--------------------------------------------------------------------
gSmartTemplateSettings.isChecked = function(elid)
{
    return document.getElementById(elid).checked;
}


// Disable DOM node depeding on checkboxes
//--------------------------------------------------------------------
gSmartTemplateSettings.disableWithCheckbox = function()
{  
    if (gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("new" + gSmartTemplateSettings.gCurId), "newmsg", "newhtml", "newnbr"))
      { gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("newhtml" + gSmartTemplateSettings.gCurId), "newnbr"); }
    if (gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("rsp" + gSmartTemplateSettings.gCurId), "rspmsg", "rsphtml", "rspnbr", "rsphead"))
      { gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("rsphtml" + gSmartTemplateSettings.gCurId), "rspnbr"); }
    if (gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("fwd" + gSmartTemplateSettings.gCurId), "fwdmsg", "fwdhtml", "fwdnbr", "fwdhead"))
      { gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("fwdhtml" + gSmartTemplateSettings.gCurId), "fwdnbr"); }
}


// Delete unused preferences.
//--------------------------------------------------------------------
gSmartTemplateSettings.cleanupUnusedPrefs = function()
{
    var array = gSmartTemplateSettings.pref.getChildList("extensions.smarttemplate.", {});
    for (var i in array) {
        if (document.getElementsByAttribute("name", array[i]).length === 0) {
            gSmartTemplateSettings.pref.deleteBranch(array[i]);
        }
    }
}



//******************************************************************************
// Preferences library
//******************************************************************************

// Create preferences
//--------------------------------------------------------------------
gSmartTemplateSettings.setPref1st = function(prefbranch)
{  
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "def")
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "def", true); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "new");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "new", false); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "rsp");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "rsp", false); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "fwd");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "fwd", false); }
  try {        gSmartTemplateSettings.pref.getCharPref(prefbranch + "newmsg");
  } catch(e) { gSmartTemplateSettings.pref.setCharPref(prefbranch + "newmsg", ""); }
  try {        gSmartTemplateSettings.pref.getCharPref(prefbranch + "rspmsg");
  } catch(e) { gSmartTemplateSettings.pref.setCharPref(prefbranch + "rspmsg", ""); }
  try {        gSmartTemplateSettings.pref.getCharPref(prefbranch + "fwdmsg");
  } catch(e) { gSmartTemplateSettings.pref.setCharPref(prefbranch + "fwdmsg", ""); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "newhtml");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "newhtml", false); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "rsphtml");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "rsphtml", false); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "fwdhtml");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "fwdhtml", false); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "newnbr");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "newnbr", true); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "rspnbr");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "rspnbr", true); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "fwdnbr");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "fwdnbr", true); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "rsphead");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "rsphead", false); }
  try {        gSmartTemplateSettings.pref.getBoolPref(prefbranch + "fwdhead");
  } catch(e) { gSmartTemplateSettings.pref.setBoolPref(prefbranch + "fwdhead", false); }
}

// Get preference without prefType
gSmartTemplateSettings.getPref = function(prefstring)
{
    switch (gSmartTemplateSettings.pref.getPrefType(prefstring))
    {
      case Components.interfaces.nsIPrefBranch.PREF_STRING:
        return gSmartTemplateSettings.pref.getComplexValue(prefstring,
                                 Components.interfaces.nsISupportsString).data;
                                                break;
      case Components.interfaces.nsIPrefBranch.PREF_INT:
        return gSmartTemplateSettings.pref.getIntPref(prefstring);     break;
      case Components.interfaces.nsIPrefBranch.PREF_BOOL:
        return gSmartTemplateSettings.pref.getBoolPref(prefstring);    break;
      default:
        break;
    }
    return false;
}

// Set preference without prefType
//--------------------------------------------------------------------
gSmartTemplateSettings.setPref = function(prefstring, value)
{
    switch (gSmartTemplateSettings.pref.getPrefType(prefstring))
    {
      case Components.interfaces.nsIPrefBranch.PREF_STRING:
        return gSmartTemplateSettings.pref.setCharPref(prefstring, value);    break;
      case Components.interfaces.nsIPrefBranch.PREF_INT:
        return gSmartTemplateSettings.pref.setIntPref(prefstring, value);     break;
      case Components.interfaces.nsIPrefBranch.PREF_BOOL:
        return gSmartTemplateSettings.pref.setBoolPref(prefstring, value);    break;
      default:
        break;
    }
    return false;
}


// Reload preferences and update elements.
//--------------------------------------------------------------------
gSmartTemplateSettings.reloadPrefs = function(el)
{
    el = el.firstChild;
    while (el) {
        // Load preference
        if (el.tagName == "preference") {
            el.value = gSmartTemplateSettings.getPref(el.getAttribute("name"));
        }
        el = el.nextSibling;
    }
}

//******************************************************************************
// Preferences
//******************************************************************************

// Setup default preferences and common settings
//--------------------------------------------------------------------
gSmartTemplateSettings.onLoad = function()		// mod 0.3.2
{  
    // Check and set common preference
    gSmartTemplateSettings.setPref1st("extensions.smarttemplate.");
    gSmartTemplateSettings.disableWithCheckbox();

    // Set account popup
    gSmartTemplateSettings.fillIdentityListPopup();					// mod 0.3.2

    gSmartTemplateSettings.cleanupUnusedPrefs();

    // Switch account (from account setting)
    if (window.arguments && window.arguments.length >= 1)	// add 0.4.0
      { switchIdentity(window.arguments[0]); }			// add 0.4.0

    // disable Use default (common account)
    document.getElementById("use_default").setAttribute("disabled", "true");

    return true;
}


// Setup cloned nodes and replace preferences strings
//--------------------------------------------------------------------
gSmartTemplateSettings.prefCloneAndSetup = function(el, str, key)
{  
    function replaceAttr(_el, _attrname, _str, _key) { try {
        if (_el.hasAttribute(_attrname)) {
            var _attr = _el.getAttribute(_attrname);
            if (_attr.indexOf(_str, 0) !== -1)
              { _el.setAttribute(_attrname, _attr.replace(_str, _str + _key)); }
        }
    } catch(ex) {} }
    function appendAttr(_el, _attrname, _key) { try {
        if (_el.hasAttribute(_attrname))
          { _el.setAttribute(_attrname, _el.getAttribute(_attrname) + _key); }
    } catch(ex) {} }

    var deps = 0;
    while (el) {
        // Set id, name, prefname
        appendAttr(el, "id", key);
        replaceAttr(el, "name", str, key);
        appendAttr(el, "preference", key);

        // Get next node or parent's next node
        if (el.hasChildNodes()) {
            el = el.firstChild;
            deps++;
        } else {
            while (deps > 0 && !el.nextSibling) {
                el = el.parentNode;
                deps--;
            }
            el = el.nextSibling;
        }
    }
}



//******************************************************************************
// Identity
//******************************************************************************

// Add identity
//--------------------------------------------------------------------
gSmartTemplateSettings.addIdentity = function(menuvalue)
{  
    const  branch = menuvalue == "common" ? "" : "." + menuvalue;

    // Add preferences, if preferences is not create.
    gSmartTemplateSettings.setPref1st("extensions.smarttemplate" + branch + ".");

    // Clone and setup a preference window tags.
    const el = document.getElementById("deckA.per_account");
    const clone = el.cloneNode(true);

    gSmartTemplateSettings.prefCloneAndSetup(clone, "smarttemplate", branch);
    el.parentNode.appendChild(clone);				// mod 0.3.2

    // Reload preferences
    gSmartTemplateSettings.reloadPrefs(document.getElementById("smarttemplate" + branch));

    // Disabled or Hidden DOM node
    gSmartTemplateSettings.gCurId = branch;    // change current id for pref library
    gSmartTemplateSettings.prefDeck("default.deckB", gSmartTemplateSettings.isChecked("use_default" + branch)?1:0);
    
    gSmartTemplateSettings.disableWithCheckbox();
    gSmartTemplateSettings.gCurId = "";
}


// Fill identities menu
//--------------------------------------------------------------------
gSmartTemplateSettings.fillIdentityListPopup = function()	// mod 0.3.2
{  
    const accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].
                                  getService(gSmartTemplateSettings.Ci.nsIMsgAccountManager).accounts;

    for (var idx = 0; idx < accounts.Count(); idx++) {
        const account = accounts.QueryElementAt(idx, gSmartTemplateSettings.Ci.nsIMsgAccount);

        if (!account.incomingServer)
          { continue; }

        for (var j = 0; j < account.identities.Count(); j++) {
            const identity = account.identities.QueryElementAt(j, gSmartTemplateSettings.Ci.nsIMsgIdentity);
            document.getElementById("msgIdentity").
                appendItem(account.incomingServer.prettyName + " - " + identity.identityName, identity.key, "");
            gSmartTemplateSettings.addIdentity(identity.key);
        }
    }
}


// Switch Identity (from account setting window)		// add 0.4.0 S
//--------------------------------------------------------------------
gSmartTemplateSettings.switchIdentity = function(idKey)
{
    var el = document.getElementById("msgIdentityPopup").firstChild
    var index = 0;
    while (el) {
        if (el.getAttribute("value") == idKey) {
        // el.value could not access.. why??
            document.getElementById("msgIdentity").selectedIndex = index;
            // no fire event with set selectedIndex/selectedItem.. why??
            gSmartTemplateSettings.selectIdentity(idKey);
            break;
        }
        el = el.nextSibling; index++;
    }
}								// add 0.4.0 E


// Select identity (from xul)
//--------------------------------------------------------------------
gSmartTemplateSettings.selectIdentity = function(idkey)
{  
    const  branch = idkey == "common" ? "" : "." + idkey;
        
    // Display identity.
    var deck = document.getElementById("account.deckA");	// mod 0.3.2 S
    var index = 0;
    for (var el = deck.firstChild; el; el = el.nextSibling) {
        if (el.id == "deckA.per_account" + branch) {
            deck.selectedIndex = index;
            gSmartTemplateSettings.gCurId = branch;
            break;
        }
        index++;
    }								// mod 0.3.2 E   
    
}