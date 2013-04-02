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

try {
  Components.utils.import("resource://stationery/content/stationery.jsm");
  Components.utils.import("resource://gre/modules/Services.jsm");
  
  Stationery.templates.registerFixer({
    //Stationery HTML preprocessor
    preprocessHTML: function(template) { 
      //forward to SmartTemplate4 in current composre window
      Services.wm.getMostRecentWindow('msgcompose').SmartTemplate4.preprocessHTMLStationery(template); 
    },
    
  });

} catch (e) {
  //no Stationery installed
}
