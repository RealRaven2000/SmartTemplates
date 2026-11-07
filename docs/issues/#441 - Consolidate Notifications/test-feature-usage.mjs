import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function fixture() {
  const values = new Map();
  let date = new Date(2026, 10, 7, 12);
  const prefs = {
    getStringPref: (key, fallback) => values.get(key) ?? fallback,
    setStringPref: (key, value) => values.set(key, value),
  };
  function load() {
    const scope = vm.createContext({ SmartTemplatesUsage: {} });
    for (const file of ["usage-policy.js", "usage-store.js"]) {
      vm.runInContext(fs.readFileSync(new URL("../../../scripts/premium/" + file, import.meta.url), "utf8"), scope);
    }
    return scope.SmartTemplatesUsage.createStore(prefs, () => date);
  }
  return { values, load, nextDay: () => { date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12); } };
}
const unlicensed = { status: "Empty", keyType: 0, trialDays: 0 };

test("general trial and covered license usage do not create counters", () => {
  const f = fixture(), check = f.load();
  assert.equal(check("file", { ...unlicensed, trialDays: 1 }, true).remaining, 12);
  assert.equal(check("file", { status: "Valid", keyType: 2, trialDays: 0 }, true).covered, true);
  assert.equal(check("header.prefix", { status: "Valid", keyType: 0, trialDays: 0 }, true).covered, true);
  assert.equal(f.values.size, 0);
  assert.equal(check("header.prefix", { status: "Valid", keyType: 2, trialDays: 0 }, true).remaining, 11);
  assert.equal(f.values.size, 1);
  assert.equal(check("header.append", { status: "Valid", keyType: 2, trialDays: 28 }, true).remaining, 11);
});

test("12 active days persist across API scopes; final included day remains allowed", () => {
  const f = fixture(), check = f.load();
  for (let day = 1; day <= 12; day++) {
    const result = check("file", unlicensed, true);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 12 - day);
    assert.equal(result.usedToday, true);
    assert.equal(f.load()("file", unlicensed, true).remaining, 12 - day);
    if (day < 12) {
      f.nextDay();
    }
  }
  assert.equal(check("file", unlicensed, true).allowed, true);
  assert.equal(check("style", unlicensed, false).remaining, 12);
  f.nextDay();
  const blocked = f.load()("file", unlicensed, true);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(JSON.parse(f.values.get("extensions.smarttemplates.file")).usage, 12);
  assert.equal(check("style", unlicensed, true).remaining, 11);
});

test("legacy used counters migrate to usage without consuming another use today", () => {
  const f = fixture(), check = f.load();
  const key = "extensions.smarttemplates.file";
  f.values.set(key, JSON.stringify({ used: 5, lastUsedDate: "2026-11-07" }));
  assert.equal(check("file", unlicensed, false).remaining, 7);
  assert.equal(JSON.parse(f.values.get(key)).used, 5);
  assert.equal(check("file", unlicensed, true).remaining, 7);
  assert.deepEqual(JSON.parse(f.values.get(key)), { usage: 5, lastUsedDate: "2026-11-07" });
  f.nextDay();
  assert.equal(check("file", unlicensed, true).remaining, 6);
  assert.equal(JSON.parse(f.values.get(key)).usage, 6);
});

test("read-only snapshots and inactive days consume nothing; Config Editor Reset restores allowance", () => {
  const f = fixture(), check = f.load();
  check("file", unlicensed, true);
  for (let day = 0; day < 30; day++) {
    f.nextDay();
  }
  assert.equal(check("file", unlicensed, false).remaining, 11);
  assert.equal(check("file", unlicensed, true).remaining, 10);
  assert.equal(check("unrecognizedFreeVariable", unlicensed, true), null);
  f.values.delete("extensions.smarttemplates.file");
  assert.equal(check("file", unlicensed, false).remaining, 12);
});

test("Utilities exposes a synchronous parser check and asynchronous background snapshot", async () => {
  const values = new Map();
  const services = {
    wm: { getMostRecentWindow: () => null },
    prefs: {
      getStringPref: (key, fallback) => values.get(key) ?? fallback,
      setStringPref: (key, value) => values.set(key, value),
    },
    scriptloader: { loadSubScriptWithOptions(path, options) {
      assert.equal(options.charset, "UTF-8");
      assert.equal(options.allowUnsafeURL, true);
      const target = vm.isContext(options.target) ? options.target : vm.createContext(options.target);
      vm.runInContext(fs.readFileSync(new URL("../../../" + path, import.meta.url), "utf8"), target);
    } },
  };
  const scope = vm.createContext({ Services: services,
    ChromeUtils: { importESModule: path => path.includes("ExtensionCommon")
      ? { ExtensionCommon: { ExtensionAPI: class {} } } : { MailServices: {} } },
  });
  vm.runInContext(fs.readFileSync(new URL("../../../chrome/content/api/Utilities/implementation.js", import.meta.url), "utf8"), scope);
  const api = new scope.Utilities().getAPI({ extension: { rootURI: { resolve: path => path } } }).Utilities;
  const result = api.checkComposeFeatureUsage("file", unlicensed, true);
  assert.equal(result.remaining, 11);
  assert.equal(result.then, undefined);
  const snapshot = api.getComposeFeatureUsage("file", unlicensed);
  assert.equal(typeof snapshot.then, "function");
  assert.equal((await snapshot).remaining, 11);
  assert.equal((await api.getComposeFeatureUsage("style", unlicensed)).remaining, 12);
  assert.equal(values.has("extensions.smarttemplates.style"), false);
  assert.equal(scope.SmartTemplatesUsage, undefined);
});

test("blocked modifier commands survive both processing passes without touching editor content", () => {
  const source = fs.readFileSync(new URL("../../../chrome/content/smartTemplate-overlay.js", import.meta.url), "utf8");
  const modifier = source.slice(source.indexOf("SmartTemplate4.parseModifier ="), source.indexOf("SmartTemplate4.regularize ="));
  const attempted = [];
  const context = vm.createContext({
    SmartTemplate4: { Util: { useFeature: feature => { attempted.push(feature); return false; } }, Preferences: {} },
  });
  vm.runInContext(modifier, context);
  const text = 'Before %deleteQuotedTags("img")% and %header.prefix(subject,"Hello")% after';
  assert.equal(context.SmartTemplate4.parseModifier(text, "rsp", true), text);
  assert.equal(context.SmartTemplate4.parseModifier(text, "rsp", false), text);
  assert.deepEqual(attempted, ["deleteQuotedTags", "deleteQuotedTags"]);
});

test("reserved-word gate returns original token before executing file, header, or clipboard commands", async () => {
  const source = fs.readFileSync(new URL("../../../chrome/content/smartTemplate-overlay.js", import.meta.url), "utf8");
  const start = source.indexOf("    const usageFeature =");
  const end = source.indexOf("    // calling this function just for logging purposes", start);
  const calls = [];
  const context = vm.createContext({ util: { useFeature: name => { calls.push(name); return name !== "file" && name !== "clipboard"; } } });
  const gate = vm.runInContext(`(async function(dmy, token, arg) { ${source.slice(start, end)} return "executed"; })`, context);
  assert.equal(await gate('%file("missing.html")%', "file", '("missing.html")'), '%file("missing.html")%');
  assert.equal(await gate('%header.set(subject,clipboard)%', "header.set", '(subject,clipboard)'), '%header.set(subject,clipboard)%');
  assert.equal(await gate('%header.prefix(subject,"Hello")%', "header.prefix", '(subject,"Hello")'), "executed");
  assert.deepEqual(calls, ["file", "header.set", "clipboard", "header.prefix", "header.prefix"]);
});
