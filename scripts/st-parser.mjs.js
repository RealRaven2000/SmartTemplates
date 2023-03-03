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
  constructor(info) {
    this.info = info;
    this.InvalidReservedWords = []; // Util.displayNotAllowedMessage(reservedWord); after processing!
    this.mimeDecoder = { // from smartTemplate.overlay.js
      MimePrefs: {
        defaultCharset: null,
        defaultFormat : null,
        debug: false,
        nameDelimiter: "",
        guessFromMail: false,
        extractNameFromParentheses: true,
        resolveAB: false,
        resolveAB_preferNick: false
      },
      allAddressBooks: null,
      init: async function() {
        this.MimePrefs.defaultCharset = await Preferences.getMyStringPref ("defaultCharset");
        this.MimePrefs.defaultFormat = await Preferences.getMyStringPref("mime.defaultFormat");
        this.MimePrefs.debug = await Preferences.isDebugOption("mime.split");
        this.MimePrefs.nameDelimiter = await Preferences.getMyStringPref("names.delimiter");
        this.MimePrefs.guessFromMail = await Preferences.getMyBoolPref("names.guessFromMail");
        this.MimePrefs.extractNameFromParentheses = await Preferences.getMyBoolPref("names.extractNameFromParentheses");
        this.MimePrefs.resolveAB = await Preferences.getMyBoolPref("mime.resolveAB");
        this.MimePrefs.resolveAB_preferNick = await Preferences.getMyBoolPref("mime.resolveAB.preferNick");
        this.MimePrefs.resolveAB_displayName = await Preferences.getMyBoolPref("mime.resolveAB.displayName");
        this.MimePrefs.resolveAB_removeEmail = await Preferences.getMyBoolPref("mime.resolveAB.removeEmail");
        this.MimePrefs.firstLastSwap = await Preferences.getMyBoolPref("firstLastSwap");
        this.MimePrefs.namesCapitalize = await Preferences.getMyBoolPref("names.capitalize");
        this.MimePrefs.namesQuoteIfComma = await Preferences.getMyBoolPref("names.quoteIfComma");
        this.MimePrefs.mailSuppressLink = await Preferences.getMyBoolPref("mail.suppressLink");
        // returns array of AddressBookNode
        this.allAddressBooks = await messenger.addressBooks.list(true);
      },
      // -----------------------------------
      // Detect character set
      // jcranmer: this is really impossible based on such short fields
      // see also: hg.mozilla.org/users/Pidgeot18_gmail.com/patch-queues/file/cd19874b48f8/patches-newmime/parser-charsets
      //           http://encoding.spec.whatwg.org/#interface-textdecoder
      //           
      detectCharset: function(str, supressDefault=false) {
        let charset = "";
         // not supported                  
         // #    RFC1555 ISO-8859-8 (Hebrew)
         // #    RFC1922 iso-2022-cn-ext (Chinese extended)
        let encodedCharset = str.match(/=\?([^\?]*)\?/);
        if (encodedCharset.length>1) {
          // matchgroup 1 is the charset! 
          charset = encodedCharset[1];
        }

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
        if (!charset && !supressDefault) {
          charset = this.MimePrefs.defaultCharset || "";  // should we take this from Thunderbird instead?
        }
        Util.logDebugOptional('mime','mimeDecoder.detectCharset guessed charset: ' + charset +'...');
        return charset;
      },

      // -----------------------------------
      // MIME decoding.
      decode: function (theString, charset) {
        let decodedStr = "";

        try {
          if (/=\?/.test(theString)) {
            // https://en.wikipedia.org/wiki/MIME#Encoded-Word
            // RFC2231/2047 encoding.
            // We need to escape the space and split by line-breaks,
            // because getParameter stops convert at the space/line-breaks.
            // => some russian mail servers use tab character as delimiter
            //    some even use a space character between 2 encoding blocks
            theString = theString.replace ("?= =?", "?=\n=?"); // space problem
            let array = theString.split(/\s*\r\n\s*|\s*\r\s*|\s*\n\s*|\s*\t\s*/g);
            // detect charset from the string and override if necessary
            let customCharset = that.mimeDecoder.detectCharset(theString, true) || charset; 
            // https://searchfox.org/mozilla-central/source/netwerk/mime/nsIMIMEHeaderParam.idl
            for (let i = 0; i < array.length; i++) {
              let aHeaderVal = array[i].replace(/%/g, "%%").replace(/ /g, "-%-");
              decodedStr += 
                this.headerParam
                  .getParameter(
                    aHeaderVal,     // header string 
                    null,           // name of a MIME header parameter
                    customCharset,  // fallback charset
                    true,           // aTryLocaleCharset
                    { value: null }
                  ).replace(/-%-/g, " ").replace(/%%/g, "%");
            }
          }
          else {
            Util.logDebug("Mailer has no manners, trying to decode string: " + theString);
            decodedStr = decodeURIComponent(escape(theString));
            Util.logDebug("...decoded string: " + decodedStr);
          }
        }
        catch(ex) {
          Util.logDebugOptional('mime','mimeDecoder.decode(' + theString + ') failed with charset: ' + charset
              + '...\n' + ex);
          return theString;
        }
        return decodedStr;
      } ,

      // -----------------------------------
      // Split addresses and change encoding.
      // addrstr - comma separated string of address-parts
      // charset - character set of target string (probably silly to have one for all)
      // format - list of parts for target string: name, firstName, lastName, mail, link, bracketMail(), initial
      split: async function (addrstr, charset, format, bypassCharsetDecoder)	{
        let that = this;
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
        let mapLegacyCardStruct = new Map([
          ['nickname', "NickName"],
          ['additionalmail', "SecondEmail"],
          ['chatname', "ChatName"],
          ['workphone', "WorkPhone"],
          ['homephone', "HomePhone"],
          ['fax', "FaxNumber"],
          ['pager', "PagerNumber"],
          ['mobile', "CellularNumber"],
          ['private.address1', "HomeAddress"],
          ['private.address2', "HomeAddress2"],
          ['private.city', "HomeCity"],
          ['private.state', "HomeState"],
          ['private.country', "HomeCountry"],
          ['private.zip', "HomeZipCode"],
          ['work.title', "JobTitle"],
          ['work.department', "Department"],
          ['work.organization', "Company"],
          ['work.address1', "WorkAddress"],
          ['work.address2', "WorkAddress2"],
          ['work.city', "WorkCity"],
          ['work.state', "WorkState"],
          ['work.country', "WorkCountry"],
          ['work.zip', "WorkZipCode"],          
          ['work.webpage', "WebPage1"],
          ['other.custom1', "Custom1"],
          ['other.custom2', "Custom2"],
          ['other.custom3', "Custom3"],
          ['other.custom4', "Custom4"],
          ['other.custom5', "Custom5"],
          ['other.notes', "Notes"]
          
        ]);
                
        
        
        function getEmailAddress(a) {
          return a.replace(/.*<(\S+)>.*/g, "$1");
        }

        function isLastName(format) { return (format.search(/^\(lastname[,\)]/, "i") != -1); };
        // argType = Mail or Name to support bracketMail and bracketName
        function getBracketAddressArgs(format, argType) { 
		      //   /bracketMail\[(.+?)\]/g, // we have previously replaced bracketMail(*) with bracketMail{*} !
		      let reg = new RegExp('bracket' + argType + '\\{(.+?)\\}', 'g'), 
              ar = reg.exec(format);
          if (ar && ar.length>1) {
            let args = ar[1];
            Util.logDebugOptional('regularize', 
              'getBracketAddressArgs(' + format + ',' + argType + ') returns ' + args 
              + '\n out of ' + ar.length + ' results.');
            return args;
          }
          return '';
        };
         async function getCardFromAB(mail) { // returns ContactNode
          if (!mail) return null;
          // https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Address_Book_Examples
          // http://mxr.mozilla.org/comm-central/source/mailnews/addrbook/public/nsIAbCard.idl
          
          // CARDBOOK
          // simpleMailRedirection.contacts => can be accesed via the notifyTools

          // API-to-do: use API https://thunderbird-webextensions.readthedocs.io/en/latest/addressBooks.html
          for (let i=0; i<that.allAddressBooks.length; i++ ) {
            // addressBook.mailingLists // array of MailingListNode)
            // alert ("Directory Name:" + addressBook.dirName);
            try {
              // AddressBookNode 
              let addressBook = that.allAddressBooks[i];
              let contactNode = addressBook.contacts.find(c => c.properties.PrimaryEmail.toLowerCase() == mail.toLowerCase());  // Array of ContactNode, properties is nsIAbCard.idl
              if (contactNode) return contactNode;
            }
            catch(ex) {
              Util.logDebug('Problem with Addressbook: ' + addressBook.dirName + '\n' + ex) ;
            }
          }
          return null;
        }

        // return the bracket delimiters
        function getBracketDelimiters(bracketParams, element) {
          let del1='', del2='',
              bracketExp = element.field,
              isOptional = false;
          if (bracketExp) {
            // ??prefix make brackets optional if bracketMail / bracketName is the only element in the address.
            // e.g. ??bracketName(??round)
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
            if (bracketParams.indexOf('??')==0) {
              isOptional = true;
              bracketParams = bracketParams.substring(2);
            }
              
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
                    if (isWriteClipboard) { // [issue 200]
                      del1 = '<'; 
                      del2 = '>'; 
                    }
                    else {
                      del1 = '&lt;'; // <
                      del2 = '&gt;'; // >
                    }
                    break;
                  default:
                    del1 = delimiters[0]; // allow single delimiter, such as dash
                    del2 = '';
                }
                break;
              default: // delimiters separated by ; 3 and more are ignored.
                del1 = delimiters[0];
                del2 = delimiters[1];
                break;
            }
          }
          return [del1, del2, isOptional];
        }
        
        if (typeof addrstr =='undefined')
          return ""; // no address string (new emails)
          
        // fix mime encoded strings (cardbook seems to store these!)
        // [issue 125] solve encoding problems
        let isCorrectMime = true,
            detectCharset = this.detectCharset.bind(this),
            decode = this.decode.bind(this);
        function correctMime(str) {
          if (!isCorrectMime || !str) return str;
          if (!str.includes("=?")) return str;
          let cs = detectCharset(str, true);
          if (cs) {
            let corrected = decode(str, cs);
            if (corrected != str) {
              Util.logDebug("Correcting MIME encoded word from AB: " + str + "  to:" + corrected + "\nGuessed charset: " + cs);
              return corrected;
            }
          }
          return str;
        }      
        
        //  %from% and %to% default to name followed by bracketed email address
        if (typeof format=='undefined' || format == '') {
          format = this.MimePrefs.defaultFormat.replace("(","{").replace(")","}") ; // 'name,bracketMail<angle>'
        }
        
        Util.logDebugOptional('mime.split',
             '====================================================\n'
           + 'mimeDecoder.split(charset decoding=' + (bypassCharsetDecoder ? 'bypassed' : 'active') + ')\n'
           + '  addrstr: ' +  addrstr + '\n'
           + '  charset: ' + charset + '\n'
           + '  format: ' + format + '\n'
           + '====================================================');
        // if (!bypassCharsetDecoder)
          // addrstr = this.decode(addrstr, charset);
        // Escape % and , characters in mail addresses
        if (this.MimePrefs.debug) debugger;
        
        let array = [];
        if (typeof addrstr == "string") {
          /** SPLIT ADDRESSES **/
          addrstr = addrstr.replace(/"[^"]*"/g, function(s){ return s.replace(/%/g, "%%").replace(/,/g, "-%-"); });
          Util.logDebugOptional('mime.split', 'After escaping special chars in mail address field:\n' + addrstr);
          array = addrstr.split(/\s*,\s*/);
        }
        else if (Array.isArray(addrstr)) {
          for (let i=0; i<addrstr.length; i++) {
            array.push( addrstr[i].replace(/"[^"]*"/g, (s) => { return s.replace(/%/g, "%%").replace(/,/g, "-%-"); }));
          }
        }

        
        
        /** SPLIT FORMAT PLACEHOLDERS **/
        // possible values for format are:
        // name, firstname, lastname, mail - fields (to be extended)
        // bracketMail(args) - special function (we replaced the round brackets with < > for parsing)
        // link, islinkable  - these are "modifiers" for the previous list element
        let formatArray = Util.splitFormatArgs(format),
            isForceAB = false,
            isWriteClipboard = formatArray.findIndex((e) => e.field=="toclipboard")>-1; // [issue 187]

        let dbgText = 'addrstr.split() found [' + array.length + '] addresses \n' + 'Formats:\n';
        for (let i=0; i<formatArray.length; i++) {
          let fld = formatArray[i];
          if (fld.field == "addressbook") 
            isForceAB = true;
          dbgText += fld.field;
          if (fld.modifier)  
            dbgText += '(' + fld.modifier + ')';
          dbgText += '\n';
        }
        Util.logDebugOptional('mime.split', dbgText);
        
        const nameDelim = this.MimePrefs.nameDelimiter, // Bug 26207
              isGuessFromAddressPart = this.MimePrefs.guessFromMail,
              isReplaceNameFromParens = this.MimePrefs.extractNameFromParentheses; // [Bug 26595] disable name guessing      
        let addresses = "",
            address,
            bracketMailParams = getBracketAddressArgs(format, 'Mail'),
            bracketNameParams = getBracketAddressArgs(format, 'Name'),
            card;

        // API-to-do: use API for retrieving properties
        // (probably async)
        // see https://webextension-api.thunderbird.net/en/stable/contacts.html#get-id
        function getCardProperty(p) {
          if (!card) return '';
          let legacyKey = mapLegacyCardStruct.get(p);
          let r = card.ContactProperties[legacyKey];
          if (r) {
            let d = that.mimeDecoder.decode(r);
            if (d) return d;
          }
          return r;
        }


        /** ITERATE ADDRESSES  **/
        for (let i = 0; i < array.length; i++) {
          let suppressMail = false;
          if (this.MimePrefs.debug) debugger;
          if (i > 0) {
            addresses += nameDelim + " ";  // comma or semicolon
          }
          let addressee = '',
              firstName, lastName,
              fullName = '',
              emailAddress = '',
              addressField = array[i],
              isFirstNameFromDisplay = false;
              
          // [Bug 25816] - missing names caused by differing encoding
          // MIME decode (moved into the loop)
          // if (!bypassCharsetDecoder) this.decode(array[i], charset);
          addressField = correctMime(array[i]); 
          
          // Escape "," in mail addresses
          array[i] = addressField.replace(/\r\n|\r|\n/g, "")
                             .replace(/"[^"]*"/,
                             function(s){ return s.replace(/-%-/g, ",").replace(/%%/g, "%"); });
          // name or/and address. (wraps email into <  > )
          address = array[i].replace(/^\s*([^<]\S+[^>])\s*$/, "<$1>").replace(/^\s*(\S+)\s*\((.*)\)\s*$/, "$2 <$1>");
          
          
          Util.logDebugOptional('mime.split', 'processing: ' + addressField + ' => ' + array[i] + '\n'
                                               + 'address: ' + address);
          // [Bug 25643] get name from Addressbook
          emailAddress = getEmailAddress(address); // get this always
          const isResolveNamesAB = isForceAB || this.MimePrefs.resolveAB;
          card = isResolveNamesAB ? 
            await getCardFromAB(emailAddress) : null; // ContactNode
          
          // determine name part (left of email)
          addressee = address.replace(/\s*<\S+>\s*$/, "")
                          .replace(/^\s*\"|\"\s*$/g, "");  // %to% / %to(name)%
                          
          if (isGuessFromAddressPart && !addressee) { // if no addressee part found we probably have only an email address.; take first part before the @
            addressee = address.slice(0, address.indexOf('@'));
            if (addressee.charAt('0')=='<')
              addressee = addressee.slice(1);
          }
          // if somebody repeats the email address instead of a name at front, e.g. a.x@tcom, we cut the domain off anyway
          if (addressee.indexOf('@')>0) {
            let add_end = addressee.substring(addressee.length-1);
            addressee = addressee.slice(0, addressee.indexOf('@')); // if we do this we may need to re-add parentheses or special characters at the end!
          if ([')', ']', '}', '"'].indexOf(add_end) !== -1)
            addressee += add_end; // re-add ')'
          }
          fullName = addressee;
          
          // attempt filling first & last name from AB
          firstName = (isResolveNamesAB && card) ? correctMime(card.properties.FirstName) : '';
          if (isResolveNamesAB && card) {
            if (this.MimePrefs.resolveAB_preferNick) {
              firstName = correctMime(card.getProperty("NickName", card.properties.FirstName));
            }
            if (!firstName && this.MimePrefs.resolveAB_displayName) {
              firstName = correctMime(card.properties.DisplayName);
              // displayName is usually the full name, so we may have to remove that portion for firstname.
              isFirstNameFromDisplay = true;
            }
          }
          lastName = (isResolveNamesAB && card)  ? correctMime(card.properties.LastName) : '';
          fullName = (isResolveNamesAB && card && card.properties.DisplayName) ? correctMime(card.properties.DisplayName) : fullName;
          
          
          let isNameFound = (firstName.length + lastName.length > 0); // only set if name was found in AB
          if ((fullName || isNameFound) && this.MimePrefs.resolveAB_removeEmail) {
            // remove mail if name found in AB, and a name component is displayed:
            for (let f=0; f<formatArray.length; f++) {
              if (["name","firstname","lastname","fullname"].indexOf(formatArray[f].field)>=0) {
                suppressMail = true;
              }
            }
            for (let f=0; f<formatArray.length; f++) {
              if (formatArray[f].field=='mail' || formatArray[f].field.startsWith('bracketMail')) 
                suppressMail = false;
            }
          }
                  
              
          if (!isNameFound && this.MimePrefs.firstLastSwap) {
            // extract Name from left hand side of email address
            
            let regex = /\(([^)]+)\)/,
                nameRes = regex.exec(addressee);
            // (Name) extraction!
            if (isReplaceNameFromParens && nameRes  &&  nameRes.length > 1 && !isLastName(format)) {
              isNameFound = true;
              firstName = nameRes[1];  // name or firstname will fetch the (Name) from brackets!
            }
            else {
              let iComma = addressee.indexOf(', ');
              if (iComma>0) {
                firstName = addressee.substr(iComma + 2);
                // remove parentheses part from firstnames
                if (nameRes)
                  firstName = (firstName.replace(nameRes[0],'')).trim();
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
              fullName = firstName ? firstName : lastName;  // ?
            }
            if (!fullName) fullName = addressee.replace("."," "); // we might have to replace . with a space -  fall back
          }
          else {
            if (!card || (card && card.properties.DisplayName && card.properties.DisplayName != fullName)) { // allow a single word from AB as displayName to "survive"
              // name split / replacements; if there are no spaces lets replace '.' then '_'
              if (fullName.indexOf(' ')<0) {
                 fullName = addressee.replace('.',' ');
              }
              if (fullName.indexOf(' ')<0) {
                 fullName = addressee.replace('_',' ');
              }
              // replace double quotation marks?
            }
          }
          
          let names = fullName.split(' '),
              ncount = names.length,
              isOnlyOneName = (ncount==1) ? true : false;
          if (!firstName) {
            firstName = '';
            if (isOnlyOneName)
              firstName = names[0];  // always fill first Name!
            else for (let n=0; n<ncount-1; n++) {
              if (n>0) firstName += ' '; // concatenate with space between all first names
              firstName += names[n];
            }
          }
          // [Bug 26208] ? Omitting middle names
          if (!lastName && !isOnlyOneName) {
            lastName = ncount ? names[ncount-1] : '';
          }
          if (isFirstNameFromDisplay && firstName.endsWith(lastName)) {
            // cut off last name to avoid duplication.
            firstName = firstName.replace(lastName,"").trim();
          }
          
          if (this.MimePrefs.namesCapitalize) {
            fullName = Util.toTitleCase(fullName);
            firstName = Util.toTitleCase(firstName);
            lastName = Util.toTitleCase(lastName);
          }
          
          // build the part!
          let addressElements = [],
              foundNonOptionalParts = false,
              bracketsAreOptional = false; // bracket Elements
              
          for (let j=0; j<formatArray.length; j++)  {
            let element = formatArray[j],
                part = "", open = "", close = "",
                isOptionalPart = false,
                partKeyWord = element.field; 
                
            if (partKeyWord.indexOf('??')==0) {
              partKeyWord = partKeyWord.substring(2);
              isOptionalPart = true;
            }
            switch(partKeyWord.toLowerCase()) {
              case 'initial':
                while (addressElements.length>1) 
                  addressElements.pop();
                addressElements.push( {part:addrstr, optional:false, bracketLeft:'', bracketRight:'', bracketsOptional:true}  ); // return unchanged string, ignore all other parameters
                break;
              case 'mail':
                if (suppressMail)
                  continue;
                switch (element.modifier) {
                  case 'linkable':
                    part = emailAddress;
                    break;
                  case 'linkTo': // No special linking, anchor will be modified below like with all other parts
                    part = emailAddress;
                    break;
                  default:
                    //empty anchor suppresses link; adding angle brackets as default
                    if (!isWriteClipboard && this.MimePrefs.mailSuppressLink) {
                      part = "<a>" + "&lt;" + emailAddress + "&gt;" + "</a>"; 
                    }
                    else {
                      part = emailAddress;
                    }
                }
                break;
              case 'fwd': // this is handled on the outside, so we ignore it
                continue;
              case 'name':
              case 'fullname':
                if (fullName)
                  part = fullName;
                else {
                  if (isGuessFromAddressPart)
                    part = address.replace(/.*<(\S+)@\S+>.*/g, "$1"); // email first part fallback
                  else
                    part = ''; // [Bug 26595]
                }
                // [Bug 26209] wrap name if contains comma
                if (this.MimePrefs.namesQuoteIfComma) {
                  if (part.includes(',') || part.includes(';'))
                    part = '"' + part + '"';
                }
                break;
              case 'firstname':
                part = firstName;
                break;
              case 'lastname':
                if (card && card.properties.LastName)
                  part = card.properties.LastName;
                else if (isOnlyOneName && format.indexOf('firstname')<0) {
                  part = firstName; // fall back to first name if lastName was 
                                    // 'emptied' because of duplication
                }
                else
                  part = lastName;
                break;
              // [issue 24]
              // AB stuff - contact
              case 'nickname':
                part = getCardProperty("NickName");
                break;
              case 'additionalmail':
                part = getCardProperty("SecondEmail");
                break;
              case 'chatname':
                part = getCardProperty("ChatName");
                break;
              case 'workphone':
                part = getCardProperty("WorkPhone");
                break;
              case 'homephone':
                part = getCardProperty("HomePhone");
                break;
              case 'fax':
                part = getCardProperty("FaxNumber");
                break;
              case 'pager':
                part = getCardProperty("PagerNumber");
                break;
              case 'mobile':
                part = getCardProperty("CellularNumber");
                break;
              // AB stuff - private
              case 'private.address1':
                part = getCardProperty("HomeAddress");
                break;
              case 'private.address2':
                part = getCardProperty("HomeAddress2");
                break;
              case 'private.city':
                part = getCardProperty("HomeCity");
                break;
              case 'private.state':
                part = getCardProperty("HomeState");
                break;
              case 'private.country':
                part = getCardProperty("HomeCountry");
                break;
              case 'private.zip':
                part = getCardProperty("HomeZipCode");
                break;
              // work
              case 'work.title':
                part = getCardProperty("JobTitle");
                break;
              case 'work.department':
                part = getCardProperty("Department");
                break;
              case 'work.organization':
                part = getCardProperty("Company");
                break;
              case 'work.address1':
                part = getCardProperty("WorkAddress");
                break;
              case 'work.address2':
                part = getCardProperty("WorkAddress2");
                break;
              case 'work.city':
                part = getCardProperty("WorkCity");
                break;
              case 'work.state':
                part = getCardProperty("WorkState");
                break;
              case 'work.country':
                part = getCardProperty("WorkCountry");
                break;
              case 'work.zip':
                part = getCardProperty("WorkZipCode");          
                break;
              case 'work.webpage':
                part = getCardProperty("WebPage1");          
                break;
                
              // other
              case 'other.custom1':
                part = getCardProperty("Custom1");
                break;
              case 'other.custom2':
                part = getCardProperty("Custom2");
                break;
              case 'other.custom3':
                part = getCardProperty("Custom3");
                break;
              case 'other.custom4':
                part = getCardProperty("Custom4");
                break;
              case 'other.custom5':
                part = getCardProperty("Custom5");
                break;
              case 'other.notes':
                part = getCardProperty("Notes");
                break;
              case 'addressbook':
                part = "";          
              case 'toclipboard':
                isWriteClipboard = true;
                part = "";
                break;
              default:
                // [issue 186] allow using bracketMail / bracketName without parentheses
                let bM = (partKeyWord.indexOf('bracketMail')==0),
                    bN = (partKeyWord.indexOf('bracketName')==0);
                if (bM || bN) {
                  if (bM) {
                    [open, close, bracketsAreOptional] = getBracketDelimiters(bracketMailParams, element);
                    part = emailAddress || ""; // adding brackets later!
                  }
                  else {
                    if (isGuessFromAddressPart || fullName) {
                      [open, close, bracketsAreOptional] = getBracketDelimiters(bracketNameParams, element);
                      let fN = fullName ? fullName : address.replace(/.*<(\S+)@\S+>.*/g, "$1"); // email first part fallback
                      part = fN ? fN : '';
                    }
                    else
                      part = "";
                  }
                }
                break;
            }
            if (element.modifier =='linkTo') {
              part = "<a href=mailto:" + emailAddress + ">" + part + "</a>"; // mailto
            }

            // make array of non-empty parts
            if (part) {
              addressElements.push({part:part, optional:isOptionalPart, bracketLeft:open, bracketRight:close, bracketsOptional: bracketsAreOptional});
              if (!isOptionalPart) 
                foundNonOptionalParts = true;
            }
          }
          
          addressField = ''; // reset to finalize
          for (let j=0; j<addressElements.length; j++)  {
            let aElement = addressElements[j];
            // remove optional parts, e.g. to(name,??mail) - will only show name unless missing, in which case it shows mail
            if (aElement.optional && foundNonOptionalParts)
              continue;
            // append the next part if not empty
            if (aElement.part.length>0) {  // [issue 153]
              if (addressField.length) addressField += " "; // space to append next parts
              // if there is only one element and brackets param is prefixed with ??
              // e.g. %from(name,bracketMail(??- {,}))%
              // Name - {email}
              // then hide the brackets and only show email.
              if (addressElements.length==1 && aElement.bracketsOptional)
                addressField += aElement.part; // omit brackets if this is the only bracketed Expression returned
              else
                addressField += aElement.bracketLeft + aElement.part + aElement.bracketRight;
            }
          }
          
          Util.logDebugOptional('mime.split', 'adding formatted address: ' + addressField);
          addresses += addressField;
        }
        if (isWriteClipboard) {
          Util.logDebug("mimeDecoder.split() - copying result to clipboard:\n" + addresses);
          await Util.clipboardWrite(addresses); // need to make split async!
          addresses = "";
        }
        return addresses;
      } // split

    }
  }

  classGetHeaders = function (messageURI) { // from smartTemplate.overlay.js
    Util.logIssue184(`classGetHeaders(${messageURI})`);
  }

  clsGetAltHeader = function (msgDummyHeader) { // from smartTemplate.overlay.js
    Util.logIssue184(`clsGetAltHeader(${msgDummyHeader})`);
  }
  
      // modify a number of headers with either a string literal 
      // or a regex match (depending on matchFunction argument)
      // hdr: "subject" | "to" | "from" | "cc" | "bcc" | "reply-to"
      // cmd: "set" | "prefix" | "append" | "delete" | "deleteFromSubject"
      // argString: 
      // matchFunction: "" | "matchFromSubject" | "matchFromBody" 
  static async modifyHeader(hdr, cmd, argString, matchFunction="", composeDetails) {
        const whiteList = ["subject","to","from","cc","bcc","reply-to","priority"];
          // ComposeFields = gMsgCompose.compFields;
              
        if (await Preferences.isDebugOption('headers')) debugger;			
        Util.addUsedPremiumFunction('header.' + cmd);
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
              // need license check here...
              Util.logIssue184("Restrict clipboard to Pro Users!");
              argument = await Util.clipboardRead();
            }
            break;
          case "matchFromSubject":
          case "matchFromBody":
            let regX = new RegExp("%header." + cmd + "." + matchFunction + "\(.*\)%", "g");
            
            if (matchFunction == 'matchFromBody') {
              // Insert replacement from body of QUOTED email!
              argument = await matchText(regX, 'body');
            }
            else  {
              // Insert replacement from subject line
              argument = await matchText(regX, 'subject');
            }
            // if our match returns nothing, then do nothing (prevent from overwriting existing headers).
            if (argument == '') return '';
            break;
          default:
            Util.logToConsole("invalid matchFunction: " + matchFunction);
            return '';
        }
        try {
          let isClobberHeader = false;
         
          Util.logDebug("modifyHeader(" + hdr +", " + cmd + ", " + argument+ ")");
          if (whiteList.indexOf(hdr)<0) {
            // not in whitelist
            if (hdr.toLowerCase().startsWith("list"))
              isClobberHeader = true;
            else {
              Util.logToConsole("invalid header - no permission to modify: " + hdr + 
                "\nSupported headers: " + whiteList.join(', '));
              return '';
            }
          }
          // get
          modType = 'address';
          switch (hdr) {
            case 'subject':
              targetString = composeDetails.subject;
              modType = 'string';
              break;
            case 'recipient':
            case 'to':
              targetString = composeDetails.to;
              break;
            case 'cc':
              targetString = composeDetails.cc;
              break;
            case 'bcc':
              targetString = composeDetails.bcc;
              break;
            case 'from':
              targetString = composeDetails.from;
              break;
            case 'reply-to':
              targetString = composeDetails.replyTo;
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
                  if (hdr=='cc' && composeDetails.to.toLowerCase().indexOf(argument.toLowerCase())>=0)
                    break;
                  if (hdr=='to' && composeDetails.cc.toLowerCase().indexOf(argument.toLowerCase())>=0)
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
              composeDetails.subject = subjectString;
              break;
            case 'to':
              composeDetails.to = targetString;
              break;
            case 'cc':
              composeDetails.cc = targetString;
              break;
            case 'bcc':
              composeDetails.bcc = targetString;
              break;
            case 'from':
              composeDetails.from = targetString;
              break;
            case 'reply-to':
              composeDetails.replyTo = targetString;
              break;
            case 'priority':
              const validVals = ["Highest", "High", "Normal", "Low", "Lowest"];
              let found = validVals.find(f => f.toLowerCase() == argument);
              if (found) {
                try {
                  Util.logDebug("Setting priority to: " + found);
                  composeDetails.priority = found;
                }
                catch(ex) {
                  Util.logException('set priority ', ex);
                }
              }
              else 
                Util.logDebug("Invalid Priority: '" + targetString + "'\n" 
                  + "Must be one of [" + validVals.join() +  "]");
              
              break;
            default:
              if (isClobberHeader) {
                if (targetString) {
                  Util.logDebug("Adding clobbered header [" + hdr + "] =" + targetString);
                  gMsgCompose.compFields.setHeader(hdr, targetString);
                }
                else {
                  Util.logDebug("Deleting clobbered header [" + hdr + "]");
                  gMsgCompose.compFields.deleteHeader(hdr);
                }
              }
          }
          // try to update headers - ComposeStartup() /  ComposeFieldsReady()
          // https://searchfox.org/comm-esr78/source/mail/components/compose/content/MsgComposeCommands.js#3546
          // https://searchfox.org/comm-esr78/source/mail/components/compose/content/MsgComposeCommands.js#2766
          // [issue 117] : setting from doesn't work
          if (hdr=='from' && composeDetails.from && cmd=='set') {
            // %header.set(from,"postmaster@hotmail.com")%
            // %header.set(from,"<Postmaster postmaster@hotmail.com>")%
            composeDetails.from = fromAddress;
            // only accepts mail addresses from existing identities - aliases included
            let idKey = util.getIdentityKeyFromMail(fromAddress); 
            
            if (!idKey) {
              util.logToConsole("Couldn't find an identity from the email address: <" + fromAddress + ">");
            }
            // after processing LoadIdentity(true) may be triggered by setting messenger.compose.setComposeDetails() !!
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
            // [mx] DON't DO ANYTHING
            Util.logIssue184("changed address header ...");
          }
        }
        catch(ex) {
          Util.logException('modifyHeader()', ex);
        }
        return ''; // consume
      }
  
  
  // hdr.get() replacement
  getAPIheader(composeDetails, hd, originalMsg) {
    let isOriginalMsg = false, requiresOriginalMsg = false;
    if (composeDetails.type != "new" && composeDetails.type != "draft") {
      // to do: implement "perspective" for reply / forward, using composeDetails.relatedMessageId
      requiresOriginalMsg = true;
      if (originalMsg) {
        isOriginalMsg = true;
      }
    }
    let hdr = hd.toLowerCase();
    if (isOriginalMsg) {
      if (originalMsg.headers.hasOwnProperty(hdr)) {
        return originalMsg.headers[hdr];
      }
      else {
        return [];
      }
    }
    switch (hdr) {
      case "attachments": 
        Util.logIssue184("getAPIheader(attachments)");
        return "";
      case "bcc": return composeDetails.bcc;
      case "from": return composeDetails.from;
      case "body": return composeDetails.body;
      case "priority": return composeDetails.priority;
      case "plaintextbody": return composeDetails.plainTextBody;
      
      case "relatedmessageid": return composeDetails.relatedMessageId; // to retrieve original email! call getFull to get headers
      
      case "subject": return composeDetails.subject;
      case "type": return composeDetails.type;
      case "newsgroups": 
        return composeDetails.newsgroups;  // string or string array
      case "followupto": 
        return composeDetails.followupTo;  // ComposeRecipientList
      case "replyto":
        return composeDetails.replyTo;  // ComposeRecipientList
      case "to":
        return composeDetails.to;  // ComposeRecipientList
    }
    if (hdr.startsWith("x-")) {
      let x = composeDetails.customHeaders.find(x => x.name.toLowerCase() == hd.toLowerCase());
      if (x) return x;
    }
    Util.logToConsole(`Cannot retrieve header ${hd}`);
    console.log(`%cCannot retrieve header ${hd}`, "color:red;");
    return ""; // unknown
  }


  parseModifier(msg, composeType) { // from smartTemplate.overlay.js
    // STUB
    Util.logIssue184(`parseModifier(msg,${composeType})`);
    return msg;
  }

  // SmartTemplate4.regularize from smartTemplate.overlay.js 
  // removed obsolete param isStationery
  // added composeDetails for header retrieval
  // added offsets to avoid side FX
  // added flags to avoid side FX
  async regularize(msg, composeType, composeDetails, ignoreHTML, isDraftLike, offsets, flags) { 
    let that = this;
    // [issue 184] deal with global side effects: time offsets!
    // replace SmartTemplate4.signature
    let mailIdentity = await messenger.identities.get(composeDetails.identityId),
        signature = mailIdentity.signature,
        signatureIsPlainText = mailIdentity.signatureIsPlainText;
          
    // make sure to use the licenser from main window, to save time.
    // [issue 150] removed nag screen
    async function getSubject(current) {
      if (await Preferences.isDebugOption("tokens.deferred")) debugger;
      Util.logDebugOptional('regularize', 'getSubject(' + current + ')');
      let subject = "";
      if (current){
        subject = composeDetails.subject; //  document.getElementById("msgSubject").value;
        return escapeHtml(subject); //escapeHtml for non UTF8 chars in %subject% but this don't work in this place for the whole subject, only on %subject(2)%
      }
      else {
        subject = composeDetails.subject; // mime.decode(hdr.get("Subject"), charset);
        if (composeDetails.type=="new" && !subject) {
          // gMsgCompose.composeHTML
          const isHTMLMode = !composeDetails.isPlainText; 
          subject = await Util.wrapDeferredHeader("subject", subject, isHTMLMode);
          Util.logDebugOptional("tokens.deferred",'regularize - wrapped missing header:\n' + subject);
        }
        return subject;
      }
    }

    function getNewsgroup() {
      Util.logDebugOptional('regularize', 'getNewsgroup()');
      let acctKey = msgDbHdr.accountKey;
      //const account = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).getAccount(acctKey);
      //dump ("acctKey:"+ acctKey);
      //return account.incomingServer.prettyName;
      return acctKey;
    }

    // AG: I think this function is designed to break out a more specialized variable
    // such as %toname()% to a simpler one, like %To%
    async function simplify(aString) {
      // Check existence of a header related to the reserved word.
      // str = smartTemplate token, e.g. %subject%
      // reserved words : these are words about which we know are not headers!
      async function classifyReservedWord(str, reservedWord, param) {
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
              // cannot determine charset currently
              let charset = null, // gMsgCompose.compFields.characterSet,
                  headerValue = await mime.split(addressHdr, charset, param);
              if (!headerValue) {
                Util.logDebugOptional("regularize","This %" + reservedWord + "% variable returned nothing.");
                addressHdr = "";
              }
            }
          }
          let s = (isReserved) ? str
                  : (addressHdr != "") ? str : ""; // check if header exists / is empty. this is for [[optional parts]]
          if (!el) {
            Util.logToConsole(`Discarding unknown variable: %${reservedWord}%`)
          }
          else { // it's a reserved word, likely a header
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
                let isHTML = !composeDetails.isPlainText;
                if (isHTML)
                  flags.hasDeferredVars = true;  // SmartTemplate4.hasDeferredVars
                s = await Util.wrapDeferredHeader(str, el, isHTML, (composeType=='new')); // let's put in the reserved word as placeholder for simple deletion
              }
              Util.logDebugOptional("tokens.deferred",'classifyReservedWord - wrapped missing header:\n' + s);
            }
          }
          return s;
        } 
        catch (ex) {
          // let's implement later resolving of variables for premium users:
          // throws "hdr is null"
          Util.logException(`classifyReservedWord (${reservedWord})`, ex);
          that.InvalidReservedWords.push(reservedWord);
          Util.logIssue184(`Util.displayNotAllowedMessage (${reservedWord})`);
          // SmartTemplate4.Message.parentWindow = gMsgCompose.editor.document.defaultView;
          // Util.displayNotAllowedMessage(reservedWord);
          return "";
        }
      }

      async function checkReservedWords(str, strInBrackets) {
        // I think this first step is just replacing special functions with general ones.
        // E.g.: %tomail%(z) = %To%(z)
        // also removes optional [[ CC ]] parts.
        // this replaces empty cc
        // problem if string contains ( or ) it won't work
        let isOptionalAB = (strInBrackets.includes("%identity") && strInBrackets.includes('addressbook'));

        // next: if it doesn't contain %, delete the string
        // preserve square brackets for all genuinely optional stuff
        // Util.isAddressHeader(token) ?
        if (isOptionalAB)
          return str.replace(/^[^%]*$/, "");
        let generalFunction = await Util.replaceAsync(strInBrackets, /%([\w-:=]+)(\([^)]+\))*%/gm, classifyReservedWord);
        return generalFunction.replace(/^[^%]*$/, "");
      }
      
      /* [issue 184] TO DO LATER
      if ((composeType != "new") && (composeType != "snippets") && !gMsgCompose.originalMsgURI)  {
        util.popupAlert (util.ADDON_TITLE, "Missing message URI - SmartTemplates cannot process this message! composeType=" + composeType);
        return aString;
      }
      */

      Util.logDebugOptional("regularize", "simplify()");

      // [AG] First Step: use the checkReservedWords function to process any "broken out" parts that are embedded in {  .. } pairs
      // aString = aString.replace(/{([^{}]+)}/gm, checkReservedWords);
      // removes [[ double brackets ]]  !!
      aString = await Util.replaceAsync(aString,/\[\[([^\[\]]+)\]\]/gm, checkReservedWords);

      // [AG] Second Step: use classifyReservedWord to categorize reserved words (variables) into one of the 6 classes: reserved, To, Cc, Date, From, Subject
      return await Util.replaceAsync(aString,/%([\w-:=]+)(\([^)]+\))*%/gm, classifyReservedWord);
    }

    that.regularize.headersDump = "";
    Util.logDebugOptional("regularize","Parser.regularize(" + msg +")  STARTS...");
    // var parent = SmartTemplate4;
    let idkey = composeDetails.identityId; // Util.getIdentityKey(document),
    let identity = mailIdentity; // = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).getIdentity(idkey),
/*    let accounts = await messenger.accounts.list(false); // omit folders
    for (let account of accounts) {
      let id = account.identities.find(m => m.id == idkey);
      if (id) {
        identity =id;
        break;
      }
    } */
    let mime = that.mimeDecoder;
    await mime.init();

    // THIS FAILS IF MAIL IS OPENED FROM EML FILE:
    let msgDbHdr = null,
        charset,
        hdr = {};
        
/*  OMIT HEADER KRAMPF [issue 184]
        
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
        Util.logException('fatal error - clsGetAltHeader() failed', ex);
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
        Util.logException('messenger.msgHdrFromURI failed:', ex);
        // doesn't return a header but throws!
        charset = gMsgCompose.compFields.characterSet;
      }
      try {
        hdr = (composeType != "new") && (gMsgCompose.originalMsgURI) ? 
          new this.classGetHeaders(gMsgCompose.originalMsgURI) : 
          new this.clsGetAltHeader(gMsgCompose.compFields);
      }
      catch(ex) {
        Util.logException('fatal error - classGetHeaders() failed', ex);
      }
    }
    // append composeType to hdr class.
    if(hdr) {
      hdr.composeType = composeType;
    }
    
**/     // HEADER KRAMPF
    
    let originalMsg = null;
    // not ComposeDetails.relatedMessageId was implemented in Thunderbird 95!!!
    // so it won't work in ESR 91
    if (typeof composeDetails.relatedMessageId != "undefined" ) {
      originalMsg = await messenger.messages.getFull(composeDetails.relatedMessageId);
    }

    hdr.get = (h) => { 
      return that.getAPIheader(composeDetails, h, originalMsg); 
    }; 

    if (await Preferences.isDebugOption('regularize')) debugger;
    let date = (composeType != "new") && msgDbHdr ? msgDbHdr.date : null;
    if (composeType != "new" && msgDbHdr) {
      // for Reply/Forward message
      let tz = new function(date) {
        this.str = ("+0000" + date).replace(/.*([+-][0-9]{4,4})/, "$1");
        this.h = this.str.replace(/(.).*/, "$11") * (this.str.substr(1,1) * 10 + this.str.substr(2,1) * 1);
        this.m = this.str.replace(/(.).*/, "$11") * (this.str.substr(3,1) * 10 + this.str.substr(4,1) * 1);
      } (hdr ? hdr.get("date") : msgDbHdr.date);
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
    async function replaceReservedWords(dmy, token, arg)	{
      // calling this function just for logging purposes
      function finalize(tok, s, comment) {
        if (s) {
          let text = "replaceReservedWords( %" + tok + "% ) = " + s;
          if (comment) {
            text += '\n' + comment;
          }
          Util.logDebugOptional ('replaceReservedWords', text);
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
          (arg && Util.isFormatLink(arg) || arg=='(mail)'))
          return true;
        return false;
      }
      
      // duplicate for now
      async function matchText(regX, fromPart) {
        try {
          let matchPart = msg.match(regX);
          if (matchPart) {
            if (await Preferences.isDebugOption('parseModifier')) debugger;
            for (let i=0; i<matchPart.length; i++) {
              Util.logDebugOptional('parseModifier','matched variable: ' + matchPart);
              let patternArg = matchPart[i].match(   /(\"[^"].*?\")/   ), // get argument (includes quotation marks) ? for non greedy to match first closing doublequote
                  hdr,
                  extractSource = '',
                  rx = patternArg ? await Util.unquotedRegex(patternArg[0], true) : ''; // pattern for searching body

              hdr =	(gMsgCompose.originalMsgURI.indexOf(".eml")>0 && msgDbHdr) ?
                new clsGetAltHeader(msgDbHdr) :
                new classGetHeaders(gMsgCompose.originalMsgURI);
              switch(fromPart) {
                case 'subject':
                  /*
                  if (!hdr) {
                    Util.logToConsole("matchText() - matchTextFromSubject failed - couldn't retrieve header from Uri");
                    return "";
                  }
                  Util.addUsedPremiumFunction('matchTextFromSubject');
                  let messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger),
                      charset = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).Charset;
                  extractSource = SmartTemplate4.mimeDecoder.decode(hdr.get("Subject"), charset);
                  */
                  extractSource = composeDetails.subject;
                  Util.logDebugOptional('parseModifier',"Extracting " + rx + " from Subject:\n" + extractSource);
                  break;
                case 'body':
                  let rootEl;
                  let html = composeDetails.body;
                  if (html) {
                    // clone the html
                    rootEl = new DOMParser().parseFromString(html, "text/html").body.firstElementChild;
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
                  }
                  else {
                    Util.logIssue184("matchText()  - PLEASE TEST: extract body in plainText");
                    extractSource = composeDetails.plainTextBody;  // ???
                  }
                  Util.addUsedPremiumFunction('matchTextFromBody');
                  Util.logDebugOptional('parseModifier',"Extracting " + rx + " from editor.root:\n" + extractSource);
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
                    Util.logDebug('matchText(' + fromPart + ') - Replacing Pattern with:\n'
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
                          Util.logToConsole("replaceText - last string parameter is not well formed.");
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
                  Util.logDebug("pattern not found in " + fromPart + ":\n" + regX);
                  return "";
                }
              } 
            }
          } // matches loop
        }	
        catch	(ex) {
          Util.logException('matchText(' + regX + ', ' + fromPart +') failed:', ex);
        }
        return "";
      }
      
      // remove  (  ) from argument string
      function removeParentheses(arg) {
        return arg.substr(1,arg.length-2);
      }

      let originalToken = token;
      
      let tm = new Date(),
          d02 = function(val) { return ("0" + val).replace(/.(..)/, "$1"); },
          // str.replace(/%([\w-]+)%/gm, replaceReservedWords)
          expand = async function(str) { 
            return await Util.replaceAsync(str, /%([\w-]+)%/gm, replaceReservedWords);  
          };
      if (!that.calendar.isInitialized) {
        await that.calendar.init(null); // default locale
      }
      let cal = that.calendar;
        
      // expensive calculations, only necessary if we deal with tokens that do time 
      if (typeof TokenMap[token]!='undefined' && (TokenMap[token] == 'reserved.time')) {
        // what if we go over date boundary? (23:59)
        let nativeUtcOffset = tm.getTimezoneOffset(), // UTC offset for current time, in minutes
            msOffset = (offsets.whatIsHourOffset ? offsets.whatIsHourOffset*60*60*1000 : 0)
                       + (offsets.whatIsMinuteOffset ?  offsets.whatIsMinuteOffset*60*1000 : 0),
            dayOffset = offsets.whatIsDateOffset;
            
        if (offsets.whatIsTimezone) {
          let forcedTz = Util.getTimezoneOffset(offsets.whatIsTimezone);
          msOffset = msOffset + forcedTz*60*60*1000 + nativeUtcOffset*60*1000;
          Util.logDebug("Adding timezone offsets:\n" +
            "UTC Offset: " + nativeUtcOffset/(60) + " hour\n" +
            "Forced Timezone Offset: " + forcedTz + " hours\n" +
            "Total Offset = " + msOffset + " ms will be added to time");
        }
        
        // date is sent date when replying!
        // in new mails or if offset is applied we use dateshort
        if (msOffset || dayOffset || (composeType=='new')) {
          if (token=="date") 
            token = "dateshort";
        }
        
        if (offsets.whatIsX == offsets.XisSent && !date) {
          // 
          alert( "There is no sent date. You cannot use the X:=Sent switch in this case!");
          offsets.whatIsX = offsets.XisToday;
        }
        
        // Set %A-Za-z% to time of original message was sent.
        if (offsets.whatIsX == offsets.XisSent)  {
          tm.setTime((date / 1000) + msOffset);
        }
        else
          tm.setTime(tm.getTime() + msOffset);
        
        // note: date variable comes from header!
        if (dayOffset) {
          tm.setDate(tm.getDate() + dayOffset);
        }
      }
      

      let debugTimeStrings = (await Preferences.isDebugOption('timeStrings'));
      if (!arg) arg='';
      try {
        // for backward compatibility
        switch (token) {
          case "fromname":  token = "from"; arg = "(name)";   break;
          case "frommail":  token = "from"; arg = "(mail)";   break;
          case "toname":    token = "to";   arg = "(name)";   break;
          case "tomail":    token = "to";   arg = "(mail)";   break;
          case "ccname":    token = "cc";   arg = "(name)";   break;
          case "ccmail":    token = "cc";   arg = "(mail)";   break;
          // [issue 151] universal placeholder for target recipient
          case "recipient":   
            {
              switch(composeType) {
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

        if (await Preferences.isDebugOption('tokens') && token != "X:=today") debugger;
        let isUTC = offsets.whatIsUtc, params;
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
            const dateFormatSent = (offsets.whatIsX == offsets.XisSent && date);
            if (dateFormatSent)
              tm.setTime((date / 1000));
            // [issue 115] Erratic %datetime()% results when forcing HTML with Shift 
            arg = Util.removeHtmlEntities(arg);
            // we may have to pass in an initialized Calendar to this function!
            // if (!that.calendar.initialized) {
            //   await that.calendar.init(null); // default language
            // }
            let defaultTime = Util.dateFormat(tm.getTime() * 1000, removeParentheses(arg), 0, offsets); // dateFormat will add offsets itself
            if (dateFormatSent)
              token = defaultTime;
            else
              token = await Util.wrapDeferredHeader(token + arg, defaultTime, !composeDetails.isPlainText, (composeType=='new'));
            return token; 
          case "datelocal":
          case "dateshort":
            if (debugTimeStrings) debugger;
            if (offsets.whatIsX == offsets.XisToday) {
              tm = new Date(); // undo offset for this case.
              token = await Util.prTime2Str(tm.getTime() * 1000, token, 0, offsets); // [issue 184] to do: pass offsets
              return finalize(token, escapeHtml(token));
            }
            else {
              token = await Util.prTime2Str(date, token, 0, offsets); // [issue 184] to do: pass offsets
              return finalize(token, escapeHtml(token));
            }
          case "timezone":
          case "date_tz":
            let matches = tm.toString().match(/([+-][0-9]{4})/);
            return finalize(token, escapeHtml(matches[0]));
          // for Common (new/reply/forward) message
          case "ownname": // own name
            token = identity.name.replace(/\s*<.*/, "");
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
            flags.suppressQuoteHeaders = true;
            return "";
          case "T": // today
          case "X":                               // Time hh:mm:ss
            return finalize(token, await expand("%H%:%M%:%S%"));
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
            return finalize(token, Util.getTimeZoneAbbrev(tm, (arg=="(1)")), "getTimeZoneAbbrev(tm, " + (arg=="(1)") + ")");
          case "sig":
            if (arg && arg.indexOf('none')>=0) return "";
            let isRemoveDashes = arg ? (arg=="(2)") : false;
            
            // BIG FAT SIDE EFFECT!
            let GlobalFlags = { sigInTemplate : null }; // [issue 184] this probabaly needs to be read outside - add to composers Map?
            let rawsig = Util.getSignatureInner(signature, isRemoveDashes, GlobalFlags),
                retVal = await that.getProcessedText(rawsig, idkey, true, flags) || ""; // [issue 184] Parser recursion
                
            Util.logDebugOptional ('replaceReservedWords', 'replaceReservedWords(%sig%) = getSignatureInner(isRemoveDashes = ' + isRemoveDashes +')');
            Util.logDebugOptional ('signatures', 'replaceReservedWords sig' + arg + ' returns:\n' + retVal);
            return retVal;
          case "subject":
            let current = (arg=="(2)"),
                ret = await getSubject(current);
            if (!current)
              ret = escapeHtml(ret);
            return finalize(token, ret);
          case "newsgroup":
            return finalize(token, getNewsgroup());
          case "language":
            that.calendar.init(removeParentheses(arg));
            return "";
          case "spellcheck":
            // use first argument to switch dictionary language.
            let lang = removeParentheses(arg);
            Util.setSpellchecker(lang, that.info.composeTabId); // id of composetab as we need it for the API
            return "";
          case "logMsg": // For testing purposes - add a comment line to email and error console
            Util.logToConsole(removeParentheses(arg));
            return removeParentheses(arg)+"<br>"; // insert into email
          case "dbg1":
            return finalize(token, cal.list());
          case "cwIso": // ISO calendar week [Bug 25012]
            let offset = parseInt(arg.substr(1,1)); // (0) .. (6) weekoffset: 0-Sunday 1-Monday
            return finalize(token, "" + Util.getIsoWeek(tm, offset));
          // Change time of %A-Za-z%
          case "X:=sent":
            if (debugTimeStrings) debugger;
            offsets.whatIsX = offsets.XisSent;
            offsets.whatIsUtc = (arg && arg=='(UTC)');
            Util.logDebugOptional ('replaceReservedWords', "Switch: Time = SENT - UTC = " + offsets.whatIsUtc);
            return "";
          case "X:=today":
            if (debugTimeStrings) debugger;
            offsets.whatIsX = offsets.XisToday;
            offsets.whatIsUtc = false;
            //Util.logDebugOptional ('replaceReservedWords', "Switch: Time = NOW");
            return "";
          case "X:=calculated":  // calculated(numberOfDays)
            if (debugTimeStrings) debugger;
            params = removeParentheses(arg).split(',');
            let dateOffset = (params.length>0) ? parseInt(params[0] || "0" ) : 0,
                tOffset = (params.length>1) ? params[1] : "00:00";
            let hm = tOffset.split(':'),
                hourOffset = parseInt(hm[0]),
                minOffset = (hm.length>1) ? parseInt(hm[1]) : 0; // reset wit calculated(0)
            offsets.whatIsDateOffset = dateOffset;
            offsets.whatIsHourOffset = hourOffset;
            offsets.whatIsMinuteOffset = minOffset;
            
            Util.logDebugOptional ('timeStrings', "Setting date offset to " + dateOffset + " days, " + hourOffset + ":" + minOffset + " hours.");
            return "";
          case "X:=timezone":
            if (debugTimeStrings) debugger;
            params = removeParentheses(arg).split(',');
            offsets.whatIsTimezone = params[0];
            return "";
          case "cursor":
            Util.logDebugOptional ('replaceReservedWords', "%Cursor% found");
            return '<span class="st4cursor">&nbsp;</span>'; 
          case "internal-javascript-ref":
            return javascriptResults[/\((.*)\)/.exec(arg)[1]];
          // any headers (to/cc/from/date/subject/message-id/newsgroups, etc)
          case "messageRaw": //returns the arg-th first characters of the content of the original message
            return hdr.content(arg?/\((.*)\)/.exec(arg)[1]*1:2048);
          case "attach":
            Util.addUsedPremiumFunction('attach');
            attachFile(arg);
            return "";
          case "file":
          case "style":
            Util.addUsedPremiumFunction(token);
            // do not process images that are returned - insertFileLink will already turn them into a DataURI
            // we are using pathArray to keep track of "where we are" in terms of relative paths
            let pathArray = flags.filePaths || [],
                pL = pathArray.length,
                // Next Step: if it's html file, this step can put a new path on the filePath stack.
                // if it contains file(img) then these may be relative to the parent path
                // and they will be resolved during this function call using the new stack
                // recursively:
                fileContents = await insertFileLink(arg, composeType), 
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
              parsedContent = await that.getProcessedText(fileContents, idkey, true, flags); // [issue 184] Parser recursion
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
            if ((identity.name || isAB) && identity.email ) {  // identity.fullName [issue 184]
              
              let fullId = 
                (isAB) ? identity.email :
                identity.name + ' <' + identity.email + '>';  // identity.fullName [issue 184]
              // we need the split to support (name,link) etc.
              token = await mime.split(fullId, charset, arg, true); // disable charsets decoding!
              
              if(isAB && !token) { 
                // let's put in a placeholder so we can delete superfluous [[ lines ]] 
                // in regularize() after running replaceReservedWords
                Util.logDebug("AB info[" + identity.email + "] not found: " + arg);
                token='<span class=st4optional args="' + arg + '" empty="true" />'; // we may need to delete commas from arg.
                return token; // we need this to be HTML
              }
              
              // avoid double escaping
              if (testHTML(token, arg))
                return token;
            }
            else {
              logDebug("Problem with identity:\n" +
                       "fullName = " + identity.name +"\n" +  // // identity.fullName [issue 184]
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
            Util.addUsedPremiumFunction('conditionalText');
            return insertConditionalText(arg);
          case "clipboard":
            Util.logIssue184("Restrict clipboard to Pro Users!");
            return await Util.clipboardRead();

          default:
            // [Bug 25904]
            if (token.indexOf('header')==0) {
              let args = arg.split(","),
                  modHdr = args.length ? args[0].toLowerCase().substr(1) : ''; // cut off "("
                  
              if (modHdr.startsWith("list")) modHdr = args[0].substr(1); // add case back.
              if (args.length<2 && token!="header.deleteFromSubject") {
                Util.logToConsole("header modification - second parameter missing in command: %" + token + "%");
                return '';
              }
              let toks = token.split("."),
                  matchFunction = toks.length>2 ? toks[2] : ""; // matchFromSubject | matchFromBody
              switch (toks[1]) {
                case "set": // header.set
                  return await Parser.modifyHeader(modHdr, "set", arg, matchFunction, composeDetails);
                case "append":
                  return await Parser.modifyHeader(modHdr, "append", arg, matchFunction, composeDetails);
                case "prefix":
                  return await Parser.modifyHeader(modHdr, "prefix", arg, matchFunction, composeDetails);
                case "delete":
                  await Parser.modifyHeader(modHdr, "delete", arg, "", composeDetails); // no match function - this works within the same header (e.g. subject)
                  return '';
                case "deleteFromSubject":
                  if (await Preferences.isDebugOption("parseModifier")) debugger;
                  await Parser.modifyHeader("subject", toks[1], arg, "", composeDetails); // no match function - this works within the same header (e.g. subject)
                  return "";
                default: 
                  Util.logToConsole("invalid header command: " + token);
                  return "";
              }
            }
            let isStripQuote = Util.isAddressHeader(token),
                theHeader = hdr.get(token),
                isFwdArg = false;
                
            if (composeType=='fwd') {
              let fmt = Util.splitFormatArgs(arg); // returns array of { field: "fwd", modifier: "" }
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
              
              if (Util.checkIsURLencoded(dmy))
                return dmy; // this is HTML: we won't escape it.
                
              token = await Util.wrapDeferredHeader(token + arg, (isStripQuote ? "" : "??"), !composeDetails.isPlainText, (composeType=='new'));
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
                Util.logException('Cannot convert date to UTC: ' + token, ex);
              }
            }
            let headerValue = isStripQuote ?
                await mime.split(theHeader, charset, arg) :
                mime.decode(theHeader, charset);
            if (!headerValue && Util.isAddressHeader(token)) {
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
        Util.logException('replaceReservedWords(dmy, ' + token + ', ' + arg +') failed - unknown token?', ex);
        Util.logIssue184("replaceReservedWords - (exception)");
        if (Util.checkIsURLencoded(dmy))
          return dmy;
        token = await Util.wrapDeferredHeader(token + arg, "??", !composeDetails.isPlainText);
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
    async function insertFileLink(txt, composeType) {
      Util.logDebug("insertFileLink " + txt);
      Util.logIssue184(`insertFileLink(${txt}, ${composeType})`);
      //const { FileUtils } = ChromeUtils.import('resource://gre/modules/FileUtils.jsm'),
      //      isFU = FileUtils && FileUtils.File;
                  
      // determine file type:
      let html = "",
          arr = txt.substr(1,txt.length-2).split(','),  // strip parentheses and get optional params
          path = arr[0].replace(/"/g, ''),  // strip quotes
          type = path.toLowerCase().substr(path.lastIndexOf('.')+1),
          isHTML = false,
          currentPath = flags.filePaths ? 
                       (flags.filePaths.length ? flags.filePaths[flags.filePaths.length-1] : "") : 
                       ""; // top of stack
      let newPath = Util.getPathFolder(currentPath, path);
                       
      if (type.match( /(png|apng|jpg|jpeg|jp2k|gif|tif|bmp|dib|rle|ico|svg|webp)$/))
        type = 'image';
      if (type.match(/(htm|html|xhtml|xml)$/)) 
        isHTML = true;
      Util.logDebug("insertFile - type detected: " + type);
      // find out whether path is relative:
      let isAbsolute = Util.isFilePathAbsolute(path);
      if (type=='image' || type=='css' && !isAbsolute) {
        let dbgCmdType = (type=="css") ? "%style%" : "%file%";
        Util.logDebug(dbgCmdType + " - " + type + " path may be relative: " + path  +
          "\n flags.isFileTemplate = " + flags.isFileTemplate +
          "\n template path = " + currentPath || '?');
        let pathArray = path.includes("\\") ? path.split("\\") :  path.split("/");
        if (isFU) {
          // if (await Preferences.isDebugOption("fileTemplates")) debugger;
          try {
            // on Mac systems nsIDirectoryService key may NOT be empty!
            // https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Code_snippets/File_I_O
            if (!FileUtils.getFile("Home", pathArray, false)) {
              Util.logDebug("Cannot find file. Trying to append to path of template.");
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
                  Util.logDebug("Failed to find file at: " + newPath);
                } 
                else {
                  Util.logDebug("%file% Converted relative path: " + newPath);
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
            if (await Preferences.getMyBoolPref("vars.file.fileTemplateMethod")) {
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
                Util.logDebug("localFile.initWithPath(" + path + ")");
                if (!isFU)
                  localFile.initWithPath(path);
                
                fstream.init(localFile, -1, 0, 0);
                /* sigEncoding: The character encoding you want, default is using UTF-8 here */
                let encoding = (arr.length>1) ? arr[1] : 'UTF-8';
                Util.logDebug("initializing stream with " + encoding + " encoding…");
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
                Util.logException("insertFileLink() - read " + countRead + " characters.", ex);
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
              if (!flags.filePaths) {
                flags.filePaths = [];     // make an array so we can nest %file% statements to make fragments
              }
              Util.logDebugOptional("fileTemplates", `insertFileLink: Add file to template stack: ${path}`);
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
              Util.logDebug("insert image - adding relative path " + path + "\nto " + currentPath);
              let lastSlash = currentPath.lastIndexOf("\\");
              if (lastSlash<0) lastSlash = currentPath.lastIndexOf("/");
              path = currentPath.substr(0, lastSlash + (path.startsWith('/') ? 0 : 1)) + path;
            }
            filePath = "file:///" + path.replace(/\\/gm,'/');
            // change to data URL
            filePath = await Util.getFileAsDataURI(filePath)
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
        
        Util.logException("FAILED: insertFileLink(" + txt + ") \n You may get more information if you enable debug mode.",ex );
        Services.prompt.alert(null, "SmartTemplates", "Something went wrong trying to read a file: " + txt + "\n" +
          "Please check Javascript error console for detailed error message.");
      }
      return html;
    } 
    
    // [Bug 26552] find the file and add it to the attachments pane
    function attachFile(args) {
      let arr = args.substr(1,args.length-2).split(','),  // strip parentheses and get optional params
          pathUri = arr[0],
          attachments=[];
      try {			
        Util.logIssue184(`attachFile() - ${pathUri}`);
      }
      catch(ex) {
        Util.logException("attachFile(" + pathUri + ")", ex);
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
          if (composeType!='fwd')
            return "";
          return Util.isComposeTypeIsForwardInline() ? patternArgs[0][1] : (patternArgs.length > 1 ? patternArgs[1][1] : "");
        default:
          return "";
      }
    }
    
    // sandboxing strings still works in 68.1.2, not sure when they will deprecate it...
    let supportEval = await Preferences.getMyBoolPref('allowScripts'), // disabled and hidden by default.
        sandbox,
        javascriptResults = [];
        
    if (supportEval) { Util.logIssue184("supportEval - replaceJavascript omitted"); }
/* OMIT JAVASCRIPT PART FOR NOW
    if (supportEval) {
      // [Bug 25676]	Turing Complete Templates - Benito van der Zander
      // https://quickfolders.org/bugzilla/bugs/show_bug.cgi@id=25676
      // we are allowing certain (string) Javascript functions in concatenation to our %variable%
      // as long as they are in a script block %{%    %}%
      // local variables can be defined within these blocks, only 1 expression line is allowed per block,
      // hence best to wrap all code in (function() { ..code.. })()  
      // function must return "" in order not to insert an error
      function replaceJavascript(dmy, script) {
        Util.logDebugOptional('sandbox', 'replaceJavascript(' + dmy +', ' + script +')');
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
            if (Preferences.isDebugOption('sandbox')) debugger;
            let retVariable = replaceReservedWords("", name, arg || "");
            Util.logDebugOptional('sandbox','variable(' + name + ', ' + arg +')\n'
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
                if (Preferences.isDebugOption('sandbox')) debugger;
                if (typeof arg === "undefined") {
                  Util.logDebugOptional('sandbox','sandbox[] arg undefined, returning %' + aname +'()%');
                  return "%"+aname + "()%"; //do not allow name() 
                }
                if (arg === implicitNull) arg = "";
                else arg = "("+arg+")";    //handles the case %%name(arg)%% and returns the same as %name(arg)%
                let sbVal = replaceReservedWords("", aname, arg);
                Util.logDebugOptional('sandbox','sandbox[' + aname +'] returns:' + sbVal);
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
          if (Preferences.isDebugOption('sandbox')) debugger;
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
 
*/
 
    /*  deprecating bs code. */
    if (await Preferences.getMyBoolPref('xtodaylegacy')) {
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
        if (await Preferences.identityPrefs.isReplaceNewLines(idkey, composeType, false))   // [Bug 25571] let's default to NOT replacing newlines. Common seems to not save the setting!
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
        if (!composeDetails.isPlainText)
          { msg = msg.replace(/ /gm, "&nbsp;"); }
      }
    }
    // replace round brackets of bracketMail() with {} - using the second (=inner) match group
    // this makes it possible to nest functions!
    // [Bug 26100] bracketMail wasn't working in optional [[ cc ]] block.
    msg = msg.replace(/%(.*)(bracketMail\(([^)]*))\)/gm, "%$1bracketMail\{$3\}")
    msg = msg.replace(/%(.*)(bracketName\(([^)]*))\)/gm, "%$1bracketName\{$3\}");
    // AG: remove any parts ---in curly brackets-- (replace with  [[  ]] ) optional lines
    msg = await simplify(msg);	
    if (await Preferences.isDebugOption('regularize')) debugger;
    msg = // msg.replace(/%([a-zA-Z][\w-:=.]*)(\([^%]+\))*%/gm, replaceReservedWords); 
      await Util.replaceAsync(msg, /%([a-zA-Z][\w-:=.]*)(\([^%]+\))*%/gm, replaceReservedWords);
      // added . for header.set / header.append / header.prefix
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
        Util.logException("Sandbox not nuked.", ex);
      }
    }

    // dump out all headers that were retrieved during regularize  
    Util.logDebugOptional('headers', that.regularize.headersDump);
    Util.logDebugOptional('regularize',"Parser.regularize(" + msg + ")  ...ENDS");
    return msg;
  } // regularize

  // -----------------------------------
  // Get processed text from template
  async getProcessedText(templateText, idKey, ignoreHTML, flags) 	{
    let info = this.info;
    let composeType = info.composeType;
    let composeDetails = info.composeDetails;
    if (!templateText) return "";

    Util.logDebugOptional('functions.getProcessedText', 'START =============  getProcessedText()   ==========');
    Util.logDebugOptional('functions.getProcessedText', 'Process Text:\n' +
                                         templateText + '[END]');
    
    if (!info.offsets) {
      info.offsets = Util.defaultOffsets();
    }
    // SmartTemplates.calendar.init(); // set for default locale
    let isDraftLike = !composeType 
      || flags.isFileTemplate
      || await Preferences.identityPrefs.isUseHtml(idKey, composeType, false); // do not escape / convert to HTML
    let regular = await this.regularize(templateText, 
        composeType, 
        composeDetails, 
        ignoreHTML, 
        isDraftLike,
        info.offsets,
        flags);
    
    // now that all replacements were done, lets run our global routines to replace / delete text, (such as J.B. "via Paypal")
    regular = this.parseModifier(regular, composeType); // run global replacement functions (deleteText, replaceText)
    
    // [Bug 26364] Inline Images are not shown.
    // fix DataURLs from other template (Stationery)
    // This won't work if there is no "file:\\\" portion given (relative path / current folder not supported)
    // we can fix the Data urls for file:/// images now
    // assume the URL is terminated by a single quote, double quote or &gt;
    const Frex = new RegExp("file:\/\/\/[^\"\'\>]*", "g");
    regular = await Util.replaceAsync(regular, Frex,   // /file:\/\/\/[^\"\'\>]*/g
      async function(match) {
        Util.logDebugOptional('composer', 'Replacing image file as data: ' + match);
        return await Util.getFileAsDataURI(match); // not sure if this is possible! turn into a promise and resolve in here?
      }
    );
    
    // find & fix relative <img> paths:
    const Irex = new RegExp(/(<img[^>]+src=[\"'])([^"'>]+)([\"'][^>]*>)/, "g"); // make 3 groups, g2=path
    let currentPath = flags.filePaths ? 
                       (flags.filePaths.length ? flags.filePaths[flags.filePaths.length-1] : "") : 
                       ""; // top of stack
        
    regular = await Util.replaceAsync(regular, Irex,   // /file:\/\/\/[^\"\'\>]*/g
      async function(match, g1, g2, g3) {
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
                let dataUrl = await Util.getFileAsDataURI(filePath);
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

  // SmartTemplates.Calendar - from smarTempalte-main.js:921
  // Needs to be localizable with explicite locales passed.
  calendar = {
    // TO DO!! 
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
    currentLocale : null, // whatever was passed into %language()%
    bundleLocale: null,
    bundle: null,
    list: function list() {
      let str = "";
      for (let i=0;i<7 ;i++) {
        str+= (this.dayName(i)  +"("+ this.shortDayName(i) + ")/");
      } 
      str += "\n";
      for (let i=0;i<12;i++){
        str+= (this.monthName(i)+"("+ this.shortMonthName(i) + ")/");
      }
      return str;
    },    
    // the following functions SHOULD retrieve strings from our own language packs (languages supported by SmartTemplate itself)
    // these will affect the following variables: %A% %a% %B% %b% (week days and months)
    // OTOH: %dateshort% and %datelocal% extract their names from the language packs installed
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
  }
}
