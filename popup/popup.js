/* BEGIN LICENSE BLOCK

SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
/*
  globals
    SALE_END_DATE,
    getSaleEndLabel,
*/


/* shared module for installation popups */

function moveImportantMessageTo(targetId) {
  const newsImportant = document.getElementById("newsImportant");
  const target = document.getElementById(targetId);
  if (!newsImportant || !target) {return;}
  if (!newsImportant.textContent.trim()) {return;}

  // Try specialOfferTerms inside target, fallback to specialOfferRenewTxt or insert at end
  let insertAfter =
    target.querySelector("#specialOfferTerms") || target.querySelector("#specialOfferRenewTxt");

  if (insertAfter) {
    insertAfter.insertAdjacentElement("afterend", newsImportant);
  } else {
    target.appendChild(newsImportant);
  }
  // Make it visible in case it isn't:
  newsImportant.hidden = false;
}

// eslint-disable-next-line no-unused-vars
function openSupportForm(topic) {
  const msg = {
    command: "openPrefs",
    page: "supportEmail",
  };
  if (topic) {msg.topic = topic;}
  messenger.runtime.sendMessage(msg);
}

async function getSalesEnd() {
  const { debug = {} } = await browser.storage.local.get({ debug: {} });
  const overrideSale = debug.saleDate;
  if (overrideSale) {
    return new Date(overrideSale);
  }
  // SALE_END_DATE is currently defined in sales.js
  return new Date(SALE_END_DATE.getTime() + 86400000); 
}	


function hide(id) {
  let el = document.getElementById(id);
  if (!el) {return null;}
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
  if (!el) {return null;}
  el.hidden = false; // Use property instead of removeAttribute
  return el;
}

function showSelectorItems(cId) {
  let elements = document.querySelectorAll(cId);
  for (let el of elements) {
    el.hidden = false; // Use property instead of removeAttribute
  }
}

function hideAllOfferSections() {
  hide("specialOffer");
  hide("standardLicense");
  hide("specialOfferRenew");
}

function showSpecialOfferItem(targetId) {
  hide("newsHead");
  hide("newsIntro");
  // hide("newsImportant"); - will be moved
  hide("news-license");
  moveImportantMessageTo(targetId);
  show(targetId); // 'specialOfferRenew'
}

function showSalesItems(isSale, licenseInfo) {
  const isStandardUser = licenseInfo.keyType == 2;
  const isProUser = licenseInfo.keyType == 0 || licenseInfo.keyType == 1;
  let isActionList = true;

  // Always reset offer sections first
  hideAllOfferSections();
  hideSelectorItems(".standardUpgradeSale");

  if (!isSale) {
    // No special offer active: hide special offer related UI only
    hideSelectorItems(".standardUpgradeSale");
  }

  // isValid, isExpired
  if (licenseInfo.isValid || licenseInfo.isExpired) {
    hide("purchaseLicenseListItem");
    hideSelectorItems(".donations");
    hide("register");

    if (isStandardUser) {
      if (isSale) {
        showSelectorItems(".standardUpgradeSale");
        showSpecialOfferItem(); // remove newsHeader and detail
      } else {
        hide("offerStandardUpgrade");
        show("upgrade");
      }
    }
  }

  // License Renewal
  if (licenseInfo.isExpired) {
    hide("extendLicenseListItem");
    hide("extend");
    if (isProUser && isSale) {
      showSpecialOfferItem("specialOfferRenew");
    }
    if (isStandardUser && isSale) {
      // this contains a button to upgrade
      showSpecialOfferItem("standardLicense");
    }
    show("renewLicenseListItem");
    show("renew");

    hide("purchaseHeader");
    hide("whyPurchase");
    hide("support-suggestion");
    isActionList = false;
    return isActionList;
  }

  // isValid, isExpired
  if (licenseInfo.isValid) {
    hide("renewLicenseListItem");
    hide("renew");

    if (isStandardUser) {
      show("standardLicense");
      hide("renewstandard");
      hide("purchaseHeader");
      hide("whyPurchase");

      if (isSale && (licenseInfo.licensedDaysLeft <= 10)) {
        // this contains a button to upgrade
        showSpecialOfferItem("standardLicense");
        show("renewstandard");
      } 
      isActionList = false;
      return isActionList;
    }

    // Pro users from here:
    if (licenseInfo.isValid && licenseInfo.licensedDaysLeft <= 10) {
      showSpecialOfferItem("specialOfferRenew");
      hide("purchaseSection");
    }

    // License extension (with minimal time)
    let gpdays = licenseInfo.licensedDaysLeft;
    if (gpdays < 40) {
      // they may have seen this popup. Only show extend License section if it is < 40 days away
      show("extendLicenseListItem");
      show("extend");
      return isActionList;
    }

    hide("news-license");
    // hide("newsSection");
    show("licenseExtended");
    // hide('time-and-effort');
    hide("purchaseHeader");
    hide("whyPurchase");
    hide("extendLicenseListItem");
    hide("extend");
    isActionList = false;
    return isActionList;
  }

  // invalid license / no license
  if (isSale && (isStandardUser || !licenseInfo.isValid)) {
    showSpecialOfferItem("specialOffer");
    hideSelectorItems(".donations");
    hide("whyPurchase");
    isActionList = false;
  }

  // Pro license, about to expire
  return isActionList;
}

/**
 * replaceNested
 * Replaces all `{+id}` placeholders in a string with their corresponding
 * localized messages from `messenger.i18n.getMessage(id)`.  
 * Supports nested placeholders by repeatedly resolving until no more changes occur,
 * with a maximum loop limit to avoid infinite recursion.
 *
 * @param {string} text - The input string containing `{+id}` placeholders.
 * @returns {string} - The string with all `{+id}` placeholders replaced.
 */
function replaceNested(text) {
  let result = text;
  const maxLoops = 5; // prevent infinite recursion

  for (let i = 0; i < maxLoops; i++) {
    let changed = false;

    result = result.replace(/\{\+([\w.]+)\}/g, (_, id) => {
      // replace is streaming results from 1st capturing group:
      // (fullMatch, group1, index, originalString)
      const replacement = messenger.i18n.getMessage(id) || `{+${id}}`;
      console.log("replaceNested callback called:", { id, replacement });
      if (replacement !== `{+${id}}`) {
        changed = true;
      }
      return `{i}${replacement}{/i}`;
    });

    if (!changed) {
      break;
    }
  }

  return result;
}

function specialAttributes(str, content) {
  if (!str) {
    return "";
  }

  let out = [];
  let title;

  for (const p of str.split(/\s+/)) {
    const [k, v] = p.split("=");

    if (!k || !v) {
      continue;
    }

    if (k === "class" && v.includes("maintenance")) {
      // for class=maintenance the tag contains the maintenance version number!
      const tooltip = messenger.i18n.getMessage("whats-new-maintenance", [content]);
      title = `title="${tooltip}"`;
    }

    out.push(`${k}="${v}"`);
  }
  if (title) {
    out.push(title);
  }

  return out.join(" ");
}

function formatAll(txt) {
  let localizedMsg = replaceNested(txt)
    .replace(/<(.*?)>/g, "<span class='htmltag'>&lt;$1&gt;</span>")
    .replace(
      // eslint-disable-next-line no-useless-escape
      /\{support(?: ([\w\-]+))?\}/g,
      (dummy, topic) => `<a class='contactsupport' data-topic='${topic || ""}' href='#'>`
    )
    .replace(/\{\/support\}/g, "</a>");


  let  salesEnd =  "";
  if (typeof getSaleEndLabel === "function") {
    salesEnd = getSaleEndLabel();
  } 

  // added simple <tag> support
  return localizedMsg
    .replace(/\{L(?:\s+([^}]+))?\}/g, (_, attrs) => {
      // attrs will be undefined if no class specified
      return attrs ? `<li ${attrs}>` : "<li>";
    })
    .replace(/\{\/L\}/g, "</li>")
    .replace(/\{salesEnd\}/g, salesEnd)
    .replace(/\{h3\}/g, "<h3>")
    .replace(/\{\/h3\}/g, "</h3>")
    .replace(/\{bold\}/g, "<b>")
    .replace(/\{\/bold\}/g, "</b>")
    .replace(/\{b(?:\s+([^}]+))?\}(.*?)\{\/b\}/g, (_, attrs, content) => {
      const attrStr = attrs ? specialAttributes(attrs, content) : "";
      return attrStr ? `<b ${attrStr}>${content}</b>` : `<b>${content}</b>`;
    })
    .replace(/\{hr\}/g, "<hr>")
    .replace(/\{pre\}/g, "<pre>")
    .replace(/\{preEnd\}/g, "</pre>")
    .replace(/\{i\}/g, "<i>")
    .replace(/\{\/i\}/g, "</i>")
    .replace(/\{\{(%.*?%)\}\}/g, "<code>$1</code>")
    .replace(/\{\{(.*?)\}\}/g, "<code param>$1</code>")
    .replace(/\{U\}/g, "<ul>")
    .replace(/\{\/U\}/g, "</ul>")
    .replace(/\{P(?:\s+([^}]+))?\}/g, (_, attrs) => {
      // attrs will be undefined if no class specified
      return attrs ? `<p ${attrs}>` : "<p>";
    })
    .replace(
      /\{ARelease\}/g,
      "<a href='https://blog.thunderbird.net/2025/03/thunderbird-release-channel-update/'>"
    )
    .replace(
      /\{AcompatCheck\}/g,
      "<a href='https://addons.thunderbird.net/thunderbird/addon/addon-compatibility-check/' class='native'>"
    )
    .replace("$news.minimal$", messenger.i18n.getMessage("news.minimal"))
    .replace(/\{\/A\}/g, "</a>")
    .replace(/\{\/P\}/g, "</p>")
    .replace(/\{br\}/g, "<br>")
    .replace(/\{S1\}/g, "</ul> <h3 class='section'>")
    .replace(/\{S2\}/g, "</h3> <ul>")
    .replace(/\[issue (\d*)\]/g, "<a class='issue' no='$1' href='#'>[issue $1]</a>")
    .replace(/\[Bugzilla (\d*)\]/g, "<a class='bugzilla' no='$1' href='#'>[Bugzilla $1]</a>")
    .replace(/\[(.)\]/g, "<code class='keystroke'>$1</code>") // single keys [A] [1]
    .replace(/\[\[([^\]]+)\]\]/g, "<code class='keystroke'>$1</code>"); // larger keys [[Cancel]] [[Ctrl]]
    // DANGEROUS .replaceAll("''", '"');
  //{S1} new section / list with title {S2}.
}

// eslint-disable-next-line no-unused-vars
async function insertLocalizedMessage(element, rawMessage) {
  try {
    const html = formatAll(rawMessage); // Expand custom tags into HTML
    const fragment = parseHTMLFragment(html); // Safely parse into a DocumentFragment
    element.textContent = ""; // Clear existing content

    if (!(await isSale())) {
      const salesElements = fragment.querySelectorAll(".specialOffer");
      for (const e of salesElements) {
        e.remove(); // Safely remove element from fragment
      }
    }
        
    element.appendChild(fragment); // Inject parsed content
  } catch (ex) {
    console.error("Failed to parse localized message:", ex);
    element.textContent = rawMessage; // Fallback: insert raw text only
  }
}

// replace unsafe innerHTML injections
// note: this will add closing tags and other markup ,e.g. <tr> or <table>
function parseHTMLFragment(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Spread childNodes to an array to avoid live list mutation issues
  const nodes = [...doc.body.childNodes];
  const fragment = document.createDocumentFragment();
  // appendChild moves nodes from doc.body to fragment (not cloned)
  nodes.forEach((node) => fragment.appendChild(node));
  return fragment;
}

// copy a html structure into [multiple] elements
// eslint-disable-next-line no-unused-vars
function updateWithSafeHtml(selector, htmlString) {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    el.textContent = "";
    el.appendChild(parseHTMLFragment(htmlString));
  }
}


async function isSale() {
  const currentTime = new Date();
  const endDate = await getSalesEnd(); // uses SALE_END_DATE
  const isSale = currentTime < endDate;
  return isSale;
}

// eslint-disable-next-line no-unused-vars
async function updateActions(addonName) {
  let licenseInfo;
  try {
    // create a fallback in case background is not ready (rare occurrence)
    licenseInfo = await messenger.runtime.sendMessage({ command: "getLicenseInfo" });
  } catch (e) {
    console.warn("SmartTemplates License fetch failed, using fallback:", e);
    // fallback: pretend a valid Pro license to avoid showing too many irrelevant items
    licenseInfo = {
      status: 1, // valid
      description: "Temporary fallback Pro license",
      licensedDaysLeft: 365,
      expiredDays: 0,
      expiryDate: null,
      email: "",
      licenseKey: "",
      decryptedPart: "",
      keyType: 0, 
      isValid: true,
      isExpired: false,
      graceDate: null,
      trialDays: 0,
    };    
  }
  
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
  if (win) {console.log(win);}
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

// eslint-disable-next-line no-unused-vars
function hideNewsBox() {
  hide("newsSection");
}


// Updates the element's content without triggering announcements by screen readers
// eslint-disable-next-line no-unused-vars
function ariaPoliteUpdate(el, text, isHtml = false) {
  if (!el) {return;}
  
  // Temporarily set the aria-live attribute to "polite"
  el.setAttribute("aria-live", "polite");

  // Update content based on whether it's HTML or plain text
  if (isHtml) {
    el.textContent = ""; // clear existing
    const fragment = parseHTMLFragment(text);
    el.appendChild(fragment);
  } else {
    el.innerText = text;
  }

  // Remove the aria-live attribute after the update
  el.removeAttribute("aria-live");
}

// eslint-disable-next-line no-unused-vars
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
