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
// this class uses 2 "global" variables:
// 1. branch = smartTemplate4  the branch from the preferences
SmartTemplate4.classPref = function()
{


	// -----------------------------------
	// Constructor
	var root = Components.classes["@mozilla.org/preferences-service;1"]
	           .getService(Components.interfaces.nsIPrefBranch);

	// -----------------------------------
	// get preference
	// returns default value if preference cannot be found.
	function getCom(prefstring, defaultValue)
	{
		try {
			switch (root.getPrefType(prefstring)) {
				case Components.interfaces.nsIPrefBranch.PREF_STRING:
					return root.getComplexValue(prefstring, Components.interfaces.nsISupportsString).data;
				case Components.interfaces.nsIPrefBranch.PREF_INT:
					return root.getIntPref(prefstring);
				case Components.interfaces.nsIPrefBranch.PREF_BOOL:
					return root.getBoolPref(prefstring);
				default:
					break;
			}
			return defaultValue;
		}
		catch(ex) {
			return defaultValue;
		}
	};

	// -----------------------------------
	// get preference(branch)
	function getWithBranch(prefstring, defaultValue)
	{
		return getCom(SmartTemplate4.Preferences.Prefix + prefstring, defaultValue); //
	};

	// idKey Account
	// composeType: rsp, fwd, new
	// def: true = common
	function isDeleteHeaders(idKey, composeType, def) {
		// xxxhead
		return getWithIdkey(idKey, composeType + "head", def)
	};

	function isReplaceNewLines(idKey, composeType, def) {
		// xxxnbr
		return getWithIdkey(idKey, composeType + "nbr", def)
	};

	function isUseHtml(idKey, composeType, def) {
		// xxxhtml
		return getWithIdkey(idKey, composeType + "html", def)
	};

	function getTemplate(idKey, composeType, def) {
		return getWithIdkey(idKey, composeType + "msg", def)
	};

	function isProcessingActive(idKey, composeType, def) {
		return getWithIdkey(idKey, composeType, def)
	};



	// -----------------------------------
	// Get preference with identity key
	function getWithIdkey(idkey, pref, def)
	{
		// extensions.smarttemplate.id8.def means account id8 uses common values.
		if (getWithBranch(idkey + ".def", true)) { // "extensions.smartTemplate4." + "id12.def"
		  // common preference - test with .common!!!!
			return getWithBranch("common." + pref, def);
		}
		else {
		  // Account specific preference
		  return getWithBranch(idkey + "." + pref, def);
		}
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
			let locale = /^[^\s,;]{2,}/.exec(accept_languages)[0];  // Extract first locale code in pref (space/comma/semicolon delimited list)
			SmartTemplate4.Util.logDebug('getLocale() returns: ' + locale);
			return locale;
		}
		catch (ex) {
			SmartTemplate4.Util.logException('getLocale() failed and defaulted to [en]', ex);
			return "en";
		}
	};

	// -----------------------------------
	// Public methods
	this.getCom = getCom;
	this.getLocalePref = getLocalePref;
	this.getTemplate = getTemplate;
	this.getWithBranch = getWithBranch;
	this.getWithIdkey = getWithIdkey;
	this.isDeleteHeaders = isDeleteHeaders;
	this.isProcessingActive = isProcessingActive;
	this.isReplaceNewLines = isReplaceNewLines;
	this.isUseHtml = isUseHtml;

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
		try {
			SmartTemplate4.Util.logDebugOptional('regularize','getSignatureInner(' + removeDashes + ')');
			if (SmartTemplate4.signature != null) {
				let sig = SmartTemplate4.signature;
				SmartTemplate4.sigIsDefined = true;
				if (!sig.children || sig.children.length==0) {
					SmartTemplate4.Util.logDebugOptional('regularize','getSignatureInner(): signature has no child relements.');

					return sig.innerHTML ? sig.innerHTML : sig.outerHTML;  // deal with DOM String sig (non html)
				}
				if (removeDashes) {
					if (sig.firstChild.nodeValue == "-- ") {
						sig.removeChild(sig.firstChild); //remove '-- '
						sig.removeChild(sig.firstChild); //remove 'BR'
						return sig.innerHTML;
					}
				}
				else {
					return sig.innerHTML;
				}
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logException('regularize.getSignatureInner() failed', ex);
		}
		return "";
	}

	function getSubject(current) {
		SmartTemplate4.Util.logDebugOptional('regularize', 'getSubject(' + current + ')');
		if (current){
			return document.getElementById("msgSubject").value;
		}
		else {
			return mime.decode(hdr.get("Subject"), charset);
		}
	}

	function getNewsgroup() {
		SmartTemplate4.Util.logDebugOptional('regularize', 'getNewsgroup()');
		var acctKey = msgDbHdr.accountKey;
		//const account = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager).getAccount(acctKey);
		//dump ("acctKey:"+ acctKey);

		//return account.incomingServer.prettyName;
		return acctKey;
	}

	// AG: I think this function is designed to break out a more specialized variable
	// such as %toname()% to a simpler one, like %To%
	function simplify(aString) {
		// building a hash table?
		// setRw2h("header", "reserved word",,,)
		function setRw2h() {
			for(var i = 1; i < arguments.length; i++) {
				rw2h[arguments[i]] = arguments[0];
			}
		}
		// Check existence of a header related to the reserved word.
		function chkRw(str, reservedWord, param) {
			try{
				SmartTemplate4.Util.logDebugOptional('regularize','regularize.chkRw(' + str + ', ' +  reservedWord + ', ' + param + ')');
				let el = (typeof rw2h[reservedWord]=='undefined') ? '' : rw2h[reservedWord];
				let s = (el == "d.c.")
					? str
					: hdr.get(el ? el : reservedWord) != "" ? str : "";
				return s;
			} catch (ex) {

				SmartTemplate4.Util.displayNotAllowedMessage(reservedWord);
				return "";
			}
		}

		function chkRws(str, strInBrackets) {
			// I think this first step is just replacing special functions with general ones.
			// E.g.: %tomail%(z) = %To%(z)
			let generalFunction = strInBrackets.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw);
			// next: ?????
			return  generalFunction.replace(/^[^%]*$/, "");
		}

		SmartTemplate4.Util.logDebugOptional('regularize', 'simplify()');

		// Reserved words that do not depend on the original message.
		setRw2h("d.c.", "ownname", "ownmail",
						"Y", "m", "n", "d", "e", "H", "k", "I", "l", "M", "S", "T", "X", "A", "a", "B", "b", "p",
						"X:=today", "dbg1", "datelocal", "dateshort", "date_tz", "tz_name", "sig", "newsgroup", "cwIso");

		// Reserved words which depend on headers of the original message.
		setRw2h("To",   "to", "toname", "tomail");
		setRw2h("Cc",   "cc", "ccname", "ccmail");
		setRw2h("Date", "X:=sent");
		setRw2h("From", "from", "fromname", "frommail");
		setRw2h("Subject", "subject");

		// [AG] First Step: use the chkRws function to process any "broken out" parts that are embedded in {  .. } pairs
		// aString = aString.replace(/{([^{}]+)}/gm, chkRws);
		aString = aString.replace(/\[\[([^\[\]]+)\]\]/gm, chkRws);

		// [AG] Second Step: use chkRw to categorize reserved words (variables) into one of the 6 classes: d.c., To, Cc, Date, From, Subject
		return aString.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw);
	}

	SmartTemplate4.Util.logDebugOptional('regularize','SmartTemplate4.regularize(' + msg +')  STARTS...');
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

	// AG: remove any parts ---in curly brackets-- (replace with  [[  ]] ) optional lines
	msg = simplify(msg);

	// Convert PRTime to string
	function prTime2Str(time, timeType, timezone) {
		SmartTemplate4.Util.logDebugOptional('regularize','prTime2Str(' + time + ', ' + timeType + ', ' + timezone + ')');

		try {
			let tm = new Date();
			let fmt = Components.classes["@mozilla.org/intl/scriptabledateformat;1"].
						createInstance(Components.interfaces.nsIScriptableDateFormat);
			let locale = SmartTemplate4.pref.getLocalePref();

			// Set Time
			tm.setTime(time / 1000 + (timezone) * 60 * 1000);

			// Format date string
			let dateFormat = null;
			let timeFormat = null;
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

			let timeString = fmt.FormatDateTime("",
			                                    dateFormat, timeFormat,
			                                    tm.getFullYear(), tm.getMonth() + 1, tm.getDate(),
			                                    tm.getHours(), tm.getMinutes(), tm.getSeconds());
			return timeString;
		}
		catch (ex) {
			SmartTemplate4.Util.logException('regularize.prTime2Str() failed', ex);
		}
		return '';
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

		try {
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
				// for Common (new/reply/forward) message
				case "ownname": // own name
					token = identity.identityName.replace(/\s*<.*/, "");
					break;
				case "ownmail": // own email address
					token = identity.email;
					break;
				case "T": // today
				case "X":                               // Time hh:mm:ss
					return expand("%H%:%M%:%S%");
				case "Y":                               // Year 1970...
					return "" + tm.getFullYear();
				case "n":                               // Month 1..12
					return "" + (tm.getMonth()+1);
				case "m":                               // Month 01..12
					return d02(tm.getMonth()+1);
				case "e":                               // Day of month 1..31
					return "" + tm.getDate();
				case "d":                               // Day of month 01..31
					return d02(tm.getDate());
				case "k":                               // Hour 0..23
					return "" + tm.getHours();
				case "H":                               // Hour 00..23
					return d02(tm.getHours());
				case "l":                               // Hour 1..12
					return "" + (((tm.getHours() + 23) % 12) + 1);
				case "I":                               // Hour 01..12
					return d02(((tm.getHours() + 23) % 12) + 1);
				case "M":                               // Minutes 00..59
					return d02(tm.getMinutes());
				case "S":                               // Seconds 00..59
					return d02(tm.getSeconds());
				case "tz_name":                         // time zone name
					return tm.toString().replace(/^.*\(|\)$/g, "");
				case "sig":
					let removeDashes = (f=="(2)");
					let ret = getSignatureInner(removeDashes)
					return ret;
				case "subject":
					let current = (f=="(2)");
					ret = getSubject(current);
					return ret;
				case "newsgroup":
					return getNewsgroup();
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
				case "dbg1":
					return cal.list();
				case "cwIso": // ISO calendar week [Bug 25012]
					let offset = parseInt(f.substr(1,1)); // (0) .. (6) weekoffset: 0-Sunday 1-Monday
					return "" + SmartTemplate4.Util.getIsoWeek(tm, offset);
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
		}
		catch(ex) {
			SmartTemplate4.Util.logException('replaceReservedWords(dmy, ' + token + ', ' + f +') failed ', ex);
			token="??";
		}
		return SmartTemplate4.escapeHtml(token);
	}
	msg = msg.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, replaceReservedWords);
	SmartTemplate4.Util.logDebugOptional('regularize','SmartTemplate4.regularize(' + msg +')  ...ENDS');
	return msg;
};





