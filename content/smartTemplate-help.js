"use strict"; 

SmartTemplate4.Listener = {
	listen: function(evt) {
		let code = evt.target.getAttribute('codeWord');
		window.opener.onCodeWord(code);
		
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
  } ,
  
	onUnload : function() {
		document.removeEventListener("SmartTemplate4CodeWord", SmartTemplate4.Listener.listen, false);
	} , 
	
	onResize : function(win) {
		let frame = document.getElementById('contentFrame');
		if (frame) {
			frame.height = win.innerHeight - 100; // sodala!
		}
	}
	
	
};

/*
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
*/
