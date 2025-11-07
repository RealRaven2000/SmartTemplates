/* eslint-disable no-unused-vars */
// used in popup.js 
const SALE_END_DATE = new Date("2025-06-13"); // Next Sale End Date (replaces endSale in popup.js)

// used in update.js
const discountRate = {
  discountPro: "33%",
  discountUpgrade: "33%",
  discountRenewal: "25%"
}

const compatibleVer = "145.*"; // Thunderbird for newsSection

// eslint-disable-next-line no-unused-vars
function getSaleEndLabel() {
  // format date based on user’s locale
  const now = new Date();
  const endSale = new Date(SALE_END_DATE);
  const includeYear = endSale.getFullYear() !== now.getFullYear();
  const dateOptions = includeYear
    ? { month: "long", day: "numeric", year: "numeric" }
    : { month: "long", day: "numeric" };
  return endSale.toLocaleDateString(messenger.i18n.getUILanguage(), dateOptions);
}