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
SmartTemplate4.classPref = function() {
  const Ci = Components.interfaces,
        Cc = Components.classes;
	// -----------------------------------
	// Constructor
	let root = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);

	// -----------------------------------
	// get preference
	// returns default value if preference cannot be found.
	function getCom(prefstring, defaultValue)	{
		try {
			switch (root.getPrefType(prefstring)) {
				case Ci.nsIPrefBranch.PREF_STRING:
          try {
            return root.getComplexValue(prefstring, Ci.nsIPrefLocalizedString).data;
          }
          catch(ex) {
            SmartTemplate4.Util.logDebug("Prefstring missing: " + prefstring 
              + "\nReturning default string: [" + defaultValue + "]");
            return defaultValue;
          }
				case Ci.nsIPrefBranch.PREF_INT:
					return root.getIntPref(prefstring);
				case Ci.nsIPrefBranch.PREF_BOOL:
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
	function getWithIdkey(idkey, pref, def) {
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
			let localeService = Cc["@mozilla.org/intl/nslocaleservice;1"]
			                    .getService(Ci.nsILocaleService),
			    locale = localeService.getLocaleComponentForUserAgent(),  // get locale from Operating System
			    forcedLocale = SmartTemplate4.calendar.currentLocale,  // check if the %language% variable was set
			    listLocales = '',
			    found = false;
			if (forcedLocale && forcedLocale != locale) {
				let availableLocales = SmartTemplate4.Util.getAvailableLocales("global"); // list of installed locales
				while (availableLocales.hasMore()) {
					let aLocale = availableLocales.getNext();
					listLocales += aLocale.toString() + ', ';
					if (aLocale == forcedLocale) found = true;
				}
				if (!found) {
				  let errorText =   'Invalid %language% id: ' + forcedLocale + '\n'
					                + 'You will need the Language Pack from ftp://ftp.mozilla.org/pub/mozilla.org/thunderbird/releases/' + SmartTemplate4.Util.AppverFull + '/yourPlatform/xpi' + '\n'
					                + 'Available Locales on your system: ' + listLocales.substring(0, listLocales.length-2);
					SmartTemplate4.Util.logError(errorText, '', '', 0, 0, 0x1);
					SmartTemplate4.Message.display(errorText,
		                              "centerscreen,titlebar",
		                              function() { ; }
		                              );
					
					forcedLocale = null;
				}
				else {
					SmartTemplate4.Util.logDebug('calendar - found global locales: ' + listLocales + '\nconfiguring ' + forcedLocale);
					locale = forcedLocale;
				}
			}

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


/**
 * Function to kick off/resume asynchronous processing.  Any function invoked by
 *  async_run that returns/yields false at any point is responsible for ensuring
 *  async_driver() is called again once the async operation completes.
 *
 * Note: This function actually schedules the real driver to run after a
 *  timeout. This is to ensure that if you call us from a notification event
 *  that all the other things getting notified get a chance to do their work
 *  before we actually continue execution.  It also keeps our stack traces
 *  cleaner.
 */
 /*
function async_driver(val) {
  asyncGeneratorSendValue = val;
  do_execute_soon(_async_driver);
  return false;
}
*/

// We use this as a display consumer
// nsIStreamListener
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
// not used (yet)
var SmartTemplate4_streamListener =
{
  _data: "",
  _stream : null,

  QueryInterface:
    XPCOMUtils.generateQI([Components.interfaces.nsIStreamListener, Components.interfaces.nsIRequestObserver]),

  // nsIRequestObserver interfaces
  onStartRequest: function(aRequest, aContext) {
    // Note: An exception thrown from onStartRequest has the side-effect of causing the request to be canceled.
  },
  onStopRequest: function(aRequest, aContext, aStatusCode) {
    // Called to signify the end of an asynchronous request. This call is always preceded by a call to onStartRequest().
    //in nsIRequest aRequest,
    // in nsISupports aContext,
    // in nsresult aStatusCode
    do_check_eq(aStatusCode, 0);
    do_check_true(this._data.contains("Content-Type"));
    // async_driver(); //????
  },

  // concatenate stream data into a string
  onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
    if (this._stream == null) {
      this._stream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
      this._stream.init(aInputStream);
    }
    this._data += this._stream.read(aCount);
  }
};

// -------------------------------------------------------------------
// Get header string
// -------------------------------------------------------------------
SmartTemplate4.classGetHeaders = function(messageURI) {
	// -----------------------------------
	// Constructor
  const Ci = Components.interfaces,
        Cc = Components.classes;
	let util = SmartTemplate4.Util,
      messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger),
	    messageService = messenger.messageServiceFromURI(messageURI),
	    messageStream = Cc["@mozilla.org/network/sync-stream-listener;1"].createInstance().QueryInterface(Ci.nsIInputStream),
	    inputStream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance().QueryInterface(Ci.nsIScriptableInputStream);

  util.logDebugOptional('functions','classGetHeaders(' + messageURI + ')');
  let headers = Cc["@mozilla.org/messenger/mimeheaders;1"]
              .createInstance().QueryInterface(Ci.nsIMimeHeaders);
/*   
  // ASYNC MIME HEADERS

  let testStreamHeaders = true; // new code!
  var asyncUrlListener = new AsyncUrlListener();
  
  if (testStreamHeaders) {
    // http://mxr.mozilla.org/comm-central/source/mailnews/base/public/nsIMsgMessageService.idl#190
    
    // http://mxr.mozilla.org/comm-central/source/mailnews/imap/test/unit/test_imapHdrStreaming.js#101
    let messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);
    let msgService = messenger.messageServiceFromURI(messageURI); // get nsIMsgMessageService
    msgService.streamHeaders(msgURI, SmartTemplate4_streamListener, asyncUrlListener,true);    
    yield false;
  }
  // ==
  let msgContent = new String(SmartTemplate4_streamListener._data);
  headers.initialize(msgContent, msgContent.length);
*/  
  
	inputStream.init(messageStream);
	try {
		messageService.streamMessage(messageURI, messageStream, msgWindow, null, false, null);
	}
	catch (ex) {
		util.logException('classGetHeaders - constructor - messageService.streamMessage failed', ex);
		return null;
	}

	let msgContent = "",
	    contentCache = "";
  try {
    while (inputStream.available()) { 
      msgContent = msgContent + inputStream.read(2048); 
      let p = msgContent.search(/\r\n\r\n|\r\r|\n\n/); //todo: it would be faster to just search in the new block (but also needs to check the last 3 bytes)
      if (p > 0) {
        contentCache = msgContent.substr(p + (msgContent[p] == msgContent[p+1] ? 2 : 4));
        msgContent = msgContent.substr(0, p) + "\r\n";
        break;
      }
      if (msgContent.length > 2048 * 8) {
        util.logDebug('classGetHeaders - early exit - msgContent length>16kB: ' + msgContent.length);
        return null;
      }
    }
  }
  catch(ex) {
    util.logException('Reading inputStream failed:', ex);
    if (!msgContent) throw(ex);
  }
  
	headers.initialize(msgContent, msgContent.length);
	util.logDebugOptional('mime','allHeaders: \n' +  headers.allHeaders);

	// -----------------------------------
	// Get header
	function get(header) {
    // /nsIMimeHeaders.extractHeader
    let retValue = '',
		    str = headers.extractHeader(header, false);
    // for names maybe use nsIMsgHeaderParser.extractHeaderAddressName instead?
    if (str && SmartTemplate4.Preferences.getMyBoolPref('headers.unescape.quotes')) {
      // if a string has nested escaped quotes in it, should we unescape them?
      // "Al \"Karsten\" Seltzer" <fxxxx@gmail.com>
      retValue = str.replace(/\\\"/g, "\""); // unescape
    }
    else
      retValue = str ? str : "";
    SmartTemplate4.regularize.headersDump += 'extractHeader(' + header + ') = ' + retValue + '\n';
    return retValue;
	};
	
	// -----------------------------------
	// Get content
	function content(size) {
	  while (inputStream.available() && contentCache.length < size) 
	    contentCache += inputStream.read(2048);
	  if (contentCache.length > size) return contentCache.substr(0, size);
	  else return contentCache;
	};

	// -----------------------------------
	// Public methods
	this.get = get;
	this.content = content;

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
	// jcranmer: this is really impossible based on such short fields
	// see also: hg.mozilla.org/users/Pidgeot18_gmail.com/patch-queues/file/cd19874b48f8/patches-newmime/parser-charsets
	//           http://encoding.spec.whatwg.org/#interface-textdecoder
	//           
	detectCharset: function(str) {
		let charset = "";
		 // not supported                  
		 // #    RFC1555 ISO-8859-8 (Hebrew)
		 // #    RFC1922 iso-2022-cn-ext (Chinese extended)

		if (str.search(/\x1b\$[@B]|\x1b\(J|\x1b\$\(D/gi) !== -1) {   // RFC1468 (Japanese)
		  charset = "iso-2022-jp"; 
		} 
		if (str.search(/\x1b\$\)C/gi) !== -1)                    {   // RFC1557 (Korean)
		  charset = "iso-2022-kr"; 
		} 
		if (str.search(/~{/gi) !== -1)                           {   // RFC1842 (Chinese ASCII)
		  charset = "HZ-GB-2312"; 
		}
		if (str.search(/\x1b\$\)[AG]|\x1b\$\*H/gi) !== -1)       {   // RFC1922 (Chinese) 
		  charset = "iso-2022-cn"; 
		}
		if (str.search(/\x1b\$\(D/gi) !== -1) {  // RFC2237 (Japanese 1)
		  charset = "iso-2022-jp-1"; 
		}
		if (!charset) { 
			let defaultSet = SmartTemplate4.Preferences.getMyStringPref ('defaultCharset');
			charset = defaultSet ? defaultSet : '';  // should we take this from Thunderbird instead?
		}
		SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.detectCharset guessed charset: ' + charset +'...');
		return charset;
	},

	// -----------------------------------
	// MIME decoding.
	decode: function (theString, charset) {
		let decodedStr = "";

		try {
			if (/=\?/.test(theString)) {
				// RFC2231/2047 encoding.
				// We need to escape the space and split by line-breaks,
				// because getParameter stops convert at the space/line-breaks.
        // => some russian mail servers use tab character as delimiter
        //    some even use a space character between 2 encoding blocks
        theString = theString.replace ("?= =?", "?=\n=?"); // space problem
				let array = theString.split(/\s*\r\n\s*|\s*\r\s*|\s*\n\s*|\s*\t\s*/g);
				for (let i = 0; i < array.length; i++) {
					decodedStr += this.headerParam
					                  .getParameter(array[i].replace(/%/g, "%%").replace(/ /g, "-%-"), null, charset, true, { value: null })
					                  .replace(/-%-/g, " ").replace(/%%/g, "%");
				}
			}
			else {
				// for Mailers who have no manners.
				if (charset === "")
					charset = this.detectCharset(theString);
				let skip = charset.search(/ISO-2022|HZ-GB|UTF-7/gmi) !== -1;
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
  // addrstr - comma separated string of address-parts
  // charset - character set of target string (probably silly to have one for all)
  // format - list of parts for target string: name, firstName, lastName, mail, link, bracketMail()
	split: function (addrstr, charset, format, bypassCharsetDecoder)	{
	  // jcranmer: you want to use parseHeadersWithArray
		//           that gives you three arrays
	  //           the first is an array of strings "a@b.com", "b@b.com", etc.
		//           the second is an array of the display names, I think fully unquoted
    //           the third is an array of strings "Hello <a@b.com>"
		//           preserveIntegrity is used, so someone with the string "Dole, Bob" will have that be quoted I think
		//           if you don't want that, you'd have to pass to unquotePhraseOrAddrWString(value, false)
		//           oh, and you *don't* need to decode first, though you might want to
		// see also: https://bugzilla.mozilla.org/show_bug.cgi?id=858337
		//           hg.mozilla.org/users/Pidgeot18_gmail.com/patch-queues/file/587dc0232d8a/patches-newmime/parser-tokens#l78
		// use https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIMsgDBHdr
		// mime2DecodedAuthor, mime2DecodedSubject, mime2DecodedRecipients!
	  function getEmailAddress(a) {
			return a.replace(/.*<(\S+)>.*/g, "$1");
		}

		function isLastName(format) { return (format.search(/^\(lastname[,\)]/, "i") != -1); };
    // argType = Mail or Name to support bracketMail and bracketName
    function getBracketAddressArgs(format, argType) { 
      let reg = new RegExp('bracket' + argType + '\\[(.+?)\\]', 'g'), //   /bracketMail\[(.+?)\]/g, // we have previously replaced bracketMail(*) with bracketMail[*] !
          ar = reg.exec(format);
      if (ar && ar.length>1)
        return ar[1];
      return '';
    };
    function getCardFromAB(mail) {
      if (!mail) return null;
      // https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Address_Book_Examples
      // http://mxr.mozilla.org/comm-central/source/mailnews/addrbook/public/nsIAbCard.idl
      
      let allAddressBooks;

      if (SmartTemplate4.Util.Application === "Postbox") {
         // mailCore.js:2201 
         // abCardForEmailAddress(aEmailAddress, aAddressBookOperations, aAddressBook)
         let card = abCardForEmailAddress(mail,  Components.interfaces.nsIAbDirectory.opRead, {});
         if (card) return card;
         return null;
      }
      else {
        let abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
        allAddressBooks = abManager.directories; 
      }
      while (allAddressBooks.hasMoreElements()) {
        let addressBook = allAddressBooks.getNext()
                                         .QueryInterface(Components.interfaces.nsIAbDirectory);
        if (addressBook instanceof Components.interfaces.nsIAbDirectory) { // or nsIAbItem or nsIAbCollection
          // alert ("Directory Name:" + addressBook.dirName);
          try {
            let card = addressBook.cardForEmailAddress(mail);
            if (card)
              return card;
          }
          catch(ex) {
            SmartTemplate4.Util.logDebug('Problem with Addressbook: ' + addressBook.dirName + '\n' + ex) ;
          }
        }
      }
      return null;
    }

    // return the bracket delimiteds
		function getBracketDelimiters(bracketParams, element) {
      let del1='', del2='',
          bracketExp = element.field;
      if (bracketExp) {
        // bracketMail()% use to "wrap" mail address with non-standard characters
        // bracketMail(square)%    [email]  - square brackets
        // bracketMail(round)%     (email)   - round brackets
        // bracketMail(angle)%     <email>   - angled brackets
        // bracketMail(;)%      email
        // bracketMail(<;>)%    <email>
        // bracketMail(";")%    "email"
        // bracketMail(= ;)%     = email
        // etc.
        // the expression between brackets can also have empty delimiters; e.g. bracketMail(- ;) will prefix "- " and append nothing
        // we use ; as delimiter between the bracket expressions to avoid wrongly splitting format string elsewhere
        // (Should we allow escaped round brackets?)
        if (!bracketParams.trim())
          bracketParams = 'angle';
        let delimiters = bracketParams.split(';');
        switch(delimiters.length) {
          case 0: // error
            break;
          case 1: // special case
            switch(delimiters[0]) {
              case 'square':
                del1 = '[';
                del2 = ']';
                break;
              case 'round':
                del1 = '(';
                del2 = ')';
                break;
              case 'angle': case 'angled':
                del1 = '&lt;'; // <
                del2 = '&gt;';  // >
                break;
              default:
                del1 = '?';
                del2 = '?';
            }
            break;
          default: // delimiters separated by ; 3 and more are ignored.
            del1 = delimiters[0];
            del2 = delimiters[1];
            break;
        }
      }
      return [del1, del2];
    }
    
    //  %from% and %to% default to name followed by bracketed email address
    if (typeof format=='undefined' || format == '') {
      format = SmartTemplate4.Preferences.getMyBoolPref('mime.resolveAB.removeEmail') ?
              'name' :
              'name,bracketMail[angle]'; 
    }
    
		SmartTemplate4.Util.logDebugOptional('mime.split',
         '====================================================\n'
       + 'mimeDecoder.split(charset decoding=' + (bypassCharsetDecoder ? 'bypassed' : 'active') + ')\n'
       + '  addrstr:' +  addrstr + '\n'
       + '  charset: ' + charset + '\n'
       + '  format: ' + format + '\n'
       + '====================================================');
		// if (!bypassCharsetDecoder)
			// addrstr = this.decode(addrstr, charset);
		// Escape % and , characters in mail addresses
		addrstr = addrstr.replace(/"[^"]*"/g, function(s){ return s.replace(/%/g, "%%").replace(/,/g, "-%-"); });
		SmartTemplate4.Util.logDebugOptional('mime.split', 'After escaping special chars in mail address field:\n' + addrstr);

    /** SPLIT ADDRESSES **/
		let array = addrstr.split(/\s*,\s*/);
    
    /** SPLIT FORMAT PLACEHOLDERS **/
		// possible values for format are:
		// name, firstname, lastname, mail - fields (to be extended)
    // bracketMail(args) - special function (we replaced the round brackets with [] for parsing)
    // link, islinkable  - these are "modifiers" for the previous list element
    let formatArray = [];
    if (format) {
      // remove parentheses
      if (format.charAt(0)=='(')
        format = format.slice(1);
      if (format.charAt(format.length-1)==')')
        format = format.slice(0, -1);
      
      let fs=format.split(',');
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
    
    let dbgText = 'addrstr.split() found [' + array.length + '] addresses \n' + 'Formats:\n';
    for (let i=0; i<formatArray.length; i++) {
      dbgText += formatArray[i].field;
      if (formatArray[i].modifier)  
        dbgText += '(' + formatArray[i].modifier + ')';
      dbgText += '\n';
    }
    SmartTemplate4.Util.logDebugOptional('mime.split', dbgText);
    
		let addresses = "",
        address,
        bracketMailParams = getBracketAddressArgs(format, 'Mail'),
        bracketNameParams = getBracketAddressArgs(format, 'Name');

    // if (SmartTemplate4.Preferences.Debug) debugger;
    /** ITERATE ADDRESSES  **/
		for (let i = 0; i < array.length; i++) {
			if (i > 0) {
				addresses += ", ";
			}
      let addressee = '',
          firstName, lastName,
          fullName = '',
          emailAddress = '',
          addressField = array[i];
      // [Bug 25816] - missing names caused by differing encoding
      // MIME decode (moved into the loop)
      if (!bypassCharsetDecoder)
        addressField = this.decode(array[i], charset);
      
			// Escape "," in mail addresses
			array[i] = addressField.replace(/\r\n|\r|\n/g, "")
			                   .replace(/"[^"]*"/,
			                   function(s){ return s.replace(/-%-/g, ",").replace(/%%/g, "%"); });
			// name or/and address
			address = array[i].replace(/^\s*([^<]\S+[^>])\s*$/, "<$1>").replace(/^\s*(\S+)\s*\((.*)\)\s*$/, "$2 <$1>");
      
      SmartTemplate4.Util.logDebugOptional('mime.split', 'processing: ' + addressField + ' => ' + array[i] + '\n'
                                           + 'address: ' + address);
      // [Bug 25643] get name from Addressbook
      emailAddress = getEmailAddress(address); // get this always
      let card = SmartTemplate4.Preferences.getMyBoolPref('mime.resolveAB') ? getCardFromAB(emailAddress) : null;
      // this cuts off the angle-bracket address part: <fredflintstone@fire.com>
      addressee = address.replace(/\s*<\S+>\s*$/, "")
                      .replace(/^\s*\"|\"\s*$/g, "");  // %to% / %to(name)%
      if (!addressee) { // if no addressee part found we probably have only an email address.; take first part before the @
        addressee = address.slice(0, address.indexOf('@'));
        if (addressee.charAt('0')=='<')
          addressee = addressee.slice(1);
      }
      // if somebody repeats the email address instead of a name at front, e.g. a.x@tcom, we cut the domain off anyway
      if (addressee.indexOf('@')>0)
        addressee = addressee.slice(0, addressee.indexOf('@'))
			fullName = addressee;
      
      firstName = card ? card.firstName : '';
      if (card && SmartTemplate4.Preferences.getMyBoolPref('mime.resolveAB.preferNick')) {
        if (SmartTemplate4.Util.Application === "Postbox") {
          if (card.nickName)
            firstName = card.nickName;
        }
        else
          firstName = card.getProperty("NickName", card.firstName);
      }
      lastName = card ? card.lastName : '';
      fullName = (card && card.displayName) ? card.displayName : fullName;
      
      let isNameFound = (firstName.length + lastName.length > 0); // nameProcessed
      if (!isNameFound && SmartTemplate4.Preferences.getMyBoolPref('firstLastSwap')) {
        // extract Name from left hand side of email address
				let regex = /\(([^)]+)\)/,
				    nameRes = regex.exec(addressee);
				if (nameRes  &&  nameRes.length > 1 && !isLastName(format)) {
					isNameFound = true;
					firstName = nameRes[1];  // name or firstname will fetch the (Name) from brackets!
				}
				else {
					let iComma =  addressee.indexOf(', ');
					if (iComma>0) {
						firstName = addressee.substr(iComma + 2);
						lastName = addressee.substr(0, iComma);
            isNameFound = true;
					}
				}
      }

      
      if (!fullName) {
        if (firstName && lastName) { 
          fullName = firstName + ' ' + lastName ; 
        }
        else {
          fullName = firstName ? firstName : lastName;  // ???
        }
        if (!fullName) fullName = addressee.replace("."," "); // we might have to replace . with a space -  fall back
      }
      else {
        // name split / replacements; if there are no spaces lets replace '.' then '_'
        if (fullName.indexOf(' ')<0) {
           fullName = addressee.replace('.',' ');
        }
        if (fullName.indexOf(' ')<0) {
           fullName = addressee.replace('_',' ');
        }
        // replace double quotation marks?
      }
      
      let names = fullName.split(' '),
          isOnlyOneName = (names.length==1) ? true : false;
      if (!firstName) firstName = (names.length) ? names[0] : '';
      if (!lastName) lastName = (names.length>1) ? names[names.length-1] : '';
      
      if (SmartTemplate4.Preferences.getMyBoolPref('names.capitalize')) {
        fullName = SmartTemplate4.Util.toTitleCase(fullName);
        firstName = SmartTemplate4.Util.toTitleCase(firstName);
        lastName = SmartTemplate4.Util.toTitleCase(lastName);
      }
      
      // build the part!
      addressField = ''; // reset to finalize
      for (let j=0; j<formatArray.length; j++)  {
        let element = formatArray[j],
            part = ''; 
        switch(element.field.toLowerCase()) {
          case 'mail':
            switch (element.modifier) {
              case 'linkable':
                part = emailAddress;
                break;
              case 'linkTo': // No special linking, anchor will be modified below like with all other parts
                part = emailAddress;
                break;
              default:
                //empty anchor suppresses link; adding angle brackets as default
                // TO DO: make default brackets configurable later
                if (SmartTemplate4.Preferences.getMyBoolPref('mail.suppressLink'))
                  part = "<a>" + "&lt;" + emailAddress + "&gt;" + "</a>"; 
                else
                  part = emailAddress;
                  
            }
            break;
          case 'name':
            if (fullName)
              part = fullName;
            else
              part = address.replace(/.*<(\S+)@\S+>.*/g, "$1"); // email first part fallback
            break;
          case 'firstname':
            part = firstName;
            break;
          case 'lastname':
            if (isOnlyOneName && format.indexOf('firstname')<0) {
              part = firstName; // fall back to first name if lastName was 
                                // 'emptied' because of duplication
            }
            else
              part = lastName;
            break;
          default:
            let bM = (element.field.indexOf('bracketMail[')==0),
                bN = (element.field.indexOf('bracketName[')==0);
            if (bM || bN) {
              let open, close;
              if (bM) {
                [open, close] = getBracketDelimiters(bracketMailParams, element);
                part = emailAddress ? open + emailAddress + close : '';
              }
              else {
                [open, close] = getBracketDelimiters(bracketNameParams, element);
                let fN = fullName ? fullName : address.replace(/.*<(\S+)@\S+>.*/g, "$1"); // email first part fallback
                part = fN ? open + fN + close : '';
              }
            }
            break;
        }
        if (element.modifier =='linkTo') {
          part = "<a href=mailto:" + emailAddress + ">" + part + "</a>"; // mailto
        }

        // append the next part
        if (part.length>1) {
          // space to append next parts
          if(j) addressField += ' ';
          addressField += part;
        }
      }
      
      SmartTemplate4.Util.logDebugOptional('mime.split', 'adding formatted address: ' + addressField);
      addresses += addressField;
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
	let matches = msg.match(/%deleteText\(.*\)%/g), // works on template only
	    matchesR = msg.match(/%replaceText\(.*\)%/g); // works on template only
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
  
  // %matchTextFromBody()% using * to generate result:
  // %matchTextFromBody(TEST *)% => returns first * match: TEST XYZ => XYZ
  let matchesP = msg.match(/%matchTextFromBody\(.*\)%/g);
  if (matchesP) {
    let patternArg = matchesP[i].match(   /(\"[^)].*\")/   ); // get argument (includes quotation marks)
    if (patternArg) {
      let rx = unquotedRegex(patternArg[0], true),  // pattern for searching body
          rootEl = gMsgCompose.editor.rootElement;
      if (rootEl) {
        let result = rx.exec(rootEl.innerText); // extract Pattern from body
        if (result && result.length) {
          // retrieve the * part from the pattern  - e..g matchTextFromBody(Tattoo *) => finds "Tattoo 100" => generates "100" (one word)
          msg = msg.replace(matchesP, result[1]);
        }
      }
    }  
  }
  
	if (matchesR) { // replacements
    let dText1, dText2;
		for (let i=0; i<matchesR.length; i++) {
			// parse out the argument (string to delete)
			msg = msg.replace(matchesR[i], '');
      let theStrings = matchesR[i].split(",");
      if (theStrings.length==2) {
        dText1 = theStrings[0].match(   /\"[^)].*\"/   ); // get 2 arguments (includes quotation marks) "Replace", "With" => double quotes inside are not allowed.
        dText2 = theStrings[1].match(   /\"[^)].*\"/   ); // get 2 arguments (includes quotation marks) "Replace", "With" => double quotes inside are not allowed.
        // %replaceText("xxx", %matchBodyText("yyy *")%)%; // nesting to get word from replied
        
        if (dText1.length + dText2.length == 2) {
          msg = msg.replace(unquotedRegex(dText1[0], true), unquotedRegex(dText2[0]));
        }
        else {
          SmartTemplate4.Util.logDebug('Splitting replaceText(a,b) arguments could not be parsed. '
            + '\n Arguments have to be enclosed in double quotes.');
        }
      }
      else {
        SmartTemplate4.Util.logDebug('Splitting replaceText(a,b) did not return 2 arguments. '
          + '\n Arguments may not contain comma or double quotes.'
          + '\n Special characters such as # must be escaped with backslash.');
      }
		}
	}
	return msg;
}
	
// -------------------------------------------------------------------
// Regularize template message
// -------------------------------------------------------------------
SmartTemplate4.regularize = function regularize(msg, composeType, isStationery, ignoreHTML, isDraftLike) {
  const Ci = Components.interfaces,
        Cc = Components.classes,
        util = SmartTemplate4.Util,
        preferences = SmartTemplate4.Preferences;

	function getSubject(current) {
		util.logDebugOptional('regularize', 'getSubject(' + current + ')');
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
		util.logDebugOptional('regularize', 'getNewsgroup()');
		let acctKey = msgDbHdr.accountKey;
		//const account = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).getAccount(acctKey);
		//dump ("acctKey:"+ acctKey);

		//return account.incomingServer.prettyName;
		return acctKey;
	}

	// AG: I think this function is designed to break out a more specialized variable
	// such as %toname()% to a simpler one, like %To%
	function simplify(aString) {
		// Check existence of a header related to the reserved word.
		function classifyReservedWord(str, reservedWord, param) {
			try{
				util.logDebugOptional('regularize','regularize.classifyReservedWord(' + str + ', ' +  reservedWord + ', ' + param + ')');
				let el = (typeof TokenMap[reservedWord]=='undefined') ? '' : TokenMap[reservedWord],
				    s = (el == "reserved")
					? str
					: hdr.get(el ? el : reservedWord) != "" ? str : "";
				if (!el)
					util.logDebug('Removing unknown variable: %' +  reservedWord + '%');
				return s;
			} catch (ex) {
				util.displayNotAllowedMessage(reservedWord);
				return "";
			}
		}

		function checkReservedWords(str, strInBrackets) {
			// I think this first step is just replacing special functions with general ones.
			// E.g.: %tomail%(z) = %To%(z)
			let generalFunction = strInBrackets.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, classifyReservedWord);
			// next: ?????
			return  generalFunction.replace(/^[^%]*$/, "");
		}
		
		if ((composeType != "new") && !gMsgCompose.originalMsgURI)  {
			util.popupAlert ("SmartTemplate4", "Missing message URI - SmartTemplate4 cannot process this message!");
			return aString;
		}

		util.logDebugOptional('regularize', 'simplify()');

		// [AG] First Step: use the checkReservedWords function to process any "broken out" parts that are embedded in {  .. } pairs
		// aString = aString.replace(/{([^{}]+)}/gm, checkReservedWords);
		aString = aString.replace(/\[\[([^\[\]]+)\]\]/gm, checkReservedWords);

		// [AG] Second Step: use classifyReservedWord to categorize reserved words (variables) into one of the 6 classes: reserved, To, Cc, Date, From, Subject
		return aString.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, classifyReservedWord);
	}

  SmartTemplate4.regularize.headersDump = '';
	util.logDebugOptional('regularize','SmartTemplate4.regularize(' + msg +')  STARTS...');
	// var parent = SmartTemplate4;
	let idkey = util.getIdentityKey(document),
	    identity = Components.classes["@mozilla.org/messenger/account-manager;1"]
					 .getService(Ci.nsIMsgAccountManager)
					 .getIdentity(idkey),
	    messenger = Components.classes["@mozilla.org/messenger;1"]
					 .createInstance(Ci.nsIMessenger),
	    mime = this.mimeDecoder;

  // THIS FAILS IF MAIL IS OPENED FROM EML FILE:
  let msgDbHdr;
  let charset;
  try {
    msgDbHdr = (composeType != "new") ? messenger.msgHdrFromURI(gMsgCompose.originalMsgURI) : null;
    charset = (composeType != "new") ? msgDbHdr.Charset : null;
    // try falling back to folder charset:
    if (!charset && msgDbHdr) {
      msgDbHdr.folder.charset; 
    }
  }
  catch (ex) {
    util.logException('messenger.msgHdrFromURI failed:', ex);
    // gMsgCompose.originalMsgURI ="mailbox:///E:/Dev/Mozilla/DEV/SmartTemplate/Support/Dmitry/%D0%A0%D0%B5%D0%BA%D0%BE%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%86%D0%B8%D1%8F%20%D0%9A%D0%B0%D0%BB%D1%83%D0%B6%D1%81%D0%BA%D0%BE%D0%B3%D0%BE%20%D1%88%D0%BE%D1%81%D1%81%D0%B5.eml?number=0"
    // doesn't return a header but throws!
    charset = gMsgCompose.compFields.characterSet;
    // gMsgCompose.editor
    // gMsgCompose.editor.document
    // gMsgCompose.compFields.messageId = ""
    // gMsgCompose.compFields.subject
    // gMsgCompose.compFields.to
  }
  
  

	let hdr = null;
  try {
    hdr = (composeType != "new") ? new this.classGetHeaders(gMsgCompose.originalMsgURI) : null;
  }
  catch(ex) {
    util.logException('fatal error - classGetHeaders() failed', ex);
  }
	let date = (composeType != "new") ? msgDbHdr.date : null;
	if (composeType != "new") {
		// for Reply/Forward message
		let tz = new function(date) {
			this.str = ("+0000" + date).replace(/.*([+-][0-9]{4,4})/, "$1");
			this.h = this.str.replace(/(.).*/, "$11") * (this.str.substr(1,1) * 10 + this.str.substr(2,1) * 1);
			this.m = this.str.replace(/(.).*/, "$11") * (this.str.substr(3,1) * 10 + this.str.substr(4,1) * 1);
		} (hdr.get("Date"));
	}
	// TokenMap["headerName"] = mail Header
	// TokenMap["reserved"] = ST4 function
	var TokenMap = {};
	// building a hash table?
	// addTokens("header", "reserved word",,,)
	function addTokens() { // build a map
		for (let i = 1; i < arguments.length; i++) {
			TokenMap[arguments[i]] = arguments[0]; // set the type of each token: reserved, To, Cc, Date, From, Subject
		}
	}
	// Reserved words that do not depend on the original message.
	// identity(name) is the new ownname
	// identity(mail) is the new ownmail
	addTokens("reserved", "ownname", "ownmail", "deleteText", "replaceText",
					"Y", "y", "m", "n", "d", "e", "H", "k", "I", "l", "M", "S", "T", "X", "A", "a", "B", "b", "p",
					"X:=today", "dbg1", "datelocal", "dateshort", "date_tz", "tz_name", "sig", "newsgroup", "cwIso", 
					"cursor", "identity", "quotePlaceholder", "language", "quoteHeader", "smartTemplate", "internal-javascript-ref",
					"messageRaw", "file", //depends on the original message, but not on any header
          "header.set", "header.append", "header.prefix"
					);

	// Reserved words which depend on headers of the original message.
	addTokens("To", "to", "toname", "tomail");
	addTokens("Cc", "cc", "ccname", "ccmail");
	addTokens("Date", "X:=sent");
	addTokens("From", "from", "fromname", "frommail");
	addTokens("Subject", "subject");

	// Convert PRTime to string
	function prTime2Str(time, timeType, timezone) {
		util.logDebugOptional('regularize','prTime2Str(' + time + ', ' + timeType + ', ' + timezone + ')');

		try {
			let tm = new Date();
			let fmt = Components.classes["@mozilla.org/intl/scriptabledateformat;1"].
						createInstance(Ci.nsIScriptableDateFormat);
			
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
			util.logException('regularize.prTime2Str() failed', ex);
		}
		return '';
	}

	function zoneFromShort(short) {
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
	}

	function getTimeZoneAbbrev(tm, isLongForm) {
    function isAcronym(str) {
      return (str.toUpperCase() == str); // if it is all caps we assume it is an acronym
    }
		// return tm.toString().replace(/^.*\(|\)$/g, ""); HARAKIRIs version, not working.
		// get part between parentheses
		// e.g. "(GMT Daylight Time)"
		util.logDebugOptional ('timeZones', 'getTimeZoneAbbrev(time: ' + tm.toString() + ', long form: ' + isLongForm);
		let timeString =  tm.toTimeString(),
		    timeZone = timeString.match(/\(.*?\)/),
		    retVal = '';
		util.logDebugOptional ('timeZones', 'timeString = ' + timeString + '\n' 
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
			util.logDebugOptional ('timeZones', 'no timeZone match, building manual...');
			retVal = timeString.match('[A-Z]{4}');
			if (!retVal)
				retVal = timeString.match('[A-Z]{3}');
			// convert to long form by using hard-coded time zones array.
			util.logDebug('Cannot determine timezone string - Missed parentheses - from:\n' + timeString + ' regexp guesses: ' + retVal);
			if (isLongForm) {
				retVal = zoneFromShort(retVal);
			}
		}
		util.logDebugOptional ('timeZones', 'getTimeZoneAbbrev return value = ' + retVal);
		return retVal;
	}
	
	// Replace reserved words
	function replaceReservedWords(dmy, token, arg)	{
	  // calling this function just for logging purposes
		function finalize(tok, s, comment) {
			if (s) {
				let text = "replaceReservedWords( %" + tok + "% ) = " + s;
				if (comment) {
					text += '\n' + comment;
				}
				util.logDebugOptional ('replaceReservedWords', text);
			};
			return s;
		} 
		
    function testHTML(token, arg) {
      if ((token.indexOf('</a>')>=0)    // does token contain HTML link or encoded < >?
        ||
        (token.indexOf('&lt;')>=0)
        ||
        (token.indexOf('&gt;')>=0)
        ||
        (arg && util.isFormatLink(arg) || arg=='(mail)'))
        return true;
      return false;
    }
    
    function modifyHeader(hdr, cmd, argString) {
      const whiteList = ["subject","to","from","cc","bcc","reply-to"],
            ComposeFields = gMsgCompose.compFields;
      let targetString = '',
          modType = '',
          argument = argString.substr(argString.indexOf(",")+1); // cut off first part (command)
      argument = argument.substr(1, argument.lastIndexOf(")")-2);
      if (preferences.Debug) debugger;
      try {
        util.logDebug("modifyHeader(" + hdr +", " + cmd + ", " + argument+ ")");
        if (whiteList.indexOf(hdr)<0) {
          util.logToConsole("invalid header - no permission to modify: " + hdr);
          return '';
        }
        // get
        modType = 'address';
        switch (hdr) {
          case 'subject':
            targetString = ComposeFields.subject;
            modType = 'string';
            break;
          case 'to':
            targetString = ComposeFields.to;
            break;
          case 'cc':
            targetString = ComposeFields.cc;
            break;
          case 'bcc':
            targetString = ComposeFields.bcc;
            break;
          case 'from':
            targetString = ComposeFields.from;
            break;
          case 'reply-to':
            targetString = ComposeFields.replyTo;
            break;
          default:
            modType = '';
            break;
        }
        // modify
        switch (modType) {
          case 'string': // single string
            switch (cmd) {
              case 'set':
                targetString = argument; 
                break;
              case 'prefix':
                let replyPrefix = targetString.lastIndexOf(':'),
                    testSubject = targetString;
                if (replyPrefix>0) { // caveat: won't work well if subject also contains a ':'
                  // cut off Re: Fwd: etc.
                  testSubject = targetString.substr(0, replyPrefix).trim();
                  if (testSubject.indexOf(argument)>=0) break; // keyword is (anywhere) before colon?
                  // cut off string after last prefix to restore original subject
                  testSubject = targetString.substr(replyPrefix+1).trim(); // where we can check at the start...
                }
                // keyword is immediately after last colon, or start of original subject
                if (testSubject.indexOf(argument)!=0)  { // avoid duplication!
                  targetString = argument + targetString; 
                }
                break;
              case 'append':
                // problem - if there are encoding breaks, will this comparison fail?
                let argPos = targetString.toLowerCase().trim().lastIndexOf(argument.toLowerCase().trim()); // avoid duplication
                if (argPos < 0 || argPos < targetString.length-argument.length ) 
                  targetString = targetString + argument; 
                break;
            }
            break;
          case 'address': // address field
            switch (cmd) {
              case 'set': // overwrite address field
                targetString = argument.toString(); 
                break;
              case 'prefix':
                // targetString = argument.toString() + ' ' + targetString; 
                // invalid!
                break;
              case 'append': // append an address field (if not contained already)
                             // also omit in Cc if already in To and vice versa
                if (hdr=='cc' && ComposeFields.to.toLowerCase().indexOf(argument.toLowerCase())>=0)
                  break;
                if (hdr=='to' && ComposeFields.cc.toLowerCase().indexOf(argument.toLowerCase())>=0)
                  break;
                
                if (targetString.toLowerCase().indexOf(argument.toLowerCase())<0) {
                  targetString = targetString + ', ' + argument; 
                }
                break;
            }
            break;
        }
        
        // set
        // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/NsIMsgCompFields
        switch (hdr) {
          case 'subject':
            document.getElementById("msgSubject").value = targetString;
            ComposeFields.subject = targetString;
            break;
          case 'to':
            ComposeFields.to = targetString;
            break;
          case 'cc':
            ComposeFields.cc = targetString;
            break;
          case 'bcc':
            ComposeFields.bcc = targetString;
            break;
          case 'from':
            ComposeFields.from = targetString;
            break;
          case 'reply-to':
            ComposeFields.replyTo = targetString;
            break;
        }
        // try to update headers - ComposeFieldsReady()
        // http://mxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#3971
        if (modType == 'address')
          CompFields2Recipients(ComposeFields);
      }
      catch(ex) {
        util.logException('modifyHeader()', ex);
      }
      return ''; // consume
    }
    
    let tm = new Date(),
		    d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); },
		    expand = function(str) { return str.replace(/%([\w-]+)%/gm, replaceReservedWords); };
		if (!SmartTemplate4.calendar.bundle)
			SmartTemplate4.calendar.init(null); // default locale
		let cal = SmartTemplate4.calendar;

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
						let matches = tm.toString().match(/([+-][0-9]{4})/);
						return finalize(token, SmartTemplate4.escapeHtml(matches[0]));
				// for Common (new/reply/forward) message
				case "ownname": // own name
					token = identity.identityName.replace(/\s*<.*/, "");
					break;
				case "ownmail": // own email address
					token = identity.email;
					break;
				case "smartTemplate":  // currently only useful when put into a Stationery template.
				  return   "<span class=\"smartTemplate-placeholder\"></span>";
				case "quoteHeader":  // currently only useful when put into a Stationery template.
				  return   "<span class=\"quoteHeader-placeholder\"></span>";
				case "quotePlaceholder":  // currently only useful when put into a Stationery template.
          // apparently Stationery inserts the blockquote after
          // <span class="quoteHeader-placeholder"></span> <br>
				  return   "<span stationery=\"content-placeholder\">"
					       +   "<blockquote type=\"cite\"> ... "
								 +   "</blockquote>"
							   + "</span>";
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
          let retVal;
				  if (isStationery) {
            retVal = '<sig class="st4-signature" removeDashes=' + isRemoveDashes + '>' + dmy + '</sig>' // 
					}
          else {
					// BIG FAT SIDE EFFECT!
            retVal = util.getSignatureInner(SmartTemplate4.signature, isRemoveDashes);
            if (!retVal) retVal=''; // empty signature
            util.logDebugOptional ('replaceReservedWords', 'replaceReservedWords(%sig%) = getSignatureInner(isRemoveDashes = ' + isRemoveDashes +')');
          }
          util.logDebugOptional ('signatures', 'replaceReservedWords sig' + arg + ' returns:\n' + retVal);
					return retVal;
				case "subject":
					let current = (arg=="(2)");
					let ret = getSubject(current);
					if (!current)
						ret = SmartTemplate4.escapeHtml(ret);
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
				case "language":
				  SmartTemplate4.calendar.init(arg.substr(1,arg.length-2)); // strip ( )
					return "";
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
					return finalize(token, "" + util.getIsoWeek(tm, offset));
				// Change time of %A-Za-z%
				case "X:=sent":
					SmartTemplate4.whatIsX = SmartTemplate4.XisSent;
					//util.logDebugOptional ('replaceReservedWords', "Switch: Time = SENT");
					return "";
				case "X:=today":
					SmartTemplate4.whatIsX = SmartTemplate4.XisToday;
					//util.logDebugOptional ('replaceReservedWords', "Switch: Time = NOW");
					return "";
				case "cursor":
					util.logDebugOptional ('replaceReservedWords', "%Cursor% found");
					//if(isStationery)
					//	return dmy;
					return '<div class="st4cursor">&nbsp;</div>'; 
			  case "internal-javascript-ref":
			    return javascriptResults[/\((.*)\)/.exec(arg)[1]];
				// any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
				case "messageRaw": //returns the arg-th first characters of the content of the original message
				  return hdr.content(arg?/\((.*)\)/.exec(arg)[1]*1:2048);
        case 'file':
          let fileContents = insertFileLink(arg),
              parsedContent = SmartTemplate4.smartTemplate.getProcessedText(fileContents, idkey, composeType, true);
          return parsedContent;
				case "identity":
				  /////
          if (identity.fullName && identity.email) {
            let fullId = identity.fullName + ' <' + identity.email + '>';
            // we need the split to support (name,link) etc.
            token = mime.split(fullId, charset, arg, true); // disable charsets decoding!
            // avoid double escaping
            if (testHTML(token, arg))
              return token;
          }
          else {
            logDebug("Problem with identity:\n" +
                     "fullName = " + identity.fullName +"\n" +
                     "email = " + identity.email);
            return "identity - undefined";
          }
					break;
				default:
          // [Bug 25904]
          if (token.indexOf('header')==0) {
            let args = arg.split(","),
                modHdr = args.length ? args[0].toLowerCase().substr(1) : ''; // cut off "("
            if (args.length<2) {
              util.logToConsole("modifyHeader() second parameter missing");
              return '';
            }
            switch (token) {
              case "header.set":
                return modifyHeader(modHdr, 'set', arg);
              case "header.append":
                return modifyHeader(modHdr, 'append', arg);
              case "header.prefix":
                return modifyHeader(modHdr, 'prefix', arg);
              default: 
                util.logToConsole("invalid header command: " + token);
                return '';
            }
          }
					let isStripQuote = RegExp(" " + token + " ", "i").test(
					                   " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
					                   " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To "),
              theHeader = hdr.get(token);
          // make sure empty header stays empty for this special case
          if (!theHeader && RegExp(" " + token + " ", "i").test(" Bcc Cc "))
            return '';
					if (isStripQuote) {
						token = mime.split(theHeader, charset, arg);
					}
					else {
						token = mime.decode(theHeader, charset);
					}
					// allow HTML as to(link) etc. builds a href with mailto
					if (testHTML(token, arg)) // avoid double escaping
						return token;
					break;
					// unreachable code! =>
					// token = token.replace(/\r\n|\r|\n/g, ""); //remove line breaks from 'other headers'
			}
		}
		catch(ex) {
			util.logException('replaceReservedWords(dmy, ' + token + ', ' + arg +') failed - unknown token?', ex);
			token="??";
		}
		return SmartTemplate4.escapeHtml(token);
	}
	
  // [Bug 25871]
  function insertFileLink(txt) {
    util.logDebug("insertFileLink " + txt);
    // determine file type:
    let html,
        arr = txt.substr(1,txt.length-2).split(','),  // strip parentheses and get optional params
        path = arr[0],
        type = path.toLowerCase().substr(path.lastIndexOf('.')+1);
    if (type.match( /(png|apng|jpg|jpeg|jp2k|gif|tif|bmp|dib|rle|ico|svg|webp)$/))
      type='image';
    util.logDebug("insertFile - type detected: " + type);
    switch(type) {
      case 'htm':
      case 'html':
      case 'txt':
        // find / load file and expand?
        let data = "",
            //read file into a string so the correct identifier can be added
            fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
            cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream),
            countRead = 0;
        //let sigFile = Ident.signature.QueryInterface(Ci.nsIFile); 
        try {
          let FileUtils = Components.utils.import("resource://gre/modules/FileUtils.jsm").FileUtils,
              isFU = FileUtils && FileUtils.File,
              localFile = isFU ?   // not in Postbox
                          new FileUtils.File(path) :
                          Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
              str = {};
          util.logDebug("localFile.initWithPath(" + path + ")");
          if (!isFU)
            localFile.initWithPath(path);
          
          fstream.init(localFile, -1, 0, 0);
          /* sigEncoding: The character encoding you want, default is using UTF-8 here */
          let encoding = (arr.length>1) ? arr[1] : 'UTF-8';
          util.logDebug("initializing stream with " + encoding + " encoding...");
          cstream.init(fstream, encoding, 0, 0);
          let read = 0;
          do {
            read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
            data += str.value;
            countRead += read;
          } while (read != 0);
          cstream.close(); // this closes fstream
          html = data.toString();
        }
        catch (ex) {
          util.logException("insertFileLink() - read " + countRead + " characters.", ex);
          if (countRead) {
            html = data.toString();
          }
          else
            html = "<div style='border:1px solid #DDDDDD; color:#CCCCCC; background-color: #AA0000; max-width:600px;'> Error reading file: " + path + "<br>"
                   + "Please check error console for detail</div>";
        }
        break;
      case 'image':
        let alt = (arr.length>1) ? 
                  (" alt='" + arr[1].replace("'","") + "'") :    // don't escape this as it should be pure text. We cannot accept ,'
                  "";
        html = "<img src='file:///" + path.replace('\\','/') + "'" + alt + " >";
        break;
      default:
        alert('unsupported file type in %file()%: ' + type + '.');
        html='';
        break;
    }
    return html;
  } 
  
	let sandbox;
	// [Bug 25676]	Turing Complete Templates - Benito van der Zander
  // https://www.mozdev.org/bugs/show_bug.cgi?id=25676
	// we are allowing certain (string) Javascript functions in concatenation to our %variable%
	// as long as they are in a script block %{%    %}%
	// local variables can be defined within these blocks, only 1 expression line is allowed per block,
	// hence best to wrap all code in (function() { ..code.. })()  
  // function must return "" in order not to insert an error
	function replaceJavascript(dmy, script) {
    util.logDebugOptional('sandbox', 'replaceJavascript(' + dmy +', ' + script +')');
	  if (!sandbox) {
	    sandbox = new Components.utils.Sandbox(
        window,
        {
        //  'sandboxName': aScript.id,
          'sandboxPrototype': window,
          'wantXrays': true
        });
        
      //useful functions (especially if you want to change the template depending on the received message)
      sandbox.choose = function(a){return a[Math.floor(Math.random()*a.length)]};
      sandbox.String.prototype.contains = function(s, startIndex){return this.indexOf(s, startIndex) >= 0};
      sandbox.String.prototype.containsSome = function(a){return a.some(function(s){return this.indexOf(s) >= 0}, this)};
      sandbox.String.prototype.count = function(s, startIndex){
        let count = 0; 
        let pos = this.indexOf(s, startIndex);
        while (pos != -1) { 
          count += 1; 
          pos = this.indexOf(s, pos + 1);
        }
        return count;
      };        
      sandbox.variable = function(name, arg) {
        arg = arg || "";
        if (preferences.isDebugOption('sandbox')) debugger;
        let retVariable = replaceReservedWords("", name, arg || "");
        util.logDebugOptional('sandbox','variable(' + name + ', ' + arg +')\n'
          + 'returns: ' + retVariable);
        return retVariable;
      };
      var implicitNull = {},
          stringFunctionHack = new Function(),
			// overloading our strings using sandbox
          props = ["charAt", "charCodeAt", "concat", "contains", "endsWith", "indexOf", "lastIndexOf", "localeCompare", "match", "quote", "repeat", "replace", "search", "slice", "split", "startsWith", "substr", "substring", "toLocaleLowerCase", "toLocaleUpperCase", "toLowerCase", "toUpperCase", "trim", "trimLeft", "trimRight",  "contains", "containsSome", "count"];
      for (let i=0; i<props.length; i++) {
        let s = props[i];
        stringFunctionHack[s] = sandbox.String.prototype[s];
      }
      stringFunctionHack.valueOf = function(){ return this(implicitNull); };
      stringFunctionHack.toString = function(){ return this(implicitNull); };
        
      for (let name in TokenMap) {
        sandbox[name] = (function(aname) {
					return function(arg){
            if (preferences.isDebugOption('sandbox')) debugger;
						if (typeof arg === "undefined") {
              util.logDebugOptional('sandbox','sandbox[] arg undefined, returning %' + aname +'()%');
              return "%"+aname + "()%"; //do not allow name() 
            }
						if (arg === implicitNull) arg = "";
						else arg = "("+arg+")";    //handles the case %%name(arg)%% and returns the same as %name(arg)%
            let sbVal = replaceReservedWords("", aname, arg);
            util.logDebugOptional('sandbox','sandbox[' + aname +'] returns:' + sbVal);
						return sbVal;
					};
				})(name);
        sandbox[name].__proto__ = stringFunctionHack; //complex hack so that sandbox[name] is a function that can be called with (sandbox[name]) and (sandbox[name](...))
        //does not work:( sandbox[name].__defineGetter__("length", (function(aname){return function(){return sandbox[aname].toString().length}})(name));
      }  // for
	  };  // (!sandbox)
	  //  alert(script);
	  var x;
	  try {
      if (preferences.isDebugOption('sandbox')) debugger;
	    x = Components.utils.evalInSandbox("(" + script + ").toString()", sandbox); 
			//prevent sandbox leak by templates that redefine toString (no idea if this works, or is actually needed)
	    if (x.toString === String.prototype.toString) {
			  x = x.toString(); 
			}
	    else { 
			  x = "security violation";
			}
	  } 
		catch (ex) {
	    x = "ERR: " + ex;
	  }
	  javascriptResults.push(x);
	  return "%internal-javascript-ref("+(javascriptResults.length-1)+")%"; //todo: safety checks (currently the sandbox is useless)
	}
	
	//process javascript insertions first, so the javascript source is not broken by the remaining processing
	let javascriptResults = []; //but cannot insert result now, or it would be double html escaped, so insert them later
	msg = msg.replace(/%\{%((.|\n|\r)*?)%\}%/gm, replaceJavascript); // also remove all newlines and unnecessary white spaces
	
	//Now do this chaotical stuff:
	
  //Reset X to Today after each newline character
	//except for lines ending in { or }; breaks the omission of non-existent CC??
	msg = msg.replace(/\n/gm, "%X:=today%\n");
	//replace this later!!
	// msg = msg.replace(/{\s*%X:=today%\n/gm, "{\n");
	// msg = msg.replace(/}\s*%X:=today%\n/gm, "}\n");
	msg = msg.replace(/\[\[\s*%X:=today%\n/gm, "[[\n");
	msg = msg.replace(/\]\]\s*%X:=today%\n/gm, "]]\n");
	
	// ignoreHTML, e,g with signature, lets not do html processing
	if (!ignoreHTML) {
		// for Draft, let's just assume html for the moment.
		if (isDraftLike) {
			msg = msg.replace(/( )+(<)|(>)( )+/gm, "$1$2$3$4");
			if (SmartTemplate4.pref.isReplaceNewLines(idkey, composeType, true)) 
				{ msg = msg.replace(/>\n/gm, ">").replace(/\n/gm, "<br>"); }
			//else
			//	{ msg = msg.replace(/\n/gm, ""); }
		} else {
			msg = SmartTemplate4.escapeHtml(msg);
			// Escape space, if compose is HTML
			if (gMsgCompose.composeHTML)
				{ msg = msg.replace(/ /gm, "&nbsp;"); }
		}
	}
	// AG: remove any parts ---in curly brackets-- (replace with  [[  ]] ) optional lines
	msg = simplify(msg);	
  // replace round brackets of bracktMail() with [] - using the second (=inner) match group
  // this makes it possible to nest functions!
	msg = msg.replace(/(bracketMail\(([^)]*))\)/gm, "bracketMail\[$2\]");
	msg = msg.replace(/(bracketName\(([^)]*))\)/gm, "bracketName\[$2\]");
  if (preferences.isDebugOption('regularize')) debugger;
  msg = msg.replace(/%([\w-:=.]+)(\([^)]+\))*%/gm, replaceReservedWords); // added . for header.set / header.append / header.prefix
	
	if (sandbox) Components.utils.nukeSandbox(sandbox);

  // dump out all headers that were retrieved during regularize  
  util.logDebugOptional('headers', SmartTemplate4.regularize.headersDump);
	util.logDebugOptional('regularize',"SmartTemplate4.regularize(" + msg + ")  ...ENDS");
	return msg;
}; // regularize





