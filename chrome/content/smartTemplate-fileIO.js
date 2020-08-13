"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


SmartTemplate4.IO = {
//******************************************************************************
// Export / Import
// added in v.1.0.0
//******************************************************************************
	export : function() {
		//localized text for filePicker filter menu
		var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
			 getService(Components.interfaces.nsIStringBundleService);
		var bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties");
		try{ //try reading the localized string; if it fails write it in English
			var filterText = bundle.GetStringFromName("fpFilterName");
		} catch (e) {
			var filterText = "SmartTemplate4 File";
		}

		var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);
		fp.init(window, "", fp.modeSave);
		var filename = document.getElementById("msgIdentity").selectedItem.label + ".st4";
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
				if (preferences[i].name.match(regexp)) {str += this.createLine(preferences[i],gExportID);}
			} else {
			//create lines for common acounts
				if (!preferences[i].name.match(/id\d/)) {str += this.createLine(preferences[i],gExportID);}
			}
		}

		var stream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
		stream.init(fp.file, -1, -1, 0);
		stream.write(str, str.length);
		stream.close();
	} ,

	createLine : function (pref, id) {
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
	} ,

// Import exported file
//--------------------------------------------------------------------
	import : function () {
		//localized text for filePicker filter menu
		var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
			 getService(Components.interfaces.nsIStringBundleService);
		var bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/settings.properties");
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
		let str = {},
        read = 0;
    do {
    read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
    data += str.value;
    } while (read != 0);
		
		cstream.close(); // this closes fstream

		//add the identifier to the string data
		if (gExportID != "common") {data = data.replace(/extensions.smartTemplate4./gm, "extensions.smartTemplate4." + gExportID + ".");}

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
	} ,

	pref : function (aPrefName, aValue) {
		var preferences = document.getElementsByTagName("preference");
		for (var i = 0; i < preferences.length; i++) {
			if (preferences[i].name == aPrefName) {
				preferences[i].value = preferences[i].inverted ? !aValue : aValue;
				return;
			}
		}

		var preferencesElements = document.getElementsByTagName("preferences");
		var preferencesElement = preferencesElements[preferencesElements.length - 1];
		var preference = preferencesElement.appendChild(
		  document.createXULElement ? document.createXULElement("preference") : document.createElement("preference"));
		preference.setAttribute("id", aPrefName);
		preference.setAttribute("name", aPrefName);
		preference.setAttribute("type", {"boolean": "bool", "number": "int"}[typeof aValue] || "string");
		preference.value = aValue;
	} ,

	// Custom context menu on Help tab (right click copy command)
	//--------------------------------------------------------------------
	copy : function (){
		try{
			// Get String
			var str = this.copy_getSelection();

			// Copy to Clipboard
			if(str != null && str.length > 0){
				var oClipBoard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
					oClipBoard.copyString(str);
			}

		}catch(err) { alert("An unknown error occurred\n"+ err) }
	} ,

	copy_getSelection : function () {
		var focusedWindow = document.commandDispatcher.focusedWindow;
		var searchStr 		= focusedWindow.getSelection.call(focusedWindow);
		searchStr 			= searchStr.toString();
		return searchStr;
	}
}