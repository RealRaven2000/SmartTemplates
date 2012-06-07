// -----------------------------------------------------------------------------------
// ---------------------------- last edit at 06/02/2012 ------------------------------
// -----------------------------------------------------------------------------------
// ----------------------------------- Changelog -------------------------------------
// -----------------------------------------------------------------------------------
// 0.7.5: "use strict" suggested by Mozilla add-on review team
// 1.0.0: made some ID's in settings.xul and inside this scripts more explicid
// -----------------------------------------------------------------------------------

"use strict"; // "use strict" suggested by Mozilla add-on review team

var gSmartTemplateSettings = {};

//******************************************************************************
// Common
//******************************************************************************
gSmartTemplateSettings.gCurId = "";
gSmartTemplateSettings.Ci = Components.interfaces;
gSmartTemplateSettings.prefService = Components.classes["@mozilla.org/preferences-service;1"].
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
      
    const idkey = document.getElementById("SmartTemplate4MsgIdentity").value;
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
    if (gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("SmartTemplate4New" + gSmartTemplateSettings.gCurId), "SmartTemplate4NewMsg", "SmartTemplate4NewHtml", "SmartTemplate4NewnBr"))
      { gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("SmartTemplate4NewHtml" + gSmartTemplateSettings.gCurId), "SmartTemplate4NewnBr"); }
    if (gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("SmartTemplate4Rsp" + gSmartTemplateSettings.gCurId), "SmartTemplate4RspMsg", "SmartTemplate4RspHtml", "SmartTemplate4RspnBr", "SmartTemplate4RspHead"))
      { gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("SmartTemplate4RspHtml" + gSmartTemplateSettings.gCurId), "SmartTemplate4RspnBr"); }
    if (gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("SmartTemplate4Fwd" + gSmartTemplateSettings.gCurId), "SmartTemplate4FwdMsg", "SmartTemplate4FwdHtml", "SmartTemplate4FwdnBr", "SmartTemplate4FwdHead"))
      { gSmartTemplateSettings.prefDisable(gSmartTemplateSettings.isChecked("SmartTemplate4FwdHtml" + gSmartTemplateSettings.gCurId), "SmartTemplate4FwdnBr"); }
}


// Delete unused preferences.
//--------------------------------------------------------------------
gSmartTemplateSettings.cleanupUnusedPrefs = function()
{
    var array = gSmartTemplateSettings.prefService.getChildList("extensions.smarttemplate.", {});
    for (var i in array) {
        if (document.getElementsByAttribute("name", array[i]).length === 0) {
            gSmartTemplateSettings.prefService.deleteBranch(array[i]);
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
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "def")
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "def", true); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "new");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "new", false); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "rsp");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "rsp", false); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "fwd");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "fwd", false); }
  try {        gSmartTemplateSettings.prefService.getCharPref(prefbranch + "newmsg");
  } catch(e) { gSmartTemplateSettings.prefService.setCharPref(prefbranch + "newmsg", ""); }
  try {        gSmartTemplateSettings.prefService.getCharPref(prefbranch + "rspmsg");
  } catch(e) { gSmartTemplateSettings.prefService.setCharPref(prefbranch + "rspmsg", ""); }
  try {        gSmartTemplateSettings.prefService.getCharPref(prefbranch + "fwdmsg");
  } catch(e) { gSmartTemplateSettings.prefService.setCharPref(prefbranch + "fwdmsg", ""); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "newhtml");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "newhtml", false); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "rsphtml");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "rsphtml", false); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "fwdhtml");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "fwdhtml", false); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "newnbr");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "newnbr", true); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "rspnbr");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "rspnbr", true); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "fwdnbr");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "fwdnbr", true); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "rsphead");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "rsphead", false); }
  try {        gSmartTemplateSettings.prefService.getBoolPref(prefbranch + "fwdhead");
  } catch(e) { gSmartTemplateSettings.prefService.setBoolPref(prefbranch + "fwdhead", false); }
}

// Get preference without prefType
gSmartTemplateSettings.getPref = function(prefstring)
{
    switch (gSmartTemplateSettings.prefService.getPrefType(prefstring))
    {
      case Components.interfaces.nsIPrefBranch.PREF_STRING:
        return gSmartTemplateSettings.prefService.getComplexValue(prefstring,
                                 Components.interfaces.nsISupportsString).data;
                                                break;
      case Components.interfaces.nsIPrefBranch.PREF_INT:
        return gSmartTemplateSettings.prefService.getIntPref(prefstring);     break;
      case Components.interfaces.nsIPrefBranch.PREF_BOOL:
        return gSmartTemplateSettings.prefService.getBoolPref(prefstring);    break;
      default:
        break;
    }
    return false;
}

// Set preference without prefType
//--------------------------------------------------------------------
gSmartTemplateSettings.setPref = function(prefstring, value)
{
    switch (gSmartTemplateSettings.prefService.getPrefType(prefstring))
    {
      case Components.interfaces.nsIPrefBranch.PREF_STRING:
        return gSmartTemplateSettings.prefService.setCharPref(prefstring, value);    break;
      case Components.interfaces.nsIPrefBranch.PREF_INT:
        return gSmartTemplateSettings.prefService.setIntPref(prefstring, value);     break;
      case Components.interfaces.nsIPrefBranch.PREF_BOOL:
        return gSmartTemplateSettings.prefService.setBoolPref(prefstring, value);    break;
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
      { gSmartTemplateSettings.switchIdentity(window.arguments[0]); }			// add 0.4.0

    // disable Use default (common account)
    document.getElementById("SmartTemplate4UseDefault").setAttribute("disabled", "true");

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
    gSmartTemplateSettings.prefDeck("default.deckB", gSmartTemplateSettings.isChecked("SmartTemplate4UseDefault" + branch)?1:0);
    
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
            document.getElementById("SmartTemplate4MsgIdentity").appendItem(account.incomingServer.prettyName + " - " + identity.identityName, identity.key, "");
            gSmartTemplateSettings.addIdentity(identity.key);
        }
    }
}

// Switch Identity (from account setting window)		// add 0.4.0 S
//--------------------------------------------------------------------
gSmartTemplateSettings.switchIdentity = function(idKey)
{
    var el = document.getElementById("SmartTemplate4MsgIdentityPopup").firstChild
    var index = 0;
dump("switchIdentity called\n");
    while (el) {
        if (el.getAttribute("value") == idKey) {
        // el.value could not access.. why??
            document.getElementById("SmartTemplate4MsgIdentity").selectedIndex = index;
            // no fire event with set selectedIndex/selectedItem.. why??
            gSmartTemplateSettings.selectIdentity(idKey);
			break;
        }
        el = el.nextSibling; index++;
    }
}								// add 0.4.0 E

var gExportID = "common";
// Select identity (from xul)
//--------------------------------------------------------------------
gSmartTemplateSettings.selectIdentity = function(idkey)
{  
    const  branch = idkey == "common" ? "" : "." + idkey;
	gExportID = idkey;
        
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



//******************************************************************************
// Open AMO Page in Help Menu 
// call "SmartTemplate4AMO.openAMOPage ();" -> const SmartTemplate4AMOHomepage
// added in v.1.0.0
//******************************************************************************
const SmartTemplate4AMOHomepage = "https://addons.mozilla.org/thunderbird/addon/324497/";

var SmartTemplate4AMO =
{
  openAMOPage: function()
  {
    var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(SmartTemplate4AMOHomepage, null, null);
    var com = Components.classes["@mozilla.org/uriloader/external-helper-app-service;1"];
    var httpHandler = com.createInstance(Components.interfaces.nsIExternalProtocolService);
    httpHandler.loadUrl(uri);
  }
}

//******************************************************************************
// Open supportpage in Help Menu
// call "SmartTemplate4Support.openSupportPage();" -> const SmartTemplate4SupportHomepage
// added in v.1.0.0
//******************************************************************************
const SmartTemplate4SupportHomepage = "http://www.tool8now.com/smarttemplate4/index.php";

var SmartTemplate4Support =
{
  openSupportPage: function()
  {
    var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(SmartTemplate4SupportHomepage, null, null);
    var com = Components.classes["@mozilla.org/uriloader/external-helper-app-service;1"];
    var httpHandler = com.createInstance(Components.interfaces.nsIExternalProtocolService);
    httpHandler.loadUrl(uri);
  }
}

//******************************************************************************
// Export / Import
// added in v.1.0.0
//******************************************************************************
function SmartTemplate4OnExport() {
			//localized text for filePicker filter menu
			var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
				 getService(Components.interfaces.nsIStringBundleService);
			var bundle = strBndlSvc.createBundle("chrome://SmartTemplate4/locale/settings.properties");
			try{ //try reading the localized string; if it fails write it in English
				var filterText = bundle.GetStringFromName("fpFilterName");
			} catch (e) {
				var filterText = "SmartTemplate4 File";
			}

			var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);
			fp.init(window, "", fp.modeSave);
			var filename = document.getElementById("SmartTemplate4MsgIdentity").selectedItem.label + ".st4";
			fp.defaultString = filename.replace(/[<>]/gm, '-');
			fp.appendFilter(filterText, "*.st4");
			fp.appendFilters(fp.filterAll);
			if (fp.show() == fp.returnCancel)
			return;

			var str = "";
			var regexp = new RegExp(gExportID,"");
			var preferences = document.getElementsByTagName("preference");
			for (var i = 0; i < preferences.length; i++) {
				//create lines for non-common accounts
				if (gExportID != "common") {
					if (preferences[i].name.match(regexp)) {str += createLine(preferences[i],gExportID);}
				} else {
				//create lines for common acounts
					if (!preferences[i].name.match(/id\d/)) {str += createLine(preferences[i],gExportID);}
				}
			}

		var stream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
		stream.init(fp.file, -1, -1, 0);
		stream.write(str, str.length);
		stream.close();
		}
		
		function createLine (pref, id) {
			var str = "";
			str += 'pref(';
			str += pref.name.quote();
			str += ', ';
			var encodedStr = pref.value.toString();
			encodedStr = encodedStr.replace(/(\r\n|\n|\r)/gm, "\\n"); //escape line-break characters
			encodedStr = encodedStr.replace(/"/gm, "\\u0022"); //escape double quote characters
			if (pref.type == "unichar"){
				str += '"' + encodedStr + '"';
			}
			else {
				str += pref.type == typeof pref.value ? pref.value.quote() :
				pref.inverted ? !pref.value : pref.value;
			}
			str += ');\n';
			//remove id identification from the return value
			str = str.replace(/id\d\./,"");
			
			return str;		
		}

// Import exported file
//--------------------------------------------------------------------
		function SmartTemplate4OnImport() {
		
			//localized text for filePicker filter menu
			var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
				 getService(Components.interfaces.nsIStringBundleService);
			var bundle = strBndlSvc.createBundle("chrome://SmartTemplate4/locale/settings.properties");
			try{ //try reading the localized string; if it fails write it in English
				var filterText = bundle.GetStringFromName("fpFilterName");
			} catch (e) {
				var filterText = "SmartTemplate4 File";
			}
			
			//Choose file
			var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);
			fp.init(window, "", fp.modeOpen);
			//fp.defaultString = "ST4prefsComplete.txt";
			//fp.defaultExtension = "st4";
			fp.appendFilter(filterText, "*.st4");
			fp.appendFilters(fp.filterAll);
			if (fp.show() == fp.returnCancel)
			return;
			
			
			var data = "";
			//read file into a string so the correct identifier can be added
			var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
				createInstance(Components.interfaces.nsIFileInputStream);
			var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
				createInstance(Components.interfaces.nsIConverterInputStream);
			fstream.init(fp.file, -1, 0, 0);
			cstream.init(fstream, "UTF-8", 0, 0);
			let (str = {}) {
			  let read = 0;
			  do { 
				read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
				data += str.value;
			  } while (read != 0);
			}
			cstream.close(); // this closes fstream

			//add the identifier to the string data
			if (gExportID != "common") {data = data.replace(/extensions.smarttemplate./gm, "extensions.smarttemplate." + gExportID + ".");}
			
			//write corrected data to temp file
			var tmpFile = Components.classes["@mozilla.org/file/directory_service;1"].
			getService(Components.interfaces.nsIProperties).
			get("TmpD", Components.interfaces.nsIFile);
			tmpFile.append("st4Temp.tmp");
			tmpFile.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
			var stream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
			stream.init(tmpFile, -1, -1, 0);
			stream.write(data, data.length);
			stream.close();

			var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
			var loader = Components.classes['@mozilla.org/moz/jssubscript-loader;1'].getService(Components.interfaces.mozIJSSubScriptLoader);
			loader.loadSubScript(ioService.newFileURI(tmpFile).spec);
			
			//refresh window enable/disable status
			gSmartTemplateSettings.disableWithCheckbox();
		}
		
		function pref(aPrefName, aValue) {
			var preferences = document.getElementsByTagName("preference");
			for (var i = 0; i < preferences.length; i++) {
			if (preferences[i].name == aPrefName) {
			  preferences[i].value = preferences[i].inverted ? !aValue : aValue;
			  return;
			}
			}

			var preferencesElements = document.getElementsByTagName("preferences");
			var preferencesElement = preferencesElements[preferencesElements.length - 1];

			var preference = preferencesElement.appendChild(document.createElement("preference"));
			preference.setAttribute("id", aPrefName);
			preference.setAttribute("name", aPrefName);
			preference.setAttribute("type", {"boolean": "bool", "number": "int"}[typeof aValue] || "string");
			preference.value = aValue;
		}


// Custom context menu on Help tab (right click copy command)
//--------------------------------------------------------------------
		function SmartTemplate4RightClickCopyCommand(){
			try{
				// Get String
				var str = copy_getSelection();
						
				// Copy to Clipboard
				if(str != null && str.length > 0){
					var oClipBoard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
						oClipBoard.copyString(str);
				}
						
			}catch(err) { alert("An unknown error occurred\n"+ err) }
		}
		function copy_getSelection() {
			var focusedWindow = document.commandDispatcher.focusedWindow;
			var searchStr 		= focusedWindow.getSelection.call(focusedWindow);
			searchStr 			= searchStr.toString();
			return searchStr;
		}
