"use strict";
/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
  
*/


/* [mx-l10n] This module handles front-end code for the licensing dialog  */
var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
var SmartTemplates_ESM = parseInt(AppConstants.MOZ_APP_VERSION, 10) >= 128;
var { MailServices } = SmartTemplates_ESM
  ? ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs")
  : ChromeUtils.import("resource:///modules/MailServices.jsm");

// removed UI function from SmartTemplate4.Licenser
var Register = {
  l10n: function () {
    SmartTemplate4.Util.localize(document);
    let featureComparison = document.getElementById("featureComparison");
    if (featureComparison) {
      let htmlFragment =
        "<label class='para' id='featureComparison'>" +
        SmartTemplate4.Util.getBundleString("licenseComparison")
          .replace(/\{linkStart\}/, "<a id='compLink' class='link'>")
          .replace(/\{linkEnd\}/, "</a>") +
        "</label>";
      let e = featureComparison.ownerGlobal.MozXULElement.parseXULToFragment(htmlFragment);

      featureComparison.parentElement.insertBefore(e, featureComparison);
      featureComparison.parentElement.removeChild(featureComparison);
      window.addEventListener("click", async (event) => {
        if (event.target.id == "compLink") {
          SmartTemplate4.Util.openLinkInBrowser(
            event,
            "https://smarttemplates.quickfolders.org/premium.html#featureComparison"
          );
        }
      });
    }
  },
  addRegisterEventListener: function (id_or_el, license_type) {
    const el = typeof id_or_el === "string" ? document.getElementById(id_or_el) : id_or_el; // pass id or element directly
    const evtFunc = () => {
      Register.goPro(license_type);
    };
    if (el._currentHandler) {
      el.removeEventListener("command", el._currentHandler);
    }    
    el.addEventListener("command", evtFunc);
    el._currentHandler = evtFunc; // remember event handler to remove!
  },

  load: async function load() {
    const util = SmartTemplate4.Util;

    util.logDebug("Register.load() started");

    await SmartTemplate4.Util.init();
    this.updateUI();
    window.addEventListener("SmartTemplates.BackgroundUpdate", this.updateLicenseUI.bind(this));
    document.getElementById("btnEnterCode").addEventListener("command", () => {
      SmartTemplate4.Util.viewLicense();
      window.close();
    });
    const toggleBtn = document.getElementById("toggleSwitchLicenseTerms");
    toggleBtn.addEventListener("command", () => {
      Register.toggleTerms(toggleBtn);
    });
    const mailId = document.getElementById("mailIdentity");
    mailId.addEventListener("command", () => {
      Register.selectIdentity(mailId);
    });
    this.addRegisterEventListener("btnLicense", 0);
    this.addRegisterEventListener("btnStdLicense", 2);
    this.addRegisterEventListener("btnDomainLicense", 1);    
    
    this.updateLicenseUI();

    util.logDebug("Register.load() complete");
  },

  toggleTerms: function (btn) {
    let termsBox = document.getElementById("licenseTerms");
    let collapsed = termsBox.getAttribute("collapsed");
    let label;
    if (collapsed) {
      termsBox.removeAttribute("collapsed");
      label = "licenseTerms.hide";
      btn.classList.add("continue");
    } else {
      termsBox.setAttribute("collapsed", "true");
      label = "licenseTerms.show";
      btn.classList.remove("continue");
    }
    btn.label = SmartTemplate4.Util.getBundleString(label);
    let form = document.querySelector("hbox.form");
    if (form) {
      if (collapsed) {
        form.setAttribute("collapsed", "true");
      } else {
        form.removeAttribute("collapsed");
      }
    }
    let buy = document.getElementById("buyBox");
    if (buy) {
      if (collapsed) {
        buy.setAttribute("collapsed", "true");
      } else {
        buy.removeAttribute("collapsed");
      }
    }
    if (window.sizeToContent) {
      window.sizeToContent();
    }
  },

  updateLicenseUI: async function () {
    const licenseInfo = SmartTemplate4.Util.licenseInfo,
      getElement = document.getElementById.bind(document),
      prefs = SmartTemplate4.Preferences,
      util = SmartTemplate4.Util;
    // for renewals, referrer is always the old license!
    const referrerTxt = getElement("referrer");
    if (licenseInfo.status == "Valid") {
      referrerTxt.value = licenseInfo.licenseKey;
    }

    // Renewal Logic.
    let decryptedDate = licenseInfo.expiryDate;
    if (decryptedDate) {
      if (prefs.isDebug) {
        util.logDebug(
          "Register.updateLicenseUI()\n" + "Validation Status = " + licenseInfo.description
        );
      }

      getElement("licenseDate").value = decryptedDate; // invalid ?
      if (decryptedDate) {
        // friendly date
        let d = new Date(decryptedDate);
        let ds = d.toLocaleDateString();
        if (ds) {
          getElement("licenseDate").value = ds;
        }
      }

      if (licenseInfo.isExpired || licenseInfo.isValid) {
        // A LICENSE EXISTS ALREADY
        // LICENSE IS EITHER EXPIRED OR UP FOR RENEWAL SOON
        let btnProLicense = getElement("btnLicense"),
          btnDomainLicense = getElement("btnDomainLicense"),
          btnStdLicense = getElement("btnStdLicense");

        if (licenseInfo.isExpired) {
          // EXPIRED
          switch (licenseInfo.keyType) {
            case 0: // Pro
              btnProLicense.label = util.getBundleString(
                "st.notification.premium.btn.renewLicense"
              );
              Register.addRegisterEventListener(btnProLicense, 0, true);
              break;
            case 1: // Domain
              btnDomainLicense.label = util.getBundleString(
                "st.notification.premium.btn.renewDomainLicense"
              );
              Register.addRegisterEventListener(btnDomainLicense, 1, true);
              btnDomainLicense.classList.add("register");
              btnProLicense.classList.remove("register");
              break;
            case 2: // Standard
              btnProLicense.label = util.getBundleString("st.notification.premium.btn.upgrade");
              Register.addRegisterEventListener(btnProLicense, 3); // upgrade from standard
              btnProLicense.classList.add("upgrade"); // no flashing
              btnStdLicense.label = util.getBundleString(
                "st.notification.premium.btn.renewLicense"
              );
              break;
          }
        } else { // not expired
          // EXTEND (or UPGRADE if standard license)
          switch (licenseInfo.keyType) {
            case 0:
              btnProLicense.label = util.getBundleString(
                "st.notification.premium.btn.extendLicense"
              );
              Register.addRegisterEventListener(btnProLicense, 0, true);
              btnProLicense.classList.add("register");
              btnProLicense.setAttribute(
                "tooltiptext",
                util.getBundleString("st.notification.premium.btn.extendLicense.tooltip")
              );

              break;
            case 1:
              btnProLicense.classList.remove("register"); // not flashing
              Register.addRegisterEventListener(btnDomainLicense, 1, true);
              btnDomainLicense.label = util.getBundleString(
                "st.notification.premium.btn.extendDomainLicense"
              );
              btnDomainLicense.classList.add("register");
              break;
            case 2:
              btnProLicense.label = util.getBundleString("st.notification.premium.btn.upgrade");
              Register.addRegisterEventListener(btnProLicense, 3, true); // upgrade from standard
              btnProLicense.classList.add("register");
              // we suggest an upgrade (no extension before std license is expired!!)
              btnStdLicense.label = util.getBundleString(
                "st.notification.premium.btn.extendLicense"
              );
              Register.addRegisterEventListener(btnStdLicense, 2, true);

              // extText = util.getBundleString("st.notification.premium.btn.extendLicense");
              // check whether renewal is up within 30 days
              {
                let today = new Date(),
                  later = new Date(today.setDate(today.getDate() + 30)), // pretend it's a month later:
                  dateString = later.toISOString().substr(0, 10);

                if (!(licenseInfo.expiryDate < dateString)) {
                  // not close to expiry yet. let's hide this path.
                  let standardRow = getElement("StandardLicenseRow");
                  standardRow.setAttribute("collapsed", true);
                }
              }
              break;
          }
        }

        // hide the "Enter License Key…" button + label
        if (!licenseInfo.isExpired) {
          getElement("haveLicense").setAttribute("collapsed", true);
          getElement("btnEnterCode").setAttribute("collapsed", true);
        }
      }
    } else {
      getElement("licenseDate").setAttribute("collapsed", true);
    }

    switch (licenseInfo.status) {
      case "Expired":
        getElement("licenseDateLabel").textContent = util.getBundleString(
          "st.licenseValidation.expired"
        );
        getElement("LicenseTerm").classList.add("expired");
        break;
      case "Valid":
        getElement("btnLicense").classList.remove("register"); // remove the "breathing effect" if license is valid.
        break;
      case "Empty":
      case "NotValidated":
        getElement("licenseDateLabel").textContent = " ";
        break;
      default: // default class=register will animate the button
        getElement("licenseDateLabel").textContent = licenseInfo.description + ":";
    }
    if (window.sizeToContent) {
      window.sizeToContent();
    }
  },

  updateUI: async function updateUI() {
    const getElement = document.getElementById.bind(document),
      util = SmartTemplate4.Util,
      prefs = SmartTemplate4.Preferences;

    let dropdownCount = 0;

    function appendIdentity(dropdown, id, account) {
      if (!id) {
        util.logDebug(`appendIdentity failed for account = ${account ? account.key : "unknown"}`);
      }
      try {
        util.logDebugOptional(
          "identities",
          `Account: ${account.key}...\n` +
            `appendIdentity [${dropdownCount}]\n` +
            `  identityName = ${(id ? id.identityName : "empty")}\n` +
            `  fullName = ${(id ? id.fullName : "empty")}\n` +
            `  email = ${(id.email ? id.email : "empty")}`
        );
        if (!id.email) {
          util.logToConsole(`Omitting account ${id.fullName} - no mail address`);
          return;
        }
        const menuitem = document.createXULElement("menuitem");
        menuitem.setAttribute("id", "id" + dropdownCount++);
        menuitem.setAttribute("fullName", id.fullName);
        menuitem.setAttribute("value", id.email);
        menuitem.setAttribute("accountKey", account.key);
        menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
        dropdown.appendChild(menuitem);
      } catch (ex) {
        util.logException("appendIdentity failed: ", ex);
      }
    }

    const referrerTxt = getElement("referrer");
    if (window.arguments && window.arguments[1].inn.referrer) {
      referrerTxt.value = window.arguments[1].inn.referrer;
    }

    // iterate accounts
    const isAllowAlias = SmartTemplate4.Preferences.getMyBoolPref(
      "licenser.forceSecondaryIdentity"
    );
    const idSelector = getElement("mailIdentity"),
      popup = idSelector.menupopup,
      myAccounts = MailServices.accounts.accounts,
      acCount = myAccounts.length;
    let aliasIdentity = null;

    util.logDebugOptional("identities", `iterating accounts: (${acCount})…`);
    for (let a = 0; a < acCount; a++) {
      const ac = myAccounts[a];
      if (isAllowAlias && !aliasIdentity) {
        aliasIdentity = ac.identities.find(
          (id) => id.email == SmartTemplate4.Util.licenseInfo.email
        );
        if (aliasIdentity && aliasIdentity != ac.defaultIdentity) {
          appendIdentity(popup, aliasIdentity, ac);
        }
      }
      if (ac.defaultIdentity) {
        util.logDebugOptional("identities", `${ac.key}: appending default identity…`);
        appendIdentity(popup, ac.defaultIdentity, ac);
        continue;
      }
      const ids = ac.identities; // array of nsIMsgIdentity
      if (ids) {
        let idCount = ids ? ids.length : 0;
        util.logDebugOptional("identities", `${ac.key}: iterate ${idCount} identities…`);
        for (let i = 0; i < idCount; i++) {
          // populate the dropdown with nsIMsgIdentity details
          let id = ids[i].QueryInterface(Components.interfaces.nsIMsgIdentity);
          if (!id) {continue;}
          appendIdentity(popup, id, ac);
        }
      } else {
        util.logDebugOptional("identities", `Account: ${ac.key}:\n - No identities.`);
      }
    }
    // select first item
    idSelector.selectedIndex = 0;
    this.selectIdentity(idSelector);
    if (prefs.isDebugOption("premium.licenser")) {
      getElement("referrer").setAttribute("collapsed", false);
    }
  },

  // use license_type = 3 for upgrade from Std to Pro
  goPro: function (license_type, isRenew = null) {
    const util = SmartTemplate4.Util,
      prefs = SmartTemplate4.Preferences;
    // redirect to registration site; pass in the feature that brought user here
    // short order process
    if (!isRenew && SmartTemplate4.Util.licenseInfo.isExpired) {
      isRenew = true;
    }
    const isExtend =
      !isRenew &&
      license_type != 3 &&
      SmartTemplate4.Util.licenseInfo.isValid &&
      license_type == SmartTemplate4.Util.licenseInfo.keyType;

    let shortOrder,
      addQuery = "",
      featureName = document.getElementById("referrer").value; // hidden field
    if (isRenew || license_type == 3) {
      featureName = encodeURI(prefs.getStringPref("LicenseKey"));
    }
    switch (license_type) {
      case 0: // pro license
        if (isRenew || isExtend) {
          // RENEWAL
          shortOrder = "https://sites.fastspring.com/quickfolders/instant/smarttemplate4renew";
        } else {
          // NEW
          shortOrder = "https://sites.fastspring.com/quickfolders/instant/smarttemplate4";
        }
        break;

      case 1: // domain license
        if (isRenew || isExtend) {
          // RENEWAL
          shortOrder =
            "https://sites.fastspring.com/quickfolders/product/smarttemplatesdomainrenewal";
        } else {
          // NEW
          shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplate4domain";
        }
        break;

      case 2: // standard license
        if (isRenew || isExtend) {
          // RENEWAL
          shortOrder = "https://sites.fastspring.com/quickfolders/instant/smarttemplateStdrenew"; // product to be created
        } else {
          // NEW
          shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplatestandard";
        }
        break;

      case 3: // upgrade pro to standard
        shortOrder = "https://sites.fastspring.com/quickfolders/product/smarttemplateupgrade"; // product to be created
        break;
    }
    // view product detail
    const firstName = document.getElementById("firstName").value,
      lastName = document.getElementById("lastName").value,
      email = document.getElementById("email").value,
      url =
        shortOrder +
        `?contact_fname=${firstName}&contact_lname=${lastName}` +
        addQuery + `&contact_email=${email}`;

    let queryString = ""; // action=adds
    if (featureName) {
      queryString = "&referrer=" + featureName;
    }
    util.openLinkInBrowser(null, url + queryString);
    window.close();
  },

  /* obsolete form submission from code */
  postForm: function() {
    let url = "https://sites.fastspring.com/quickfolders/product/smarttemplate4?action=order",
      oReq;

    const XMLHttpRequest = Components.Constructor(
      "@mozilla.org/xmlextras/xmlhttprequest;1",
      "nsIXMLHttpRequest"
    );
    oReq = new XMLHttpRequest();

    let formData = new FormData();
    formData.append("submit", "purchase");
    oReq.open("POST", url, true);
    oReq.send(formData);
  },

  premiumInfo: function (event) {
    SmartTemplate4.Util.openURLWithEvent(
      "https://smarttemplates.quickfolders.org/premium.html",
      event
    );
  },

  sanitizeName: function sanitizeName(name) {
    // remove bracketed stuff: "fred jones (freddy)" => "fred jones"
    let x = name.replace(/ *\([^)]*\) */g, "");
    if (x.trim) {return x.trim();}
    return x;
  },

  selectIdentity: function selectIdentity(element) {
    // get selectedItem attributes
    let it = element.selectedItem,
      fName = Register.sanitizeName(it.getAttribute("fullName")),
      email = it.getAttribute("value"),
      names = fName.split(" ");
    document.getElementById("firstName").value = names[0];
    document.getElementById("lastName").value = names.length > 1 ? names[names.length - 1] : "";
    document.getElementById("email").value = email;
  },
};


// initialize the dialog and do l10n
window.document.addEventListener('DOMContentLoaded', 
  Register.l10n.bind(Register) , 
  { once: true });
window.addEventListener('load', 
  Register.load.bind(Register) , 
  { once: true });
