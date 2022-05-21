"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/
// [issue 184] Replacement for smartTemplate-util.js - SmartTemplates.Util
//             original namespace: SmartTemplate4.Util

import {Preferences} from "./st-prefs.mjs.js"; // we need this.


export function slideAlert(title, text, icon) {
  try {
    // we need permissions to use messenger.notifications
    // ex_notifications doesn't quite work (code from c-c) 
		messenger.notifications.create({
			type: "basic",
			title,
			message: text,
			iconUrl: icon || "/chrome/content/skin/icon32x32.png"
		});
  }
  catch(ex) {
    console.log(ex);
  }
}

export function log(msg, data, mode = "log") { // log, info, warn, error
	console[mode](msg, data);
}

export let Util = {
  log: function(txt) {
    console.log(...arguments);
  },
	logTime: function() {
		let timePassed = '';
    let end;
		try { // AG added time logging for test
			end = new Date();
			let endTime = end.getTime();
			if (this.lastTime === 0) {
				this.lastTime = endTime;
				return "[logTime init]";
			}
			let elapsed = new String(endTime - this.lastTime); // time in milliseconds
			timePassed = '[' + elapsed + ' ms]	 ';
			this.lastTime = endTime; // remember last time
		}
		catch(e) {;}
		return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
	},  
  // first argument is the option tag
  logWithOption: function logWithOption(a) {
    arguments[0] =  "SmartTemplates "
      +  '{' + arguments[0].toUpperCase() + '} ' 
      + Util.logTime() + "\n";
    console.log(...arguments);
  },  

	logToConsole: function (a) {
    let msg = "SmartTemplates " + Util.logTime() + "\n";
    console.log(msg, ...arguments);
  },
	logException: function (aMessage, ex) {
		let srcName = ex.fileName ? ex.fileName : "",
        errTxt = aMessage + "\n" + ex.message,
		    stack = "";
		if (typeof ex.stack!="undefined") {
			stack = ex.stack.replace("@","\n  ");
    }

    console.log (`${errTxt}\n${srcName}:${ex.lineNumber}\n${stack}`);
	} ,  
	logDebug: async function (msg) {
	  // to disable the standard debug log, turn off extensions.smartTemplate4.debug.default
		if (await Preferences.isDebug && await Preferences.isDebugOption('default'))
			this.logToConsole(...arguments);
	}, 
	logDebugOptional: async function (optionString, msg) {
    optionString = arguments[0];
    let options = optionString.split(','); // allow multiple switches
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (Preferences.isDebugOption(option)) {
        this.logWithOption(...arguments);
        break; // only log once, in case multiple log switches are on
      }
    }
	},
  
  // smartTemplate-util:1214
  getFileAsDataURI: async function(aURL) {
    // TO DO: convert file URL to data. Code similar to MsgComposerCommand.loadBlockedImage()
    return aURL;
  },
  isFilePathAbsolute : function isFilePathAbsolute(path) {
    if (!path) return false;
     
    // check for user folder / drive letter or double slash
    return (path.toLowerCase().startsWith('/user') || 
      /([a-zA-Z]:)/.test(path) || 
      path.startsWith("\\") || path.startsWith("/"));
  },  
  // retrieve the folder path of a full file location (e.g. C:\user\myTemplate.html)
  // filePath - name of file or relative path of file to append or empty
  getPathFolder: function getPathFolder(path, filePath) {
    let slash = path.includes("/") ? "/" : "\\",
        noSlash = (slash=='/') ? "\\" : "/",
        fPart = path.lastIndexOf(slash),
        newPath = "",
        appendedPath = "";
    if (fPart)
      newPath = path.substr(0,fPart) + slash;
    // issue 77 - %file()% path truncated at front by 1 letter on Mac OS
    if (filePath && newPath) {
      let slashUnifiedFilePath = filePath.replace(noSlash, slash);
      appendedPath = slashUnifiedFilePath.substr(slashUnifiedFilePath[0] == slash ? 1 : 0); // strip leading slash
    }
    return newPath + appendedPath;
  },
  
	// HTML only:
	// headers that are currently not defined may be filled later.
	// e.g. adding a To address when writing a new email
	wrapDeferredHeader : function wrapDeferredHeader(field, defaultValue, isHtml, isComposeNew) {
		if (Preferences.isDebugOption("tokens.deferred")) debugger;
		
		let newComposeClass = isComposeNew ? " class='noWrite'" : ""; /* make field look pink for headers that are not available in New Emails */
		if (!isHtml) return defaultValue; // not supported in plain text for now
		
		
		
		if (!defaultValue) {  //  || defaultValue=='??'
			defaultValue = field;  // show the syntax of placeholder (without percent signs!)
		}
			
		// Add variables in "Write" window to standard features!
    // util.popupLicenseNotification("Wrap_Deferred_Variables", true, true, "%" + field + "%");
		field = field.replace(/%/g,'');
		let tag = "<smarttemplate" +
					 " hdr='" + field + "'" +
					 " st4variable='" + field + "'" +
					 " title='" + field + "'" +
					 newComposeClass + 
					 ">" + defaultValue + "</smarttemplate>";
					 
		return tag;
	} , 
	checkIsURLencoded: function checkIsURLencoded(tok) {
		if (tok.length>=4) {
			let t = tok.substr(0,2); // hexcode, such as %5C
			if (/\%[0-9a-fA-F][0-9a-fA-F]/.test(t)) {
				this.logDebug("checkIsURLencoded()\n" +
				  "Ignoring character sequence as not a SmartTemplate because it looks like an URL encoded sequence:\n" +
					tok)
				return true;
			}
		}
		this.logDebug("checkIsURLencoded()\nNot an encoded string,  this may be a SmartTemplates header:\n" + tok);
		return false;
	}	,  
  isAddressHeader: function	isAddressHeader(token='') {
    if (!token) return false;
    return RegExp(" " + token + " ", "i").test(
       " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
       " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To ");
  } ,
}

 