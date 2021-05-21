"use strict";
/* 
BEGIN LICENSE BLOCK

  SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
  Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
  For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


/* Version History  (chronological)

  == older history (pre Thunderbird 78, starting at 09/08/2011) was moved to change-log.txt ==

  Version 3.0 (ESR78) - 04/11/2020
    # [issue 69] - Make SmartTemplates compatible with Thunderbird 78 ESR
    #            - Remove Shim Code - this was code for backwards compatibilty with older Thundebrird versions as well as SeaMonkey and Postbox support
    #            - Remove support for SeaMonkey
    #            - Remove Stationery references & configuration
    #            - Rewrote filling in variables and focus method to work with new address widgets
    #            - rewrite all template dropdowns
    
  Version 3.1 - 24/11/2020
    # version bump was necessary after release 2.12.1 for my legacy Thunderbird users (Tb60 and older)    
    # [issue 94] - SmartTemplates does not insert template when Forwarding inline based on an Email written with ST
    # [issue 85] - fixed some dead links linking to old mozdev bugzilla bugs (these are now archived on quickfolders.org)
    # Reenable the sandboxed string script by Benito van der Zander. Set extensions.smartTemplate4.allowScripts = true 
    #   to get them back!
    
  Version 3.2 - 17/12/2020
    # [issue 98] %header.set(to,"[addressee]")% no longer working
    # [pr 97] %conditionalText(forwardMode,"text1","text2")% inserts text based on forwarding inline vs attached
    #         Function added by Artem (conductor111 on github)
    # Some minor improvements in layout for settings dialog and license screen
    # Fixed: Reopening existing tabs on support site did not jump to in page links (such as #donate)
    # Omit update popup for users with licenses > 40days
    # [issue 100] Trial period should restart on license expiry
    # Domain Licenses can now be renewed (and extended 30 days before expiry) directly from the license dialog.
    # Fixed some errors in Serbian and Portuguese help section
    # Fixed reminder for standard license holders using premium functions 
    
  Version 3.3 - 03/01/2020
    # [issue 104] Polish locale crashes settings dialog 
    # [issue 96]  Provide keyboard accelerators for Template picker
    # [issue 102] Fixed: %dateformat()% fails if month name / day name variables are included and %language()% set
    # [issue 61] %quotePlaceholder(level)% new function for including quoted mail within the template for styling
    #             - use the quoteLevel parameter to exclude older quotes from the conversation                  
    # [issue 108] Other Add-ons may accidentally duplicate template if they change the from address in Composer
    # Improved Scrolling behavior if %cursor% is used.
    # Fixed: Resolve Names from AB / Remove email address - this happened even when a "mail" or "bracketMail" parameter is specified
    
  Version 3.3.1 - 04/01/2020
    # [issue 110] Maximize "Account" selector dropdown
    # [issue 112] Tb78: current mail account is not preselected - this worked in Thunderbird 68
    
  Version 3.4.1 - 05/02/2021
    # [issue 91] Improve functions %deleteQuotedText% and %replaceQuotedText% so they can  be used
                 in plain text mode (quote level argument will be ignored)
    # [issue 115] Erratic %datetime()% results when forcing HTML with Shift
    # [issue 71] Added support for setting non-standard header attributes starting with "List" e.g. List-Unsubscribe
    # Improved / fixed warning messages for users with expired licenses 
    # [issue 82] Added a notice about soon-to-expire license in the status bar
    # [issue 117] %header.set(from,"some@address.com")% not working in Thunderbird 78
    # Added examples in variables window for %header.delete(subject)% and %header.set(from)% in 
      (Modify Mail Header) section
    # with option "Remove email address unless format parameter is specified", mail parts such as 
      %from(...,mail)%, %from(...,bracketMail())% were removed
   
  Version 3.4.2 - 06/02/2021 
    # [issue 119] XML Parsing Error settings dialog (it / sv / uk locales)
    # Broken entities in the translations for Italian, Ukrainian and Swedish locale lead to the settings dialog not loading
    # this is caused by google translate injecting double quotes into the strings where it shouldn't have.
    
  Version 3.4.3 - 08/02/2021 
    # Open the license tab when status icon is clicked with expired license to make renewal easier.
    
  Version 3.4.4 - 15/02/2021
    # [issue 120] Spanish locale broken which creates an error when options screen is displayed
    # [issue 121] Common settings are shown even though the correct account seems to be selected!
    
  Version 3.5.1 - 21/05/2021
    # [issue 125] Improved support for converting encoded characters used in address fields such as "from"
    # [issue 126] Enabling Resolve names from Address book falsely disables advanced options
    # [issue 127] Make SmartTemplates compatible with Thunderbird 89 - using notifyTools
    # [issue 130] Error in localization for Traditional Chinese (zh-TW) breaks settings dialog.
    # New localization scheme implemented
    # Added catalan locale (transformed from occitan)
    # fixed openTab in Tb80 (added url parameter)
    
=========================
  KNOWN ISSUES / FUTURE FUNCTIONS
  
  Version 2.x
    # [issue 28] Add "Smart Snippets": smart fragments that can be inserted from Composer.
    # [issue 27] Insert external HTML Templates from a web page URL
    # [issue 10] add %deliveryoptions% function to force Return Receipt.
    # [issue 12] <head> section is merged into <body>
    # ...
      
  Version 2.2
    # Known issues: The "clean up button" is not automatically installed in the composer toolbar.

// investigate gMsgCompose.compFields!
=========================
*/

 
var SmartTemplate4 = {
  // definitions for whatIsX (time of %A-Za-z%)
  XisToday : 0,
  XisSent  : 1,
  signature : null,
  sigInTemplate : false,
  PreprocessingFlags : {
    hasCursor: false,
    hasSignature: false,
    omitSignature: false,
    hasQuotePlaceholder: false,
    hasQuoteHeader: false,          // WIP
    hasTemplatePlaceHolder: false,  // future use
    isStationery: false,
    isThunderbirdTemplate: false,
    isFileTemplate: false
  },
  
  initFlags : function initFlags(flags) {
    // independent initialisation so we can create an empty flags object
    flags.hasSignature = false;
    flags.omitSignature = false,
    flags.hasCursor = false;
    flags.isStationery = false;
    flags.hasQuotePlaceholder = false;
    flags.hasQuoteHeader = false;
    flags.hasTemplatePlaceHolder = false;
    flags.isThunderbirdTemplate = false;
    flags.isFileTemplate = false;
  } ,

  stateListener: {
    NotifyComposeBodyReady_AllCases: function ST_NotifyComposeFieldsReady(event, composeCase) {
      const util = SmartTemplate4.Util,
            prefs = SmartTemplate4.Preferences,
            msgComposeType = Components.interfaces.nsIMsgCompType;
      let eventDelay = (gMsgCompose.type != msgComposeType.ForwardInline) 
                     ? 10 
                     : prefs.getMyIntPref("forwardInlineImg.delay"),
          isNotify = false;
      util.logDebug('NotifyComposeBodyReady');
      isNotify = true;
      if (isNotify) {
        // [BUG 26434] forwarding email with embedded images removes images
        // test delaying call for forward case
        window.setTimeout(
          function(){ 
            SmartTemplate4.notifyComposeBodyReady(event); 
          }, 
          eventDelay);
      }
    },
    
    NotifyComposeBodyReady: function(event) { 
      const msgComposeType = Components.interfaces.nsIMsgCompType;
      this.NotifyComposeBodyReady_AllCases(event, null);
    },

    // neu
    NotifyComposeBodyReadyNew: function(event) {
      const msgComposeType = Components.interfaces.nsIMsgCompType;
      this.NotifyComposeBodyReady_AllCases(event, msgComposeType.New);
    },
    
    NotifyComposeFieldsReady: function() {},

    //ende neu
    
    ComposeProcessDone: function(aResult) {
      const util = SmartTemplate4.Util;
      util.logDebug('ComposeProcessDone');
    },
    
    SaveInFolderDone: function(folderURI) {
      const util = SmartTemplate4.Util;
      util.logDebug('SaveInFolderDone');
    }
  },

  initListener: function initListener(isWrapper) {
    const util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences,
          msgComposeType = Components.interfaces.nsIMsgCompType;
    let log = util.logDebugOptional.bind(util);
    if (SmartTemplate4.isListenerInitialised) {
      log('composer','Listener is initialised - early exit.');
      return; // avoid calling 2x
    }
    let notifyComposeBodyReady = SmartTemplate4.notifyComposeBodyReady.bind(SmartTemplate4),
        txtWrapper = isWrapper ? "Wrapper=true" : "compose-window-init event";
    SmartTemplate4.isListenerInitialised = true;
    log('composer', 'Registering State Listener [' + txtWrapper + ']...');
    if (prefs.isDebugOption('composer')) debugger;
    try {
      gMsgCompose.RegisterStateListener(SmartTemplate4.stateListener);
      // can we overwrite part of global state listener?
      // stateListener is defined in components/compose/content/MsgComposeCommands.js
      if (stateListener && stateListener.NotifyComposeBodyReady) {
        if (typeof gComposeType !== 'undefined' && !util.OrigNotify) {
          
          util.OrigNotify = 
            (gComposeType == msgComposeType.New)
            ? stateListener.NotifyComposeBodyReadyNew.bind(stateListener)
            : stateListener.NotifyComposeBodyReady.bind(stateListener);
            
          let idKey = util.getIdentityKey(document);
          stateListener.NotifyComposeBodyReady = function NotifyComposeBodyReadyST() {  //name helps debugging
            // Bug 26356 - no notification on forward w. empty template  !!!!wrong bug number??? this was closed 21 years ago
            if (gComposeType !== msgComposeType.ForwardInline
               ||
               (SmartTemplate4.pref.getTemplate(idKey, 'fwd', "")!="")
                && 
                SmartTemplate4.pref.isProcessingActive(idKey, 'fwd', false))
            {
              util.OrigNotify();
            }
          }
        }
      }
    }
    catch (ex) {
      util.logException("Could not register status listener", ex);
    }
  },
  
  // -------------------------------------------------------------------
  // A handler to add template message
  // -------------------------------------------------------------------
  notifyComposeBodyReady: function notifyComposeBodyReady(evt, isChangeTemplate, win=null)  {
    const prefs = SmartTemplate4.Preferences,
          util = SmartTemplate4.Util,
          Ci = Components.interfaces,
          msgComposeType = Ci.nsIMsgCompType;
          
    isChangeTemplate = isChangeTemplate || false; // we need this for [isue 29] change template in composer window
    // maybe use    GetCurrentEditor() and find out  stuff from there
    // get last opened 3pane window - but we really need the owner of the "write button"
    // we clicked. 
    // That window stores SmartTemplate4.fileTemplates.armedEntry
    // we need this to retrieve the file Template path and title!
    let ownerWin = win || util.Mail3PaneWindow, // for changing the template our current composer window is the context
        fileTemplateSource = null; // for fileTemplates, echeck if null and o.failed, otherwise o.HTML shoulde be the tempalte
    
    // check if a file template is active. we need to get the window from the originating event!
    let dbg = 'SmartTemplate4.notifyComposeBodyReady()',
        stationeryTemplate = null,
        flags = this.PreprocessingFlags;
    this.initFlags(flags);
        
    // retrieve and consume fileTemplate info
    // I will be very cautious in case composer is called from elsewhere (e.g. a mailto link, or a single message window)
    
    if (ownerWin && 
        ownerWin.SmartTemplate4 && 
        ownerWin.SmartTemplate4.fileTemplates && 
        ownerWin.SmartTemplate4.fileTemplates.armedEntry) {
      let theFileTemplate = ownerWin.SmartTemplate4.fileTemplates.armedEntry;       // this is a html file we need to parse.
      ownerWin.SmartTemplate4.fileTemplates.armedEntry = null; 
      util.logDebugOptional("fileTemplates", "notifyComposeBodyReady: \n"
        + "Consuming fileTemplate: " + theFileTemplate.label + "\n"
        + "composeType:" + theFileTemplate.composeType + "\n"
        + "path:" + theFileTemplate.path);
        
      // composer context:
      fileTemplateSource = SmartTemplate4.fileTemplates.retrieveTemplate(theFileTemplate);
      if (fileTemplateSource.failed) {
        let text = util.getBundleString("st.fileTemplates.error.filePath",
           "Could not load the file template '{0}' from path:\n{1}\nThe file may have been removed or renamed.");
          
        SmartTemplate4.Message.display(
          text.replace("{0}", theFileTemplate.label).replace("{1}", theFileTemplate.path),
          "centerscreen,titlebar,modal,dialog",
          { ok: function() {  
                  // get last composer window and bring to foreground
                  let composerWin = Services.wm.getMostRecentWindow("msgcompose");
                  if (composerWin)
                    composerWin.focus();
                }
          }, 
          ownerWin
        );
      }
      else {
        flags.isFileTemplate = true; // !!! new Stationery substitution
        if (!flags.filePaths) flags.filePaths = [];
        flags.filePaths.push(theFileTemplate.path); // remember the path. let's put it on a stack.
        /**********      GLOBAL VARIABLE!!! - SCOPED TO COMPOSER WINDOW      **********/
        // [issue 64] memorize the file template path in Composer! So we can change from address and reload it.
        window.SmartTemplate4.CurrentTemplate = theFileTemplate;
      }
    }
        
    // We must make sure that Thunderbird's own  NotifyComposeBodyReady has been ran FIRST!   
    // https://searchfox.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#343
    if (prefs.isDebugOption('composer')) debugger;
    
    dbg += "\ngMsgCompose type: "  + gMsgCompose.type;
    // see https://dxr.mozilla.org/comm-central/source/comm/mailnews/compose/public/nsIMsgComposeParams.idl
    // New in Tb60 EditAsNew (15) and EditTemplate (16)
    if (gMsgCompose.type == (msgComposeType.EditAsNew || 15) 
       ||
       gMsgCompose.type == (msgComposeType.EditTemplate || 16) 
       )
      return; // let's do no processing in this case, so we can edit SmartTemplates variables
      
    // Tb 52 uses msgComposeType.Template for "Edit as New""
    if (gMsgCompose.type == msgComposeType.Template && (typeof msgComposeType.EditTemplate == 'undefined')) {
      util.logDebug("omitting processing - composetype is set to Template and there is no EditTemplate defined (pre Tb60)")
      return;
    }
    // this also means the hacky code around flags.isThunderbirdTemplate will now be obsolete.
    flags.isThunderbirdTemplate = 
      (gMsgCompose.type == msgComposeType.Template);
    SmartTemplate4.StationeryTemplateText = ''; // discard it to be safe?
    util.logDebug(dbg);
    // Add template message
    // guard against this being called multiple times from stationery
    // avoid this being called multiple times
    let editor = util.CurrentEditor.QueryInterface(Ci.nsIEditor),
        root = editor.rootElement,
        isInserted = false;
    try {
      // guard against forwarding my own message (body may have the smartTemplateInserted flag already)
      if ( !root.getAttribute('smartTemplateInserted') 
          || gMsgCompose.type == msgComposeType.ForwardInline
          || flags.isThunderbirdTemplate || isChangeTemplate)  
      { 
        isInserted = true;
        // [issue 108] avoid duplicating in case external Add-on changes from identity
        if ((gMsgCompose.type == msgComposeType.ForwardInline || gMsgCompose.type == msgComposeType.ForwardAsAttachment)
            && root.getAttribute('smartTemplateInserted'))
          isChangeTemplate = true;
        
        // if insertTemplate throws, we avoid calling it again
        let isStartup = isChangeTemplate ? false : !flags.isThunderbirdTemplate;
        if (isChangeTemplate && gMsgCompose.bodyModified) {
          let cancelled = false,
              w1 = util.getBundleString("st.notification.editedChangeWarning",
                   "You have already typed text and want to change to template {0}"),
              q1 = util.getBundleString("st.notification.editedChangeChallenge",
                   "Any text you entered manually since opening composer will be deleted, without Undo. Continue anyway?");            
          SmartTemplate4.Message.display(
            w1.replace("{0}", fileTemplateSource.label) + "\n" + q1, 
            "centerscreen,titlebar,modal,dialog",
            { ok: function() { ; },
              cancel: function() { cancelled = true; }
            } , win
          );    
          if (cancelled) {
            flags.filePaths.pop();
            return;
          }
        }
        flags.isChangeTemplate = isChangeTemplate;
        this.smartTemplate.insertTemplate(isStartup, flags, fileTemplateSource); // if a Tb template is opened, process without removal
        // store a flag in the document
        // [issue 108] Other Add-ons may accidentally duplicate template if they set from identity
        // root.setAttribute("smartTemplateInserted","true"); <== moved into the insertTemplate function!
        // window.smartTemplateInserted = true;
        this.smartTemplate.resetDocument(editor, true);
        if (isChangeTemplate)
          util.logDebugOptional('functions', 'Change Template: insertTemplate() complete.');
        else
          util.logDebugOptional('functions', 'insertTemplate(startup) complete.');
      }
      else {
        util.logDebug('smartTemplateInserted is already set');
      }
      
      //set focus to editor
      let FocusElement, FocusId;
      // if we load a template ST4 processing will have been done before the template was saved.
      // composeCase is set during insertTemplate
      switch (this.smartTemplate.composeCase) {
        case 'tbtemplate':
        case 'new': // includes msgComposeType.Template and msgComposeType.MailToUrl
        case 'forward':
          if (gMsgCompose.type == msgComposeType.MailToUrl) // this would have the to address already set
            FocusId = 'content-frame'; // Editor
          else {
            FocusId = 'content-frame'; // editor is fallback
            // find the "to" line
            let foundTo = false;
            let adContainer = window.document.getElementById("toAddrContainer");
            if (adContainer) {
              let adPill = 
                adContainer.querySelector("mail-address-pill"); // first match if an address pill exists
              if (!adPill) {
                let input = window.document.getElementById("toAddrInput");
                if (input) {
                  if (input) {
                    input
                  }
                  FocusId = input.id;
                }
              }
            }
          }
          break;
        default: // 'reply'  - what about mailto?
          FocusId = 'content-frame'; // Editor
      }
      FocusElement = window.document.getElementById(FocusId);
      if (FocusElement) {
        FocusElement.focus();
      }
      
    }
    catch(ex) {
      util.logException("notifyComposeBodyReady", ex);
      if (isInserted)
        root.setAttribute("smartTemplateInserted","true");
    }
    util.logDebugOptional('composer', 'notifyComposeBodyReady() ended.');
  },

  // -------------------------------------------------------------------
  // A handler to switch identity
  // -------------------------------------------------------------------
  loadIdentity: function loadIdentity(startup, previousIdentity) {
    const prefs = SmartTemplate4.Preferences,
          util = SmartTemplate4.Util;    
    let isTemplateProcessed = false;
    SmartTemplate4.Util.logDebugOptional('functions','SmartTemplate4.loadIdentity(' + startup +')');
    if (startup) {
      // Old function call
      this.original_LoadIdentity(startup);
    }
    else {
      let newSig;
      // change identity on an existing message:
      // Check body modified or not
      let isBodyModified = gMsgCompose.bodyModified,
          composeType = util.getComposeType();
      // we can only reliable roll back the previous template and insert
      // a new one if the user did not start composing yet (otherwise danger
      // of removing newly composed content)
      if (!isBodyModified) {
        // [issue 51]
        this.original_LoadIdentity(false); // make sure Tb does everything it needs to the from header!
        // Add template message - will also remove previous template and quoteHeader.
        if (window.SmartTemplate4.CurrentTemplate) {
          //[issue 64] reload the same template if it was remembered.
          let fileTemplateSource = SmartTemplate4.fileTemplates.retrieveTemplate(window.SmartTemplate4.CurrentTemplate);
          if (fileTemplateSource.failed) { // shouldn't actually happen as we just loaded it before
            let text = util.getBundleString("st.fileTemplates.error.filePath",
              "Could not load the file template '{0}' from path:\n{1}\nThe file may have been removed or renamed.");
            alert(text); 
          }
          else
            this.smartTemplate.insertTemplate(false, window.SmartTemplate4.PreprocessingFlags, fileTemplateSource);
        }
        else
          this.smartTemplate.insertTemplate(false);
        // [Bug 25104] when switching identity, old sig does not get removed.
        //             (I think what really happens is that it is inserted twice)
        isTemplateProcessed = true;
      }
      else {
        // if previous id has added a signature, we should try to remove it from there now
        // we do not touch smartTemplate4-quoteHeader or smartTemplate4-template
        // as the user might have edited here already! 
        // however, the signature is important as it should match the from address?
        if (prefs.getMyBoolPref("removeSigOnIdChangeAfterEdits")) {
          newSig = this.smartTemplate.extractSignature(gMsgCompose.identity, false, composeType);
        }
      }
      // AG 31/08/2012 put this back as we need it!
      // AG 24/08/2012 we do not call this anymore if identity is changed before body is modified!
      //               as it messes up the signature (pulls it into the blockquote)
      // AG 27/11/2019 [issue 7] putting condition back as it can mess up signature.
      if (!isTemplateProcessed) {
        if (isBodyModified && composeType=="new") {
          // when Thunderbird changes identity, we cannot keep our JavaScript stuff / late resolved variables around.
          util.cleanupDeferredFields(true); // remove the fields even if they can't be resolved!
        }
        this.original_LoadIdentity(startup);
        // try replacing the (unprocessed) signature that Thunderbird has inserted.
        if (prefs.getMyBoolPref('parseSignature') && newSig ) {
          // find and replace signature node.
          let sigNode = util.findChildNode(gMsgCompose.editor.rootElement, 'moz-signature');
          if (sigNode) {
            sigNode.innerHTML = newSig.innerHTML;
          }
          gMsgCompose.bodyModified = isBodyModified; // restore body modified flag!
        }
      }
      if (!isBodyModified && gMsgCompose.bodyModified) {
        gMsgCompose.editor.resetModificationCount();
      } // for TB bug?
    }
    
  },

  // -------------------------------------------------------------------
  // Escape to HTML character references
  // -------------------------------------------------------------------
  escapeHtml: function escapeHtml(str) {
    return str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/\n/gm, "<br>"); // remove quote replacements
  },


  // -------------------------------------------------------------------
  // Initialize - we only call this from the compose window
  // -------------------------------------------------------------------
  init: function init() {
    function smartTemplate_loadIdentity(startup){
      let prevIdentity = gCurrentIdentity;
      return SmartTemplate4.loadIdentity(startup, prevIdentity);
    }

    // http://mxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#3998
    if (typeof LoadIdentity === 'undefined') // if in main window: avoid init()
      return;
    SmartTemplate4.Util.logDebug('SmartTemplate4.init()');
    //  SmartTemplate4.Util.VersionProxy(); // just in case it wasn't initialized
    this.original_LoadIdentity = LoadIdentity; // global function from MsgComposeCommands.js
    // overwriting a global function within composer instance scope
    // this is intentional, as we needed to replace Tb's processing
    // with our own (?)
    LoadIdentity = smartTemplate_loadIdentity;

    this.pref = new SmartTemplate4.classPref();

    // a class instance.
    this.smartTemplate = new SmartTemplate4.classSmartTemplate();
    // this.cal = new this.classCalIDateTimeFormatter(true);

    // Time of %A-Za-z% is today(default)
    this.whatIsX = this.XisToday;
    this.whatIsUtc = false;
    this.whatIsDateOffset = 0;
    this.whatIsHourOffset = 0;
    this.whatIsMinuteOffset = 0;
    this.whatIsTimezone = ""; //default timezone
    // flag for deferred vairables - once we add an event handler into the composer content script for clicking on
    // not (yet) existing headers [e.g. %To(Name)% in a new Email] we set this variable to true
    // (avoids having the function there multiple times)
    this.hasDeferredVars = false; 

    SmartTemplate4.Util.logDebug('SmartTemplate4.init() ends.');
    
  } ,
  
  setStatusIconMode: function setStatusIconMode(elem) {
    try {
      this.Preferences.setMyIntPref('statusIconLabelMode', parseInt(elem.value));
      this.updateStatusBar(elem.parentNode.firstChild.checked);
    }
    catch (ex) {
      SmartTemplate4.Util.logException("setStatusIconMode", ex);
    }
  } ,
  
  updateStatusBar: function updateStatusBar(show) {
    const prefs = SmartTemplate4.Preferences,
          util = SmartTemplate4.Util,
          licenseInfo = SmartTemplate4.Util.licenseInfo;
    try {
      util.logDebug('SmartTemplate4.updateStatusBar(' + show +') ... with licenseInfo = ', licenseInfo);
      let isDefault = (typeof show == 'undefined' || show == 'default'),
          isVisible = isDefault ? prefs.getMyBoolPref('showStatusIcon') : show,
          doc = isDefault ? document : util.Mail3PaneWindow.document,
          btn = doc.getElementById('SmartTemplate4Messenger');
      if (btn) {
        let labelMode = prefs.getMyIntPref('statusIconLabelMode');
        btn.classList.remove(...btn.classList); // clear classlist array
        btn.classList.add('statusbarpanel-iconic-text');
        if (licenseInfo.licenseKey) {
          let days = licenseInfo.licensedDaysLeft,
              wrn = null;
          if (licenseInfo.isExpired)  {
            let def = "SmartTemplates License has expired {0} days ago.".replace("{0}", licenseInfo.expiredDays);
            wrn =  util.getBundleString("licenseStatus.expired", def, [licenseInfo.expiredDays]);
            btn.classList.add("alertExpired");
          }
          else if (days<15) {
            let def = "SmartTemplates License will expire in {0} days!".replace("{0}", days)
            wrn = util.getBundleString("licenseStatus.willExpire", def, [days]);
            btn.classList.add("alert");
          }
          if (wrn) {
            btn.label = wrn;
            isVisible = true;
            labelMode = 2;
          }
          else {
            if (licenseInfo.keyType==2)
              btn.label = "SmartTemplates";
            else
              btn.label = "SmartTemplates Pro";
          }
        }
        else
          btn.label = "SmartTemplates";
        btn.collapsed = !isVisible;
        
        switch(labelMode) {
          case 0:
            btn.classList.add('hidden');
            break;
          case 1:
            //NOP;
            break;
          case 2:
            btn.classList.add('always');
            break;
        }
        util.logDebugOptional('functions','SmartTemplate4Messenger btn.className = ' + btn.className + ' , collapsed = ' + btn.collapsed);    
      }
      else
        util.logDebugOptional('functions','SmartTemplate4.updateStatusBar() - button SmartTemplate4Messenger not found in ' + doc);
    }
    catch(ex) {
      util.logException("SmartTemplate4.updateStatusBar() failed ", ex);
    }
  } ,

  // all main window elements that change depending on license status 
  initLicensedUI: function ST_initLicensedUI() {
    SmartTemplate4.Util.logDebug("initLicensedUI()", SmartTemplate4.Util.licenseInfo);
    SmartTemplate4.updateStatusBar();
  },

  startUp: function ST_startUp() {
    const util = SmartTemplate4.Util;
    // let v = util.VersionProxy();

    //  a hack for the status bar icon: 
    window.setTimeout(function() {
      if (window.document.URL.endsWith("messenger.xhtml"))
          window.SmartTemplate4.updateStatusBar("default");
    }, 2000);
    
    gMessageListeners.push(SmartTemplate4.messageListener);
    util.logDebug("startUp complete");
  } ,
  
  shutDown: function ST_shutDown(isMainWindow = false) {
    const util = SmartTemplate4.Util;
    if (isMainWindow) {
      util.logDebug("removing message listeners…");
      gMessageListeners = gMessageListeners.filter(listener => listener !== SmartTemplate4.messageListener);
    }
    
    util.logDebug("Remove added custom UI elements …");
    let elements = Array.from(window.document.querySelectorAll('[s4uiElement]'));
    for (let element of elements) {
      element.remove();
    }
          
    util.logDebug("Cleanup/Downgrade toolbar buttons …");
    let manipulatedButtons = [
      "button-newmsg",
      "button-reply",
      "button-replyall",
      "button-replylist",
      "button-forward",
      "hdrReplyButton",
      "hdrReplyAllButton",
      "hdrReplyListButton",
      "hdrFollowupButton",
      "hdrReplyToSenderButton",
      "hdrForwardButton"];
    
    for (let btn of manipulatedButtons) {
      window.SmartTemplate4.hackToolbarbutton.cleanupIfNeeded(window, btn);
    }
    
    util.logDebug("shutDown complete");
  } ,
  
  signatureDelimiter:  '-- <br>',
  
  // this listener is in charge of all dynamic changes (hiding / showing buttons) in the header toolbar
  // see: onEndHeaders.
  messageListener : {
    onStartHeaders() {
      
    },
    onEndHeaders() {
      const util = SmartTemplate4.Util;
      util.logDebug("onEndHeaders");
      let hrBtns=["hdrReplyButton","hdrReplyAllButton","hdrReplyListButton","hdrFollowupButton",
                  "hdrReplyToSenderButton", "hdrForwardButton","hdrDualForwardButton"];
                  // ,"button-reply","button-replyall", "button-replylist", "button-forward" // are these from CompactHeaders?
      for (let b=0; b<hrBtns.length; b++) {
        let id = hrBtns[b],
            fakeId = id + "-ST",
            theBtn = document.getElementById(id);
        if(!theBtn) continue;
        let btn = document.getElementById(fakeId); // unneeded "fake" buttons need to be hidden
        if(!btn) continue;
        btn.hidden = theBtn.hidden || false;
        if (btn.hidden) {
          util.logDebug("Hiding button: " + fakeId);
        }
      }
      
    },
    beforeStartHeaders() {
      return true;
    }
  }

};  // Smarttemplate4

// -------------------------------------------------------------------
// Get day name and month name (localizable!)
// locale optional for locale
// -------------------------------------------------------------------
// this was classCalIDateTimeFormatter
// replace with --  const loc = new Localization(["toolkit/intl/regionNames.ftl"], true);
SmartTemplate4.calendar = {
    currentLocale : null, // whatever was passed into %language()%
    bundleLocale: null,
    bundle: null,
    list: function list() {
      let str = "";
      for (let i=0;i<7 ;i++){
        str+=(cal.dayName(i)  +"("+ cal.shortDayName(i) + ")/");
      } 
      str += "\n";
      for (let i=0;i<12;i++){
        str+=(cal.monthName(i)+"("+ cal.shortMonthName(i) + ")/");
      }
      return str;
    },
    
    init: function init(forcedLocale) {
      const util = SmartTemplate4.Util;

      let strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
               getService(Components.interfaces.nsIStringBundleService);
      // validate the passed locale name for existence
      // https://developer.mozilla.org/en-US/docs/How_to_enable_locale_switching_in_a_XULRunner_application
      if (forcedLocale) {
        let availableLocales = util.getAvailableLocales("smarttemplate4"), // smarttemplate4-locales
            found = false,
            fullMatch = false,
            listLocales = "";
        while (availableLocales.hasMore()) {
          let aLocale = availableLocales.getNext();
          listLocales += aLocale.toString() + ', ';
          if (aLocale == forcedLocale) { // match completely, e.g/ "en" or "en-GB"
            this.bundleLocale = aLocale;
            fullMatch = true;
            found = true;
          }
          if (!fullMatch && aLocale.indexOf(forcedLocale)==0) {  // allow en to match en-UK, en-US etc.
            this.bundleLocale = aLocale;
            found = true;
          }
        }
        if (!found) {
          let errorText =   "Unsupported %language% id: " + forcedLocale + "\n"
                          + "Available in SmartTemplate4: " + listLocales.substring(0, listLocales.length-2) + "\n"
                          + "This will affect the following variables: %A% %a% %B% %b% (week days and months) ";
          util.logToConsole(errorText);
          this.bundleLocale = null;
        }
        else {
          util.logDebug("calendar - found extension locales: " + listLocales + "\nconfiguring " + forcedLocale);
        }
      }     
      this.currentLocale = forcedLocale; // if not passed in, this will use the default locale for date translations 
      let bundleUri = this.bundleLocale 
        ? "chrome://smarttemplate4-locales/content/" + this.bundleLocale 
        : "chrome://smarttemplate4/locale"; // determined by currently active Thunderbird locale
      this.bundle = strBndlSvc.createBundle(bundleUri + "/calender.properties");
    },
    
    // the following functions retrieve strings from our own language packs (languages supported by SmartTemplate itself)
    // these will affect the following variables: %A% %a% %B% %b% (week days and months)
    // OTOH: %dateshort% and %datelocal% extract their names from the language packs installed
    dayName: function dayName(n){ 
      return this.bundle.GetStringFromName("day." + (n + 1) + ".name");  // SmartTemplate4.Util.getBundleString("day." + (n + 1) + ".name"); 
    },
    
    shortDayName: function shortDayName(n) { 
      return this.bundle.GetStringFromName("day." + (n + 1) + ".short");  // SmartTemplate4.Util.getBundleString("day." + (n + 1) + ".short");
    },
    
    monthName: function monthName(n){ 
      return this.bundle.GetStringFromName("month." + (n + 1) + ".name"); // SmartTemplate4.Util.getBundleString("month." + (n + 1) + ".name");
    },
    
    shortMonthName: function shortMonthName(n) { 
      return this.bundle.GetStringFromName("month." + (n + 1) + ".short"); // SmartTemplate4.Util.getBundleString("month." + (n + 1) + ".short");
    }
};   // SmartTemplate4.calendar 
  
