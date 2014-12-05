"use strict";

// -------------------------------------------------------------------
// Insert template message and edit quote header
// -------------------------------------------------------------------
SmartTemplate4.classSmartTemplate = function()
{
	function readSignatureFile(Ident) {
	  if (SmartTemplate4.Util.Application == 'Postbox') {
			throw('readSignatureFile - reading signature from file is not supported in Postbox!');
		}
		let sigEncoding = SmartTemplate4.Preferences.getMyStringPref('signature.encoding'); // usually UTF-8
		SmartTemplate4.Util.logDebugOptional('functions.extractSignature','SmartTemplate4.readSignatureFile()');
		let Ci = Components.interfaces;
		let htmlSigText = '';
		let fileName = '';
		// test code for reading local sig file (WIP)
		try {
			let sigFile = Ident.signature.QueryInterface(Ci.nsIFile);
			if (sigFile)
			{
				fileName = sigFile.path;
				SmartTemplate4.Util.logDebug('readSignatureFile() '
				        + '\nTrying to read attached signature file: ' + sigFile.leafName
				        + '\nat: ' + fileName );
// 					        + '\nfile size: ' + sigFile.fileSize
// 					        + '\nReadable:  '  + sigFile.isReadable()
// 					        + '\nisFile:    '  + sigFile.isFile());


				// let's check whether the file is an image:
        // use a regexp / as "strings" will escape backslashes!
				let isImage = (sigFile.leafName.toLowerCase().match( /\.(png|apng|jpg|jpeg|jp2k|gif|tif|bmp|dib|rle|ico|svg|webp)$/));
				
				if (isImage) {
				  htmlSigText = "<img src='file:///" + fileName + "'\\>";
          SmartTemplate4.Util.logDebugOptional('functions.extractSignature','Sig is image: ' + htmlSigText);
				}
				else {
					let data = "";
					//read file into a string so the correct identifier can be added
					let fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
						createInstance(Ci.nsIFileInputStream);
					let cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
						createInstance(Ci.nsIConverterInputStream);
					fstream.init(sigFile, -1, 0, 0);
          /* sigEncoding: The character encoding you want, default is using UTF-8 here */
					cstream.init(fstream, sigEncoding, 0, 0);
          let countRead = 0;
					let str = {};
					{
						let read = 0;
						do {
							read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
							data += str.value;
              countRead += read;
						} while (read != 0);
					}
					cstream.close(); // this closes fstream

					htmlSigText = data.toString();
          SmartTemplate4.Util.logDebugOptional('functions.extractSignature','Signature text read: (' + countRead + ') bytes.');
				}
		  }
		}
		catch(ex) {
			htmlSigText = "(problems reading signature file - see tools / error console for more detail)";
			SmartTemplate4.Util.logException(
			   "readSignatureFile - exception trying to read signature attachment file; expected charSet = " + sigEncoding + " !\n" 
			   + "Either save your signature with this charset or can change it through the config setting extensions.smartTemplate4.signature.encoding\n"  
			   + fileName, ex);
		}
		SmartTemplate4.Util.logDebugOptional('functions.extractSignature','SmartTemplate4.readSignatureFile() ends - charset = ' + sigEncoding  +'; htmlSigText:\n'
		                                   + htmlSigText + '[EOF]');
		return htmlSigText;
	}
	
	
	//  this.modifierCurrentTime = "%X:=today%";   // scheiss drauf ...
	// -----------------------------------
	// Extract Signature
	// signatureDefined - 'auto', 'text' or 'html' if the %sig% variable ist part of our template - this means signature must be deleted in any case
  //                    'omit' to suppress (remove only)
	// 1. removes signature node from the email
	// 2. extract current Signature (should return signature from the account and not from the mail if it is defined!)
	function extractSignature(Ident, signatureDefined, composeType) {
    let prefs = SmartTemplate4.Preferences;

	  let isSigInBlockquote = false;
	  SmartTemplate4.Sig.init(Ident);
		let htmlSigText = SmartTemplate4.Sig.htmlSigText; // might not work if it is an attached file (find out how this is done)
		let sig = '';
		let isSignatureHTML = SmartTemplate4.Sig.htmlSigFormat; // only reliable if in textbox!
		SmartTemplate4.Util.logDebugOptional(
      'functions','extractSignature()\nSTART==========  extractSignature(' + Ident + ',defined=' + signatureDefined + ', compose type=' + composeType + ')  ========');
		let bodyEl = gMsgCompose.editor.rootElement;
		let nodes = gMsgCompose.editor.rootElement.childNodes;
		SmartTemplate4.signature = null;
		SmartTemplate4.sigInTemplate = false;

		let pref = SmartTemplate4.pref;
		let idKey = document.getElementById("msgIdentity").value; // SmartTemplate4.Util.mailDocument?

		let isSignatureTb = (!!htmlSigText) || Ident.attachSignature;
		let sigNode = null;
		let sigText;

    // find signature node...
		if (isSignatureTb) {
			SmartTemplate4.Util.logDebugOptional('functions.extractSignature','find moz-signature...');
			// try to extract already inserted signature manually - well we need the last one!!
			// get the signature straight from the bodyElement!
			//signature from top
			if (Ident.replyOnTop && !Ident.sigBottom) {
				sigNode = findChildNode(bodyEl, 'moz-signature');
			}
			//signature from bottom
			else {
				let signatureNodes = bodyEl.getElementsByClassName('moz-signature');
				if (signatureNodes && signatureNodes.length) {
					sigNode = signatureNodes[signatureNodes.length-1];
				}
			}
			// eliminate this if it is contained in BLOCKQUOTE
			if (sigNode && sigNode.parentNode) {
				if (sigNode.parentNode.nodeName) {
					if (sigNode.parentNode.nodeName.toLowerCase() == 'blockquote')
						isSigInBlockquote = true;
				}
			}
			SmartTemplate4.Util.logDebugOptional('functions.extractSignature','signature node ' 
			                                     + (sigNode ? 'was ' : 'not ')
			                                     + 'found' 
																					 + (isSigInBlockquote ? ' in <blockquote>!' : '.'));
		}

		// read text from signature file...
		let sigType = 'unknown';
    if (signatureDefined == 'omit') {
      isSignatureHTML = false;
      sigType = 'plain text';
      sigText = ''
    }
    else {
      if (Ident.attachSignature) { // Postbox never gets here:
        let fileSig = readSignatureFile(Ident);
        if (fileSig) {
          htmlSigText = fileSig;
          // look for html tags, because htmlSigFormat might be unchecked
          // while an attached sig file might still be in HTML format.
          if (signatureDefined != 'html' 
              && 
              signatureDefined != 'text') {
            if (fileSig.toLowerCase().match("<br>|<br/>|<div.*>|<span.*>|<style.*>|<table.*>|<p.*>|<u>|<b>|<i>|<pre.*>|<img.*>")) {
              isSignatureHTML = true;
              sigType = 'HTML';
            }
            else
              sigType = 'probably not HTML';
              
          }
        }
      }
      if (signatureDefined == 'html') {
        isSignatureHTML = true;
        sigType = 'HTML';
      }
      else if (signatureDefined == 'text') {
        isSignatureHTML = false;
        sigType = 'plain text';
      }
      else if (htmlSigText && !Ident.attachSignature) { // trust the checkbox as last thing.
        sigType = SmartTemplate4.Sig.htmlSigFormat ?  'HTML' : 'plain text';
      }
      SmartTemplate4.Util.logDebugOptional('functions.extractSignature', 'Signature Type (from file) is ' + sigType);

      // retrieve signature Node; if it doesn't work, try from the account
      // let sigText = sigNode ? sigNode.innerHTML : htmlSigText;
      sigText = isSigInBlockquote ? '' : htmlSigText
                 ? htmlSigText : (sigNode && sigNode.innerHTML) 
                 ? sigNode.innerHTML : '';
      sigText = (sigText) ? sigText : '';  
    }
			
    
    if ((sigType == 'plain text' || sigType == 'probably not HTML')
        && (prefs.getMyBoolPref('signature.replaceLF.plaintext.br'))) {
      sigText = sigText.replace(/\r\n/g, '<br>');
      sigText = sigText.replace(/\n/g, '<br>');
    }
		

		let removed = false;
		// LET'S REMOVE THE SIGNATURE
		//  && signatureDefined
		if (isSignatureTb && sigNode)
		{
			SmartTemplate4.Util.logDebugOptional('functions.extractSignature', 'First attempt to remove Signature.');
			let ps = sigNode.previousElementSibling;
			if (ps && ps.tagName === "BR") {
				//remove the preceding BR that TB always inserts
				try {
					gMsgCompose.editor.deleteNode(ps);
				}
				catch(ex) {
					SmartTemplate4.Util.logException("extractSignature - exception removing <br> before signature!", ex);
				}
			}
			// remove original signature (the one inserted by Thunderbird)
			try {
				gMsgCompose.editor.deleteNode(sigNode);
				removed = true;
			}
			catch(ex) {
				SmartTemplate4.Util.logException("extractSignature - exception removing signature!", ex);
			}
			//gMsgCompose.editor.document.removeChild(sigNode);
		}

		// remove previous signature (fallback). 
		if (!removed) {
			SmartTemplate4.Util.logDebugOptional('functions.extractSignature', 'Not removed. 2nd attempt to remove previous sig...');
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i].className && nodes[i].className == "moz-signature" ) {
					let pBr = nodes[i].previousElementSibling;
					let old_sig = bodyEl.removeChild(nodes[i]); // old_sig is just to check, not used
					removed = true;
					// old code - remove the preceding BR that TB always inserts
					if (pBr && pBr.tagName == "BR")
						bodyEl.removeChild(pBr); 
					break;
				}
			}
			// let's discard the old signature instead.
		}
		
		// still not removed. Maybe an error happened and it slipped into the blockquote;
		// let's have a global setting for removing it
		if (!removed && isSigInBlockquote && prefs.getMyBoolPref('signature.removeBlockQuotedSig.onFail')) {
			try {
				gMsgCompose.editor.deleteNode(sigNode);
				removed = true;
			}
			catch(ex) {
				SmartTemplate4.Util.logException("extractSignature - exception removing signature from blockquote!", ex);
			}
		}

		// okay now for the coup de grace!!
		if (prefs.getMyBoolPref('parseSignature') && sigText)
			sigText = getProcessedText(sigText, idKey, composeType, true);

		let dashesTxt = 
			prefs.getMyBoolPref('signature.insertDashes.plaintext') ? SmartTemplate4.signatureDelimiter : "";
		let dashesHTML = 
			prefs.getMyBoolPref('signature.insertDashes.html') ? SmartTemplate4.signatureDelimiter : "";
		if (gMsgCompose.composeHTML) {
			sig = SmartTemplate4.Util.mailDocument.createElement("div");
			sig.className = 'moz-signature';
			// if our signature is text only, we need to replace \n with <br>
			if (!isSignatureHTML) {
				SmartTemplate4.Util.logDebugOptional('functions.extractSignature', 'Replace text sig line breaks with <br>...');
				// prettify: txt -> html
				// first replace CRLF then LF
				// ASCII signature
				// check for empty signature!!
				if (sigText.length<=1) {
					sigText = '';
					SmartTemplate4.Util.logDebugOptional('functions.extractSignature', 'no signature defined!');
				}
				else {
					sigText = dashesTxt 
								+ "<pre>"
								+ sigText.replace(/\r\n/g, "<BR>").replace(/\n/g, "<BR>")
								+ "</pre>";  // .replace(/ /g, '&nbsp;') - we do not need this as we wrap in pre, anyway!
				}
			} 
			else {
				sigText = dashesHTML + sigText;
			}
			sig.innerHTML = sigText;  // = gMsgCompose.identity.htmlSigText;
			// TEST STUFF..
		}
		else {
			// createTextNode( ) returns a DOMString (16bit)
			sig = dashesTxt + sigText;  // gMsgCompose.editor.document.createTextNode(sigText);
		}

		SmartTemplate4.Util.logDebugOptional('functions.extractSignature','==============  extractSignature=============END\n'
		                                   + 'Return Signature:\n' + sig );

		return sig;
	}


	// -----------------------------------
	// Delete DOMNode/textnode or BR
	// change: return the type of node:
	// "cite-prefix" - the original header texts
	// tag name: usually "br" | "div" | "#text"
	// "unknown" - no node or nodeName available
	function deleteNodeTextOrBR(node, idKey, ignoreInPlainText)
	{
		let isCitation = false;
		let match=false;
		let theNodeName='';
		let cName = '';
		if (node && node.nodeName)
			theNodeName = node.nodeName.toLowerCase();
		else
			return 'unknown';

		let content = '';
		if (node.innerHTML)
			content += '\ninnerHTML: ' + node.innerHTML;
		if (node.nodeValue)
			content += '\nnodeValue: ' + node.nodeValue;
		if (!content)
			content = '\nEMPTY';
		switch(theNodeName) {
			case 'br':
				//' if (!ignoreInPlainText) // AG change: only delete <br> nodes if we are in HTML mode.
				match = true;
				break;
			case '#text':
				if (!ignoreInPlainText) // AG change: only delete text nodes if we are in HTML mode.
					match = true;
				break;
			case 'div': // tb 13++
				if (node.className &&
				    node.className.indexOf('moz-cite-prefix')>=0) {
					cName = node.className;
					match = true;
					isCitation = true;
				}
				break;
		}

		if (match) {
				let msg = cName ? ('div class matched: ' + cName + '  ' + theNodeName) : theNodeName;
				SmartTemplate4.Util.logDebugOptional('deleteNodes','deleteNodeTextOrBR() - deletes node ' + msg
						+ '\n_________' + node.nodeName + '_________' + content);
			if (isCitation) {
				// lets not remove it if the box [x] "Use instead of default quote header" is not checked
				if (!SmartTemplate4.pref.isDeleteHeaders(idKey, "rsp", false))
					return 'cite-prefix'; // we do not remove the citation prefix if this account doesn't have this option specified

			}
			orgQuoteHeaders.push(node);
			// rescue the signature from citation before deleting the node
			gMsgCompose.editor.deleteNode(node);
		}
		else
				SmartTemplate4.Util.logDebugOptional('deleteNodes','deleteNodeTextOrBR() - ignored nonmatching ' + theNodeName);
		return isCitation ? 'cite-prefix' : theNodeName;
	};


	// -----------------------------------
	// Delete all consecutive whitespace nodes...
	function deleteWhiteSpaceNodes(node) {
		let match = true;
		let count = 0;
		while (node && match) {
			let nextNode = node.nextSibling;
			match = false;
			switch (node.nodeType) {
				case Node.TEXT_NODE:
					if (node.nodeValue == '\n' || node.nodeValue == '\r')
						match=true;
					break;
				case Node.ELEMENT_NODE:
					if (node.nodeName && node.nodeName.toLowerCase() == 'br')
						match = true;
					break;
				default:
					match = false;
			}
			if (match) {
				SmartTemplate4.Util.logDebugOptional('deleteNodes','deleteWhiteSpaceNodes() - deletes node '
						+ '\n' + node.nodeName + '	' + node.nodeValue);
				gMsgCompose.editor.deleteNode(node);
				node = nextNode;
			}
		}
		SmartTemplate4.Util.logDebugOptional('deleteNodes','deleteWhiteSpaceNodes() - deleted ' + count + ' nodes.');
	};

	function deleteHeaderNode(node)
	{
		if (node) {
			SmartTemplate4.Util.logDebugOptional('functions','deleteHeaderNode() - deleting ' + node.nodeName
						+ '\n' + node.innerHTML);
			orgQuoteHeaders.push(node);
			gMsgCompose.editor.deleteNode(node);
		}
	};

	function isQuotedNode(node) {
		if (!node)
			return false;

// Note:  moz-cite-prefix might be the container for the headers (shown _before_ the quote)
// 		    node.className &&
// 		    node.className.indexOf('moz-cite-prefix')>=0
		return (node.nodeName && node.nodeName.toLowerCase() == 'blockquote');
	};

	// -----------------------------------
	// Delete quote header (reply)
	//In compose with HTML, body is
	//	<BR><BR>(<- if reply_on_top=1) <#text#>..... (reply_header_xxxx) <BLOCKQUOTE> original-message
	//In compose with TEXT, body is
	//	<BR><BR>(<- if reply_on_top=1) <#text#>..... (reply_header_xxxx) <BR><SPAN> original-message
	//We need to remove a few lines depending on reply_ono_top and reply_header_xxxx.
	function delReplyHeader(idKey)
	{
		function countLF(str) { return str.split("\n").length - 1; }

		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.delReplyHeader()');
		let rootEl = gMsgCompose.editor.rootElement;

		var pref = SmartTemplate4.pref;
		var lines = 0;
		if (pref.getCom("mail.identity." + idKey + ".reply_on_top", 1) == 1) {
			lines = 2;
		}

		let node = rootEl.firstChild

		// delete everything except (or until in plaintext?) quoted part
		let elType = '';
		let skipInPlainText = !gMsgCompose.composeHTML;
		while (node) {
			let n = node.nextSibling;
			// skip the forwarded part
			// (this is either a blockquote or the previous element was a moz-cite-prefix)
			if (skipInPlainText && elType == 'cite-prefix')
				break;  // all following parts are in plain text, so we don't know whether they are all part of the quoted email
			
			if (isQuotedNode(node) || elType == 'cite-prefix' || elType == 'moz-cite-prefix') {
				node = n;
				continue;
			}
			elType = deleteNodeTextOrBR(node, idKey, skipInPlainText); // 'cite-prefix'
			node = n;
		}


		if (SmartTemplate4.Util.versionGreaterOrEqual(SmartTemplate4.Util.AppverFull, "12") ||
        SmartTemplate4.Util.Application != 'Thunderbird') {
			// recursive search from root element
			let node = findChildNode(rootEl, 'moz-email-headers-table');
			if (node) {
				SmartTemplate4.Util.logDebugOptional('functions.delReplyHeader','found moz-email-headers-table, calling deleteHeaderNode()...');
				deleteHeaderNode(node);
			}
		}
		else {
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
			SmartTemplate4.Util.logDebugOptional('functions.delReplyHeader','older version of Tb [' + SmartTemplate4.Util.AppverFull + '], deleting ' + lines + ' lines');

			// Delete original headers .. eliminates all #text nodes but deletes the others
			while (rootEl.firstChild && lines > 0) {
				if (rootEl.firstChild.nodeName != "#text") {
					lines--;
				}
				deleteNodeTextOrBR(rootEl.firstChild, idKey);
			}
		}
		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.delReplyHeader() ENDS');
	};

	// helper function to find a child node of the passed class Name
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
	};
	
	// if can't find in child node, search direct parent
	function findChildNodeOrParent(node, className) {
		let f = findChildNode(node, className);
		return f ? f : findChildNode(node.parentNode, className);
	};

	function testSmartTemplateToken(template, token) {
		if(!template)
			return false;
		let match = template.toLowerCase().match('%' + token.toLowerCase() + '%'); 
		return (!match ? false : true);
	};
	
	function testCursorVar(template) {
		return testSmartTemplateToken(template, 'cursor');
	};
	
	
	function testSignatureVar(template) {
		let reg = /%(sig)(\([^)]+\))*%/gm;
		let match = template.toLowerCase().match(reg);
    SmartTemplate4.Util.logDebugOptional('functions','testSignatureVar() match = ' + match);
		if (!match)
			return '';
		switch (match[0]) {
		  case "%sig%":
				return 'auto';
		  case "%sig(2)%":
				return 'auto';
			case "%sig(html)%":
				return 'html';
			case "%sig(text)%":
				return 'text';
		  case "%sig(none)%":
				return 'omit';
			default:	  // invalid %sig% variable!
				return '';
		}
	};

	// -----------------------------------
	// Delete quote header(forward)
	//In compose with HTML, body is
	//	<BR><BR> <#text#(1041)> <TABLE(headers)> <#text# nodeValue=""> !<BR><BR>! <PRE> original-message
	//In compose with TEXT, body is
	//	<BR><BR> <#text#(1041)><BR> <#text# (headers)>!<BR><BR>! original-message
	//We need to remove tags until two BR tags appear consecutively.
	// AG: To assume that the 2 <br> stay like that is foolish... it change in Tb12 / Tb13
	function delForwardHeader(idKey)
	{
		function truncateTo2BR(root) {
			SmartTemplate4.Util.logDebugOptional('deleteNodes','truncateTo2BR()');
			let node = root.firstChild;
			// old method continues until it finds <br><br> after header table
			let brcnt = 0;
			while (root.firstChild && brcnt < 2) {
				if (root.firstChild.nodeName == "BR") {
					brcnt++;
				}
				else {
					// only older versions of Tb have 2 consecutive <BR>?? Tb13 has <br> <header> <br>
					//if (SmartTemplate4.Util.versionSmaller(SmartTemplate4.Util.AppverFull, "10"))
					brcnt = 0;
				}
				deleteHeaderNode(root.firstChild);
			}
			// delete any trailing BRs
			while (root.firstChild && root.firstChild.nodeName == "BR") {
				deleteHeaderNode(root.firstChild);
			}

		}

		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.delForwardHeader()');

		let Ci = Components.interfaces;
    let origMsgDelimiter = '';
    let Id;
		var bndl = Components.classes["@mozilla.org/intl/stringbundle;1"]
							 .getService(Ci.nsIStringBundleService)
							 .createBundle("chrome://messenger/locale/mime.properties");
    try {           
      origMsgDelimiter = bndl.GetStringFromID(1041);
    }
    catch(ex) {
    }
		// [Bug 25089] default forward quote can't be completely hidden
		if ((SmartTemplate4.Util.Application === "Thunderbird" || SmartTemplate4.Util.Application === "SeaMonkey")
		    && SmartTemplate4.Util.versionGreaterOrEqual(SmartTemplate4.Util.PlatformVer, "14"))
		{
      try {
        // from Tb 31.0 we have a dedicated string for _forwarded_ messages!
        let fwdId = 'mailnews.forward_header_originalmessage'; // from Tb 31.0 onwards?
        let replyId = 'mailnews.reply_header_originalmessage'; //  [Bug 25089] Default forward quote not hidden
        let service = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
        
        Id = fwdId;
        origMsgDelimiter = service.getComplexValue(Id, Ci.nsIPrefLocalizedString).data;
        // fallback to replyId if it doesn't exist.
        if (!origMsgDelimiter) {
          Id = replyId
          origMsgDelimiter = service.getComplexValue(Id, Ci.nsIPrefLocalizedString).data;
        }
      }
      catch(ex) {
        if (!origMsgDelimiter) {
          SmartTemplate4.Util.logException("Could not retrieve delimiter {" + Id + "}; attempt original method.", ex)
          origMsgDelimiter = bndl.GetStringFromID(1041);
        }
      }
		}
		SmartTemplate4.Util.logDebugOptional('functions.delForwardHeader','Retrieved Delimiter Token from mime properties: ' + origMsgDelimiter);

		// Delete original headers
		var rootEl = gMsgCompose.editor.rootElement;

		let node = rootEl.firstChild
		//while (rootEl.firstChild && rootEl.firstChild.nodeValue != header) #
		let firstNode = null;
		SmartTemplate4.Util.logDebugOptional('functions.delForwardHeader','Running Loop to remove unnecessary whitespace..');

		while (node) {
			let n = node.nextSibling;

			if (node.nodeValue && node.nodeValue == origMsgDelimiter) {
				let skipInPlainText = !gMsgCompose.composeHTML;
				deleteNodeTextOrBR(node, idKey, skipInPlainText); // HTML + plain text - stop after removing "--- original message ---"
				break;
			}

			// Analyse the forwarded part. if  it is plain text, let's search for the delimiter in any case (higher risk)!
			// [Bug 25097] do not restrict this to html mode only
			if (node.className == 'moz-forward-container') {
				// lets find the ---original message--- now
				let searchWhiteSpace = true;
				let truncWhiteSpace = false;
				let inner = node.firstChild;
				while (inner) {
					let m = inner.nextSibling;
					if (inner.nodeValue == origMsgDelimiter || truncWhiteSpace) {
						// delete all whitespace before delim
						if (searchWhiteSpace) {
							searchWhiteSpace = false;
							m = inner = node.firstChild;	//restart ...
							truncWhiteSpace = true; 		  // ...and delete EVERYTHING until delimiter
							firstNode = inner;
							continue;
						}
						SmartTemplate4.Util.logDebugOptional('functions.delForwardHeader','deleting node: ' + inner.nodeValue);
						gMsgCompose.editor.deleteNode(inner); // we are not pushing this on to orgQuoteHeaders as there is no value to this.
						if (inner.nodeValue == origMsgDelimiter)
							break;
					}
					inner = m;
				}
				node = n;
				continue;
			}

			deleteNodeTextOrBR(node, idKey);
			node = n;
		}

			// remove the original Mail Header
		SmartTemplate4.Util.logDebugOptional('functions.delForwardHeader','Remove the original header...');
		if (SmartTemplate4.Util.versionGreaterOrEqual(SmartTemplate4.Util.PlatformVer, "12")) {
			// recursive search from root element
			node = findChildNode(rootEl, 'moz-email-headers-table');
			if (node) {
				SmartTemplate4.Util.logDebugOptional('functions.delForwardHeader','found moz-email-headers-table; deleting');
				let nextNode = node.nextSibling;
				deleteHeaderNode(node);
				// delete trailing newlines!
				deleteWhiteSpaceNodes(nextNode);
			}
			else {
				SmartTemplate4.Util.logDebugOptional('functions.delForwardHeader','Could not find moz-email-headers-table!');
				if (!gMsgCompose.composeHTML) {
					truncateTo2BR(rootEl.firstChild);
				}
			}
		}
		else {
			truncateTo2BR(rootEl);
		}
		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.delForwardHeader() ENDS');
	}

	// -----------------------------------
	// Remove template messages and Restore original quote headers
	function removePreviousTemplate()
	{
		try {
			SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.removePreviousTemplate()');
			var curEl = gMsgCompose.editor.rootElement.firstChild;
			var nextEl = gMsgCompose.editor.rootElement.firstChild;
			if (nextEl && nextEl.nodeName == "PRE") {
				nextEl = nextEl.firstChild;
			}
			while ((curEl = nextEl)) {
				// one problem: if signature is not contained in this div, it will not be removed.
				nextEl = curEl.nextSibling;
				if (curEl.id == "smartTemplate4-template") {
					if (nextEl && nextEl.tagName == "BR") {
						let l = nextEl.nextSibling;
						gMsgCompose.editor.deleteNode(nextEl);
						nextEl = l;
					}
					gMsgCompose.editor.deleteNode(curEl);
				}
				// delete our last quoteHeader
				if (curEl.id == "smartTemplate4-quoteHeader") {
					gMsgCompose.editor.deleteNode(curEl);
				}
			}
			// Restore original quote headers
			while (orgQuoteHeaders.length > 0) {
				gMsgCompose.editor.insertNode(orgQuoteHeaders.pop(), gMsgCompose.editor.rootElement, 0);
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logException("removePreviousTemplate - exception trying to remove previous template:", ex);
		}
	};

	function clearTemplate()
	{
		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.clearTemplate()');
		orgQuoteHeaders.length = 0;
		SmartTemplate4.Sig.reset();
	};

	// -----------------------------------
	// Get processed template
	function getProcessedText(templateText, idKey, composeType, ignoreHTML, isStationery) 
	{
		if (!templateText) return "";

		if (typeof isStationery === 'undefined') isStationery = SmartTemplate4.PreprocessingFlags.isStationery;
		SmartTemplate4.Util.logDebugOptional('functions.getProcessedTemplate', 'START =============  getProcessedText()   ==========');
		SmartTemplate4.Util.logDebugOptional('functions.getProcessedTemplate', 'Process Text:\n' +
		                                     templateText + '[END]');
		var pref = SmartTemplate4.pref;
		
		SmartTemplate4.calendar.init(); // set for default locale
		let regular = SmartTemplate4.regularize(templateText, composeType, isStationery, ignoreHTML, !composeType || pref.isUseHtml(idKey, composeType, false));
		
		// now that all replacements were done, lets run our global routines to replace / delete text, (such as J.B. "via Paypal")
		regular = SmartTemplate4.parseModifier(regular); // run global replacement functions (deleteText, replaceText)
    SmartTemplate4.Util.logDebugOptional('functions.getProcessedTemplate','regular:\n' + regular);		
		SmartTemplate4.Util.logDebugOptional('functions.getProcessedTemplate','=============  getProcessedText()   ========== END');
		return regular;
	};
	
	// new function to retrieve quote header separately [Bug 25099]
	// in order to fix bottom-reply
	function getQuoteHeader(composeType, idKey) {
		var hdr = SmartTemplate4.pref.getQuoteHeader(idKey, composeType, "");
		return getProcessedText(hdr, idKey, composeType, false);
	};
	
	// -----------------------------------
	// Get template message - wrapper for main template field
	function getSmartTemplate(composeType, idKey)
	{
		SmartTemplate4.Util.logDebugOptional('functions','getSmartTemplate(' + composeType + ', ' + idKey +')');
		var msg = SmartTemplate4.pref.getTemplate(idKey, composeType, "");
		return getProcessedText(msg, idKey, composeType, false);
	};
	
	function findDirectChildById(parent, id) {
		let node = parent.firstChild;
		while (node) {
			if (node && node.id == id)
				return node;
			node = node.nextSibling;
		}
		return null;
	};

	function findDirectChildByClass(parent, className) {
		let node = parent.firstChild;
		while (node) {
			if (node && node.className == className)
				return node;
			node = node.nextSibling;
		}
		return null;
	};
						
	// -----------------------------------
	// Add template message
	function insertTemplate(startup, flags)
	{
		let util = SmartTemplate4.Util;
		util.logDebugOptional('functions','insertTemplate(startup: ' + startup + ', flags: ' + (flags ? flags.toString() : '(none)') + ')');
		if (!flags) {
		  // if not passed, create an empty "flags" object, and initialise it.
		  flags = {};
			flags.isStationery = false;
			flags.identitySwitched = true;  // new flag
			SmartTemplate4.initFlags(flags);
		}
		let pref = SmartTemplate4.pref;
		// gMsgCompose.editor; => did not have an insertHTML method!! [Bug ... Tb 3.1.10]
		let doc = gMsgCompose.editor.document;
		let Ci = Components.interfaces;
		let ed = GetCurrentEditor();
		let editor = ed.QueryInterface(Ci.nsIEditor); //

		let msgComposeType = Ci.nsIMsgCompType;
		let template = null;
		let quoteHeader = "";
		let idKey = document.getElementById("msgIdentity").value;
		let branch = "." + idKey;

		let isActiveOnAccount = false;
		let acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]  
	                        .getService(Ci.nsIMsgAccountManager);  
		let theIdentity = acctMgr.getIdentity(idKey);
		if (!theIdentity)
			theIdentity = gMsgCompose.identity;

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
			// Undo template messages (does _not_ remove signature!)
			removePreviousTemplate();
		}

		// is the %sig% variable used?
		let sigVarDefined = false;
    let sigType = null;

		let composeCase = 'undefined';
		let st4composeType = '';
		let rawTemplate = '';
		// start parser...
		try {
			switch (gMsgCompose.type) {
				// new message -----------------------------------------
				//	(New:0 / NewsPost:5 / MailToUrl:11)
				case msgComposeType.New:
				case msgComposeType.NewsPost:
				case msgComposeType.MailToUrl:
					composeCase = 'new';
					st4composeType = 'new';
					break;

				// reply message ---------------------------------------
				// (Reply:1 / ReplyAll:2 / ReplyToSender:6 / ReplyToGroup:7 /
				// ReplyToSenderAndGroup:8 / ReplyToList:13)
				case msgComposeType.Reply:
				case msgComposeType.ReplyAll:
				case msgComposeType.ReplyToSender:
				case msgComposeType.ReplyToGroup:
				case msgComposeType.ReplyToSenderAndGroup:
				case msgComposeType.ReplyToList:
					composeCase = 'reply';
					st4composeType = 'rsp';
					break;

				// forwarding message ----------------------------------
				// (ForwardAsAttachment:3 / ForwardInline:4)
				case msgComposeType.ForwardAsAttachment:
				case msgComposeType.ForwardInline:
					composeCase = 'forward';
					st4composeType = 'fwd';
					break;

				// do not process -----------------------------------
				// (Draft:9/Template:10/ReplyWithTemplate:12)
				case msgComposeType.Draft:
					composeCase = 'draft';
					let messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
					let msgDbHdr = messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).QueryInterface(Ci.nsIMsgDBHdr);
					const nsMsgKey_None = 0xffffffff;
					if(msgDbHdr) {
						if (msgDbHdr.threadParent && (msgDbHdr.threadParent != nsMsgKey_None)) {
							st4composeType = 'rsp'; // just guessing, of course it could be fwd as well
						}
						if (msgDbHdr.numReferences == 0)
							st4composeType = 'new';
					}
					break;
				default:
					st4composeType = "";
					break;
			}
			
			
			isActiveOnAccount = pref.isProcessingActive(idKey, st4composeType, false);
			// draft + startup: do not process!
			if (startup && composeCase=='draft')
				isActiveOnAccount = false;

			if (isActiveOnAccount) {
				rawTemplate = pref.getTemplate(idKey, st4composeType, "");
				// if %sig% is in Stationery, it is already taken care of in Stationery's handler!!
        sigType = testSignatureVar(rawTemplate); // 'omit' for supressing sig from smart template
        // if Stationery has %sig(none)% then flags.omitSignature == true
				sigVarDefined = flags.hasSignature || sigType; 
				// get signature and remove the one Tb has inserted
				SmartTemplate4.signature = extractSignature(theIdentity, sigVarDefined, st4composeType);
				template = getSmartTemplate(st4composeType, idKey);
				quoteHeader = getQuoteHeader(st4composeType, idKey);
				let isQuoteHeader = quoteHeader ? true : false;
				switch(composeCase) {
					case 'new':
						break;
					case 'draft':
					  // when do we remove old headers?
						break;
					case 'reply':
						if (pref.getCom("mail.identity." + idKey + ".auto_quote", true)) {
							isQuoteHeader = isQuoteHeader && true;
							// we do not delete reply header if stationery has inserted a template!
							// unless: stationery has a placeholder for the original quote text. in which case we have to do this!
							if (
							      pref.isDeleteHeaders(idKey, st4composeType, false)
									  &&
									  (!flags.isStationery || flags.hasQuotePlaceholder) 
									)
							{
								delReplyHeader(idKey);
							}
						}
						break;
					case 'forward':
						if (gMsgCompose.type == msgComposeType.ForwardAsAttachment)
							break;
						isQuoteHeader = isQuoteHeader && true;

						// we do not delete forward header if stationery has inserted a template!
						if (  pref.isDeleteHeaders(idKey, st4composeType, false)
								  &&
									(!flags.isStationery || flags.hasQuotePlaceholder)
								)
						{
							delForwardHeader(idKey);
						}
						break;
				}
				if (isQuoteHeader) {
					let qdiv = function() { // closure to avoid unnecessary processing
						let qd = SmartTemplate4.Util.mailDocument.createElement("div");
						qd.id = "smartTemplate4-quoteHeader";
						qd.innerHTML = quoteHeader;
						return qd;
					}
					if (!flags.isStationery) {
						editor.rootElement.insertBefore(qdiv(), editor.rootElement.firstChild); // the first Child will be BLOCKQUOTE (header is inserted afterwards)
					}
					else if (flags.hasQuoteHeader) { // find insertion point injected by %quoteHeader%
						let qnode = findChildNode(editor.rootElement, 'quoteHeader-placeholder'); // quoteHeader
						if (qnode) {
							if (composeCase!='new') {
							  let quoteHd = qdiv();
								qnode.parentNode.insertBefore(quoteHd, qnode);
							}
							if (quoteHeader) // guard against empty setting: we do not remove header if there is nothing defined in st4.
								editor.rootElement.removeChild(qnode);
						}
					}
				}
			}
			else {
				util.logDebugOptional('functions','insertTemplate - processing is not active for id ' + idKey);
				// remove old signature!
				// we shouldn't do this if it is not active on account unless we inserted it just beforehand?
				// extractSignature(theIdentity, false, st4composeType);
			}

		}
		catch(ex) {
			util.logException("insertTemplate - exception during parsing. Continuing with inserting template!", ex);
		}
		
		let targetNode = 0;
		let templateDiv;
		// new global settings to deal with [Bug 25084]
		let breaksAtTop = flags.isStationery ? 0 : SmartTemplate4.Preferences.getMyIntPref("breaksAtTop"); // no breaks if Stationery is used!
		let bodyEl = gMsgCompose.editor.rootElement;
		
		// add template message --------------------------------
		// if template text is empty: still insert targetNode as we need it for the cursor!
		// however we must honor the setting "breaks at top" as we now remove any <br> added by Tb
		if (isActiveOnAccount)	{
			templateDiv = SmartTemplate4.Util.mailDocument.createElement("div");
			// now insert quote Header separately
			try {
				templateDiv.id = "smartTemplate4-template";
				// ****************************
				// ***  STATIONERY SUPPORT  ***
				// ****************************
				// we only add the template if Stationery is not selected, otherwise, we leave our div empty! 
				if (!flags.isStationery) {
					templateDiv.innerHTML = template;
				}
				else {
					// to do:	template processing in body provided by Stationery!
				  // ** => replace stationeryBodyText 
					// **    with getProcessedText(stationeryBodyText, idKey, st4composeType) 
				}
				if (theIdentity.replyOnTop) {
					editor.beginningOfDocument();
					for (let i = 0; i < breaksAtTop; i++) 
						gMsgCompose.editor.insertNode(
						                   SmartTemplate4.Util.mailDocument.createElement("br"),
						                   gMsgCompose.editor.rootElement, 0);
					// the first Child will be BLOCKQUOTE (header is inserted afterwards)
					targetNode = editor.rootElement.insertBefore(templateDiv, editor.rootElement.firstChild); 
				}
				else {
					for (let i = 0; i < breaksAtTop; i++)
						gMsgCompose.editor.rootElement.appendChild(SmartTemplate4.Util.mailDocument.createElement("br"));
					targetNode = editor.rootElement.appendChild(templateDiv); // after BLOCKQUOTE (hopefully)
					editor.endOfDocument();
				}
			}
			catch (ex) {
				let errorText = 'Could not insert Template as HTML; please check for syntax errors.'
				      + '\n' + 'this might be caused by html comments <!-- or unclosed tag brackets <...>'
				      + '\n' + ex
				      + '\n' + 'Copy template contents to clipboard?';
				SmartTemplate4.Message.display(errorText,
				              "centerscreen,titlebar",
				              function() {
				              	let oClipBoard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
				              	oClipBoard.copyString(template); },
				              function() { ;/* cancel NOP */ }
				            );
			}
		}
		
		// before we handle the sig, lets search for the cursor one time
		// moved code for moving selection to top / bottom
		let caretContainer = findChildNodeOrParent(targetNode, 'st4cursor');
		let isCursor = (caretContainer != null);
		SmartTemplate4.Util.logDebugOptional('functions.insertTemplate', ' search %cursor% in template: ' + isCursor);
		
		// insert the signature that was removed in extractSignature() if the user did not have %sig% in their template
		let theSignature = SmartTemplate4.signature;
		
		SmartTemplate4.Sig.init(theIdentity);
		let isSignatureSetup = SmartTemplate4.Sig.isSignatureSetup;
		
		// find out server name and type (IMAP / POP3 etc.)
		let serverInfo = util.getServerInfo(idKey);

		// our "compact log" to assist our users more effective
		
		let common = SmartTemplate4.pref.isCommon(idKey) ? ' (uses Common)' : '';
		util.logDebugOptional('functions.insertTemplate',
		         'identityName:   ' + theIdentity.identityName + '\n'
		       + 'key:            ' + theIdentity.key + common + '\n'
		       + serverInfo
		       + '------------------------------------------------\n'
		       + 'sigOnReply:     ' + theIdentity.sigOnReply + '\n'
		       + 'sigOnForward:   ' + theIdentity.sigOnForward + '\n'
		       + 'sigBottom:      ' + theIdentity.sigBottom + '\n'       // sig at the end of the quoted text when replying above
		       + 'attachSignature:' + theIdentity.attachSignature + '\n'
		       + 'htmlSigFormat:  ' + SmartTemplate4.Sig.htmlSigFormat + '\n'   // Does htmlSigText contain HTML?
		       + 'composeHtml:    ' + theIdentity.composeHtml + '\n'
		       + 'replyOnTop:     ' + theIdentity.replyOnTop + '\n'      // quoting preference
		       + 'SmartTemplate4.isSignatureSetup:' + isSignatureSetup + '\n'
		       + 'SmartTemplate4.sigInTemplate: ' + SmartTemplate4.sigInTemplate + '\n'
		       + '%sig% type: [' + sigType + ']\n'
		       + 'compose case, is active? : ' + composeCase + ', ' + isActiveOnAccount + '\n'
		       + '------------------------------------------------\n'
		       + 'SmartTemplate4: ' + util.Version + '\n'
		       + 'Application: ' + util.Application + ' v' + util.AppverFull + '\n'
		       + 'HostSystem: ' + util.HostSystem + '\n'
		       + 'Stationery used: ' + flags.isStationery + '\n'
		       );

		/* SIGNATURE HANDLING */
		if (isActiveOnAccount) {  // && !sigVarDefined
      isSignatureSetup = isSignatureSetup && (sigType != 'omit') && !flags.omitSignature; // we say there is no signature if %sig(none)% is defined in [Stationery] Template
      SmartTemplate4.Util.logDebugOptional ('signatures','isSignatureSetup:' + isSignatureSetup + '\n'
         + 'sigType: ' + sigType + '\n'
         + 'flags.omitSignature: ' + flags.omitSignature +'\n'
         + 'sigVarDefined: ' + sigVarDefined);
		  if (composeCase == 'reply' && (theIdentity.sigOnReply || sigVarDefined) && isSignatureSetup
			    ||
			    composeCase == 'forward' && (theIdentity.sigOnForward || sigVarDefined) && isSignatureSetup
			    ||
			    composeCase == 'new' && theSignature && isSignatureSetup)
			{
				try {
					if (!SmartTemplate4.sigInTemplate && theSignature) {
						SmartTemplate4.Util.logDebugOptional('functions.insertTemplate', ' Add Signature... ' );
		
						let pref = SmartTemplate4.pref;
						// add Signature and replace the BR that was removed in extractSignature
						
						// wrap text only signature to fix [Bug 25093]!
						if (typeof theSignature === "string")  {
							var sn = doc.createElement("div");
							sn.innerHTML = theSignature;
							theSignature = sn;
						}
						
						if (sigVarDefined) { 
						  // find and replace <sig>%sig%</sig> in body.
							if(flags.isStationery) { 
							  let sigNode = findChildNode(bodyEl, 'st4-signature'); // find <sig>
								if (sigNode) {
									let isRemoveDashes = sigNode.getAttribute('removeDashes');
									theSignature.innerHTML = SmartTemplate4.Util.getSignatureInner(theSignature, isRemoveDashes); // remove dashes hard coded for now
									sigNode.parentNode.insertBefore(theSignature, sigNode);
									sigNode.parentNode.removeChild(sigNode);
								}
							}
						}
						else { // append signature using usual methods
							// if we reply on bottom we MUST ignore sigBottom (signature will not go on top template!)
							if (!theIdentity.replyOnTop || theIdentity.sigBottom) {
								// only need this in reply case (might not need it at all with breaksAtTop
								if (composeCase == 'reply' && breaksAtTop == 0)
									bodyEl.appendChild(doc.createElement("br"));
								bodyEl.appendChild(theSignature);
							}
							else {
								// reply above, before div smartTemplate4-template
								// findChildnode non recursive						
								templateDiv = findDirectChildById(bodyEl, 'smartTemplate4-template'); // find direct child of html element (avoid parsing quoted mail)
								// if we don't find this, lets take the first child div
								if (!templateDiv) {
									templateDiv = bodyEl.firstChild.nextSibling;
								}
								// insert signature after template
								if (templateDiv.nextSibling) {
									templateDiv.parentNode.insertBefore(theSignature, templateDiv.nextSibling);
									templateDiv.parentNode.insertBefore(doc.createElement("br"), templateDiv.nextSibling);
								}
								else {
									templateDiv.parentNode.appendChild(templateDiv);
									templateDiv.parentNode.appendChild(doc.createElement("br"));
								}
							}
						}
					}
			  }
			  catch(ex) {
					SmartTemplate4.Util.logException("handling signature failed", ex);
				}
			}
			// active, but empty signature?
			else {
				if(flags.omitSignature
           ||
           flags.isStationery 
				   && 
					 (theSignature.innerHTML == '' || theSignature.innerHTML ==  SmartTemplate4.signatureDelimiter )) { // in %sig(2)% case, the delimiter is built in.
					let sigNode = findChildNode(bodyEl, 'st4-signature'); // find <sig>
					if (sigNode) {
            SmartTemplate4.Util.logDebugOptional ('signatures','found signature node, removing...');
						sigNode.parentNode.removeChild(sigNode);
					}
				}
			}
		
		}
		
		// if %cursor% is not set explicitely
		if (!isCursor) {
			let cursor = doc.createElement("div");
			cursor.className = "st4cursor";
			// if we have a template we simply insert it at the bottom of the template
			if (templateDiv) {
				templateDiv.appendChild(cursor);
			}
			else if (!theIdentity.replyOnTop) {
				// reply on bottom, insert cursor straight after the quote (before the signature)
				bodyEl.appendChild(cursor);
			}
		}
		
		// moved code for moving selection to top / bottom
		// re-find cursor
		if (!caretContainer)
		  caretContainer = findChildNode(targetNode, 'st4cursor');
		isCursor = (caretContainer != null);
		
		try {
			if (targetNode) {
				let selCtrl = editor.selectionController;
				selCtrl.completeMove(!theIdentity.replyOnTop, false);
				selCtrl.completeScroll(!theIdentity.replyOnTop);
				
				let theParent = targetNode.parentNode;
				if (theParent) {
					let nodeOffset = Array.indexOf(theParent.childNodes, targetNode);
					// collapse selection and move cursor - problem: stationery sets cursor to the top!
					if (isCursor) {
						// look for a child div with lass = 'st4cursor'
						if(!caretContainer)
							caretContainer = editor.rootElement.childNodes[0].ownerDocument.getElementById('_AthCaret'); // from (old) stationery
							
						if (caretContainer) {
							try {
								let scrollFlags = selCtrl.SCROLL_FIRST_ANCESTOR_ONLY | selCtrl.SCROLL_OVERFLOW_HIDDEN;
								let space = gMsgCompose.editor.document.createTextNode('\u00a0'); // &nbsp;
								caretContainer.parentNode.insertBefore(space, caretContainer); 
								caretContainer.parentNode.removeChild(caretContainer);
								editor.selection.selectAllChildren(space);
								editor.selection.collapseToStart(); // 
								if (SmartTemplate4.Preferences.getMyBoolPref('cursor.insertSpace')) {
									editor.selection.modify('extend', 'forward','character');
									selCtrl.scrollSelectionIntoView(selCtrl.SELECTION_NORMAL, selCtrl.SELECTION_WHOLE_SELECTION, scrollFlags);
									selCtrl.setDisplaySelection(selCtrl.SELECTION_ATTENTION);
								}
								// editor.selection.collapse(caretContainer, 0);
							}
							catch (ex) {
								SmartTemplate4.Util.logException("editor.selectionController command failed - editor = " + editor + "\n", ex);
							}
						}
					}
					else {
						if (theIdentity.replyOnTop) {
							if (editor.selection.collapseToStart)
								editor.selection.collapseToStart();
							else
								editor.selection.collapse(theParent, nodeOffset+1); 
						}
						else {
						  // if we reply below we must be above the signature.
							if (editor.selection.collapseToEnd)
								editor.selection.collapseToEnd();
							else
								editor.selection.collapse(theParent, nodeOffset+1); 
						}
					}
				}
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logException("editor.selectionController command failed - editor = " + editor + "\n", ex);
		}
		
		if (flags.isStationery && targetNode) {
		  bodyEl.removeChild(targetNode);  // Bug 25710
		}
		resetDocument(gMsgCompose.editor, startup);
		SmartTemplate4.Util.logDebugOptional('functions.insertTemplate', ' finished. ' );
	};

	function resetDocument(editor, withUndo) {
		gMsgCompose.editor.resetModificationCount();
		if (withUndo) {
			SmartTemplate4.Util.logDebugOptional('functions', ' resetting Undo... ' );
			gMsgCompose.editor.enableUndo(false);
			gMsgCompose.editor.enableUndo(true);
		}
	};
	
	// -----------------------------------
	// Constructor
	// var SmartTemplate4 = SmartTemplate4;
	var orgQuoteHeaders = new Array();

	// -----------------------------------
	// Public methods of classSmartTemplate
	this.insertTemplate = insertTemplate;
	this.extractSignature = extractSignature;
  this.getProcessedText = getProcessedText;	
	this.resetDocument = resetDocument;
	this.testSignatureVar = testSignatureVar;
	this.testCursorVar = testCursorVar;
	this.testSmartTemplateToken = testSmartTemplateToken;
};


