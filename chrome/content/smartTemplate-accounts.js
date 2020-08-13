"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


SmartTemplate4.openSettings = function() {
	let ac = top.getCurrentAccount();
	let id = ac.defaultIdentity;
	if (id)
		window.openDialog('chrome://smarttemplate4/content/settings.xul', 'Preferences', 'chrome,titlebar,toolbar,centerscreen,dependent,resizable', id.key);
	else
		window.openDialog('chrome://smarttemplate4/content/settings.xul', 'Preferences', 'chrome,titlebar,toolbar,centerscreen,dependent,resizable');
}

