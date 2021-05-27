"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
  
*/


/* [mx-l10n] This module handles front-end code for the licensing dialog  */

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
				
// removed UI function from SmartTemplate4.Licenser
var Register = {
  l10n: function() {
    SmartTemplate4.Util.localize(document);
  },
  
  load: async function load() {
    const getElement = document.getElementById.bind(document),
          util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
        
		util.logDebug("Register.load() started");
    
    await SmartTemplate4.Util.init();
    this.updateUI();
    this.updateLicenseUI();
    window.addEventListener("SmartTemplates.BackgroundUpdate", this.updateLicenseUI.bind(this));
		util.logDebug("Register.load() complete");
  } ,
  
  updateLicenseUI: async function updateLicenseUI() {  
    const licenseInfo = SmartTemplate4.Util.licenseInfo,
          getElement = document.getElementById.bind(document),
          prefs = SmartTemplate4.Preferences,
          util = SmartTemplate4.Util;
		// for renewals, referrer is always the old license!
    let referrerTxt = getElement('referrer');
		if (licenseInfo.status=="Valid")
			referrerTxt.value = licenseInfo.licenseKey;
		
		// Renewal Logic.
    let decryptedDate = licenseInfo.expiryDate;
    if (decryptedDate) {
			if (prefs.isDebug) {
				util.logDebug('Register.updateLicenseUI()\n' + 'ValidationStatus = ' + licenseInfo.description)
			}
				
      getElement('licenseDate').value = decryptedDate; // invalid ??
			if (licenseInfo.isExpired || licenseInfo.isValid) { // A LICENSE EXISTS ALREADY
				// LICENSE IS EITHER EXPIRED OR UP FOR RENEWAL SOON
				let btnProLicense = getElement('btnLicense'),
            btnDomainLicense = getElement('btnDomainLicense'),
				    btnStdLicense = getElement('btnStdLicense');
						
				if (licenseInfo.isExpired) {  // EXPIRED
          switch (licenseInfo.keyType) {
            case 0: // Pro
              btnProLicense.label = util.getBundleString("st.notification.premium.btn.renewLicense", "Renew License!");
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(0, true);');
              break;
            case 1: // Domain
              btnDomainLicense.label = util.getBundleString("st.notification.premium.btn.renewDomainLicense", "Renew Domain License!");
              btnDomainLicense.removeAttribute('oncommand');
              btnDomainLicense.setAttribute('oncommand', 'Register.goPro(1, true);');
              btnDomainLicense.classList.add('register');
              btnProLicense.classList.remove('register');
              break;
            case 2: // Standard
              btnProLicense.label = util.getBundleString("st.notification.premium.btn.upgrade", "Upgrade to Pro");
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(3);'); // upgrade fropm standard
              btnProLicense.classList.add('upgrade'); // no flashing
              break;
          }
					
				}
				else { // EXTEND
					let extBtn, extText;
          switch(licenseInfo.keyType) {
            case 0:
              extBtn = btnProLicense;
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(0, true);');
              extText = util.getBundleString("st.notification.premium.btn.extendLicense", "Extend License!")
              break;
            case 1:
              extBtn = btnDomainLicense;
              btnProLicense.classList.remove('register'); // not flashing
              btnDomainLicense.removeAttribute('oncommand');
              btnDomainLicense.setAttribute('oncommand', 'Register.goPro(1, true);');
              extText = util.getBundleString("st.notification.premium.btn.extendDomainLicense", "Extend Domain License!");
              break;
            case 2:
              btnProLicense.label = util.getBundleString("st.notification.premium.btn.upgrade", "Upgrade to Pro");
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(3, true);');
              extBtn = btnStdLicense;
              btnStdLicense.removeAttribute('oncommand');
              btnStdLicense.setAttribute('oncommand', 'Register.goPro(2, true);');
              extText = util.getBundleString("st.notification.premium.btn.extendLicense", "Extend License!")
              // check whether renewal is up within 30 days
              let today = new Date(),
                  later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
                  dateString = later.toISOString().substr(0, 10);
              
              if (!(licenseInfo.expiryDate < dateString)) { // not close to expiry yet. let's hide this path.
                let standardRow = getElement('StandardLicenseRow');
                standardRow.collapsed=true;
              }
              break;
          }

					extBtn.label = extText;
          extBtn.classList.add("register");
					// add tooltip
					extBtn.setAttribute('tooltiptext',
					  util.getBundleString("st.notification.premium.btn.extendLicense.tooltip", 
						  "This will extend the current license date by 1 year. It's typically cheaper than a new license."));
				}

				// hide the "Enter License Key…" button + label
				if (!licenseInfo.isExpired) {
					getElement('haveLicense').collapsed=true;
					getElement('btnEnterCode').collapsed=true;
				}
			}
		}
    else
      getElement('licenseDate').collapsed = true;
		
		switch(licenseInfo.status) {
			case "Expired":
			  getElement('licenseDateLabel').value = util.getBundleString("st.licenseValidation.expired","Your license expired on:");
				getElement('LicenseTerm').classList.add('expired');
			  break;
			case "Valid":
			  getElement('btnLicense').classList.remove('register'); // remove the "breathing effect" if license is valid.
			  break;
			case "Empty":
      case "NotValidated":
				getElement('licenseDateLabel').value = " ";
			  break;
			default: // default class=register will animate the button
				getElement('licenseDateLabel').value = licenseInfo.description + ":";
		}
  
  },
  
  updateUI: async function updateUI() {
    const getElement = document.getElementById.bind(document),
          util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
          
    let dropdownCount = 0;
		
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
        let menuitem = document.createXULElement('menuitem');
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
          
		let referrerTxt = getElement('referrer');
		if (window.arguments && window.arguments[1].inn.referrer) {
      referrerTxt.value = window.arguments[1].inn.referrer;
    }
          
    // iterate accounts
    let idSelector = getElement('mailIdentity'),
        popup = idSelector.menupopup,
        myAccounts = util.Accounts,
        acCount = myAccounts.length;
    util.logDebugOptional('identities', 'iterating accounts: (' + acCount + ')…');
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      if (ac.defaultIdentity) {
        util.logDebugOptional('identities', ac.key + ': appending default identity…');
        appendIdentity(popup, ac.defaultIdentity, ac);
        continue;
      }
      let ids = ac.identities; // array of nsIMsgIdentity
      if (ids) {
        let idCount = ids ? ids.length : 0;
        util.logDebugOptional('identities', ac.key + ': iterate ' + idCount + ' identities…');
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
    if (prefs.isDebugOption('premium.licenser')) getElement('referrer').collapsed=false;    
  },
  
  
  goPro: function goPro(license_type, isRenew = false) {
    const productDetail = "https://sites.fastspring.com/quickfolders/product/smarttemplate4",
          util = SmartTemplate4.Util,
          prefs = SmartTemplate4.Preferences;
    // redirect to registration site; pass in the feature that brought user here
    // short order process
    let shortOrder,
		    addQuery = '',
				featureName = document.getElementById('referrer').value; // hidden field
				
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
				if (isRenew) { // RENEWAL
					shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplatesdomainrenewal";
					// addQuery = "&renewal=" + encodeURI(prefs.getStringPref('LicenseKey'));
					featureName = encodeURI(prefs.getStringPref('LicenseKey'));
					// should we autoselect the correct email address?
				}
				else // NEW
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
    
    const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");    
    oReq = new XMLHttpRequest();

    let formData = new FormData();
    formData.append("submit", "purchase");
    oReq.open("POST", url, true);
    oReq.send(formData);  
  } ,

  premiumInfo: function premiumInfo(event) {
    SmartTemplate4.Util.openURL(event,'https://smarttemplates.quickfolders.org/premium.html');
  },
  
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
        fName = Register.sanitizeName(it.getAttribute('fullName')),
        email = it.getAttribute('value'),
        names = fName.split(' ');
    document.getElementById('firstName').value = names[0];
    document.getElementById('lastName').value = names.length > 1 ? names[names.length-1] : "";
    document.getElementById('email').value = email;
  } ,
  
}


// initialize the dialog and do l10n
window.document.addEventListener('DOMContentLoaded', 
  Register.l10n.bind(Register) , 
  { once: true });
window.addEventListener('load', 
  Register.load.bind(Register) , 
  { once: true });
