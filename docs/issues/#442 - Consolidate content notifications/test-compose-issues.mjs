import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createComposeNotifications } from "../../../html/compose-notifications/controller.mjs";

test("new issue labels retain UTF-8 text and respect locale UI scope", () => {
  const root = new URL("../../../_locales/", import.meta.url);
  const keys = ["issue", "issues", "dismissIssue", "copyTemplateSource"];
  for (const locale of fs.readdirSync(root)) {
    const catalog = JSON.parse(fs.readFileSync(new URL(locale + "/messages.json", root), "utf8"));
    for (const key of keys) {
      const entry = catalog["notification.compose." + key];
      if (catalog._l10nstatus.message.includes("UI")) {
        assert.ok(entry?.message, locale + ": " + key);
        assert.doesNotMatch(entry.message, /[?\uFFFD]/, locale + ": " + key);
      } else {
        assert.equal(entry, undefined, locale + ": default-locale feature UI fallback");
      }
    }
  }
  const japanese = JSON.parse(fs.readFileSync(new URL("ja/messages.json", root), "utf8"));
  assert.equal(japanese["notification.compose.issues"].message, "テンプレートの問題");
});

function fixture(options = {}) {
  let receive, removed;
  const deliveries = [], copies = [];
  const api = {
    i18n: { getMessage: key => key },
    runtime: { onMessage: { addListener: listener => { receive = listener; } } },
    tabs: {
      query: async query => query.windowId ? [{ id: query.windowId * 10 }] : [],
      sendMessage: async (tabId, data) => { deliveries.push({ tabId, ...data }); },
      executeScript: async () => {},
      onRemoved: { addListener: listener => { removed = listener; } },
    },
    composeScripts: { register: async () => {} },
  };
  const controller = createComposeNotifications(api, {
    copyText: async text => { copies.push(text); }, ...options,
  });
  const send = (action, fields = {}, tabId = 10) => receive({
    command: "composeNotifications", action, ...fields,
  }, { tab: { id: tabId, type: "messageCompose" } });
  return { api, controller, send, deliveries, copies, remove: id => removed(id) };
}

const issue = overrides => ({ windowId: 1, evaluationId: 1,
  message: "Cannot process this expression", expression: "%example()%", details: "Diagnostic detail", ...overrides });

test("expression previews cap huge Unicode arguments without truncating copy-source data", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 });
  const source = "<img src=\"data:image/png;base64," + "A".repeat(1024 * 1024) + "\">";
  await f.controller.reportIssue(issue({ expression: "😀".repeat(500000),
    action: { type: "copyTemplateSource", source } }));
  let model = await f.send("ready");
  assert.equal(model.issues[0].expression, "😀".repeat(249) + "…");
  assert.equal(Array.from(model.issues[0].expression).length, 250);
  await f.send("copyTemplateSource", { evaluationId: 1, issueId: model.issues[0].id });
  assert.equal(f.copies[0], source);
  await f.controller.reportIssue(issue({ expression: "x".repeat(250) }));
  await f.controller.reportIssue(issue({ expression: "x".repeat(251) }));
  model = await f.send("ready");
  assert.equal(model.issues[1].expression, "x".repeat(250));
  assert.equal(model.issues[2].expression, "x".repeat(249) + "…");
});

test("console action test explicitly targets a Composer and confirms delivery", async () => {
  const source = fs.readFileSync(new URL("test-templates/report-actions.js", import.meta.url), "utf8");
  const reports = [];
  const composer = { document: { title: "Test Composer" }, SmartTemplate4: { Util: {
    reportComposeIssue: async payload => { reports.push(payload); return true; },
  } } };
  const result = await vm.runInNewContext(source, {
    Services: { wm: { getMostRecentWindow: type => {
      assert.equal(type, "msgcompose");
      return composer;
    } } },
    SmartTemplate4: { Util: { reportComposeIssue: () => { throw Error("Wrong mail window"); } } },
  });
  assert.equal(result.reported, 2);
  assert.equal(result.composerTitle, "Test Composer");
  assert.equal(reports.length, 2);
  assert.equal(reports[0].action.source, "<p>ST442 clipboard verification</p>");
  await assert.rejects(vm.runInNewContext(source, {
    Services: { wm: { getMostRecentWindow: () => null } },
  }), /Open a Composer/);
  composer.SmartTemplate4.Util.reportComposeIssue = async () => false;
  await assert.rejects(vm.runInNewContext(source, {
    Services: { wm: { getMostRecentWindow: () => composer } },
  }), /Could not report both test issues/);
});

test("first issue shows without licensing; later issues merge and stay isolated by Composer", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 });
  await f.controller.reportIssue(issue());
  let model = await f.send("ready");
  assert.equal(model.visible, true);
  assert.equal(model.hasLicensing, false);
  assert.equal(model.issues.length, 1);
  assert.equal(model.issues[0].details, "Diagnostic detail");
  await f.controller.reportIssue(issue({ expression: "%second()%" }));
  model = await f.send("ready");
  assert.equal(model.issues.length, 2);
  assert.equal(model.revision, 3);
  await f.controller.show({ windowId: 2, reset: true, clearIssues: true, evaluationId: 1 });
  assert.equal((await f.send("ready", {}, 20)).issues.length, 0);
  f.remove(10);
  assert.equal(await f.send("ready"), null);
});

test("individual dismissal persists through later reports and license updates", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 });
  await f.controller.show({ windowId: 1, features: ["file"], trialDays: 0 });
  await f.controller.reportIssue(issue());
  const id = (await f.send("ready")).issues[0].id;
  assert.equal(await f.send("dismissIssue", { evaluationId: 1, issueId: id }), true);
  assert.equal((await f.send("ready")).standardFeatures.length, 1);
  await f.controller.reportIssue(issue({ message: "Next issue" }));
  await f.controller.updateLicense({ status: "Valid", keyType: 0 });
  const model = await f.send("ready");
  assert.equal(model.visible, true);
  assert.equal(model.hasLicensing, false);
  assert.deepEqual(model.issues.map(item => item.message), ["Next issue"]);
  await f.send("dismissIssue", { evaluationId: 1, issueId: model.issues[0].id });
  assert.equal((await f.send("ready")).visible, false);
});

test("superseded delayed issues and old actions cannot affect a newer evaluation", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 });
  await f.controller.reportIssue(issue());
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 2 });
  assert.equal(await f.controller.reportIssue(issue()), false);
  await f.controller.reportIssue(issue({ evaluationId: 2 }));
  assert.equal(await f.send("dismissIssue", { evaluationId: 1, issueId: 1 }), false);
  assert.equal((await f.send("ready")).issues.length, 1);
  assert.equal(await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 }), false);
});

test("copy action uses the stored source, never source supplied by the UI", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 });
  await f.controller.reportIssue(issue({ action: { type: "copyTemplateSource", source: "<p>Original source</p>" } }));
  const model = await f.send("ready");
  assert.deepEqual(model.issues[0].action, { type: "copyTemplateSource" });
  await f.send("copyTemplateSource", { evaluationId: 1, issueId: model.issues[0].id, source: "wrong" });
  assert.deepEqual(f.copies, ["<p>Original source</p>"]);
  await assert.rejects(f.controller.reportIssue(issue({ action: { type: "arbitrary" } })), /Unsupported/);
  await assert.rejects(f.controller.reportIssue(issue({ message: " " })), /Missing/);
});

test("issue state survives a missing renderer and a reset supersedes pending licensing work", async () => {
  let finish;
  const f = fixture({ getFeatureUsage: () => new Promise(resolve => { finish = resolve; }) });
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 1 });
  const pending = f.controller.show({ windowId: 1, features: ["file"] });
  await new Promise(resolve => setImmediate(resolve));
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 2 });
  finish({});
  assert.equal(await pending, false);
  f.api.tabs.sendMessage = async () => { throw Error("not injected yet"); };
  await f.controller.reportIssue(issue({ evaluationId: 2 }));
  const model = await f.send("ready");
  assert.equal(model.issues.length, 1);
  assert.equal(model.standardFeatures.length, 0);
});

function legacyFixture() {
  const reports = [], timers = [];
  const scope = {
    SmartTemplate4: {}, console,
    document: { documentElement: { getAttribute: () => "msgcompose" } },
    window: {}, setTimeout: callback => { timers.push(callback); },
    gSpellChecker: { mInlineSpellChecker: null },
    GetCurrentEditor: () => ({ getInlineSpellChecker: () => null }),
  };
  const source = fs.readFileSync(new URL("../../../chrome/content/smartTemplate-util.js", import.meta.url), "utf8");
  const start = source.indexOf("SmartTemplate4.Util = {");
  vm.runInNewContext(source.slice(start, source.indexOf("\n};", start) + 3), scope);
  const util = scope.SmartTemplate4.Util;
  util.extension = { windowManager: { getWrapper: () => ({ id: 7 }) } };
  util.notifyTools = { notifyBackground: async payload => { reports.push(payload); return true; } };
  util.clearUsedPremiumFunctions = () => {};
  util.logDebug = () => {};
  util.logException = () => {};
  util.getBundleString = key => key;
  return { util, scope, reports, timers };
}

test("snippet feature resets retain issues, actions, IDs and delayed reports until Change Template", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show({ windowId: 1, reset: true, evaluationId: 1 });
  await f.controller.reportIssue(issue({ action: { type: "copyTemplateSource", source: "original" } }));
  const generation = (await f.send("ready")).generation;
  // Insert Snippet starts fresh feature accounting without changing issue scope.
  await f.controller.show({ windowId: 1, reset: true, clearIssues: false, evaluationId: 1 });
  let model = await f.send("ready");
  assert.equal(model.issues.length, 1);
  assert.equal(model.generation, generation);
  await f.send("copyTemplateSource", { evaluationId: 1, issueId: 1 });
  assert.deepEqual(f.copies, ["original"]);
  await f.controller.reportIssue(issue({ message: "Delayed result from an earlier snippet" }));
  model = await f.send("ready");
  assert.deepEqual(model.issues.map(item => item.id), [1, 2]);
  await f.send("dismissIssue", { evaluationId: 1, issueId: 1 });
  await f.controller.show({ windowId: 1, reset: true, clearIssues: false, evaluationId: 1 });
  assert.deepEqual((await f.send("ready")).issues.map(item => item.id), [2]);
  await f.controller.reportIssue(issue());
  assert.deepEqual((await f.send("ready")).issues.map(item => item.id), [2, 3]);
  // Only the dedicated Change Template flow clears retained issues and actions.
  await f.controller.show({ windowId: 1, reset: true, clearIssues: true, evaluationId: 2 });
  model = await f.send("ready");
  assert.equal(model.issues.length, 0);
  assert.equal(model.visible, false);
  assert.equal(model.generation, generation + 1);
  assert.equal(await f.controller.reportIssue(issue()), false);
});

test("legacy snippet resets keep the issue-session ID and active spellcheck retries", async () => {
  const { util, timers, reports } = legacyFixture();
  await util.resetComposeFeatureEvaluation();
  await util.setSpellchecker("zz_ST442", undefined, 1);
  await util.resetComposeFeatureEvaluation();
  assert.equal(util._composeIssueEvaluation, 1);
  assert.equal(reports.at(-1).clearIssues, false);
  await timers.shift()();
  assert.equal(timers.length, 1);
  await util.resetComposeFeatureEvaluation({ clearIssues: true });
  assert.equal(util._composeIssueEvaluation, 2);
  assert.equal(reports.at(-1).clearIssues, true);
  await timers.shift()();
  assert.equal(timers.length, 0);
});

test("legacy wrapper dispatches details and action with originating window and captured evaluation", async () => {
  const { util, reports } = legacyFixture();
  await util.resetComposeFeatureEvaluation({ clearIssues: true });
  await util.reportComposeIssue({ message: "Problem", details: new Error("details"),
    action: { type: "copyTemplateSource", source: "source" } });
  assert.equal(reports[0].evaluationId, 1);
  assert.equal(reports[1].func, "composeIssue");
  assert.equal(reports[1].windowId, 7);
  assert.equal(reports[1].evaluationId, 1);
  assert.equal(reports[1].details, "Error: details");
  assert.equal(reports[1].action.source, "source");
  await util.resetComposeFeatureEvaluation({ clearIssues: true });
  await util.reportComposeIssue({ message: "Late result", evaluationId: 1 });
  assert.equal(reports.at(-1).evaluationId, 1);
});

test("spellcheck retries preserve their evaluation and stop after it is superseded", async () => {
  const { util, timers, reports } = legacyFixture();
  await util.resetComposeFeatureEvaluation({ clearIssues: true });
  await util.setSpellchecker("zz_ST442", undefined, 1);
  assert.equal(timers.length, 1);
  await util.resetComposeFeatureEvaluation({ clearIssues: true });
  await timers.shift()();
  assert.equal(timers.length, 0);
  assert.equal(reports.some(item => item.func === "composeIssue"), false);
  await util.setSpellchecker("zz_ST442", undefined, 2);
  while (timers.length) {
    await timers.shift()();
  }
  const last = reports.at(-1);
  assert.equal(last.func, "composeIssue");
  assert.equal(last.evaluationId, 2);
  assert.equal(last.expression, "%spellcheck(zz_ST442)%");
  assert.equal(last.details, "Could not access spellChecker.");
});
