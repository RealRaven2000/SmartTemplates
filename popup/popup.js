/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/* shared module for installation popups */

async function updateActions(addonName) {
  let licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  
  // LICENSING FLOW
  let isStandardUser = (licenseInfo.keyType == 2),
      isExpired = licenseInfo.isExpired,
      isValid = licenseInfo.isValid;
        
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
  // renew-your-license - already collapsed
  // renewLicenseListItem - already collapsed
  // purchaseLicenseListItem - not collapsed
  hide('licenseExtended');
  if (!isStandardUser) {
    hide('standardLicense');
  }
  
  let isActionList = true;
  let currentTime = new Date(),
      endSale = new Date("2021-08-31"); // Next Sale End Date 
  let isSale = (currentTime < endSale);
  
  if (!isSale) { 
    hide('specialOffer');
    hideSelectorItems('.standardUpgradeSale');
  }

  if (isValid || isExpired) {
    hide('purchaseLicenseListItem');
    hideSelectorItems('.donations');
    hide('register');
    
    if (isSale && isStandardUser) {
      showSelectorItems('.standardUpgradeSale');
      hide('offerStandardUpgrade');
    }
    
    if (isExpired) { // License Renewal
      hide('extendLicenseListItem');
      hide('extend');
      show('renewLicenseListItem');
      show('renew');
    }
    else { // License Extension
      hide('renewLicenseListItem');
      hide('renew');
      if (isStandardUser) {
        show('standardLicense'); // this contains a button to upgrade
        hide('purchaseHeader');
        hide('whyPurchase');
        isActionList = false;
      }
      else {
        let gpdays = licenseInfo.licensedDaysLeft;
        if (gpdays<40) { // they may have seen this popup. Only show extend License section if it is < 40 days away
          show('extendLicenseListItem');
          show('extend');
        }
        else {
          show('licenseExtended');
	        hide('time-and-effort');
	        hide('purchaseHeader');
	        hide('whyPurchase');
          hide('extendLicenseListItem');
          hide('extend');
          isActionList = false;
        }
      }
    }
  }
  else {
    if (isSale && !isValid) { // not shown with Standard license either.
      show('specialOffer');
      hideSelectorItems('.donations');
      hide('whyPurchase');
			isActionList = false;
    }
  }  
  if (!isActionList) {
    hide('actionBox');
  }  

  let animation = document.getElementById('gimmick');
  if (animation)
    animation.parentNode.removeChild(animation);
  
  // resize to contents if necessary...
  let win = await browser.windows.getCurrent(),
      wrapper = document.getElementById('innerwrapper'),
      r = wrapper.getBoundingClientRect(),
      newHeight = Math.round(r.height) + 80,
      maxHeight = window.screen.height;
      
  if (newHeight>maxHeight) newHeight = maxHeight-15;
  browser.windows.update(win.id, 
    {height: newHeight}
  );
  
}