"use strict";
// the main object
// notes
// investigate gMsgCompose.compFields!



/* Version History  (chronological)

  Version 0.7.4 - Released 09/08/2011
	  # Supports: Tb 1.5 - 8.0a1
	  # Originally the X:=sent switch would change all variables after it's use for the remainder of the template unless X:=today was used 
		  to switch them back. That behavior is now changed such that the X:=sent command only affects the line on which it is being used.
		# %datelocal%, %dateshort%, %date_tz% are now affected by the X:=sent and X:=today variables.
		# fix CC line inner Brackets
				
  Version 0.7.5 - Released 28/08/2011
		# Supports: 1.5 - 8.0a1
    # Some users reported subject lines not being displayed correctly. Specifically there were line breaks causing the subject to span more than one line. This could also occur with other  headers but subject was the only one reported.
    # corrected issue where headers longer than 4096 were being truncated.
    # An option was added in settings called "Use OS date/time format instead of Thunderbird".
          Some users reported that SmartTemplate 4 was not using the custom date format they had set in their operating system.
    # updated all helpfiles 'added recent changes'
    # implemented some coding changes suggested by the Mozilla AMO review team.
		
  Version 0.7.6 - Released 09/09/2011
		# Supports: Tb 1.5 - 8.0a1
    # Fixed issue if %datelocal% variable is used for new messages
    # a lot of small fixes
    # changes in locale pt-BR
    
  Version 0.7.7 - Released 04/11/2011
	  # Supports: Tb 1.5 - 10.0a1
    # where reply header was being put above the signature when signature is placed 'above the quote'.
    # automatically add line break in message compose window
    # %date_tz% variable was returning the local timezone instead of the senders timezone.
    # removed the 'automatically add two line breaks' that was added in 0.7.6. This affected many users and the correct way to add line breaks at the top of your message is to include them in your template.
  
  Version 0.7.8 - Released 04/11/2011
	  # Supports: Tb 1.5 - 10.0a1
		#  paste an list of all variables and in which case they can be used to all help files.
    #  SmartTemplate4 no longer crashes when variables are used incorrectly; an error is logged to the Error Console.
    # added a new variable %sig% to allow users to put their signature where it should be placed in the template. If %sig% is not defined in the template it will be placed in the default Thunderbird location (above reply or below reply based on TB settings). 'Include Signature on Reply/Forward" must be checked in Thunderbird options for the %sig% to work as expected.
    # added a new option to variable %subject% to show the subject of the message being replied to/forwarded or the subject of the current message being composed
    # %tz_name% variable has been added but it is system dependent and will have limited support. Some users will see abbreviated time zone names (EST, CDT) and some will see long names(Eastern Standard Time...) and some will not have any return depending on their operating system or the mailserver of the email being replied to.
    
	Version 0.7.9 - Released 24/12/2011
	  # Supports: Tb 1.5 - 12.0a1
		# corrected incorrect file encodings on many locale files. Incorrectly encoded errors.properties files caused ST4 to crash this has also been corrected.

  Version 0.8.0 - Released 02/02/2012
	  # Supports: Tb 1.5 - 12.0a1
		#  fixed bug where a quotation that is edited loses its formatting or disappears.
    #  made account list in option window easier to read
    #  some visual improvements to the help file
		
	Version 0.8.5.6 - Released 18/06/2012
	  # Supports: Tb 3.1.7 - 14*
		# Fixed compatibility Problem with Thunderbird 13.* which broke a lot of the extension's functionality in 0.8.0 and previous
		# Redesigned Help Window
    # Added inserting variables/keywords using mouse click
    # Added validation during insert (if variable cannot be used in "Write New" it will be rejected
    # Added fi locale
    # Most locales are reviewed and corrected (currently not all) incomplete translations are in English, as always. Many thanks to the translation team at BabelZilla!

  Version 0.9.1 - Released 16/08/2012
	  # Supports: Tb 3.1.7 - 14.*
    # Integrated variables help into options dialog
		# Statusbar button for quickly accessing template settings
		# Added Bugzilla support
		# When switching between accounts, the current Tab (e.g. Reply to) remains selected
    # When updating from an earlier versions, all settings and templates should be migrated automatically, Conversion Wizard
    # Fixed [Bug 24997] "Edit as New" Sometimes Loses Message Body
    # Fixed [Bug 25002] Signature will displayed two times
    # Fixed [Bug 24988] Message body not included replying to "plain-text" messages
    # Fixed [Bug 24991] Replace default quote header not working in some cases
		
  Version 0.9.2 - Released 22/11/2012
	  # Supports: Tb 3.1.7 - 17.* ,  Sm 2.0.0 - 2.16.*
    # Redesigned Settings Window to support signature settings from Thunderbird even better
		# Added support for Seamonkey
		# Added global settings in advanced options pane; includes new font size setting for template editor.
		# [Bug 25088] add option to hide status icon. Configuration setting extensions.smartTemplate4.statusIconLabelMode
		              0 - never show label
									1 - expand label on hover (default)
									2 - always show label
    # Redesigned About Window (Add-On Manager &#8658; rightclick on SmartTemplate4 &#8658; About)
		# Added uk-UA locale
		# Fixed Bug 25103]	0.9.1 inserts unwanted line break top of &lt;body&gt; in html mode
		# [Bug 25099] Support bottom reply with headers on top
		# [Bug 25097] Forward text message results in double header
    # [Bug 25095] 2 blank lines in plain text between header and quote
    # [Bug 25093] Signatur missing when replying below quote
    # [Bug 25092] Option window broken in Italian version
    # [Bug 25084] 0.9.1 regression: blank line is added before Reply template
    # [Bug 25089] Default forward quote can't be completely hidden - thanks to PeterM for providing a solution
    # [Bug 25117] Plaintext: Template always below the quoted message when replying
    # [Bug 25155] 0.9.1 regression - blank line is added AFTER Reply template
      	
  Version 0.9.3 - Work in Progress
	  # toolbar button
		# fixed a problem with preference not updating (found by AMO reviewer Nils Maier)
	  # [FR 24990] Added %cursor% variable
		# [FR 25083] New option "Correct Lastname, Firstname" to swap firstname to the front. 
		# %deleteText()% and %replaceText()% functions
		# [FR 25248] Added %y% for two digit years
	  # parsing of variables in Signature - enable extensions.smartTemplate4.parseSignature
	  # Postbox support
		# stabilised signature code base
		# Added Stationery 0.8 support - works with the new event model of Stationery 0.8 - 
			template inserting is disabled if a Stationery Template of 0.7.8 or older is used
		# mailto link support for the main header fields that hold email address data: %to(mail,link)% %to(name,link)%$ %to(firstname,link)%  etc.
		# new %identity()%  function
		# added 24px icon
		# added change log
		# fix: redefinition of Thunderbird's nsIMsgAccount interface broke account dropdown in settings
		# suppressed displaying string conversion prompt when clicking on the version number in advanced options
		# added preferences textbox for default charset
		# [Bug 25483] when using %sig(2)% (option for removing dashes) - signature is missing on new mails in HTML mode 
		# [Bug 25104] when switching identity, old sig does not get removed.
		# [Bug 25486] attaching a plain text file as signature leads to double spaces in signature
		# [Bug 25272] reply below quote with signature placed cursor below signature (should be above signature and below quote)
		# added configuration setting for signature file character set. extensions.smartTemplate4.signature.encoding
		# added configuration setting adding dashes before text sig. extensions.smartTemplate4.signature.insertDashes.plaintext
		# fixed signature position when replying on top (must be below template)
		# hidden settings for adding --<br> before sig (html + plaintext separate).
		# added warning if originalMsgURI cannot be determined
		# added hidden UI on right-click on 'Process signature' option to manage signature settings
		
		Review specific:
		1) help.xul - set iframe type="content" 
		2) To Do - revisit usage of innerHtml
		3) habe ich mittlerweile auch gefixt, wir ueberschreiben Stationery nicht mehr. Allerdings funktioniert der neue Code erst ab Stationery version 0.8.
    4) habe ich bisher gefixt
    5) To Do - send a version to Nils for pre-testing on Mac. MIght require custom style sheet. 
    6) To Do - test on Postbox
		
=========================
    REVIEWS - 0.9.2 (Nils Maier)
		
		1) In help.xul, please set iframe type="content" if possible. It doesn't seem necessary for the page to have chrome-privs. Otherwise, please add a comment why this is not the case.

		2) Try to avoid innerHTML where possible. E.g. in smartTemplate-compose.js it says "// wrap text only signature to fix [Bug 25093]!", so better use sn.textContent. Check all uses of innerHTML accordingly. You may want to look into http://mxr.mozilla.org/mozilla-central/source/parser/html/nsIParserUtils.idl and/or http://mxr.mozilla.org/mozilla-central/source/parser/html/nsIScriptableUnescapeHTML.idl for additional input sanitation.

		3) When overriding/wrapping functions, it is recommended to use the Function.apply method. Example:
		https://developer.mozilla.org/en-US/docs/XUL_School/Appendix_C:_Avoid_using_eval_in_Add-ons#Overriding.2FExtending_existing_functions
		(E.g. smartTemplate-main.js)
		Also, it is not recommended to stuff your own properties into globals (Stationery.SmartTemplate = new Object()) to avoid conflicts with the core code (e.g. to not confuse code doing for (let p in Stationery)) or other add-ons.

		4) Adding a var to a template by clicking on it in the help window, the change will not be persisted unless one further edits the message text.
		STR: Edit template a bit. Add variable by click. Close window (OSX is instantApply). Reopen window -> Variable not there
		STR: Edit template a bit. Add variable by click. Edit a bit more. Close window (OSX is instantApply). Reopen window -> Variable *is* there

		5) The prefwindow, in particular the tabs, doesn't display correctly on mac: http://666kb.com/i/c97a731tmm72h62ck.png

		6) There is an error during startup:
		Warnung: WARN addons.xpi: Ignoring invalid targetApplication entry in install manifest
		Quelldatei: resource:///modules/XPIProvider.jsm
		Zeile: 805
		Likely because postbox is commented out, but the rdf ref is still there.

		Consider the following suggestion and recommendations:
		1) Please consider using Services.jsm (or creating your own if you truly want to support appversions that do not support that yet). Consider defining additional service references not covered by Services.jsm in your own code module.
		See e.g. https://github.com/scriptish/scriptish/blob/master/extension/modules/constants.js
		This makes the code somewhat faster, but more importantly, easier to read, maintain and review.

		2) Did you recently test your minVersions?

		3) There are multiple CSS errors you may want to address:
		Warnung: Fehler beim Verarbeiten des Wertes fuer 'padding-top'.  Deklaration ignoriert.
		Quelldatei: chrome://smarttemplate4/skin/default/style.css
		Zeile: 217
		Warnung: Fehler beim Verarbeiten des Wertes fuer 'vertical-align'.  Deklaration ignoriert.
		Quelldatei: chrome://smarttemplate4/skin/default/style.css
		Zeile: 187		
		
		
		

*/

Components.utils.import("resource://smarttemplate4/smartTemplate-stationery.jsm");


var SmartTemplate4 = {
	// definitions for whatIsX (time of %A-Za-z%)
	XisToday : 0,
	XisSent  : 1,
	signature : null,
	sigInTemplate : false,
	PreprocessingFlags : {
	  hasCursor: false,
		hasSignature: false,
		hasQuotePlaceholder: false,
		hasQuoteHeader: false,
		isStationery: false
	},

	stateListener: {
		NotifyComposeFieldsReady: function() {},
		NotifyComposeBodyReady: function() {
			// For Stationery integration, we need to  
			// its method of overwriting  stateListener.NotifyComposeBodyReady 
			if (SmartTemplate4.Preferences.isStationerySupported && 
			    (typeof Stationery_ != 'undefined'))
			{
			  // test existence of Stationery 0.8 specific function to test if we need to use the new event model.
				if (Stationery.fireAsyncEvent) {
				  // new Stationery will instead call preprocessHTMLStationery through its preprocessHTML method
					SmartTemplate4.Util.logDebug('NotifyComposeBodyReady: Stationery 0.8+ - no action required.');
					return;
				}

				// Stationery 0.7.8 and older
				let bypass = true;
				let oldTemplate = '';
				
				if (typeof Stationery.Templates.OnceOverride != "undefined") {
					if (Stationery.Templates.OnceOverride == '')
						bypass = false;
					else
						oldTemplate = Stationery.Templates.OnceOverride;
				}
				else { 
					if (Stationery.Templates.Current =='')  
						bypass = false;
					else
						oldTemplate = Stationery.Templates.Current;
				}
				if (bypass)
					SmartTemplate4.Util.logToConsole('An older version of Stationery (pre 0.8) is installed.\n'
					   + 'As you have selected the Stationery template ' + oldTemplate 
						 + ', SmartTemplate4 will be not used for this email.' );
				else
					SmartTemplate4.notifyComposeBodyReady();
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

			window.addEventListener('stationery-template-loaded', function(event) {
			  // async event
				SmartTemplate4.Util.logDebug('EVENT: stationery-template-loaded');
				SmartTemplate4.notifyComposeBodyReady(event);
			}, false);		
		}
	},
	
	// Stationery 0.8 support!
  preprocessHTMLStationery: function(t) {
    SmartTemplate4.Util.logDebugOptional('stationery',
		     '=========================================\n'
		   + '=========================================\n'
			 + 'preprocessor for Stationery running...');
    let idKey = document.getElementById("msgIdentity").value;
    if(!idKey)
      idKey = gMsgCompose.identity.key;
    let st4composeType = SmartTemplate4.Util.getComposeType();
    if (st4composeType.indexOf('(draft)')) {
      st4composeType = st4composeType.substr(0,3);
    }
    // ignore html!
		SmartTemplate4.StationeryTemplateText = t.HTML;
		// do not do HTML escaping!
		// pass in a flag to leave %sig% untouched
    t.HTML = SmartTemplate4.smartTemplate.getProcessedText(t.HTML, idKey, st4composeType, true, true); 
    SmartTemplate4.Util.logDebugOptional('stationery',
		     '=========================================\n'
		   + '=========================================\n'
			 + 'Stationery preprocessor complete.');
		SmartTemplate4.Util.logDebugOptional('stationery',
		     'Processed text: ' + t.HTML);
  },	
	
	// -------------------------------------------------------------------
	// A handler to add template message
	// -------------------------------------------------------------------
	notifyComposeBodyReady: function(evt)
	{
		let dbg = 'SmartTemplate4.notifyComposeBodyReady()';
		// let isStationeryTemplate = false;
		let stationeryTemplate = null;
		let flags = this.PreprocessingFlags;
		flags.hasSignature = false;
		flags.hasCursor = false;
		flags.isStationery = false;
		flags.hasQuotePlaceholder = false;
		flags.hasQuoteHeader = false;
		
		if (evt) {
			if (evt.currentTarget
			    &&
					evt.currentTarget.Stationery_) 
			{
			  let stationeryInstance = evt.currentTarget.Stationery_;
				let cur = null;
				stationeryTemplate = stationeryInstance.currentTemplate;
				dbg += '\nStationery is active';
				dbg += '\nTemplate used is:' + stationeryTemplate.url;
				if (stationeryTemplate.type !== 'blank') {
					try {
						let stationeryText = SmartTemplate4.StationeryTemplateText;
						flags.isStationery = true;
						flags.hasSignature = (!!this.smartTemplate.testSignatureVar(stationeryText));
						flags.hasCursor = this.smartTemplate.testCursorVar(stationeryText);
						flags.hasQuotePlaceholder = this.smartTemplate.testSmartTemplateToken(stationeryText, 'quotePlaceholder');
						flags.hasQuoteHeader = this.smartTemplate.testSmartTemplateToken(stationeryText, 'quoteHeader');
					}
					catch(ex) {
						SmartTemplate4.Util.logException("notifyComposeBodyReady - Stationery Template Processing", ex);
					}
				}
			}			
		}
		SmartTemplate4.StationeryTemplateText = ''; // discard it to be safe?
		SmartTemplate4.Util.logDebug(dbg);
		// Add template message
		/* if (evt && evt.type && evt.type =="stationery-template-loaded") {;} */
		// guard against this being called multiple times from stationery
		// avoid this being called multiple times
    let Ci = Components.interfaces;
		let editor = GetCurrentEditor().QueryInterface(Ci.nsIEditor);		
		let root = editor.rootElement;
		let isInserted = false;
		try {
			if (!root.getAttribute('smartTemplateInserted'))  // typeof window.smartTemplateInserted === 'undefined' || window.smartTemplateInserted == false
			{ 
				isInserted = true;
				// if insertTemplate throws, we avoid calling it again
				this.smartTemplate.insertTemplate(true, flags);
				// store a flag in the document
			  //let div = SmartTemplate4.Util.mailDocument.createElement("div");
				root.setAttribute("smartTemplateInserted","true");
				//editor.insertNode(div, editor.rootElement, 0);
				// window.smartTemplateInserted = true;
				this.smartTemplate.resetDocument(editor, true);
				
				SmartTemplate4.Util.logDebugOptional('functions', 'insertTemplate(startup) complete.');
			}
			else {
				SmartTemplate4.Util.logDebug('smartTemplateInserted is already set');
			}
		}
		catch(ex) {
			SmartTemplate4.Util.logException("notifyComposeBodyReady", ex);
			if (isInserted)
				root.setAttribute("smartTemplateInserted","true");
		}
	},

	// -------------------------------------------------------------------
	// A handler to switch identity
	// -------------------------------------------------------------------
	loadIdentity : function(startup, previousIdentity)
	{
		let isTemplateProcessed = false;
		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.loadIdentity(' + startup +')');
		if (startup) {
			// Old function call
			this.original_LoadIdentity(startup);
		}
		else {
		  // change identity on an existing message:
			// Check body modified or not
			var isBodyModified = gMsgCompose.bodyModified;
			// we can only reliable roll back the previous template and insert
			// a new one if the user did not start composing yet (otherwise danger
			// of removing newly composed content)
			if (!isBodyModified) {
				// Add template message - will also remove previous template and quoteHeader.
			  this.smartTemplate.insertTemplate(false);
				// [Bug 25104] when switching identity, old sig does not get removed.
				//             (I think what really happens is that it is inserted twice)
				isTemplateProcessed = true;
			}
			if (isBodyModified) {
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
			// if (!isTemplateProcessed)
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
		SmartTemplate4.Util.logDebug('SmartTemplate4.init() ends.');
	} ,
	
	setStatusIconMode: function(elem) {
	  try {
			this.Preferences.setMyIntPref('statusIconLabelMode', parseInt(elem.value));
			this.updateStatusBar(elem.parentNode.firstChild.checked);
		}
		catch (ex) {
			SmartTemplate4.Util.logException("setStatusIconMode", ex);
		}
	} ,
	
	updateStatusBar: function(show) {
		SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.updateStatusBar(' + show +')');
		let doc = (typeof show == 'undefined') ? document : SmartTemplate4.Util.Mail3PaneWindow.document;
		let btn = doc.getElementById('SmartTemplate4Messenger');
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
			SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4Messenger btn.className = ' + theClass);		
		}
		else
			SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.updateStatusBar() - button SmartTemplate4Messenger not found in ' + doc);
			
	} ,

	startUp: function() {
		let v = SmartTemplate4.Util.VersionProxy();
	}
};
