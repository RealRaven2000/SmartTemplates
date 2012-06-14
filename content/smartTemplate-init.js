
window.setTimeout ( function(){
	gSmartTemplate.init();
	document.getElementById("msgcomposeWindow").addEventListener("compose-window-init", gSmartTemplate.initListner, false);
},10 );
