/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/* shared module for installation popups */

// import { sales_end } from "./sales.js";

async function getSalesEnd() {
  const overrideSale = await messenger.LegacyPrefs.getPref(
    "extensions.smartTemplate4.debug.saleDate"
  );
  if (overrideSale) {
    return new Date(overrideSale);
  }
  // sales_end is currently defined in sales.js
  return new Date(sales_end.getTime() + 86400000);
}	


function hide(id) {
  let el = document.getElementById(id);
  if (!el) return null;
  el.hidden = true; // Use property instead of setAttribute
  return el;
}

function hideSelectorItems(cId) {
  let elements = document.querySelectorAll(cId);
  for (let el of elements) {
    el.hidden = true; 
  }
}

function show(id) {
  let el = document.getElementById(id);
  if (!el) return null;
  el.hidden = false; // Use property instead of removeAttribute
  return el;
}

function showSelectorItems(cId) {
  let elements = document.querySelectorAll(cId);
  for (let el of elements) {
    el.hidden = false; // Use property instead of removeAttribute
  }
}


function showSpecialOfferItem(id) {
  show(id);  // 'specialOfferRenew'
  hide('newsHead');
  hide('newsDetail');
  hide('news-license');
}

function showSalesItems(isSale, licenseInfo) {
  const isStandardUser = (licenseInfo.keyType == 2);
  const isProUser = (licenseInfo.keyType == 0 || licenseInfo.keyType == 1);
  let isActionList = true;

  if (!isSale) { 
    hide('specialOffer');
    hideSelectorItems('.standardUpgradeSale');
  }

  // isValid, isExpired
  if (licenseInfo.isValid || licenseInfo.isExpired) {
    hide('purchaseLicenseListItem');
    hideSelectorItems('.donations');
    hide('register');
    
    if (isStandardUser) {
      if (isSale) {
        showSelectorItems('.standardUpgradeSale');
        showSpecialOfferItem(); // remove newsHeader and detail
      } else {
        hide("offerStandardUpgrade");
        show("upgrade");
      }
    }
  }
    
  // License Renewal
  if (licenseInfo.isExpired) { 
    hide('extendLicenseListItem');
    hide('extend');
    if (isProUser && isSale) {
      showSpecialOfferItem('specialOfferRenew');
    }
    if (isStandardUser && isSale) {
      // this contains a button to upgrade
      showSpecialOfferItem("standardLicense");
    }    
    show('renewLicenseListItem');
    show('renew');

    hide('purchaseHeader');
    hide('whyPurchase');
    hide('support-suggestion');
    isActionList = false;
    return isActionList;
  }  

  // isValid, isExpired
  if (licenseInfo.isValid || licenseInfo.isExpired) {

    hide('renewLicenseListItem');
    hide('renew');

    if (isStandardUser) {
      show('standardLicense'); 
      hide('purchaseHeader');
      hide('whyPurchase');

      if (isSale && 
          (licenseInfo.isExpired || licenseInfo.licensedDaysLeft<=10)
      ) {
        // this contains a button to upgrade
        showSpecialOfferItem("standardLicense");
        show("renewstandard");
      }  
      isActionList = false;
      return isActionList;
    } 

    // Pro users from here:

    if (licenseInfo.isValid && licenseInfo.licensedDaysLeft<=10) {
      showSpecialOfferItem('specialOfferRenew');
      hide('purchaseSection');
    }  

    // License extension (with minimal time)
    let gpdays = licenseInfo.licensedDaysLeft;
    if (gpdays<40) { // they may have seen this popup. Only show extend License section if it is < 40 days away
      show('extendLicenseListItem');
      show('extend');
      return isActionList;
    }

    hide('news-license');
    hide('newsSection');
    show('licenseExtended');
    // hide('time-and-effort');
    hide('purchaseHeader');
    hide('whyPurchase');
    hide('extendLicenseListItem');
    hide('extend');
    isActionList = false;
    return isActionList;
  } 

  // invalid license / no license
  if (!licenseInfo.isValid && isSale) { 
    showSpecialOfferItem('specialOffer');
    hideSelectorItems('.donations');
    hide('whyPurchase');
    isActionList = false;
  }

  // Pro license, about to expire
  return isActionList;
 
}

function formatAll(txt) {
  let localizedMsg = txt.replace(/<(.*?)>/g, "<span class='htmltag' />&lt;$1&gt;</span>");
  // added simple <tag> support
  return localizedMsg
    .replace(/\{boldStart\}/g, "<b>")
    .replace(/\{boldEnd\}/g, "</b>")
    .replace(/\{hr\}/g, "<hr>")
    .replace(/\{italicStart\}/g, "<i>")
    .replace(/\{italicEnd\}/g, "</i>")
    .replace(/\{\{(%.*?%)\}\}/g, "<code>$1</code>")
    .replace(/\{\{(.*?)\}\}/g, "<code param>$1</code>")
    .replace(/\{L1\}/g, "<li>")
    .replace(/\{L2\}/g, "</li>")
    .replace(/\{P1\}/g, "<p>")
    .replace(/\{P2\}/g, "</p>")
    .replace(/\{S1\}/g, "</ul> <h3 class='section'>")
    .replace(/\{S2\}/g, "</h3> <ul>")
    .replace(/\[issue (\d*)\]/g, "<a class=issue no=$1 href='#'>[issue $1]</a>")
    .replace(/\[(.)\]/g, "<code class='keystroke'>$1</code>") // single keys
    .replaceAll("''", '"');
  //{S1} new section / list with title {S2}.
}


async function isSale() {
  const currentTime = new Date();
  const endDate = await getSalesEnd(); // uses sales_end
  const isSale = currentTime < endDate;
  return isSale;
}

async function updateActions(addonName) {
  let licenseInfo = await messenger.runtime.sendMessage({command: "getLicenseInfo"});
  
  // LICENSING FLOW
  let isStandardUser = (licenseInfo.keyType == 2);

  // renew-your-license - already collapsed
  // renewLicenseListItem - already collapsed
  // purchaseLicenseListItem - not collapsed
  hide('licenseExtended');
  if (!isStandardUser) {
    hide('standardLicense');
  }
  
  hideSelectorItems('.donations');
  
  let isActionList = showSalesItems(await isSale(), licenseInfo);
  if (!isActionList) {
    hide('actionBox');
  } 

  let animation = document.getElementById('gimmick');
  if (animation) {
    animation.parentNode.removeChild(animation);
  }
  
  // resize to contents if necessary...
  if (window.sizeToContent) {
    window.sizeToContent(); // not supported anymore in content scripts...
  }

  let win = await browser.windows.getCurrent();
  if (win) console.log(win);
  let wrapper = document.getElementById('innerwrapper'),
      r = wrapper.getBoundingClientRect(),
      newHeight = Math.round(r.height) + 80,
      maxHeight = window.screen.availHeight;
      
  const isPopup = (window.opener != null);
  if (isPopup) {
    if (newHeight > maxHeight) {
      newHeight = maxHeight - 15;
    }
    browser.windows.update(win.id, { height: newHeight });
  }
  
}

// Updates the element's content without triggering announcements by screen readers
function ariaPoliteUpdate(el, text, isHtml = false) {
  if (!el) return;
  
  // Temporarily set the aria-live attribute to "polite"
  el.setAttribute("aria-live", "polite");

  // Update content based on whether it's HTML or plain text
  if (isHtml) {
    el.innerHTML = text;
  } else {
    el.innerText = text;
  }

  // Remove the aria-live attribute after the update
  el.removeAttribute("aria-live");
}

function addAriaHint() {
  const splashHint = document.getElementById("splash-hint");
  // Temporarily remove aria-hidden to make the hint accessible for screen readers
  splashHint.removeAttribute("aria-hidden");

  setTimeout(() => {
    splashHint.textContent = `${browser.i18n.getMessage("aria.escape")}`;

    // Optionally, re-hide it after a brief time if it's not meant to stay visible
    setTimeout(() => {
      splashHint.setAttribute("aria-hidden", "true");
    }, 3000); // Adjust delay time as needed
  }, 300); // Slight delay to let the title be read first
}
