"use strict";
// -----------------------------------------------------------------------------------
// ---------------------------- last edit at 06/02/2012 ------------------------------
// -----------------------------------------------------------------------------------
// ----------------------------------- Changelog -------------------------------------
// -----------------------------------------------------------------------------------
// 0.7.5: "use strict" suggested by Mozilla add-on review team
// 0.7.8: logging an error in error console if an variable is used incorrect
// 0.8.0: other order of Account Name-User Name' instead of 'User Name-Account Name
// 0.8.1: rewrote large partitions of the script code to fix problems in TB13
// 0.8.2: moved main object out to new file smartTemplate-main.js to share with settings.xul
// 0.8.3: reformatted.
// 0.8.4: renamed messengercomposeOverlay to smartTemplate-overlay.js for easier debugging
// -----------------------------------------------------------------------------------

//******************************************************************************
// for messengercompose
//******************************************************************************
// moved main object into smartTemplate-main.js !

// -------------------------------------------------------------------
// common (preference)
// -------------------------------------------------------------------
SmartTemplate4.classPref = function(branch, useDefault)
{
	// -----------------------------------
	// Constructor
	var root = Components.classes["@mozilla.org/preferences-service;1"]
	           .getService(Components.interfaces.nsIPrefBranch);

	// -----------------------------------
	// get preference
	function getCom(prefstring, def)
	{
		try {
			switch (root.getPrefType(prefstring))
			{
				case Components.interfaces.nsIPrefBranch.PREF_STRING:
					return root.getComplexValue(prefstring,
									 Components.interfaces.nsISupportsString).data;
					break;
				case Components.interfaces.nsIPrefBranch.PREF_INT:
					return root.getIntPref(prefstring);
					break;
				case Components.interfaces.nsIPrefBranch.PREF_BOOL:
					return root.getBoolPref(prefstring);
					break;
				default:
					break;
			}
			return def;
		} 
		catch(ex) {
			return def;
		}
	};

	// -----------------------------------
	// get preference(branch)
	function getWithBranch(prefstring, def)
	{
		return getCom(branch + prefstring, def);
	};

	// -----------------------------------
	// Get preference with identity key
	function getWithIdkey(idkey, pref, def)
	{
		if (getWithBranch(idkey + "." + useDefault, true))// Check common or not.
			{ return getWithBranch(pref, def); }          // common preference
		else
			{ return getWithBranch(idkey + "." + pref, def); }    // one's preference
	};
	
	// -----------------------------------
	// get locale preference
	function getLocalePref()
	{
		try
		{
			var prefService = Components.classes["@mozilla.org/preferences-service;1"]
			                  .getService(Components.interfaces.nsIPrefService);
			try { 
				var accept_languages = prefService.getComplexValue("intl.accept_languages", Components.interfaces.nsIPrefLocalizedString).data; 
			}
			catch (e) { 
				accept_languages = prefService.getCharPref("intl.accept_languages"); 
			}
			return /^[^\s,;]{2,}/.exec(accept_languages)[0];  // Extract first locale code in pref (space/comma/semicolon delimited list)
		} catch (e) { return "en"; }
	};

	// -----------------------------------
	// Public methods
	this.getCom = getCom;
	this.getWithBranch = getWithBranch;
	this.getWithIdkey = getWithIdkey;
	this.getLocalePref = getLocalePref;
};

// -------------------------------------------------------------------
// Get header string
// -------------------------------------------------------------------
SmartTemplate4.classGetHeaders = function(messageURI)
{
	// -----------------------------------
	// Constructor
	let messenger = Components.classes["@mozilla.org/messenger;1"].
						createInstance(Components.interfaces.nsIMessenger);
	let messageService = messenger.messageServiceFromURI(messageURI);
	let messageStream = Components.classes["@mozilla.org/network/sync-stream-listener;1"].
							createInstance().QueryInterface(Components.interfaces.nsIInputStream);
	let inputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
						  createInstance().QueryInterface(Components.interfaces.nsIScriptableInputStream);

	inputStream.init(messageStream);
	try {
		messageService.streamMessage(messageURI, messageStream, msgWindow, null, false, null);
	} 
	catch (ex) {
		SmartTemplate4.Util.logException('classGetHeaders - constructor - messageService.streamMessage failed', ex);
		return null;
	}

	var msgContent = "";
	while (inputStream.available()) {
		msgContent = msgContent + inputStream.read(2048);
		if (msgContent.search(/\r\n\r\n|\r\r|\n\n/) > 0) {
			msgContent = msgContent.split(/\r\n\r\n.*|\r\r.*|\n\n.*/)[0] + "\r\n";
			break;
		}
		if (msgContent.length > 2048 * 8) {
			SmartTemplate4.Util.logDebug('classGetHeaders - early exit - msgContent length>16kB: ' + msgContent.length);
			return null;
		}
	}
	var headers = Components.classes["@mozilla.org/messenger/mimeheaders;1"]
	              .createInstance().QueryInterface(Components.interfaces.nsIMimeHeaders);
	headers.initialize(msgContent, msgContent.length);

	// -----------------------------------
	// Get header
	function get(header)
	{
		var str = headers.extractHeader(header, false);
		return str ? str : ""; 
	};

	// -----------------------------------
	// Public methods
	this.get = get;

	return null;
};

// -------------------------------------------------------------------
// MIME decode
// -------------------------------------------------------------------
SmartTemplate4.mimeDecoder = {
	headerParam: Components
	             .classes["@mozilla.org/network/mime-hdrparam;1"]
	             .getService(Components.interfaces.nsIMIMEHeaderParam),
	cvtUTF8 : Components
	             .classes["@mozilla.org/intl/utf8converterservice;1"]
	             .getService(Components.interfaces.nsIUTF8ConverterService),

	// -----------------------------------
	// Detect character set
	detectCharset : function(str)
	{
		let charset = "";

		if (str.search(/\x1b\$[@B]|\x1b\(J|\x1b\$\(D/gi) !== -1) { charset = "iso-2022-jp"; }   // RFC1468
		// RFC1555 ISO-8859-8 (Hebrew) is not support.
		if (str.search(/\x1b\$\)C/gi) !== -1)                    { charset = "iso-2022-kr"; }   // RFC1557
		if (str.search(/~{/gi) !== -1)                           { charset = "HZ-GB-2312"; }    // RFC1842
		if (str.search(/\x1b\$\)[AG]|\x1b\$\*H/gi) !== -1)       { charset = "iso-2022-cn"; }   // RFC1922
		// RFC1922 iso-2022-cn-ext is not support
		if (str.search(/\x1b\$\(D/gi) !== -1) 
		{
			charset = "iso-2022-jp-1";  // RFC2237
		} 
		SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.detectCharset guessed charset: ' + charset +'...');
		return charset;
	},

	// -----------------------------------
	// MIME decoding.
	decode : function (string, charset)
	{
		var decodedStr = "";

		if (/=\?/.test(string)) {
			// RFC2231/2047 encoding.
			// We need to escape the space and split by line-breaks,
			// because getParameter stops convert at the space/line-breaks.
			var array = string.split(/\s*\r\n\s*|\s*\r\s*|\s*\n\s*/g);
			for (var i = 0; i < array.length; i++) {
				decodedStr += this.headerParam
				                  .getParameter(array[i].replace(/%/g, "%%").replace(/ /g, "-%-"), null, charset, true, { value: null })
				                  .replace(/-%-/g, " ").replace(/%%/g, "%");
			}
		} 
		else {
			// for Mailers has no manners.
			if (charset === "")
				charset = this.detectCharset(string);
			var skip = charset.search(/ISO-2022|HZ-GB|UTF-7/gmi) !== -1;
			decodedStr = this.cvtUTF8.convertStringToUTF8(string, charset, skip);
		}
		return decodedStr;
	} ,

	// -----------------------------------
	// Split addresses and change encoding.
	split : function (addrstr, charset, format)
	{
		SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.split()');
		// MIME decode
		addrstr = this.decode(addrstr, charset);
		// Escape "," in mail addresses
		addrstr = addrstr.replace(/"[^"]*"/g, function(s){ return s.replace(/%/g, "%%").replace(/,/g, "-%-"); });

		var array = addrstr.split(/\s*,\s*/);
		var addresses = "";
		var withname = true;
		var withaddr = true;
		if (format.search(/^\((first)*name.*\)$/, "i") != -1)
		{ 
			withaddr = false; 
		}
		else if (format.search(/^\(mail\)$/, "i") != -1)
		{ 
			withname = false; 
		}

		for (var i = 0; i < array.length; i++) {
			if (i > 0) { 
				addresses += ", "; 
			}

			// Escape "," in mail addresses
			array[i] = array[i].replace(/\r\n|\r|\n/g, "").replace(/"[^"]*"/,
										function(s){ return s.replace(/-%-/g, ",").replace(/%%/g, "%"); });
			// name or/and address
			var address = array[i].replace(/^\s*([^<]\S+[^>])\s*$/, "<$1>").
								 replace(/^\s*(\S+)\s*\((.*)\)\s*$/, "$2 <$1>");
			var result = "";
			if (withname) {
				result = address.replace(/\s*<\S+>\s*$/, "").
								 replace(/^\s*\"|\"\s*$/g, "");	         // %to% / %to(name)%
				if (result != "" && withaddr) { 
					result += address.replace(/.*<(\S+)>.*/g, " <$1>"); 
				}     // %to%
			}
			if (result == "") {
				if (!withaddr) { 
					result = address.replace(/.*<(\S+)@\S+>.*/g, "$1");
				}     // %to(name)%
				else { 
					result = address.replace(/.*<(\S+)>.*/g, "$1"); 
				}     // %to% / %to(mail)%
			}
			// get firstname
			let delimiter = '';
			if ((delimiter = format.match(/^\(firstname(\[.*\])*\)$/i)) != null) {
				if (delimiter[1] == null) { 
					delimiter[1] = "[., ]"; 
				}
				else { 
					delimiter[1] = delimiter[1].replace(/&nbsp;/, " "); 
				}
				result = result.replace(new RegExp(delimiter[1] + ".*"), "");
			}

			addresses += result;
		}
		return addresses;
	} 
};

// -------------------------------------------------------------------
// Regularize template message
// -------------------------------------------------------------------
SmartTemplate4.regularize = function(msg, type)
{
	function getSignatureInner(removeDashes) {
		if (SmartTemplate4.signature != null) {
			SmartTemplate4.sigIsDefined = true;
			if (removeDashes) {
				if (SmartTemplate4.signature.firstChild.nodeValue == "-- ") {
					SmartTemplate4.signature.removeChild(SmartTemplate4.signature.firstChild); //remove '-- '
					SmartTemplate4.signature.removeChild(SmartTemplate4.signature.firstChild); //remove 'BR'
					return SmartTemplate4.signature.innerHTML;
				}
			} 
			else {
				return SmartTemplate4.signature.innerHTML;
			}
		}
		return "";
	}
	
	function getSubject(current) {
		if (current){
			return document.getElementById("msgSubject").value;
		} 
		else {
			return mime.decode(hdr.get("Subject"), charset);
		}
	}
	
	function getNewsgroup() {
		var acctKey = msgDbHdr.accountKey;
		//const account = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager).getAccount(acctKey);
		//dump ("acctKey:"+ acctKey);
			
		//return account.incomingServer.prettyName;
		return acctKey;
	}

	SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.regularize(' + msg +')');
	// var parent = SmartTemplate4;
	var idkey = document.getElementById("msgIdentity").value;
	var identity = Components.classes["@mozilla.org/messenger/account-manager;1"]
					 .getService(Components.interfaces.nsIMsgAccountManager)
					 .getIdentity(idkey);
	let messenger = Components.classes["@mozilla.org/messenger;1"]
					 .createInstance(Components.interfaces.nsIMessenger);
	let mime = this.mimeDecoder;
	
	let msgDbHdr = (type != "new") ? messenger.msgHdrFromURI(gMsgCompose.originalMsgURI) : null;
	let charset = (type != "new") ? msgDbHdr.Charset : null;
	let hdr = (type != "new") ? new this.classGetHeaders(gMsgCompose.originalMsgURI) : null;
	let date = (type != "new") ? msgDbHdr.date : null;
	if (type != "new") {
		// for Reply/Forward message
		let tz = new function(date) {
			this.str = ("+0000" + date).replace(/.*([+-][0-9]{4,4})/, "$1");
			this.h = this.str.replace(/(.).*/, "$11") * (this.str.substr(1,1) * 10 + this.str.substr(2,1) * 1);
			this.m = this.str.replace(/(.).*/, "$11") * (this.str.substr(3,1) * 10 + this.str.substr(4,1) * 1);
		} (hdr.get("Date"));
	}
	// rw2h["reserved word"] = "header"
	var rw2h = new Array();
	
	// reduce "{" and "}"
	msg = function(string) {
		function setRw2h() {        // setRw2h("header", "reserved word",,,)
			for(var i = 1; i < arguments.length; i++) { 
				rw2h[arguments[i]] = arguments[0]; 
			}
		}
		// Check existence of a header related to the reserved word.
		function chkRw(str, reservedWord, param) {
			try{
				SmartTemplate4.Util.logDebugOptional('regularize','regularize.chkRw(' + str + ', ' +  reservedWord + ', ' + param + ')');
				let el = (typeof rw2h[reservedWord]=='undefined') ? '' : rw2h[reservedWord];
				return el == "d.c." 
					? str 
					: hdr.get(el ? el : reservedWord) != "" ? str : "";
			} catch (e) {
				let strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
					 getService(Components.interfaces.nsIStringBundleService);
				let bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/errors.properties");
				let ErrorString1 = '';
				let ErrorString2 = '';
				try{ 
					//try writing an error to the Error Console using the localized string; if it fails write it in English
					ErrorString1 = bundle.GetStringFromName("contextError1");
					ErrorString2 = bundle.GetStringFromName("contextError2");
				} catch (e) {
					ErrorString1 = bundle.GetStringFromName("SmartTemplate4: The variable");
					ErrorString2 = bundle.GetStringFromName("can't be used for NEW Messages!\nListing of usable variables see Help");
				}
				let errorText = ErrorString1 + " %" + reservedWord + "% " + ErrorString2;
				alert(errorText)
				Components.utils.reportError(errorText);
				
				return "";
			} 
		}
		
		function chkRws(str, strInBrackets) { 
			return strInBrackets.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw).replace(/^[^%]*$/, ""); 
		}
		
		// Reserved words that do not depend on the original message.
		setRw2h("d.c.", "ownname", "ownmail",
						"Y", "m", "n", "d", "e", "H", "k", "I", "l", "M", "S", "T", "X", "A", "a", "B", "b", "p",
						"X:=today", "dbg1", "datelocal", "dateshort", "date_tz", "tz_name", "sig", "newsgroup");
		
		// Reserved words which depend on headers of the original message.
		setRw2h("To",   "to", "toname", "tomail");
		setRw2h("Cc",   "cc", "ccname", "ccmail");
		setRw2h("Date", "X:=sent");
		setRw2h("From", "from", "fromname", "frommail");
		setRw2h("Subject", "subject");
		
		string = string.replace(/{([^{}]+)}/gm, chkRws);
		return string.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw);
	} (msg);

	// Convert PRTime to string
	function prTime2Str(time, type, timezone) {
			
		var tm = new Date();
		var fmt = Components.classes["@mozilla.org/intl/scriptabledateformat;1"].
					createInstance(Components.interfaces.nsIScriptableDateFormat);
		var locale = SmartTemplate4.pref.getLocalePref();
		
		// Set Time
		tm.setTime(time / 1000 + (timezone) * 60 * 1000);
		
		// Format date string
		switch (type) {
			case "datelocal":
				var dateFormat = fmt.dateFormatLong;  var timeFormat = fmt.timeFormatSeconds;
				break;
			case "dateshort":
				default:
			var dateFormat = fmt.dateFormatShort; var timeFormat = fmt.timeFormatSeconds;
				break;
		}
		
		return fmt.FormatDateTime("", dateFormat, timeFormat,
								  tm.getFullYear(), tm.getMonth() + 1, tm.getDate(),
								  tm.getHours(), tm.getMinutes(), tm.getSeconds());
	}
		
	// Replace reserved words
	function replaceReservedWords(dmy, token, f)
	{
		var tm = new Date();
		var d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); }
		var expand = function(str) { return str.replace(/%([\w-]+)%/gm, replaceReservedWords); }
		var cal = SmartTemplate4.cal;

		// Set %A-Za-z% to time of original message was sent.
		if (SmartTemplate4.whatIsX == SmartTemplate4.XisSent)
		{
			tm.setTime(date / 1000);
		}

		// for backward compatibility
		switch (token) {
			case "fromname":  token = "From"; f = "(name)";   break;
			case "frommail":  token = "From"; f = "(mail)";   break;
			case "toname":    token = "To";   f = "(name)";   break;
			case "tomail":    token = "To";   f = "(mail)";   break;
			case "ccname":    token = "Cc";   f = "(name)";   break;
			case "ccmail":    token = "Cc";   f = "(mail)";   break;
		}


		switch(token){
			case "datelocal":
			case "dateshort":
				if (SmartTemplate4.whatIsX == SmartTemplate4.XisToday){
					token = prTime2Str(tm.getTime() * 1000, token, 0);
					return SmartTemplate4.escapeHtml(token);
				}else{
					token = prTime2Str(date, token, 0);
					return SmartTemplate4.escapeHtml(token);
				}
			case "timezone":    
			case "date_tz":
					var matches = tm.toString().match(/([+-][0-9]{4})/);
					return SmartTemplate4.escapeHtml(matches[0]);
		}
		
		switch (token) {
			// for Common (new/reply/forward) message
			case "ownname": // own name
				token = identity.identityName.replace(/\s*<.*/, "");
				break;
			case "ownmail": // own email address
				token = identity.email;
				break;
			case "T": // today
			case "X": return expand("%H%:%M%:%S%");           break;  // Time hh:mm:ss
			case "Y": return "" + tm.getFullYear();           break;  // Year 1970...
			case "n": return "" + (tm.getMonth()+1);          break;  // Month 1..12
			case "m": return d02(tm.getMonth()+1);            break;  // Month 01..12
			case "e": return "" + tm.getDate();           break;  // Day of month 1..31
			case "d": return d02(tm.getDate());           break;  // Day of month 01..31
			case "k": return "" + tm.getHours();          break;  // Hour 0..23
			case "H": return d02(tm.getHours());          break;  // Hour 00..23
			case "l": return "" + (((tm.getHours() + 23) % 12) + 1);  break;  // Hour 1..12
			case "I": return d02(((tm.getHours() + 23) % 12) + 1);    break;  // Hour 01..12
			case "M": return d02(tm.getMinutes());            break;  // Minutes 00..59
			case "S": return d02(tm.getSeconds());            break;  // Seconds 00..59
			case "tz_name":    return tm.toString().replace(/^.*\(|\)$/g, "");    break; //time zone name
			case "sig":
				switch(f) {
					case "(1)": return getSignatureInner(false); break;
					case "(2)": return getSignatureInner(true);  break;
					default:    return getSignatureInner(false); break;
				}
				break;
			case "subject":
				switch(f) {
					case "(1)": return getSubject(false);   break;
					case "(2)": return getSubject(true);    break;
					default:    return getSubject(false);   break;
				}
				break;
			case "newsgroup": return getNewsgroup();  break;  
			// name of day and month
			case "A":
				return cal.dayName(tm.getDay());        break;  // locale day of week
			case "a":
				return cal.shortDayName(tm.getDay());       break;  // locale day of week(short)
			case "B":
				return cal.monthName(tm.getMonth());        break;  // locale month
			case "b":
				return cal.shortMonthName(tm.getMonth());   break;  // locale month(short)
			case "p":
			switch (f) {
				case "(1)": 
					return tm.getHours() < 12 ? "a.m." : "p.m."; // locale am or pm
				case "(2)":
					return tm.getHours() < 12 ? "A.M." : "P.M."; // locale am or pm
				case "(3)":
				default:
					return tm.getHours() < 12 ? "AM" : "PM";     // locale am or pm
			}
			break;
			case "dbg1":  return cal.list();
				break;
			// Change time of %A-Za-z%
			case "X:=sent":
				SmartTemplate4.whatIsX = SmartTemplate4.XisSent;
				return "";
			case "X:=today":
				SmartTemplate4.whatIsX = SmartTemplate4.XisToday;
				return "";

		// any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
			default:
				var isStripQuote = RegExp(" " + token + " ", "i").test(
				                   " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
				                   " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To ");
				if (isStripQuote) {
					token = mime.split(hdr.get(token), charset, f); 
				}
				else { 
					token = mime.decode(hdr.get(token), charset); 
				}
				break;
				// unreachable code! =>
				// token = token.replace(/\r\n|\r|\n/g, ""); //remove line breaks from 'other headers'
		}
		return SmartTemplate4.escapeHtml(token);
	}
	msg = msg.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, replaceReservedWords);
	return msg;
};





