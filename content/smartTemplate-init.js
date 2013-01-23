
window.setTimeout ( function(){
	SmartTemplate4.init();
	// the starting point of this listener which is triggered by composer, is defined in smartTemplate-main.js
	document.getElementById("msgcomposeWindow").addEventListener("compose-window-init", SmartTemplate4.initListener, false);
},10 );
