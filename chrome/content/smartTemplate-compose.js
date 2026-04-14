"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/

/*
	globals
		gCurrentIdentity,
		SendMessage,
*/

var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
var { MailServices } =  ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");


// -------------------------------------------------------------------
// Insert template message and edit quote header
// -------------------------------------------------------------------
SmartTemplate4.classSmartTemplate = function() {
  const Ci = Components.interfaces,
    Cc = Components.classes,
    util = SmartTemplate4.Util,
    prefs = SmartTemplate4.Preferences;

  function readSignatureFile(Ident) {
    let sigEncoding = prefs.getMyStringPref("signature.encoding"), // usually UTF-8
      htmlSigText = "",
      fileName = "";
    util.logDebugOptional("functions.extractSignature", "SmartTemplate4.readSignatureFile()");
    // test code for reading local sig file (WIP)
    try {
      let sigFile = Ident.signature.QueryInterface(Ci.nsIFile);
      if (sigFile) {
        fileName = sigFile.path;
        util.logDebug(
          "readSignatureFile() " +
            `\nTrying to read attached signature file: ${sigFile.leafName}` +
            `\nat: ${fileName}`,
        );
        // 					        + '\nfile size: ' + sigFile.fileSize
        // 					        + '\nReadable:  '  + sigFile.isReadable()
        // 					        + '\nisFile:    '  + sigFile.isFile());

        // let's check whether the file is an image:
        // use a regexp / as "strings" will escape backslashes!
        let isImage = sigFile.leafName
          .toLowerCase()
          .match(/\.(png|apng|jpg|jpeg|jp2k|gif|tif|bmp|dib|rle|ico|svg|webp)$/);

        if (isImage) {
          let filePath = "file:///" + fileName;
          // change to data URL
          filePath = util.getFileAsDataURI(filePath);
          htmlSigText = `<img src='${filePath}'>`;
          util.logDebugOptional("functions.extractSignature", "Sig is image: " + htmlSigText);
        } else {
          let data = "",
            //read file into a string so the correct identifier can be added
            fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(
              Ci.nsIFileInputStream,
            ),
            cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(
              Ci.nsIConverterInputStream,
            );
          fstream.init(sigFile, -1, 0, 0);
          /* sigEncoding: The character encoding you want, default is using UTF-8 here */
          cstream.init(fstream, sigEncoding, 0, 0);
          let countRead = 0,
            str = {};
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
          util.logDebugOptional(
            "functions.extractSignature",
            "Signature text read: (" + countRead + ") bytes.",
          );
        }
      }
    } catch (ex) {
      htmlSigText = "(problems reading signature file - see tools / error console for more detail)";
      util.logException(
        `readSignatureFile - exception trying to read signature attachment file; expected charSet = ${sigEncoding} !\n` +
          "Either save your signature with this charset or can change it through the config setting extensions.smartTemplate4.signature.encoding\n" +
          `Also make sure this file path is correct and set: [${fileName}] \n`,
        ex,
      );
      if (!Ident.signature) {
        util.logToConsole(
          "Ident.signature is null - this is usually caused by faulty / inconsistent Account Settings.",
        );
      }
    }
    util.logDebugOptional(
      "functions.extractSignature",
      `SmartTemplate4.readSignatureFile() ends - charset = ${sigEncoding}; htmlSigText:\n${htmlSigText}[EOF]`,
    );
    return htmlSigText;
  }

  /**
   * Extracts the signature from the given email identity.
   *
   * Removes the existing Thunderbird-inserted signature node from the email
   * and returns the current account signature if applicable.
   *
   * @param {Identity} Ident - The email identity object to extract the signature from
   * @param {'auto'|'text'|'html'|'omit'} signatureDefined -
   *        'auto', 'text', 'html': template contains %sig%, signature must be removed
   *        'omit': suppress signature extraction; only remove existing signature
   * @param {string} composeType - Type of composition ('new', 'reply', 'forward', etc.)
   * @returns {{ placeholder : Node|null, newSig: Node|string|null }}
   *          placeholder : placeholder node where the TB signature node that was removed
   *          newSig: the extracted signature as a DOM Node (HTML mode),
   *                  string (plain text mode), or null if none
   */
  async function extractSignature(Ident, signatureDefined, composeType) {
    let isSigInBlockquote = false;
    SmartTemplate4.Sig.init(Ident);
    let htmlSigText = SmartTemplate4.Sig.htmlSigText, // might not work if it is an attached file (find out how this is done)
      sig = "",
      isSignatureHTML = SmartTemplate4.Sig.htmlSigFormat,
      sigPath = SmartTemplate4.Sig.htmlSigPath; // only reliable if in textbox!
    const flags = SmartTemplate4.PreprocessingFlags;
    let placeholder = null;

    util.logDebugOptional(
      "functions",
      `extractSignature()\nSTART==========  extractSignature(${Ident}, defined type=${signatureDefined}, compose type=${composeType})  ========`,
    );
    let bodyEl = SmartTemplate4.composer.body;
    SmartTemplate4.signature = null;
    SmartTemplate4.sigInTemplate = false;

    let idKey = util.getIdentityKey(document), // util.mailDocument?
      isSignatureTb = !!htmlSigText || Ident.attachSignature,
      sigText;

    function findPreviousSignatureNode() {
      util.logDebugOptional("functions.extractSignature", "find moz-signature…");
      // try to extract already inserted signature manually - well we need the last one!!
      // get the signature straight from the bodyElement!
      //signature from top
      if (Ident.replyOnTop && !Ident.sigBottom) {
        return findChildNode(bodyEl, "moz-signature");
      }
      //signature from bottom
      const signatureNodes = bodyEl.getElementsByClassName("moz-signature");
      return signatureNodes.length ? signatureNodes[signatureNodes.length - 1] : null;
    }

    const lastSigNode = findPreviousSignatureNode();

    // find signature node...
    if (isSignatureTb) {
      // eliminate this if it is contained in BLOCKQUOTE
      const parentNode = lastSigNode?.parentNode;
      if (parentNode?.nodeName?.toLowerCase() === "blockquote") {
        isSigInBlockquote = true;
      }
      util.logDebugOptional(
        "functions.extractSignature",
        `signature node ${lastSigNode ? "was" : "not"} found${
          isSigInBlockquote ? " in <blockquote>!" : "."
        }`,
      );
    }

    // read text from signature file...
    let sigType = "unknown";
    if (signatureDefined == "omit") {
      isSignatureHTML = false;
      sigType = "plain text";
      sigText = "";
    } else {
      if (Ident.attachSignature) {
        util.logDebugOptional(
          "signatures,functions.extractSignature",
          `attachSignature is set for Identity [${Ident.key}] ${Ident.identityName}\nPath: ${sigPath}`,
        );
        let fileSig = readSignatureFile(Ident);
        if (fileSig) {
          htmlSigText = fileSig;
          // look for html tags, because htmlSigFormat might be unchecked
          // while an attached sig file might still be in HTML format.
          if (signatureDefined != "html" && signatureDefined != "text") {
            if (
              fileSig
                .toLowerCase()
                .match(
                  "<br>|<br/>|<div.*>|<span.*>|<style.*>|<table.*>|<p.*>|<u>|<b>|<i>|<pre.*>|<img.*>",
                )
            ) {
              isSignatureHTML = true;
              sigType = "HTML";
            } else {
              sigType = "probably not HTML";
            }
          }
        }
      }
      if (signatureDefined == "html") {
        isSignatureHTML = true;
        sigType = "HTML";
      } else if (signatureDefined == "text") {
        isSignatureHTML = false;
        sigType = "plain text";
      } else if (htmlSigText && !Ident.attachSignature) {
        // trust the checkbox as last thing.
        sigType = SmartTemplate4.Sig.htmlSigFormat ? "HTML" : "plain text";
      }
      util.logDebugOptional(
        "functions.extractSignature",
        `Signature Type (from file) is ${sigType}`,
      );

      // retrieve signature Node; if it doesn't work, try from the account
      // let sigText = sigNode ? sigNode.innerHTML : htmlSigText;
      if (isSigInBlockquote) {
        sigText = "";
      } else {
        sigText = htmlSigText ?? lastSigNode?.innerHTML ?? "";
      }
    }

    if (
      (sigType == "plain text" || sigType == "probably not HTML") &&
      prefs.getMyBoolPref("signature.replaceLF.plaintext.br")
    ) {
      sigText = sigText.replace(/\r\n/g, "<br>");
      sigText = sigText.replace(/\n/g, "<br>");
    } else {
      // replace image(s) in signature with data src if necessary.
      const Frex = new RegExp("file:///[^\"'>]*", "g");
      sigText = sigText.replace(Frex, function (match) {
        util.logDebugOptional("composer", "Replacing signature image as data url: " + match);
        return util.getFileAsDataURI(match);
      });
    }

    let removed = false;
    // LET'S REMOVE THE SIGNATURE
    //  && signatureDefined
    const isInsertPlaceholder = prefs.getMyBoolPref("removeSigOnIdChangeAfterEdits");
    if (isSignatureTb && lastSigNode) {
      util.logDebugOptional("functions.extractSignature", "First attempt to remove Signature.");
      const after = 0x04;
      let pe = lastSigNode.previousElementSibling, // line break
        ps = lastSigNode.previousSibling; // text node
      if (pe && ps && pe.compareDocumentPosition(ps) & after) {
        /* there is some text before the signature, possibly after a line break. can happen with mailto links */
      } else {
        if (pe && pe.tagName === "BR") {
          //remove the preceding BR that TB always inserts
          try {
            gMsgCompose.editor.deleteNode(pe);
          } catch (ex) {
            util.logException("extractSignature - exception removing <br> before signature!", ex);
          }
        }
      }
      if (isInsertPlaceholder) {
        // create a placeholder in the same position
        placeholder = bodyEl.ownerDocument.createElement("span");
        placeholder.className = "smarttemplates-signature-placeholder";
        lastSigNode.parentNode.insertBefore(placeholder, lastSigNode);
      }

      // remove original signature (the one inserted by Thunderbird)
      try {
        gMsgCompose.editor.deleteNode(lastSigNode);
        removed = true;
      } catch (ex) {
        util.logException("extractSignature - exception removing signature!", ex);
      }
      //gMsgCompose.editor.document.removeChild(sigNode);
    }

    // remove previous signature (fallback)
    if (!removed) {
      util.logDebugOptional(
        "functions.extractSignature",
        "Not removed. 2nd attempt to remove previous sig…",
      );

      let sigNodes = bodyEl.querySelectorAll(".moz-signature");
      for (let sigNode of sigNodes) {
        // exclude quoted signatures
        if (sigNode.closest("blockquote")) {
          continue;
        }

        const pBr = sigNode.previousElementSibling;
        if (placeholder && sigNode.parentNode) { // move / insert placeholder.
          isInsertPlaceholder && sigNode.parentNode.insertBefore(placeholder, sigNode.nextSibling);
        }
        sigNode.remove();
        removed = true;

        if (pBr && pBr.tagName === "BR") {
          pBr.remove();
        }
        break;
      }
    }

    // still not removed. Maybe an error happened and it slipped into the blockquote;
    // let's have a global setting for removing it
    if (
      !removed &&
      isSigInBlockquote &&
      prefs.getMyBoolPref("signature.removeBlockQuotedSig.onFail")
    ) {
      try {
        gMsgCompose.editor.deleteNode(lastSigNode);
        removed = true;
      } catch (ex) {
        util.logException("extractSignature - exception removing signature from blockquote!", ex);
      }
    }

    // okay now for the coup de grace!!
    if (prefs.getMyBoolPref("parseSignature") && sigText) {
      if (!flags.filePaths) {
        flags.filePaths = [];
      } // make sure we have a stack for paths!
      let pathArray = flags.filePaths;
      // if this has a path - put it on the stack so we can process %file()% variables within
      if (isSignatureTb && sigPath) {
        // [issue 240]
        util.logDebugOptional(
          "fileTemplates",
          `extractSignature: Add sig file to template stack: ${sigPath}`,
        );
        pathArray.push(sigPath);
      }
      try {
        sigText = await getProcessedText(sigText, idKey, composeType, true);
      } catch (ex) {
        util.logException(ex, "getProcessedText(signature) failed.");
      }
      if (isSignatureTb && sigPath) {
        let last = pathArray.pop();
        if (last) {
          util.logDebugOptional(
            "fileTemplates",
            `extractSignature: Removed file from template stack: ${last}`,
          );
        }
      }
    }

    let dashesTxt = prefs.getMyBoolPref("signature.insertDashes.plaintext")
      ? SmartTemplate4.signatureDelimiter
      : "";
    let dashesHTML = prefs.getMyBoolPref("signature.insertDashes.html")
      ? SmartTemplate4.signatureDelimiter
      : "";
    if (gMsgCompose.composeHTML) {
      sig = util.mailDocument.createElement("div");
      sig.className = "moz-signature";
      // if our signature is text only, we need to replace \n with <br>
      if (!isSignatureHTML) {
        util.logDebugOptional(
          "functions.extractSignature",
          "Replace text sig line breaks with <br>…",
        );
        // prettify: txt -> html
        // first replace CRLF then LF
        // ASCII signature
        // check for empty signature!!
        if (sigText.length <= 1) {
          sigText = "";
          util.logDebugOptional("functions.extractSignature", "no signature defined!");
        } else {
          sigText =
            dashesTxt +
            "<pre>" +
            sigText.replace(/\r\n/g, "<BR>").replace(/\n/g, "<BR>") +
            "</pre>"; // .replace(/ /g, '&nbsp;') - we do not need this as we wrap in pre, anyway!
        }
      } else {
        sigText = dashesHTML + sigText;
      }
      // [issue 393] avoid innerHTML assignments
      // sig.innerHTML = sigText;  // = gMsgCompose.identity.htmlSigText;
      util.insertHtmlSafely(sig, sigText);
    } else {
      // createTextNode( ) returns a DOMString (16bit)
      sig = dashesTxt + sigText; // gMsgCompose.editor.document.createTextNode(sigText);
    }

    util.logDebugOptional(
      "functions.extractSignature",
      "==============  extractSignature=============END\n" + "Return Signature:\n" + sig,
    );
    return { placeholder, newSig: sig };
  }

  // -----------------------------------
  // Delete DOMNode/textnode or BR
  // change: return the type of node:
  // "cite-prefix" - the original header texts
  // tag name: usually "br" | "div" | "#text"
  // "unknown" - no node or nodeName available
  function deleteNodeTextOrBR(node, idKey, isPlainText) {
    let isCitation = false,
      match = false,
      cName = "";
    if (!node) {
      return;
    }
    if (!node.nodeName) {
      return "unknown";
    }
    const theNodeName = node.nodeName.toLowerCase();

    let content = "";
    if (node.innerHTML) {
      content += "\ninnerHTML: " + node.innerHTML;
    }
    if (node.nodeValue) {
      content += "\nnodeValue: " + node.nodeValue;
    }
    if (!content) {
      content = "\nEMPTY";
    }
    switch (theNodeName) {
      case "p":
      case "br": // fall through
        match = true;
        break;
      case "#text":
        // the text "Axel wrote:" is also a plain text node! So we must delete this even in Text mode.
        if (!isPlainText) {
          // only delete text nodes if we are in HTML mode.
          match = true;
        }
        break;
      case "div":
        if (node.classList.contains("moz-cite-prefix")) {
          if (prefs.isDebugOption("composer.breakpoint")) {
            // eslint-disable-next-line no-debugger
            debugger;
          }
          cName = node.className;
          match = true;
          isCitation = true;
        }
        break;
    }

    if (match) {
      let msg = cName ? "div class matched: " + cName + "  " + theNodeName : theNodeName;
      util.logDebugOptional(
        "deleteNodes",
        `deleteNodeTextOrBR() - deletes node ${msg}\n` +
          `\n_________${node.nodeName}_________${content}`,
      );
      if (isCitation && !SmartTemplate4.pref.isDeleteHeaders(idKey, "rsp", false)) {
        // lets not remove it if the box [x] "Use instead of default quote header" is not checked
        return "cite-prefix"; // we do not remove the citation prefix if this account doesn't have this option specified
      }
      orgQuoteHeaders.push(node);
      // rescue the signature from citation before deleting the node
      gMsgCompose.editor.deleteNode(node);
    } else {
      util.logDebugOptional(
        "deleteNodes",
        "deleteNodeTextOrBR() - ignored nonmatching " + theNodeName,
      );
    }
    return isCitation ? "cite-prefix" : theNodeName;
  }

  // -----------------------------------
  // Delete all consecutive whitespace nodes...
  function deleteWhiteSpaceNodes(node) {
    let match = true,
      count = 0;
    while (node && match) {
      let nextNode = node.nextSibling;
      match = false;
      switch (node.nodeType) {
        case Node.TEXT_NODE:
          if (node.nodeValue == "\n" || node.nodeValue == "\r") {
            match = true;
          }
          break;
        case Node.ELEMENT_NODE:
          if (node.nodeName?.toLowerCase() === "br") {
            match = true;
          }
          break;
        default:
          match = false;
      }
      if (match) {
        util.logDebugOptional(
          "deleteNodes",
          "deleteWhiteSpaceNodes() - deletes node " + "\n" + node.nodeName + "	" + node.nodeValue,
        );
        gMsgCompose.editor.deleteNode(node);
        node = nextNode;
      }
    }
    util.logDebugOptional("deleteNodes", "deleteWhiteSpaceNodes() - deleted " + count + " nodes.");
  }

  function deleteHeaderNode(node) {
    if (node) {
      util.logDebugOptional(
        "functions",
        "deleteHeaderNode() - deleting " + node.nodeName + "\n" + node.innerHTML,
      );
      orgQuoteHeaders.push(node);
      gMsgCompose.editor.deleteNode(node);
    }
  }

  function isQuotedNode(node) {
    if (!node) {
      return false;
    }

    // Note:  moz-cite-prefix might be the container for the headers (shown _before_ the quote)
    // 		    node.className &&
    // 		    node.className.indexOf('moz-cite-prefix')>=0
    if (node.nodeName && node.nodeName.toLowerCase() == "blockquote") {
      return true;
    }
    if (!node.parentNode) {
      return false;
    }
    // make this recursive; if the node is child of a quoted parent, it is also considered to be quoted.
    return isQuotedNode(node.parentNode);
  }

  // -----------------------------------
  // Delete quote header (reply)
  //In compose with HTML, body is
  //	<BR><BR>(<- if reply_on_top=1) <#text#>..... (reply_header_xxxx) <BLOCKQUOTE> original-message
  //In compose with TEXT, body is
  //	<BR><BR>(<- if reply_on_top=1) <#text#>..... (reply_header_xxxx) <BR><SPAN> original-message
  //We need to remove a few lines depending on reply_ono_top and reply_header_xxxx.
  // [Bug 26523] added an additional option to only delete the space before the original quote header
  function delReplyHeader(idKey, onlySpace) {
    // function countLines(str) { return str.split("\n").length - 1; }
    util.logDebugOptional("functions", "SmartTemplate4.delReplyHeader()");
    let rootEl = SmartTemplate4.composer.body;
    // if (pref.getCom("mail.identity." + idKey + ".reply_on_top", 1) == 1) {
    // 	lines = 2;
    // }
    if (prefs.getMyBoolPref("debug.functions.delReplyHeader")) {
      // eslint-disable-next-line no-debugger
      debugger;
    }

    let node = rootEl.firstChild,
      elType = "",
      skipInPlainText = !gMsgCompose.composeHTML,
      preserve = prefs.getMyBoolPref("plainText.preserveTextNodes"),
      foundReplyHeader = false;
    // delete everything except (or until in plaintext?) quoted part
    while (node) {
      let n = node.nextSibling;
      // skip the forwarded part
      // (this is either a blockquote or the previous element was a moz-cite-prefix)
      if (skipInPlainText && elType == "cite-prefix") {
        // all following parts are in plain text, so we don't know
        // whether they are all part of the quoted email
        break;
      }

      if (isQuotedNode(node) || elType == "cite-prefix" || elType == "moz-cite-prefix") {
        // skip element after quote header
        node = n;
        continue;
      }

      elType = deleteNodeTextOrBR(node, idKey, skipInPlainText && preserve); // 'cite-prefix'
      if (elType == "cite-prefix") {
        foundReplyHeader = true;
      }
      node = n;
    }

    // remove quote header element
    if (!onlySpace) {
      const quoteHeaderCls = "moz-email-headers-table";
      // recursive search from root element
      let node = findChildNode(rootEl, quoteHeaderCls);
      if (isQuotedNode(node)) {
        // [issue 408] do not delete quote headers that are within blockquote
        util.logDebugOptional(
          "functions.delReplyHeader",
          "found " + quoteHeaderCls + " but it is within a blockquote, exiting.",
        );
        return;
      }
      if (node) {
        util.logDebugOptional(
          "functions.delReplyHeader",
          "found " + quoteHeaderCls + ", calling deleteHeaderNode()…",
        );
        deleteHeaderNode(node);
      }
      if (!foundReplyHeader) {
        node = findChildNode(rootEl, "moz-cite-prefix");
        if (node) {
          // only delete prefix if it is NOT within a blockquote
          if (!isQuotedNode(node)) {
            deleteNodeTextOrBR(node, idKey, skipInPlainText && preserve);
          }
        }
      }
    }

    util.logDebugOptional("functions", "SmartTemplate4.delReplyHeader() ENDS");
  }

  // helper function to find a child node of the passed class Name
  function findChildNode(node, className) {
    return SmartTemplate4.Util.findChildNode(node, className);
  }

  // if can't find in child node, search direct parent
  function findChildNodeOrParent(node, className) {
    return (
      findChildNode(node, className) ||
      (node?.parentNode?.classList?.contains(className) ? node.parentNode : null)
    );
  }

  function testSmartTemplateToken(template, token) {
    if (!template) {
      return false;
    }
    let match = template.toLowerCase().match("%" + token.toLowerCase() + "%");
    return !match ? false : true;
  }

  function testCursorVar(template) {
    return testSmartTemplateToken(template, "cursor");
  }

  function testSignatureVar(template) {
    if (!template) {
      return "";
    }
    let reg = /%(sig)(\([^)]+\))*%/gm,
      match = template.toLowerCase().match(reg);
    util.logDebugOptional("functions", "testSignatureVar() match = " + match);
    if (!match) {
      return "";
    }
    switch (match[0]) {
      case "%sig%":
        return "auto";
      case "%sig(2)%":
        return "auto";
      case "%sig(html)%":
        return "html";
      case "%sig(text)%":
        return "text";
      case "%sig(none)%":
        return "omit";
      default: // invalid %sig% variable!
        util.logToConsole("Invalid %sig% variable: " + match[0]);
        return "";
    }
  }

  // -----------------------------------
  // Delete quote header(forward)
  //In compose with HTML, body is
  //	<BR><BR> <#text#(1041)> <TABLE(headers)> <#text# nodeValue=""> !<BR><BR>! <PRE> original-message
  //In compose with TEXT, body is
  //	<BR><BR> <#text#(1041)><BR> <#text# (headers)>!<BR><BR>! original-message
  //We need to remove tags until two BR tags appear consecutively.
  // AG: To assume that the 2 <br> stay like that is foolish... it change in Tb12 / Tb13
  function delForwardHeader(idKey, onlyHeader) {
    function truncateTo2BR(root) {
      util.logDebugOptional("deleteNodes", "truncateTo2BR()");
      // old method continues until it finds <br><br> after header table
      let brcnt = 0;
      while (root.firstChild && brcnt < 2) {
        if (root.firstChild.nodeName == "BR") {
          brcnt++;
        } else {
          brcnt = 0;
        }
        deleteHeaderNode(root.firstChild);
      }
      // delete any trailing BRs
      while (root.firstChild && root.firstChild.nodeName == "BR") {
        deleteHeaderNode(root.firstChild);
      }
    }

    util.logDebugOptional("functions", "SmartTemplate4.delForwardHeader()");
    let origMsgDelimiter, used;

    // [Bug 25089] default forward quote can't be completely hidden
    try {
      // from Tb 31.0 we have a dedicated string for _forwarded_ messages!
      let fwdId = "mailnews.forward_header_originalmessage",
        replyId = "mailnews.reply_header_originalmessage";

      used = fwdId;
      origMsgDelimiter = Services.prefs.getComplexValue(fwdId, Ci.nsIPrefLocalizedString).data;
      // fallback to replyId if it doesn't exist.
      if (!origMsgDelimiter) {
        used = replyId;
        origMsgDelimiter = Services.prefs.getComplexValue(replyId, Ci.nsIPrefLocalizedString).data;
      }
    } catch (ex) {
      util.logException(
        "Could not retrieve forward/reply delimiter {" + used + "}, using fallback.",
        ex,
      );
      origMsgDelimiter = origMsgDelimiter || "--- Original Message ---"; // safe default
    }

    util.logDebugOptional(
      "functions.delForwardHeader",
      "Retrieved Delimiter Token from mime properties: " + origMsgDelimiter,
    );

    // Delete original headers
    let rootEl = SmartTemplate4.composer.body,
      node = rootEl.firstChild,
      skipInPlainText = !gMsgCompose.composeHTML,
      preserve = prefs.getMyBoolPref("plainText.preserveTextNodes");
    util.logDebugOptional(
      "functions.delForwardHeader",
      "Running Loop to remove unnecessary whitespace..",
    );

    while (node) {
      const n = node.nextSibling;

      if (node.nodeValue && node.nodeValue == origMsgDelimiter) {
        deleteNodeTextOrBR(node, idKey, skipInPlainText && preserve); // HTML + plain text - stop after removing "--- original message ---"
        break;
      }

      // Analyse the forwarded part. if  it is plain text, let's search for the delimiter in any case (higher risk)!
      // [Bug 25097] do not restrict this to html mode only
      if (node.className == "moz-forward-container") {
        // lets find the ---original message--- now
        let searchWhiteSpace = true,
          truncWhiteSpace = false,
          inner = node.firstChild;
        while (inner) {
          let m = inner.nextSibling;
          const isFound = inner.nodeValue == origMsgDelimiter;
          if (isFound || truncWhiteSpace) {
            // delete all whitespace before delim
            if (searchWhiteSpace) {
              searchWhiteSpace = false;
              m = inner = node.firstChild; //restart ...
              truncWhiteSpace = true; // ...and delete EVERYTHING until delimiter
              continue;
            }
            util.logDebugOptional(
              "functions.delForwardHeader",
              "deleting node: " + inner.nodeValue,
            );
            gMsgCompose.editor.deleteNode(inner); // we are not pushing this on to orgQuoteHeaders as there is no value to this.
            if (inner.nodeValue == origMsgDelimiter) {
              break;
            }
          }
          inner = m;
        }
        node = n;
        continue;
      }

      if (!onlyHeader) {
        deleteNodeTextOrBR(node, idKey);
      }
      node = n;
    }

    // remove the original Mail Header
    util.logDebugOptional("functions.delForwardHeader", "Remove the original header…");
    // recursive search from root element
    node = findChildNode(rootEl, "moz-email-headers-table");
    if (node) {
      util.logDebugOptional(
        "functions.delForwardHeader",
        "found moz-email-headers-table; deleting",
      );
      let nextNode = node.nextSibling;
      deleteHeaderNode(node);
      // delete trailing newlines!
      deleteWhiteSpaceNodes(nextNode);
    } else {
      util.logDebugOptional(
        "functions.delForwardHeader",
        "Could not find moz-email-headers-table!",
      );
      if (!gMsgCompose.composeHTML) {
        truncateTo2BR(rootEl.firstChild);
      }
    }

    util.logDebugOptional("functions", "SmartTemplate4.delForwardHeader() ENDS");
  }

  function delForwardedBody() {
    let rootEl = SmartTemplate4.composer.body;
    let bdy = rootEl.querySelector("div.moz-forward-container");
    if (bdy) {
      bdy.parentNode.removeChild(bdy);
    }
  }

  // -----------------------------------
  // Remove template messages and Restore original quote headers
  function removePreviousTemplate() {
    try {
      util.logDebugOptional("functions", "SmartTemplate4.removePreviousTemplate()");
      let curEl = SmartTemplate4.composer.body.firstChild,
        nextEl = curEl;
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
        gMsgCompose.editor.insertNode(orgQuoteHeaders.pop(), SmartTemplate4.composer.body, 0);
      }
    } catch (ex) {
      util.logException(
        "removePreviousTemplate - exception trying to remove previous template:",
        ex,
      );
    }
  }

  function clearTemplate() {
    util.logDebugOptional("functions", "SmartTemplate4.clearTemplate()");
    orgQuoteHeaders.length = 0;
    SmartTemplate4.Sig.reset();
  }

  // -----------------------------------
  // Get processed template
  async function getProcessedText(templateText, idKey, composeType, ignoreHTML) {
    if (!templateText) {
      return "";
    }
    const flags = SmartTemplate4.PreprocessingFlags;

    util.logDebugOptional(
      "functions.getProcessedText",
      "START =============  getProcessedText()   ==========",
    );
    util.logDebugOptional("functions.getProcessedText", "Process Text:\n" + templateText + "[END]");
    var pref = SmartTemplate4.pref;

    SmartTemplate4.calendar.init(); // set for default locale
    let isDraftLike =
      !composeType || flags.isFileTemplate || pref.isUseHtml(idKey, composeType, false); // do not escape / convert to HTML

    templateText = SmartTemplate4.parseModifier(templateText, composeType, true); // global clipboard setting (replaces with %toclipboard()%)
    let regular = await SmartTemplate4.regularize(
      templateText,
      composeType,
      false, // isStationery
      ignoreHTML,
      isDraftLike,
    );

    // now that all replacements were done, lets run our global routines to replace / delete text, (such as J.B. "via Paypal")
    regular = SmartTemplate4.parseModifier(regular, composeType); // run global replacement functions (deleteText, replaceText)

    // [Bug 26364] Inline Images are not shown.
    // fix DataURLs from other template (Stationery)
    // This won't work if there is no "file:\\\" portion given (relative path / current folder not supported)
    // we can fix the Data urls for file:/// images now
    // assume the URL is terminated by a single quote, double quote or &gt;
    const Frex = new RegExp("file:///[^\"'>]*", "g");
    regular = regular.replace(
      Frex, // /file:\/\/\/[^\"\'\>]*/g
      function (match) {
        util.logDebugOptional("composer", "Replacing image file as data: " + match);
        return util.getFileAsDataURI(match);
      },
    );

    // find & fix relative <img> paths:
    const Irex = new RegExp(/(<img[^>]+src=["'])([^"'>]+)(["'][^>]*>)/, "g"); // make 3 groups, g2=path
    let currentPath = flags.filePaths
      ? flags.filePaths.length
        ? flags.filePaths[flags.filePaths.length - 1]
        : ""
      : ""; // top of stack

    regular = regular.replace(
      Irex, // /file:\/\/\/[^\"\'\>]*/g
      function (match, g1, g2, g3) {
        if (g2 && g2.startsWith(" ")) {
          // [issue 373]  for: src=" data..."
          g2 = g2.trim();
          if (g2.startsWith("data:")) {
            return g1 + g2 + g3;
          }
        }
        // util.logDebugOptional('composer', 'Replacing image file as data: ' + match);
        if (!util.isFilePathAbsolute(g2)) {
          if (currentPath) {
            let newP = util.getPathFolder(currentPath, g2);
            if (newP) {
              util.logDebug("replacing relative img path: " + newP + "…");
              let filePath = "file:///" + newP.replace(/\\/gm, "/");
              try {
                let dataUrl = util.getFileAsDataURI(filePath);
                if (dataUrl) {
                  return g1 + dataUrl + g3;
                } else {
                  util.logDebug("Could not resolve image path! Returning unchanged img tag.");
                }
              } catch (ex) {
                util.logException(ex, "Failed to read image file " + filePath);
              }
            } else {
              util.logDebug("Could not convert relative path: " + g2);
            }
          }
        }
        return match;
      },
    );

    util.logDebugOptional("functions.getProcessedText", "regular:\n" + regular);
    util.logDebugOptional(
      "functions.getProcessedText",
      "=============  getProcessedText()   ========== END",
    );
    return regular;
  }

  // new function to retrieve quote header separately [Bug 25099]
  // in order to fix bottom-reply
  async function getQuoteHeader(composeType, idKey) {
    let quoteHdr = SmartTemplate4.pref.getQuoteHeader(idKey, composeType, "");
    let ignoreHTML = false; // was false always
    return await getProcessedText(quoteHdr, idKey, composeType, ignoreHTML);
  }

  // -----------------------------------
  // Get template message - wrapper for main template field
  async function getSmartTemplate(composeType, idKey) {
    util.logDebugOptional("functions", "getSmartTemplate(" + composeType + ", " + idKey + ")");
    let msg = SmartTemplate4.pref.getTemplate(idKey, composeType, "");
    let ignoreHTML = false; // was false always - do we need gMsgCompose.composeHTML ?
    return await getProcessedText(msg, idKey, composeType, ignoreHTML);
  }

  // [issue 243] set the composeCase and return the SmartTemplate st4composeType (new, rps, fwd)
  function setComposeCase(composeType) {
    const msgComposeType = Ci.nsIMsgCompType;
    let st4composeType = "";
    switch (composeType) {
      case msgComposeType.Template: // new type for 1.6 - Thunderbird 52 uses this in "Edit As New" case
        this.composeCase = "tbtemplate"; // flags.isThunderbirdTemplate
        st4composeType = "new"; // was "new" but there should be no processing in templates
        break;
      // new message -----------------------------------------
      case msgComposeType.New:
      case msgComposeType.NewsPost:
      case msgComposeType.MailToUrl:
        this.composeCase = "new";
        st4composeType = "new";
        break;

      // reply message ---------------------------------------
      case msgComposeType.Reply:
      case msgComposeType.ReplyAll:
      case msgComposeType.ReplyToSender:
      case msgComposeType.ReplyToGroup:
      case msgComposeType.ReplyToSenderAndGroup:
      case msgComposeType.ReplyToList:
        this.composeCase = "reply";
        st4composeType = "rsp";
        break;

      // forwarding message ----------------------------------
      case msgComposeType.ForwardAsAttachment:
      case msgComposeType.ForwardInline:
        this.composeCase = "forward";
        st4composeType = "fwd";
        break;

      // do not process -----------------------------------
      // (Draft:9/ReplyWithTemplate:12)
      case msgComposeType.Draft:
        {
          this.composeCase = "draft";
          let messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger),
            msgDbHdr = gMsgCompose.originalMsgURI
              ? messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).QueryInterface(Ci.nsIMsgDBHdr)
              : null;
          if (msgDbHdr) {
            const nsMsgKey_None = 0xffffffff;
            if (msgDbHdr.threadParent && msgDbHdr.threadParent != nsMsgKey_None) {
              st4composeType = "rsp"; // just guessing, of course it could be fwd as well
            }
            if (msgDbHdr.numReferences == 0) {
              st4composeType = "new";
            }
          }
        }
        break;
      case msgComposeType.EditAsNew:
        this.composeCase = "editAsNew";
        break;
      case msgComposeType.EditTemplate:
        this.composeCase = "editTemplate";
        break;
      default:
        this.composeCase = "";
        break;
    }
    return st4composeType;
  }

  // -----------------------------------
  // Add template message
  async function insertTemplate(startup, flags, fileTemplateSource) {
    if (SmartTemplate4.Preferences.isBackgroundParser()) {
      // [issue 184] - this should never be called if this flag is set
      alert(
        "To do: insertTemplate() through background - [issue 184]\n" +
          "This used to call ComposeMessage after adding item to SmartTemplate4.fileTemplates.armedQueue.",
      );
      return;
    }

    /**
     * Wrap a node in a <p> if its parent is BODY or DIV
     * @param {Node} node - the cursor node to wrap
     */
    const wrapInParagraph = (node) => {
      // [issue 397]
      if (!node || !node.parentNode) {
        return null;
      }

      const doc = node.ownerDocument;
      let parent = node.parentNode;

      // Don't wrap if already inside a block-level element
      let ancestor = parent;
      while (ancestor && ancestor !== doc.body) {
        if (["P", "LI", "TD", "TH"].includes(ancestor.tagName)) {
          return ancestor;
        }
        ancestor = ancestor.parentNode;
      }

      // insert a placeholder paragraph where the new paragraph should go
      const placeholder = doc.createElement("p");
      placeholder.className = "st4placeholder";
      placeholder.appendChild(doc.createElement("br")); // ensure visible height
      parent.insertBefore(placeholder, node);

      // Collect nodes from previous <br> (or start) to next <br> (or end)
      const movingNodes = [];
      let started = false;
      for (const child of Array.from(parent.childNodes)) {
        if (child === node) {
          started = true;
        }
        if (started) {
          movingNodes.push(child);
          if (child.tagName === "BR") {
            break;
          }
        }
      }

      if (movingNodes.length === 0) {
        return null;
      }

      // Create <p> and append nodes
      const para = doc.createElement("p");
      for (const n of movingNodes) {
        para.appendChild(n);
      }

      // If paragraph is empty (or contains only cursor span), append <br> for visibility
      if (
        para.childNodes.length === 0 ||
        (para.childNodes.length === 1 && para.firstChild.className === "st4cursor")
      ) {
        const br = doc.createElement("br");
        para.appendChild(br);
      }

      // replace the placeholder with the real paragraph
      parent.replaceChild(para, placeholder);

      return para;
    };

    const logCaretPosition = (label) => {
      if (!SmartTemplate4.Preferences.isDebugOption("composer.cursor")) {
        return;
      }
      let caretEl = editor.document.querySelector("span._moz-caret, span#caret");
      let what = "caret element";
      if (!caretEl) {
        caretEl = editor.document.querySelector("span.st4cursor");
        what = "smartTemplates cursor";
      }

      if (caretEl) {
        SmartTemplate4.Util.logHighlightDebug(
          "composer.cursor",
          "white",
          "#8e0477a4",
          `${label}: found ${what} ${caretEl.outerHTML} after:`,
          caretEl?.previousElementSibling,
        );
      } else {
        SmartTemplate4.Util.logHighlightDebug(
          "composer.cursor",
          "white",
          "#8e0477a4",
          `${label}: no caret / cursor found`,
        );
      }
    };

    const cleanPlainTextNewLines = (myHtml) => {
      let lc = myHtml.toLocaleLowerCase();
      if (lc.includes("<br") || lc.includes("<p")) {
        return myHtml.replace(/(\r\n)+|\r+|\n+|^[ \t]+/gm, "");
      }
      return myHtml;
    };

    let isDebugComposer = prefs.isDebugOption("composer.breakpoint");
    if (!flags) {
      // if not passed, create an empty "flags" object, and initialise it.
      flags = {};
      SmartTemplate4.initFlags(flags);
      flags.identitySwitched = true; // new flag
    }
    if (gMsgCompose?.bodyModified === false) {
      flags.isBodyUnmodified = true; // [issue 352]
    }

    if (SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning) {
      return;
    }
    SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning = true; // [issue 139] avoid duplicates
    SmartTemplate4.PreprocessingFlags.isStartup = startup;

    util.logDebugOptional(
      "functions,functions.insertTemplate",
      `insertTemplate(startup: ${startup} , gMsgCompose.type = ${gMsgCompose.type}`,
      flags,
    );
    const msgComposeType = Ci.nsIMsgCompType,
      editor = util.CurrentEditor;
    let pref = SmartTemplate4.pref,
      doc = gMsgCompose.editor.document,
      template = null,
      quoteHeader = "",
      idKey = util.getIdentityKey(document);

    util.logDebugOptional("identities", "Retrieved msgIdentity key value: " + idKey);
    if (!idKey) {
      util.logDebugOptional("identities", "no key, getting from gMsgCompose.identity…");
      idKey = gMsgCompose.identity.key;
    }
    let isActiveOnAccount = false,
      acctMgr = MailServices.accounts,
      identitySource,
      theIdentity = acctMgr.getIdentity(idKey);

    if (!theIdentity) {
      theIdentity = gMsgCompose.identity;
      identitySource = "gMsgCompose.identity";
    } else {
      identitySource = "msgIdentity.Identity";
    }
    util.logDebugOptional(
      "identities",
      "Retrieved identity from " +
        identitySource +
        "\n" +
        "key = " +
        (theIdentity ? theIdentity.key : "NO IDENTITY!") +
        "\n" +
        "identityName = " +
        (theIdentity ? theIdentity.identityName : "NO IDENTITY!"),
    );
    // Switch account
    if (startup) {
      // Clear template
      clearTemplate();
    } else {
      SmartTemplate4.PreprocessingFlags.isStartup = false;
      if (gMsgCompose.type != msgComposeType.Template) {
        // Check identity changed or not; also check whether new template was requested from composer window
        if (
          !flags.isChangeTemplate &&
          !flags.identitySwitched &&
          gCurrentIdentity &&
          gCurrentIdentity.key == idKey
        ) {
          SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning = false;
          return;
        }
        // Undo template messages (does _not_ remove signature!)
        removePreviousTemplate();
      }
    }

    // is the %sig% variable used?
    let sigVarDefined = false,
      sigType = null,
      composeCase = "undefined",
      st4composeType = "",
      rawTemplate = "";
    if (isDebugComposer) {
      // eslint-disable-next-line no-debugger
      debugger;
    }
    // start parser...
    try {
      switch (gMsgCompose.type) {
        case msgComposeType.Template: // new type for 1.6 - Thunderbird 52 uses this in "Edit As New" case
          composeCase = "tbtemplate"; // flags.isThunderbirdTemplate
          st4composeType = "new"; // was "new" but there should be no processing in templates
          break;
        // new message -----------------------------------------
        //	(New:0 / NewsPost:5 / MailToUrl:11)
        case msgComposeType.New:
        case msgComposeType.NewsPost:
        case msgComposeType.MailToUrl:
          composeCase = "new";
          st4composeType = "new";
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
          composeCase = "reply";
          st4composeType = "rsp";
          break;

        // forwarding message ----------------------------------
        // (ForwardAsAttachment:3 / ForwardInline:4)
        case msgComposeType.ForwardAsAttachment:
        case msgComposeType.ForwardInline:
          composeCase = "forward";
          st4composeType = "fwd";
          break;

        // do not process -----------------------------------
        // (Draft:9/ReplyWithTemplate:12)
        case msgComposeType.Draft:
          {
            composeCase = "draft";
            let messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger),
              msgDbHdr = gMsgCompose.originalMsgURI
                ? messenger.msgHdrFromURI(gMsgCompose.originalMsgURI).QueryInterface(Ci.nsIMsgDBHdr)
                : null;
            if (msgDbHdr) {
              const nsMsgKey_None = 0xffffffff;
              if (msgDbHdr.threadParent && msgDbHdr.threadParent != nsMsgKey_None) {
                st4composeType = "rsp"; // just guessing, of course it could be fwd as well
              }
              if (msgDbHdr.numReferences == 0) {
                st4composeType = "new";
              }
            }
          }
          break;
        case msgComposeType.EditAsNew: // Tb 60+
          // no processing should be done
          util.logDebug("Edit As New - exit insertTemplate() without processing");
          SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning = false;
          return;
        case msgComposeType.EditTemplate: // Tb 60+
          // no processing should be done
          util.logDebug("Edit Template - exit insertTemplate() without processing");
          SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning = false;
          return;
        default:
          st4composeType = "";
          break;
      }

      isActiveOnAccount = pref.isTemplateActive(idKey, st4composeType, false);
      // draft + startup: do not process!
      if (startup && composeCase == "draft") {
        isActiveOnAccount = false;
      }

      if (flags.isFileTemplate) {
        isActiveOnAccount = true;
      }

      if (isActiveOnAccount) {
        // Message File loaded:
        if (prefs.isDebugOption("functions.insertTemplate")) {
          // eslint-disable-next-line no-debugger
          debugger;
        }

        if (flags.isFileTemplate && fileTemplateSource && !fileTemplateSource.failed) {
          rawTemplate = fileTemplateSource.HTML || fileTemplateSource.Text;
        } else if (flags.isThunderbirdTemplate) {
          rawTemplate = editor.rootElement.innerHTML; // treat email as raw template
        } else {
          rawTemplate = flags.isThunderbirdTemplate
            ? ""
            : pref.getTemplate(idKey, st4composeType, "");
        }

        sigType = testSignatureVar(rawTemplate); // 'omit' for supressing sig from smart template

        // if Stationery has %sig(none)% then flags.omitSignature == true
        sigVarDefined = flags.hasSignature || sigType ? true : false;
        try {
          // get signature element and remove the one Tb has inserted
          const { newSig } = await extractSignature(theIdentity, sigType, st4composeType);
          SmartTemplate4.signature = newSig;
        } catch (ex) {
          SmartTemplate4.signature = "";
          util.logException("Could not extract signature - is your signature path correct?", ex);
        }

        if (flags.isThunderbirdTemplate) {
          // use innerHTML instead of outer (we do not want to replace the "body" part)
          // if %sig% variable is in Tb Template it is going to be expanded at this step.
          template = await getProcessedText(
            editor.rootElement.innerHTML,
            idKey,
            st4composeType,
            true,
          ); // ignoreHTML = true ?
          // need to empty out the innerHTML if we insert this to avoid duplication.
          editor.rootElement.innerHTML = "";
        } else {
          // main processing - note: this calls getProcessedText()
          // for thunderbird template case, we should get the body contents AND PROCESS THEM?
          if (flags.isFileTemplate) {
            util.logDebugOptional(
              "functions.insertTemplate",
              "processing fileTemplate(" + fileTemplateSource + ")",
            );

            if (rawTemplate.match(/%suppressQuoteHeaders*%/gm)) {
              flags.suppressQuoteHeaders = true;
            }
            // [issue 19] switch on ignoreHTML to avoid unneccessarily replacing line breaks with <br>
            template = await getProcessedText(rawTemplate, idKey, st4composeType, true); // ignoreHTML
          } else {
            util.logDebugOptional(
              "functions.insertTemplate",
              "retrieving Template: getSmartTemplate(" + st4composeType + ", " + idKey + ")",
            );
            template = await getSmartTemplate(st4composeType, idKey);
          }
          if (template.match(/%deleteForwardedBody%/gm)) {
            flags.deleteForwardedBody = true;
          }

          util.logDebugOptional(
            "functions.insertTemplate",
            "retrieving quote Header: getQuoteHeader(" + st4composeType + ", " + idKey + ")",
          );
          quoteHeader = await getQuoteHeader(st4composeType, idKey);
        }

        if (flags.suppressQuoteHeaders) {
          util.logDebug(
            "Suppressing Quote header, as template has demanded. (%suppressQuoteHeaders%)",
          );
          quoteHeader = "";
        }
        if (flags.deleteForwardedBody) {
          util.logDebug(
            "Deleting Forwarded message body, as template has demanded. (%deleteForwardedBody%)",
          );
          delForwardedBody();
        }
        let isQuoteHeader = quoteHeader ? true : false;

        switch (composeCase) {
          case "new":
          case "tbtemplate":
            break;
          case "draft":
            // when do we remove old headers?
            break;
          case "reply":
            if (flags.suppressQuoteHeaders) {
              delReplyHeader(idKey);
            } else if (pref.getCom("mail.identity." + idKey + ".auto_quote", true)) {
              // stationery has a placeholder for the original quote text.
              if (pref.isDeleteHeaders(idKey, st4composeType, false)) {
                // when in stationery we only delete the quote header and not all preceding quotes!
                delReplyHeader(idKey);
              } else {
                delReplyHeader(idKey, true); // remove just spaces [Bug 26523]
              }
            }
            break;
          case "forward":
            if (gMsgCompose.type == msgComposeType.ForwardAsAttachment) {
              break;
            }
            if (flags.suppressQuoteHeaders || pref.isDeleteHeaders(idKey, st4composeType, false)) {
              delForwardHeader(idKey, false);
            }
            break;
        }

        if (isQuoteHeader) {
          // this function extracts the quoted part (when replying)
          // it should catch the "whole" email when forwarding...
          let qdiv = function () {
            // closure to avoid unnecessary processing
            let qd = util.mailDocument.createElement("div");
            qd.id = "smartTemplate4-quoteHeader";
            if (!IsHTMLEditor()) {
              // [issue 54] extra line spaces in (html) quote header when replying text only.
              // if template contains <br> or <p> let's strip out "formatting" text content line breaks.
              quoteHeader = cleanPlainTextNewLines(quoteHeader);
            }
            // [issue 393] do not use innerHTML directly
            // qd.innerHTML = quoteHeader;
            util.insertHtmlSafely(qd, quoteHeader);
            return qd;
          };

          // replace the standard quote header
          let firstQuote =
            st4composeType == "fwd"
              ? editor.rootElement.firstChild
              : editor.rootElement.getElementsByTagName("BLOCKQUOTE")[0];
          // [Bug 26261] Quote header not inserted in plain text mode
          if (!firstQuote) {
            firstQuote = editor.rootElement.firstChild;
          }
          if (firstQuote) {
            let quoteHd = firstQuote.parentNode.insertBefore(qdiv(), firstQuote),
              prev = quoteHd.previousSibling;
            // force deleting the original quote header:
            if (prev && prev.className && prev.className.indexOf("moz-cite-prefix") >= 0) {
              prev.parentNode.removeChild(prev);
            }
          }
        } else {
          // delete all <br> before quote!
        }
      } else {
        util.logDebugOptional(
          "functions.insertTemplate",
          "insertTemplate - processing is not active for id " + idKey,
        );
        // remove old signature!
        // we shouldn't do this if it is not active on account unless we inserted it just beforehand?
        // extractSignature(theIdentity, false, st4composeType);
      }
    } catch (ex) {
      util.logException(
        "insertTemplate - exception during parsing. Continuing with inserting template!",
        ex,
      );
    }

    let targetNode = 0,
      templateDiv,
      // new global settings to deal with [Bug 25084]
      breaksAtTop = prefs.getMyIntPref("breaksAtTop"),
      bodyEl = SmartTemplate4.composer.body,
      preheaderEl = null,
      bodyContent = "";

    if (!IsHTMLEditor()) {
      template = cleanPlainTextNewLines(template);
    }

    // [Bug 26260] only remove body for mailto case if active on account
    if (isActiveOnAccount && gMsgCompose.type == msgComposeType.MailToUrl) {
      // back up the mailto body  (was  bodyContent = bodyEl.innerHTML;  )
      // replace newline chars, usually encoded LF or CLRF (decimal 10 / 13-10)
      bodyContent = bodyEl.textContent
        .trim()
        .replace(/\\n/gm, "<br/>")
        .replace(/%0D%0A/gm, "<br/>")
        .replace(/%0A/gm, "<br/>");
      if (bodyContent) {
        const mailtoVar = "%mailto(body)%";
        if (template && rawTemplate.includes(mailtoVar)) {
          template = template.replace("<span class='mailToBody'/>", bodyEl.innerHTML);
          bodyEl.textContent = ""; // clear out body
          bodyContent = "";
          util.logDebugOptional(
            "composer",
            "msgComposeType.MailToUrl - injecting mailto content:\n" + bodyEl.innerHTML,
          );
        } else {
          bodyEl.textContent = ""; // clear out body
          util.logDebugOptional(
            "composer",
            "msgComposeType.MailToUrl - clearing template and setting to:\n" + bodyContent,
          );
          template = bodyContent; // clear template
          SmartTemplate4.sigInTemplate = false;
        }
      }
    }

    // [issue 79]
    // Extract <head> sections and inject into doc head.
    // merge all <body> attributes into document body (body will be converted into an attributeless div)
    try {
      const isExtractHead = SmartTemplate4.Preferences.getMyBoolPref("header.inject");
      if (isExtractHead) {
        let tempDiv = editor.document.createElement("div");
        tempDiv.id = "tempTemplate";
        tempDiv.hidden = true;
        // replace <head> tags, because they will be removed on adding the HTML:
        if (template) {
          // convert <head> and <body> tags into divs safely
          const safeHTML = template
            .replace(/<head\b/gi, "<div class='smartTemplateHeader'")
            .replace(/<\/head>/gi, "</div>")
            .replace(/<body\b/gi, "<div class='smartTemplateBody'")
            .replace(/<\/body>/gi, "</div>");
          util.insertHtmlSafely(tempDiv, safeHTML);
        }

        // ===== merge head contents
        let heads = tempDiv.querySelectorAll("div.smartTemplateHeader");
        if (heads.length) {
          const docHeader = editor.document.head || editor.document.getElementsByTagName("head")[0];
          const headerNodes = Array.from(heads); // snapshot the NodeList into a static array immediately

          headerNodes.forEach((head, i) => {
            util.logDebugOptional("composer", `SmartTemplates - head tag found\n${head.outerHTML}`);
            util.insertHtmlSafely(
              docHeader,
              `\n<!-- head [${i}] from template -->\n${head.innerHTML}`,
            );
          });

          // safely remove original tags – array is detached from live mutations
          headerNodes.forEach((head) => {
            try {
              if (head?.isConnected) {
                head.remove();
              }
            } catch { ; }
          });
          template = tempDiv.innerHTML;
        }

        // ===== merge body attributes
        // honors user-supplied <body> attribs, overwrite existing ones by design
        const bodies = Array.from(tempDiv.querySelectorAll("div.smartTemplateBody"));
        if (bodies.length) {
          // gather all attributes.
          const allAttributes = [];
          bodies.forEach((body) => {
            [...body.attributes].forEach((a) => {
              allAttributes.push(a);
              body.removeAttribute(a.name);
            });
          });
          // all body attributes are dropped by composer, so there is no need to tidy up!
          // merge attributes into the live document body
          allAttributes.forEach((a) => {
            const isClass = a.name === "class";
            let value = a.value.replace("smartTemplateBody", "").trim();
            if (!value) {
              return;
            }

            if (isClass) {
              value.split(/\s+/).forEach((cl) => {
                if (cl) {
                  bodyEl.classList.add(cl);
                }
              });
            } else {
              bodyEl.setAttribute(a.name, value);
            }
          });

          // finally, clean up the temp markup
          bodies.forEach((b) => {
            try {
              if (b.isConnected) {
                b.remove();
              }
            } catch (ex) {
              util.logDebugOptional(
                "composer",
                "Skipping tidy up body element due to removal error",
                ex,
              );
            }
          });
          template = tempDiv.innerHTML; // extract the remaining markup again.
        }
        tempDiv.remove();
      }
    } catch (ex) {
      util.logException("Extract header from template failed", ex);
    }

    // add template message --------------------------------
    // if template text is empty: still insert targetNode as we need it for the cursor!
    // however we must honor the setting "breaks at top" as we now remove any <br> added by Tb
    if (isActiveOnAccount) {
      util.logDebugOptional("composer", "isActiveOnAccount: creating template Div…");
      templateDiv = util.mailDocument.createElement("div");

      // now insert quote Header separately
      try {
        if (flags.isThunderbirdTemplate && template.length) {
          // remove original st4 div
          let oldSt4Div = editor.document.getElementById("smartTemplate4-template");
          if (oldSt4Div) {
            oldSt4Div.parentNode.removeChild(oldSt4Div);
          }
        }
        templateDiv.id = "smartTemplate4-template";
        /* TEST
				if (prefs.getMyBoolPref('debug.composer')) {
					// color the template part for debugging.
					templateDiv.style.backgroundColor = "#FFF4CC";
					templateDiv.style.border = "1px solid #FFE070";
				} */
        util.logDebugOptional("composer", "Generating template Div innerHTML…\n" + template);
        // This encodes "&" in href attributes to &amp;   !

        util.insertHtmlSafely(templateDiv, template || "");
        if (SmartTemplate4.Preferences.getMyBoolPref("sanitizeStyles.removeDuplicatesInTemplate")) {
          SmartTemplate4.Util.removeDuplicateStyleBlocks(templateDiv, bodyEl);
        }
        if (SmartTemplate4.Preferences.getMyBoolPref("sanitizeStyles.removeDuplicatesInHead")) {
          SmartTemplate4.Util.removeDuplicateStyleBlocks(editor.document.head);
        }

        if (theIdentity.replyOnTop) {
          // this is where we lose the default "paragraph" style
          editor.beginningOfDocument();
          for (let i = 0; i < breaksAtTop; i++) {
            gMsgCompose.editor.insertNode(
              util.mailDocument.createElement("br"),
              SmartTemplate4.composer.body,
              0,
            );
          }
          // the first Child should be BLOCKQUOTE (header is inserted afterwards)
          util.logDebugOptional(
            "composer",
            "Reply on Top - inserting template before first root child",
          );
          targetNode = editor.rootElement.insertBefore(templateDiv, editor.rootElement.firstChild);
        } else {
          for (let i = 0; i < breaksAtTop; i++) {
            SmartTemplate4.composer.body.appendChild(util.mailDocument.createElement("br"));
          }
          util.logDebugOptional(
            "composer",
            "Reply at Botton - appending template to first root child",
          );
          targetNode = editor.rootElement.appendChild(templateDiv); // after BLOCKQUOTE (hopefully)
          editor.endOfDocument();
        }
        // %quotePlaceholder(quotelevel)%
        let quoteNode = templateDiv.querySelector("blockquote[class=SmartTemplate]");

        // clean old quotes
        if (quoteNode) {
          function quoteLevel(element, level) {
            if (!element || !element.parentNode) {
              return level;
            }
            let p = element.parentNode;
            if (p.tagName && p.tagName.toLowerCase() == "blockquote") {
              // increase level and check grandparent
              return quoteLevel(p, level + 1);
            }
            return quoteLevel(p, level);
          }

          let lev = quoteNode.getAttribute("quotelevel"),
            quoteLevels = 100;
          if (lev) {
            if (lev == "all") {
              quoteLevels = 100;
            } else {
              quoteLevels = parseInt(lev, 10);
            }
          }

          let quotePart =
            st4composeType == "fwd"
              ? bodyEl.querySelector(".moz-forward-container") // [issue 156]
              : bodyEl.querySelector("blockquote[_moz_dirty]");
          if (quotePart) {
            quoteNode.parentNode.insertBefore(quotePart, quoteNode);

            // remove unwanted levels
            const blocks = quotePart.querySelectorAll("blockquote");
            // remove lower quote levels
            for (let i = 0; i < blocks.length; i++) {
              let p = blocks.item(i),
                lv = quoteLevel(p, 1);

              if (lv > quoteLevels) {
                p.parentNode.removeChild(p);
              }
            }

            // move quote Header above:
            function distanceBody(el) {
              let d = 0;
              if (el) {
                while (el.tagName.toLowerCase() != "body" && el.parentNode) {
                  d++;
                  el = el.parentNode;
                }
              }
              return d;
            }

            let topHeader,
              topDist = 1000,
              qHs = bodyEl.querySelectorAll("#smartTemplate4-quoteHeader");
            for (let i = 0; i < qHs.length; i++) {
              let e = qHs.item(i),
                l = distanceBody(e);
              if (l < topDist) {
                topDist = l;
                topHeader = e;
              }
            }
            if (topHeader && quoteLevel(topHeader, 1) < 2) {
              quotePart.parentNode.insertBefore(topHeader, quotePart);
            }
          }
          const isRemoveStyles = quoteNode.getAttribute("removestyles");
          // move original
          const originalContainer = quoteNode.parentNode;
          originalContainer.removeChild(quoteNode);

          // [issue 331] remove style blocks
          if (isRemoveStyles && quotePart) {
            const styles = quotePart.querySelectorAll("style");
            styles.forEach((s) => {
              util.logDebugOptional(
                "functions.insertTemplate",
                "Removing style block:\n" + s.innerText.substring(0, 65) + "...",
              );
              s.parentElement.removeChild(s);
            });
          }
        }
      } catch (ex) {
        let errorText =
          "{P1}Could not insert Template as HTML; please check for syntax errors.{br}" +
          "This might be caused by html comments <!-- or unclosed tag brackets <...>{P2}" +
          `{pre}${ex}{preEnd}` +
          "{br}Copy template contents to clipboard?";

        let result = await SmartTemplate4.Util.showSmartTemplatesMessage({
          msg: errorText,
          features: ["ok", "cancel"],
        });
        if (result === "ok") {
          let oClipBoard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(
            Ci.nsIClipboardHelper,
          );
          oClipBoard.copyString(template || "");
        }
      }
    }

    logCaretPosition("Before finding cursor");
    util.logDebugOptional("composer", "finding cursor node…");
    // before we handle the sig, lets search for the cursor one time
    // moved code for moving selection to top / bottom
    let caretContainer = findChildNodeOrParent(targetNode, "st4cursor"),
      isCursor = caretContainer != null;
    util.logDebugOptional("functions.insertTemplate", " search %cursor% in template: " + isCursor);

    // insert the signature that was removed in extractSignature() if the user did not have %sig% in their template
    let theSignature = SmartTemplate4.signature;

    if (!IsHTMLEditor()) {
      theSignature = cleanPlainTextNewLines(theSignature);
    }

    SmartTemplate4.Sig.init(theIdentity);
    let isSignatureSetup = SmartTemplate4.Sig.isSignatureSetup,
      serverInfo = util.getServerInfo(idKey), // find out server name and type (IMAP / POP3 etc.)
      common = SmartTemplate4.pref.isCommon(idKey) ? " (uses Common)" : ""; // our "compact log" to assist our users more effective

    try {
      util.logDebugOptional(
        "functions.insertTemplate",
        `identityName:   ${theIdentity.identityName}\n` +
          `key:            ${theIdentity.key}${common}\n` +
          `${serverInfo}------------------------------------------------\n` +
          `sigOnReply:     ${theIdentity.sigOnReply}\n` +
          `sigOnForward:   ${theIdentity.sigOnForward}\n` +
          `sigBottom:      ${theIdentity.sigBottom}\n` + // sig at the end of the quoted text when replying above
          `attachSignature:${theIdentity.attachSignature}\n` +
          `htmlSigFormat:  ${SmartTemplate4.Sig.htmlSigFormat}\n` + // Does htmlSigText contain HTML?
          `composeHtml:    ${theIdentity.composeHtml}\n` +
          `replyOnTop:     ${theIdentity.replyOnTop}\n` + // quoting preference
          `SmartTemplate4.isSignatureSetup:${isSignatureSetup}\n` +
          `SmartTemplate4.sigInTemplate: ${SmartTemplate4.sigInTemplate}\n` +
          `%sig% type: [${sigType}]\n` +
          `compose case, is active? : ${composeCase}, ${isActiveOnAccount}\n` +
          `------------------------------------------------\n` +
          `SmartTemplates version: ${util.Version}\n` +
          `Application: ${util.Application} v${util.AppverFull}\n` +
          `HostSystem: ${util.HostSystem}\n`,
      );
    } catch (ex) {
      util.logException("Logging detail failed", ex);
    }

    /* SIGNATURE HANDLING */
    if (isActiveOnAccount) {
      // && !sigVarDefined

      isSignatureSetup = isSignatureSetup && sigType != "omit" && !flags.omitSignature; // we say there is no signature if %sig(none)% is defined in [Stationery] Template
      util.logDebugOptional(
        "signatures",
        `isSignatureSetup: ${isSignatureSetup}\n` +
          `sigType: ${sigType}\n` +
          `flags.omitSignature: ${flags.omitSignature}\n` +
          `sigVarDefined: ${sigVarDefined}`,
      );
      if (
        (composeCase == "reply" && (theIdentity.sigOnReply || sigVarDefined) && isSignatureSetup) ||
        (composeCase == "forward" &&
          (theIdentity.sigOnForward || sigVarDefined) &&
          isSignatureSetup) ||
        (composeCase == "new" && theSignature && isSignatureSetup) ||
        (composeCase == "tbtemplate" && theSignature && isSignatureSetup)
      ) {
        try {
          if (!SmartTemplate4.sigInTemplate && theSignature) {
            util.logDebugOptional("functions.insertTemplate", " Add Signature… ");

            // add Signature and replace the BR that was removed in extractSignature
            // wrap text only signature to fix [Bug 25093]!
            if (typeof theSignature === "string") {
              let sn = doc.createElement("div");
              // [issue 393] we need to insert the signature html "safely" to avoid script injection
              // sn.innerHTML = theSignature;
              if (!util.insertHtmlSafely(sn, theSignature)) {
                console.log(
                  "insertTemplate - signature handling: insertHtmlSafely failed - we should inject it's html!",
                  theSignature,
                );
              }
              theSignature = sn;
            }

            if (!sigVarDefined || gMsgCompose.type == msgComposeType.MailToUrl) {
              // append signature using usual methods
              // if we reply on bottom we MUST ignore sigBottom (signature will not go on top template!)
              if (!theIdentity.replyOnTop || theIdentity.sigBottom) {
                // only need this in reply case (might not need it at all with breaksAtTop
                if (composeCase == "reply" && breaksAtTop == 0) {
                  bodyEl.appendChild(doc.createElement("br"));
                }
                bodyEl.appendChild(theSignature);
              } else {
                // reply above, before div smartTemplate4-template
                // findChildnode non recursive
                // find direct child of html element (avoid parsing quoted mail)
                templateDiv = bodyEl.querySelector(":scope > #smartTemplate4-template");
                // if we don't find this, lets take the first child div
                if (!templateDiv) {
                  templateDiv = bodyEl.firstChild.nextSibling;
                }
                // insert signature after template
                if (templateDiv.nextSibling) {
                  templateDiv.parentNode.insertBefore(theSignature, templateDiv.nextSibling);
                  templateDiv.parentNode.insertBefore(
                    doc.createElement("br"),
                    templateDiv.nextSibling,
                  );
                } else {
                  // templateDiv.parentNode.appendChild(templateDiv);
                  templateDiv.parentNode.appendChild(doc.createElement("br"));
                  templateDiv.parentNode.appendChild(theSignature);
                }
              }
            }
          }
        } catch (ex) {
          util.logException("handling signature failed", ex);
        }
      }
      // active, but empty signature?
      else {
        if (
          flags.omitSignature &&
          (theSignature.innerHTML == "" ||
            theSignature.innerHTML == SmartTemplate4.signatureDelimiter)
        ) {
          // in %sig(2)% case, the delimiter is built in.
          let sigNode = findChildNode(bodyEl, "st4-signature"); // find <sig>
          if (sigNode) {
            if (isDebugComposer) {
              // eslint-disable-next-line no-debugger
              debugger;
            }
            util.logDebugOptional("signatures", "found signature node, removing…");
            sigNode.parentNode.removeChild(sigNode);
          }
        }
      }

      if (SmartTemplate4.PreprocessingFlags.preHeader) {
        // [issue 274]
        preheaderEl = SmartTemplate4.composer.buildPreHeaderElement(
          SmartTemplate4.PreprocessingFlags.preHeader,
        );
      }

      // PREMIUM FUNCTIONS
      // issue notifications for any premium features used.
      if (util.premiumFeatures.length) {
        // let's reset the local license
        if (!util.hasLicense() || util.licenseInfo.keyType == 2) {
          util.popupLicenseNotification(util.premiumFeatures, true, true);
        }
      }
      if (util.standardFeatures.length) {
        if (!util.hasLicense()) {
          util.popupLicenseNotification(util.standardFeatures, true, false);
        }
      }
      // reset the list of used premium functions for next turn
      util.clearUsedPremiumFunctions(); // will affect main instance
    }

    // if %cursor% is not set explicitly
    // can ONLY be done if we do not incorporate the quote within the template!
    if (!isCursor && !flags.hasQuotePlaceholder && !flags.hasQuoteHeader) {
      let cursor = doc.createElement("span");
      cursor.className = "st4cursor";
      // if we have a template we simply insert it at the bottom of the template
      if (templateDiv) {
        templateDiv.appendChild(cursor);
      } else if (!theIdentity.replyOnTop) {
        // reply on bottom, insert cursor straight after the quote (before the signature)
        bodyEl.appendChild(cursor);
      }
    }

    logCaretPosition("before code for moving selection to top / bottom");
    // moved code for moving selection to top / bottom
    // re-find cursor
    if (!caretContainer) {
      caretContainer = findChildNode(targetNode, "st4cursor");
    }
    isCursor = caretContainer != null;
    try {
      if (targetNode) {
        // usually <body>
        let selCtrl = editor.selectionController, // Ci.nsISelectionController
          isReplyOnTop = theIdentity.replyOnTop,
          forward = !isReplyOnTop; // isReplyOnTop is unreliable if the identity was changed by an Add-on

        if (!isCursor) {
          // if a cursor is set, let's not move to the end / top at all, leave it to the selection controller.
          try {
            selCtrl.completeMove(forward, false); // forward, extend
          } catch (ex) {
            util.logException(
              `editor.selectionController completeMove(forward = $forward$) failed`,
              ex,
            );
          }
          try {
            selCtrl.completeScroll(forward);
          } catch (ex) {
            util.logException(
              `editor.selectionController completeScroll(forward = $forward$) failed`,
              ex,
            );
          }
        }

        let theParent = targetNode.parentNode;
        if (theParent) {
          let nodeOffset = Array.prototype.indexOf(theParent.childNodes, targetNode);
          // collapse selection and move cursor - problem: stationery sets cursor to the top!
          if (isCursor) {
            // look for a child div with lass = 'st4cursor'
            if (isDebugComposer) {
              // eslint-disable-next-line no-debugger
              debugger;
            }
            if (caretContainer && caretContainer.outerHTML) {
              try {
                const scrollFlags = selCtrl.SCROLL_FOR_CARET_MOVE | selCtrl.SCROLL_OVERFLOW_HIDDEN;
                // cursorParent = caretContainer.parentNode; // usually a <p>
                // =========== FORCE CURSOR IN <PARA> ==================================== >>>>
                if (prefs.getMyBoolPref("forceParagraph")) {
                  try {
                    // Apply to the cursor. will only return a paragraph
                    // if the parent was BODY or DIV
                    const newPara = wrapInParagraph(caretContainer);
                    logCaretPosition("After wrapInParagraph()");

                    // Re-find cursor inside the new paragraph
                    if (newPara) {
                      caretContainer = findChildNode(newPara, "st4cursor");
                    } else {
                      caretContainer = findChildNode(editor.document.body, "st4cursor");
                    }
                  } catch (ex) {
                    util.logException("forceParagraph failed \n", ex, { editor });
                  }
                  theParent = caretContainer.parentNode;
                }

                let space = gMsgCompose.editor.document.createTextNode("\u00a0"); // '\u00a0' crashes with JAWS
                if (caretContainer) {
                  const parent = caretContainer.parentNode;
                  parent.insertBefore(space, caretContainer);
                  parent.removeChild(caretContainer);

                  // If the parent is a <p> (paragraph), add a <br> to ensure the paragraph remains non-empty
                  if (parent.tagName.toLowerCase() === "p" && space.textContent === " ") {
                    const br = gMsgCompose.editor.document.createElement("br");
                    parent.appendChild(br); // Ensure the paragraph stays visible
                  }
                }
                editor.selection.selectAllChildren(space);
                if (prefs.getMyBoolPref("cursor.insertSpace")) {
                  editor.selection.collapseToStart(); //
                  editor.selection.modify("extend", "forward", "character");
                  selCtrl.scrollSelectionIntoView(
                    selCtrl.SELECTION_NORMAL,
                    selCtrl.SELECTION_WHOLE_SELECTION,
                    scrollFlags,
                  );
                  selCtrl.setDisplaySelection(selCtrl.SELECTION_ATTENTION);
                } else {
                  editor.selection.collapseToStart();
                  // check if we would create an empty paragraph:
                  // If paragraph only contains the spacer, replace with <br>
                  const parent = space.parentNode;
                  if (
                    parent.tagName.toLowerCase() === "p" &&
                    parent.textContent.trim() === "\u00a0"
                  ) {
                    parent.textContent = ""; // remove spacer safely
                    const br = gMsgCompose.editor.document.createElement("br");
                    parent.appendChild(br);
                  } else {
                    // Otherwise just remove the spacer
                    space.parentNode.removeChild(space);
                  }
                }
                window.updateCommands("style");
                // =========== FORCE CURSOR IN <PARA> ==================================== <<<<
              } catch (ex) {
                util.logException("caretContainer processing failed.", ex);
              }
            }
          } else {
            // no cursor
            if (isReplyOnTop) {
              if (editor.selection.collapseToStart) {
                editor.selection.collapseToStart();
              } else {
                editor.selection.collapse(theParent, nodeOffset + 1);
              }
            } else {
              // if we reply below we must be above the signature.
              if (editor.selection.collapseToEnd) {
                editor.selection.collapseToEnd();
              } else {
                editor.selection.collapse(theParent, nodeOffset + 1);
              }
            }
          }
          /* void scrollIntoView (in short aRegion, in boolean aIsSynchronous, in int16_t aVPercent, in int16_t aHPercent); */
          // editor.selection.scrollIntoView(space,false,10,10);
        }
      }
    } catch (ex) {
      util.logException(
        "editor.selectionController command failed - editor = " + editor + "\n",
        ex,
      );
    }
    logCaretPosition("After moving selection to top / bottom");

    //[] prepend mailto "body" part if missing, in case something went wrong
    if (gMsgCompose.type == msgComposeType.MailToUrl && bodyContent) {
      if (!bodyEl.innerHTML) {
        // [issue 393] avoid innerHTML assignments
        util.insertHtmlSafely(bodyEl, bodyContent);
        util.logDebugOptional("composer", "restoring body inner HTML:\n" + bodyContent);
      }
    }

    bodyEl.setAttribute("smartTemplateInserted", "true"); // guard against duplication!
    await SmartTemplate4.Util.resolveDeferredBatch(gMsgCompose.editor);

    if (preheaderEl) {
      SmartTemplate4.composer.injectPreHeaderElement(preheaderEl, bodyEl);
    }

    logCaretPosition("Before calling resetDocument()");
    resetDocument(gMsgCompose.editor, startup);
    // check gMsgCompose.bodyModified `- should be false here`

    // no license => show license notification.
    if (util.licenseInfo.status != "Valid") {
      util.logDebugOptional("premium.licenser", "show license popup (isValidated==false)");
      util.popupLicenseNotification("", true, false); // featureList = "" - standard for ALL features.
    } else {
      util.logDebugOptional("premium.licenser", "License is validated, no popup");
    }

    if (SmartTemplate4.hasDeferredVars) {
      util.logDebug("Setting up listeners for deferred field variables!");
      util.setupDeferredListeners(gMsgCompose.editor);
    } else {
      util.logDebug("No deferred variables so we do not setup listeners...");
    }

    util.logDebugOptional("functions.insertTemplate", " finished. ");
    // remember  compose case for outside world
    this.composeCase = composeCase; // 'undefined', 'new', 'reply', 'forward', 'draft'
    this.composeType = st4composeType; // '', 'new', 'rsp', 'fwd'

    SmartTemplate4.PreprocessingFlags.isInsertTemplateRunning = false; // [issue 139] avoid template duplication!
    // [issue 173] - SmartTemplates Pro required.
    if (flags.isAutoSend) {
      if (!util.hasLicense() || util.licenseInfo.keyType == 2) {
        let msg = util.getBundleString("st.notification.premium.sendByFilter");
        util.popupLicenseNotification("filterWithTemplate", true, true, msg);
      } else {
        // make sure all variables are resolved + removed.
        await SmartTemplate4.Util.cleanupDeferredFields(true);
        // push send button - with timeout?
        let timeout = SmartTemplate4.Preferences.getMyIntPref("fileTemplates.sendTimeout");
        setTimeout(function () {
          SendMessage();
        }, timeout);
      }
    }

    const templateDivFinal = bodyEl.querySelector(":scope > #smartTemplate4-template");
    if (templateDivFinal) {
      const hash = util.hashElement(templateDivFinal);
      if (hash) {
        templateDivFinal.setAttribute("data-smarttemplate-hash", hash);
      }
    }

    logCaretPosition("after insertTemplate");
  } // insertTemplate

  function resetDocument(editor, withUndo) {
    SmartTemplate4.Util.logHighlightDebug(
      `resetDocument(withUndo = ${withUndo})`,
      "yellow",
      "rgb(0,80,0)",
    );
    editor.resetModificationCount();
    if (withUndo) {
      util.logDebugOptional("functions", " resetting Undo… ");
      editor.enableUndo(false);
      editor.enableUndo(true);
    }
    delete SmartTemplate4.PreprocessingFlags.isBodyUnmodified; // remove this flag.
  }

  function logSelectionHtml(selection) {
    // Grab the content of the selection as a DocumentFragment
    if (!selection) {
      console.log("Nothing selected before processing!");
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      // Create a temporary container to hold the fragment's content
      const tempDiv = gMsgCompose.editor.document.createElement("div");
      tempDiv.appendChild(fragment);

      // Log the HTML as a string
      console.log("Selected HTML before processing:", tempDiv.innerHTML);
    } catch (ex) {
      SmartTemplate4.Util.logException("logSelectionHtml", ex);
    }
  }

  // returns html code from selection in composer.
  // very useful for *selection* macro in any text command [issue 351]
  function unpackSelection(selection) {
    let html = "";
    const isDebug = SmartTemplate4.Preferences.isDebugOption("snippets");

    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      const { startContainer, endContainer, startOffset, endOffset } = range;

      if (isDebug) {
        logSelectionHtml(selection);
        console.log({
          startContainer,
          endContainer,
          ancestor: range.commonAncestorContainer,
          startOffset,
          endOffset,
        });
      }

      // Handle selection within a single container
      if (startContainer === endContainer) {
        // Handle element nodes and text nodes inside the same container
        switch (startContainer.nodeType) {
          case 1: // ELEMENT_NODE
            for (let i = 0; i < startContainer.childNodes.length; i++) {
              if (i < startOffset || i > endOffset) {
                continue;
              }
              const node = startContainer.childNodes[i];
              if (node.nodeType === 1) {
                // Handle element nodes (including <img> tags)
                if (["IMG", "VIDEO", "AUDIO"].includes(node.tagName)) {
                  html += node.outerHTML;
                } else {
                  html += node.outerHTML; // Other element nodes
                }
              } else if (node.nodeType === 3) {
                // Handle text nodes
                html += node.textContent;
              }
            }
            break;
          case 3: // TEXT_NODE
            html += startContainer.textContent.substring(startOffset, endOffset);
            break;
          default:
            break;
        }
        continue; // Skip to next range
      }

      const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ALL, {
        acceptNode: (_node) => NodeFilter.FILTER_ACCEPT,
      });

      const processedNodes = []; // Array to track processed nodes
      let node = walker.currentNode;

      while (node) {
        const insideRange = range.isPointInRange(node, 0);

        if (insideRange) {
          if (node === endContainer) {
            // If we've reached the endContainer, stop processing
            if (node.nodeType === Node.TEXT_NODE) {
              if (!processedNodes.includes(node.parentNode)) {
                const partialText = node.textContent.substring(0, endOffset);
                if (isDebug) {
                  console.log("Partial text added:", partialText);
                }
                html += partialText; // Add the remaining part of the text node
              } else {
                if (isDebug) {
                  console.log(
                    "Skipping text node inside already processed parent:",
                    node.parentNode,
                  );
                }
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === "BR") {
                if (isDebug) {
                  console.log("Skipping extra <br> node at endContainer.");
                }
              } else {
                if (isDebug) {
                  console.log("Element node content (outerHTML):", node.outerHTML);
                }
                html += node.outerHTML; // Add the last element node
                processedNodes.push(node); // Mark this element as processed
              }
            }
            if (isDebug) {
              console.log("HTML after endContainer:", html);
            }
            break; // Exit the loop after processing the endContainer
          }

          // Process element nodes
          if (node.nodeType === Node.ELEMENT_NODE) {
            html += node.outerHTML; // Add the element's HTML
            processedNodes.push(node); // Mark this element as processed
          }

          // Process text nodes
          if (node.nodeType === Node.TEXT_NODE) {
            if (!processedNodes.includes(node.parentNode)) {
              html += node.textContent; // Add the text content
            } else {
              if (isDebug) {
                console.log("Skipping text node inside already processed parent:", node.parentNode);
              }
            }
          }
        }
        // Move to the next node
        node = walker.nextNode();
      }
    }
    if (isDebug) {
      console.log("unpackSelection() created the following markup:\n", html);
    }
    return html.trim();
  }

  // Helper function to process a range inside an element node

  /*
 	function processElementRange(range) {
		let html = "";
		const container = range.startContainer;

		// Iterate over child nodes within the range
		container.childNodes.forEach((node, index) => {
			if (index < range.startOffset || index >= range.endOffset) {
				return; // Skip nodes outside the range
			}
			html += node.nodeType === Node.ELEMENT_NODE
				? node.outerHTML
				: node.textContent;
		});

		return html;
			
  } 
	
	// Helper function to process a range inside a text node
	function processTextRange(range) {
		const { startContainer, endContainer, startOffset, endOffset } = range;

		if (startContainer === endContainer) {
			// Single text node
			return startContainer.textContent.substring(startOffset, endOffset);
		}

		let html = "";
		let started = false;

		// Iterate through nodes within the common ancestor container
		const ancestor = range.commonAncestorContainer;
		ancestor.childNodes.forEach((node) => {
			if (!started && node === startContainer) {
				// Start from the start offset
				started = true;
				html += node.textContent.substring(startOffset);
			} else if (started) {
				if (node === endContainer) {
					// Stop at the end offset
					html += node.textContent.substring(0, endOffset);
					return;
				}

				// Append full content of intermediate nodes
				html += node.nodeType === Node.ELEMENT_NODE
					? node.outerHTML
					: node.textContent;
			}
		});

		return html;
	}	

	// Helper function to process a range inside a text node
 	function unpackSelection_legacy(selection) {
    if (!selection || selection.rangeCount === 0) {
      return ""; // No selection
    }

    let html = "";

    // Process each range in the selection
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);

      if (!range.startContainer) {
        html += range.toString();
        continue;
      }

      // Handle text and element nodes
      switch (range.startContainer.nodeType) {
        case Node.ELEMENT_NODE:
          html += processElementRange(range);
          break;
        case Node.TEXT_NODE:
          html += processTextRange(range);
          break;
        default:
          console.warn("Unsupported node type:", range.startContainer.nodeType);
      }
    }

    return html.trim(); // Return the combined HTML
  } 
*/

  // -----------------------------------
  // Constructor
  // var SmartTemplate4 = SmartTemplate4;
  var orgQuoteHeaders = new Array();

  // -----------------------------------
  // Public methods of classSmartTemplate
  this.insertTemplate = insertTemplate;
  this.setComposeCase = setComposeCase;
  this.extractSignature = extractSignature;
  this.getProcessedText = getProcessedText;
  this.resetDocument = resetDocument;
  this.testSignatureVar = testSignatureVar;
  this.testCursorVar = testCursorVar;
  this.testSmartTemplateToken = testSmartTemplateToken;
  this.unpackSelection = unpackSelection;
};


