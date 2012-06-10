// -----------------------------------------------------------------------------------
// ---------------------------- last edit at 06/10/2012 ------------------------------
// -----------------------------------------------------------------------------------
// ----------------------------------- Changelog -------------------------------------
// -----------------------------------------------------------------------------------
// 0.7.5: "use strict" suggested by Mozilla add-on review team
// 0.7.8: logging an error in error console if an variable is used incorrect
// 0.8.0: other order of 'Account Name-User Name' instead of 'User Name-Account Name'
// 0.8.1: rewrited large partitions of script code to fix problems on Thunderbird 13
// -----------------------------------------------------------------------------------

"use strict";

//******************************************************************************
// for messengercompose
//******************************************************************************
var gSmartTemplate = {};

gSmartTemplate.stateListener = {
    NotifyComposeFieldsReady: function() {},
    NotifyComposeBodyReady: function() {
        gSmartTemplate.notifyComposeBodyReady();
    },
    ComposeProcessDone: function(aResult) {},
    SaveInFolderDone: function(folderURI) {}
};

gSmartTemplate.initListner = function()
{   
    gMsgCompose.RegisterStateListener(gSmartTemplate.stateListener);
};

// definitions for whatIsX (time of %A-Za-z%)
gSmartTemplate.XisToday = 0;
gSmartTemplate.XisSent  = 1;
gSmartTemplate.signature = null;
gSmartTemplate.sigIsDefined = false;

document.getElementById("msgcomposeWindow").addEventListener("compose-window-init", gSmartTemplate.initListner, false);



// -------------------------------------------------------------------
// A handler to add template message
// -------------------------------------------------------------------
gSmartTemplate.notifyComposeBodyReady = function()
{   
    // Add template message
    this.smartTemplate.insertTemplate(true);
};



// -------------------------------------------------------------------
// A handler to switch identity
// -------------------------------------------------------------------
gSmartTemplate.loadIdentity = function(startup)
{   
    if (startup) {
        // Old function call
        this.oldFunc_LoadIdentity(startup);
    } else {
        // Check body modified or not
        var isBodyModified = gMsgCompose.bodyModified;
        if (!isBodyModified) {
            // Add template message
            this.smartTemplate.insertTemplate(false);
        }
        // Old function call
        this.oldFunc_LoadIdentity(startup);
        if (!isBodyModified && gMsgCompose.bodyModified)
          { gMsgCompose.editor.resetModificationCount(); }	// for TB bug?
    }
};



// -------------------------------------------------------------------
// common (preference)
// -------------------------------------------------------------------
gSmartTemplate.classPref = function(branch, useDefault)
{
    // -----------------------------------
    // Constructor
    var root = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);

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
        if (getWithBranch(idkey + "." + useDefault, true))	// Check common or not.
          { return getWithBranch(pref, def); }			// common preference
        else
          { return getWithBranch(idkey + "." + pref, def); }	// one's preference
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
gSmartTemplate.classMimeDecode = function()
{
    // -----------------------------------
    // Constructor
    var mimehdrpar = Components.classes["@mozilla.org/network/mime-hdrparam;1"].
                       getService(Components.interfaces.nsIMIMEHeaderParam);
    var cvtUTF8 = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
                    getService(Components.interfaces.nsIUTF8ConverterService);

    // -----------------------------------
    // Detect character set
    function detectCharset(str)
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
    };

    // -----------------------------------
    // MIME decoding.
    function decode(string, charset)
    {
        var decodedStr = "";

        if (/=\?/.test(string)) {
            // RFC2231/2047 encoding.
            // We need to escape the space and split by line-breaks,
            // because getParameter stops convert at the space/line-breaks.
            var array = string.split(/\s*\r\n\s*|\s*\r\s*|\s*\n\s*/g);
            for (var i = 0; i < array.length; i++) {
                decodedStr += mimehdrpar.
                                getParameter(array[i].replace(/%/g, "%%").replace(/ /g, "-%-"), null, charset, true, { value: null }).
                                  replace(/-%-/g, " ").replace(/%%/g, "%");
            }
        } else {
            // for Mailers has no manners.
            if (charset === "")
                charset = detectCharset(string);
            var skip = charset.search(/ISO-2022|HZ-GB|UTF-7/gmi) !== -1;
            decodedStr = cvtUTF8.convertStringToUTF8(string, charset, skip);
        }
        return decodedStr;
    };

    // -----------------------------------
    // Split addresses and change encoding.
    function split(addrstr, charset, format)
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
                               replace(/^\s*\"|\"\s*$/g, "");			// %to% / %to(name)%
              if (result != "" && withaddr)
                { result += address.replace(/.*<(\S+)>.*/g, " <$1>"); }		// %to%
          }
          if (result == "") {
              if (!withaddr)
                { result = address.replace(/.*<(\S+)@\S+>.*/g, "$1"); }		// %to(name)%
              else
                { result = address.replace(/.*<(\S+)>.*/g, "$1"); }		// %to% / %to(mail)%
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
    };

    // -----------------------------------
    // Public methods
    this.decode = decode;
    this.split = split;
};


// -------------------------------------------------------------------
// Escape to HTML character references
// -------------------------------------------------------------------
gSmartTemplate.escapeHtml = function(str)
{
    return str.replace(/&/gm, "&amp;").replace(/"/gm, "&quot;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/\n/gm, "<br>");
};


// -------------------------------------------------------------------
// Get day name and month name
// -------------------------------------------------------------------
gSmartTemplate.classCalIDateTimeFormatter = function(useLegacy)
{
    // -----------------------------------
    // Constructor
 try {
    if (useLegacy)
        throw "without lightning";
    // with Lightning
    var cal = Components.classes["@mozilla.org/calendar/datetime-formatter;1"].
                getService(Components.interfaces.calIDateTimeFormatter);
  }catch(ex){
    // without Lightning
    var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
                     getService(Components.interfaces.nsIStringBundleService);
    var bundle = strBndlSvc.createBundle("chrome://SmartTemplate4/locale/calender.properties");
    var cal = {
        dayName        : function(n){ return bundle.GetStringFromName("day." + (n + 1) + ".name"); },
        shortDayName   : function(n){ return bundle.GetStringFromName("day." + (n + 1) + ".short"); },
        monthName      : function(n){ return bundle.GetStringFromName("month." + (n + 1) + ".name"); },
        shortMonthName : function(n){ return bundle.GetStringFromName("month." + (n + 1) + ".short"); }
    };
  }

    function list() {
        var str = "";
        for (var i=0;i<7 ;i++){str+=(cal.dayName(i)  +"("+cal.shortDayName(i)  +")/");} str += "\n";
        for (var i=0;i<12;i++){str+=(cal.monthName(i)+"("+cal.shortMonthName(i)+")/");}
        return str;
    };

    // -----------------------------------
    // Public methods
    this.dayName        = cal.dayName;
    this.shortDayName   = cal.shortDayName;
    this.monthName      = cal.monthName;
    this.shortMonthName = cal.shortMonthName;
    this.list           = list;
};


// -------------------------------------------------------------------
// Regularize template message
// -------------------------------------------------------------------
gSmartTemplate.regularize = function(msg, type)
{
    var parent = gSmartTemplate;
    var idkey = document.getElementById("msgIdentity").value;
    var identity = Components.classes["@mozilla.org/messenger/account-manager;1"].
                     getService(Components.interfaces.nsIMsgAccountManager).
                       getIdentity(idkey);
    var messenger = Components.classes["@mozilla.org/messenger;1"].
                      createInstance(Components.interfaces.nsIMessenger);
    var mime = new this.classMimeDecode();
    
    if (type != "new") {
        // for Reply/Forward message
        var msgDbHdr = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI);
        var charset = msgDbHdr.Charset;
        var date = msgDbHdr.date;
        var hdr = new this.classGetHeaders(gMsgCompose.originalMsgURI);
        var tz = new function(date) {
            this.str = ("+0000" + date).replace(/.*([+-][0-9]{4,4})/, "$1");
            this.h = this.str.replace(/(.).*/, "$11") * (this.str.substr(1,1) * 10 + this.str.substr(2,1) * 1);
            this.m = this.str.replace(/(.).*/, "$11") * (this.str.substr(3,1) * 10 + this.str.substr(4,1) * 1);
        }(hdr.get("Date"));
    }
    
    function getSignature(rmdashes) {
        if (parent.signature != null){
            parent.sigIsDefined = true;
            if(rmdashes){
                if (parent.signature.firstChild.nodeValue == "-- ") {
                    parent.signature.removeChild(parent.signature.firstChild); //remove '-- '
                    parent.signature.removeChild(parent.signature.firstChild); //remove 'BR'
                    return parent.signature.innerHTML;
                }
            } else {
                return parent.signature.innerHTML;
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

    // reduce "{" and "}"
     msg = function(string) {
        // rw2h["reserved word"] = "header"
        var rw2h = new Array();
        function setRw2h() {		// setRw2h("header", "reserved word",,,)
            for(var i = 1; i < arguments.length; i++)
              { rw2h[arguments[i]] = arguments[0]; }
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
        // Check existence of a header related to the reserved word.
        function chkRw(str, rw, dmy) {
            try{
                return rw2h[rw] == "d.c." ? str : hdr.get(rw2h[rw] ? rw2h[rw] : rw) != "" ? str : "";
            } catch (e) {
                var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
                     getService(Components.interfaces.nsIStringBundleService);
                var bundle = strBndlSvc.createBundle("chrome://SmartTemplate4/locale/errors.properties");
                try{ //try writing an error to the Error Console using the localized string; if it fails write it in English
                    Components.utils.reportError(bundle.GetStringFromName("contextError1")+ " %" + rw + "% " + bundle.GetStringFromName("contextError2"));
                } catch (e) {
                    Components.utils.reportError("SmartTemplate4: The variable %" + rw + "% can't be used for NEW Messages!\nListing of usable variables see Help");
                }
                
                return "";
            } 
        }
        function chkRws(str, strInBrackets)
          { return strInBrackets.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw).replace(/^[^%]*$/, ""); }
        
        string = string.replace(/{([^{}]+)}/gm, chkRws);
        return string.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, chkRw);
    }(msg);

    // Convert PRTime to string
    function prTime2Str(time, type, timezone) {
            
        var tm = new Date();
        var fmt = Components.classes["@mozilla.org/intl/scriptabledateformat;1"].
                    createInstance(Components.interfaces.nsIScriptableDateFormat);
        var locale = parent.pref.getLocalePref();
        
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
        var cal = parent.cal;

        // Set %A-Za-z% to time of original message was sent.
        if (parent.whatIsX == parent.XisSent)
          { tm.setTime(date / 1000); }

        // for backward compatibility
        switch (s) {
          case "fromname":	s = "From";	f = "(name)";	break;
          case "frommail":	s = "From";	f = "(mail)";	break;
          case "toname":	s = "To";	f = "(name)";	break;
          case "tomail":	s = "To";	f = "(mail)";	break;
          case "ccname":	s = "Cc";	f = "(name)";	break;
          case "ccmail":	s = "Cc";	f = "(mail)";	break;
        }


        switch(s){
            case "datelocal":
            case "dateshort":
                if (parent.whatIsX == parent.XisToday){
                    s = prTime2Str(tm.getTime() * 1000, s, 0);
                    return parent.escapeHtml(s);
                }else{
                    s = prTime2Str(date, s, 0);
                    return parent.escapeHtml(s);
                }
            case "timezone":	
            case "date_tz":
                    var matches = tm.toString().match(/([+-][0-9]{4})/);
                    return parent.escapeHtml(matches[0]);
        }
        
        switch (s) {
        // for Common (new/reply/forward) message
          // own name
          case "ownname":	s = identity.identityName.replace(/\s*<.*/, "");	break;
          // own email address
          case "ownmail":	s = identity.email;					break;
          // today
          case "T":
          case "X":	return expand("%H%:%M%:%S%");			break;	// Time hh:mm:ss
          case "Y":	return "" + tm.getFullYear();			break;	// Year 1970...
          case "n":	return "" + (tm.getMonth()+1);			break;	// Month 1..12
          case "m":	return d02(tm.getMonth()+1);			break;	// Month 01..12
          case "e":	return "" + tm.getDate();			break;	// Day of month 1..31
          case "d":	return d02(tm.getDate());			break;	// Day of month 01..31
          case "k":	return "" + tm.getHours();			break;	// Hour 0..23
          case "H":	return d02(tm.getHours());			break;	// Hour 00..23
          case "l":	return "" + (((tm.getHours() + 23) % 12) + 1);	break;	// Hour 1..12
          case "I":	return d02(((tm.getHours() + 23) % 12) + 1);	break;	// Hour 01..12
          case "M":	return d02(tm.getMinutes());			break;	// Minutes 00..59
          case "S":	return d02(tm.getSeconds());			break;	// Seconds 00..59
          case "tz_name":    return tm.toString().replace(/^.*\(|\)$/g, "");    break; //time zone name
          case "sig":
            switch(f) {
                case "(1)": return getSignature(false);                 break;
                case "(2)": return getSignature(true);                  break;
                default:    return getSignature(false);                 break;
            } break;
          case "subject":
            switch(f) {
                case "(1)": return getSubject(false);                 break;
                case "(2)": return getSubject(true);                  break;
                default:    return getSubject(false);                 break;
            } break;
          case "newsgroup": return getNewsgroup();  break;  
          // name of day and month
          case "A":	return cal.dayName(tm.getDay());		break;	// locale day of week
          case "a":	return cal.shortDayName(tm.getDay());		break;	// locale day of week(short)
          case "B":	return cal.monthName(tm.getMonth());		break;	// locale month
          case "b":	return cal.shortMonthName(tm.getMonth());	break;	// locale month(short)
          case "p":
           switch (f) {
            case "(1)":	return tm.getHours() < 12 ? "a.m." : "p.m.";	break;	// locale am or pm
            case "(2)":	return tm.getHours() < 12 ? "A.M." : "P.M.";	break;	// locale am or pm
            case "(3)":
            default:	return tm.getHours() < 12 ? "AM" : "PM";	break;	// locale am or pm
           } break;
          case "dbg1":  return cal.list();				break;
          // Change time of %A-Za-z%
          case "X:=sent":	parent.whatIsX = parent.XisSent;	return "";
          case "X:=today":	parent.whatIsX = parent.XisToday;	return "";
          
        // any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
        default:
            var isStripQuote = RegExp(" "+s+" ", "i").test(
              " Bcc Cc Disposition-Notification-To Errors-To From Mail-Followup-To Mail-Reply-To Reply-To" +
              " Resent-From Resent-Sender Resent-To Resent-cc Resent-bcc Return-Path Return-Receipt-To Sender To ");
            if (isStripQuote)
              { s = mime.split(hdr.get(s), charset, f); }
            else
              { s = mime.decode(hdr.get(s), charset); }
            break;
        s = s.replace(/\r\n|\r|\n/g, ""); //remove line breaks from 'other headers'
        }
        return parent.escapeHtml(s);
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
    // Constructor
    var parent = gSmartTemplate;
    var orgQuoteHeaders = new Array();
    
    // -----------------------------------
    // Extract Signature
    // 
    function extractSignature(){
        var bodyEl = gMsgCompose.editor.rootElement;           
        var nodes = gMsgCompose.editor.rootElement.childNodes;
        parent.signature = null;
        parent.sigIsDefined = false;
        
        var pref = parent.pref;
        var idKey = document.getElementById("msgIdentity").value;
        
        for(var i = 0; i < nodes.length; i++) {
            if ( nodes[i].className == "moz-signature" ) {
                bodyEl.removeChild(nodes[i].previousElementSibling)//remove the preceding BR that TB always inserts
                parent.signature = bodyEl.removeChild(nodes[i-1]);
                break;
            }
        }
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
            orgQuoteHeaders.push(node);
            gMsgCompose.editor.deleteNode(node);
        }
        
    };
    function delDOMNodeAll(node)
    {
        if (node) {
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
        var   pref = parent.pref;
        var   lines = 0;
        if (pref.getCom("mail.identity." + idKey + ".reply_on_top", 1) == 1)
          { lines = 2; }

        function countLF(str) { return str.split("\n").length - 1; }

        switch (pref.getCom("mailnews.reply_header_type", 1)) {
          case 3:	// LFLF + author + separator + ondate + colon+LF
          case 2:	// LFLF + ondate + separator + author + colon+LF
            lines += countLF(pref.getCom("mailnews.reply_header_separator", ","));
            lines += countLF(pref.getCom("mailnews.reply_header_ondate", "(%s)"));
          case 1:	// LFLF + author + colon+LF
          default:	// Handle same as 1
            lines += countLF(pref.getCom("mailnews.reply_header_authorwrote", "%s wrote"));
            lines += countLF(pref.getCom("mailnews.reply_header_colon", ":"));
          case 0:	// LFLF + LF
            lines++;
            break;
        }

        // Delete original headers
        var rootEl = gMsgCompose.editor.rootElement;
        while (rootEl.firstChild && lines > 0) {
            if (rootEl.firstChild.nodeName != "#text")
              { lines--; }
            delDOMNodeTextOrBR(rootEl.firstChild);
        }
    };

    // -----------------------------------
    // Delete quote header(forward)
    //In compose with HTML, body is
    //  <BR><BR> <#text#(1041)> <TABLE(headers)> <#text# nodeValue=""> !<BR><BR>! <PRE> original-message
    //In compose with TEXT, body is
    //  <BR><BR> <#text#(1041)><BR> <#text# (headers)>!<BR><BR>! original-message
    //We need to remove tags until two BR tags appear consecutively.
    function delForwardHeader()
    {
        var bndl = Components.classes["@mozilla.org/intl/stringbundle;1"].
                     getService(Components.interfaces.nsIStringBundleService).
                       createBundle("chrome://messenger/locale/mime.properties");
        var header = bndl.GetStringFromID(1041);

        // Delete original headers
        var rootEl = gMsgCompose.editor.rootElement;
        while (rootEl.firstChild && rootEl.firstChild.nodeValue != header) {
            delDOMNodeTextOrBR(rootEl.firstChild);
        }
        var brcnt = 0;
        while (rootEl.firstChild && brcnt < 2) {
            if (rootEl.firstChild.nodeName == "BR")
              { brcnt++; }
            else
              { brcnt = 0; }
            delDOMNodeAll(rootEl.firstChild);
        }
    };

    // -----------------------------------
    // Remove template messages and Restore original quote headers
    function undoTemplate()
    {
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
        var pref = parent.pref;
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
            msg = parent.escapeHtml(msg);
            // Escape space, if compose is HTML
            if (gMsgCompose.composeHTML)
              { msg = msg.replace(/ /gm, "&nbsp;"); }
        }
        return parent.regularize(msg, type);
    };

    // -----------------------------------
    // Add template message
    function insertTemplate(startup)
    {
        var   pref = parent.pref;
        var   editor = GetCurrentEditor();
        var   msgComposeType = Components.interfaces.nsIMsgCompType;
        var   msgTmpl = null;
        var   idKey = document.getElementById("msgIdentity").value;
        var   branch = idKey + ".";

        // Switch account
        if (startup) {
            // Cleaer template
            clearTemplate();
        } else {
            // Check identity changed or not
            if (gCurrentIdentity && gCurrentIdentity.key == idKey) {
                return;
            }
            // Undo template messages
            undoTemplate();
        }
        
        extractSignature();

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
                    pref.getCom("mail.identity." + idKey + ".auto_quote", true))
                  { delReplyHeader(idKey); }
            }
            break;

          // forwarding message ----------------------------------
          //  (ForwardAsAttachment:3 / ForwardInline:4)
          case msgComposeType.ForwardAsAttachment:
          case msgComposeType.ForwardInline:
            if (pref.getWithIdkey(idKey, "fwd", false))
            {
                msgTmpl = getMsgTmpl("fwd", idKey, "fwdmsg", "fwdhtml", "fwdnbr");
                if (gMsgCompose.type == msgComposeType.ForwardAsAttachment)
                  { break; }
                if (pref.getWithIdkey(idKey, "fwdhead", false))
                  { delForwardHeader(); }
            }
            break;

          // do not proccesing -----------------------------------
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
        if (!parent.sigIsDefined && parent.signature != null){
            var pref = parent.pref;
            var sig_on_bottom = pref.getCom("mail.identity." + idKey + ".sig_bottom", true);
            var bodyEl = gMsgCompose.editor.rootElement;
            
            if (sig_on_bottom){
                bodyEl.appendChild(gMsgCompose.editor.document.createElement("br")); //replace the BR that was removed in extractSignature
                bodyEl.appendChild(parent.signature);
            } else {
                bodyEl.insertBefore(parent.signature, bodyEl.firstChild);
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
    // Public methods
    this.insertTemplate = insertTemplate;
};

// -------------------------------------------------------------------
// Initialize
// -------------------------------------------------------------------
gSmartTemplate.init = function()
{
    function smartTemplate_loadIdentity(startup){
        return gSmartTemplate.loadIdentity(startup);
    }
    gSmartTemplate.oldFunc_LoadIdentity = LoadIdentity;
    LoadIdentity = smartTemplate_loadIdentity;

    gSmartTemplate.pref = new this.classPref("extensions.smarttemplate.", "def");
    gSmartTemplate.smartTemplate = new this.classSmartTemplate();
    gSmartTemplate.cal = new this.classCalIDateTimeFormatter(true);
    
    // Time of %A-Za-z% is today(default)
    gSmartTemplate.whatIsX = this.XisToday;
	
};

gSmartTemplate.init();
