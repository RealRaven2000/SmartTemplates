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
// -----------------------------------------------------------------------------------

//******************************************************************************
// for messengercompose
//******************************************************************************
// moved main object into smartTemplate-main.js !

// -------------------------------------------------------------------
// common (preference)
// -------------------------------------------------------------------
gSmartTemplate.classPref = function(branch, useDefault)
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
            return root.getIntPref(prefstring);  break;
          case Components.interfaces.nsIPrefBranch.PREF_BOOL:
            return root.getBoolPref(prefstring); break;
          default:
            break;
        }
        return def;
      } catch(ex) {
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
        if (getWithBranch(idkey + "." + useDefault, true))  // Check common or not.
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
            try { var accept_languages = prefService.getComplexValue("intl.accept_languages",Components.interfaces.nsIPrefLocalizedString).data; }
            catch (e) { var accept_languages = prefService.getCharPref("intl.accept_languages"); }
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
gSmartTemplate.classGetHeaders = function(messageURI)
{
    // -----------------------------------
    // Constructor
    var   messenger = Components.classes["@mozilla.org/messenger;1"].
                        createInstance(Components.interfaces.nsIMessenger);
    var   messageService = messenger.messageServiceFromURI(messageURI);
    var   messageStream = Components.classes["@mozilla.org/network/sync-stream-listener;1"].
                            createInstance().QueryInterface(Components.interfaces.nsIInputStream);
    var   inputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
                          createInstance().QueryInterface(Components.interfaces.nsIScriptableInputStream);

    inputStream.init(messageStream);
    try {
        messageService.streamMessage(messageURI, messageStream, msgWindow, null, false, null);
    } catch (ex) {
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
            return null;
        }
    }
    var headers = Components.classes["@mozilla.org/messenger/mimeheaders;1"].
                    createInstance().QueryInterface(Components.interfaces.nsIMimeHeaders);
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
gSmartTemplate.mimeDecoder = {
    headerParam: Components.classes["@mozilla.org/network/mime-hdrparam;1"]
                 .getService(Components.interfaces.nsIMIMEHeaderParam),
    cvtUTF8 : Components.classes["@mozilla.org/intl/utf8converterservice;1"]
                  .getService(Components.interfaces.nsIUTF8ConverterService),

    // -----------------------------------
    // Detect character set
    detectCharset : function(str)
    {
        var charset = "";

        if (str.search(/\x1b\$[@B]|\x1b\(J|\x1b\$\(D/gi) !== -1) { charset = "iso-2022-jp"; }   // RFC1468
        // RFC1555 ISO-8859-8 (Hebrew) is not support.
        if (str.search(/\x1b\$\)C/gi) !== -1)                    { charset = "iso-2022-kr"; }   // RFC1557
        if (str.search(/~{/gi) !== -1)                           { charset = "HZ-GB-2312"; }    // RFC1842
        if (str.search(/\x1b\$\)[AG]|\x1b\$\*H/gi) !== -1)       { charset = "iso-2022-cn"; }   // RFC1922
        // RFC1922 iso-2022-cn-ext is not support
        if (str.search(/\x1b\$\(D/gi) !== -1)                    { charset = "iso-2022-jp-1"; } // RFC2237
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
                decodedStr += headerParam.
                                getParameter(array[i].replace(/%/g, "%%").replace(/ /g, "-%-"), null, charset, true, { value: null }).
                                  replace(/-%-/g, " ").replace(/%%/g, "%");
            }
        } else {
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
      // MIME decode
      addrstr = this.decode(addrstr, charset);
      // Escape "," in mail addresses
      addrstr = addrstr.replace(/"[^"]*"/g,
                                function(s){ return s.replace(/%/g, "%%").replace(/,/g, "-%-"); });

      var array = addrstr.split(/\s*,\s*/);
      var addresses = "";
      var withname = true;
      var withaddr = true;
      if (format.search(/^\((first)*name.*\)$/, "i") != -1)
        { withaddr = false; }
      else if (format.search(/^\(mail\)$/, "i") != -1)
        { withname = false; }

      for (var i = 0; i < array.length; i++) {
          if (i > 0)
            { addresses += ", "; }

          // Escape "," in mail addresses
          array[i] = array[i].replace(/\r\n|\r|\n/g, "").replace(/"[^"]*"/,
                                      function(s){ return s.replace(/-%-/g, ",").replace(/%%/g, "%"); });
          // name or/and address
          var address = array[i].replace(/^\s*([^<]\S+[^>])\s*$/, "<$1>").
                                 replace(/^\s*(\S+)\s*\((.*)\)\s*$/, "$2 <$1>");
          var result = "";
          if (withname) {
              result = address.replace(/\s*<\S+>\s*$/, "").
                               replace(/^\s*\"|\"\s*$/g, "");           // %to% / %to(name)%
              if (result != "" && withaddr)
                { result += address.replace(/.*<(\S+)>.*/g, " <$1>"); }     // %to%
          }
          if (result == "") {
              if (!withaddr)
                { result = address.replace(/.*<(\S+)@\S+>.*/g, "$1"); }     // %to(name)%
              else
                { result = address.replace(/.*<(\S+)>.*/g, "$1"); }     // %to% / %to(mail)%
          }
          // get firstname
          var delimiter;
          if ((delimiter = format.match(/^\(firstname(\[.*\])*\)$/i)) != null) {
              if (delimiter[1] == null)
                { delimiter[1] = "[., ]"; }
              else
                { delimiter[1] = delimiter[1].replace(/&nbsp;/, " "); }
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
gSmartTemplate.regularize = function(msg, type)
{
    function getSignatureInner(removeDashes) {
        if (gSmartTemplate.signature != null) {
            gSmartTemplate.sigIsDefined = true;
            if (removeDashes) {
                if (gSmartTemplate.signature.firstChild.nodeValue == "-- ") {
                    gSmartTemplate.signature.removeChild(gSmartTemplate.signature.firstChild); //remove '-- '
                    gSmartTemplate.signature.removeChild(gSmartTemplate.signature.firstChild); //remove 'BR'
                    return gSmartTemplate.signature.innerHTML;
                }
            } 
            else {
                return gSmartTemplate.signature.innerHTML;
            }
        }
        return "";
    }
    
    function getSubject(current) {
        if (current){
            return document.getElementById("msgSubject").value;
        } else {
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

    this.Util.logDebugOptional('functions','gSmartTemplate.regularize(' + msg +')');
    // var parent = gSmartTemplate;
    var idkey = document.getElementById("msgIdentity").value;
    var identity = Components.classes["@mozilla.org/messenger/account-manager;1"]
                     .getService(Components.interfaces.nsIMsgAccountManager)
                     .getIdentity(idkey);
    var messenger = Components.classes["@mozilla.org/messenger;1"]
                     .createInstance(Components.interfaces.nsIMessenger);
    let mime = this.mimeDecoder;
    
    let msgDbHdr = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI);
    let charset = msgDbHdr.Charset;
    let hdr = new this.classGetHeaders(gMsgCompose.originalMsgURI);
    let date = msgDbHdr.date;
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
        function chkRw(str, rw, dmy) {
            try{
		        gSmartTemplate.Util.logDebugOptional('regularize','regularize.chkRw(' + str + ', ' +  rw + ', ' + dmy + ')');
		        let el = (typeof rw2h[rw]=='undefined') ? '' : rw2h[rw];
                return el == "d.c." 
                	? str 
                	: hdr.get(el ? el : rw) != "" ? str : "";
            } catch (e) {
                let strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
                     getService(Components.interfaces.nsIStringBundleService);
                let bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/errors.properties");
                try{ //try writing an error to the Error Console using the localized string; if it fails write it in English
                    Components.utils.reportError(bundle.GetStringFromName("contextError1")+ " %" + rw + "% " + bundle.GetStringFromName("contextError2"));
                } catch (e) {
                    Components.utils.reportError("SmartTemplate4: The variable %" + rw + "% can't be used for NEW Messages!\nListing of usable variables see Help");
                }
                
                return "";
            } 
        }
        function chkRws(str, strInBrackets) { 
	        return strInBrackets.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw).replace(/^[^%]*$/, ""); 
	    }
	    
	    
        // Reserved words that does not depend on the original message.
        setRw2h("d.c.", "ownname", "ownmail",
                        "Y", "m", "n", "d", "e", "H", "k", "I", "l", "M", "S", "T", "X", "A", "a", "B", "b", "p",
                        "X:=today", "dbg1", "datelocal", "dateshort", "date_tz", "tz_name", "sig", "newsgroup");
        // Reserved words depending on headers of the original message.
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
        var locale = gSmartTemplate.pref.getLocalePref();
        
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
    function replaceReservedWords(dmy, s, f)
    {
        var tm = new Date();
        var d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); }
        var expand = function(str) { return str.replace(/%([\w-]+)%/gm, replaceReservedWords); }
        var cal = gSmartTemplate.cal;

        // Set %A-Za-z% to time of original message was sent.
        if (gSmartTemplate.whatIsX == gSmartTemplate.XisSent)
          { tm.setTime(date / 1000); }

        // for backward compatibility
        switch (s) {
          case "fromname":  s = "From"; f = "(name)";   break;
          case "frommail":  s = "From"; f = "(mail)";   break;
          case "toname":    s = "To";   f = "(name)";   break;
          case "tomail":    s = "To";   f = "(mail)";   break;
          case "ccname":    s = "Cc";   f = "(name)";   break;
          case "ccmail":    s = "Cc";   f = "(mail)";   break;
        }


        switch(s){
            case "datelocal":
            case "dateshort":
                if (gSmartTemplate.whatIsX == gSmartTemplate.XisToday){
                    s = prTime2Str(tm.getTime() * 1000, s, 0);
                    return gSmartTemplate.escapeHtml(s);
                }else{
                    s = prTime2Str(date, s, 0);
                    return gSmartTemplate.escapeHtml(s);
                }
            case "timezone":    
            case "date_tz":
                    var matches = tm.toString().match(/([+-][0-9]{4})/);
                    return gSmartTemplate.escapeHtml(matches[0]);
        }
        
        switch (s) {
        // for Common (new/reply/forward) message
          // own name
          case "ownname":   s = identity.identityName.replace(/\s*<.*/, "");    break;
          // own email address
          case "ownmail":   s = identity.email;                 break;
          // today
          case "T":
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
            } break;
          case "subject":
            switch(f) {
                case "(1)": return getSubject(false);   break;
                case "(2)": return getSubject(true);    break;
                default:    return getSubject(false);   break;
            } break;
          case "newsgroup": return getNewsgroup();  break;  
          // name of day and month
          case "A": return cal.dayName(tm.getDay());        break;  // locale day of week
          case "a": return cal.shortDayName(tm.getDay());       break;  // locale day of week(short)
          case "B": return cal.monthName(tm.getMonth());        break;  // locale month
          case "b": return cal.shortMonthName(tm.getMonth());   break;  // locale month(short)
          case "p":
           switch (f) {
            case "(1)": return tm.getHours() < 12 ? "a.m." : "p.m.";    break;  // locale am or pm
            case "(2)": return tm.getHours() < 12 ? "A.M." : "P.M.";    break;  // locale am or pm
            case "(3)":
            default:    return tm.getHours() < 12 ? "AM" : "PM";    break;  // locale am or pm
           } break;
          case "dbg1":  return cal.list();              break;
          // Change time of %A-Za-z%
          case "X:=sent":   gSmartTemplate.whatIsX = gSmartTemplate.XisSent;    return "";
          case "X:=today":  gSmartTemplate.whatIsX = gSmartTemplate.XisToday;   return "";
          
        // any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
        default:
            var isStripQuote = RegExp(" "+s+" ", "i").test(
              " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
              " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To ");
            if (isStripQuote) {
            	s = mime.split(hdr.get(s), charset, f); 
            }
            else { 
	            s = mime.decode(hdr.get(s), charset); 
            }
            break;
        // unreachable code! =>
        // s = s.replace(/\r\n|\r|\n/g, ""); //remove line breaks from 'other headers'
        }
        return gSmartTemplate.escapeHtml(s);
    }
    msg = msg.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, replaceReservedWords);
    return msg;
};


// -------------------------------------------------------------------
// Insert template message and edit quote header
// -------------------------------------------------------------------
gSmartTemplate.classSmartTemplate = function()
{
    // -----------------------------------
    // Extract Signature
    // 
    function extractSignature()
    {
	    let sig = '';
        gSmartTemplate.Util.logDebugOptional('functions','gSmartTemplate.extractSignature()');
        let bodyEl = gMsgCompose.editor.rootElement;           
        let nodes = gMsgCompose.editor.rootElement.childNodes;
        gSmartTemplate.signature = null;
        gSmartTemplate.sigIsDefined = false;
        
        let pref = gSmartTemplate.pref;
        let idKey = document.getElementById("msgIdentity").value;
        
	    // try to extract signature manually
        for(let i = 0; i < nodes.length; i++) {
            if ( nodes[i].className == "moz-signature" ) {
                bodyEl.removeChild(nodes[i].previousElementSibling); //remove the preceding BR that TB always inserts
                sig = bodyEl.removeChild(nodes[i-1]);
                break;
            }
        }
        
        if (!sig || typeof sig == 'string') {
		    if (gMsgCompose.composeHTML) {
			    sig = gMsgCompose.editor.document.createElement("div");
		    	sig.className = 'moz-signature';
			    sig.innerHTML = gMsgCompose.identity.htmlSigText;
	    	}
	    	else {
			    sig = gMsgCompose.editor.document.createTextNode(gMsgCompose.identity.htmlSigText);
	    	}
	    }
	    
        return sig;
    }

    
    // -----------------------------------
    // Delete DOMNode/textnode or BR
    function delDOMNodeTextOrBR(node)
    {
        let match=false;
        let theNodeName='';
        if (node && node.nodeName)
          theNodeName = node.nodeName.toLowerCase();
        else
          return;
        switch(theNodeName) {
          case 'br':
            match = true;
            break;
          case '#text':
            match = true;
            break;
          case 'div':  // tb 13++
            if (node.className && node.className.indexOf('moz-cite-prefix')>=0)
              match = true;
            break;
        }
        
        if (match) {
		        gSmartTemplate.Util.logDebugOptional('functions','delDOMNodeTextOrBR() - deletes node ' + theNodeName 
		         		+ '\n' + node.nodeName + '  ' + node.nodeValue);
            orgQuoteHeaders.push(node);
            gMsgCompose.editor.deleteNode(node);
        }
    };
    
    function delDOMNodeAll(node)
    {
        if (node) {
		        gSmartTemplate.Util.logDebugOptional('functions','delDOMNodeAll() - deletes node ' + node.nodeName 
		         		+ '\n' + node.innerHTML);
            orgQuoteHeaders.push(node);
            gMsgCompose.editor.deleteNode(node);
        }
    };

    // -----------------------------------
    // Delete quote header (reply)
    //In compose with HTML, body is
    //  <BR><BR>(<- if reply_on_top=1) <#text#>..... (reply_header_xxxx) <BLOCKQUOTE> original-message
    //In compose with TEXT, body is
    //  <BR><BR>(<- if reply_on_top=1) <#text#>..... (reply_header_xxxx) <BR><SPAN> original-message
    //We need to remove a few lines depending on reply_ono_top and reply_header_xxxx.
    function delReplyHeader(idKey)
    {
        function countLF(str) { return str.split("\n").length - 1; }
        
        
        gSmartTemplate.Util.logDebugOptional('functions','gSmartTemplate.delReplyHeader()');
	    let rootEl = gMsgCompose.editor.rootElement;
	    
        var pref = gSmartTemplate.pref;
        var lines = 0;
        if (pref.getCom("mail.identity." + idKey + ".reply_on_top", 1) == 1) { 
	        lines = 2; 
        }

        let node = rootEl.firstChild

        // delete everything except quoted part        
        while (node) {
          let n = node.nextSibling;
          // skip the forwarded part
          if (node.nodeName && node.nodeName=='blockquote' && node.className.indexOf('cite')>=0) {
	          node = n;
          	continue;
        	}
          delDOMNodeTextOrBR(node);
        	node = n;
        }
        
        
        if (gSmartTemplate.Util.versionGreaterOrEqual(gSmartTemplate.Util.AppverFull, "12")) {
	        // recursive search from root element
	        let node = findChildNode(rootEl, 'moz-email-headers-table');
	        if (node) {
	        	delDOMNodeAll(node);
        	}
        }
        else {
	        switch (pref.getCom("mailnews.reply_header_type", 1)) {
	          case 3:   // LFLF + author + separator + ondate + colon+LF
	          case 2:   // LFLF + ondate + separator + author + colon+LF
	            lines += countLF(pref.getCom("mailnews.reply_header_separator", ","));
	            lines += countLF(pref.getCom("mailnews.reply_header_ondate", "(%s)"));
	          case 1:   // LFLF + author + colon+LF
	          default:  // Handle same as 1
	            lines += countLF(pref.getCom("mailnews.reply_header_authorwrote", "%s wrote"));
	            lines += countLF(pref.getCom("mailnews.reply_header_colon", ":"));
	          case 0:   // LFLF + LF
	            lines++;
	            break;
	        }
	        gSmartTemplate.Util.logDebugOptional('functions.delReplyHeader','delReplyHeader: trying to delete ' + lines + ' lines...');
	
	        // Delete original headers .. eliminates all #text nodes but deletes the others
	        while (rootEl.firstChild && lines > 0) {
	            if (rootEl.firstChild.nodeName != "#text") { 
		            lines--; 
		        }
	            delDOMNodeTextOrBR(rootEl.firstChild);
	        }
        }
    };
    
    // helper function tgo find a child node of the passed class Name
  	function findChildNode(node, className) {
    	while (node) {
	    	if (node && node.className == className)
	    		return node;
	    	let n = findChildNode(node.firstChild, className);
	    	if (n)
	    		return n;
	    	node = node.nextSibling;
  	  }
  	  return null;
    	  
  	}

    // -----------------------------------
    // Delete quote header(forward)
    //In compose with HTML, body is
    //  <BR><BR> <#text#(1041)> <TABLE(headers)> <#text# nodeValue=""> !<BR><BR>! <PRE> original-message
    //In compose with TEXT, body is
    //  <BR><BR> <#text#(1041)><BR> <#text# (headers)>!<BR><BR>! original-message
    //We need to remove tags until two BR tags appear consecutively.
    // AG: To assume that the 2 <br> stay like that is foolish... it change in Tb12 / Tb13
    function delForwardHeader()
    {
	    
        gSmartTemplate.Util.logDebugOptional('functions','gSmartTemplate.delForwardHeader()');
        
        var bndl = Components.classes["@mozilla.org/intl/stringbundle;1"]
                             .getService(Components.interfaces.nsIStringBundleService)
                             .createBundle("chrome://messenger/locale/mime.properties");
        let origMsgDelimiter = bndl.GetStringFromID(1041);
        gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','Retrieved Delimiter Token from mime properties: ' + origMsgDelimiter);

        // Delete original headers
        var rootEl = gMsgCompose.editor.rootElement;
        
        let node = rootEl.firstChild
        //while (rootEl.firstChild && rootEl.firstChild.nodeValue != header) #
        while (node) {
			let n = node.nextSibling;
			// skip the forwarded part
			if (node.className == 'moz-forward-container') {
				// lets find the ---original message--- now
				let inner = node.firstChild;
				while (inner) {
				  let m = inner.nextSibling;
				  if (inner.nodeValue == origMsgDelimiter) {
					        gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','deleting delimiter node: ' + origMsgDelimiter);
				          gMsgCompose.editor.deleteNode(inner); // we are not pushing this on to orgQuoteHeaders as there is no value to this.
				      	break;	
				  	}
				  	inner = m;
				}
				node = n;
				continue;
			}
			delDOMNodeTextOrBR(node);
			node = n;
        }
        
        if (gSmartTemplate.Util.versionGreaterOrEqual(gSmartTemplate.Util.AppverFull, "12")) {
	        // recursive search from root element
	        node = findChildNode(rootEl, 'moz-email-headers-table');
	        if (node) {
	        	delDOMNodeAll(node);
        	}
        }
        else {
	        let node = rootEl.firstChild;
	        // old method continues until it finds <br><br> after header table
	        var brcnt = 0;
	        while (rootEl.firstChild && brcnt < 2) {
	            if (rootEl.firstChild.nodeName == "BR")
	              { brcnt++; }
	            else
	              { brcnt = 0; }
	            delDOMNodeAll(rootEl.firstChild);
	        }
	    }
    };

    // -----------------------------------
    // Remove template messages and Restore original quote headers
    function undoTemplate()
    {
        gSmartTemplate.Util.logDebugOptional('functions','gSmartTemplate.undoTemplate()');
        var curEl = gMsgCompose.editor.rootElement.firstChild;
        var nextEl = gMsgCompose.editor.rootElement.firstChild;
        if (nextEl && nextEl.nodeName == "PRE")
          { nextEl = nextEl.firstChild; }
        while ((curEl = nextEl)) {
            nextEl = curEl.nextSibling;
            if (curEl.id == "IDstID") {
                if (nextEl && nextEl.tagName == "BR")
                  { gMsgCompose.editor.deleteNode(nextEl); }
                gMsgCompose.editor.deleteNode(curEl);
                break;
            }
        }
        // Restore original quote headers
        while (orgQuoteHeaders.length > 0) {
            gMsgCompose.editor.insertNode(orgQuoteHeaders.pop(),
                                          gMsgCompose.editor.rootElement, 0);
        }
    };
    function clearTemplate()
    {
        orgQuoteHeaders.length = 0;
    };

    // -----------------------------------
    // Get template message
    function getMsgTmpl(type, idKey, prefmsg, prefhtml, prefnbr)
    {
        var pref = gSmartTemplate.pref;
        var msg = pref.getWithIdkey(idKey, prefmsg, "");
            //Reset X to Today after each newline character
            //except for lines ending in { or }; breaks the omission of non-existent CC??
            msg = msg.replace(/\n/gm, "%X:=today%\n");
            msg = msg.replace(/{\s*%X:=today%\n/gm, "{\n");
            msg = msg.replace(/}\s*%X:=today%\n/gm, "}\n");

        if (pref.getWithIdkey(idKey, prefhtml, false)) {
            msg = msg.replace(/( )+(<)|(>)( )+/gm, "$1$2$3$4");
            if (pref.getWithIdkey(idKey, prefnbr, true))
              { msg = msg.replace(/>\n/gm, ">").replace(/\n/gm, "<br>"); }
            else
              { msg = msg.replace(/\n/gm, ""); }
        } else {
            msg = gSmartTemplate.escapeHtml(msg);
            // Escape space, if compose is HTML
            if (gMsgCompose.composeHTML)
              { msg = msg.replace(/ /gm, "&nbsp;"); }
        }
        return gSmartTemplate.regularize(msg, type);
    };

    // -----------------------------------
    // Add template message
    function insertTemplate(startup)
    {
        gSmartTemplate.Util.logDebugOptional('functions','insertTemplate(' + startup + ')');
        var   pref = gSmartTemplate.pref;
        // var   editor = GetCurrentEditor();
        let ed = gMsgCompose.editor; 
        let editor = ed.QueryInterface(Components.interfaces.nsIEditor); // 
        
        var   msgComposeType = Components.interfaces.nsIMsgCompType;
        var   msgTmpl = null;
        var   idKey = document.getElementById("msgIdentity").value;
        var   branch = idKey + ".";

        // Switch account
        if (startup) {
            // Clear template
            clearTemplate();
        } 
        else {
            // Check identity changed or not
            if (gCurrentIdentity && gCurrentIdentity.key == idKey) {
                return;
            }
            // Undo template messages
            undoTemplate();
        }
        
        gSmartTemplate.signature = extractSignature();

        switch (gMsgCompose.type) {
          // new message -----------------------------------------
          //  (New:0 / NewsPost:5 / MailToUrl:11)
          case msgComposeType.New:
          case msgComposeType.NewsPost:
          case msgComposeType.MailToUrl:
            if (pref.getWithIdkey(idKey, "new", false))
            {
                msgTmpl = getMsgTmpl("new", idKey, "newmsg", "newhtml", "newnbr");
            }
            break;

          // reply message ---------------------------------------
          //  (Reply:1 / ReplyAll:2 / ReplyToSender:6 / ReplyToGroup:7 /
          //   ReplyToSenderAndGroup:8 / ReplyToList:13)
          case msgComposeType.Reply:
          case msgComposeType.ReplyAll:
          case msgComposeType.ReplyToSender:
          case msgComposeType.ReplyToGroup:
          case msgComposeType.ReplyToSenderAndGroup:
          case msgComposeType.ReplyToList:
            if (pref.getWithIdkey(idKey, "rsp", false))
            {
                msgTmpl = getMsgTmpl("rsp", idKey, "rspmsg", "rsphtml", "rspnbr");
                if (pref.getWithIdkey(idKey, "rsphead", false) &&
                    pref.getCom("mail.identity." + idKey + ".auto_quote", true)) {
                	delReplyHeader(idKey); 
                }
            }
            break;

          // forwarding message ----------------------------------
          //  (ForwardAsAttachment:3 / ForwardInline:4)
          case msgComposeType.ForwardAsAttachment:
          case msgComposeType.ForwardInline:
            if (pref.getWithIdkey(idKey, "fwd", false))
            {
                gSmartTemplate.Util.logDebugOptional('functions','insertTemplate() ForwardInline case');

                msgTmpl = getMsgTmpl("fwd", idKey, "fwdmsg", "fwdhtml", "fwdnbr");
                if (gMsgCompose.type == msgComposeType.ForwardAsAttachment) {
                	break; 
                }
                if (pref.getWithIdkey(idKey, "fwdhead", false)) { 
	                delForwardHeader(); 
	            }
            }
            break;

          // do not process -----------------------------------
          //   (Draft:9/Template:10/ReplyWithTemplate:12)
          default:
            break;
        }
        // add template message --------------------------------
        if (msgTmpl && msgTmpl !== "")
        {
            if(gMsgCompose.composeHTML){
                gMsgCompose.editor.insertNode(
                    gMsgCompose.editor.document.createElement("br"),
                    gMsgCompose.editor.rootElement, 0);
            }
            editor.beginningOfDocument();
            editor.insertHTML("<div id=\"IDstID\">" + msgTmpl + "</div>");
            editor.beginningOfDocument();
            editor.selectionController.completeMove(false, false);
            editor.selectionController.completeScroll(false);
        }
        
        // insert the signature that was removed in extractSignature() if the user did not have %sig% in their template
        let theSignature = gSmartTemplate.signature;
        if (!gSmartTemplate.sigIsDefined && theSignature) {
            let pref = gSmartTemplate.pref;
            let sig_on_bottom = pref.getCom("mail.identity." + idKey + ".sig_bottom", true);
            let bodyEl = gMsgCompose.editor.rootElement;
            
            if (sig_on_bottom){
                bodyEl.appendChild(gMsgCompose.editor.document.createElement("br")); //replace the BR that was removed in extractSignature
                bodyEl.appendChild(theSignature);
            } else {
                bodyEl.insertBefore(theSignature, bodyEl.firstChild);
                bodyEl.insertBefore(gMsgCompose.editor.document.createElement("br"), bodyEl.firstChild); //replace the BR that was removed in extractSignature
            }
        }
        
        gMsgCompose.editor.resetModificationCount();
        if (startup) {
            gMsgCompose.editor.enableUndo(false);
            gMsgCompose.editor.enableUndo(true);
        }
    };
    
    // -----------------------------------
    // Constructor
    // var gSmartTemplate = gSmartTemplate;
    var orgQuoteHeaders = new Array();

    // -----------------------------------
    // Public methods of classSmartTemplate
    this.insertTemplate = insertTemplate;
};





