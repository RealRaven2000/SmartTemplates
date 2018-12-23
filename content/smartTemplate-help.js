"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


SmartTemplate4.Listener = {
	listen: function(evt) {
		if (evt.type=="SmartTemplate4CodeWord") {
		  let code = evt.target.getAttribute('codeWord'),
		      className = evt.target.className;
			window.onCodeWord(code, className); // was window.opener.onCodeWord when help was in its own window
		}
		if (evt.type=="SmartTemplate4Website") {
			let href = evt.target.getAttribute('href');
			if (href)
				SmartTemplate4.Util.openURLInTab(href);
		}

	}
}


SmartTemplate4.Help = {
	onBodyClick : function onClick (element, evt)
	{
		SmartTemplate4.Util.logDebug("Help.onBodyClick (" + element.tagName + ") ");
	},

	onLoad : function()
	{
		//set up a custom event listener
		document.addEventListener("SmartTemplate4CodeWord",
		                          SmartTemplate4.Listener.listen,
		                          false,
		                          true); // The last value is a Mozilla-specific value to indicate untrusted content is allowed to trigger the event
    // allow opening content tabs:
		document.addEventListener("SmartTemplate4Website",
		                          SmartTemplate4.Listener.listen,
		                          false,
		                          true); // The last value is a Mozilla-specific value to indicate untrusted content is allowed to trigger the event
		
	} ,

	onUnload : function() {
		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
		document.removeEventListener("SmartTemplate4Website", SmartTemplate4.Listener.listen, false);
	} ,

	onResize : function(win) {
		let frame = document.getElementById('helpFrame');
		if (frame) {
			frame.height = win.innerHeight - 100; // sodala!
		}
	}


};

/*
SmartTemplate4.Util.logDebug("Setting up onCLick for container element...");

let frame = document.getElementById('helpFrame');
let doc = frame.contentDocument;
if (doc) {
	let container = doc.getElementById('helpContents');
	if (container) {
		fields = container.getElementsByTagName('code');
		for (let i = 0; i < fields.length; i++) {
			fields[i].addEventListener('click',
			      function() {
				      SmartTemplate4.Help.onBodyClick(this, event);
				    }, false);
		}
	}
}
*/
