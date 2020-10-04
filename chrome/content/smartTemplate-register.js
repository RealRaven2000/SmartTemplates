"use strict";
/* 
	BEGIN LICENSE BLOCK
	
	SmartTemplate4 is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension
	
	END LICENSE BLOCK 
*/

Components.utils.import('resource://gre/modules/Services.jsm');	

// module pattern to shield global vars & protect "this"
SmartTemplate4.Crypto = 
(function() {
	const util = SmartTemplate4.Util,
				prefs = SmartTemplate4.Preferences;
	return {
	get isPro() {
		let kt = this.keyType;
		return (kt == 0) || (kt == 1);
	},
	get isStandard() {
		return (this.keyType == 2);
	},
  get key_type() {
		// unfortunately we cannot use the closure for prefs - it fails when called from init(..)
		let kt = SmartTemplate4.Preferences.getMyIntPref('licenseType');
    return kt;
  },
  set key_type(t) {
		// unfortunately we cannot use the closure for prefs - it fails when called from init(..)
    SmartTemplate4.Preferences.setMyIntPref('licenseType', t);
  },
	/* note the encryption key is private. Do not reverse engineer */
  get decryption_key() {
    switch (this.key_type) {
      case 0:  // Pro
			case 2:  // Standard
        return "494d467df07bdf71e8f83d99e73f203f08bfaa9d8345b69a0b8069aff6b35569";
      case 1:  // domain
        return "68a025ffe52fd5cf9beaf0693b6e77e58278f6089f01bdac4afe965241f5cf8a5d9e25d0750091a7c8bcb3807909ddc290f00ed9ab6437d801ab1a2ac14cd5b";
      default:
        return -1; // unknown or free license
    }
  },
  get modulus() {
    switch (this.key_type) {
      case 0:  // Pro
			case 2:  // Standard
        return "49e2f5a409ecc3c96171df82f4cb0cbf274668e713008feb6d67f0ba45058ad5";
      case 1:  // domain
        return "12c127d3fb813f8bba7e863ab31c9943b76505f96cb87bfa9d4f9dc503a1bfe0c74e0057cff6ee9f3814fb90bc42207fdd908fbdb00cbf9a8f8c53dc7c4ed7b5";
      default:
        return -1; // unknown or free license
    }
  },
  get maxDigits() {
    switch (this.key_type) {
      case 0:  // Pro
			case 2:  // Standard
        return 35;
      case 1:  // domain
        return 67;
      default:
        return 0; // unknown or free license
    }
  },
  get keyLength() {
    switch (this.key_type) {
      case 0:  // Pro
			case 2:  // Standard
        return 256;
      case 1:  // domain
        return 512;
      default:
        return 0; // unknown or free license
    }
  }
};
})(); 

// var CRYPTO = SmartTemplate4.Crypto;
SmartTemplate4.Licenser =
(function() {
	const util = SmartTemplate4.Util,
				prefs = SmartTemplate4.Preferences,
				CRYPTO = SmartTemplate4.Crypto;
				
	return {
  LicenseKey: "",  
  RSA_encryption: "", 
	get key_type()       {return SmartTemplate4.Crypto.key_type;},
  get RSA_decryption() {return SmartTemplate4.Crypto.decryption_key;},
  get RSA_modulus()    {return SmartTemplate4.Crypto.modulus;},
  get RSA_keylength()  {return SmartTemplate4.Crypto.keyLength;},
  get MaxDigits()      {return SmartTemplate4.Crypto.maxDigits;},
  DecryptedMail: '',
  DecryptedDate: '',
  AllowSecondaryMails: false,
	ExpiredDays: 0,
  wasValidityTested: false, // save time do not validate again and again
  get isValidated() {
    return (this.ValidationStatus == this.ELicenseState.Valid);
  },
	get isExpired() {
		let key = prefs.getStringPref('LicenseKey');
		if (!key) return false;
		if (this.ValidationStatus == this.ELicenseState.NotValidated)
			this.validateLicense(key);
    return (this.ValidationStatus == this.ELicenseState.Expired);
	},
	
	graceDate: function ST4_licenser_graceDate() {
		util.logDebugOptional("premium.licenser", "Setting graceDate()…");
		let graceDate = "", isResetDate = false;
		try {
			graceDate = prefs.getStringPref("license.gracePeriodDate");
		}
		catch(ex) { 
			isResetDate = true; 
		}
		let today = new Date().toISOString().substr(0, 10); // e.g. "2019-07-18"
		if (!graceDate || graceDate>today) {
			graceDate = today; // cannot be in the future
			isResetDate = true;
		}
		else {
			// if a license exists & is expired long ago, use the last day of expiration date.
			let lic = util.Mail3PaneWindow.SmartTemplate4.Licenser;
			if (lic.ValidationStatus == lic.ELicenseState.Expired) {
				if (graceDate < lic.DecryptedDate) {
					util.logDebugOptional("premium.licenser", 
						"Extending graceDate from {0} to {1}".replace("{0}",graceDate).replace("{1}",lic.DecryptedDate));
					graceDate = lic.DecryptedDate;
					isResetDate = true;
				}
			}
		}
		if (isResetDate)
			prefs.setStringPref("license.gracePeriodDate", graceDate);
		util.logDebugOptional("premium.licenser", "Returning Grace Period Date: " + graceDate);
		return graceDate;
	},
	
	get GracePeriod() {
		let graceDate; // actually the install date for 2.1 or later.
		const period = 28,
		      SINGLE_DAY = 1000*60*60*24; 
		try {
		  graceDate = prefs.getStringPref("license.gracePeriodDate");
			if (!graceDate) graceDate = this.graceDate(); // create the date
		}
		catch(ex) { 
		  // if it's not there, set it now!
			graceDate = this.graceDate(); 
		}
		let today = (new Date()),
		    installDate = new Date(graceDate),
				days = Math.floor( (today.getTime() - installDate.getTime()) / SINGLE_DAY);
		// later.setDate(later.getDate()-period);
    return (period-days); // returns number of days left, or -days since trial expired if past period
	},
	
  ValidationStatus: 0,
  // enumeration for Validated state
  ELicenseState: {
    NotValidated: 0, // default status
    Valid: 1,
    Invalid: 2,
    Expired: 3,
    MailNotConfigured: 4,
    MailDifferent: 5,
    Empty: 6
  },
  
  licenseDescription: function licenseDescription(status) {
    const ELS = this.ELicenseState;
    switch(status) {
      case ELS.NotValidated: return 'Not Validated';
      case ELS.Valid: return 'Valid';
      case ELS.Invalid: return 'Invalid';
      case ELS.Expired: return 'Expired';
      case ELS.MailNotConfigured: return 'Mail Not Configured';
      case ELS.MailDifferent: return 'Mail Different';
      case ELS.Empty: return 'Empty';
      default: return 'Unknown Status';
    }
  },
  
  showDialog: function showDialog(featureName) {
		let params = {inn:{referrer:featureName, instance: SmartTemplate4}, out:null};
		util.Mail3PaneWindow.openDialog('chrome://SmartTemplate4/content/register.xhtml','smarttemplate4-register','chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',SmartTemplate4,params).focus();
  } ,
  // list of eligible accounts
  get Accounts() {
		return SmartTemplate4.Shim.Accounts;
  },
  
  accept: function accept() {
    util.logDebug("Licenser.accept()");
  } ,
  
  cancel: function cancel() {
    util.logDebug("Licenser.cancel()");
  } ,
  
  load: function load() {
    const getElement = document.getElementById.bind(document),
					licenser = util.Licenser,
          ELS = this.ELicenseState;
        
    let dropdownCount = 0;
		util.logDebug("Licenser.load() started");
		
    function appendIdentity(dropdown, id, account) {
      if (!id) {
        util.logDebug('appendIdentity failed for account = ' + account ? account.key : 'unknown');
      }
      try {
        util.logDebugOptional('identities', 
          'Account: ' + account.key + '...\n'  
          + 'appendIdentity [' + dropdownCount + ']\n'
          + '  identityName = ' + (id ? id.identityName : 'empty') + '\n'
          + '  fullName = ' + (id ? id.fullName : 'empty') + '\n' 
          + '  email = ' + (id.email ? id.email : 'empty'));					
        if (!id.email) {
          util.logToConsole('Omitting account ' + id.fullName + ' - no mail address');
          return;
        }
        let menuitem = document.createXULElement ? document.createXULElement('menuitem') : document.createElement('menuitem');
				menuitem.setAttribute("id", "id" + dropdownCount++);
				menuitem.setAttribute("fullName", id.fullName);
				menuitem.setAttribute("value", id.email);
				menuitem.setAttribute("accountKey", account.key);
				menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
        dropdown.appendChild(menuitem);
      }
      catch (ex) {
        util.logException('appendIdentity failed: ', ex);
      }
    }
    
		
		if (this.ValidationStatus == ELS.NotValidated) {
			this.validateLicense(prefs.getStringPref('LicenseKey'));
			util.logDebug('Re-validated.\n' + 'ValidationStatus = ' + this.licenseDescription(this.ValidationStatus))
		}
		
		let referrerTxt = getElement('referrer');
		if (window.arguments && window.arguments[1].inn.referrer) {
      referrerTxt.value = window.arguments[1].inn.referrer;
    }
		// for renewals, referrer is always the old license!
		if (this.isValidated)
			referrerTxt.value = this.LicenseKey;
		
		// Renewal Logic.
    let decryptedDate = this.DecryptedDate;
    if (decryptedDate) {
			if (prefs.isDebug) {
				util.logDebug('SmartTemplate4.Licenser.load()\n' + 'ValidationStatus = ' + licenser.licenseDescription(licenser.ValidationStatus))
			}
				
      getElement('licenseDate').value = decryptedDate; // invalid ??
			if (this.isExpired || this.isValidated) { // A LICENSE EXISTS ALREADY
				// LICENSE IS EITHER EXPIRED OR UP FOR RENEWAL SOON
				let btnProLicense = getElement('btnLicense'),
				    btnStdLicense = getElement('btnStdLicense');
						
				btnProLicense.removeAttribute('oncommand');
				if (!this.isValidated) {  // EXPIRED
					if (licenser.key_type==2) { // standard
						// this should be renewal instead?
						btnProLicense.label = util.getBundleString("SmartTemplate4.notification.premium.btn.upgrade", "Upgrade to Pro");
						btnProLicense.setAttribute('oncommand', 'SmartTemplate4.Licenser.goPro(3);');
						btnProLicense.classList.add('upgrade'); // no flashing
					}
					else {
						btnProLicense.label = util.getBundleString("SmartTemplate4.notification.premium.btn.renewLicense", "Renew License!");
						btnProLicense.setAttribute('oncommand', 'SmartTemplate4.Licenser.goPro(0, true);');
					}
					
				}
				else { // RENEWAL
					let extBtn;
					if (licenser.key_type==2) { // standard
						btnProLicense.label = util.getBundleString("SmartTemplate4.notification.premium.btn.upgrade", "Upgrade to Pro");
						btnProLicense.setAttribute('oncommand', 'SmartTemplate4.Licenser.goPro(3, true);');
						extBtn = btnStdLicense;
						btnStdLicense.removeAttribute('oncommand');
						btnStdLicense.setAttribute('oncommand', 'SmartTemplate4.Licenser.goPro(2, true);');
						// check whether renewal is up within 30 days
						let today = new Date(),
								later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
								dateString = later.toISOString().substr(0, 10);
						
						if (!(licenser.DecryptedDate < dateString)) { // not close to expiry yet. let's hide this path.
							let standardRow = getElement('StandardLicenseRow');
							standardRow.collapsed=true;
						}
					}
					else {
						extBtn = btnProLicense;
						btnProLicense.setAttribute('oncommand', 'SmartTemplate4.Licenser.goPro(0, true);');
					}
					extBtn.label = util.getBundleString("SmartTemplate4.notification.premium.btn.extendLicense", "Extend License!");
					// add tooltip
					extBtn.setAttribute('tooltiptext',
					  util.getBundleString("SmartTemplate4.notification.premium.btn.extendLicense.tooltip", 
						  "This will extend the current license date by 1 year. It's typically cheaper than a new license."));
				}

				// hide the "Enter License Key…" button + label
				if (!this.isExpired) {
					getElement('haveLicense').collapsed=true;
					getElement('btnEnterCode').collapsed=true;
				}
			}
		}
    else
      getElement('licenseDate').collapsed = true;
		
		switch(this.ValidationStatus) {
			case ELS.Expired:
			  getElement('licenseDateLabel').value = util.getBundleString("SmartTemplate4.licenseValidation.expired","Your license expired on:")
				getElement('LicenseTerm').classList.add('expired');
			  break;
			case ELS.Valid:
			  getElement('btnLicense').classList.remove('register'); // remove the "breathing effect" if license is valid.
			  break;
			case ELS.Empty:
				getElement('licenseDateLabel').value = " ";
			  break;
			default: // default class=register will animate the button
				getElement('licenseDateLabel').value = this.licenseDescription(this.ValidationStatus) + ":";
		}


    // iterate accounts
    let idSelector = getElement('mailIdentity'),
        popup = idSelector.menupopup,
        myAccounts = this.Accounts,
        acCount = myAccounts.length;
    util.logDebugOptional('identities', 'iterating accounts: (' + acCount + ')...');
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      if (ac.defaultIdentity) {
        util.logDebugOptional('identities', ac.key + ': appending default identity...');
        appendIdentity(popup, ac.defaultIdentity, ac);
        continue;
      }
      let ids = ac.identities; // array of nsIMsgIdentity
      if (ids) {
        let idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
        util.logDebugOptional('identities', ac.key + ': iterate ' + idCount + ' identities...');
        for (let i=0; i<idCount; i++) {
          // use ac.defaultIdentity ??
          // populate the dropdown with nsIMsgIdentity details
          let id = util.getIdentityByIndex(ids, i);
          if (!id) continue;
          appendIdentity(popup, id, ac);
        }
      }
      else {
        util.logDebugOptional('identities', 'Account: ' + ac.key + ':\n - No identities.');
      }  
    }
    // select first item
    idSelector.selectedIndex = 0;
    this.selectIdentity(idSelector);
		util.logDebug("Licenser.load() complete");
    
  } ,
  
  sanitizeName: function sanitizeName(name) {
    // remove bracketed stuff: "fred jones (freddy)" => "fred jones"
    let x = name.replace(/ *\([^)]*\) */g, "");
    if (x.trim)
      return x.trim();
    return x;
  },
  
  selectIdentity: function selectIdentity(element) {
    // get selectedItem attributes
    let it = element.selectedItem,
        fName = this.sanitizeName(it.getAttribute('fullName')),
        email = it.getAttribute('value'),
        names = fName.split(' ');
    document.getElementById('firstName').value = names[0];
    document.getElementById('lastName').value = names.length > 1 ? names[names.length-1] : "";
    document.getElementById('email').value = email;
  } ,
  
  goPro: function goPro(license_type, forceRenew) {
    const productDetail = "https://sites.fastspring.com/quickfolders/product/smarttemplate4";
    // redirect to registration site; pass in the feature that brought user here
    // short order process
    let shortOrder,
		    addQuery = '',
				featureName = document.getElementById('referrer').value,
				isRenew = forceRenew || false; // hidden field
				
    switch	(license_type) {
			case 0:  // pro license
				if (isRenew) { // RENEWAL
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/smarttemplate4renew";
					// addQuery = "&renewal=" + encodeURI(prefs.getStringPref('LicenseKey'));
					featureName = encodeURI(prefs.getStringPref('LicenseKey'));
					// should we autoselect the correct email address?
				}
				else // NEW
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/smarttemplate4";
			  break;
				
			case 1: // domain license
				shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplate4domain";
			  break;
				
			case 2: // standard license
				if (isRenew) { // RENEWAL
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/smarttemplateStdrenew"; // product to be created
					// addQuery = "&renewal=" + encodeURI(prefs.getStringPref('LicenseKey'));
					featureName = encodeURI(prefs.getStringPref('LicenseKey'));
					// should we autoselect the correct email address?
				}
				else // NEW
					shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplatestandard";
			  break;

			case 3: // upgrade pro to standard
				shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplateupgrade"; // product to be created
				featureName = encodeURI(prefs.getStringPref('LicenseKey')); // original license to upgrade!
			  break;
			
		}
    // view product detail
    let firstName = document.getElementById('firstName').value,
        lastName = document.getElementById('lastName').value,
        email = document.getElementById('email').value,
        url = shortOrder 
            + "?contact_fname=" + firstName 
            + "&contact_lname=" + lastName 
						+ addQuery
            + "&contact_email=" + email;
        
    let queryString = '';  // action=adds
        
    if (featureName) {
      queryString = "&referrer=" + featureName;
    }
    util.openLinkInBrowser(null, url + queryString);
    window.close();
  }  ,

   /* obsolete form submission from code */
  postForm  : function postForm_obsolete(util) {
    let url ="https://sites.fastspring.com/quickfolders/product/smarttemplate4?action=order",
        oReq;
    
    if (util.PlatformVersion >=16.0) {
      const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");    
      oReq = new XMLHttpRequest();
    }
    else {
      const { XMLHttpRequest_Legacy } = Components.classes["@mozilla.org/appshell/appShellService;1"]
                                       .getService(Components.interfaces.nsIAppShellService)
                                       .hiddenDOMWindow;
      oReq = new XMLHttpRequest_Legacy();
    }
    // oReq.onload = reqListener;
    let formData = new FormData();
    formData.append("submit", "purchase");
    oReq.open("POST", url, true);
    oReq.send(formData);  
  } ,
  
  premiumInfo: function premiumInfo(event) {
    util.openURL(event,'https://smarttemplates.quickfolders.org/premium.html');
  },
  
  // format ST-EMAIL:DATE;SmartTemplate4.Crypto
  // example: ST-joe.bloggs@gotmail.com:2015-05-20;
  getDate: function getDate(LicenseKey) {
    // get mail+date portion
    let arr = LicenseKey.split(';');
    if (!arr.length) {
      util.logDebug('getDate() failed - no ; found');
      return ''; 
    }
    // get date portion
    let arr1=arr[0].split(':');
    if (arr1.length<2) {
      util.logDebug('getDate() failed - no : found');
      return '';
    }
    return arr1[1];
  },
  
  getMail: function getMail(LicenseKey) {
    let arr1 = LicenseKey.split(':');
    if (!arr1.length) {
      util.logDebug('getMail() failed - no : found');
      return '';
    }
    let pos = arr1[0].indexOf('-') + 1;
    return arr1[0].substr(pos); // split off ST- or STD-
  },
  
  getCrypto: function getCrypto(LicenseKey) {
    let arr=LicenseKey.split(';');
    if (arr.length<2) {
      util.logDebug('getCrypto() failed - no ; found');
      return null;
    }
    return arr[1];
  },
  
  logIdentity: function logIdentity(id) {  // debug a nsIMsgIdentity 
    if (!id) return "EMPTY id!"
    let txt = '';
    try { // building this incremental in case of problems. I know this is bad for performance, because immutable strings.
      txt += "key: " + id.key + '\n';
      txt += "email:" + (id.email || 'EMPTY') + '\n';
      txt += "fullName:" + (id.fullName || 'EMPTY') + '\n';
      txt += "valid:" + (id.valid || 'EMPTY') + '\n';
      txt += "identityName: " + id.identityName + '\n';
    }
    catch(ex) {
      this.logException('validateLicense (identity info:)\n' + txt, ex);
    }
    finally {
      return txt;
    }
  } ,	
	
  validateLicense: function validate(LicenseKey) {
    function logResult(parent) {
      util.logDebug ('validateLicense()\n returns ' 
                     + parent.licenseDescription(parent.ValidationStatus)
                     + '   [' + parent.ValidationStatus + ']');
    }
		
    function isIdMatchedLicense(idMail, licenseMail) {
			try {
				switch(SmartTemplate4.Crypto.key_type) {
					case 0: // Pro license
					case 2:  // Standard license
						return (idMail.toLowerCase()==licenseMail);
					case 1: // domain matching 
						// only allow one *
						if ((licenseMail.match(/\*/g)||[]).length != 1)
							return false;
						// replace * => .*
						let r = new RegExp(licenseMail.replace("*",".*"));
						let t = r.test(idMail);
						return t;
				}
			}
			catch (ex) {
				util.logException('validateLicense.isIdMatchedLicense() failed: ', ex);				
			}
      return false;
    }
    
    // extract encrypted portion after ;
    const ELS = this.ELicenseState,
					prefs = SmartTemplate4.Preferences,
          logIdentity = SmartTemplate4.Licenser.logIdentity,
					crypto = SmartTemplate4.Crypto;
    if (prefs.isDebug) {
      util.logDebug("validateLicense(" + LicenseKey + ")");
    }
    this.LicenseKey = LicenseKey;
		if (!LicenseKey) {
      this.ValidationStatus = ELS.Empty;
      logResult(this);
			crypto.key_type = 0; // reset to pro!
      return [this.ValidationStatus, ''];
    }
    if (LicenseKey.indexOf('STD')==0) {
       if (crypto.key_type!=1) { // not currently a domain key?
         let txt = util.getBundleString("SmartTemplate4.prompt.switchDomainLicense", "Switch to Domain License?");
				  
         if (Services.prompt.confirm(null, util.ADDON_TITLE, txt)) {
           crypto.key_type=1; // switch to volume license
         }
       }
    }
    else {
			if (LicenseKey.indexOf('S1-')==0)
				crypto.key_type=2; // Standard License
			if (LicenseKey.indexOf('ST-')==0)
				crypto.key_type=0; // Pro License
    }
    let maxDigits = crypto.maxDigits, // will be 67 for Domain License
        encrypted = this.getCrypto(LicenseKey),
        clearTextEmail = this.getMail(LicenseKey),
        clearTextDate = this.getDate(LicenseKey),
        RealLicense = '';
    if (!encrypted) {
      this.ValidationStatus = ELS.Invalid;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    // RSAKeyPair(encryptionExponent, decryptionExponent, modulus)
    if (prefs.isDebug) {
      util.logDebug("RSA.initialise(" +  maxDigits + ")");
    }
    
    SmartTemplate4.RSA.initialise(maxDigits);
    util.logDebug ('Creating RSA key + decrypting');
    // we do not pass encryptionComponent as we don't need it for decryption
    if (prefs.isDebug) {
      util.logDebug("new RSA.RSAKeyPair()");
    }
    let key = new SmartTemplate4.RSA.RSAKeyPair("", this.RSA_decryption, this.RSA_modulus, this.RSA_keylength);
    // decrypt
    // verify against remainder of string
    this.DecryptedMail = '';
    this.DecryptedDate = '';
    if (encrypted) try {
      if (prefs.isDebug) {
        util.logDebug("get RSA.decryptedString()");
      }
      RealLicense = SmartTemplate4.RSA.decryptedString(key, encrypted);
      this.wasValidityTested = true;
      util.logDebug ('Decryption Complete : decrypted string = ' + RealLicense);
    }
    catch (ex) {
      util.logException('RSA Decryption failed: ', ex);
    }
    if (!RealLicense) {
      this.ValidationStatus = ELS.Invalid;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    else {
      this.DecryptedMail = this.getMail(RealLicense + ":xxx");
      this.DecryptedDate = this.getDate(RealLicense + ":xxx");
      // check ISO format YYYY-MM-DD
      let regEx = /^\d{4}-\d{2}-\d{2}$/;
      if (!this.DecryptedDate.match(regEx)) {
        this.DecryptedDate = '';
        this.ValidationStatus = ELS.Invalid;
        logResult(this);
        return [this.ValidationStatus, RealLicense];
      }
    }
    if (clearTextEmail.toLocaleLowerCase() != this.DecryptedMail.toLocaleLowerCase()) {
      this.ValidationStatus = ELS.MailDifferent;
      logResult(this);
      return [this.ValidationStatus, RealLicense];
    }
    // ******* CHECK LICENSE EXPIRY  ********
    // get current date
    let today = new Date(),
        dateString = today.toISOString().substr(0, 10);
    if (this.DecryptedDate < dateString) {
      this.ValidationStatus = ELS.Expired;
			let date1 = new Date(this.DecryptedDate);
			this.ExpiredDays = parseInt((today - date1) / (1000 * 60 * 60 * 24)); 
      logResult(this);
      return [this.ValidationStatus, RealLicense];
    }
    // ******* MATCH MAIL ACCOUNT  ********
    // check mail accounts for setting
    // if not found return MailNotConfigured
    
    let isMatched = false, 
        iAccount=0,
        isDbgAccounts = prefs.isDebugOption('premium.licenser'),
        hasDefaultIdentity = false,
        myAccounts = this.Accounts,
        ForceSecondaryMail = prefs.getMyBoolPref('licenser.forceSecondaryIdentity');
				
		if (SmartTemplate4.Crypto.key_type==1) {
			ForceSecondaryMail = false;
			util.logToConsole	("Sorry, but forcing secondary email addresses with a Domain license is not supported!");
		}
				
				
    if (ForceSecondaryMail) {
      // switch for secondary email licensing
      this.AllowSecondaryMails = true;
    }
    else {
      for (let a=0; a < myAccounts.length; a++) { 
        if (myAccounts[a].defaultIdentity) {
          hasDefaultIdentity = true;
          break;
        }
      }
      if (!hasDefaultIdentity) {
        this.AllowSecondaryMails = true;
        util.logDebug("Premium License Check: There is no account with default identity!\n" +
                      "You may want to check your account configuration as this might impact some functionality.\n" + 
                      "Allowing use of secondary email addresses…");
      }
    }
    let licensedMail = this.DecryptedMail.toLowerCase();
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      iAccount++;
      if (ac.defaultIdentity && !ForceSecondaryMail) {
        util.logDebugOptional("premium.licenser", "Iterate accounts: [" + ac.key + "] Default Identity =\n" 
          + logIdentity(ac.defaultIdentity));
				if (!ac.defaultIdentity || !ac.defaultIdentity.email) {
					if (ac.incomingServer.username != "nobody") {
						util.logDebug("Account " + ac.incomingServer.prettyName + " has no default identity!");
					}
					continue;
        }
        if (isIdMatchedLicense(ac.defaultIdentity.email, licensedMail)) {
          isMatched = true;
          break;
        }
      }
      else {
        // allow secondary matching using override switch, but not with domain licenses
        if (!this.AllowSecondaryMails
            ||  
            crypto.key_type == 1) 
          continue;  
        util.logDebugOptional("premium.licenser", "Iterate accounts: [" + ac.key + "] secondary ids");
        // ... allow using non default identities 
        let ids = ac.identities, // array of nsIMsgIdentity 
            idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
        util.logDebugOptional("premium.licenser", "Iterating " + idCount + " ids…");
        if (ids) {
          for (let i=0; i<idCount; i++) {
            // use ac.defaultIdentity ??
            // populate the dropdown with nsIMsgIdentity details
            let id = util.getIdentityByIndex(ids, i);
            if (!id || !id.email) {
              util.logDebugOptional("premium.licenser", "Invalid nsIMsgIdentity: " + i);
              continue;
            }
            let matchMail = id.email.toLocaleLowerCase();
            if (isDbgAccounts) {
              util.logDebugOptional("premium.licenser", 
                "Account[" + ac.key + "], Identity[" + i + "] = " + logIdentity(id) +"\n"
                + "Email: [" + matchMail + "]");
            }
            if (isIdMatchedLicense(matchMail, licensedMail)) {
              isMatched = true;
              break;
            }
          }
          if (isMatched) break;
        }     
      }
    }
    if (!isMatched) {
      this.ValidationStatus = ELS.MailNotConfigured;
    }
    else {
      util.logDebug ("validateLicense() - successful.");
      this.ValidationStatus = ELS.Valid;
    }
    logResult(this);
    return [this.ValidationStatus, RealLicense];
  },
  
  /*** for test only, will be removed **/
  encryptLicense: function encryptLicense(LicenseKey, maxDigits) {
    util.logDebug ('encryptLicense - initialising with maxDigits = ' + maxDigits);
    SmartTemplate4.RSA.initialise(maxDigits);
    // 64bit key pair
    util.logDebug ('encryptLicense - creating key pair object, bit length = ' + this.RSA_keylength);
    let key = new SmartTemplate4.RSA.RSAKeyPair(
      this.RSA_encryption,
      this.RSA_decryption,
      this.RSA_modulus,
      this.RSA_keylength
    );
    util.logDebug ('encryptLicense - starting encryption...');
    let Encrypted = SmartTemplate4.RSA.encryptedString(key, LicenseKey, 'OHDave');
    util.logDebug ('encryptLicense - finished encrypting registration key of length: ' + Encrypted.length + '\n'
      + Encrypted);
    return Encrypted;
    
  }

};

})();  


