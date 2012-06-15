
window.setTimeout ( function(){
	SmartTemplate4.init();
	document.getElementById("msgcomposeWindow").addEventListener("compose-window-init", SmartTemplate4.initListner, false);
},10 );
