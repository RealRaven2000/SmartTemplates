import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import * as prompts from "../../../chrome/content/modules/Prompt.sys.mjs";

const tea = '%prompt("Choose tea",clipboard,"Darjeeling,Ceylon,Assam",toclipboard)%';
const options = (answers, overrides = {}) => ({
  ask: async () => answers.shift(),
  readClipboard: async () => "Ceylon",
  allowFeature: () => true,
  ...overrides,
});

test("parses clipboard default, list and output modifier", () => {
  const parsed = prompts.parsePrompt(tea);
  assert.equal(parsed.fromClipboard, true);
  assert.equal(parsed.toClipboard, true);
  assert.deepEqual(parsed.choices, ["Darjeeling", "Ceylon", "Assam"]);
  assert.equal(prompts.parsePrompt('%prompt("Tea","clipboard")%').fromClipboard, false);
  assert.equal(prompts.parsePrompt('%prompt("Tea","toclipboard")%').toClipboard, false);
});

test("quoted punctuation and escaped choice separators do not break parsing", () => {
  const source = String.raw`%prompt("Tea, (100%) \"please\"","C:\\Tea","Tea\, blend,Ceylon")%`;
  const parsed = prompts.parsePrompt(source);
  assert.equal(parsed.explanation, 'Tea, (100%) "please"');
  assert.equal(parsed.defaultValue, "C:\\Tea");
  assert.deepEqual(parsed.choices, ["Tea, blend", "Ceylon"]);
});

test("validates every prompt before displaying any dialog", async () => {
  for (const invalid of ["%prompt()%", '%prompt("Tea",unknown)%', '%prompt("Tea","","A,,B")%',
    '%prompt("Tea"', '%prompt("Tea",toclipboard,"A")%', '%prompt("Tea",)%']) {
    let asked = false;
    await assert.rejects(prompts.preparePrompts(['%prompt("Valid")%', invalid], options([], {
      ask: () => { asked = true; },
    })), SyntaxError);
    assert.equal(asked, false);
  }
});

test("stages clipboard writes and resolves later references in source order", async () => {
  const dialogs = [];
  const plan = await prompts.preparePrompts([
    '%clipboard%/' + tea + '/%clipboard%/' + tea + '/%clipboard%',
  ], options(["Darjeeling", "Assam"], {
    ask: async data => { dialogs.push(data); return dialogs.length === 1 ? "Darjeeling" : "Assam"; },
  }));
  assert.equal(dialogs[0].defaultValue, "Ceylon");
  assert.equal(dialogs[1].defaultValue, "Darjeeling");
  assert.equal(plan.restore(plan.texts[0]), "Ceylon//Darjeeling//Assam");
  assert.equal(plan.clipboard, "Assam");
  assert.equal(plan.writeClipboard, true);
});

test("a later cancellation returns no plan or clipboard write", async () => {
  await assert.rejects(prompts.preparePrompts([tea + tea], options(["Assam", null])),
    error => error.name === "PromptCancelled");
});

test("answers remain literal markup and variables, including replacement dollar syntax", async () => {
  const answer = '<b title="tea">%from% & $& \'Darjeeling\'</b>';
  const plan = await prompts.preparePrompts(['%prompt("Tea")%'], options([answer]));
  assert.equal(plan.restore(plan.texts[0]),
    "&lt;b title=&quot;tea&quot;&gt;&#37;from&#37; &amp; $&amp; &#39;Darjeeling&#39;&lt;/b&gt;");
});

test("clipboard permission denial and read failure stop before asking", async () => {
  let asked = false;
  const callbacks = options([], { ask: () => { asked = true; } });
  await assert.rejects(prompts.preparePrompts([tea], { ...callbacks, allowFeature: feature => feature !== "clipboard" }),
    error => error.name === "PromptCancelled");
  await assert.rejects(prompts.preparePrompts([tea], {
    ...callbacks, readClipboard: async () => { throw new Error("read failed"); },
  }), /read failed/);
  assert.equal(asked, false);
});

test("plain prompts require the Pro prompt allowance before any UI or clipboard access", async () => {
  const checked = [];
  let asked = false;
  let read = false;
  await assert.rejects(prompts.preparePrompts(['%prompt("Enter tea")%'], options([], {
    allowFeature: feature => { checked.push(feature); return false; },
    ask: () => { asked = true; },
    readClipboard: () => { read = true; },
  })), error => error.name === "PromptCancelled");
  assert.deepEqual(checked, ["prompt"]);
  assert.equal(asked, false);
  assert.equal(read, false);
});

test("empty clipboard allows selecting a choice; answers outside the list are rejected", async () => {
  const plan = await prompts.preparePrompts([tea], options(["Darjeeling"], {
    readClipboard: async () => "",
    ask: async data => { assert.equal(data.defaultValue, ""); return "Darjeeling"; },
  }));
  assert.equal(plan.clipboard, "Darjeeling");
  await assert.rejects(prompts.preparePrompts([tea], options(["Oolong"])), /supplied choices/);
  assert.equal(prompts.parsePrompt('%prompt("Tea","Oolong","Darjeeling,Ceylon")%').defaultValue, "Oolong");
});

test("compose processing resolves prompts before modifiers and restores literals last", async () => {
  let writes = [];
  let dialogs = 0;
  const util = {
    initFeatureUsage: async () => {}, logDebugOptional() {}, useFeature: () => true,
    clipboardRead: () => "Ceylon", clipboardWrite: value => { writes.push(value); return true; },
    extension: { windowManager: { getWrapper: () => ({ id: 12 }) } },
    notifyTools: { notifyBackground: async request => {
      assert.equal(request.func, "templatePrompt");
      assert.equal(request.windowId, 12);
      dialogs++;
      return "%from% & tea";
    } },
  };
  const namespace = {
    Util: util, Preferences: {}, pref: { isUseHtml: () => true }, calendar: { init() {} },
    PreprocessingFlags: { isFileTemplate: true },
    parseModifier: text => {
      assert.equal(text.includes("%prompt("), false);
      assert.equal(text.includes("%from%"), false);
      return text;
    },
    regularize: async text => text,

  };
  const context = vm.createContext({
    SmartTemplate4: namespace, Components: { interfaces: {}, classes: {} },
    ChromeUtils: { importESModule: path => path.includes("Prompt.sys.mjs") ? prompts : {} },
    window: {},
  });
  vm.runInContext(readFileSync(new URL("../../../chrome/content/smartTemplate-compose.js", import.meta.url), "utf8"), context);
  const composer = new namespace.classSmartTemplate();
  const freePrompt = '%prompt("Tea",clipboard,toclipboard)%';
  const result = await composer.getProcessedText('<p>%clipboard%</p>' + freePrompt + '<p>%clipboard%</p>', "id", "new", true);
  assert.equal(result, "<p>Ceylon</p><p>&#37;from&#37; &amp; tea</p>");
  assert.deepEqual(writes, ["%from% & tea"]);
  assert.equal(dialogs, 1);
  writes = [];
  util.notifyTools.notifyBackground = async () => null;
  await assert.rejects(composer.getProcessedText(tea, "id", "new", true),
    error => error.name === "PromptCancelled");
  assert.deepEqual(writes, []);
});
