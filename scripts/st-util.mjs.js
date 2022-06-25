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
  
  // 208
	isComposeTypeIsForwardInline: function() {
		Util.logIssue184("Util.isComposeTypeIsForwardInline()");
		return true;
	},  
  
  // smartTemplate-util:1214
  getFileAsDataURI: async function(aURL) {
    // TO DO: convert file URL to data. Code similar to MsgComposerCommand.loadBlockedImage()
    Util.logIssue184(`Util.getFileAsDataURI(${aURL})`);
    return aURL;
  },
  
  // 1269
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

  // 1658
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
  
  // 1092
  getIdentityKeyFromMail: async function(email) {
    let accounts = await messenger.accounts.list(false); // omit folders
    for (let account of accounts) {
			for (let j = 0; j < account.identities.length; j++) {
				let identity = account.identities[j];
        if (identity.email.toLowerCase() == email.toLowerCase()) {
          return identity.id;  // was identity.key !
        }
			}
    }
    return null;    
  },
  
  // 1105
  // sig can be a string or a HTML node!
	getSignatureInner: function(sig, isRemoveDashes, global) {
		function removeDashes(elem, isPlainText) {
			// also fix removing dashes from plain text sig:
			if (isPlainText) {
				return elem.replace('-- \<br\>', '');
			}
		
			// [Bug 25483] when using %sig(2)% signature is missing on new mails in HTML mode
			let newSig = elem;
			if (elem.childNodes.length) {
				if (elem.childNodes.length == 1)
					newSig = removeDashes(elem.firstChild);
				else {
					if (elem.firstChild.nodeValue == "-- ") {
						elem.removeChild(elem.firstChild); //remove '-- '
					}
					if (elem.firstChild.tagName == 'BR') {
						elem.removeChild(elem.firstChild); //remove 'BR'
					}
				}
			}
			return newSig;
		}
		// the actual function
		try {
			this.logDebugOptional('regularize','getSignatureInner(' + isRemoveDashes + ')');
			if (sig != null) {
        global.sigInTemplate = true;  // [issue 184] convert side effect 
				// SmartTemplate4.sigInTemplate = true;
				if (typeof sig === "string")
					return isRemoveDashes ? removeDashes(sig, true) : sig;
					
				if (!sig.children || sig.children.length==0) {
					this.logDebugOptional('regularize','getSignatureInner(): signature has no child relements.');

					return sig.innerHTML ? sig.innerHTML : 
                 (sig.outerHTML ? sig.outerHTML : '');  // deal with DOM String sig (non html)
				}
				if (isRemoveDashes) {
				  removeDashes(sig, false);
				}
				return sig.innerHTML;
			}
		}
		catch(ex) {
			this.logException('regularize.getSignatureInner() failed', ex);
		}
		return "";
	} ,
  
  // 133
  addUsedPremiumFunction: function(what) {
    // see premiumFeatures array, needs to be instanciated per composers
    this.logIssue184(`Util.addUsedPremiumFunction(${what})`);
  },
  
  // 1027
	getIsoWeek : function (tm, dowOffset) {
	/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.epoch-calendar.com */
		if (!tm) {
			return ("No valid time passed to getIsoWeek!");
		}
		if (isNaN(dowOffset)) {
			return ("cwIso(offset) needs a number as offset! e.g. cwIso(0)");
		}
		Util.logDebugOptional('functions', 'Util.getIsoWeek(' + tm + ', ' + dowOffset + ')');

		dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero

		let newYear = new Date(tm.getFullYear(),0,1);
		let day = newYear.getDay() - dowOffset; //the day of week the year begins on
		day = (day >= 0 ? day : day + 7);
		let daynum = Math.floor((tm.getTime() - newYear.getTime() -
		             (tm.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
		let weeknum;
		//if the year starts before the middle of a week
		if(day < 4) {
			weeknum = Math.floor((daynum+day-1)/7) + 1;
			if(weeknum > 52) {
				let nYear = new Date(tm.getFullYear() + 1,0,1);
				let nday = nYear.getDay() - dowOffset;
				nday = nday >= 0 ? nday : nday + 7;
				/*if the next year starts before the middle of
				the week, it is week #1 of that year*/
				weeknum = nday < 4 ? 1 : 53;
			}
		}
		else {
			weeknum = Math.floor((daynum+day-1)/7);
		}
		Util.logDebugOptional('functions', 'Util.getIsoWeek() returns weeknum: ' + weeknum);
		return weeknum;
	},  
  
  // 1064
	isFormatLink : function(format) {
    if (!format) return false;
    if (format.charAt(0)=='(')
      format = format.slice(1);
    if (format.charAt(format.length-1)==')')
      format = format.slice(0, -1);
    
    let fs = format.split(',');
	  return (fs.indexOf('link') != -1);
	} ,  

  //1162
  toTitleCase: function toTitleCase(str) { // international version.
    let orig = str;
    try {
      let words = str.split(' ');
          
      for (let i=0; i<words.length; i++) {
        let word = words[i],
            findw = 0;
        while ("\\\"\'\{\[\(\)".indexOf(word.charAt(findw))>=0 && findw<word.length) {
          findw++; // skip these characters, so we hit alphabetics again
        }
        
        
        // Titlecase and re-append to Array
        words[i] = word.substring(0, findw)
                       .concat(word.charAt(findw).toLocaleUpperCase())
                       .concat(word.substring(findw + 1).toLocaleLowerCase());
        // deal with composite names, e.g. Klaus-Dieter
        let compositeName = words[i].split('-');
        if (compositeName.length>1) {
          let cname = '';
          for (let m=0; m<compositeName.length; m++) {
            if (m>0)
              cname += '-';
            cname += compositeName[m].charAt(0).toLocaleUpperCase() + compositeName[m].substring(1);
          }
          words[i] = cname;
        }
      }
      str = words.join(' ');
      return str;
    }
    catch(ex) {
      this.logException ("toTitleCase(" + orig + ") failed", ex);
      return orig;
    }
  } ,
	

  
  // 1201
  // @global=true returns a regular expression from a quoted string
  // @global=false returns a string from a quoted string
  unquotedRegex: async function unquotedRegex(s, global) {
    if (s == "clipboard") { // [issue 183]
      return await Util.clipboardRead();
    }
		let quoteLess = s.substring(1, s.length-1);
	  if (global)
			return new RegExp( quoteLess, 'ig');
    // allow using \n and \t for new line and tabs characters
		return quoteLess.replace(/\\n/gi,"\n").replace(/\\t/gi,"\t");
	} ,
	 
  // 1490 
  resolveDeferred: async function (editor, el, isReplaceField, nodeList) {
    Util.logIssue184("Util.resolveDeferred()");
  },
  
  
  // 1678
	// new function for manually formatting a time / date string in one go.
  // global variables / side effects
  //   util.addUsedPremiumFunction
  // added @offsets to avoid side effects
	dateFormat: function dateFormat(time, timeFormat, timezone, offsets) {
    if (!offsets) { throw new Error("dateFormat() needs new offsets parameter!");}
		Util.logDebugOptional('timeStrings','dateFormat(' + time + ', ' + timeFormat + ', ' + timezone  +')\n' + 
		  'Forced Timezone[' + offsets.whatIsTimezone + ']= ' + Util.getTimezoneOffset(offsets.whatIsTimezone));
		this.addUsedPremiumFunction('dateFormat');
		if (!timezone) timezone=0;
		try {
			let tm = new Date();
			
			if (offsets.whatIsDateOffset) {
				time += (offsets.whatIsDateOffset*24*60*60*1000*1000); // add n days
			}
			if (offsets.whatIsHourOffset || offsets.whatIsMinuteOffset ) {
				time += (offsets.whatIsHourOffset*60*60*1000*1000)
				      + (offsets.whatIsMinuteOffset*60*1000*1000); // add m hours / n minutes
			}		
			if (offsets.whatIsTimezone) { // subtract UTC offset for timezone
			  let nativeUtcOffset = tm.getTimezoneOffset(),
			      forcedOffset = Util.getTimezoneOffset(offsets.whatIsTimezone)*60; // calculate minutes
				time = time + (nativeUtcOffset + forcedOffset)*60*1000*1000;
			}
			
			// Set Time - add Timezone offset
			tm.setTime(time / 1000 + (timezone) * 60 * 1000);
			let d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); },
			    isUTC = offsets.whatIsUtc,
					year = isUTC ? tm.getUTCFullYear().toString() : tm.getFullYear().toString(),
					month = isUTC ? tm.getUTCMonth() : tm.getMonth(),
					day = isUTC ? tm.getUTCDate() : tm.getDate(),
					hour = isUTC ? tm.getUTCHours() : tm.getHours(),
					minute = isUTC ? tm.getUTCMinutes() : tm.getMinutes();
					
      //numeral replacements first					
			let timeString = 
			  timeFormat
					.replace('Y', year)
					.replace('y', year.slice(year.length-2))
					.replace('n', (month+1))
					.replace('m', d02(month+1))
					.replace('e', day)
					.replace('d', d02(day))
					.replace('k',     hour)
					.replace('H', d02(hour))
					.replace('l',    (((hour + 23) % 12) + 1))
					.replace('I', d02(((hour + 23) % 12) + 1))
					.replace('M', d02(minute))
					.replace('S', d02(tm.getSeconds()));
			
      // alphabetic-placeholders need to be inserted because otherwise we will replace
			// parts of day / monthnames etc.
			timeString=			
			  timeString
					.replace("tz_name", "##t")
					.replace('B', '##B')
					.replace('b', '##b')
				  .replace('A', '##A')
					.replace('a', '##a')
					.replace('p1', '##p1')
					.replace('p2', '##p2')
					.replace('p', '##p');
				
			timeString=
			  timeString
				  .replace('##t', isUTC ? 'UTC' : Util.getTimeZoneAbbrev(tm, false))
					.replace('##p1', hour < 12 ? "a.m." : "p.m.")
					.replace('##p2', hour < 12 ? "A.M." : "P.M.")
					.replace('##p', hour < 12 ? "AM" : "PM");
      
      let calendarParams = ['##B','##b','##A','##a'];
      if (calendarParams.some(par => timeString.includes(par)))  {
        timeString =
          timeString		
            .replace('##B', Util.calendar.monthName(month))
            .replace('##b', Util.calendar.shortMonthName(month))
            .replace('##A', Util.calendar.dayName(tm.getDay()))
            .replace('##a', Util.calendar.shortDayName(tm.getDay()));
      }
					
			Util.logDebugOptional('timeStrings', 'Created timeString: ' + timeString);
			return timeString;
			
		}
		catch (ex) {
			Util.logException('Util.dateFormat() failed', ex);
		}
		return '';
	} ,
  
  // from smartTempalte-main.js:921
  calendar: {
    addonName: null,
    isInitialized: null,
    init: async function(forcedLocale) {
      Util.logIssue184(`SmartTemplatesProcess.calender.init(${forcedLocale})`);
      let cal = this,
          manifest = await messenger.runtime.getManifest();
      cal.addonName = await manifest.name;
      cal.isInitialized = true;
      if (forcedLocale) {currentLocale = forcedLocale;}
    },
    dayName: function dayName(n){ 
      Util.logIssue184(`calendar.dayName(${n})`);
      return messenger.i18n.getMessage(`day.${(n+1)}.name`, this.addonName);
      // return this.bundle.GetStringFromName("day." + (n + 1) + ".name");
    },
    
    shortDayName: function shortDayName(n) { 
      Util.logIssue184(`calendar.shortDayName(${n})`);
      return messenger.i18n.getMessage(`day.${(n+1)}.short`, this.addonName);
      // return this.bundle.GetStringFromName("day." + (n + 1) + ".short");
    },
    
    monthName: function monthName(n){ 
      Util.logIssue184(`calendar.monthName(${n})`);
      return messenger.i18n.getMessage(`month.${(n+1)}.name`, this.addonName);
      // return this.bundle.GetStringFromName("month." + (n + 1) + ".name");
    },
    
    shortMonthName: function shortMonthName(n) { 
      Util.logIssue184(`calendar.shortMonthName(${n})`);
      return messenger.i18n.getMessage(`month.${(n+1)}.short`, this.addonName);
      // return this.bundle.GetStringFromName("month." + (n + 1) + ".short");
    }    
  },
  
  // create an empty offsets struct, to replace SmartTemplate4.whatIs globals
  defaultOffsets: function() {
    Util.logDebug("Returning default offsets struct!");
    return {
      XisToday : 0,
      XisSent  : 1,
      whatIsDateOffset : 0,
      whatIsHourOffset : 0,
      whatIsMinuteOffset : 0,
      whatIsTimezone : null,
      whatIsUtc : false,
      whatIsX : 0  // this.XisToday
    }
  },

  // 1672
  isAddressHeader: function	isAddressHeader(token='') {
    if (!token) return false;
    return RegExp(" " + token + " ", "i").test(
       " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
       " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To ");
  } ,  
  
  // 1763
  // side effects (global variables used): 
  //   SmartTemplate4.whatIsDateOffset
  //   SmartTemplate4.whatIsHourOffset
  //   SmartTemplate4.whatIsMinuteOffset
  //   SmartTemplate4.whatIsTimezone
  // - these probably need to persisted during parsing into composers / info
	prTime2Str : async function(time, timeType, timezone, offsets) {
    if (!offsets) {
      offsets = this.defaultOffsets();
    }
		function getDateFormat(field) {
			return Preferences.getStringPref("dateformat." + field);
		}
					
		Util.logDebugOptional('timeStrings','prTime2Str(' + time + ', ' + timeType + ', ' + timezone + ')');
		try {
			let tm = new Date(),
					fmt;
          
				// alternative date formatting
				// Cu.import("resource:///modules/ToLocaleFormat.jsm");
				// new Services.intl.
				let dateOptions = {
					hour12: false, // 24 hours
					hour: getDateFormat('hour'),
					minute: "2-digit",
					dateStyle: "full"
				};
				// { dateStyle: "full", timeStyle: "long" } - not documented!
				switch (timeType) {
					case "datelocal":
						// no change
						dateOptions.weekday = "long";
					  dateOptions.day = getDateFormat('day');
					  dateOptions.month = "short";
					  dateOptions.year = "numeric";
						break;
					case "dateshort":
					default:
					  dateOptions.day = getDateFormat('day');
					  dateOptions.month = getDateFormat('month');
					  dateOptions.year = getDateFormat('year');
						break;
				}
				let localeString = util.getLocalePref();
				fmt = new Intl.DateTimeFormat(localeString, dateOptions);
				Util.logDebugOptional('timeStrings',"DateTimeFormat(" + localeString + ") resolved options: " + fmt.resolvedOptions());
      
			if (offsets.whatIsDateOffset) {
				time += (offsets.whatIsDateOffset*24*60*60*1000*1000); // add n days
				Util.logDebugOptional('timeStrings', "Adding " + offsets.whatIsDateOffset + " days to time");
			}
			if (offsets.whatIsHourOffset || offsets.whatIsMinuteOffset ) {
				time += (offsets.whatIsHourOffset*60*60*1000*1000)
				      + (offsets.whatIsMinuteOffset*60*1000*1000); // add n days
				Util.logDebugOptional('timeStrings', 
				  "Adding " + offsets.whatIsHourOffset  + ":" + offsets.whatIsMinuteOffset + " hours to time");
			}
			
			// Set Time - add Timezone offset
			let nativeUtcOffset = tm.getTimezoneOffset(),
			    forceTimeZone = offsets.whatIsTimezone; // UTC offset for current time,  in minutes
			if (forceTimeZone)  {
				let forceHours = util.getTimezoneOffset(forceTimeZone);
				timezone = nativeUtcOffset + forceHours*60; // offset in minutes!
				Util.logDebug("Adding timezone offsets:\n" +
				  "UTC Offset: " + nativeUtcOffset/60 + 
					"\nForced Timezone[" + forceTimeZone + "]: " + forceHours);
			}
			tm.setTime(time / 1000 + (timezone) * 60 * 1000);

			// Format date string
			let dateFormat = null,
			    timeFormat = null;

			
			let timeString;
			if (isOldDateFormat) {
				switch (timeType) {
					case "datelocal":
						dateFormat = fmt.dateFormatLong;
						timeFormat = fmt.timeFormatSeconds;
						break;
					case "dateshort":
					default:
						dateFormat = fmt.dateFormatShort;
						timeFormat = fmt.timeFormatSeconds;
						break;
				}
				timeString = fmt.FormatDateTime(SmartTemplate4.pref.getLocalePref(),
												dateFormat, 
												timeFormat,
												tm.getFullYear(), tm.getMonth() + 1, tm.getDate(),
												tm.getHours(), tm.getMinutes(), tm.getSeconds());
			}
			else
				timeString = fmt.format(tm)
			Util.logDebugOptional('timeStrings', "Created timeString: " + timeString);
			return timeString;
		}
		catch (ex) {
			Util.logException('util.prTime2Str() failed', ex);
		}
		return '';
	} ,
  
  // 1870
	zoneFromShort: function st4_zoneFromShort(short) {
		let timezones = {
			"ACDT" : "Australian Central Daylight Time",
			"ACST" : "Australian Central Standard Time",
			"ACT"	 : "ASEAN Common Time",
			"ADT"	 : "Atlantic Daylight Time",
			"AEDT" : "Australian Eastern Daylight Time",
			"AEST" : "Australian Eastern Standard Time",
			"AUS"  : "Australian Time",
			"AFT"	 : "Afghanistan Time",
			"AKDT" : "Alaska Daylight Time",
			"AKST" : "Alaska Standard Time",
			"AMST" : "Armenia Summer Time",
			"AMT"	 : "Armenia Time",
			"ART"	 : "Argentina Time",
			"AST"	 : "Atlantic Standard Time",
			"AWDT" : "Australian Western Daylight Time",
			"AWST" : "Australian Western Standard Time",
			"AZOST": "Azores Standard Time",
			"AZT"	 : "Azerbaijan Time",
			"BDT"	 : "Brunei Time",
			"BIOT" : "British Indian Ocean Time",
			"BIT"	 : "Baker Island Time",
			"BOT"	 : "Bolivia Time",
			"BRT"	 : "Brasilia Time",
			"BST"	 : "British Summer Time (British Standard Time from Feb 1968 to Oct 1971)",
			"BTT"	 : "Bhutan Time",
			"CAT"	 : "Central Africa Time",
			"CCT"	 : "Cocos Islands Time",
			"CDT"	 : "Central Daylight Time (North America)",
			"CEDT" : "Central European Daylight Time",
			"CEST" : "Central European Summer Time (Cf. HAEC)",
			"CET"	 : "Central European Time",
			"CHADT": "Chatham Daylight Time",
			"CHAST": "Chatham Standard Time",
			"CHOT" : "Choibalsan",
			"ChST" : "Chamorro Standard Time",
			"CHUT" : "Chuuk Time",
			"CIST" : "Clipperton Island Standard Time",
			"CIT"	 : "Central Indonesia Time",
			"CKT"	 : "Cook Island Time",
			"CLST" : "Chile Summer Time",
			"CLT"	 : "Chile Standard Time",
			"COST" : "Colombia Summer Time",
			"COT"	 : "Colombia Time",
			"CST"	 : "Central Standard Time (North America)",
			"CT"   : "China time",
			"CVT"	 : "Cape Verde Time",
			"CWST" : "Central Western Standard Time (Australia)",
			"CXT"	 : "Christmas Island Time",
			"DAVT" : "Davis Time",
			"DDUT" : "Dumont d'Urville Time",
			"DFT"	 : "AIX specific equivalent of Central European Time",
			"EASST": "Easter Island Standard Summer Time",
			"EAST" : "Easter Island Standard Time",
			"EAT"	 : "East Africa Time",
			"ECT"	 : "Ecuador Time",
			"EDT"	 : "Eastern Daylight Time (North America)",
			"EEDT" : "Eastern European Daylight Time",
			"EEST" : "Eastern European Summer Time",
			"EET"	 : "Eastern European Time",
			"EGST" : "Eastern Greenland Summer Time",
			"EGT"	 : "Eastern Greenland Time",
			"EIT"	 : "Eastern Indonesian Time",
			"EST"	 : "Eastern Standard Time (North America)",
			"FET"	 : "Further-eastern_European_Time",
			"FJT"	 : "Fiji Time",
			"FKST" : "Falkland Islands Summer Time",
			"FKT"	 : "Falkland Islands Time",
			"FNT"	 : "Fernando de Noronha Time",
			"GALT" : "Galapagos Time",
			"GAMT" : "Gambier Islands",
			"GET"	 : "Georgia Standard Time",
			"GFT"	 : "French Guiana Time",
			"GILT" : "Gilbert Island Time",
			"GIT"	 : "Gambier Island Time",
			"GMT"	 : "Greenwich Mean Time",
			"GST"	 : "South Georgia and the South Sandwich Islands",
			"GYT"	 : "Guyana Time",
			"HADT" : "Hawaii-Aleutian Daylight Time",
			"HAEC" : "Heure Avanc\u00E9e d'Europe Centrale francised name for CEST",
			"HAST" : "Hawaii-Aleutian Standard Time",
			"HKT"	 : "Hong Kong Time",
			"HMT"	 : "Heard and McDonald Islands Time",
			"HOVT" : "Khovd Time",
			"HST"	 : "Hawaii Standard Time",
			"ICT"	 : "Indochina Time",
			"IDT"	 : "Israel Daylight Time",
			"I0T"	 : "Indian Ocean Time",
			"IRDT" : "Iran Daylight Time",
			"IRKT" : "Irkutsk Time",
			"IRST" : "Iran Standard Time",
			"IST"	 : "Irish Summer Time",
			"JST"	 : "Japan Standard Time",
			"KGT"	 : "Kyrgyzstan time",
			"KOST" : "Kosrae Time",
			"KRAT" : "Krasnoyarsk Time",
			"KST"	 : "Korea Standard Time",
			"LHST" : "Lord Howe Standard Time",
			"LINT" : "Line Islands Time",
			"MAGT" : "Magadan Time",
			"MART" : "Marquesas Islands Time",
			"MAWT" : "Mawson Station Time",
			"MDT"	 : "Mountain Daylight Time (North America)",
			"MET"	 : "Middle European Time Same zone as CET",
			"MEST" : "Middle European Saving Time Same zone as CEST",
			"MHT"	 : "Marshall_Islands",
			"MIST" : "Macquarie Island Station Time",
			"MIT"	 : "Marquesas Islands Time",
			"MMT"	 : "Myanmar Time",
			"MSK"	 : "Moscow Time",
			"MST"	 : "Mountain Standard Time (North America)",
			"MUT"	 : "Mauritius Time",
			"MVT"	 : "Maldives Time",
			"MYT"	 : "Malaysia Time",
			"NCT"	 : "New Caledonia Time",
			"NDT"	 : "Newfoundland Daylight Time",
			"NFT"	 : "Norfolk Time[1]",
			"NPT"	 : "Nepal Time",
			"NST"	 : "Newfoundland Standard Time",
			"NT"	 : "Newfoundland Time",
			"NUT"	 : "Niue Time",
			"NZDT" : "New Zealand Daylight Time",
			"NZST" : "New Zealand Standard Time",
			"OMST" : "Omsk Time",
			"ORAT" : "Oral Time",
			"PDT"	 : "Pacific Daylight Time (North America)",
			"PET"	 : "Peru Time",
			"PETT" : "Kamchatka Time",
			"PGT"	 : "Papua New Guinea Time",
			"PHOT" : "Phoenix Island Time",
			"PHT"	 : "Philippine Time",
			"PKT"	 : "Pakistan Standard Time",
			"PMDT" : "Saint Pierre and Miquelon Daylight time",
			"PMST" : "Saint Pierre and Miquelon Standard Time",
			"PONT" : "Pohnpei Standard Time",
			"PST"	 : "Pacific Standard Time (North America)",
			"RET"	 : "R\u00E9union Time",
			"ROTT" : "Rothera Research Station Time",
			"SAKT" : "Sakhalin Island time",
			"SAMT" : "Samara Time",
			"SAST" : "South African Standard Time",
			"SBT"	 : "Solomon Islands Time",
			"SCT"	 : "Seychelles Time",
			"SGT"	 : "Singapore Time",
			"SLT"	 : "Sri Lanka Time",
			"SRT"	 : "Suriname Time",
			"SST"	 : "Singapore Standard Time",
			"SYOT" : "Showa Station Time",
			"TAHT" : "Tahiti Time",
			"THA"	 : "Thailand Standard Time",
			"TFT"	 : "Indian/Kerguelen",
			"TJT"	 : "Tajikistan Time",
			"TKT"	 : "Tokelau Time",
			"TLT"	 : "Timor Leste Time",
			"TMT"	 : "Turkmenistan Time",
			"TOT"	 : "Tonga Time",
			"TVT"	 : "Tuvalu Time",
			"UCT"	 : "Coordinated Universal Time",
			"ULAT" : "Ulaanbaatar Time",
			"UTC"	 : "Coordinated Universal Time",
			"UYST" : "Uruguay Summer Time",
			"UYT"	 : "Uruguay Standard Time",
			"UZT"	 : "Uzbekistan Time",
			"VET"	 : "Venezuelan Standard Time",
			"VLAT" : "Vladivostok Time",
			"VOLT" : "Volgograd Time",
			"VOST" : "Vostok Station Time",
			"VUT"  : "Vanuatu Time",
			"WAKT" : "Wake Island Time",
			"WAST" : "West Africa Summer Time",
			"WAT"	 : "West Africa Time",
			"WEDT" : "Western European Daylight Time",
			"WEST" : "Western European Summer Time",
			"WET"  : "Western European Time",
			"WST"	 : "Western Standard Time",
			"YAKT" : "Yakutsk Time",
			"YEKT" : "Yekaterinburg Time"
		};

		let tz = timezones[short]; // Date().toString().replace(/^.*\(|\)$/g, "")
		return tz || short;
	} ,
	
  // 2055
	getTimezoneOffset: function st4_getTimezoneOffset(zone) {
		let offset = 0;
		// Offsets according to https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations
		switch (zone) {
			case "ACDT": return 10.5;
			case "ACST": return 9.5;
			case "ACT": return -5;
			case "ACWST": return 8.75;
			case "ADT": return -3;
			case "AEDT": return 11;
			case "AEST": return 10;
			case "AFT": return 4.5;
			case "ART": return -3;
			case "AKDT": return -8; // Alaska Daylight
			case "AKST": return -9;
			case "AMST": return -3;
			case "ART": return -3;
			case "AST": return -4;  //Atlantic Standard Time
			case "AWST": return 8;
			case "AZOST": return 0;
			case "AZOT": return -1;
			case "AZT": return 4;
			case "BDT": return 8;
			case "BIOT": return 6;
			case "BIT": return -12;
			case "BOT": return -4;
			case "BRST": return -2;
			case "BRT": return -3;
			case "BST": return 1; // British Summer Time
			case "BTT": return 6;
			case "CAT": return 2;
			case "CCT": return 6.5;
			case "CDT": return -5; // Central Daylight (North America)
			case "CEDT": return 2; // Central European Daylight Saving Time
			case "CEST": return 2; // Central European Summer Time
			case "CET": return 1;
			case "CHADT": return 13.75;
			case "CHAST": return 12.75;
			case "CHOT": return 8;
			case "CHIST": return 9;
			case "CHST": return 10;
			case "CHUT": return 10;
			case "CIST": return -8;
			case "CIT": return 8;
			case "CKT": return -10;
			case "CLST": return -3;
			case "CLT": return -4;
			case "COST": return -5;
			case "CST": return -6; // Central Standard Time (North America)
			case "CT": return 8;
			case "CVT": return -1;
			case "CWST": return -8.75; // Central Western Standard Time (Australia) unofficial
			case "CXT": return 7;
			case "DAVY": return 7;
			case "DDUT": return 10;
			case "DFT": return 1;
			case "EASST": return -5;
			case "EAST": return -6;
			case "EAT": return 3;
			case "ECT": return -4; //Eastern Caribbean Time 
			case "EDT": return -4; // Eastern Daylight Time (North America)
			case "EEST": return 3;
			case "EET": return 2;
			case "EGST": return -1;
			case "EGT": return -1;
			case "EIT": return 9;
			case "EST": return -5; // Eastern Standard Time (North America)
			case "FET": return 3;
			case "FJT": return 12;
			case "FKST": return -3;
			case "FKT": return -4;
			case "FNT": return -2;
			case "GAKT": return -6;
			case "GAMT": return -9;
			case "GFT": return -3;
			case "GILT": return 12;
			case "GIT": return -9;
			case "GMT": return 0;
			case "GST": return 4; //  	Gulf Standard Time
			case "GYT": return -4;
			case "HDT": return -9;
			case "HAEC": return 2;
			case "HST": return -10;
			case "HKT": return 8;
			case "HMT": return 5;
			case "HOVST": return 8;
			case "HOVT": return 7;
			case "ICT": return 7;
			case "IDLW": return -12;
			case "IDT": return 3;
			case "IOT": return 3;
			case "IRDT": return 4.5;
			case "IRKT": return 8;
			case "IRST": return 3.5;
			case "IST": return 5.5;
			case "JST": return 9;
			case "KALT": return 2;
			case "KGT": return 6;
			case "KOST": return 11;
			case "KRAT": return 7;
			case "KST": return 9;
			case "LHST": return 10.5; // Lord Howe Standard Time
			case "LINT": return 14;
			case "MAGT": return 12;
			case "MART": return -9.5;
			case "MAWT": return 5;
			case "MDT": return -6;
			case "MEET": return 1;
			case "MEST": return 2; // Middle European Summer Time 
			case "MESZ": return 2; // Middle European Summer Time 
			case "MHT": return 12;
			case "MIST": return 11;
			case "MIT": return -9.5;
			case "MMT": return 6.5;
			case "MSK": return 3;
			case "MST": return -7;  // Mountain Standard Time (North America)
			case "MUT": return 4;
			case "MVT": return 5;
			case "MYT": return 8;
			case "NCT": return 11;
			case "NDT": return -2.5;
			case "NFT": return 11;
			case "NPT": return 5.75;
			case "NST": return -3.5;
			case "NT": return -3.5;
			case "NUT": return -11;
			case "NZDY": return 13;
			case "NZST": return 12;
			case "OMST": return 6;
			case "ORAT": return 5;
			case "PDT": return -7;
			case "PET": return -5;
			case "PETT": return 12;
			case "PGT": return 10;
			case "PHOT": return 13;
			case "PHT": return 8;
			case "PKT": return 5;
			case "PMDT": return -2;
			case "PMST": return -3;
			case "PONT": return 11;
			case "PST": return -8;  //Pacific Standard Time (North America)
			case "PYST": return -3;
			case "PYT": return -4;
			case "RET": return 4;
			case "ROTT": return -3;
			case "SAKT": return 11;
			case "SAMT": return 4;
			case "SAST": return 2;
			case "SBT": return 11;
			case "SCT": return 4;
			case "SDT": return -10;
			case "SGT": return 8;
			case "SLST": return 5.5;
			case "SRET": return 11;
			case "SST": return 8;  //Singapore Standard Time
			case "SYOT": return 3;
			case "TAHT": return -10;
			case "THA": return 7;
			case "TFT": return 5;
			case "TJT": return 5;
			case "TKT": return 13;
			case "TLT": return 9;
			case "TMT": return 5;
			case "TRT": return 3;
			case "TOT": return 13;
			case "TVT": return 12;
			case "ULAST": return 9;
			case "ULAT": return 8;
			case "UTC": return 0;
			case "UYST": return -2;
			case "UYT": return -3;
			case "UZT": return 5;
			case "VET": return -4;
			case "VLAT": return 10;
			case "VOLT": return 4;
			case "VOST": return 6;
			case "VUT": return 11;
			case "WAKT": return 12;
			case "WAST": return 1;
			case "WAT": return 2;
			case "WEST": return 1;
			case "WET": return 0;
			case "WST": return 8;
			case "YAKT": return 9;
			case "YEKT": return 5;
		}
		return 0;
		
	} ,

  // 2245
	getTimeZoneAbbrev: function st4_getTimeZoneAbbrev(tm, isLongForm) {
    function isAcronym(str) {
      return (str.toUpperCase() == str); // if it is all caps we assume it is an acronym
    }
		// return tm.toString().replace(/^.*\(|\)$/g, ""); HARAKIRIs version, not working.
		// get part between parentheses
		// e.g. "(GMT Daylight Time)"
		Util.logDebugOptional ('timeZones', 'getTimeZoneAbbrev(time: ' + tm.toString() + ', long form: ' + isLongForm);
		let timeString =  tm.toTimeString(),
		    timeZone = timeString.match(/\(.*?\)/),
		    retVal = '';
		Util.logDebugOptional ('timeZones', 'timeString = ' + timeString + '\n' 
		                                      + 'timeZone =' + timeZone);
		if (timeZone && timeZone.length>0) {
      // remove enclosing brackets and split
			let words = timeZone[0].substr(1,timeZone[0].length-2).split(' ');
			for (let i=0; i<words.length; i++) {
        let wrd = words[i];
				if (isLongForm) {
					retVal += ' ' + wrd;
				}
				else {
					if (wrd.length == 3 && wrd.match('[A-Z]{3}') 
					    ||
					    wrd.length == 4 && wrd.match('[A-Z]{4}')
              ||
              isAcronym(wrd))
          {
						retVal += wrd + ' ';  // abbrev contained
          }
					else {
						retVal += wrd[0];  // first letters cobbled together
          }
				}
			}
		}
		else {
			Util.logDebugOptional ('timeZones', 'no timeZone match, building manual...');
			retVal = timeString.match('[A-Z]{4}');
			if (!retVal)
				retVal = timeString.match('[A-Z]{3}');
			// convert to long form by using hard-coded time zones array.
			Util.logDebug('Cannot determine timezone string - Missed parentheses - from:\n' + timeString + ' regexp guesses: ' + retVal);
			if (isLongForm) {
				retVal = Util.zoneFromShort(retVal);
			}
		}
		Util.logDebugOptional ('timeZones', 'getTimeZoneAbbrev return value = ' + retVal);
		return retVal.trim();
	} ,
	
  // 2297
	splitFormatArgs: function splitFormatArgs(format)	{
    let formatArray = [];
    if (format) {
      // remove parentheses
      if (format.charAt(0)=='(')
        format = format.slice(1);
      if (format.charAt(format.length-1)==')')
        format = format.slice(0, -1);
      
      let fs=format.split(','); // lastname, firstname ?
      for(let i=0; i<fs.length; i++) {
        let ff = fs[i].trim();
        // if next one is a link modifier, modify previous element and continue
        switch(ff.toLowerCase()) {
          case 'link':
            formatArray[formatArray.length-1].modifier = 'linkTo';
            continue;
          case 'islinkable':
            formatArray[formatArray.length-1].modifier = 'linkable';
            continue;
        }
        formatArray.push ({ field: ff, modifier: ''}); // modifier: linkTo
      }
    }
		return formatArray;
	} ,
	  
  // 2447
  // isDisabled - force disabled (on retry)
  setSpellchecker: async function(languages, tabId) {
    let langArray = languages.split(",");
    let installedDics = await messenger.compose.getActiveDictionaries(tabId);
    let activeDictionaries = [];
    for (let [key,item] of Object.entries(installedDics)) {
      console.log(`${key}: `, item);
    }
    
    if (languages!="off") {
      for (let [key,item] of Object.entries(installedDics)) {
        // primary match (full string)
        let l = langArray.findIndex(el => el == key);
        if (l>=0) { 
          langArray.splice(l,1); // remove item
          activeDictionaries.push(key);
        }
        else {
          // secondary match (start of locale, e.g. "en" when only "en-US" is installed.)
          // first match found is used!
          let found = false;
          for(let j = 0; !found && j<langArray.length; j++) {
            if (key.startsWith(langArray[j])) {
              langArray.splice(j,1); // remove item
              activeDictionaries.push(key);
              found=true;
            }
          }
        }
      }
    }
    if (languages) {
      await messenger.compose.setActiveDictionaries(tabId, activeDictionaries);
    }

  },    
  
  // 2581
  removeHtmlEntities: function removeHtmlEntities(input){
    let text = input.replace(/&\w+?;/g, function( e ) {
      switch(e) {
        case '&nbsp;': return ' ';
        case '&tab;': return '  ';  // can't use literal \t at the moment.
        case '&copy;': return String.fromCharCode(169);
        case '&lt;': return '<';
        case '&gt;': return '>';
        default: return e;
      }
    }); 
    return text;    
  },  

  clipboardRead: async function() {
    return await navigator.clipboard.readText();
  },
  
  clipboardWrite: async function(text) {
    return await navigator.clipboard.writeText(text);
  },
  
  // async version of string.replace()
  // takes an asynchronous callback function as last argument.
  replaceAsync: async function(string, searchValue, replacer) {
    /*
    https://www.npmjs.com/package/string-replace-async/v/3.0.2
    The MIT License (MIT)

    Copyright (c) Dmitrii Sobolev <disobolev@icloud.com> (github.com/dsblv)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    */
    try {
      if (typeof replacer === "function") {
        // 1. Run fake pass of `replace`, collect values from `replacer` calls
        // 2. Resolve them with `Promise.all`
        // 3. Run `replace` with resolved values
        var values = [];
        String.prototype.replace.call(string, searchValue, function () {
          values.push(replacer.apply(undefined, arguments));
          return "";
        });
        return Promise.all(values).then(function (resolvedValues) {
          return String.prototype.replace.call(string, searchValue, function () {
            return resolvedValues.shift();
          });
        });
      } else {
        return Promise.resolve(
          String.prototype.replace.call(string, searchValue, replacer)
        );
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }, 
  
  // make sure nothing gets lost, without displaying an alert
  logIssue184: function(txt) {
    console.log(`%c[issue 184] to do: %c${txt}`, "color:red", "background: blue; color:yellow;");
  },
  
  
}

 