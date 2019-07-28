"use strict";

/* BEGIN LICENSE BLOCK

for detail, please refer to license.txt in the root folder of this extension

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or (at your option) any later version.

If you use large portions of the code please attribute to the authors
(Axel Grude)

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
GNU General Public License for more details.

You can download a copy of the GNU General Public License at
http://www.gnu.org/licenses/gpl-3.0.txt or get a free printed
copy by writing to:
	Free Software Foundation, Inc.,
	51 Franklin Street, Fifth Floor,
	Boston, MA 02110-1301, USA.

END LICENSE BLOCK
*/


var EXPORTED_SYMBOLS = [];

// protect global scope. We do not reference SmartTemplate4 objects from here.
(function() {
	function log(msg) {
		const title = "SmartTemplate4";
		if (!isDebugStationery) return;
		consoleService.logStringMessage(title + "\n"+ msg);
	}
	const Cu = Components.utils,
				Cc = Components.classes,
				Ci = Components.interfaces,
				service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
				consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);			

	let isStationery = service.getBoolPref('extensions.smartTemplate4.stationery.supported'),
	    isDebugStationery = service.getBoolPref('extensions.smartTemplate4.debug.stationery');

	try {
					
		Cu.import("resource://stationery/content/stationery.jsm");
		
		if (isStationery) {
			var { Services } =
				ChromeUtils.import ?
				ChromeUtils.import('resource://gre/modules/Services.jsm') :
				Components.utils.import('resource://gre/modules/Services.jsm');
			
			
			log('stationery', 'Calling Stationery.templates.registerFixer()');
			
			Stationery.templates.registerFixer({
				//Stationery HTML preprocessor
				preprocessHTML: function(template) { 
					// we will store the original stationery template source here, so we can check for variables
					// post processing (Stationery 'consumes' its own template)
					Services.wm.getMostRecentWindow('msgcompose').SmartTemplate4.StationeryTemplateText = '';
					//forward to SmartTemplate4 in current composer window
					Services.wm.getMostRecentWindow('msgcompose').SmartTemplate4.preprocessHTMLStationery(template); 
				},
				
			});
		}
		else {
			log('stationery', 'Stationery support is disabled. Check ST4 options!');
		}

	} catch (ex) {
		//no Stationery installed
		log('stationery', 'Stationery not Installed?' + ex.toString());
	}
})();
