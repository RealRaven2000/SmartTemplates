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
    
  Version 3.5.3 - 27/05/2021
    # Ongoing work Remove usage of main window instance - for premium feature messages
    # Removed many entries (especially in new Licenser module + background pages) to keep the error console clean 
    # - these are now dependent on debug settings and can be added according to troubleshooting requirements.
    # Added event listener to composer windows so the template menus can be reconfigured in real time.
    # Fixed a regression with links from the Registration dialog caused by the migration to the new licensing modul 
    
  Version 3.5.4 - 03/06/2021
    # New version of WindowListener to support wrench button to access Add-on settings

  Version 3.6 - 17/06/2021
    # [issue 134] Support tab missing in version 3.5.4
    # [issue 137] SmartTemplates doesn't auto-update to 3.5.4 (because it needs permissions?)
    # [issue 135] Expand multiple recipients with %to(firstname)% in New Mail Template.
    # Removed all permissions for accounts, notifications
    
  Version 3.7 - 20/08/2021
    # Make SmartTemplates compatible with Thunderbird 91
    # - removed fixIterator
    # - replaced Array types where necessary
    # - Fixed sliding notifications in composer and icons in all sliding notifications
    # - Fixed about:config dialogs
    # Removed Utilities.openLinkExternally and replaced with messenger.windows.openDefaultBrowser
    # Fixed "Buy License" button at bottom of Settings window
    # Fixed: [issue 143] Template Files - Toolbar buttons missing
    # [issue 118] new variable %clipboard% to insert clipboard contents (will be inserted as HTML)
    # Splash screen: not shown immediately on update; removed message about permissions
    # only show standard license upgrade special offer when within the date

  Version 3.8 - 21/10/2021
    # [issue 142]/[issue 28] Add feature to insert html Smart snippets within Composer
    # [issue 147] Add categories / folders to structure template menus
    # [issue 151] New single variable %recipient% for final recipient to replace %to% / %from% in all templates
    # [issue 148] Regression: Saving / Loading account templates from settings doesn't work without Pro License
    # [issue 139] Double template inserted when replying to own email
    # [issue 149] Fixed: If no %cursor% is entered, HTML template may be truncated / reformatted at the end
    # [issue 153] Fixed: Recipient Names which are only 1 Character long are dropped
    # [issue 156] Fixed: When FORWARDING, %quotePlaceholder% doesn't position forwarded mail text correctly
    # [issue 158] Fixed: Could not switch spell checker language with %spellchecker% command
    # Fixed displaying trial date on license tab
    # Removed "workaround" experimental APIs (notifications, accounts)
    # Removed obsolete "Shim" code

  Version 3.9 - 09/12/2021
    # [issue 164] Feature: Add *selection* placeholder for inserting HTML snippets (fragments)
    # [issue 161] remove text shadow in html edit boxes for dark themes - this makes the text better readable.
    # make sure the Snippets button is being added automatically in Composer {WIP}
    # [issue 162] Fixed: Main toolbar - template dropdowns - items in category submenus don't trigger composer
    # [issue 139] Fixed: Duplicate template inserted when replying to own email - Tb Conversations Add-on!
    # [issue 155] Fixed: reply template applied twice in thunderbird 91.2.0
    # [issue 163] Fixed: With Cardbook installed, SmartTemplates statusbar icon may not be shown
    

  Version 3.10.1 - 04/02/2021
    # [issue 166] %recipient% should use reply-to header if present when replying
    # [issue 150] removed nag screen which pops up after trial date is expired.
    # [issue 154] Support pushing [Esc] to close template change confirmation
    # [issue 167] Address Book list entries are not expanded with empty "To:" address
    # [issue 168] Fixed: custom background and text colors ignored in composer when writing new mails

  Version 3.10.2 - 07/02/2022
    # [issue 170] UI to view license extension longer than 1 month before expiry of Pro license
    # [issue 171] Settings Dialog: Empty Examples tab in Thunderbird 91
    
  Version 3.11 - 17/03/2022
    # [issue 172] Support deleting / replacing text in text of inline forwarded mail
    # [issue 173] Auto-Forward / Auto-Reply with template -  implement triggering template from filter (using FiltaQuilla)
    # [issue 174] %suppressQuoteHeaders% command to suppress all quote headers
    
  Version 3.12.1 - 27/06/2022
    # Compatibility changes for Thunderbird ESR 102:
    #   Fixed notifications
    #   Fixed id  of composer container for setting focus to email
    #   Stabilized code when reading external signatures or including external files
    #   [issue 189] Support multiple spellcheck languages with %spellcheck()%
    #   Fixed menu spacings for Templates in reply / write / forward / Snippets buttons.
    #   
    # [issue 182] Improve *selection* placeholder in Snippets to better support non-text nodes
    # [issue 183] Support using "clipboard" as argument for text and header manipulation functions
    # [issue 185] Simplify Settings - Accounts dropdown and toolbar buttons
    # [issue 187] Support transferring headers / variable results to clipboard
    # [issue 186] Various Issues in bracketMail parameter in %to% / %from% etc.
    # Fix xhtml attribute syntax (no spaces allowed in "attribute=value")
    # Moved clipboard reading to Util module
    # [issue 184] WIP: Move template processing into background script

  Version 3.12.2 - 29/06/2022
    # [issue 197] - Expand / collapse / help buttons invisible when opening settings from Add-ons Manager
    # [issue 198] - Renew license button on lower left of settings dialog not working
    
  Version 3.13 - 21/08/2022
    # [issue 199] Inserting of addresses with display name that contains comma fails with unexpected results
    # [issue 200] bracketMail() and bracketName() cannot be used in the same format string
    # [issue 205] After FiltaQuilla filter forwards / replies with template, the next manual reply uses same template
    # [issue 204] "Update and replace with content" command doesn't replace the field
    # Use compose-window-init event in 102 to attain headers at an earlier stage - to call SmartTemplate4.getHeadersAsync()
    # toclipboard - new parameter for copying address variables to clipboard 
    # bracketMail() / bracketName() Fixed copying angled brackets to clipboard as plain text (and not encoded)
    # [issue 206] %datelocal% throws an error and returns a blank space.
    # [issue 208] Improve accessibility for settings dialog
    # [issue 209] Support license validation with Exchange accounts (from Tb 102)
    # After updating, do not open tab with version log automatically. Old behavior can be restored on the licenses tab.
    # Repaired icon in customize toolbar
    
  Version 3.14 - 26/10/2022
    # [issue 211] accept mixed case headers such as "Newsgroups" / "Message-Id" again
    # [issue 210] support using toclipboard parameter multiple times in the same template
    # [issue 215] Search box in variables window
    # Fixed text colors in Variables window when using dark themes.
    # Known issue - [external?] template not applied when replying to a message we sent ourselves 
    #               that used SmartTemplates - and Tb changes the recipient - 
    #               this leads to immediate secondary loadIdentity(startup=false,...) where previous body 
    #               already has the smartTemplateInserted attribute.
    
  Version 3.15 - 25/11/2022
    # [issue 215] Improved Variables search - use Shift+F3 to search backwards; support Numpad Enter
    # [issue 217] addressbook switches broken.
    
  Version 3.15.1 - 28/11/2022
    # fixed [F3] Search again.
    
  Version 3.16 - 05/03/2023
    # [issue 222] Template Categories containing space characters disrupt the template menus
    # [issue 223] Spellchecker is not activated by %spellcheck()% command - if the option 
                  "spellcheck as you type" is disabled in Composition settings.
    # [issue 219] Regression: bracketName(";") parameter broken. 
    # minimum version: 91.0
    # compatibilty until: 110.0
    # Removed Service wrappers for nsIWindowMediator, nsIWindowWatcher, nsIPromptService, nsIPrefBranch, nsIPrefService, 
    #                              nsIStringBundleService, nsIXULAppInfo, nsIMsgComposeService, nsIConsoleService, nsIVersionComparator,
    #                              nsIXULRuntime
    # [issue 50] Add CardBook support [WIP]
    # [issue 226] Automatically update deferred fields for headers that have been modified / set by template (header.set)
    # use ical.js library to parse various vCard formats
    # (see https://webextension-api.thunderbird.net/en/stable/how-to/contacts.html)
    # Show license buttons on the "menu restrictions" dialog message

  Version 3.16.1 - 21/03/2023
    # [issue 231] Forward with Template doesn't send off mail automatically any more
    # [issue 229] Fixed Scripts fields %{% %}% 
    # [issue 230] %from(addressbook,nickname)% throws an error when trying to use CardBook

  Version 3.17 - 04/05/2023
    # [issue 236] Remove body of forwarded mail - %deleteForwardedBody%
    # [issue 237] Allow %file()% command to use ../ to access parent folders of a file
    # [issue 238] Insert Snippet: support inserting contents of a CSS file as style block
    # [issue 233] Improvements in Template Manager: Category prefix, [TO DO: add sorting]
    # To encourage license renewals: Show bargain section in splash screen if <=10 days to expiry
    # [issue 232] Added pricing section to licensing dialog
    # Added Czech translation to licensing dialog
    # [issue 234] Correct the Number of days left in license by rounding up
    # do not trigger "news" unless min ver changes at least.
    #

  Version 3.17.1 - 16/07/2023
    # [issue 240] Regression (3.16) invalid HTML signature path can lead to problems in template 
    # [issue 242] Update "# licensed days left" at midnight.
    # [issue 244] Allow replaceText and deleteText to affect html that was imported using %file()%

#################################################

  Version 4.0b1 - 10/07/2023
    # [issue 213] Compatibity with Thunderbird 115 (ESR 2023/24)
    # - new browser action button (WIP)
    # - messageServiceFromURI moved to MailServices
    # deprecated {OS} for file reading.
    // OS.File.read => IOUtils.read
    // OS.Constants.Path.profileDir -> PathUtils.profileDir
    // OS.Path.* -> PathUtils.*
    // OS.File.writeAtomic -> IOUtils.writeUTF8
    // JSON.parse(CustomMenuData) -> JSON.parse(new TextDecoder().decode(CustomMenuData))
    # b1 [issue 240] Regression (3.16) invalid HTML signature path can lead to problems in template 
    # b1 [issue 243] Menu item / Option for reusing last external template (defaultTemplateMethod)
    # b1 [issue 244] Allow replaceText and deleteText to affect html that was imported using %file()%
    # - new browser action button (WIP)
    # - messageServiceFromURI moved to MailServices

  Version 4.0b2 - 12/07/2023
    # b2 [issue 227] Avoid error when smartTemplates.json file does not exist

  Version 4.0b3 - 16/07/2023
    # b3 [issue 247] Regression - saving template menus saves invalid smartTemplates.json file
    # b3 [issue 248] %recipient% uses the original "from" address when replying

  Version 4.0.2 - 25/07/2023
    # [issue 249] composer: open snippet / change template from file directly inserts nothing
    # If cardbook support is enabled but cardbook disabled this will also prevent fallback to std AB
    #   (cardbook fallback throws error)
    # fixed missing panels in Common settings if no account was selected  (e.g. when opening 
    #       the settings from Local Folders)
    # replace obsolete messageListener.onEndHeaders() code (which looked at the visbility of reply/forward buttons) 
    # with an notification that reacts to the message header change API - 
    # remove SmartTemplate4.messageListener
    # use the onMessageDisplayed API instead

    
  Version 4.1 - 09/08/2023
    # [issue 79] Inject contents of <head> tags into composer's head section, merge body attributes
    # Remove console error “receiving end does not exist” if Cardbook enabled but not installed
    # Slightly improved settings layout (long template list tended to push the bottom 
      buttons outside of the window)
    # [issue 252] ST 4.0.2 Cannot open license website (or any external website links)

  Version 4.2.1 - 25/09/2023
    # [issue 254] Made the button above email preview less obtrusive:
      Shortened the text for the message display action button - "SmartTemplates" 
      Added an option to remove the label when in icon+text mode.
    # Add "settings" item to bottom of SmartTemplates thread tools menu
    # [issue 256] Fixed: account template not loaded when changing From address

  Version 4.3.1 - 16/10/2023
    # [issue 263] List most recent external template actions on top level of SmartTemplates menus
    # [issue 262] Add accelerator keys for template menus (Write, Forward, Reply, Reply All and Reply to List)
    # [issue 264] Support reading %clipboard% with "text/plain" content 
    # [issue 265] Support <div type='cite'> for raising quote level in commands that have quote level parameters    
    # [issue 268] Make registration screen less tall / easily resizable

  Version 4.3.2 - 23/10/2023
    # [issue 269] Regression: Insert Snippet and Change template buttons were missing the menu item "Open template file..."
  
  Version 4.3.3 - 08/11/2023
    # [issue 271] Sometimes the header menu is empty - patchHeaderPane() fails - 
                  - increased default delay for patching message 
                  - keeping a reference to local WindowListener in message window
    # [issue 273] Loading accounts settings doesn't work
    # [issue 272] SmartTemplates ignored when creating an email from the Thunderbird taskbar context menu
    #             or when clicking a mailto link on a website. This should load the template of the default account.

  Version 4.4 - WIP
    # [issue 274] Add %preheader()% variable for injecting preview
    # [issue 275] Auto-Fill content for %to%, %recipient% and %from% when 
                  clicking Contact context menu "Compose Message To" or writing new mail
    # Added documentation for dateformat(fstring,toclipboard)
    # Add Alias to register dialog if already set in a license
    # [issue 239] Use correct %recipient% when replying to own email
    # [issue 246] Support for other.custom1, other.custom2 etc. from address book fields
    # [issue 257] Cardbook: Deferred variable (clicking on the pink "to(name)" field not pulling data from B intermittently
    # [issue 278] failure looking up Cardbook with mixed case - forced lowercase emails
    # [issue 267] Support for extracting prefix and suffix from address book fields
    # [issue 276] Removed FileUtils.getFile for future compatibility (122 beta)
    # Removed duplicate tooltip on active fields in write new mail
    # [issue 280] You can now use escaped commas within commands that search or replace strings
    # %replaceText% and %deleteText% now work on the body of the email when used from the Smart Fragments menu
    # Opening support sites in a tab is now using API method
    ---------
    # [issue 253] WIP - recreate menus using API functions


=========================
  KNOWN ISSUES / FUTURE FUNCTIONS
  Version 4.x - FUTURE VERSION / WIP
    # [issue 253] recreate menus using API functions
    # [issue ] 
    # [issue ] 
    # [issue ] 


    # New Idea: Add an account templates submenu - only for accounts with dedicated settings.

    # [issue 150] Remove "Nag Screens" in Composer for unlicensed users
    # [issue 27] Insert external HTML Templates from a web page URL
    # [issue 10] add %deliveryoptions% function to force Return Receipt.
    # The "clean up button" is not automatically installed in the composer toolbar.
    # ...
      
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
    isFileTemplate: false,
    isFragment: false,
    preHeader: null, // [issue 274]
    modifiedHeaders: [] // list of header vars that may have received new content; need to be updated in deferredVars
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
    flags.modifiedHeaders = [];
    flags.preHeader = null;
    flags.isFragment = false;
  } ,

  // -------------------------------------------------------------------
  // A handler to add template message
  // -------------------------------------------------------------------
  notifyComposeBodyReady: async function notifyComposeBodyReady(isChangeTemplate, win=null)  {
    const prefs = SmartTemplate4.Preferences,
          util = SmartTemplate4.Util,
          Ci = Components.interfaces,
          msgComposeType = Ci.nsIMsgCompType;
          
    if (SmartTemplate4.Preferences.isBackgroundParser()) { // [issue 184] - this should never be called if this flag is set
      alert("To do: replace notifyComposeBodyReady() event - [issue 184]\n");
      return;
    }          
          
    isChangeTemplate = isChangeTemplate || false; // we need this for [isue 29] change template in composer window
    // maybe use    GetCurrentEditor() and find out  stuff from there
    // get last opened 3pane window - but we really need the owner of the "write button"
    // we clicked. 
    // That window stores SmartTemplate4.fileTemplates.armedEntry
    // we need this to retrieve the file Template path and title!
    function getMsgComposetype() {
      switch(gMsgCompose.type) {
        case Ci.nsIMsgCompType.ForwardInline:
          return "fwd";
        case Ci.nsIMsgCompType.Reply:
          return "rsp";
      }
      return ""; // unknown
    }
    
    let ownerWin = win || util.Mail3PaneWindow, // for changing the template our current composer window is the context
        fileTemplateSource = null; // for fileTemplates, echeck if null and o.failed, otherwise o.HTML shoulde be the tempalte
    
    // check if a file template is active. we need to get the window from the originating event!
    let dbg = 'SmartTemplate4.notifyComposeBodyReady()',
        flags = this.PreprocessingFlags;
    this.initFlags(flags);
        
    // retrieve and consume fileTemplate info
    // I will be very cautious in case composer is called from elsewhere (e.g. a mailto link, or a single message window)

    let theQueue = ownerWin && ownerWin.SmartTemplate4 ? (ownerWin.SmartTemplate4.fileTemplates.armedQueue || []) : [],
        theFileTemplate = null;
    
    if (ownerWin && 
        ownerWin.SmartTemplate4 && 
        ownerWin.SmartTemplate4.fileTemplates && 
        ownerWin.SmartTemplate4.fileTemplates.armedEntry) {
      theFileTemplate = ownerWin.SmartTemplate4.fileTemplates.armedEntry;
      // to avoid event triggering while we stream the message, postpone this one!
      if (SmartTemplate4.isStreamingMsg) {
        setTimeout(function () { SmartTemplate4.notifyComposeBodyReady(isChangeTemplate, win);}, 100);
        return;
      }      
    } else if (theQueue.length) {
      util.logDebugOptional("fileTemplates", "Queued templates found", theQueue);
      let origUri = gMsgCompose.originalMsgURI;
      // try to find matching item from the queue
      let found = theQueue.find(el => el.uri == origUri && el.composeType == getMsgComposetype());
      if (found) {
        theFileTemplate = found;
        theQueue = theQueue.filter(el => el != found);
        util.logDebugOptional("fileTemplates", "found match, filtered queue:", theQueue);
      }
      else {
        theFileTemplate = theQueue.pop(); // if we can't find, let's take the last item instead and hope for the best.
      }
      ownerWin.SmartTemplate4.fileTemplates.armedQueue = theQueue; // store depleted queue back!
      util.logDebugOptional("fileTemplates", "Found FileTemplate:", theFileTemplate, ownerWin.SmartTemplate4.fileTemplates.armedQueue);
    }

    // reuse last template for this specific composeType. [issue 243]
    if (!theFileTemplate && prefs.getMyIntPref("defaultTemplateMethod")==2) {
      // reuse last external template!
      let composeType = "";
      if (!this.smartTemplate.composeCase) {
        composeType =  this.smartTemplate.setComposeCase(gMsgCompose.type);
      }
      try {
        let setting = "fileTemplates.mru." + composeType;
        switch(composeType) {
          case "new":
            theFileTemplate = JSON.parse(SmartTemplate4.Preferences.getStringPref(setting)); 
            break;
          case "rsp":
            theFileTemplate = JSON.parse(SmartTemplate4.Preferences.getStringPref(setting)); 
            break;
          case "fwd":
            theFileTemplate = JSON.parse(SmartTemplate4.Preferences.getStringPref(setting)); 
            break;
        }
        if (theFileTemplate) {
          util.logHighlight(`Found previous FileTemplate: `, "yellow", "rgb(0,80,0)", theFileTemplate);
        }
      }
      catch(ex) {
        util.logHighlight(`Could not retrieve previous file template for composeType ${composeType}`, "yellow", "rgb(0,80,0)");
      }
    }
    
    if (theFileTemplate) {
      // [issue 173]
      if (theFileTemplate.isAutoSend) {
        flags.isAutoSend = true; 
      }
      
      ownerWin.SmartTemplate4.fileTemplates.armedEntry = null; 
      util.logDebugOptional("fileTemplates", "notifyComposeBodyReady: \n"
        + "Consuming fileTemplate: " + theFileTemplate.label + "\n"
        + "composeType:" + theFileTemplate.composeType + "\n"
        + "path:" + theFileTemplate.path);
        
      // composer context:
      fileTemplateSource = SmartTemplate4.fileTemplates.retrieveTemplate(theFileTemplate);
      if (fileTemplateSource.failed) {
        let text = util.getBundleString("st.fileTemplates.error.filePath");
          
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
        util.logDebugOptional("fileTemplates", `notifyComposeBodyReady: Add file to template stack: ${theFileTemplate.path}`);
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
              w1 = util.getBundleString("st.notification.editedChangeWarning"),
              q1 = util.getBundleString("st.notification.editedChangeChallenge");            
          SmartTemplate4.Message.display(
            w1.replace("{0}", fileTemplateSource.label) + "\n" + q1, 
            "centerscreen,titlebar,modal,dialog",
            { ok: function() { ; },
              cancel: function() { cancelled = true; }
            } , win
          );    
          if (cancelled) {
            let popped = flags.filePaths.pop();
            util.logDebugOptional("fileTemplates", `notifyComposeBodyReady: [cancelled] Removed file from template stack: ${popped}`);
            return;
          }
        }
        flags.isChangeTemplate = isChangeTemplate;
        await this.smartTemplate.insertTemplate(isStartup, flags, fileTemplateSource); // if a Tb template is opened, process without removal
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
      var { AppConstants } = ChromeUtils.import("resource://gre/modules/AppConstants.jsm");
      var messageEditorID;
      if (parseInt(AppConstants.MOZ_APP_VERSION, 10) < 100) {
        messageEditorID = "content-frame";
      } else {
        messageEditorID = "messageEditor";
      }
      
      
      // if we load a template ST4 processing will have been done before the template was saved.
      // composeCase is set during insertTemplate
      switch (this.smartTemplate.composeCase) {
        case 'tbtemplate':
        case 'new': // includes msgComposeType.Template and msgComposeType.MailToUrl
        case 'forward':
          if (gMsgCompose.type == msgComposeType.MailToUrl) // this would have the to address already set
            FocusId = messageEditorID; // Editor
          else {
            FocusId = messageEditorID; // editor is fallback
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
          FocusId = messageEditorID; // Editor
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
  loadIdentity: async function (options = {}) {
    const prefs = SmartTemplate4.Preferences,
          util = SmartTemplate4.Util;    
    let isTemplateProcessed = false;
    let isChangeFromViaSmartTemplate = false;
    if (typeof options.setFromHeader != "undefined" && options.setFromHeader) {
      isChangeFromViaSmartTemplate = true;
    }
    SmartTemplate4.Util.logDebugOptional("functions","SmartTemplate4.loadIdentity()");
    SmartTemplate4.Util.logHighlight("loadIdentity()", "yellow", "rgb(0,80,0)");
    {
      let isBodyModified = gMsgCompose.bodyModified,
          composeType = util.getComposeType();

      let newSig;
      // change identity on an existing message:
      // Check body modified or not
      // we can only reliable roll back the previous template and insert
      // a new one if the user did not start composing yet (otherwise danger
      // of removing newly composed content)
      // note I used (!isBodyModified) but this lies in Thunderbird 115 !!
      // LoadIdentity(), before calling compose-from-changed, sets gMsgCompose.identity, 
      // which _always_ toggles the flag to true temporarily, so we cannot rely on it being correct.
      let isOverrideBodyModified = false;
      if (isBodyModified) {
        let question = util.getBundleString("st.notification.bodyModified"),
            detail,
            instructions = util.getBundleString("st.notification.bodyModified.instructions");

        if (window.SmartTemplate4.CurrentTemplate) {
          let templateName = window.SmartTemplate4.CurrentTemplate.label || window.SmartTemplate4.CurrentTemplate.path;
          detail = util.getBundleString("st.notification.bodyModified.externalTemplate", [templateName]);
        } else {
          detail = util.getBundleString("st.notification.bodyModified.accountTemplate");
        }
            
        isOverrideBodyModified = confirm( question + "\n" + detail + "\n\n" + instructions);
      }
      
      if ( !isChangeFromViaSmartTemplate &&               // don't trigger a tempalte reload in case header.set(from) was called!!
          (!isBodyModified || isOverrideBodyModified)) {  // ask user it isBodyModified is really true...
        // [issue 51]
        // this.original_LoadIdentity(false); // make sure Tb does everything it needs to the from header!
        // Add template message - will also remove previous template and quoteHeader.
        if (window.SmartTemplate4.CurrentTemplate) {
          //[issue 64] reload the same template if it was remembered.
          let fileTemplateSource = SmartTemplate4.fileTemplates.retrieveTemplate(window.SmartTemplate4.CurrentTemplate);
          if (fileTemplateSource.failed) { // shouldn't actually happen as we just loaded it before
            let text = util.getBundleString("st.fileTemplates.error.filePath");
            alert(text); 
          }
          else {
            if (isOverrideBodyModified)  {
              window.SmartTemplate4.PreprocessingFlags.identitySwitched = true
            }
            await this.smartTemplate.insertTemplate(false, window.SmartTemplate4.PreprocessingFlags, fileTemplateSource);
          }
        }
        else {
          await this.smartTemplate.insertTemplate(false);
        }
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
          newSig = await this.smartTemplate.extractSignature(gMsgCompose.identity, false, composeType);
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
        // this.original_LoadIdentity(startup);
        // try replacing the (unprocessed) signature that Thunderbird has inserted.
        if (prefs.getMyBoolPref('parseSignature') && newSig ) {
          // find and replace signature node.
          let sigNode = util.findChildNode(SmartTemplate4.composer.body, 'moz-signature');
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
    // let prevIdentity = gCurrentIdentity;
    // let isBackgroundParser = SmartTemplate4.Preferences.isBackgroundParser(); // [issue 184]

    // http://mxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#3998
    SmartTemplate4.Util.logDebug('SmartTemplate4.init()');
    
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
        if (SmartTemplate4.Preferences.getMyBoolPref("hasNews")) {
          btn.classList.add("newsflash"); // this should have precedence over other settings!
          btn.classList.add('always');
          return;
        }
        
        if (licenseInfo.licenseKey) {
          let days = licenseInfo.licensedDaysLeft,
              wrn = null;
          if (licenseInfo.isExpired)  {
            wrn =  util.getBundleString("licenseStatus.expired", [licenseInfo.expiredDays]);
            btn.classList.add("alertExpired");
          }
          else if (days<15) {
            wrn = util.getBundleString("licenseStatus.willExpire", [days]);
            btn.classList.add("alert");
          }
          if (wrn) {
            btn.label = wrn;
            isVisible = true;
            labelMode = 2;
          }
          else {
            if (licenseInfo.keyType==2) {
              btn.label = "SmartTemplates";
            } else {
              btn.label = "SmartTemplates Pro";
            }
          }
        }
        else {
          btn.label = "SmartTemplates";
        }
        btn.setAttribute("collapsed", !isVisible);
        
        switch(labelMode) {
          case 0:
            btn.classList.add('labelHidden');
            break;
          case 1:
            //NOP;
            break;
          case 2:
            btn.classList.add('always');
            break;
        }
        util.logDebugOptional("functions",
          `SmartTemplate4Messenger btn.className = ${btn.className} , collapsed = ${btn.getAttribute("collapsed")}`);    
      }
      else {
        util.logDebugOptional("functions","SmartTemplate4.updateStatusBar() - button SmartTemplate4Messenger not found in " + doc);
      }
    }
    catch(ex) {
      util.logException("SmartTemplate4.updateStatusBar() failed ", ex);
    }
  } ,

  // all main window elements that change depending on license status 
  initLicensedUI: function ST_initLicensedUI() {
    SmartTemplate4.Util.logDebug("initLicensedUI()", SmartTemplate4.Util.licenseInfo);
    SmartTemplate4.updateStatusBar();
    SmartTemplate4.updateNewsLabels();
  },

  startUp: function ST_startUp() {
    const util = SmartTemplate4.Util;
    // let v = util.VersionProxy();

    //  a hack for the status bar icon: 
    window.setTimeout(function() {
      if (window.document.URL.endsWith("messenger.xhtml"))
          window.SmartTemplate4.updateStatusBar("default");
    }, 2000);
    
    SmartTemplate4.Util.notifyTools.notifyBackground({ func: "updateNewsLabels"}); // initialize new-related buttons in case there was an ignored update!
    util.logDebug("startUp complete");
  } ,
  
  shutDown: function (isMainWindow = false) {
    const util = SmartTemplate4.Util;    
    util.logDebug("Remove added custom UI elements …");
    let elements = Array.from(window.document.querySelectorAll('[st4uiElement]'));
    for (let element of elements) {
      element.remove();
    }
    SmartTemplate4.fileTemplates.tabConfigured = false;

    util.logDebug("shutDown complete");
  } ,
  
  signatureDelimiter:  '-- <br>',
  
  // show news on update
  updateNewsLabels: function() {
    const util  = SmartTemplate4.Util,
          licenseInfo = SmartTemplate4.Util.licenseInfo;
    let hasNews = SmartTemplate4.Preferences.getMyBoolPref("hasNews"),
        btn = document.getElementById("SmartTemplate4Button"),
        btnStatus = document.getElementById("SmartTemplate4Messenger"),
        isVisible = false;
    // for styling button parent background image
    //   in  Tb115 we need to add the class to the parent <div class="live-content">!
    function addClass(element, c) {
      element.classList.add(c);
      element.parentElement.classList.add(c)
    }
    function removeClass(element, c) {
      element.classList.remove(c);
      element.parentElement.classList.remove(c);
    }    

    if (btn) {
      let txt = "",
          tooltip = "";

      if (licenseInfo.licenseKey) {
        let days = licenseInfo.licensedDaysLeft,
            wrn = null;
        if (licenseInfo.status == "Invalid") {
          addClass(btn, "expired");
          wrn = util.getBundleString("SmartTemplateMainButton.invalid");
        } else if (licenseInfo.isExpired)  {
          wrn = util.getBundleString("SmartTemplateMainButton.expired");
          addClass(btn, "expired");
          removeClass(btn, "renew");
          tooltip = SmartTemplate4.Util.getBundleString("licenseStatus.expired", [licenseInfo.expiredDays]);
        }
        else if (days<15) {
          wrn = util.getBundleString("SmartTemplateMainButton.renew", [days]);
          removeClass(btn, "expired");
          addClass(btn, "renew");
          tooltip = SmartTemplate4.Util.getBundleString("st.menu.license.tooltip", ["SmartTemplates"]);          
        }
        else {
          removeClass(btn, "expired");
          removeClass(btn, "renew");
        }
        if (wrn) {
          txt = wrn;
        }
      }

      if (hasNews) {
        txt = util.getBundleString("SmartTemplateMainButton.updated");
        addClass(btn, "newsflash");
        tooltip = util.getBundleString("st.menu.update.tooltip", ["SmartTemplates"]);
        btnStatus.classList.add("newsflash");
      }
      else {
        removeClass(btn, "newsflash");
        btnStatus.classList.remove("newsflash");
      }
      if (!txt) {
        txt = util.getBundleString("smartTemplate4.settings.label");
        btnStatus.classList.remove("newsflash");
      }

      // uses browser.browserAction.setTitle() 
      SmartTemplate4.Util.notifyTools.notifyBackground({ func: "setActionTip", text: tooltip });
      
      // used browser.browserAction.setLabel() 
      SmartTemplate4.Util.notifyTools.notifyBackground({ func: "setActionLabel", text: txt });

    }
  } ,

  get XML_replyMenus() {
    return `
      <menu label="__MSG_pref_rsp.tab__" id="smartTemplates-reply-menu" class="menu-iconic" controller="cmd_reply" accesskey="__MSG_st.menuaccess.reply__">
        <menupopup>
          <menuitem id="smartTemplates-reply-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-rsp st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
          <menuitem id="smartTemplates-reply-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        </menupopup>
      </menu>
      <menu label="__MSG_st.menu.replyAll__" id="smartTemplates-reply-all-menu" class="menu-iconic" controller="cmd_replyAll" accesskey="__MSG_st.menuaccess.replyAll__">
        <menupopup>
          <menuitem id="smartTemplates-reply-all-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-rsp st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
          <menuitem id="smartTemplates-reply-all-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        </menupopup>
      </menu>
      <menu label="__MSG_st.menu.replyList__" id="smartTemplates-reply-list-menu" class="menu-iconic" controller="cmd_replyList" accesskey="__MSG_st.menuaccess.replyList__">
        <menupopup>
          <menuitem id="smartTemplates-reply-list-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-rsp st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
          <menuitem id="smartTemplates-reply-list-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        </menupopup>
      </menu>
    `;
  },

  get XML_forwardMenus() {
    return `
            <menu label="__MSG_pref_fwd.tab__" id="smartTemplates-forward-menu" class="menu-iconic" controller="cmd_forward"  accesskey="__MSG_st.menuaccess.forward__">
              <menupopup>
                <menuitem id="smartTemplates-forward-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-fwd st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
                <menuitem id="smartTemplates-forward-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
              </menupopup>
            </menu>
    `;
  },

  get XML_toggleLabelMenu() {
    let isDisabled = 
      window.SmartTemplate4.Preferences.getMyBoolPref("toolbar.hideLabel") ? `checked="true"` : "";
    return `
      <menuitem id="smartTemplates-toggle-label" label="__MSG_st.menu.hideLabel__" class="menuitem-iconic st-toggle-label" oncommand="window.SmartTemplate4.doCommand(this);" type="checkbox" ${isDisabled} onclick="event.stopPropagation();" />
    `
  },

  moveMenuItems: function (toolbarButton, newPopupSelector) {
    let activePopup = toolbarButton.querySelector("menupopup[data-action-menu]");
    let newPopup = toolbarButton.querySelector(newPopupSelector);

    if (newPopup) {
      let moveNodes = [];
      for (let e of newPopup.childNodes) {
        moveNodes.push(e);
      }
      for (let m of moveNodes) {
        activePopup.appendChild(m);
      }
      SmartTemplate4.Util.logDebug("Moved elements to popup:", moveNodes);
      newPopup.remove();
      return true;
    } else {
      SmartTemplate4.Util.logDebug(`patchHeaderPane() - didn't find ${newPopupSelector}, so I couldn't patch the popup menu`);
      console.log(toolbarButton);
    }
  },  

  patchUnifiedToolbar: function() {
    // THUNDERBIRD 115
    // fix selectors
    let mainButton = document.querySelector("button[extension='smarttemplate4@thunderbird.extension']");
    if (!mainButton) {
      return false; // no button found, we're probably in a content tab
    }

    mainButton.id = "SmartTemplate4Button";
    // mainButton.setAttribute("popup", "smartTemplatesMainPopup");

    if (mainButton.querySelector("#smartTemplates-reply-menu")) {
      return true; // this one is already patched.
    }
    
    // this method worked in quickFilters:
    // overload the menupopup based on the id we just added:
    // note: there is no command controller for write new
    //       - instead the menu item calls "MsgNewMessage(null);
    //        <button id="SmartTemplate4Button">
    //        </button>

    var XHTML_Markup =     
`<vbox id="titlebar">
  <div id="smartTemplatesMainPopup" style="display:none;">
    <menuitem id="smartTemplates-checklicense" label="__MSG_st.menu.license__" class="menuitem-iconic checkLicense marching-ants" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
    <menu label="__MSG_pref_new.tab__"  id="smartTemplates-write-menu" class="menu-iconic" controller="cmd_newMessage" accesskey="__MSG_st.menuaccess.write__">
      <menupopup>
        <menuitem id="smartTemplates-write-last" label="__MSG_st.menu.template.last__" class="menuitem-iconic st-last-new st-mru" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-write-default" label="__MSG_st.menu.template.default__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </menupopup>
    </menu>
    ${this.XML_replyMenus}
    ${this.XML_forwardMenus}
    <menuitem id="smartTemplates-news" label="__MSG_newsHead__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
    <menuitem id="smartTemplates-settings" label="__MSG_pref_dialog.title__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>

    <menu id="smartTemplates-docs" label="__MSG_st.menu.docs__" class="menu-iconic">
      <menupopup>
        <menuitem id="smartTemplates-support" label="__MSG_st.menu.supportSite__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-variables" label="__MSG_st.menu.docs.variables__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-premium" label="__MSG_st.menu.docs.premium__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </menupopup>
    </menu>

    <menu id="smartTemplates-tests" label="Test" class="menu-iconic">
      <menupopup>
        <menuitem id="smartTemplates-settings-new" label="__MSG_pref_dialog.title__ (NEW)" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-headerMenuAPI" label="API Header Menu" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-MruMenuAPI" label="Update API MRU" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-patchHeaderTools" label="Patch Header Menu (legacy)" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-installed" label="Splashscreen - After Installation" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-templatemenus" label="Update Template Menus!" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-mru-save" label="Save MRU list" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-mru-load" label="Load MRU list" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-labelUpdate" label="Update Button labels" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
        <menuitem id="smartTemplates-registration" label="License Screen" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </menupopup>
    </menu>

  </div>
</vbox>`; 

    this.WL.injectElements(XHTML_Markup);
    let theMenu = window.document.querySelector("div#smartTemplatesMainPopup");
    if (theMenu) {
      mainButton.appendChild(theMenu);
      this.moveMenuItems(mainButton, "#smartTemplatesMainPopup");
      return true;
    }
    return false;
  },

  patchHeaderPane: function(doc, message_display_action_btn) {
    const PatchedBtnClass = "SmartTemplates_HeaderBtn"; // use this for styles & as flag for having been patched
    const isDebug = SmartTemplate4.Preferences.isDebugOption("fileTemplates.menus");
    if (isDebug) {
      SmartTemplate4.Util.logDebugOptional("fileTemplates.menus",
        "Patching Header Pane for document", doc);
    }
    if (!doc) {
      doc = this.Util.documentMessageBrowser;
    }
    if (!message_display_action_btn) {
      message_display_action_btn = doc.querySelector("#smarttemplate4_thunderbird_extension-messageDisplayAction-toolbarbutton");
    }
    if (!message_display_action_btn) {
      SmartTemplate4.Util.logDebugOptional("fileTemplates.menus","Couldn't find message display action button. aborting patchHeaderPane()");
      return false; // button not found
    }
    if (message_display_action_btn.classList.contains(PatchedBtnClass)
        && 
        message_display_action_btn.querySelector("menupopup[data-action-menu] #smartTemplates-reply-menu")) {
      SmartTemplate4.Util.logDebugOptional("fileTemplates.menus","Header button is already patched. aborting patchHeaderPane()", message_display_action_btn);
      return true; // already patched
    }
    // data-extensionid="smarttemplate4@thunderbird.extension"

    var XHTML_Markup = 
    `<toolbarbutton id="${message_display_action_btn.id}">
      <div id="SmartTemplates_HeaderMenu" style="display:none;">
        ${this.XML_replyMenus}
        ${this.XML_forwardMenus}
        ${this.XML_toggleLabelMenu}
        <menuseparator class="st4templateSeparator"/>
        <menuitem id="smartTemplates-settings" label="__MSG_pref_dialog.title__" class="menuitem-iconic" oncommand="window.SmartTemplate4.doCommand(this);"  onclick="event.stopPropagation();"/>
      </div>
    </toolbarbutton>
    `; 
    var WL = doc.ownerGlobal?.SmartTemplate4_WLM || this.WL;
    SmartTemplate4.Util.logDebugOptional("fileTemplates.menus","window loader injecting...", {XHTML_Markup});
    WL.injectElements(XHTML_Markup);
    message_display_action_btn.classList.add(PatchedBtnClass);

    SmartTemplate4.moveMenuItems(message_display_action_btn, "#SmartTemplates_HeaderMenu");
  },

  // prepare the popup menu of header area.
  clearActionMenu: function() {
    let doc = SmartTemplate4.Util.getMessageBrowserDocument();
    let message_display_action_btn = doc.querySelector("#smarttemplate4_thunderbird_extension-messageDisplayAction-toolbarbutton");
    if (!message_display_action_btn) return;
    let menuitems = [...message_display_action_btn.querySelector("menupopup[data-action-menu]").childNodes];
    if (!menuitems) return;
    // remove menus, menuitems and separators:
    let nodes = menuitems.filter((e)=> e.tagName.startsWith("menu"));
    for (let n of nodes) {
      // only popups first
      // if (!n?.id.startsWith("smartTemplates-")) continue;
      // if (!(n.id.includes("-write") || n.id.includes("-reply") || n.id.includes("-forward"))) continue;
      n.remove();
    }
  },

  clearMenu_MRU: function() {

  },
  
  TabEventListeners: {}, // make a map of tab event listeners
  addTabEventListener : function() {
    try {
      let tabContainer = SmartTemplate4.Util.tabContainer;
      this.TabEventListeners["TabSelect"] = function(event) { SmartTemplate4.TabListener.selectTab(event); }
      this.TabEventListeners["TabOpen"] = function(event) { SmartTemplate4.TabListener.openTab(event); }
      for (let key in this.TabEventListeners) {
        tabContainer.addEventListener(key, this.TabEventListeners[key], false);
      }
    }
    catch (e) {
      Services.console.logStringMessage("SmartTemplates: No tabContainer available! ", e);
      SmartTemplate4._tabContainer = null;
    }
  } ,
  removeTabEventListener: function() {
    // this might not be necessary, as we iterate ALL event listeners when add-on shuts down 
    // (see "undo monkey patch" in qFi-messenger.js)
    let tabContainer = SmartTemplate4.Util.tabContainer;
    for (let key in this.TabEventListeners) {
      tabContainer.removeEventListener(key, this.TabEventListeners[key]);
    }
  },
  TabListener: {
    selectTab: async function(evt) {
      const isMailPane = SmartTemplate4.Util.isTabMode (evt.detail.tabInfo, "mail");
      if (isMailPane) {
        const HEADERBARID = "smarttemplate4_thunderbird_extension-messageDisplayAction-toolbarbutton";
        let result = await SmartTemplate4.Util.notifyTools.notifyBackground({func: "patchUnifiedToolbar"});
        await SmartTemplate4.fileTemplates.initMenus(true, {toolbarType:"unified"});
        let doc;
        let currentTabMode = SmartTemplate4.Util.getTabMode(gTabmail.selectedTab);
        switch(currentTabMode) { // there are tab modes that have no access to document3pane! e.g. contentTab
          case "mailMessageTab":
            doc = SmartTemplate4.Util.document3pane;
            break;
          case "mail3PaneTab":
            let browser = SmartTemplate4.Util.document3pane.getElementById("messageBrowser");
            doc = browser.contentDocument;  
            break;
        }        
        if (doc) {
          let headerButton = doc.getElementById(HEADERBARID);
          if (SmartTemplate4.patchHeaderPane(doc, headerButton)) {
            await SmartTemplate4.fileTemplates.initMenus(true, {toolbarType:"messageheader"});
          }
        }
      }
    },
    openTab: function(evt) {
      function getTabDebugInfo(tab) {
        return `[ mode = ${tab.mode.name}, title = ${tab.title}, tabId = ${tab.tabId} ]`;
      }
      let tabmail = document.getElementById("tabmail");
      const newTabInfo = tabmail.tabInfo.find(e => e == evt.detail.tabInfo);
      const RETRY_DELAY = 2500;
      if (newTabInfo) {
        const isMailPane = SmartTemplate4.Util.isTabMode (newTabInfo, "mail");
        // patching the toolbar may be not necessary in this case (?)
        // as I believe we cannot open a new mail in tab unless
        // we are already on a mail / folder tab.
        /*
        if (isMailPane) {
          SmartTemplate4.Util.notifyTools.notifyBackground({func: "patchUnifiedToolbar"});
        }
        */
  
        if (newTabInfo.SmartTemplates_patched) {
          SmartTemplate4.Util.logDebug("Tab is already patched: " + getTabDebugInfo(newTabInfo));
          return;
        }
        if (isMailPane) {  // let's include single message tabs, let's see what happens
          try {
            if (typeof newTabInfo.chromeBrowser.contentWindow.commandController == "undefined") {
              SmartTemplate4.Util.logDebug("commandController not defined, retrying later..." + getTabDebugInfo(newTabInfo));
              setTimeout(() => { 
                SmartTemplate4.TabListener.openTab(evt); 
                }, 
                RETRY_DELAY);
              return;
            }
          }
          catch(ex) {
            SmartTemplate4.Util.logException("Patching failed", ex);
            return;
          }
  
          newTabInfo.SmartTemplates_patched = true;
          SmartTemplate4.Util.logDebug("new Tab patched successfully.");
        }
      }
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
      this.bundle = Services.strings.createBundle(bundleUri + "/calender.properties");
    },
    
    // the following functions retrieve strings from our own language packs (languages supported by SmartTemplate itself)
    // these will affect the following variables: %A% %a% %B% %b% (week days and months)
    // OTOH: %dateshort% and %datelocal% extract their names from the language packs installed
    dayName: function dayName(n){ 
      return this.bundle.GetStringFromName("day." + (n + 1) + ".name");
    },
    
    shortDayName: function shortDayName(n) { 
      return this.bundle.GetStringFromName("day." + (n + 1) + ".short");
    },
    
    monthName: function monthName(n){ 
      return this.bundle.GetStringFromName("month." + (n + 1) + ".name");
    },
    
    shortMonthName: function shortMonthName(n) { 
      return this.bundle.GetStringFromName("month." + (n + 1) + ".short");
    }
};   // SmartTemplate4.calendar 
  
