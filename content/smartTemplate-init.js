
window.setTimeout ( function(){
	SmartTemplate4.init();
	document.getElementById("msgcomposeWindow").addEventListener("compose-window-init", SmartTemplate4.initListener, false);
},10 );
