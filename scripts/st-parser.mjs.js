"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/

// this module will replace all objects in smartTemplate-overlay.js
// it actually deals with PARSING and REPLACING TEXTS.


import {Preferences} from "./st-prefs.mjs.js"; // we need this.
import {Util} from "./st-util.mjs.js";

function escapeHtml(str) {
  return str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/\n/gm, "<br>"); // remove quote replacements
}
  
export class Parser { 
  constructor() {
    this.InvalidReserverWords = []; // Util.displayNotAllowedMessage(reservedWord); after processing!
    this.mimeDecoder = { // from smartTemplate.overlay.js
      
    }
  }

  classGetHeaders(messageURI) { // from smartTemplate.overlay.js
    
  }

  clsGetAltHeader(msgDummyHeader) { // from smartTemplate.overlay.js
    
  }


  parseModifier(msg, composeType) { // from smartTemplate.overlay.js
    // STUB
    Util.logDebug("[issue 184] TO DO: overlay module - parseModifier");
  }

  async regularize(msg, composeType, isStationery, ignoreHTML, isDraftLike) { // from smartTemplate.overlay.js
          
    // make sure to use the licenser from main window, to save time.
    // [issue 150] removed nag screen
    async function getSubject(current) {
      if (await Preferences.isDebugOption("tokens.deferred")) debugger;
      util.logDebugOptional('regularize', 'getSubject(' + current + ')');
      let subject = '';
      if (current){
        subject = document.getElementById("msgSubject").value;
        return escapeHtml(subject); //escapeHtml for non UTF8 chars in %subject% but this don't work in this place for the whole subject, only on %subject(2)%
      }
      else {
        subject = mime.decode(hdr.get("Subject"), charset);
        if (hdr.composeType=="new" && !subject) {
          subject = util.wrapDeferredHeader("subject", subject, gMsgCompose.composeHTML);
          util.logDebugOptional("tokens.deferred",'regularize - wrapped missing header:\n' + subject);
        }
        return subject;
      }
    }

    function getNewsgroup() {
      util.logDebugOptional('regularize', 'getNewsgroup()');
      let acctKey = msgDbHdr.accountKey;
      //const account = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).getAccount(acctKey);
      //dump ("acctKey:"+ acctKey);

      //return account.incomingServer.prettyName;
      return acctKey;
    }

    // AG: I think this function is designed to break out a more specialized variable
    // such as %toname()% to a simpler one, like %To%
    function simplify(aString) {
      // Check existence of a header related to the reserved word.
      // str = smartTemplate token, e.g. %subject%
      // reserved words : these are words about which we know are not headers!
      function classifyReservedWord(str, reservedWord, param) {
        try {
          let removeParentheses = (arg) => {return arg ? arg.substr(1,arg.length-2) : ""},
              paramArray = removeParentheses(param).split(',');
          if (str!="%X:=today%") {
            Util.logDebugOptional("regularize","regularize.classifyReservedWord(" + str + ", " +  reservedWord + ", " + param || "" + ")");
          }
          let el = (typeof TokenMap[reservedWord]=='undefined') ? '' : TokenMap[reservedWord],
              isReserved = (el && el.startsWith("reserved")),
              isAddress = Util.isAddressHeader(el),
              addressHdr = isReserved ? "" : hdr.get(el ? el : reservedWord);
              
          if (isAddress && !isReserved) {
            // if the header can be found, check if it has parameters and would evaluate to be empty?
            if (addressHdr && param && param.length>2) {  // includes parameters e.g. (firstname)
              Util.logDebugOptional("regularize","check whether " + reservedWord + " " + param + " returns content...");
              let charset = gMsgCompose.compFields.characterSet,
                  headerValue = mime.split(addressHdr, charset, param);
              if (!headerValue) {
                Util.logDebugOptional("regularize","This %" + reservedWord + "% variable returned nothing.");
                addressHdr = "";
              }
            }
          }
          let s = (isReserved) ? str
                  : (addressHdr != "") ? str : ""; // check if header exists / is empty. this is for [[optional parts]]
          if (!el) {
            Util.logToConsole('Discarding unknown variable: %' +  reservedWord + '%')
          }
          else { // it's a reserved word, likely a header
            if (Preferences.isDebugOption("tokens.deferred")) debugger;
            if (typeof s =='undefined' || (s=="" && composeType=='new') || paramArray.includes("fwd")) {
              // if we are writing a NEW mail, we should insert some placeholders for resolving later.
              // do this also when using the "fwd" modifier as the initial address string may be empty or wrong.
              // wrap into <smarttemplate > for later deferral (works only in HTML)
              // [issue 153] the same probem also applies when forwarding and using the "fwd" switch.
              // use pink fields for new emails for the New Mail case - this var can not be used in...
              if (!isReserved && Util.checkIsURLencoded(str)) { // unknown header? make sure it is not an URL encoded thing
                s = str;
              }
              else {
                let isHTML = gMsgCompose.composeHTML
                if (isHTML)
                  SmartTemplate4.hasDeferredVars = true;
                s = Util.wrapDeferredHeader(str, el, isHTML, (composeType=='new')); // let's put in the reserved word as placeholder for simple deletion
              }
              Util.logDebugOptional("tokens.deferred",'classifyReservedWord - wrapped missing header:\n' + s);
            }
          }
          return s;
        } 
        catch (ex) {
          if (Preferences.isDebugOption("tokens.deferred")) debugger;
          // let's implement later resolving of variables for premium users:
          // throws "hdr is null"
          Util.logException("classifyReservedWord(" + reservedWord + ")", ex);
          this.InvalidReserverWords.push(reservedWord);
          Util.logDebug("[issue 184] TO DO - displayNotAllowedMessage later for " + reservedWord)
          // SmartTemplate4.Message.parentWindow = gMsgCompose.editor.document.defaultView;
          // Util.displayNotAllowedMessage(reservedWord);
          return "";
        }
      }

      function checkReservedWords(str, strInBrackets) {
        // I think this first step is just replacing special functions with general ones.
        // E.g.: %tomail%(z) = %To%(z)
        // also removes optional [[ CC ]] parts.
        // this replaces empty cc
        // problem if string contains ( or ) it won't work
        let isOptionalAB = (strInBrackets.includes("%identity") && strInBrackets.includes('addressbook')),
            generalFunction = strInBrackets.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, classifyReservedWord);

        // next: if it doesn't contain %, delete the string
        // preserve square brackets for all genuinely optional stuff
        // util.isAddressHeader(token) ?
        if (isOptionalAB)
          return str.replace(/^[^%]*$/, "");
        return generalFunction.replace(/^[^%]*$/, "");
      }
      
      /* [issue 184] TO DO LATER
      if ((composeType != "new") && (composeType != "snippets") && !gMsgCompose.originalMsgURI)  {
        util.popupAlert (util.ADDON_TITLE, "Missing message URI - SmartTemplates cannot process this message! composeType=" + composeType);
        return aString;
      }
      */

      Util.logDebugOptional('regularize', 'simplify()');

      // [AG] First Step: use the checkReservedWords function to process any "broken out" parts that are embedded in {  .. } pairs
      // aString = aString.replace(/{([^{}]+)}/gm, checkReservedWords);
      // removes [[ double brackets ]]  !!
      aString = aString.replace(/\[\[([^\[\]]+)\]\]/gm, checkReservedWords);

      // [AG] Second Step: use classifyReservedWord to categorize reserved words (variables) into one of the 6 classes: reserved, To, Cc, Date, From, Subject
      return aString.replace(/%([\w-:=]+)(\([^)]+\))*%/gm, classifyReservedWord);
    }

    SmartTemplate4.regularize.headersDump = '';
    Util.logDebugOptional('regularize','SmartTemplate4.regularize(' + msg +')  STARTS...');
    // var parent = SmartTemplate4;
    let idkey = Util.getIdentityKey(document),
        identity = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).getIdentity(idkey),
        messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger),
        mime = this.mimeDecoder;

    // THIS FAILS IF MAIL IS OPENED FROM EML FILE:
    let msgDbHdr = null,
        charset,
        hdr = null;
        
    if (gMsgCompose.originalMsgURI.indexOf(".eml")>0) { 
      let messageWindow = Services.wm.getMostRecentWindow("mail:messageWindow"),
          messageHeaderSink = messageWindow.messageHeaderSink;
      charset = gMsgCompose.compFields.characterSet;
      // with .eml file, use gExpandedHeaderView[hdrName] collection?
      // see also messagepane-loaded event in msgHeaderView
      // see also gMessageDisplay.displayExternalMessage
      // messenger.msgHdrFromURI(sourceUri)
      // messageHeaderSink.dummyMsgHeader  (has author, recipients, subject, deliveredTo, messageId)
      // messageHeaderSink.dummyMsgHeader.__proto__  has more fields, such as flags, datee, ccList, accountKey, listPost, mime2DecodedSubject() getter...)
      msgDbHdr =  messageHeaderSink.dummyMsgHeader;
      try {
        hdr = (composeType != "new") ? new this.clsGetAltHeader(msgDbHdr) : null;
      }
      catch(ex) {
        util.logException('fatal error - clsGetAltHeader() failed', ex);
      }
    }
    else {
      try {
        msgDbHdr = (composeType != "new") && (gMsgCompose.originalMsgURI) ? messenger.msgHdrFromURI(gMsgCompose.originalMsgURI) : null;
        if (msgDbHdr) {
          charset = (composeType != "new") ? msgDbHdr.Charset : null;
        }
        else
          charset = gMsgCompose.compFields.characterSet; // snippets
        
        // -- this line wasn't doing anything before "msgDbHdr.folder.charset; "
        //    defaulting to folder's charset would have been probably wrong anyway
        if (!charset && msgDbHdr) {
          charset = gMsgCompose.compFields.characterSet; // 
        }
      }
      catch (ex) {
        util.logException('messenger.msgHdrFromURI failed:', ex);
        // doesn't return a header but throws!
        charset = gMsgCompose.compFields.characterSet;
      }
      try {
        hdr = (composeType != "new") && (gMsgCompose.originalMsgURI) ? 
          new this.classGetHeaders(gMsgCompose.originalMsgURI) : 
          new this.clsGetAltHeader(gMsgCompose.compFields);
      }
      catch(ex) {
        util.logException('fatal error - classGetHeaders() failed', ex);
      }
    }
    // append composeType to hdr class.
    if(hdr) {
      hdr.composeType = composeType;
    }
    
    

    if (prefs.isDebugOption('regularize')) debugger;
    let date = (composeType != "new") && msgDbHdr ? msgDbHdr.date : null;
    if (composeType != "new" && msgDbHdr) {
      // for Reply/Forward message
      let tz = new function(date) {
        this.str = ("+0000" + date).replace(/.*([+-][0-9]{4,4})/, "$1");
        this.h = this.str.replace(/(.).*/, "$11") * (this.str.substr(1,1) * 10 + this.str.substr(2,1) * 1);
        this.m = this.str.replace(/(.).*/, "$11") * (this.str.substr(3,1) * 10 + this.str.substr(4,1) * 1);
      } (hdr ? hdr.get("Date") : msgDbHdr.date);
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
    addTokens("reserved", 
      "dbg1", "sig", "newsgroup", 
      "ownname", "ownmail", "mailTo",
      "deleteText", "replaceText", "deleteQuotedText", "replaceQuotedText", "deleteQuotedTags", "replaceQuotedTags",
      "matchTextFromSubject", "matchTextFromBody", "suppressQuoteHeaders",
      "cursor", "quotePlaceholder", "language", "spellcheck", "quoteHeader", "internal-javascript-ref",
      "messageRaw", "file", "style", "attach", "basepath",//depends on the original message, but not on any header
      "header.set", "header.append", "header.prefix, header.delete",
      "header.deleteFromSubject",
      "header.set.matchFromSubject", "header.append.matchFromSubject", "header.prefix.matchFromSubject",
      "header.set.matchFromBody", "header.append.matchFromBody", "header.prefix.matchFromBody", "logMsg",
      "conditionalText", "clipboard", "attachments"
    );
    // new classification for time variables only
    addTokens("reserved.time", 
      "Y", "y", "m", "n", "d", "e", "H", "k", "I", "l", "M", "S", "T", "X", "A", "a", "B", "b", "p",
      "datelocal", "dateshort", "dateformat", "date_tz", "tz_name", "cwIso",
      "X:=today", "X:=calculated", "X:=timezone");

    addTokens("reserved.optional", "identity"); // non-headers but support [[ optional syntax ]] (remove part if empty)

    // Reserved words which depend on headers of the original message.
    addTokens("To", "to", "toname", "tomail", "recipient");
    addTokens("Cc", "cc", "ccname", "ccmail");
    addTokens("Date", "X:=sent");
    addTokens("From", "from", "fromname", "frommail");
    addTokens("Subject", "subject");
    
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
      
      // duplicate for now
      function matchText(regX, fromPart) {
        try {
          let matchPart = msg.match(regX);
          if (matchPart) {
            if (prefs.isDebugOption('parseModifier')) debugger;
            for (let i=0; i<matchPart.length; i++) {
              util.logDebugOptional('parseModifier','matched variable: ' + matchPart);
              let patternArg = matchPart[i].match(   /(\"[^"].*?\")/   ), // get argument (includes quotation marks) ? for non greedy to match first closing doublequote
                  hdr,
                  extractSource = '',
                  rx = patternArg ? util.unquotedRegex(patternArg[0], true) : ''; // pattern for searching body

              hdr =	(gMsgCompose.originalMsgURI.indexOf(".eml")>0 && msgDbHdr) ?
                new SmartTemplate4.clsGetAltHeader(msgDbHdr) :
                new SmartTemplate4.classGetHeaders(gMsgCompose.originalMsgURI);
              switch(fromPart) {
                case 'subject':
                  if (!hdr) {
                    util.logToConsole("matchText() - matchTextFromSubject failed - couldn't retrieve header from Uri");
                    return "";
                  }
                  util.addUsedPremiumFunction('matchTextFromSubject');
                  let messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger),
                      charset = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).Charset;
                  extractSource = SmartTemplate4.mimeDecoder.decode(hdr.get("Subject"), charset);
                  util.logDebugOptional('parseModifier',"Extracting " + rx + " from Subject:\n" + extractSource);
                  break;
                case 'body':
                  let rootEl = gMsgCompose.editor.rootElement;
                  // we may still need to remove the div.moz-cite-prefix, let's look for a blockquote
                  if (rootEl.childNodes.length) {
                    for (let c=0; c<rootEl.childNodes.length; c++ ) {
                      let el = rootEl.childNodes[c];
                      if (el.tagName && el.tagName.toLowerCase() == 'blockquote') {
                        extractSource = el.innerText;  // quoted material
                      }
                    }
                  }
                  if (!extractSource)
                    extractSource = rootEl.innerText;
                  util.addUsedPremiumFunction('matchTextFromBody');
                  util.logDebugOptional('parseModifier',"Extracting " + rx + " from editor.root:\n" + extractSource);
                  break;
                default:
                  throw("Unknown source type:" + fromPart);
              }
              if (patternArg) {
                let groupArg = matchPart[i].match( /\"\,([0-9]+)/ ), // match group number
                    removePat = false;
                if (extractSource) {
                  let result = rx.exec(extractSource); // extract Pattern from source
                  if (result && result.length) {
                    let group = groupArg ? parseInt(groupArg[1]) : 0;
                    if (isNaN(group)) group = 0;
                    // retrieve the (..) group part from the pattern  - e..g matchTextFromBody("Tattoo ([0-9])",1) => finds "Tattoo 100" => generates "100" (one word)
                    util.logDebug('matchText(' + fromPart + ') - Replacing Pattern with:\n'
                                  + result[group]);
                    if (groupArg==null) { // third parameter is a replacement string
                      // check for string arg - after second comma: %header.append.matchFromSubject(hdr,regex,"replaceText"])%
                      let commaPos = matchPart[i].lastIndexOf(",\"");
                      if (commaPos>0) {
                        let thirdArg = matchPart[i].substring(commaPos), // search for end of string ")
                            endPos = thirdArg.indexOf("\")");
                        if (endPos>0) {
                          let txt = thirdArg.substring(2,endPos);
                          return txt;
                        }
                        else {
                          util.logToConsole("replaceText - last string parameter is not well formed.");
                          return ""; // not well formed
                        }
                      } 
                    }									
                    return result[group];
                  }
                  else
                    removePat = true;
                    return "";
                }
                else removePat = true;
                if(removePat) {
                  util.logDebug("pattern not found in " + fromPart + ":\n" + regX);
                  return "";
                }
              } 
            }
          } // matches loop
        }	
        catch	(ex) {
          util.logException('matchText(' + regX + ', ' + fromPart +') failed:', ex);
        }
        return "";
      }
      
      // modify a number of headers with either a string literal 
      // or a regex match (depending on matchFunction argument)
      // hdr: "subject" | "to" | "from" | "cc" | "bcc" | "reply-to"
      // cmd: "set" | "prefix" | "append" | "delete" | "deleteFromSubject"
      // argString: 
      // matchFunction: "" | "matchFromSubject" | "matchFromBody" 
      function modifyHeader(hdr, cmd, argString, matchFunction="") {
        const whiteList = ["subject","to","from","cc","bcc","reply-to","priority"],
              ComposeFields = gMsgCompose.compFields;
              
        if (prefs.isDebugOption('headers')) debugger;			
        util.addUsedPremiumFunction('header.' + cmd);
        let targetString = '',
            modType = '',
            argument = argString.substr(argString.indexOf(",")+1); 
        switch (matchFunction) {
          case "": // no matchFunction, so argString is literal
            if (cmd=="deleteFromSubject") {
              argument = argString.substr(1); // cut off opening parenthesis
            }
            if (argument.startsWith("\"")) { 
              // string wrapped in double quotes
              argument = argument.substr(1, argument.lastIndexOf("\"")-1);
            } else { 
              // literal, only remove the closing parentheses
              argument = argument.substr(0, argument.lastIndexOf(")"));
            }
            // [issue 183]
            if (argument=="clipboard") {
              argument = util.clipboardRead();
            }
            break;
          case "matchFromSubject":
          case "matchFromBody":
            let regX = new RegExp("%header." + cmd + "." + matchFunction + "\(.*\)%", "g");
            
            if (matchFunction == 'matchFromBody') {
              // Insert replacement from body of QUOTED email!
              argument = matchText(regX, 'body');
            }
            else  {
              // Insert replacement from subject line
              argument = matchText(regX, 'subject');
            }
            // if our match returns nothing, then do nothing (prevent from overwriting existing headers).
            if (argument == '') return '';
            break;
          default:
            util.logToConsole("invalid matchFunction: " + matchFunction);
            return '';
        }
        try {
          let isClobberHeader = false;
         
          util.logDebug("modifyHeader(" + hdr +", " + cmd + ", " + argument+ ")");
          if (whiteList.indexOf(hdr)<0) {
            // not in whitelist
            if (hdr.toLowerCase().startsWith("list"))
              isClobberHeader = true;
            else {
              util.logToConsole("invalid header - no permission to modify: " + hdr + 
                "\nSupported headers: " + whiteList.join(', '));
              return '';
            }
          }
          // get
          modType = 'address';
          switch (hdr) {
            case 'subject':
              targetString = ComposeFields.subject;
              modType = 'string';
              break;
            case 'recipient':
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
              if (isClobberHeader) {
                debugger;
                modType = 'string';
                targetString = gMsgCompose.compFields.getHeader(hdr) || "";
              }
              else modType = '';
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
                case 'delete': // remove a substring, e.g. header.delete(subject,"re: | Fwd: ")
                case 'deleteFromSubject':
                  let pattern = new RegExp(argument, "gm");
                  targetString = targetString.replace(pattern,"").replace(/\s+/g, ' '); // remove and then collapse multiple white spaces
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
              // replace newline characters with spaces and trim result!
              let subjectString = targetString.replace(new RegExp("[\t\r\n]+", 'g'), " ").trim();
              document.getElementById("msgSubject").value = subjectString;
              ComposeFields.subject = subjectString;
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
            case 'priority':
              const validVals = ["Highest", "High", "Normal", "Low", "Lowest"];
              let found = validVals.find(f => f.toLowerCase() == argument);
              if (found) {
                try {
                  util.logDebug("Setting priority to: " + found);
                  ComposeFields.priority = found;
                  updatePriorityToolbarButton(found);
                }
                catch(ex) {
                  util.logException('set priority ', ex);
                }
              }
              else 
                util.logDebug("Invalid Priority: '" + targetString + "'\n" 
                  + "Must be one of [" + validVals.join() +  "]");
              
              break;
            default:
              if (isClobberHeader) {
                if (targetString) {
                  util.logDebug("Adding clobbered header [" + hdr + "] =" + targetString);
                  gMsgCompose.compFields.setHeader(hdr, targetString);
                }
                else {
                  util.logDebug("Deleting clobbered header [" + hdr + "]");
                  gMsgCompose.compFields.deleteHeader(hdr);
                }
              }
          }
          // try to update headers - ComposeStartup() /  ComposeFieldsReady()
          // https://searchfox.org/comm-esr78/source/mail/components/compose/content/MsgComposeCommands.js#3546
          // https://searchfox.org/comm-esr78/source/mail/components/compose/content/MsgComposeCommands.js#2766
          // [issue 117] : setting from doesn't work
          if (hdr=='from' && ComposeFields.from && cmd=='set') {
            // %header.set(from,"postmaster@hotmail.com")%
            // %header.set(from,"<Postmaster postmaster@hotmail.com>")%
            // only accepts mail addresses from existing identities - aliases included
            let identityList = document.getElementById("msgIdentity"), // GetMsgIdentityElement(), FAILED
                fE = MailServices.headerParser.parseEncodedHeader(ComposeFields.from, null),
                fromAddress = (fE && fE.length) ? fE[0].email : ComposeFields.from, 
                fromName = (fE && fE.length) ? fE[0].name : null,
                idKey = util.getIdentityKeyFromMail(fromAddress); 
            
            if (!idKey) {
              util.logToConsole("Couldn't find an identity from the email address: <" + fromAddress + ">");
            }
            else {
              let curId = identityList.selectedItem.getAttribute('identitykey'),
                  currentHeader = MailServices.headerParser.parseEncodedHeader(identityList.selectedItem.getAttribute('value'))[0];
              
              // support - if we want to change the name:
              if (curId != idKey || 
                  fromName && currentHeader.name != fromName)
              {
                MakeFromFieldEditable(true);
                if (fromName) {
                  identityList.value = fromName + " <" + fromAddress + ">";
                }
                else
                  identityList.value = fromAddress;
              }
              LoadIdentity(true);
            }
            // there is a problem with dark themes - when editing the from address the text remains black.
            // identityList.setAttribute("editable", "false");
            // identityList.removeAttribute("editable");
          }
          else if (modType == 'address') {
            // [issue 22] we need to prep the addressing widget to avoid inserting an empty line on top
            // rebuild all addresses - for this we need to remove all [dummy] rows
            // except for the very first one.
            // [issue 98] - %header.set(to,"[addressee]")% no longer working
            //            - addressingWidget was retired!
            let adContainer = window.document.getElementById("toAddrContainer");
            if (adContainer) {
              let adPills = adContainer.querySelectorAll("mail-address-pill"); // first match if an address pill exists
              for (let pill of adPills) {
                adContainer.removeChild(pill);
              }
            }
            
            CompFields2Recipients(ComposeFields);
          }
        }
        catch(ex) {
          util.logException('modifyHeader()', ex);
        }
        return ''; // consume
      }
      
      // remove  (  ) from argument string
      function removeParentheses(arg) {
        return arg.substr(1,arg.length-2);
      }

      let originalToken = token;
      
      let tm = new Date(),
          d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); },
          expand = function(str) { return str.replace(/%([\w-]+)%/gm, replaceReservedWords); };
      if (!SmartTemplate4.calendar.bundle)
        SmartTemplate4.calendar.init(null); // default locale
      let cal = SmartTemplate4.calendar;
        
      // expensive calculations, only necessary if we deal with tokens that do time 
      if (typeof TokenMap[token]!='undefined' && (TokenMap[token] == 'reserved.time')) {
        // what if we go over date boundary? (23:59)
        let nativeUtcOffset = tm.getTimezoneOffset(), // UTC offset for current time, in minutes
            msOffset = (SmartTemplate4.whatIsHourOffset ? SmartTemplate4.whatIsHourOffset*60*60*1000 : 0)
                       + (SmartTemplate4.whatIsMinuteOffset ?  SmartTemplate4.whatIsMinuteOffset*60*1000 : 0),
            dayOffset = SmartTemplate4.whatIsDateOffset;
            
        if (SmartTemplate4.whatIsTimezone) {
          let forcedTz = util.getTimezoneOffset(SmartTemplate4.whatIsTimezone);
          msOffset = msOffset + forcedTz*60*60*1000 + nativeUtcOffset*60*1000;
          util.logDebug("Adding timezone offsets:\n" +
            "UTC Offset: " + nativeUtcOffset/(60) + " hour\n" +
            "Forced Timezone Offset: " + forcedTz + " hours\n" +
            "Total Offset = " + msOffset + " ms will be added to time");
        }
        
        // date is sent date when replying!
        // in new mails or if offset is applied we use dateshort
        if (msOffset || dayOffset || (util.getComposeType()=='new')) {
          if (token=="date") 
            token = "dateshort";
        }
        
        if (SmartTemplate4.whatIsX == SmartTemplate4.XisSent && !date) {
          // 
          alert( "There is no sent date. You cannot use the X:=Sent switch in this case!");
          SmartTemplate4.whatIsX = SmartTemplate4.XisToday;
        }
        
        // Set %A-Za-z% to time of original message was sent.
        if (SmartTemplate4.whatIsX == SmartTemplate4.XisSent)  {
          tm.setTime((date / 1000) + msOffset);
        }
        else
          tm.setTime(tm.getTime() + msOffset);
        
        // note: date variable comes from header!
        if (dayOffset) {
          tm.setDate(tm.getDate() + dayOffset);
        }
      }
      

      let debugTimeStrings = (prefs.isDebugOption('timeStrings'));
      if (!arg) arg='';
      try {
        // for backward compatibility
        switch (token) {
          case "fromname":  token = "From"; arg = "(name)";   break;
          case "frommail":  token = "From"; arg = "(mail)";   break;
          case "toname":    token = "To";   arg = "(name)";   break;
          case "tomail":    token = "To";   arg = "(mail)";   break;
          case "ccname":    token = "Cc";   arg = "(name)";   break;
          case "ccmail":    token = "Cc";   arg = "(mail)";   break;
          // [issue 151] universal placeholder for target recipient
          case "recipient":   
            {
              switch(util.getComposeType()) {
                case "new":
                  token = "to";
                  break;
                case "rsp":
                  let isReplyTo = (hdr && hdr.get("reply-to") != "");
                  token = isReplyTo ? "reply-to" : "from";
                  break;
                case "fwd":
                  token = "to";
                  // make sure to add / append "fwd" switch:
                  if (!arg)
                    arg = "(fwd)";
                  else {
                    arg = arg.substr(0,arg.length-1) + ",fwd)";
                  }
                  break;
              }
              
            }
            break;
        }

        if (prefs.isDebugOption('tokens') && token != "X:=today") debugger;
        let isUTC = SmartTemplate4.whatIsUtc, params;
        switch(token) {
          case "deleteText":            // return unchanged
          case "replaceText":           // return unchanged
          case "deleteQuotedText":      // return unchanged
          case "deleteQuotedTags":      // return unchanged
          case "replaceQuotedText":     // return unchanged
          case "replaceQuotedTags":     // return unchanged
          case "matchTextFromSubject":  // return unchanged
          case "matchTextFromBody":     // return unchanged
            return '%' + token + arg + '%';
          case "dateformat":
            if (debugTimeStrings) debugger;
            tm = new Date();
            const dateFormatSent = (SmartTemplate4.whatIsX == SmartTemplate4.XisSent && date);
            if (dateFormatSent)
              tm.setTime((date / 1000));
            // [issue 115] Erratic %datetime()% results when forcing HTML with Shift 
            arg = util.removeHtmlEntities(arg);
            let defaultTime = util.dateFormat(tm.getTime() * 1000, removeParentheses(arg), 0); // dateFormat will add offsets itself
            if (dateFormatSent)
              token = defaultTime;
            else
              token = util.wrapDeferredHeader(token + arg, defaultTime,  gMsgCompose.composeHTML, (util.getComposeType()=='new'));
            return token; 
          case "datelocal":
          case "dateshort":
            if (debugTimeStrings) debugger;
            if (SmartTemplate4.whatIsX == SmartTemplate4.XisToday) {
              tm = new Date(); // undo offset for this case.
              token = util.prTime2Str(tm.getTime() * 1000, token, 0);
              return finalize(token, escapeHtml(token));
            }
            else {
              token = util.prTime2Str(date, token, 0);
              return finalize(token, escapeHtml(token));
            }
          case "timezone":
          case "date_tz":
            let matches = tm.toString().match(/([+-][0-9]{4})/);
            return finalize(token, escapeHtml(matches[0]));
          // for Common (new/reply/forward) message
          case "ownname": // own name
            token = identity.identityName.replace(/\s*<.*/, "");
            break;
          case "ownmail": // own email address
            token = identity.email;
            break;
          case "attachments":  // e.g. attachments(list)  <ul><li> .. <li> .. <li>  </ul>
                               // attachments(lines)
                               // API: messages.listAttachments(messageId)
            return "list of attachment names...";
          // for Common (new/reply/forward) message          
          case "quoteHeader":  // is this useful when Stationery does not exist?
            return "<span class=\"quoteHeader-placeholder\"></span>";
          case "quotePlaceholder":  
            // move  the quote up to level n. use "all"
            let maxQuoteLevel = removeParentheses(arg),
                levelAtt = maxQuoteLevel ? (" quotelevel=" + maxQuoteLevel) : "";
            return "<blockquote type=\"cite\" class='SmartTemplate'" + levelAtt + ">\n"
                 + "</blockquote>";
            break;
          case "suppressQuoteHeaders":
            SmartTemplate4.PreprocessingFlags.suppressQuoteHeaders = true;
            return "";
          case "T": // today
          case "X":                               // Time hh:mm:ss
            return finalize(token, expand("%H%:%M%:%S%"));
          case "y":                               // Year 13... (2digits)
          case "Y":                               // Year 1970...
            if (debugTimeStrings) debugger;
            let year = isUTC ? tm.getUTCFullYear().toString() : tm.getFullYear().toString();
            if (token=="y")
              return finalize(token, "" + year.slice(year.length-2), "tm.getFullYear.slice(len-2)");
            return finalize(token, "" + year, "tm.getFullYear");
          case "n":                               // Month 1..12
          case "m":                               // Month 01..12
          case "B": 
          case "b":
            if (debugTimeStrings) debugger;
            let month = isUTC ? tm.getUTCMonth() : tm.getMonth();
            switch(token) {
              case "n":
                return finalize(token, "" + (month+1), "tm.getMonth()+1");
              case "m":
                return finalize(token, d02(month+1), "d02(tm.getMonth()+1)");
              case "B":
                return finalize(token, cal.monthName(month), "cal.monthName(" + month +")");   // locale month
              case "b":
                return finalize(token, cal.shortMonthName(month), "cal.shortMonthName(" + month +")");   // locale month (short)
            }
            break;
          case "e":                               // Day of month 1..31
          case "d":                               // Day of month 01..31
            if (debugTimeStrings) debugger;
            let day = isUTC ? tm.getUTCDate() : tm.getDate();
            switch(token) {
              case "e":
                return finalize(token, "" + day, "tm.getDate(" + day + ")");
              case "d":
                return finalize(token, d02(day), "d02(" + day + ")");
            }
            break;
          case "A":                               // name of day 
          case "a":
            if (debugTimeStrings) debugger;
            let weekday = tm.getDay();
            switch(token) {
              case "A":
                return finalize(token, cal.dayName(weekday), "cal.dayName(" + weekday + ")");       // locale day of week
              case "a":
                return finalize(token, cal.shortDayName(weekday), "cal.shortDayName(" + weekday + ")");  // locale day of week(short)
            }
            break;
          case "k":                               // Hour 0..23
          case "H":                               // Hour 00..23
          case "l":                               // Hour 1..12
          case "I":                               // Hour 01..12
          case "p":
            if (debugTimeStrings) debugger;
            let hour = isUTC ? tm.getUTCHours() : tm.getHours();
            switch(token) {
              case "k":
                return finalize(token, "" + hour, "tm.getHours()");
              case "H":
                return finalize(token, d02(hour), "d02(tm.getHours()");
              case "l":
                return finalize(token, "" + (((hour + 23) % 12) + 1));
              case "I":
                return finalize(token, d02(((hour + 23) % 12) + 1));
              case "p":
                switch (arg) {
                  case "(1)":
                    return finalize(token + "(1)", hour < 12 ? "a.m." : "p.m."); // locale am or pm
                  case "(2)":
                    return finalize(token + "(2)", hour < 12 ? "A.M." : "P.M."); // locale am or pm
                  case "(3)":
                  default:
                    return finalize(token, hour < 12 ? "AM" : "PM");     // locale am or pm
                }
            }
            break;
          case "M":                               // Minutes 00..59
            if (debugTimeStrings) debugger;
            let minute = isUTC ? tm.getUTCMinutes() : tm.getMinutes();
            return finalize(token, d02(minute), "d02(tm.getMinutes())");
          case "S":                               // Seconds 00..59
            return finalize(token, d02(tm.getSeconds()), "d02(tm.getSeconds())");
          case "tz_name":                         // time zone name (abbreviated) tz_name(1) = long form
            if (isUTC) return "(UTC)";
            return finalize(token, util.getTimeZoneAbbrev(tm, (arg=="(1)")), "getTimeZoneAbbrev(tm, " + (arg=="(1)") + ")");
          case "sig":
            if (arg && arg.indexOf('none')>=0) return "";
            let isRemoveDashes = arg ? (arg=="(2)") : false;
            
            // BIG FAT SIDE EFFECT!
            if (prefs.isDebugOption('composer')) debugger;
            let rawsig = util.getSignatureInner(SmartTemplate4.signature, isRemoveDashes),
                retVal = SmartTemplate4.smartTemplate.getProcessedText(rawsig, idkey, composeType, true) || "";
                
            util.logDebugOptional ('replaceReservedWords', 'replaceReservedWords(%sig%) = getSignatureInner(isRemoveDashes = ' + isRemoveDashes +')');
            util.logDebugOptional ('signatures', 'replaceReservedWords sig' + arg + ' returns:\n' + retVal);
            return retVal;
          case "subject":
            let current = (arg=="(2)"),
                ret = getSubject(current);
            if (!current)
              ret = escapeHtml(ret);
            return finalize(token, ret);
          case "newsgroup":
            return finalize(token, getNewsgroup());
          case "language":
            SmartTemplate4.calendar.init(removeParentheses(arg));
            return "";
          case "spellcheck":
            // use first argument to switch dictionary language.
            let lang = removeParentheses(arg);
            util.setSpellchecker(lang);
            return "";
          case "logMsg": // For testing purposes - add a comment line to email and error console
            util.logToConsole(removeParentheses(arg));
            return removeParentheses(arg)+"<br>"; // insert into email
          case "dbg1":
            return finalize(token, cal.list());
          case "cwIso": // ISO calendar week [Bug 25012]
            let offset = parseInt(arg.substr(1,1)); // (0) .. (6) weekoffset: 0-Sunday 1-Monday
            return finalize(token, "" + util.getIsoWeek(tm, offset));
          // Change time of %A-Za-z%
          case "X:=sent":
            if (debugTimeStrings) debugger;
            SmartTemplate4.whatIsX = SmartTemplate4.XisSent;
            SmartTemplate4.whatIsUtc = (arg && arg=='(UTC)');
            util.logDebugOptional ('replaceReservedWords', "Switch: Time = SENT - UTC = " + SmartTemplate4.whatIsUtc);
            return "";
          case "X:=today":
            if (debugTimeStrings) debugger;
            SmartTemplate4.whatIsX = SmartTemplate4.XisToday;
            SmartTemplate4.whatIsUtc = false;
            //util.logDebugOptional ('replaceReservedWords', "Switch: Time = NOW");
            return "";
          case "X:=calculated":  // calculated(numberOfDays)
            if (debugTimeStrings) debugger;
            params = removeParentheses(arg).split(',');
            let dateOffset = (params.length>0) ? parseInt(params[0] || "0" ) : 0,
                tOffset = (params.length>1) ? params[1] : "00:00";
            let hm = tOffset.split(':'),
                hourOffset = parseInt(hm[0]),
                minOffset = (hm.length>1) ? parseInt(hm[1]) : 0; // reset wit calculated(0)
            SmartTemplate4.whatIsDateOffset = dateOffset;
            SmartTemplate4.whatIsHourOffset = hourOffset;
            SmartTemplate4.whatIsMinuteOffset = minOffset;
            
            util.logDebugOptional ('timeStrings', "Setting date offset to " + dateOffset + " days, " + hourOffset + ":" + minOffset + " hours.");
            return "";
          case "X:=timezone":
            if (debugTimeStrings) debugger;
            params = removeParentheses(arg).split(',');
            SmartTemplate4.whatIsTimezone = params[0];
            return "";
          case "cursor":
            util.logDebugOptional ('replaceReservedWords', "%Cursor% found");
            return '<span class="st4cursor">&nbsp;</span>'; 
          case "internal-javascript-ref":
            return javascriptResults[/\((.*)\)/.exec(arg)[1]];
          // any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
          case "messageRaw": //returns the arg-th first characters of the content of the original message
            return hdr.content(arg?/\((.*)\)/.exec(arg)[1]*1:2048);
          case "attach":
            util.addUsedPremiumFunction('attach');
            attachFile(arg);
            return "";
          case "file":
          case "style":
            util.addUsedPremiumFunction(token);
            // do not process images that are returned - insertFileLink will already turn them into a DataURI
            // we are using pathArray to keep track of "where we are" in terms of relative paths
            let pathArray = SmartTemplate4.PreprocessingFlags.filePaths || [],
                pL = pathArray.length,
                // Next Step: if it's html file, this step can put a new path on the filePath stack.
                // if it contains file(img) then these may be relative to the parent path
                // and they will be resolved during this function call using the new stack
                // recursively:
                fileContents = insertFileLink(arg, composeType), 
                parsedContent;
            if (token=='style') {
              parsedContent = "<style type='text/css'>\n" + fileContents + "\n</style>\n";
            }
            else if (fileContents.startsWith("<img")) {
              parsedContent = fileContents;
            }
            else {
              // internally, we may have used another relative (sub)path
              // allow nested %file%  variables + relative paths
              parsedContent = SmartTemplate4.smartTemplate.getProcessedText(fileContents, idkey, composeType, true);
            }
            // if a path was added in the meantime, we can now pop it off the stack.
            if (pL<pathArray.length) pathArray.pop(); 
            return parsedContent;
          case "basepath":
            return insertBasePath(removeParentheses(arg));
          case "identity":
            /////
            let idArgs = arg.substr(1,arg.length-2).split(','),
                isAB = idArgs && idArgs.includes("addressbook");
            if ((identity.fullName || isAB) && identity.email ) {
              
              let fullId = 
                (isAB) ? identity.email :
                identity.fullName + ' <' + identity.email + '>';
              // we need the split to support (name,link) etc.
              token = mime.split(fullId, charset, arg, true); // disable charsets decoding!
              
              if(isAB && !token) { 
                // let's put in a placeholder so we can delete superfluous [[ lines ]] 
                // in regularize() after running replaceReservedWords
                util.logDebug("AB info[" + identity.email + "] not found: " + arg);
                token='<span class=st4optional args="' + arg + '" empty="true" />'; // we may need to delete commas from arg.
                return token; // we need this to be HTML
              }
              
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
          case "mailto": 
            if (arg) {
              let param = removeParentheses(arg);
              switch(param) {
                case 'body':
                  return "<span class='mailToBody'/>"; // placeholder for mailto body content
                default:
                  return "";
              }
            }
            break;
          case "conditionalText":
            util.addUsedPremiumFunction('conditionalText');
            return insertConditionalText(arg);
          case "clipboard":
            return util.clipboardRead();

          default:
            // [Bug 25904]
            if (token.indexOf('header')==0) {
              let args = arg.split(","),
                  modHdr = args.length ? args[0].toLowerCase().substr(1) : ''; // cut off "("
                  
              if (modHdr.startsWith("list")) modHdr = args[0].substr(1); // add case back.
              if (args.length<2 && token!="header.deleteFromSubject") {
                util.logToConsole("header modification - second parameter missing in command: %" + token + "%");
                return '';
              }
              let toks = token.split("."),
                  matchFunction = toks.length>2 ? toks[2] : ""; // matchFromSubject | matchFromBody
              switch (toks[1]) {
                case "set": // header.set
                  return modifyHeader(modHdr, 'set', arg, matchFunction);
                case "append":
                  return modifyHeader(modHdr, 'append', arg, matchFunction);
                case "prefix":
                  return modifyHeader(modHdr, 'prefix', arg, matchFunction);
                case "delete":
                  modifyHeader(modHdr, 'delete', arg, ''); // no match function - this works within the same header (e.g. subject)
                  return '';
                case "deleteFromSubject":
                  if (prefs.isDebugOption('parseModifier')) debugger;
                  modifyHeader('subject', toks[1], arg, ''); // no match function - this works within the same header (e.g. subject)
                  return '';
                default: 
                  util.logToConsole("invalid header command: " + token);
                  return '';
              }
            }
            let isStripQuote = util.isAddressHeader(token),
                theHeader = hdr.get(token),
                isFwdArg = false;
                
            if (util.getComposeType()=='fwd') {
              let fmt = util.splitFormatArgs(arg); // returns array of { field: "fwd", modifier: "" }
              // e.g. %to(firstname,fwd)%
              for (let i=0; i<fmt.length; i++) {
                if (fmt[i].field == 'fwd') {
                  isFwdArg = true;
                  break;
                }
              }
            } 
            
            // wrap variables that can't be resolved at the moment
            if (typeof theHeader == "undefined" || isFwdArg) {
              if (!arg) arg='';
              
              if (util.checkIsURLencoded(dmy))
                return dmy; // this is HTML: we won't escape it.
                
              token = util.wrapDeferredHeader(token + arg, (isStripQuote ? "" : "??"), gMsgCompose.composeHTML, (util.getComposeType()=='new'));
              return token; 
            }
            // <----  early exit for non existent headers, e.g. "from" in Write case
            else {
              // make sure empty header stays empty for this special case
              if (!theHeader && RegExp(" " + token + " ", "i").test(" Bcc Cc "))
                return '';
            }
            if (token=="date" && isUTC) {
              if (debugTimeStrings) debugger;
              try {
                let x = new Date(theHeader);
                theHeader = x.toUTCString();
              }
              catch(ex) {
                util.logException('Cannot convert date to UTC: ' + token, ex);
              }
            }
            let headerValue = isStripQuote ?
                mime.split(theHeader, charset, arg) :
                mime.decode(theHeader, charset);
            if (!headerValue && util.isAddressHeader(token)) {
              let newTok = '<span class=st4optional args="' + arg + '" empty="true" />';
              return newTok;
            }
            // allow HTML as to(link) etc. builds a href with mailto
            if (testHTML(headerValue, arg)) // avoid double escaping
              return headerValue;
            token = headerValue;
            break;
        }
      }
      catch(ex) {
        util.logException('replaceReservedWords(dmy, ' + token + ', ' + arg +') failed - unknown token?', ex);
        if (util.checkIsURLencoded(dmy))
          return dmy;
        token = util.wrapDeferredHeader(token + arg, "??", gMsgCompose.composeHTML);
        return token;
      }
      return escapeHtml(token);
    } // end of replaceReservedWords  (longest add-on function written ever)
    
    // insert a <base> tag as starting point for relative <img> paths 
    function insertBasePath(arg) {
      let filePath, html; 
      if (arg) {
        filePath = "file:///" + arg.replace(/\\/gm,'/');
      }
      else {
        filePath = ""; // get path from last %file% location!
      }
      if (!filePath.endsWith('/'))
        filePath += '/';
      html = "<base href=\"" + filePath + "\">";
      return html;
    }
    
    // [Bug 25871] %file()% function
    function insertFileLink(txt, composeType) {
      util.logDebug("insertFileLink " + txt);
      const { FileUtils } = ChromeUtils.import('resource://gre/modules/FileUtils.jsm'),
            isFU = FileUtils && FileUtils.File;
                  
      // determine file type:
      let html = "",
          arr = txt.substr(1,txt.length-2).split(','),  // strip parentheses and get optional params
          path = arr[0].replace(/"/g, ''),  // strip quotes
          type = path.toLowerCase().substr(path.lastIndexOf('.')+1),
          flags = SmartTemplate4.PreprocessingFlags,
          isHTML = false,
          currentPath = flags.filePaths ? 
                       (flags.filePaths.length ? flags.filePaths[flags.filePaths.length-1] : "") : 
                       ""; // top of stack
      /*                 
      let slash = currentPath.includes("/") ? "/" : "\\",
          noSlash = (slash=='/') ? "\\" : "/",
          fPart = currentPath.lastIndexOf(slash),
          newPath = "";
      if (fPart)
        newPath = currentPath.substr(0,fPart) + slash + path.substr(path[0]=='/' ? 1 : 0).replace(noSlash,slash);
        */
      let newPath = util.getPathFolder(currentPath, path);
                       
      if (type.match( /(png|apng|jpg|jpeg|jp2k|gif|tif|bmp|dib|rle|ico|svg|webp)$/))
        type = 'image';
      if (type.match(/(htm|html|xhtml|xml)$/)) 
        isHTML = true;
      util.logDebug("insertFile - type detected: " + type);
      // find out whether path is relative:
      let isAbsolute = util.isFilePathAbsolute(path);
      if (type=='image' || type=='css' && !isAbsolute) {
        let dbgCmdType = (type=="css") ? "%style%" : "%file%";
        util.logDebug(dbgCmdType + " - " + type + " path may be relative: " + path  +
          "\n flags.isFileTemplate = " + flags.isFileTemplate +
          "\n template path = " + currentPath || '?');
        let pathArray = path.includes("\\") ? path.split("\\") :  path.split("/");
        if (isFU) {
          // if (prefs.isDebugOption("fileTemplates")) debugger;
          try {
            // on Mac systems nsIDirectoryService key may NOT be empty!
            // https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Code_snippets/File_I_O
            if (!FileUtils.getFile("Home", pathArray, false)) {
              util.logDebug("Cannot find file. Trying to append to path of template.");
            }
          }
          catch (ex) {
            // new code for path of template - failed on Rob's Mac as unknown.
            // I think this is only set when a template is opened from the submenus!
            if (flags.isFileTemplate && currentPath) {
              let slash = newPath.includes("/") ? "/" : "\\",
                  pathArray = newPath.split(slash);
              try {
                let ff = new FileUtils.File(newPath);
                if (!ff.exists()){
                  util.logDebug("Failed to find file at: " + newPath);
                } 
                else {
                  util.logDebug("%file% Converted relative path: " + newPath);
                  path=newPath; // fix path and make absolute
                }
              }
              catch(ex) {
                debugger;
              }
            }
          }
        }
        else { // Postbox
          let LFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
              file = LFile.initWithPath(path);
          if (!file.exists()) {
            logDebug("file doesn't exist: " + path);
          }
        }
      }
      try {
        switch(type) {
          case 'htm':
          case 'html':
          case 'txt':
          case 'css':
            if (!isAbsolute) 
              path = newPath;
            //try our new method
            if (prefs.getMyBoolPref("vars.file.fileTemplateMethod")) {
              let tmpTemplate = SmartTemplate4.fileTemplates.retrieveTemplate(
                {
                  composeType: composeType, 
                  path: path, 
                  label: "data inserted from " + (type=='css') ? "%style%" : "%file%"
                }
              );
              if (!tmpTemplate.failed) {
                html = tmpTemplate.HTML;
                if (!html)
                  html = tmpTemplate.Text;
              }
            }
            if (!html) {
              // OLD Method
              // find / load file and expand?
              let data = "",
                  //read file into a string so the correct identifier can be added
                  fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
                  cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream),
                  countRead = 0;
              // let sigFile = Ident.signature.QueryInterface(Ci.nsIFile); 
              try {
                let localFile = isFU ?   // not in Postbox
                                new FileUtils.File(path) :
                                Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
                    str = {};
                util.logDebug("localFile.initWithPath(" + path + ")");
                if (!isFU)
                  localFile.initWithPath(path);
                
                fstream.init(localFile, -1, 0, 0);
                /* sigEncoding: The character encoding you want, default is using UTF-8 here */
                let encoding = (arr.length>1) ? arr[1] : 'UTF-8';
                util.logDebug("initializing stream with " + encoding + " encoding…");
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
            }
            // if we compose in html and file is txt we need to replace all line breaks with <br>
            if (type=='txt') {
              html = html.replace(/(?:\r\n|\r|\n)/g, '<br>');
            }
            if (type=='css') {
              
            }
            else {
              flags.isFileTemplate = true;
              // prepare for using relative paths from here...
              // assume we are within a template, to make matching subsequent relative paths possible.
              // should work for using %file(template.html)% in a SmartTemplate.
              if (!flags.filePaths) 
                flags.filePaths = [];     // make an array so we can nest %file% statements to make fragments
              flags.filePaths.push(path);
            }
            break;
          case 'image':
            let alt = (arr.length>1) ? 
                      (" alt='" + arr[1].replace("'","").replace(/\"/gm, "") + "'") :    // don't escape this as it should be pure text. We cannot accept ,'
                      "",
                filePath;
            if (!isAbsolute && currentPath) {
              //
              util.logDebug("insert image - adding relative path " + path + "\nto " + currentPath);
              let lastSlash = currentPath.lastIndexOf("\\");
              if (lastSlash<0) lastSlash = currentPath.lastIndexOf("/");
              path = currentPath.substr(0, lastSlash + (path.startsWith('/') ? 0 : 1)) + path;
            }
            filePath = "file:///" + path.replace(/\\/gm,'/');
            // change to data URL
            filePath = util.getFileAsDataURI(filePath)
            html = "<img src='" + filePath + "'" + alt + " >";
            break;
          default:
            alert('unsupported file type in %file()%: ' + type + '.');
            html='';
            break;
        }
      }
      catch(ex) {
        var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
        
        util.logException("FAILED: insertFileLink(" + txt + ") \n You may get more info if you enable debug mode.",ex );
        Services.prompt.alert(null, "SmartTemplates", "Something went wrong trying to read a file: " + txt + "\n" +
          "Please check Javascript error console for detailed error message.");
      }
      return html;
    } 
    
    // [Bug 26552] find the file and add it to the attachments pane
    function attachFile(args) {
      return;
      const util = SmartTemplate4.Util,
            Ci = Components.interfaces,
            Cc = Components.classes,
            {OS} = ChromeUtils.import("resource://gre/modules/osfile.jsm", {});
              
      // msgcompose was msgcomposeWindow
      let arr = args.substr(1,args.length-2).split(','),  // strip parentheses and get optional params
          pathUri = arr[0],
          composerWin = Cc["@mozilla.org/appshell/window-mediator;1"]
            .getService(Ci.nsIWindowMediator).getMostRecentWindow("msgcompose") || window,
          attachments=[];
      try {			
        let FileUtils = Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils;
        
        if (!FileUtils) {
          alert("No FileUtils in this platform - %attach% is not supported. Are you on an old version of " + util.Application + "?");
          return;
        }
        let localFile = new FileUtils.File(pathUri);				
        
        if (!localFile.exists()) {
          let wrn = util.getBundleString("st.fileFunction.notExists");
          alert(wrn.replace("{0}", "'attachFile()'") + "\n" + pathUri);
          return;
        }
        
        let contentType = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService).getTypeFromFile(localFile),
            attachment = Cc["@mozilla.org/messengercompose/attachment;1"].createInstance(Ci.nsIMsgAttachment);
        // from https://dxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#2721
        // if (nsFile instanceof Ci.nsIFile) {..}
        attachment.url = "file://" + localFile.path;
        attachment.contentType = contentType;
        attachment.name = localFile.leafName;
        
        attachments = [attachment]; // make a 1 member array of nsIMsgAttachment
        composerWin.AddAttachments(attachments);
        
        
      }
      catch(ex) {
        util.logException("attachFile(" + pathUri + ")", ex);
      }
    }
    
    function insertConditionalText(rawArgs) {
      if (rawArgs === null || rawArgs.length == 0) {
        return "";
      }
      // get arguments such as: (forwardMode,"text1","text2"), args[1] - is a "switching" parameter
      let args = rawArgs.match( /\( *(\w+) *\,.*?\)/ );
      if (!args) {
        return "";
      }
      const patternArgs = [...args[0].matchAll( /\"(.*?)\"/g )]; // get arguments (excludes quotation marks) ? non greedy
      if (!patternArgs)
        return "";

      switch(args[1]) {
        case 'forwardMode':    
          if (util.getComposeType()!='fwd')
            return "";
          return util.isComposeTypeIsForwardInline() ? patternArgs[0][1] : (patternArgs.length > 1 ? patternArgs[1][1] : "");
        default:
          return "";
      }
    }
    
    // sandboxing strings still works in 68.1.2, not sure when they will deprecate it...
    let supportEval = prefs.getMyBoolPref('allowScripts'), // disabled and hidden by default.
        sandbox,
        javascriptResults = [];
      
    if (supportEval) {
      // [Bug 25676]	Turing Complete Templates - Benito van der Zander
      // https://quickfolders.org/bugzilla/bugs/show_bug.cgi@id=25676
      // we are allowing certain (string) Javascript functions in concatenation to our %variable%
      // as long as they are in a script block %{%    %}%
      // local variables can be defined within these blocks, only 1 expression line is allowed per block,
      // hence best to wrap all code in (function() { ..code.. })()  
      // function must return "" in order not to insert an error
      function replaceJavascript(dmy, script) {
        util.logDebugOptional('sandbox', 'replaceJavascript(' + dmy +', ' + script +')');
        if (!sandbox) {
          sandbox = new Cu.Sandbox(
            window,
            {
            //  'sandboxName': aScript.id,
              'sandboxPrototype': window,
              'wantXrays': true
            });
            
          //useful functions (especially if you want to change the template depending on the received message)
          sandbox.choose = function(a){ return a[Math.floor(Math.random()*a.length)] };
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
            if (prefs.isDebugOption('sandbox')) debugger;
            let retVariable = replaceReservedWords("", name, arg || "");
            util.logDebugOptional('sandbox','variable(' + name + ', ' + arg +')\n'
              + 'returns: ' + retVariable);
            return retVariable;
          };
          // eventually, "new Function()" will be deprecated. Don't exactly know when.
          var implicitNull = {},
              stringFunctionHack = new Function(),
          // overloading our strings using sandbox
              props = ["charAt", "charCodeAt", "concat", "contains", "endsWith", "indexOf", "lastIndexOf", 
                       "localeCompare", "match", "quote", "repeat", "replace", "search", "slice", "split", 
                       "startsWith", "substr", "substring", "toLocaleLowerCase", "toLocaleUpperCase", "toLowerCase", 
                       "toUpperCase", "trim", "trimLeft", "trimRight", "containsSome", "count",
                       "includes"];
          for (let i=0; i<props.length; i++) {
            let s = props[i];
            stringFunctionHack[s] = sandbox.String.prototype[s];
          }
          stringFunctionHack.valueOf = function(){ return this(implicitNull); };
          stringFunctionHack.toString = function(){ return this(implicitNull); };
            
          for (let name in TokenMap) {
            sandbox[name] = (function(aname) {
              return function(arg){
                if (prefs.isDebugOption('sandbox')) debugger;
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
            // Complex hack so that sandbox[name] is a function that can be called with 
            // (sandbox[name]) and (sandbox[name](...))
            sandbox[name].__proto__ = stringFunctionHack; 
            // does not work:( sandbox[name].__defineGetter__("length", (function(aname){return function(){return sandbox[aname].toString().length}})(name));
          }  // for
        };  // (!sandbox)
        //  alert(script);
        var x;
        try {
          if (prefs.isDebugOption('sandbox')) debugger;
          x = Cu.evalInSandbox("(" + script + ").toString()", sandbox); 
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
      //but cannot insert result now, or it would be double html escaped, so insert them later
      msg = msg.replace(/%\{%((.|\n|\r)*?)%\}%/gm, replaceJavascript); // also remove all newlines and unnecessary white spaces
    }
    
    /*  deprecating bs code. */
    if (prefs.getMyBoolPref('xtodaylegacy')) {
      //Now do this chaotical stuff:
      //Reset X to Today after each newline character
      //except for lines ending in { or }; breaks the omission of non-existent CC?
      msg = msg.replace(/\n/gm, "%X:=today%\n");
      //replace this later!!
      // msg = msg.replace(/{\s*%X:=today%\n/gm, "{\n");
      // msg = msg.replace(/}\s*%X:=today%\n/gm, "}\n");
      msg = msg.replace(/\[\[\s*%X:=today%\n/gm, "[[\n");
      msg = msg.replace(/\]\]\s*%X:=today%\n/gm, "]]\n");
    }
    
    
    // ignoreHTML, e,g with signature, lets not do html processing
    if (!ignoreHTML) {
      // for Draft, let's just assume html for the moment.
      if (isDraftLike) {
        msg = msg.replace(/( )+(<)|(>)( )+/gm, "$1$2$3$4");
        if (SmartTemplate4.pref.isReplaceNewLines(idkey, composeType, false))   // [Bug 25571] let's default to NOT replacing newlines. Common seems to not save the setting!
        { 
            msg = msg.replace(/>\n/gm, ">").replace(/\n/gm, "<br>"); 
        }
        //else
        //	{ msg = msg.replace(/\n/gm, ""); }
      }
      else {
        msg = escapeHtml(msg);
        // Preserve all spaces of plaintext template, if compose is HTML 
        // - this should be a global option because it is ugly.
        // imho it shouldn't do this!
        if (gMsgCompose.composeHTML)
          { msg = msg.replace(/ /gm, "&nbsp;"); }
      }
    }
    // replace round brackets of bracketMail() with <> - using the second (=inner) match group
    // this makes it possible to nest functions!
    // [Bug 26100] bracketMail wasn't working in optional [[ cc ]] block.
    msg = msg.replace(/(bracketMail\(([^)]*))\)/gm, "bracketMail\<$2\>");
    msg = msg.replace(/(bracketName\(([^)]*))\)/gm, "bracketName\<$2\>");
    // AG: remove any parts ---in curly brackets-- (replace with  [[  ]] ) optional lines
    msg = simplify(msg);	
    if (prefs.isDebugOption('regularize')) debugger;
    msg = msg.replace(/%([a-zA-Z][\w-:=.]*)(\([^%]+\))*%/gm, replaceReservedWords); // added . for header.set / header.append / header.prefix
                                                                            // replaced ^) with ^% for header.set.matchFromSubject
                                                                            // added mandatory start with a letter to avoid catching  encoded numbers such as %5C
                                                                            // [issue 49] only match strings that start with an ASCII letter. (\D only guarded against digits)
    
    // nuke optional stuff wrapped in double brackets [[ %identity(addressbook,..)% ]]
    msg = msg.replace(/\[\[[^\[]+class=st4optional[^\]]+\]\]/gm, '') ;
    // nuke remaining double brackets.
    msg = msg.replace(/\[\[([^\[\]]+)\]\]/gm, '$1') ;
      
      
    if (supportEval) {
      try {
        if (sandbox && Cu.nukeSandbox) 
          Cu.nukeSandbox(sandbox);  
      }
      catch (ex) {
        util.logException("Sandbox not nuked.", ex);
      }
    }

    // dump out all headers that were retrieved during regularize  
    util.logDebugOptional('headers', SmartTemplate4.regularize.headersDump);
    util.logDebugOptional('regularize',"SmartTemplate4.regularize(" + msg + ")  ...ENDS");
    return msg;
  }

  // -----------------------------------
  // Get processed text from template
  async getProcessedText(templateText, idKey, info, ignoreHTML, flags) 	{
    let composeType = info.composeType;
    let composeDetails = info.composeDetails;
    if (!templateText) return "";

    let isStationery = false;
    Util.logDebugOptional('functions.getProcessedText', 'START =============  getProcessedText()   ==========');
    Util.logDebugOptional('functions.getProcessedText', 'Process Text:\n' +
                                         templateText + '[END]');
    
    Util.logToConsole("[issue 184] getProcessedText - to do: IMPLEMENT SmartTemplates.calendar.init()");
    // SmartTemplates.calendar.init(); // set for default locale
    let isDraftLike = !composeType 
      || flags.isFileTemplate
      || Preferences.identityPrefs.isUseHtml(idKey, composeType, false); // do not escape / convert to HTML
    let regular = await regularize(templateText, 
        composeType, 
        isStationery, 
        ignoreHTML, 
        isDraftLike);
    
    // now that all replacements were done, lets run our global routines to replace / delete text, (such as J.B. "via Paypal")
    regular = parseModifier(regular, composeType); // run global replacement functions (deleteText, replaceText)
    
    // [Bug 26364] Inline Images are not shown.
    // fix DataURLs from other template (Stationery)
    // This won't work if there is no "file:\\\" portion given (relative path / current folder not supported)
    // we can fix the Data urls for file:/// images now
    // assume the URL is terminated by a single quote, double quote or &gt;
    const Frex = new RegExp("file:\/\/\/[^\"\'\>]*", "g");
    regular = regular.replace(Frex,   // /file:\/\/\/[^\"\'\>]*/g
      function(match) {
        Util.logDebugOptional('composer', 'Replacing image file as data: ' + match);
        return Util.getFileAsDataURI(match);
      }
    );
    
    // find & fix relative <img> paths:
    const Irex = new RegExp(/(<img[^>]+src=[\"'])([^"'>]+)([\"'][^>]*>)/, "g"); // make 3 groups, g2=path
    let currentPath = flags.filePaths ? 
                       (flags.filePaths.length ? flags.filePaths[flags.filePaths.length-1] : "") : 
                       ""; // top of stack
        
    regular = regular.replace(Irex,   // /file:\/\/\/[^\"\'\>]*/g
      function(match, g1, g2, g3) {
        // Util.logDebugOptional('composer', 'Replacing image file as data: ' + match);
        if (!Util.isFilePathAbsolute(g2)) {
          if (currentPath) {
            let newP = Util.getPathFolder(currentPath, g2);
            if (newP) {
              let startQuote = g1 ? g1[g1.length-1] : "",  // does source start with (double / single) quote mark?  <img src=\"
                  endQuote =   g1 ? g3[0] : "";
              Util.logDebug("replacing relative img path: " + newP + "…");
              let filePath = "file:///" + newP.replace(/\\/gm,'/')
              try {
                let dataUrl = Util.getFileAsDataURI(filePath);
                if (dataUrl) {
                  return g1 + dataUrl + g3;
                }
                else
                  Util.logDebug("Could not resolve image path! Returning unchanged img tag.");
              }
              catch(ex) {
                Util.logException(ex, "Failed to read image file " + filePath);
              }
            }
            else {
              Util.logDebug("Could not convert relative path: " + g2)
            }
          }
        }
        return match;
      }
    );
    
    Util.logDebugOptional('functions.getProcessedText','regular:\n' + regular);		
    Util.logDebugOptional('functions.getProcessedText','=============  getProcessedText()   ========== END');
    return regular;
  }

}