import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { loadRegistrationData, openLicenseSettings } from "../html/registration/adapter.mjs";
import { openRegistrationTab, openRegistrationFromSettings } from "../html/registration/open-tab.mjs";
import { openCheckout } from "../html/registration/checkout.mjs";
import { registrationConfig as config } from "../html/registration/config.mjs";
import { buildCheckoutURL, contactFromIdentity, deriveActions, identityOptionLabels, selectIdentities } from "../html/registration/model.mjs";

const license = (status, keyType, extra = {}) => ({ status, keyType, licenseKey: "TEST + & %", licensedDaysLeft: 360, ...extra });
const actionFor = (state, edition, options) => deriveActions(state, config, options).find((action) => action.edition === edition);

test("identity labels add names only for ambiguous account/email pairs", () => {
  const identities = [
    { id: "id1", accountName: "Work", email: "alex@example.com", name: "Alex" },
    { id: "id2", accountName: "Home", email: "alex@example.com", name: "Alex" },
    { id: "id3", accountName: "Work", email: "alex@example.com", name: "Alex Support" },
    { id: "id4", accountName: "Other", email: "other@example.com", name: "Other" },
  ];
  assert.deepEqual(identityOptionLabels(identities), [
    "Work · alex@example.com (Alex)",
    "Home · alex@example.com",
    "Work · alex@example.com (Alex Support)",
    "Other · other@example.com",
  ]);
  const sameName = [{ ...identities[0] }, { ...identities[0], id: "id5" }];
  assert.equal(new Set(identityOptionLabels(sameName)).size, 2);
  assert.deepEqual(identityOptionLabels([]), []);
});

test("background creates/reuses registration then focuses its owning window", async () => {
  const url = "moz-extension://test-id/html/registration/registration.html";
  for (const existing of [[], [{ id: 42 }]]) {
    const calls = [];
    const tab = { id: 42, windowId: 7 };
    const api = {
      runtime: { getURL: (path) => {
        assert.equal(path, "html/registration/registration.html");
        return url;
      } },
      tabs: {
        query: async (query) => {
          assert.deepEqual(query, { url: url + "*" });
          return existing;
        },
        create: async (options) => { calls.push(["create", options]); return tab; },
        update: async (id, options) => { calls.push(["update", id, options]); return tab; },
      },
      windows: { update: async (id, options) => calls.push(["focus", id, options]) },
    };
    assert.equal(await openRegistrationTab(api), tab);
    assert.deepEqual(calls, [
      existing.length ? ["update", 42, { active: true, url }] : ["create", { active: true, url }],
      ["focus", 7, { focused: true }],
    ]);
  }
});

test("current edition uses renewal route and Standard extension respects the expiry window", () => {
  for (const [keyType, edition] of [[0, "pro"], [1, "domain"], [2, "standard"]]) {
    assert.equal(actionFor(license("Expired", keyType), edition).kind, "renew");
    assert.equal(actionFor(license("Expired", keyType), edition).route, config.products[edition].renew);
    assert.equal(actionFor(license("Valid", keyType, { licensedDaysLeft: 29 }), edition, { intent: "extend" }).kind,
      edition === "domain" ? "renew" : "extend");
  }
  assert.equal(actionFor(license("Valid", 2), "standard").available, false);
  assert.equal(actionFor(license("Valid", 2, { licensedDaysLeft: 29 }), "standard").kind, "extend");
  assert.equal(actionFor(license("Valid", 2, { licensedDaysLeft: 30 }), "standard").kind, "current");
  assert.equal(actionFor(license("Valid", 2), "pro").kind, "upgrade");
});

test("Settings closes only after registration opens and forwards early-extension intent", async () => {
  const calls = [];
  const api = {
    tabs: {
      getCurrent: async () => ({ id: 11 }),
      remove: async (id) => calls.push(["close", id]),
    },
    runtime: { sendMessage: async (request) => {
      calls.push(["open", request]);
      return { id: 22 };
    } },
  };
  await openRegistrationFromSettings(api, { feature: "licenseTab", intent: "extend" });
  assert.deepEqual(calls, [
    ["open", { command: "openRegistrationTab", feature: "licenseTab", intent: "extend" }],
    ["close", 11],
  ]);
  for (const result of [undefined, { id: 11 }]) {
    calls.length = 0;
    api.runtime.sendMessage = async () => result;
    if (result) {
      await openRegistrationFromSettings(api);
    } else {
      await assert.rejects(openRegistrationFromSettings(api), /did not open/);
    }
    assert.equal(calls.length, 0);
  }
  api.runtime.sendMessage = async () => { throw new Error("Tab creation failed"); };
  await assert.rejects(openRegistrationFromSettings(api), /Tab creation failed/);
  assert.equal(calls.length, 0);
});

test("background preserves feature and explicit intent when reusing registration", async () => {
  let opened;
  const api = {
    runtime: { getURL: () => "moz-extension://test-id/html/registration/registration.html" },
    tabs: {
      query: async ({ url }) => {
        assert.equal(url, "moz-extension://test-id/html/registration/registration.html*");
        return [{ id: 22 }];
      },
      update: async (id, options) => { opened = { id, windowId: 7, ...options }; return opened; },
    },
    windows: { update: async () => {} },
  };
  await openRegistrationTab(api, { feature: "licenseTab & other", intent: "extend" });
  const url = new URL(opened.url);
  assert.equal(url.searchParams.get("feature"), "licenseTab & other");
  assert.equal(url.searchParams.get("intent"), "extend");
});

test("new users buy; unavailable downgrade actions never become checkout URLs", () => {
  assert.ok(deriveActions({ status: "Empty" }, config).every((action) => action.kind === "buy" && action.available));
  assert.equal(actionFor(license("Expired", 2), "pro").available, true);
  assert.equal(actionFor(license("Valid", 0), "domain").available, true);
  assert.equal(actionFor(license("Valid", 1), "standard").hidden, true);
  assert.throws(() => buildCheckoutURL(actionFor(license("Valid", 1), "standard"), {}, {}, config));
});

test("Domain holders renew before or after expiry; personal Pro is a separate new purchase", () => {
  for (const status of ["Valid", "Expired"]) {
    const state = license(status, 1);
    const renewal = actionFor(state, "domain");
    assert.equal(renewal.kind, "renew");
    const renewalURL = buildCheckoutURL(renewal, {}, state, config);
    assert.equal(renewalURL.pathname, "/quickfolders/product/smarttemplatesdomainrenewal");
    assert.equal(renewalURL.searchParams.get("referrer"), state.licenseKey);
    const personal = actionFor(state, "pro");
    assert.equal(personal.hidden, false);
    assert.equal(personal.kind, "buy");
    const personalURL = buildCheckoutURL(personal, {}, state, config);
    assert.equal(personalURL.pathname, "/quickfolders/instant/smarttemplate4");
    assert.equal(personalURL.searchParams.has("referrer"), false);
  }
});

test("fresh Standard hides its card until near expiry, including for an extension request", () => {
  const state = license("Valid", 2);
  assert.equal(actionFor(state, "standard").hidden, true);
  assert.equal(actionFor({ ...state, licensedDaysLeft: 6 }, "standard").hidden, false);
  assert.equal(deriveActions(state, config, { intent: "extend" })[0].hidden, true);
});

test("personal-license holders buy Domain through the new-license product regardless of expiry", () => {
  const contact = { firstName: "Alex", lastName: "Morgan", email: "alex@example.com" };
  for (const status of ["Valid", "Expired"]) {
    for (const keyType of [0, 2]) {
      const state = license(status, keyType);
      const action = actionFor(state, "domain");
      assert.equal(action.kind, "buy");
      assert.equal(action.available, true);
      const url = buildCheckoutURL(action, contact, state, config);
      assert.equal(url.pathname, "/quickfolders/product/smarttemplate4domain");
      assert.equal(url.searchParams.has("referrer"), false);
    }
  }
});

test("live checkout opens the encoded shop URL; synthetic scenarios never open it", async () => {
  const state = license("Expired", 2);
  const contact = { firstName: "Éva & Alex", lastName: "García", email: "eva+tag@example.com" };
  const options = { action: actionFor(state, "pro"), contact, license: state, config };
  const opened = [];
  const api = { windows: { openDefaultBrowser: async (url) => opened.push(url) } };
  assert.equal(await openCheckout({ ...options, preview: true }, api), false);
  assert.equal(opened.length, 0);
  assert.equal(await openCheckout(options, api), true);
  assert.equal(opened.length, 1);
  const url = new URL(opened[0]);
  assert.equal(url.pathname, "/quickfolders/product/smarttemplateupgrade");
  assert.equal(url.searchParams.get("referrer"), state.licenseKey);
  assert.equal(url.searchParams.get("contact_email"), contact.email);
  const failing = { windows: { openDefaultBrowser: async () => { throw new Error("Browser unavailable"); } } };
  await assert.rejects(openCheckout(options, failing), /Browser unavailable/);
});

test("checkout encodes raw contact and referrer exactly once and prioritizes the previous license", () => {
  const state = license("Expired", 0);
  const contact = { firstName: "Éva & Alex", lastName: "O'Neil + 50%", email: "eva+tag@example.com" };
  const url = buildCheckoutURL(actionFor(state, "pro"), contact, state, config, "feature");
  assert.equal(url.searchParams.get("contact_fname"), contact.firstName);
  assert.equal(url.searchParams.get("contact_lname"), contact.lastName);
  assert.equal(url.searchParams.get("contact_email"), contact.email);
  assert.equal(url.searchParams.get("referrer"), state.licenseKey);
  const buy = actionFor({ status: "Empty" }, "pro");
  assert.equal(buildCheckoutURL(buy, contact, {}, config, "feature & name").searchParams.get("referrer"), "feature & name");
  assert.equal(buildCheckoutURL(buy, contact, {}, config).searchParams.has("referrer"), false);
  assert.throws(() => buildCheckoutURL(actionFor(state, "pro"), contact, { ...state, licenseKey: "" }, config));
});

test("identity selection preserves default scope, optional alias exception, and empty-account fallback", () => {
  const primary = { id: "p", email: "primary@example.com", name: "Éva María García (work)" };
  const alias = { id: "a", email: "licensed@example.com" };
  const accounts = [{ id: "one", name: "Mail", identities: [primary, alias] }, { id: "none", identities: [] }];
  const state = { keyType: 0, email: alias.email };
  assert.deepEqual(selectIdentities(accounts, { one: primary }, state).map((item) => item.id), ["p"]);
  assert.deepEqual(selectIdentities(accounts, { one: primary }, state, true).map((item) => item.id), ["a", "p"]);
  assert.deepEqual(selectIdentities(accounts, { one: primary }, { ...state, keyType: 1 }, true).map((item) => item.id), ["p"]);
  assert.equal(selectIdentities(accounts, {}, state).length, 2);
  assert.deepEqual(selectIdentities([], {}, state), []);
  assert.deepEqual(contactFromIdentity(primary), { firstName: "Éva", lastName: "García", email: primary.email });
});

test("shared formatter preserves popup output and no longer adds implicit italics", () => {
  const source = readFileSync(new URL("../html/localized-format.js", import.meta.url), "utf8");
  const context = { messenger: { i18n: { getMessage: (id) => ({ extensionName: "SmartTemplates", nested: "Hello {+extensionName}" })[id] || "" } }, console: { log() {} } };
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.equal(context.formatAll("{+extensionName}"), "SmartTemplates");
  assert.equal(context.formatAll("{+nested}"), "Hello SmartTemplates");
  assert.equal(context.formatAll("{i}{+extensionName}{/i}"), "<i>SmartTemplates</i>");
  assert.equal(context.formatAll("{bold}Important{/bold}{br}Next"), "<b>Important</b><br>Next");
  assert.equal(context.formatAll("[issue 445]"), "<a class='issue' no='445' href='#'>[issue 445]</a>");
  assert.equal(context.replaceNested("{+missing}"), "{+missing}");
});

test("registration uses standard placeholders and legacy annotations are documentation only", () => {
  const catalog = JSON.parse(readFileSync(new URL("../_locales/en/messages.json", import.meta.url), "utf8"));
  const html = readFileSync(new URL("../html/registration/registration.html", import.meta.url), "utf8");
  const placeholders = [...html.matchAll(/__MSG_([\w.-]+)__/g)];
  assert.ok(placeholders.length > 40);
  for (const match of placeholders) {
    assert.ok(catalog[match[1]]?.message, match[1]);
    assert.ok(match[1].startsWith("registration."));
  }
  for (const match of html.matchAll(/data-l10n-id="([^"]+)"/g)) {
    assert.ok(catalog[match[1]]?.message, match[1]);
    assert.ok(!match[1].startsWith("registration."));
  }
  const controller = readFileSync(new URL("../html/registration/registration.mjs", import.meta.url), "utf8");
  assert.ok(!controller.includes("dataset.l10nId"));
  assert.ok(!controller.includes("[data-l10n-id"));
});

test("live adapter uses existing license handler and account APIs without traversing folders", async () => {
  const calls = [];
  const identity = { id: "default", name: "Alex Morgan", email: "alex@example.com" };
  globalThis.messenger = {
    runtime: { sendMessage: async (request) => {
      calls.push(request);
      return { status: "Valid", keyType: 0 };
    } },
    accounts: { list: async (folders) => {
      assert.equal(folders, false);
      return [{ id: "account", name: "Mail", identities: [identity] }];
    } },
    identities: { getDefault: async (id) => {
      assert.equal(id, "account");
      return identity;
    } },
    LegacyPrefs: { getPref: async (key, fallback) => {
      assert.equal(key, "extensions.smartTemplate4.licenser.forceSecondaryIdentity");
      assert.equal(fallback, false);
      return false;
    } },
  };
  try {
    const result = await loadRegistrationData();
    assert.equal(result.license.status, "Valid");
    assert.equal(result.identities[0].id, identity.id);
    assert.deepEqual(calls, [{ command: "getLicenseInfo" }]);
    globalThis.messenger.LegacyPrefs.getPref = async () => {
      throw new Error("Preference read failed");
    };
    const fallbackResult = await loadRegistrationData();
    assert.equal(fallbackResult.license.status, "Valid");
    assert.equal(fallbackResult.identities[0].id, identity.id);
  } finally {
    delete globalThis.messenger;
  }
});

test("license entry opens Settings before closing registration and keeps it on failure", async () => {
  const calls = [];
  globalThis.messenger = {
    tabs: {
      getCurrent: async () => ({ id: 44 }),
      remove: async (id) => calls.push(["close", id]),
    },
    runtime: { sendMessage: async (request) => {
      calls.push(["open", request]);
      return { id: 55 };
    } },
  };
  try {
    await openLicenseSettings();
    assert.deepEqual(calls, [["open", { command: "openPrefs", page: "licenseKey" }], ["close", 44]]);
    calls.length = 0;
    messenger.runtime.sendMessage = async () => undefined;
    await assert.rejects(openLicenseSettings(), /did not open/);
    assert.equal(calls.length, 0);
    messenger.runtime.sendMessage = async () => { throw new Error("Settings failed"); };
    await assert.rejects(openLicenseSettings(), /Settings failed/);
    assert.equal(calls.length, 0);
  } finally {
    delete globalThis.messenger;
  }
});
