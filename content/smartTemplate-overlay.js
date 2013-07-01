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
					return root.getComplexValue(prefstring, Components.interfaces.nsIPrefLocalizedString).data;
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
	// "Disable default quote header"
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
		return getWithIdkey(idKey, composeType + "msg", def);
	};

	function getQuoteHeader(idKey, composeType, def) {
		return getWithIdkey(idKey, composeType + "header", def);
	};

	function isProcessingActive(idKey, composeType, def) {
		return getWithIdkey(idKey, composeType, def);
	};

	// whether an Identity uses the common account
	function isCommon(idkey) {
		return getWithBranch(idkey + ".def", true);
	};
	

	// -----------------------------------
	// Get preference with identity key
	function getWithIdkey(idkey, pref, def)
	{
	  // fix problems in draft mode...
	  if (!pref) 
			return ""; // draft etc.
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
			let localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"]
			                    .getService(Components.interfaces.nsILocaleService);
			let locale = localeService.getLocaleComponentForUserAgent();

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
	this.getQuoteHeader = getQuoteHeader;
	this.getWithBranch = getWithBranch;
	this.getWithIdkey = getWithIdkey;
	this.isCommon = isCommon;
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

  SmartTemplate4.Util.logDebugOptional('functions','classGetHeaders(' + messageURI + ')');
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
	SmartTemplate4.Util.logDebugOptional('mime','allHeaders: \n' +  headers.allHeaders);

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
	// jcranmer: this is really impossigblebased on such short fields
	// see also: hg.mozilla.org/users/Pidgeot18_gmail.com/patch-queues/file/cd19874b48f8/patches-newmime/parser-charsets
	//           http://encoding.spec.whatwg.org/#interface-textdecoder
	//           
	detectCharset : function(str)
	{
		let charset = "";

		if (str.search(/\x1b\$[@B]|\x1b\(J|\x1b\$\(D/gi) !== -1) { charset = "iso-2022-jp"; }   // RFC1468 (Japanese)
		                                                         // not supported                  RFC1555 ISO-8859-8 (Hebrew)
		if (str.search(/\x1b\$\)C/gi) !== -1)                    { charset = "iso-2022-kr"; }   // RFC1557 (Korean)
		if (str.search(/~{/gi) !== -1)                           { charset = "HZ-GB-2312"; }    // RFC1842 (Chinese ASCII)
		if (str.search(/\x1b\$\)[AG]|\x1b\$\*H/gi) !== -1)       { charset = "iso-2022-cn"; }   // RFC1922 (Chinese)
		                                                         // not supported                  RFC1922 iso-2022-cn-ext (Chinese extended)
		if (str.search(/\x1b\$\(D/gi) !== -1)
		                                                         {charset = "iso-2022-jp-1"; }  // RFC2237 (Japanese 1)
		if (!charset) charset =  SmartTemplate4.Preferences.getMyStringPref ('defaultCharset');
		SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.detectCharset guessed charset: ' + charset +'...');
		return charset;
	},

	// -----------------------------------
	// MIME decoding.
	decode : function (theString, charset)
	{
		var decodedStr = "";

		try {
			if (/=\?/.test(theString)) {
				// RFC2231/2047 encoding.
				// We need to escape the space and split by line-breaks,
				// because getParameter stops convert at the space/line-breaks.
				var array = theString.split(/\s*\r\n\s*|\s*\r\s*|\s*\n\s*/g);
				for (var i = 0; i < array.length; i++) {
					decodedStr += this.headerParam
					                  .getParameter(array[i].replace(/%/g, "%%").replace(/ /g, "-%-"), null, charset, true, { value: null })
					                  .replace(/-%-/g, " ").replace(/%%/g, "%");
				}
			}
			else {
				// for Mailers who have no manners.
				if (charset === "")
					charset = this.detectCharset(theString);
				var skip = charset.search(/ISO-2022|HZ-GB|UTF-7/gmi) !== -1;
				// this will always fail if theString is not an ACString?
				decodedStr = this.cvtUTF8.convertStringToUTF8(theString, charset, skip);
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.decode(' + theString + ') failed with charset: ' + charset
			    + '...\n' + ex);
			return theString;
		}
		return decodedStr;
	} ,

	// -----------------------------------
	// Split addresses and change encoding.
	split : function (addrstr, charset, format)
	{
	  // jcranmer: you want to use parseHeadersWithArray
		// jcranmer: that gives you three arrays
	  //  jcranmer: the first is an array of strings "a@b.com", "b@b.com", etc.
		//  jcranmer: the second is an array of the display names, I think fully unquoted
    //  jcranmer: the third is an array of strings "Hello <a@b.com>"
		//            preserveIntegrity is used, so someone with the string "Dole, Bob" will have that be quoted I think
		//            if you don't want that, you'd have to pass to unquotePhraseOrAddrWString(value, false)
		//            oh, and you *don't* need to decode first, though you might want to
		// see also: https://bugzilla.mozilla.org/show_bug.cgi?id=858337
		//           hg.mozilla.org/users/Pidgeot18_gmail.com/patch-queues/file/587dc0232d8a/patches-newmime/parser-tokens#l78
		// use https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIMsgDBHdr
		// mime2DecodedAuthor, mime2DecodedSubject, mime2DecodedRecipients!
	  function getEmailAddress(a) {
			return a.replace(/.*<(\S+)>.*/g, "$1");
		}
		function isMail(format) { return (format.search(/^\(mail[\),]/, "i") != -1);};
		function isName(format) { return (format.search(/^\((first)*name[,\)]/, "i") != -1);};
		function isLink(format) { return SmartTemplate4.Util.isFormatLink(format);  /* this = regularize? */ };
		function isFirstName(format) { return (format.search(/^\(firstname[,\)]/, "i") != -1);};
		function isLastName(format) { return (format.search(/^\(lastname[,\)]/, "i") != -1);};
		
		SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.split()');
		// MIME decode
		addrstr = this.decode(addrstr, charset);
		// Escape "," in mail addresses
		addrstr = addrstr.replace(/"[^"]*"/g, function(s){ return s.replace(/%/g, "%%").replace(/,/g, "-%-"); });

		let array = addrstr.split(/\s*,\s*/);
		let addresses = "";
		let showName = false;
		let showMailAddress = false;
		let showLink = false;
		let suppressLink = false;
		// difficult logic for format here... [makes it hard to extend format]
		// possible values for format are:
		// name
		// firstname
		// mail
		// => new: link -- e.g. %to(mail,link)%
		showName = isName(format);
		showMailAddress = isMail(format);
		showLink = isLink(format); 
		// restore old behavior:
		if (format == '') {
			showName = true;
			showMailAddress = true;
		}

		for (var i = 0; i < array.length; i++) {
			if (i > 0) {
				addresses += ", ";
			}

			// Escape "," in mail addresses
			array[i] = array[i].replace(/\r\n|\r|\n/g, "")
			                   .replace(/"[^"]*"/,
			                   function(s){ return s.replace(/-%-/g, ",").replace(/%%/g, "%"); });
			// name or/and address
			var address = array[i].replace(/^\s*([^<]\S+[^>])\s*$/, "<$1>").replace(/^\s*(\S+)\s*\((.*)\)\s*$/, "$2 <$1>");
			var result = "";
			
			if (showName) {
				// this cuts off the angle-bracket adress part: <foo@bar.com>
				result = address.replace(/\s*<\S+>\s*$/, "")
					              .replace(/^\s*\"|\"\s*$/g, "");  // %to% / %to(name)%
				if (result != "" && (showMailAddress)) {
					result += address.replace(/.*<(\S+)>.*/g, " <$1>");
				}     // %to%
			}
			if (result == "") {
				if (!showMailAddress) {
					result = address.replace(/.*<(\S+)@\S+>.*/g, "$1");
				}  // %to(name)%
				else {
					result = getEmailAddress(address); // email part
					// suppress linkifying!
					if (!showName) 
					  suppressLink = true;
				}     // %to% / %to(mail)%
			}
			// swap last, first
			let nameProcessed = false;
			if (isName(format) &&  SmartTemplate4.Preferences.getMyBoolPref('firstLastSwap')) 
			{
			  // => add special test for x, y (name) pattern!
				// use this for the name and firstname case (but not for lastname)
				let regex = /\(([^)]+)\)/;
				let nameRes = regex.exec(result);
				if (nameRes 
				    && 
						nameRes.length > 1
						&&
						!isLastName(format)) {
					nameProcessed = true;
					result = nameRes[1];  // name or firstname will fetch the (Name) from brackets!
				}
				else {
					let iComma =  result.indexOf(', ');
					if (iComma>0) {
						let first = result.substr(iComma + 2);
						let last = result.substr(0, iComma);
						result = first + ' ' + last; // simple solution
					}
				}
			}
			
			if (!nameProcessed) {
				// get firstname  (result should hold name)
				let delimiter = '';
				if ((delimiter = format.match(/^\(firstname(\[.*\])*[,\)]/i)) != null) {  // [optional] second param is delimiter
					if (delimiter[1] == null) {
						delimiter[1] = "[., ]";
					}
					else {
						// this simply replaces , or . with a white space
						delimiter[1] = delimiter[1].replace(/&nbsp;/, " ");
					}
					// truncate after delimiter => first name
					result = result.replace(new RegExp(delimiter[1] + ".*"), "");
				}
			}

			if (showLink) {
				result = "<a href=mailto:" + getEmailAddress(address) + ">" + result + "</a>";
			}
			if (suppressLink) {
				result = "<a>" + result + "</a>"; // anchor without href supresses linkifying
			}
			
			addresses += result;
		}
		return addresses;
	} // split
};

SmartTemplate4.parseModifier = function(msg) {
  function unquotedRegex(s, global) {
		let quoteLess = s.substring(1, s.length-1);
	  if (global)
			return new RegExp( quoteLess, 'ig');
		return quoteLess;
	}
	// make 2 arrays, words to delete and replacement pairs.
	let matches = msg.match(/%deleteText\(.*\)%/g);
	let matchesR = msg.match(/%replaceText\(.*\)%/g);
	if (matches) {
		for (let i=0; i<matches.length; i++) {
			// parse out the argument (string to delete)
			msg = msg.replace(matches[i],'');
			let dText = matches[i].match(   /(\"[^)].*\")/   ); // get argument (includes quotation marks)
			if (dText) {
				msg = msg.replace(unquotedRegex(dText[0], true), "");
			}
		}
	}
	if (matchesR) {
		for (let i=0; i<matchesR.length; i++) {
			// parse out the argument (string to delete)
			msg = msg.replace(matchesR[i],'');
			let dText = matchesR[i].match(   /\"[^)].*\"/   ); // get 2 arguments (includes quotation marks) "Replace", "With" => double quotes inside are not allowed.
			if (dText) {
				msg = msg.replace(unquotedRegex(dText[0], true), unquotedRegex(dText[1]));
			}
		}
	}
	return msg;
}
	
// -------------------------------------------------------------------
// Regularize template message
// -------------------------------------------------------------------
SmartTemplate4.regularize = function(msg, type, isStationery)
{
	function getSubject(current) {
		SmartTemplate4.Util.logDebugOptional('regularize', 'getSubject(' + current + ')');
		let subject = '';
		if (current){
			subject = document.getElementById("msgSubject").value;
			return SmartTemplate4.escapeHtml(subject); //escapeHtml for non UTF8 chars in %subject% but this don't work in this place for the whole subject, only on %subject(2)%
		}
		else {
			subject = mime.decode(hdr.get("Subject"), charset);
			return subject;
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
				rw2h[arguments[i]] = arguments[0]; // set the type of each token: d.c., To, Cc, Date, From, Subject
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
				if (!el)
					SmartTemplate4.Util.logDebug('Removing unknown variable: %' +  reservedWord + '%');
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
		// identity(name) is the new ownname
		// identity(mail) is the new ownmail
		setRw2h("d.c.", "ownname", "ownmail", "deleteText", "replaceText",
						"Y", "y", "m", "n", "d", "e", "H", "k", "I", "l", "M", "S", "T", "X", "A", "a", "B", "b", "p",
						"X:=today", "dbg1", "datelocal", "dateshort", "date_tz", "tz_name", "sig", "newsgroup", "cwIso", "cursor", "identity", "quotePlaceholder");

		// Reserved words which depend on headers of the original message.
		setRw2h("To", "to", "toname", "tomail");
		setRw2h("Cc", "cc", "ccname", "ccmail");
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
	// try falling back to folder charset:
	if (!charset && msgDbHdr) {
		msgDbHdr.folder.charset; 
	}
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

			let timeString = fmt.FormatDateTime(locale,
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

	function zoneFromShort(short) {
		var timezones = {
			"ACDT" : "Australian Central Daylight Time",
			"ACST" : "Australian Central Standard Time",
			"ACT"	 : "ASEAN Common Time",
			"ADT"	 : "Atlantic Daylight Time",
			"AEDT" : "Australian Eastern Daylight Time",
			"AEST" : "Australian Eastern Standard Time",
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
			"SYOT"	 : "Showa Station Time",
			"TAHT"	 : "Tahiti Time",
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
	}

	function getTimeZoneAbbrev(tm, isLongForm) {
		// return tm.toString().replace(/^.*\(|\)$/g, ""); HARAKIRIs version, not working.
		// get part between parentheses
		// e.g. "(GMT Daylight Time)"
		let timeString =  tm.toTimeString();
		let timeZone = timeString.match(/\(.*?\)/);
		let retVal = '';
		if (timeZone && timeZone.length>0) {
			let words = timeZone[0].substr(1).split(' ');
			for (let i=0; i<words.length; i++) {
				if (isLongForm) {
					retVal += ' ' + words[i];
				}
				else {
					if (words[i].length == 3 && words[i].match('[A-Z]{3}')
					    ||
					    words[i].length == 4 && words[i].match('[A-Z]{4}'))
						retVal += words[i] + ' ';  // abbrev contained
					else
						retVal+=words[i][0];  // first letter
				}
			}
			if (isLongForm) {
				retVal = retVal.substr(1, retVal.length - 2) ; // cut off trailing parens
			}
		}
		else {
			retVal = timeString.match('[A-Z]{4}');
			if (!retVal)
				retVal = timeString.match('[A-Z]{3}');
			// convert to long form by using hard-coded time zones array.
			SmartTemplate4.Util.logDebug('Cannot determine timezone string - Missed parentheses - from:\n' + timeString + ' regexp guesses: ' + retVal);
			if (isLongForm) {
				retVal = zoneFromShort(retVal);
			}
		}
		return retVal;
	}
	
	// Replace reserved words
	function replaceReservedWords(dmy, token, arg)
	{
	  // calling this function just for logging purposes
		function finalize(tok, s, comment) {
			if (s) {
				let text = "replaceReservedWords( %" + tok + "% ) = " + s;
				if (comment) {
					text += '\n' + comment;
				}
				SmartTemplate4.Util.logDebugOptional ('replaceReservedWords', text);
			};
			return s;
		}
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
				case "fromname":  token = "From"; arg = "(name)";   break;
				case "frommail":  token = "From"; arg = "(mail)";   break;
				case "toname":    token = "To";   arg = "(name)";   break;
				case "tomail":    token = "To";   arg = "(mail)";   break;
				case "ccname":    token = "Cc";   arg = "(name)";   break;
				case "ccmail":    token = "Cc";   arg = "(mail)";   break;
			}


			switch(token){
				case "deleteText": // return unchanged
					return '%' + token + arg + '%';
				case "replaceText": // return unchanged
					return '%' + token + arg + '%';
				case "datelocal":
				case "dateshort":
					if (SmartTemplate4.whatIsX == SmartTemplate4.XisToday) {
						token = prTime2Str(tm.getTime() * 1000, token, 0);
						return finalize(token, SmartTemplate4.escapeHtml(token));
					}
					else {
						token = prTime2Str(date, token, 0);
						return finalize(token, SmartTemplate4.escapeHtml(token));
					}
				case "timezone":
				case "date_tz":
						var matches = tm.toString().match(/([+-][0-9]{4})/);
						return finalize(token, SmartTemplate4.escapeHtml(matches[0]));
				// for Common (new/reply/forward) message
				case "ownname": // own name
					token = identity.identityName.replace(/\s*<.*/, "");
					break;
				case "ownmail": // own email address
					token = identity.email;
					break;
				case "quoteHeader":  // currently only useful when put into a Stationery template.
				  return "";
				case "quotePlaceholder":  // currently only useful when put into a Stationery template.
				  return   "<span stationery=\"content-placeholder\">"
					       +   "<blockquote type=\"cite\"> ... "
								 +   "</blockquote>"
							   + "</span>";
				  break;
				case "identity":
				  /////
					let fullId = identity.fullName + ' <' + identity.email + '>';
					// we need the split to support (name,link) etc.
					token = mime.split(fullId, charset, arg);
					// allow html as to(link) etc. builds a href with mailto
					if (arg && SmartTemplate4.Util.isFormatLink(arg) || arg=='(mail)') 
						return token;
					break;
				case "T": // today
				case "X":                               // Time hh:mm:ss
					return finalize(token, expand("%H%:%M%:%S%"));
				case "y":                               // Year 13... (2digits)
				  let year = tm.getFullYear().toString();
					return finalize(token, "" + year.slice(year.length-2), "tm.getFullYear.slice(-2)");
				case "Y":                               // Year 1970...
					return finalize(token, "" + tm.getFullYear(), "tm.getFullYear");
				case "n":                               // Month 1..12
					return finalize(token, "" + (tm.getMonth()+1), "tm.getMonth()+1");
				case "m":                               // Month 01..12
					return finalize(token, d02(tm.getMonth()+1), "d02(tm.getMonth()+1)");
				case "e":                               // Day of month 1..31
					return finalize(token, "" + tm.getDate(), "tm.getDate()");
				case "d":                               // Day of month 01..31
					return finalize(token, d02(tm.getDate()), "d02(tm.getMonth()+1)");
				case "k":                               // Hour 0..23
					return finalize(token, "" + tm.getHours(), "tm.getHours()");
				case "H":                               // Hour 00..23
					return finalize(token, d02(tm.getHours()), "d02(tm.getHours()");
				case "l":                               // Hour 1..12
					return finalize(token, "" + (((tm.getHours() + 23) % 12) + 1));
				case "I":                               // Hour 01..12
					return finalize(token, d02(((tm.getHours() + 23) % 12) + 1));
				case "M":                               // Minutes 00..59
					return finalize(token, d02(tm.getMinutes()), "d02(tm.getMinutes())");
				case "S":                               // Seconds 00..59
					return finalize(token, d02(tm.getSeconds()), "d02(tm.getSeconds())");
				case "tz_name":                         // time zone name (abbreviated) tz_name(1) = long form
					return finalize(token, getTimeZoneAbbrev(tm, (arg=="(1)")), "getTimeZoneAbbrev(tm, " + (arg=="(1)") + ")");
				case "sig":
					let isRemoveDashes = (arg=="(2)");
				  if (isStationery) {
					  return '<sig class="st4-signature" removeDashes=' + isRemoveDashes + '>' + dmy + '</sig>' // 
					}
					// BIG FAT SIDE EFFECT!
					let ret = SmartTemplate4.Util.getSignatureInner(SmartTemplate4.signature, isRemoveDashes);
					SmartTemplate4.Util.logDebugOptional ('replaceReservedWords', 'replaceReservedWords(%sig%) = getSignatureInner(isRemoveDashes = ' + isRemoveDashes +')');
					return ret;
				case "subject":
					let current = (arg=="(2)");
					ret = getSubject(current);
					return finalize(token, ret);
				case "newsgroup":
					return finalize(token, getNewsgroup());
				// name of day and month
				case "A":
					return finalize(token, cal.dayName(tm.getDay()), "cal.dayName(" + tm.getDay() + ")");       // locale day of week
				case "a":
					return finalize(token, cal.shortDayName(tm.getDay()), "cal.shortDayName(" + tm.getDay() + ")");  // locale day of week(short)
				case "B":
					return finalize(token, cal.monthName(tm.getMonth()), "cal.monthName(" + tm.getMonth() +")");   // locale month
				case "b":
					return finalize(token, cal.shortMonthName(tm.getMonth()), "cal.shortMonthName(" + tm.getMonth() +")");   // locale month (short)
				case "p":
					switch (arg) {
						case "(1)":
							return finalize(token + "(1)", tm.getHours() < 12 ? "a.m." : "p.m."); // locale am or pm
						case "(2)":
							return finalize(token + "(2)", tm.getHours() < 12 ? "A.M." : "P.M."); // locale am or pm
						case "(3)":
						default:
							return finalize(token, tm.getHours() < 12 ? "AM" : "PM");     // locale am or pm
					}
					break;
				case "dbg1":
					return finalize(token, cal.list());
				case "cwIso": // ISO calendar week [Bug 25012]
					let offset = parseInt(arg.substr(1,1)); // (0) .. (6) weekoffset: 0-Sunday 1-Monday
					return finalize(token, "" + SmartTemplate4.Util.getIsoWeek(tm, offset));
				// Change time of %A-Za-z%
				case "X:=sent":
					SmartTemplate4.whatIsX = SmartTemplate4.XisSent;
					//SmartTemplate4.Util.logDebugOptional ('replaceReservedWords', "Switch: Time = SENT");
					return "";
				case "X:=today":
					SmartTemplate4.whatIsX = SmartTemplate4.XisToday;
					//SmartTemplate4.Util.logDebugOptional ('replaceReservedWords', "Switch: Time = NOW");
					return "";
				case "cursor":
					SmartTemplate4.Util.logDebugOptional ('replaceReservedWords', "%Cursor% found");
					//if(isStationery)
					//	return dmy;
					return '<div class="st4cursor">&nbsp;</div>'; 
				// any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
				default:
					var isStripQuote = RegExp(" " + token + " ", "i").test(
					                   " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
					                   " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To ");
					if (isStripQuote) {
						token = mime.split(hdr.get(token), charset, arg);
					}
					else {
						token = mime.decode(hdr.get(token), charset);
					}
					// allow HTML as to(link) etc. builds a href with mailto
					// also to supress href in to(mail)!
					if (arg && SmartTemplate4.Util.isFormatLink(arg) || arg=='(mail)') 
						return token;
					break;
					// unreachable code! =>
					// token = token.replace(/\r\n|\r|\n/g, ""); //remove line breaks from 'other headers'
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logException('replaceReservedWords(dmy, ' + token + ', ' + arg +') failed - unknown token?', ex);
			token="??";
		}
		return SmartTemplate4.escapeHtml(token);
	}
	msg = msg.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, replaceReservedWords);
	
	SmartTemplate4.Util.logDebugOptional('regularize',"SmartTemplate4.regularize(" + msg + ")  ...ENDS");
	return msg;
};





