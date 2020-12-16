"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


SmartTemplate4.Listener = {
	listen: function(evt) {
    const getElement = window.document.getElementById.bind(window.document);
    switch (evt.type) {
      case "SmartTemplate4CodeWord":
        const code = evt.target.getAttribute('codeWord'),
              className = evt.target.className;
        window.onCodeWord(code, className); // was window.opener.onCodeWord when help was in its own window
        break;
      case "SmartTemplate4CAD":
        const tabbox = getElement('rightPane'),
              txtDefaultFormat = getElement('default_address_format');
				tabbox.selectedPanel = getElement('advancedSettingsTab');
				tabbox.selectedIndex = 2;
        
        txtDefaultFormat.classList.add('highlighted');
        break;
      case "SmartTemplate4Website":
        const href = evt.target.getAttribute('href');
        if (href)
          SmartTemplate4.Util.openURLInTab(href);
        break;
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
		document.addEventListener("SmartTemplate4CAD",
		                          SmartTemplate4.Listener.listen,
		                          false,
		                          true);
	} ,

	onUnload : function() {
		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
		document.removeEventListener("SmartTemplate4Website", SmartTemplate4.Listener.listen, false);
		document.removeEventListener("SmartTemplate4CAD", SmartTemplate4.Listener.listen, false);
	} ,

	onResize : function(win) {
		let frame = document.getElementById('helpFrame');
		if (frame) {
			frame.height = win.innerHeight - 100; // sodala!
		}
	}

};

/*
SmartTemplate4.Util.logDebug("Setting up onCLick for container element…");

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
