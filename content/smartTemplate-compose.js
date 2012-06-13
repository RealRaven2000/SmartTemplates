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
    function deleteNodeTextOrBR(node)
    {
        let match=false;
        let theNodeName='';
        if (node && node.nodeName)
          theNodeName = node.nodeName.toLowerCase();
        else
          return match;
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
		        gSmartTemplate.Util.logDebugOptional('functions','deleteNodeTextOrBR() - deletes node ' + theNodeName 
		         		+ '\n' + node.nodeName + '  ' + node.nodeValue);
            orgQuoteHeaders.push(node);
            gMsgCompose.editor.deleteNode(node);
        }
        return match;
    };
    
    
    // -----------------------------------
    // Delete all comsecutive whitespace nodes...
    function deleteWhiteSpaceNodes(node) {
	    let match = true;
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
		        gSmartTemplate.Util.logDebugOptional('functions','deleteNodeTextOrBR() - deletes node '
		         		+ '\n' + node.nodeName + '  ' + node.nodeValue);
	            gMsgCompose.editor.deleteNode(node);
	            node = nextNode;
        	}
    	}
    };
    
    function deleteHeaderNode(node)
    {
        if (node) {
	        gSmartTemplate.Util.logDebugOptional('functions','deleteHeaderNode() - deletes node ' + node.nodeName 
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
          deleteNodeTextOrBR(node);
        	node = n;
        }
        
        
        if (gSmartTemplate.Util.versionGreaterOrEqual(gSmartTemplate.Util.AppverFull, "12")) {
	        // recursive search from root element
	        let node = findChildNode(rootEl, 'moz-email-headers-table');
	        if (node) {
	        	deleteHeaderNode(node);
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
	            deleteNodeTextOrBR(rootEl.firstChild);
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
	    function truncateTo2BR(root) {
		    gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','truncateTo2BR()');
	        let node = root.firstChild;
	        // old method continues until it finds <br><br> after header table
	        let brcnt = 0;
	        while (root.firstChild && brcnt < 2) {
	            if (root.firstChild.nodeName == "BR") {
	            	brcnt++; 
	            }
	            else {
		            // only older versions of Tb have 2 consecutive <BR>?? Tb13 has <br> <header> <br>
		            //if (gSmartTemplate.Util.versionSmaller(gSmartTemplate.Util.AppverFull, "10"))
	            	brcnt = 0; 
	            }
	            deleteHeaderNode(root.firstChild);
	        }
	    }
	    
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
		let firstNode = null;
        while (node) {
			let n = node.nextSibling;
			// skip the forwarded part
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
						    m = inner = node.firstChild;      //restart ...
						    truncWhiteSpace = true;           // ...and delete EVERYTHING until delimiter
						    firstNode = inner;
						    continue;
					    }
					    gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','deleting node: ' + inner.nodeValue);
				        gMsgCompose.editor.deleteNode(inner); // we are not pushing this on to orgQuoteHeaders as there is no value to this.
				        if (inner.nodeValue == origMsgDelimiter)
				      		break;	
				  	}
				  	inner = m;
				}
				node = n;
				continue;
			}
			deleteNodeTextOrBR(node);
			node = n;
        }
        
        // remove the original Mail Header
	    gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','Removing original header...');
        if (gSmartTemplate.Util.versionGreaterOrEqual(gSmartTemplate.Util.AppverFull, "12")) {
	        // recursive search from root element
	        node = findChildNode(rootEl, 'moz-email-headers-table');
	        if (node) {
			    gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','found moz-email-headers-table; deleting');
		        let nextNode = node.nextSibling;
	        	deleteHeaderNode(node);
	        	// delete trailing newlines!
	        	deleteWhiteSpaceNodes(nextNode);
        	}
        	else {
			    gSmartTemplate.Util.logDebugOptional('functions.delForwardHeader','Could not find moz-email-headers-table!');
				if (!gMsgCompose.composeHTML) {
			        truncateTo2BR(rootEl.firstChild);
				}
        	}
        }
        else {
	        truncateTo2BR(rootEl);
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

        // start parser...
        try {
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
        }
        catch(ex) {
	        gSmartTemplate.Util.logException("insertTemplate - exception during parsing. Continuing with inserting template!", ex); 
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


