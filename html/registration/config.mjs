// Add-on-specific metadata and routes. No prices or calculated release ages.
export const registrationConfig = Object.freeze({
  firstReleaseDate: "2011-08-09",
  editions: ["standard", "pro", "domain"],
  extensionPromptDays: 30,
  comparisonURL: "https://smarttemplates.quickfolders.org/premium.html#featureComparison",
  shopBase: "https://sites.fastspring.com/quickfolders/",
  products: {
    standard: { buy: "product/smarttemplatestandard", renew: "instant/smarttemplateStdrenew" },
    pro: { buy: "instant/smarttemplate4", renew: "instant/smarttemplate4renew" },
    domain: { buy: "product/smarttemplate4domain", renew: "product/smarttemplatesdomainrenewal" },
    upgrade: "product/smarttemplateupgrade",
  },
});
