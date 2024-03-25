/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/* shared module for installation popups */

function hide(id) {
  let el = document.getElementById(id);
  if (el) {
    el.setAttribute('collapsed',true);
    return el;
  }
  return null;
}
function hideSelectorItems(cId) {
  let elements = document.querySelectorAll(cId);
  for (let el of elements) {
    el.setAttribute('collapsed',true);
  }
}
function show(id) {
  let el = document.getElementById(id);
  if (el) {
    el.setAttribute('collapsed',false);
    return el;
  }
  return null;
}
function showSelectorItems(cId) {
  let elements = document.querySelectorAll(cId);
  for (let el of elements) {
    el.setAttribute('collapsed',false);
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
    
    if (isSale && isStandardUser) {
      showSelectorItems('.standardUpgradeSale');
      hide('offerStandardUpgrade');
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


async function updateActions(addonName) {
  let licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  
  // LICENSING FLOW
  let isStandardUser = (licenseInfo.keyType == 2);
        

  // renew-your-license - already collapsed
  // renewLicenseListItem - already collapsed
  // purchaseLicenseListItem - not collapsed
  hide('licenseExtended');
  if (!isStandardUser) {
    hide('standardLicense');
  }
  
  let currentTime = new Date();
  let isSale = (currentTime <= sales_end);

  hideSelectorItems('.donations');
  
  let isActionList = showSalesItems(isSale, licenseInfo);
  if (!isActionList) {
    hide('actionBox');
  } 

  let animation = document.getElementById('gimmick');
  if (animation) {
    animation.parentNode.removeChild(animation);
  }
  
  // resize to contents if necessary...
  window.sizeToContent(); // not supported anymore in content scripts...

  let win = await browser.windows.getCurrent();
  if (win) console.log(win);
  let wrapper = document.getElementById('innerwrapper'),
      r = wrapper.getBoundingClientRect(),
      newHeight = Math.round(r.height) + 80,
      maxHeight = window.screen.availHeight;
      
  if (newHeight>maxHeight) {
    newHeight = maxHeight-15;
  }
  browser.windows.update(win.id, 
    {height: newHeight}
  );
  
}