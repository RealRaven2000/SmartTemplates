"use strict"; 

SmartTemplate4.Help = {
	onBodyClick : function onClick (element, evt)
	{
		SmartTemplate4.Util.logDebug("Help.onBodyClick (" + element.tagName + ") ");
	}
	
};

SmartTemplate4.Util.logDebug("Setting up onCLick for container element...");

let frame = document.getElementById('contentFrame');
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
