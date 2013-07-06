"use strict";

SmartTemplate4.openSettings = function() {
	let ac = top.getCurrentAccount();
	let id = ac.defaultIdentity;
	if (id)
		openDialog('chrome://smarttemplate4/content/settings.xul', 'Preferences', 'chrome,titlebar,toolbar,centerscreen,dependent,resizable', id.key);
	else
		openDialog('chrome://smarttemplate4/content/settings.xul', 'Preferences', 'chrome,titlebar,toolbar,centerscreen,dependent,resizable');
}

