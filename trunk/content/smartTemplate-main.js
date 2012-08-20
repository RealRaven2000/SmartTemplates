"use strict";
// the main object

var SmartTemplate4 = {
	// definitions for whatIsX (time of %A-Za-z%)
	XisToday : 0,
	XisSent  : 1,
	signature : null,
	sigInTemplate : false,

	stateListener: {
		NotifyComposeFieldsReady: function() {},
		NotifyComposeBodyReady: function() {
			SmartTemplate4.notifyComposeBodyReady();
		},
		ComposeProcessDone: function(aResult) {},
		SaveInFolderDone: function(folderURI) {}
	},

	initListner: function() {
		gMsgCompose.RegisterStateListener(SmartTemplate4.stateListener);
	},
	// -------------------------------------------------------------------
	// A handler to add template message
	// -------------------------------------------------------------------
	notifyComposeBodyReady: function()
	{
		this.Util.logDebugOptional('events','SmartTemplate4.notifyComposeBodyReady()');
		// Add template message
		this.smartTemplate.insertTemplate(true);
	},

	// -------------------------------------------------------------------
	// A handler to switch identity
	// -------------------------------------------------------------------
	loadIdentity : function(startup, previousIdentity)
	{
		this.Util.logDebugOptional('functions','SmartTemplate4.loadIdentity(' + startup +')');
		if (startup) {
			// Old function call
			this.original_LoadIdentity(startup);
		}
		else {
			// Check body modified or not
			var isBodyModified = gMsgCompose.bodyModified;
			// we can only reliable roll back the previous template and insert
			// a new one if the user did not start composing yet (otherwise danger
			// of removing newly composed content)
			if (!isBodyModified) {
				// if previous id had signature below the quote, we should try to remove it from there now
				if (previousIdentity) {
					if (previousIdentity.sigBottom) {
						if (previousIdentity.composeHtml) {
							// find and delete div class="st4signature" from end to start.
							// for this we need to add the class "st4signature" into any sig we add...

						}
						else {
						}
					}
				}
				// Add template message - will also remove previous header.
				this.smartTemplate.insertTemplate(false);
			}
			// Old function call
			this.original_LoadIdentity(startup);
			if (!isBodyModified && gMsgCompose.bodyModified) {
				gMsgCompose.editor.resetModificationCount();
			}	// for TB bug?
		}
	},

	// -------------------------------------------------------------------
	// Escape to HTML character references
	// -------------------------------------------------------------------
	escapeHtml: function(str)
	{
		return str.replace(/&/gm, "&amp;").replace(/"/gm, "&quot;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/\n/gm, "<br>");
	},

	// -------------------------------------------------------------------
	// Get day name and month name
	// -------------------------------------------------------------------
	classCalIDateTimeFormatter: function(useLegacy)
	{
		function list() {
			var str = "";
			for (var i=0;i<7 ;i++){str+=(cal.dayName(i)  +"("+cal.shortDayName(i)  +")/");} str += "\n";
			for (var i=0;i<12;i++){str+=(cal.monthName(i)+"("+cal.shortMonthName(i)+")/");}
			return str;
		};

		// -----------------------------------
		// Constructor
		try {
			if (useLegacy)
				throw "without lightning";
			// with Lightning
			var cal = Components.classes["@mozilla.org/calendar/datetime-formatter;1"].
						getService(Components.interfaces.calIDateTimeFormatter);
		}
		catch(ex) {
			// without Lightning
			var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
							 getService(Components.interfaces.nsIStringBundleService);
			var bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/calender.properties");
			var cal = {
				dayName 	   : function(n){ return bundle.GetStringFromName("day." + (n + 1) + ".name"); },
				shortDayName   : function(n){ return bundle.GetStringFromName("day." + (n + 1) + ".short"); },
				monthName	   : function(n){ return bundle.GetStringFromName("month." + (n + 1) + ".name"); },
				shortMonthName : function(n){ return bundle.GetStringFromName("month." + (n + 1) + ".short"); }
			};
		}

		// -----------------------------------
		// Public methods
		this.dayName = cal.dayName;
		this.shortDayName = cal.shortDayName;
		this.monthName = cal.monthName;
		this.shortMonthName = cal.shortMonthName;
		this.list = list;
	} ,

	// -------------------------------------------------------------------
	// Initialize - we only call this from the compose window
	// -------------------------------------------------------------------
	init: function()
	{
		function smartTemplate_loadIdentity(startup){
			var prevIdentity = gCurrentIdentity;
			return SmartTemplate4.loadIdentity(startup, prevIdentity);
		}

		// http://mxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#3998
		if (typeof LoadIdentity === 'undefined') // if in main window: avoid init()
			return;
		SmartTemplate4.Util.logDebug('SmartTemplate4.init()');
		SmartTemplate4.Util.VersionProxy(); // just in case it wasn't initialized
		this.original_LoadIdentity = LoadIdentity;
		// overwriting a global function within composer instance scope
		// this is intentional, as we needed to replace Tb's processing
		// with our own (?)
		LoadIdentity = smartTemplate_loadIdentity;

		this.pref = new SmartTemplate4.classPref();

		// a class instance.
		this.smartTemplate = new SmartTemplate4.classSmartTemplate();
		this.cal = new this.classCalIDateTimeFormatter(true);

		// Time of %A-Za-z% is today(default)
		this.whatIsX = this.XisToday;
		this.Util.logDebug('SmartTemplate4.init() ends.');
	} ,

	startUp: function() {
		let v = SmartTemplate4.Util.VersionProxy();
	}
};
