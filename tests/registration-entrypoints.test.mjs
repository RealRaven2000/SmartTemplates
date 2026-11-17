import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { openRegistrationTab } from "../html/registration/open-tab.mjs";

function popup(file, { existing = false, fail = false, response } = {}) {
  let click;
  let closes = 0;
  const requests = [];
  const tabs = [];
  const focusedWindows = [];
  const api = {
    runtime: {
      getURL: path => "moz-extension://test-id/" + path,
      async sendMessage(request) {
        requests.push(request);
        assert.equal(request.command, "openRegistrationTab");
        if (fail) { throw new Error("Registration unavailable"); }
        if (response === "missing") { return undefined; }
        return openRegistrationTab(api, request);
      },
    },
    tabs: {
      query: async () => existing ? [{ id: 42 }] : [],
      create: async options => { tabs.push(options); return { id: 43, windowId: 7 }; },
      update: async (id, options) => { tabs.push({ id, ...options }); return { id, windowId: 8 }; },
    },
    windows: { update: async (id, options) => { focusedWindows.push({ id, ...options }); } },
  };
  vm.runInNewContext(readFileSync(new URL(`../popup/${file}.js`, import.meta.url), "utf8"), {
    addEventListener(type, handler) { if (type === "click") { click = handler; } },
    window: { addEventListener() {}, close() { closes++; } },
    messenger: api,
  });
  return {
    click: id => click({ preventDefault() {}, target: { id, classList: { contains: () => false } } }),
    requests, tabs, focusedWindows, closes: () => closes,
  };
}

test("splash purchase, renewal, upgrade and extension actions open/reuse modern registration before closing", async () => {
  for (const [file, ids] of [
    ["installed", ["extend", "renew", "upgrade"]],
    ["update", ["register", "extend", "renew", "upgrade", "bargainIcon", "bargainRenewIcon", "bargainUpgradeIcon"]],
  ]) {
    for (const id of ids) {
      for (const existing of [false, true]) {
        const f = popup(file, { existing });
        const opening = f.click(id);
        assert.equal(f.closes(), 0, "Do not close before registration opens");
        await opening;
        assert.equal(f.closes(), 1);
        assert.equal(f.requests.length, 1);
        const url = new URL(f.tabs[0].url);
        assert.equal(url.pathname, "/html/registration/registration.html");
        assert.equal(url.searchParams.get("feature"), file === "installed" ? "landing-install" : "landing-update");
        assert.equal(url.searchParams.get("intent"), id.startsWith("extend") ? "extend" : null);
        assert.equal(f.tabs[0].active, true);
        assert.deepEqual(f.focusedWindows, [{ id: existing ? 8 : 7, focused: true }]);
        if (existing) { assert.equal(f.tabs[0].id, 42); }
      }
    }
  }
});

test("splash pages remain open when registration fails or returns no tab", async () => {
  for (const [file, id] of [["installed", "extend"], ["update", "register"], ["update", "renew"], ["update", "bargainIcon"], ["update", "bargainUpgradeIcon"]]) {
    const failed = popup(file, { fail: true });
    await assert.rejects(failed.click(id), /Registration unavailable/);
    assert.equal(failed.closes(), 0);
    const missing = popup(file, { response: "missing" });
    await missing.click(id);
    assert.equal(missing.closes(), 0);
  }
});

test("legacy category bridge and compatibility message handler preserve modern registration context", async () => {
  const background = readFileSync(new URL("../st-background.js", import.meta.url), "utf8");
  const browser = {
    runtime: { getURL: path => "moz-extension://test-id/" + path },
    tabs: { query: async () => [], create: async options => ({ ...options, windowId: 7 }) },
    windows: { update: async () => {} },
  };
  const context = { browser, openRegistrationTab };
  const compatibility = background.match(/showRegistrationDialog: \(data, _sender\) => openRegistrationTab\(browser, \{[\s\S]*?\}\)/)[0];
  const handler = vm.runInNewContext("({" + compatibility + "}).showRegistrationDialog", context);
  const result = await handler({ addonfeatures: "old-message-feature", intent: "extend" });
  assert.equal(new URL(result.url).searchParams.get("feature"), "old-message-feature");
  assert.equal(new URL(result.url).searchParams.get("intent"), "extend");
  const bridge = background.match(/case "openRegistrationTab":\s*return ([^;]+);/)[1];
  const bridged = await vm.runInNewContext(bridge, {
    ...context, data: { feature: "MAX_STANDARD_CATEGORIES" },
  });
  assert.equal(new URL(bridged.url).searchParams.get("feature"), "MAX_STANDARD_CATEGORIES");
});

test("only the emergency menu and its legacy handler retain the XHTML registration route", () => {
  const references = [];
  // Match route literals, not documentation mentioning the emergency dialog.
  const legacyRoute = /["']smartTemplates-registration["']|["'][^"'\r\n]*register\.xhtml(?:[?#][^"'\r\n]*)?["']/;
  function inspect(directory) {
    for (const entry of readdirSync(new URL("../" + directory, import.meta.url), { withFileTypes: true })) {
      const path = directory + "/" + entry.name;
      if (entry.isDirectory()) { inspect(path); }
      else if (/\.(?:js|mjs|html|xhtml)$/.test(entry.name)) {
        const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
        if (legacyRoute.test(source)) { references.push(path); }
      }
    }
  }
  for (const directory of ["chrome", "html", "scripts", "popup"]) { inspect(directory); }
  const background = readFileSync(new URL("../st-background.js", import.meta.url), "utf8");
  assert.doesNotMatch(background, legacyRoute);
  assert.deepEqual(references.sort(), [
    "chrome/content/scripts/st-messenger.js",
    "chrome/content/smartTemplate-main.js",
    "chrome/content/smartTemplate-util.js",
  ]);
});
