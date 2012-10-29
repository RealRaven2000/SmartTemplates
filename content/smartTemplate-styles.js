/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
"use strict";


SmartTemplate4.Styles = {

	// offset: start from nth stylesheet by passing in offset.value = n
	getMyStyleSheet: function(Name, Title, offset) {
		let ssFirstMatch = null;
		let sList = '';
		let styleSheetList = document.styleSheets;
		offset = offset || null; 
		let o = offset ? offset.offset : 0;
		for (var i = o; i < styleSheetList.length; i++) {
			var ss = styleSheetList[i];
			var href = ss.href ? ss.href : "";

			sList += i.toString() + '. ' + href
			         + (ss.title ? ' [' + ss.title + ']' : '') + '\n';
			if ( ( (Title && ss.title == Title)
			    		||
			    		(href && href.indexOf(Name)>=0) )
			    &&
			    typeof ss.cssRules != 'undefined')
			{
				SmartTemplate4.Util.logDebugOptional("css.styleSheets",
				    "============================================\n"
				  + "getMyStyleSheet (" + Name + "," + Title + ") [" + i + ", " + ss.title + "] =" + href
					+ "\nwin.doc.title   =" + window.document.title
					+ "\ndoc.title       =" + document.title
					+ "\nwindow.location =" + window.location
					+ "\n============================================");
				if (!ssFirstMatch)
					ssFirstMatch = ss;
				offset.offset = i + 1;
				break;
			}
		}
		SmartTemplate4.Util.logDebugOptional("css.styleSheets", styleSheetList.length + " StyleSheets found:\n" + sList);

		if (!ssFirstMatch && offset && offset.value == 1)
			SmartTemplate4.Util.logToConsole("Can not find style sheet: " + Name + " - " + Title + " in "
			  + (window.closed ? "closed window" : window.location)
				+ "\nwin.doc.title=" + window.document.title
				+ "\ndoc.documentURI=" + document.documentURI);
		return ssFirstMatch;
	},

	getElementStyle: function(ss, rule, attribute) {
		let leftTrim = function(S) {
    	return S ? S.replace(/^\s+/,"") : '';
		};

		SmartTemplate4.Util.logDebugOptional("css.detailed", "getElementStyle( " + rule + ", " + attribute + ")");
		try {
			let rulesList=ss.cssRules;
			let match = false;
			var i;
			for (i=1; i<rulesList.length; i++)
			{
				let selectors = rulesList[i].selectorText;
				if (!selectors || !selectors.length)
					continue;
				let selectorArray = selectors.split(',');
				for each (let r in selectorArray) {
					if (rule == leftTrim(r)) {
						match=true;
						break;
					}
				}
				if (match) {
					let st=rulesList[i].style; // CSSStyleDeclaration
					SmartTemplate4.Util.logDebugOptional("css.detailed", "found relevant style: " + rulesList[i].selectorText + " searching rule " + attribute);

					//iterate rules!
					for (let k=0;k<st.length;k++) {
						if (attribute==st.item(k)) {
							let val=st.getPropertyValue(attribute);
							SmartTemplate4.Util.logDebugOptional ("css.detailed", "attribute Found:\n" + attribute + " : " + val);
							return val;
						}
					}
				}
			}
			return null;
		}
		catch(e) {
			SmartTemplate4.Util.logException ("getElementStyle( " + rule + ", " + attribute + ")", e);
		};
		return null;
	},

	setElementStyle: function(ss, rule, attribute, value, important) {
		// to do: find elements of this class and change their color
		// find the class element itself and change its properties
		// persist in options
		// load on startup
		try {
			if (!ss || ss==null) {
				// fallback style sheet retrieval
				// ss = this.getMyStyleSheet("SmartTemplate4Styles", 'quickfolders-layout.css'); // not always 100% right but we hope that it is being passed in correctly
				// if (!ss || ss==null)
					return false;
			}
			if (typeof ss.cssRules == 'undefined')
				return false;

			SmartTemplate4.Util.logDebugOptional("css.detailed", "setElementStyle( " + rule + ", " + attribute + ", " + value + ")");

			let rulesList=ss.cssRules;
			var i;
			var found=false;
			var foundRule=false;
			var st; // new style rule
			// 0 is fake, it is not a rule (no idea why)
			for (i=1; i<rulesList.length; i++)
			{
				let selectors = rulesList[i].selectorText;
				if (!selectors || !selectors.length)
					continue;

				if (rule == selectors) {
					st=rulesList[i].style; // CSSStyleDeclaration
					SmartTemplate4.Util.logDebugOptional("css.detailed", "found relevant style: " + rulesList[i].selectorText + " searching rule " + attribute);
					var k;//iterate rules!

					for (k=0;k<st.length;k++) {
						try{
							if (attribute==st.item(k)) {
								foundRule=true;
								SmartTemplate4.Util.logDebugOptional ("css.detailed", "\n=============\nModify item: " + st.item(k)) + " =====================";
								SmartTemplate4.Util.logDebugOptional ("css.detailed", "\nrulesList[i].style[k]=" + rulesList[i].style[k]
											+ "\nrulesList[i].style[k].parentRule=" + rulesList[i].style.parentRule
											+ "\nrulesList[i].style.getPropertyPriority=" + rulesList[i].style.getPropertyPriority(attribute)
											+ "\nst.getPropertyValue(" + attribute + "):" + st.getPropertyValue(attribute)
											+ "\nrulesList[i].style.getPropertyValue=" + rulesList[i].style.getPropertyValue(attribute));
								st.removeProperty(attribute);
								if (null!=value) {
									st.setProperty(attribute,value,((important) ?	"important" : ""));
								}
								break;
							}
						}
						catch (e) { SmartTemplate4.Util.logToConsole ("(error) " + e) };
					}
					if (foundRule) // keep searching if exact rule was not found!
						return true;
				}
			}
			var sRule=rule +"{" + attribute + ":" + value + ((important) ? " !important" : "") + ";}";
			SmartTemplate4.Util.logDebugOptional("css.AddRule", "Adding new CSS rule:" + sRule );
			if (null!=value)
				ss.insertRule(sRule, ss.cssRules.length);
			return true;

		}
		catch(e) {
			SmartTemplate4.Util.logException ("setElementStyle( " + rule + ", " + attribute + ", " + value + ")", e);
		};
		return false;
	},

	removeElementStyle: function(ss, rule, attribute) {
		return SmartTemplate4.Styles.setElementStyle(ss, rule, attribute, null, true);
	}
	

}