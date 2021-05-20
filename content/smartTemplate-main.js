"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK 
*/


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
          Some users reported that SmartTemplates was not using the custom date format they had set in their operating system.
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
    #  SmartTemplates no longer crashes when variables are used incorrectly; an error is logged to the Error Console.
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
    # Redesigned About Window (Add-On Manager &#8658; rightclick on SmartTemplates &#8658; About)
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
      	
  Version 0.9.3 - 31/07/2013
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

  Version 0.9.4 - 15/09/2013 
	  # Fixed [Bug 25523] Cannot use image as signature
		# Fixed [Bug 25526] if no Signature is defined, %sig% is not removed
		# Fixed: Background images in new / reply / forward tabs did not show up in groupbox on default theme in Windows
		# test option for not loading / showing examples tab
		# Reopened and Fixed [Bug 25088] by making status bar icon status more resilient
		# Fixed %subject% removing expressions in <brackets>
		
  Version 0.9.5 -	21/04/2014
	  # improved locale matching (allow matching en as en-US etc.)
		# [Bug 25571]  "replace line breaks with <br>" on when not enabled
		# Make sure that debug settings window stays on top
		# added UI for disabling space for %cursor%
    # Advanced Tab in options dialog
		# [Bug 25676] JavaScript parser added by Benito van der Zander
		# [Bug 25710] <div id=smartTemplate4-template> is inserted in Stationery body
    # [Bug 25643] Display Names from Address book
    # option: Capitalize Names
    # option: Nickname instead of First
    # Improved parsing of timezone string (remove brackets)
    # Fixed [Bug 25191] conflict with add-on Account Colors
    # Fixed a problem with name matching signature files - 
      depending on file name some textual signatures might be accidentally treated as images.
    # Fixed reading plain text signature files (linefeeds where lost) by inserting html line breaks
      to disable this behavior toggle extensions.smartTemplate4.signature.replaceLF.plaintext.br in about:config

  Version 0.9.5.1 - 24/04/2014
    # Fixed minver for SeaMonkey

  Version 0.9.5.2 - 08/05/2014
    # Fixed [Bug 25762] related to Replace Names from Addressbook (LDAP). Also disabled this feature on Postbox.
    
  Version 0.9.6 - 04/10/2014
    # Added a switch for removing emails when replacing Names from Address book
    # Added format %sig(none)% to completely suppress signature
    # [Bug 25089] (reopened) default quote header wasn't removed anymore in Tb 31.0
    # [Bug 25816] Missing names in reply caused by different Encodings - the Mime decoder fails when multiple addresses with varying encodings are contained
    # [Bug 25089] Default forward quote not hidden
    # variable %matchTextFromBody()% to find and replace pattern e.g. %matchTextFromBody(TEST *)% will retrieve '123' from 'TEST 123'
    
  Version 1.0 - 24/05/2015
  Features
    # [Bug 25871] %file()% - insert html, text or image from file (for customized signatures)
                  use a local file path in order to insert a file from the computer you are sending from
                  %file(fileName)%
                  %file(fileName,encoding)%
                  If the encoding parameter is omitted, we assume UTF-8 (recommended)
                  %file(imageName,altText)%
                  The optional altText is displayed at the recipient if the image cannot be displayed. It may not contain the characters ,)(><
                  
    # [Bug 25902], [Bug 26020] To support multiple mail addresses with more flexibility
                   bracketMail(arg) - use  within from() to() cc() etc. to "wrap" mail address with non-standard characters
                   bracketName(arg) - same using "name portion"
            usage: bracketMail(startDel;endDel)  startDel = characters before the mail portion 
                                                 endDel = characters after the mail portion
                                                 e.g. bracketMail(";")  not allowed are:  ; , < > ( ) [ ]
                   bracketMail()        =  <mail@domain.com>
                   bracketMail(angle)   =  <mail@domain.com>
                   bracketMail(round)   =  (mail@domain.com)
                   bracketMail(square)  =  [mail@domain.com]
    
  Bugfixes
    # [Bug 25902] %from% and %to% fail if no argument is given - Added Improvements + Stability + better List support
    # [Bug 25903] In address fields Quotation marks are escaped: \"
    # Fixed: Capitalize Names doesn't work if string is quoted. Makes the whole string lowercase.
             Also words with Names in brackets now.
    # Fixed: getSignatureInner inserts "undefined" in Postbox if no signature is defined for current identity.
    # [Bug 25951] ST4 not working in SeaMonkey 2.32 - Temporal Deadzone - This was caused by some code changes in the
      Mozilla code base that established different rules for variables declared with "var" causing addons to break
      which have the same variable declared with let or var&let multiple times (in the same scope)
    # [Bug 25976] Reply to List: variables not resolved - Stationery Patch available
    # [Bug 26008] Inserting Template in Postbox may fail with "XPCOMUtils not defined"
    # [Bug 25089] Default forward quote not hidden - in Postbox "Fred wrote:" was not removed in plain text mode.
                  Set extensions.smartTemplate4.plainText.preserveTextNodes = true for roll back to previous behavior
    # [Bug 26013] ST4 picks template from common settings instead of identity (Tb38)
    # [Bug 25911] Spaces in long subject headers [Decoding Problem] - WIP
    # Postbox 4: fixed removal of quote header (author wrote:) which is in a plain <span>

  Version 1.1 - 30/08/2015
  Features  
    # [Bug 26043] Save Template / Load Template feature
    # [Bug 25904] Functions to Modify Mail Headers: To, Cc, Bcc, Subject and Others
    #             %header.set(name,value)%
    #             %header.append(name,value)%
    #             %header.prefix(name,value)%
    #             supported headers: subject, to, from, cc, bcc, reply-to 
    # Removed automatic suppression of "mailTo" links and added an option for activating it
    # Postbox 4 compatibility. Raised minimum Verion for Thunderbird to 9

  Version 1.2.1 - 20/04/2016
    # [Bug 26100] Double brackets not working with %cc(name,bracketMail(angle))%
    # [Bug 26159] %cursor% variable breaks paragraphs style
		# [Bug 26126] Unwanted space added after cursor
		# [Bug 26139] Fix position of warning message for variables not allowed in New Emails 
		# [Bug 26197] Thunderbird 45 - unwanted paragraph after quote header
		
	Version 1.3 - 11/07/2016  
	  # [Bug 26207] Add option to delimit address list with semicolons
		# [Bug 26208] Lastname and Firstname arguments omit part of the name when broken up - WIP
		# [Bug 26257] Default quote header not removed in complex Stationery
		# Force Replacing default quote header in Stationery even if no %quoteHeader% variable is contained
		# [Bug 26215] Bad interaction between SmartTemplates and "When using paragraph format, the enter key creates a new paragraph"
		# [Bug 26209] Add option to wrap name in double quotes if it contains commas - WIP
    # When clicking on a mailto link from a web browser with a given text body, this was overwritten by SmartTemplates
		  new behavior: bypass the SmartTemplates to avoid losing information from the web site. 
		# Added button to visit our Thunderbird Daily Youtube channel
		# Updated outdated links to language libraries from ftp to https
		# Release Video at: https://www.youtube.com/watch?v=xKh7FkU8A1w
	
	Version 1.3.1 - 23/09/2016
	  # [Bug 26261] Quote header not inserted in plain text mode
		# [Bug 26260] Browser's "EMail Link" feature doesn't copy link
		
		
  Version 1.4 - 22/01/2017
		# Postbox 5.0 compatibility
	  # Fixed: mailto links are missing signature
		# Extended %matchTextFromBody( )% function
		# New %matchTextFromSubject( )% function
		# Release video at: https://www.youtube.com/watch?v=u72yHAPNkZE
		
  Version 1.5 - 27/04/2018
	  # [Bug 26340] New "unmodified field" option for %To()%, %CC()% and %From()% %from(initial)% New initial keyword to avoid any changes of header; just displays the header as received.
	  # New: %header.set.matchFromSubject()% function to retrieve regex from subject line and set a (text) header
	  # New: %header.append.matchFromSubject()% function to retrieve regex from subject line and append to a (text) header
	  # New: %header.prefix.matchFromSubject()% function to retrieve regex from subject line and prefix to a (text) header
	  # New: %header.set.matchFromBody()% function to retrieve regex from email body and set a (text) header
	  # New: %header.append.matchFromBody()% function to retrieve regex from email body and append to a (text) header
	  # New: %header.prefix.matchFromBody()% function to retrieve regex from email body and prefix to a (text) header
		# New: %to(initial)% keyword to return unchanged address header
		# Fix: [Bug 25571] "replace line breaks with <br>" on when not enabled in Common settings
		# [Bug 26300] %cursor% leaves an unnecessary space character
    # [Bug 26345] Unexpected "Â" character in mail body
		# [Bug 26356] Thunderbird 52 - Forwarding an email inline adds empty paragraph on top
		# [Bug 26364] Inline Images are not shown
		# [Bug 26494] ESR 2018 readiness - Make SmartTemplates compatible with Tb 60
		# [Bug 26446] Thunderbird 57 hangs on start with SmartTemplates enabled 
		# [Bug 26483] Opening an .eml file SmartTemplates doesn't apply templates
		# Adding SmartTemplates Pro License
		# Thunderbird 57 deprecated nsILocaleService causing local date to fail
		# Thunderbird 57 deprecated nsIScriptableDateFormat causing most date functions (datelocal, dateshort) to dail [prTime2Str()]
		# Remember expanded / contracted status of setting dialog 
		# Close settings dialog when clicking on links in the support tab		
		
	Version 1.5.1 - 03/05/2018
	  # changed license to (CC BY-ND 4.0)
	  # [Bug 26518] Clicking on variables in the Variables Tab doesn't copy them
		# [Bug 26434] Forwarding email with embedded images removes images
		              (use insertFileLink? getFileAsDataURI? encodeURIComponent?)
									MsgComposeCommands uses loadBlockedImage() ?
	  # [Bug 26307] Extend dates variables with additional offset parameter for hours / minutes
		# [Bug 26465] Composer does not focus into body of mail
		
	Version 2.0 - 23/12/2018
		# [Bug 26494] ESR 2018 readiness - Make SmartTemplates compatible with Tb 60
	  # [Bug 26523] Remove extra <br> before blockquote if standard quote header is used.
		# [Bug 26524] %datelocal% and %dateshort% are broken in Tb 60
		# Completed various translations (ru, pl, nl, sr)
		# [Bug 26526] %file% causes rogue errors "The Variable %5C.. can not be used for new messages" when including images
		# [Bug 26551] Add Domain License key support for SmartTemplates Pro
		# [Bug 26552] %attach% Variable for attaching [pdf] files
		# Moved links from addons.mozilla.org to addons.thunderbird.net
		# Address Book: Added feature to replace firstname with Display Name if no first name is recorded.
		# Added Indonesian Locale - thanks to Mienz Louveinski (Babelzilla.org)
		# [Bug 26596] Make extracting Name from (parentheses) optional - extensions.smartTemplate4.names.guessFromMail
		# [Bug 26595] Option to disable guessing Name Part
		# [Bug 26597] Add ?? operator to make parts of address header arguments optional, e.g. %from(name,??mail)%
		# Added option for default address variable format
		# [Bug 24993]</a> Premium Feature: Added support for using the following fields when composing a *new* Email:%subject% %from% %to% %cc% %bcc% %date% %dateformat()%
		
	Version 2.1 - 28/07/2019
	  # [Bug 26536] Support using SmartTemplates variables in Thunderbird Templates (Tb 60)
		# [Bug 26634] header.*.matchFrom* functions: append/prepend arbitrary text to field based on match.
		# [Bug 26677] %header.set.matchFromBody()% improvements for use with subject line.
		# [Bug 26629] %X:=timezone()% switch to set a specific time zone with date variables
		# [Bug 26626] "Edit As New" duplicates email content unless Stationery is installed
		# [Bug 26627] Signature was always removed when creating message from templates.
		# [Bug 26628] %dateshort% and %datelocal% omit time portion
		# [Bug 26632] Using %dateformat% in reply / forward: deferred fields are not automatically tidied up
		# [Bug 26635] Cursor when writing/forwarding not placed in "To:" Row 
		# %attach% command defaults to only append HTML files - should accept all file types.
		# Removed display of donate page on update.
		# Remember path for file picker when saving / loading templates
		# [Bug 26667] ESR 2019 Readyness - make SmartTemplates compatible with Thunderbird 68
		# Added mandatory Standard license	

	Version 2.1.1 - 03/08/2019
		# Some improvements with panel sizing on preferences dialog
	  # Added Support Tab (licensed users only - these can now send an email directly) 
		# ESR - Eliminated getCharPref / setCharPref
		# in Tb 68, some account specific options (use HTML, replace BR) are greyed out 
		  when opening the dialog and  have to be reactivated by enabling / disabling 
			"Apply the following template"

	Version 2.2.2 - 13/08/2019
	  # [issue #5] 2.2.2 - Fixed %timezone% to subtract the offset hours rather than falsely add it.
		  also added CEDT and MESZ
		  https://github.com/RealRaven2000/SmartTemplate4/issues/4
		# [issue #4] Fixed locale problem. SmartTemplates due to a regression in 2.0 the current
		  locale of the mail client cannot be determind currectly.
			The %language()% switch works now better and gives more precise error messages
			in JavaScript console where needed.			
		# [issue #3] added formatting 2-digit switches (about:config) for %dateshort% and %datelocal%
		  dateformat.hour, dateformat.day, dateformat.month, dateformat.years
			(change strings from "numeric" to "2-digit")
		# [Bug 26688] Multiple %matchTextFromBody% in a line yielded only a single result
		# Backwards fixes for Thunderbird 52
		# Extended trial period from 14 days to 28 days.
		# Support using %X:=sent% modifier with %dateformat()% function when replying to / forwarding emails. 
		
	Version 2.3 - 16/09/2019
	  # [Bug 26689] Support setting priority with %header.set(priority,value)%
		# [issue 9] %header.set(from)% not working in Tb60.9
	  # Add file template function and management functions
		
	Version 2.3.1 - 20/09/2019		
	  # Improved handling of non-working Stationery Add-on in Thunderbird 68.
		# [issue 14] If Lightning is not installed in Thunderbird 68, the new "file templates" 
		  function will not load the template
		# [issue 15] file templates only work on an account if the box "Apply following template" 
		  is active

	Version 2.4.1 - 20/10/2019
    # [issue 16] in some cases, images in signature trigger the "blocked file" warning
      Improved image replacement with %file()% in signatures.
    # [issue 17] Add switch for Dictionary to change to a different language %spellcheck()%
    # [issue 19] file templates have unexpected line breaks, and contained images may break
      this can happen if option "replacing line breaks with <br>" is active
    # added count down if trial period is expired
    # fixed an issue with handling missing default identities (licenser would fail silently 
      rather than log an error in JS console)
      
	Version 2.4.2 - 28/10/2019
    # [issue 20] If a template file starts with UTF detection character "missing file" is wrongly displayed
    # Sandboxed Javascript (script blocks enclosed in %{%   %}%) implemented in [Bug 25676]
      stopped working in Thunderbird 68, due to the call to Cu.nukeSandbox failing... 
      for now, SmartTemplates allows using these again for versions smaller than 69
      
		
	Version 2.5 - 11/11/2019
    # Added switch for toggling automatic proofing; %spellcheck(off)% to disable, %spellcheck(on)% to enable
      To force switching and change to a different language do the toggle command first.
    # [issue 21] %spellcheck% sometimes doesn't remove red proofing lines after setting language
    # Improved UI on Template Files page for Stationery users:
      - removed irrelevant Save and Load buttons
      - added a (?) button which links to the Stationery help page
    # Completed some of the missing translations for new functionality in the Finnish, French, Czech, 
      Spanish, Italian, Polish and Swedish locales.
    # Extended error log for trouble shooting getFileAsDataURI
  
  
	Version 2.5.1 - 21/11/2019
    # Fix "cut off descriptions" bug in Linux 
    # Added "Silent updates" option
      
	Version 2.5.2 - 21/11/2019
    # [issue 22] Cannot add new recipients to address widget after modifiction through header.set
    # [issue 23] Settings dialog broken in Czech version. 
    

  Version 2.6 - 29/11/2019
    # [issue 7] Losing all text in compose window when changing identity / signature not updated correctly

    
  Version 2.7 - 09/01/2020
    # [issue 25] Set variables from addressbook fields
    # [issue 29] Add configuration item to file template menus.
    # Added an optional 3rd parameter to %matchTextFromBody()% - insert string when no match is found
    
  Version 2.8 - 24/01/2019
    # [issue 31] New functions to remove text / tags from quoted parts
    # The template editor boxes now resize vertically with dialog for easier editing
    # new variable for including mailto body text in template
    # Variables window: Added documentation for address book functions window and slightly modernised layout.
    # [issue 35] extended %identity% with the variable 'addressbook' in order to pull extended info
      from the AB based on an email match
    # completed translations for locales: cs, es-ES, fi, it, pl,pt-BR, ru, sl, sv-SE
    # added international examples for %dateformat% in the variables tab
    
    # [issue 32] Fixed: Single Message window header buttons missing file template dropdowns
    # [Bug 26755],[issue 30] reply button has no template list if reply add is enabled by default.
    # when AB replacement is enabled, allow displayname to be a single word.
    # [issue 38] Images with encoded file URLs are not loaded correctly
    
  Version 2.9 - 11/02/2020
    # [issue 45] Support using %file()% with relative paths and nesting %file()% within a template.
    # [issue 48] Support [[optional double brackets]] syntax for all extended address book fields
    # Remember the last path separately for opening templates from the menu directly
    --
    # [issue 41] No file template menus in single message window
    # [issue 42] The (lastname) switch uses first name from AB if only single name is matched from received address.
    # [issue 43] %file(template)% doesn't work on Mac for paths that start with "/user". 
    # Fixed: Do not run cleanupDeferredFields() on quoted elements
    # Remove double quote from alt attribute in %file(image,alttext)%
    # [issue 46] In Thunderbird 60, mixed Stationery / SmartTemplate, external html file items added by SmartTemplates do not work. 
    
  Version 2.9.1 - 14/02/2020
    # since v2.9: template may not work if signature path is invalid  
    
  Version 2.10.1 - 14/04/2020
    # [issue 59] supports image tags with relative location
    # [issue 56] Support including external style sheet with %style()%
    # [issue 51] Fixed: Outgoing SMTP always using DEFAULT account.
    # [issue 54] Remove unwanted empty lines in reply/forward headers in plain-text emails
    # [issue 55] Added back some of the support for Postbox
    # [issue 58] Guessing firstName is from AB can  lead to last name duplication 

  Version 2.11 - 09/06/2020
    # [issue 60] Fixed difficulties with screenreader navigation in Settings Dialog
    # [issue 24] Allow changing template from Composer screen
    # Completed Serbian Locale  

  Version 2.11.1 - 21/06/2020
    # [issue 64] Regression: external template is removed when changing "from:" address
    # Change Template button - translate to 19 languages.
    # [issue 67] Regression (2.11): License warning screen comes up unexpectedly and number of "To:" rows restricted
    # [issue 68] Regression (2.11): After update SmartTemplates always displays nonlicensed support sites
    
  Version 2.11.2 - 10/07/2020  
    # [issue 74] In some cases the menu templates in compact header reply buttons are doubled up
    # [issue 73] Improve Name Capitalization: support double names, such as Klaus-Dieter
    # [issue 75] Clicking %style% from variables tabs inserted %file% instead.
    # [issue 62] reply with template doesn't work from "single message" window 
    
  Version 2.12 - 16/11/2020
    # [issue 77] - %file()% path truncated at front by 1 letter on Mac OS
    # [issue 37] - SmartTemplate destroys default Bcc switching on account change as configured in TB
    # [issue 94] - SmartTemplates does not insert template when Forwarding inline based on an Email written with ST
    # [issue 85] - Dead link on addons homepage 
    
  Version 2.13 - 01/01/2021
    # [issue 96] Added keyboard accelerators for Template picker
    # [issue 61] %quotePlaceholder(level)% new function for including quoted mail within the template for styling
    #            - use the quoteLevel parameter to exclude older quotes from the conversation
    # [issue 100] Trial period should restart count on license expiry
    # [issue 108] Fixed: Other Add-ons may accidentally duplicate template if they change the from address in Composer
    # Fixed support links to use https
    # make toggling spellcheck more reliable if %spellcheck()% variable is used
    # show premium variables if used with standard license more consistently
    # Improved Scrolling behavior if %cursor% is used.
    
  Version 2.14.1 - 05/02/2021
    # [issue 115] Erratic %datetime()% results when forcing HTML with Shift
    # Added examples in variables window for %header.delete(subject)%, %header.set(from)% and documentation for %conditionalText()%
    # With option "Remove email address unless format parameter is specified", mail parts such as 
      %from(...,mail)%, %from(...,bracketMail())% were removed
    # [issue 91] Improve functions %deleteQuotedText% and %replaceQuotedText% so they can  be used
                 in plain text mode (quote level argument will be ignored)

  Version 2.14.2.1 - 06/02/2021
    # [issue 119] XML Parsing Error settings dialog (it / sv / uk locales)
    
  Version 2.14.3 - 08/02/2021
    # open the license tab when status icon is clicked with expired license to make renewal easier.

  Version 2.14.4 - 15/02/2021
    # [issue 120] Spanish locale broken which creates an error when options screen is displayed
    # [issue 121] Common settings are shown even though the correct account seems to be selected!
    
  Version 2.15 - WIP
    # [issue 125] Improved support for converting encoded characters used in address fields such as "from"
    # [issue 125] Cardbook address names are resolved with weird characters
    # [issue 126] Enabling Resolve names from Address book falsely disables advanced options
    # [issue 130] Error in localization for Traditional Chinese (zh-TW) breaks settings dialog.

    
=========================
  KNOWN ISSUES / FUTURE FUNCTIONS
	
	Version 2.x
    # [issue 30] Reply button loses template menu items
    # [issue 28] Add "Smart Snippets": smart fragments that can be inserted from Composer.
    # [issue 27] Insert external HTML Templates from a web page URL
    # [issue 24] Allow selecting different file template after opening composer. 
      As starting point, we could just do a file open mechanism and an optional single toolbar button.
    # [issue 10] add %deliveryoptions% function to force Return Receipt.
    # [issue 12] <head> section is merged into <body>
		# ...
			
  Version 2.2
    # Known issues: The "clean up button" is not automatically installed in the composer toolbar.

// investigate gMsgCompose.compFields!
=========================
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
		NotifyComposeFieldsReady: function() {},
		NotifyComposeBodyReady: function(event) {
			const util = SmartTemplate4.Util,
			      prefs = SmartTemplate4.Preferences,
						msgComposeType = Components.interfaces.nsIMsgCompType;
		  let eventDelay = (gMsgCompose.type != msgComposeType.ForwardInline) 
			               ? 10 
										 : prefs.getMyIntPref("forwardInlineImg.delay"),
			    isNotify = false;
			util.logDebug('NotifyComposeBodyReady');
			// For Stationery integration, we need to  
			// its method of overwriting  stateListener.NotifyComposeBodyReady 
			if (prefs.isStationerySupported) {
				
				if (typeof Stationery_ == 'undefined') {
					isNotify = true;					
					prefs.setMyBoolPref("stationery.supported",false);
					util.showStationeryWarning();
				}
				else {
					// test existence of Stationery 0.8 specific function to test if we need to use the new event model.
					// added: New Stationery 0.9 uses promises
					
					if (Stationery.fireAsyncEvent || Stationery.waitForPromise) {
						if (gMsgCompose.type == msgComposeType.Template) {
							// force calling compose ready as Stationery does not support "template" case
							window.setTimeout(
								function(){ 
									util.logDebug("Template case with Stationery enabled: calling notifyComposeBodyReady()")
									SmartTemplate4.notifyComposeBodyReady(); 
								}, 
								eventDelay);					
						}
						else {
							// new Stationery will instead call preprocessHTMLStationery through its preprocessHTML method
							util.logDebug('NotifyComposeBodyReady: Stationery 0.8+ - no action required.');
						}
						return;
					}

					// Stationery 0.7.8 and older
					let bypass = true,
							oldTemplate = '';
					
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
						util.logToConsole('An older version of Stationery (pre 0.8) is installed.\n'
							 + 'As you have selected the Stationery template ' + oldTemplate 
							 + ', SmartTemplate4 will be not used for this email.' );
					else {
						isNotify = true;
					}
				}
			}
			else
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
					util.OrigNotify = stateListener.NotifyComposeBodyReady.bind(stateListener);
					let idKey = util.getIdentityKey(document);
					stateListener.NotifyComposeBodyReady = function() {
						// Bug 26356 - no notification on forward w. empty template
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
		// alternative events when 
		if (prefs.isStationerySupported) {
      log('composer' , 'Adding Listener for stationery-template-loaded...');
			window.addEventListener('stationery-template-loaded', function(event) {
				// Thunderbird uses gComposeType
				let eventDelay = (gMsgCompose.type != msgComposeType.ForwardInline) 
											 ? 10 
											 : prefs.getMyIntPref("forwardInlineImg.delay");
			  // async event
				log('composer,events', 'EVENT: stationery-template-loaded');
				// [BUG 26434] forwarding email with embedded images removes images
				// test delaying call for forward case
				window.setTimeout(
					function(){ notifyComposeBodyReady(event); },  // let's pass the window handle so we know where we come from!
					eventDelay
				);
			}, false);		
		}
    else {
      log('composer', 'not registering stationery-template-loaded event Preferences.isStationerySupported=false?');
    }
	},
	
	// Stationery 0.8 support!
  preprocessHTMLStationery: function preprocessHTMLStationery(t) {
    let util = SmartTemplate4.Util;
    util.logDebugOptional('stationery',
		     '=========================================\n'
		   + '=========================================\n'
			 + 'preprocessor for Stationery running...');
    let idKey = util.getIdentityKey(document);
    if(!idKey)
      idKey = gMsgCompose.identity.key;
    let st4composeType = util.getComposeType();
    if (st4composeType.indexOf('(draft)')) {
      st4composeType = st4composeType.substr(0,3);
    }
    // ignore html!
		SmartTemplate4.StationeryTemplateText = t.HTML;
		// do not do HTML escaping!
		// pass in a flag to leave %sig% untouched
		util.clearUsedPremiumFunctions();
		SmartTemplate4.PreprocessingFlags.isStationery = true;
    t.HTML = SmartTemplate4.smartTemplate.getProcessedText(t.HTML, idKey, st4composeType, true); 
		util.logDebugOptional('stationery', 'Processed text: ' + t.HTML);
    util.logDebugOptional('stationery',
		     '=========================================\n'
		   + '=========================================\n'
			 + 'Stationery preprocessor complete.');
  },	
	
	// -------------------------------------------------------------------
	// A handler to add template message
	// -------------------------------------------------------------------
	notifyComposeBodyReady: function notifyComposeBodyReady(evt, isChangeTemplate, win=null) 	{
		const prefs = SmartTemplate4.Preferences,
		      util = SmartTemplate4.Util,
					Ci = Components.interfaces,
					msgComposeType = Ci.nsIMsgCompType;
          
    isChangeTemplate = isChangeTemplate || false; // we need this for [isue 29] change template in composer window
		// maybe use 		GetCurrentEditor() and find out  stuff from there
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
			let theFileTemplate = ownerWin.SmartTemplate4.fileTemplates.armedEntry; 			// this is a html file we need to parse.
			ownerWin.SmartTemplate4.fileTemplates.armedEntry = null; 
			util.logDebugOptional("fileTemplates", "notifyComposeBodyReady: \n"
			  + "Consuming fileTemplate: " + theFileTemplate.label + "\n"
				+ "composeType:" + theFileTemplate.composeType + "\n"
				+ "path:" + theFileTemplate.path);
				
			// composer context:
			fileTemplateSource = SmartTemplate4.fileTemplates.retrieveTemplate(theFileTemplate);
			if (fileTemplateSource.failed) {
				let text = util.getBundleString("SmartTemplate4.fileTemplates.error.filePath",
				   "Could not load the file template '{0}' from path:\n{1}\nThe file may have been removed or renamed.");
				  
				SmartTemplate4.Message.display(
					text.replace("{0}", theFileTemplate.label).replace("{1}", theFileTemplate.path),
					"centerscreen,titlebar,modal,dialog",
				  { ok: function() {  
					        // get last composer window and bring to foreground
									let composerWin = Cc["@mozilla.org/appshell/window-mediator;1"]
										.getService(Ci.nsIWindowMediator).getMostRecentWindow("msgcompose");
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
		if (prefs.isDebugOption('stationery') || prefs.isDebugOption('composer')) debugger;
		util.logDebugOptional('stationery', 'notifyComposeBodyReady()...');
		
		dbg += "\ngMsgCompose type: "  + gMsgCompose.type;
		// see https://dxr.mozilla.org/comm-central/source/comm/mailnews/compose/public/nsIMsgComposeParams.idl
		// New in Tb60 EditAsNew (15) and EditTemplate (16)
		if (gMsgCompose.type == (msgComposeType.EditAsNew || 15) 
		   ||
			 gMsgCompose.type == (msgComposeType.EditTemplate || 16) 
			 )
			return; // let's do no processing in this case, so we can edit SmartTemplate4 variables
			
		// Tb 52 uses msgComposeType.Template for "Edit as New""
		if (gMsgCompose.type == msgComposeType.Template && (typeof msgComposeType.EditTemplate == 'undefined')) {
			util.logDebug("omitting processing - composetype is set to Template and there is no EditTemplate defined (pre Tb60)")
		  return;
		}
			// this also means the hacky code around flags.isThunderbirdTemplate will now be obsolete.
		if (evt) {
			let targ = evt.currentTarget || evt.target;
			if (targ.Stationery_ && prefs.isStationerySupported) {
			  let stationeryInstance = targ.Stationery_,
				    cur = null;
				stationeryTemplate = stationeryInstance.currentTemplate;
				dbg += '\nStationery is active';
				dbg += '\nTemplate used is:' + stationeryTemplate.url;
				if (stationeryTemplate.type !== 'blank') {
					try {
						let stationeryText = SmartTemplate4.StationeryTemplateText;
						flags.isStationery = true;
            let sigTest = this.smartTemplate.testSignatureVar(stationeryText);
						flags.sigType = sigTest;
						flags.hasSignature = (!!sigTest);
            flags.omitSignature = (sigTest=='omit');
						flags.hasCursor = this.smartTemplate.testCursorVar(stationeryText);
						flags.hasQuotePlaceholder = this.smartTemplate.testSmartTemplateToken(stationeryText, 'quotePlaceholder');
						flags.hasQuoteHeader = this.smartTemplate.testSmartTemplateToken(stationeryText, 'quoteHeader');
						flags.hasTemplatePlaceHolder = this.smartTemplate.testSmartTemplateToken(stationeryText, 'smartTemplate');
					}
					catch(ex) {
						util.logException("notifyComposeBodyReady - Stationery Template Processing", ex);
					}
				}
			}			
		}
		flags.isThunderbirdTemplate = 
		  (gMsgCompose.type == msgComposeType.Template);
		SmartTemplate4.StationeryTemplateText = ''; // discard it to be safe?
		util.logDebug(dbg);
		// Add template message
		/* if (evt && evt.type && evt.type =="stationery-template-loaded") {;} */
		// guard against this being called multiple times from stationery
		// avoid this being called multiple times
    let editor = util.CurrentEditor.QueryInterface(Ci.nsIEditor),
		    root = editor.rootElement,
		    isInserted = false;
		try {
			if (prefs.isDebugOption('stationery')) debugger;
			if (!root.getAttribute('smartTemplateInserted') 
        || gMsgCompose.type == msgComposeType.ForwardInline // issue 94
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
              w1 = util.getBundleString("SmartTemplate4.notification.editedChangeWarning",
                   "You have already typed text and want to change to template {0}"),
              q1 = util.getBundleString("SmartTemplate4.notification.editedChangeChallenge",
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
						let foundTo = false;
						// find the "to" line
						for (let rowAddress=1; foundTo==false; rowAddress++) {
							let adColElement = window.document.getElementById("addressCol1#" + rowAddress.toString());
							if (adColElement.value=="addr_to") {
								foundTo = true;
								FocusId = 'addressCol2#' + rowAddress.toString();
								FocusElement = window.document.getElementById(FocusId);
								//test if to-address already contains a valid email address:
								let r = new RegExp(/(\b[a-zA-Z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,8}\b)/);
								if (r.test(FocusElement.value)) { // found valid email!
									FocusId = 'content-frame';
									break;
								}
							}
							// nothing found? assume something went wrong, go to default behavior
							if (!adColElement || rowAddress>1000) {
								FocusId = 'addressCol2#1'; 
								break;
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
				    let text = util.getBundleString("SmartTemplate4.fileTemplates.error.filePath",
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
			}	// for TB bug?
		}
		
	},

	// -------------------------------------------------------------------
	// Escape to HTML character references
	// -------------------------------------------------------------------
	escapeHtml: function escapeHtml(str)
	{
		return str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/\n/gm, "<br>"); // remove quote replacements
	},


	// -------------------------------------------------------------------
	// Initialize - we only call this from the compose window
	// -------------------------------------------------------------------
	init: function init()	{
		function smartTemplate_loadIdentity(startup){
			let prevIdentity = gCurrentIdentity;
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
          licenser = SmartTemplate4.Licenser;
		try {
			util.logDebug('SmartTemplate4.updateStatusBar(' + show +')');
			let isDefault = (typeof show == 'undefined' || show == 'default'),
			    isVisible = isDefault ? prefs.getMyBoolPref('showStatusIcon') : show,
			    doc = isDefault ? document : util.Mail3PaneWindow.document,
			    btn = doc.getElementById('SmartTemplate4Messenger');
			if (btn) {
				let labelMode = prefs.getMyIntPref('statusIconLabelMode');
        while (btn.classList.length) {
           btn.classList.remove(btn.classList.item(0));
        } // clear all classes

        btn.classList.add('statusbarpanel-iconic-text');
        if (licenser.LicenseKey) {
          let days = licenser.LicensedDaysLeft,
              wrn = null;
          if (licenser.isExpired)  {
            wrn = "SmartTemplates License has expired {0} days ago.".replace("{0}", -days);
            btn.classList.add("alertExpired");
          }
          else if (days<15) {
            wrn = "SmartTemplates License will expire in {0} days!".replace("{0}", days);
            btn.classList.add("alert");
          }
          if (wrn) {
            btn.label = wrn;
            isVisible = true;
            labelMode = 2;
          }
          else {
            if (licenser.key_type==2)
              btn.label = "SmartTemplates";
            else
              btn.label = "SmartTemplates Pro";
          }
        }
        else
          btn.label = "SmartTemplates";
				btn.collapsed =  !isVisible;
        
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

	startUp: function startUp() {
    // this will call util.firstRun.init()
		let v = SmartTemplate4.Util.VersionProxy(); 
	} ,
	
	signatureDelimiter:  '-- <br>'

};  // Smarttemplate4

// -------------------------------------------------------------------
// Get day name and month name (localizable!)
// locale optional for locale
// -------------------------------------------------------------------
// this was classCalIDateTimeFormatter
SmartTemplate4.calendar = {
    currentLocale : null, // whatever was passed into %language()%
		bundleLocale: null,
		bundle: null,
		list: function list() {
			let str = "";
			for (let i=0;i<7 ;i++){
				str+=(cal.dayName(i)  +"("+cal.shortDayName(i)  +")/");
			} 
			str += "\n";
			for (let i=0;i<12;i++){
				str+=(cal.monthName(i)+"("+cal.shortMonthName(i)+")/");
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
					/* SmartTemplate4.Message.display(errorText, "centerscreen,titlebar", { ok: function() { ; } }); */
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
	
