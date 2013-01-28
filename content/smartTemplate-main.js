"use strict";
// the main object
// notes
// investigate gMsgCompose.compFields!

var SmartTemplate4 = {
	// definitions for whatIsX (time of %A-Za-z%)
	XisToday : 0,
	XisSent  : 1,
	signature : null,
	sigInTemplate : false,

	stateListener: {
		NotifyComposeFieldsReady: function() {},
		NotifyComposeBodyReady: function() {
			// For Stationery integration, we need to hack 
			// its method of overwriting  stateListener.NotifyComposeBodyReady 
			if (SmartTemplate4.Preferences.isStationerySupported && Stationery && Stationery.FireEvent) {
			  ; // we do nothing as we have our own event handler
			}
			else
				SmartTemplate4.notifyComposeBodyReady();
		},
		ComposeProcessDone: function(aResult) {},
		SaveInFolderDone: function(folderURI) {}
	},

	initListener: function() {
		gMsgCompose.RegisterStateListener(SmartTemplate4.stateListener);
		// alternative events when 
		if (SmartTemplate4.Preferences.isStationerySupported) {
			window.addEventListener('stationery-template-loading', function(event) {
				alert('stationery-template-loading');
			}, false);

			window.addEventListener('stationery-template-loaded', function(event) {
				alert('stationery-template-loaded');
				SmartTemplate4.notifyComposeBodyReady(event);
			}, false);		
		}
	},
	// -------------------------------------------------------------------
	// A handler to add template message
	// -------------------------------------------------------------------
	notifyComposeBodyReady: function(evt)
	{
		let dbg = 'SmartTemplate4.notifyComposeBodyReady()';
		let isStationeryTemplate = false;
		
		if (evt) {
			if (evt.currentTarget
			    &&
					evt.currentTarget.Stationery_) 
			{
				dbg += '\nStationery is installed';
				let stationeryFile = evt.currentTarget.Stationery_.CurrentTemplateFileName;
				if (stationeryFile !== '')
					isStationeryTemplate = true;
					dbg += '\nTemplate used is:' + stationeryFile;
			}			
		}
		this.Util.logDebugOptional('events', dbg);
		// Add template message
		
		this.smartTemplate.insertTemplate(true, isStationeryTemplate);
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
				// Add template message - will also remove previous template and quoteHeader.
				this.smartTemplate.insertTemplate(false);
			}
			else {
				// if previous id has added a signature, we should try to remove it from there now
				// we do not touch smartTemplate4-quoteHeader or smartTemplate4-template
				// as the user might have edited here already! 
				// however, the signature is important as it should match the from address?
				if (SmartTemplate4.Preferences.getMyBoolPref("removeSigOnIdChangeAfterEdits")) {
					this.smartTemplate.extractSignature(gMsgCompose.identity, false);
				}
			}
			// AG 31/08/2012 put this back as we need it!
			// AG 24/08/2012 we do not call this anymore if identity is changed before body is modified!
			//               as it messes up the signature (pulls it into the blockquote)
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
	
	updateStatusBar: function(show) {
		this.Util.logDebugOptional('functions','SmartTemplate4.updateStatusBar(' + show +')');
		let doc = (typeof show == 'undefined') ? document : SmartTemplate4.Util.Mail3PaneWindow.document;
		let btn = doc.getElementById('SmartTemplate4Messenger');
		(typeof show == 'undefined') 
		if (btn) {
			let showPanel = (typeof show == 'undefined') ? 
			                SmartTemplate4.Preferences.getMyBoolPref('showStatusIcon') :
			                show;
			btn.collapsed =  !showPanel;
			let labelMode = SmartTemplate4.Preferences.getMyIntPref('statusIconLabelMode');
			let theClass = 'statusbarpanel-iconic-text';
			switch(labelMode) {
				case 0:
					theClass +=' hidden';
					break;
				case 1:
					//NOP;
					break;
				case 2:
					theClass +=' always';
					break;
			}
			btn.className = theClass;
			this.Util.logDebugOptional('functions','SmartTemplate4Messenger btn.className = ' + theClass);		
		}
		else
			this.Util.logDebugOptional('functions','SmartTemplate4.updateStatusBar() - button SmartTemplate4Messenger not found in ' + doc);
			
	} ,

	startUp: function() {
		let v = SmartTemplate4.Util.VersionProxy();
	}
};
