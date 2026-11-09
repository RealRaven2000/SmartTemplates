import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { parsePrompt } from "../../../chrome/content/modules/Prompt.sys.mjs";

const root = new URL("../../../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");
const english = JSON.parse(read("_locales/en/messages.json"));
const keys = Object.keys(english).filter(key => key.startsWith("prompt.help."));
const catalogs = readdirSync(new URL("_locales/", root)).map(locale => ({
  locale, messages: JSON.parse(read("_locales/" + locale + "/messages.json")),
}));

test("nine help entities respect locale scope and preserve literal formatting markers", () => {
  assert.equal(keys.length, 9);
  for (const { locale, messages } of catalogs) {
    const ui = messages._l10nstatus.message.includes("UI");
    for (const key of keys) {
      assert.equal(Object.hasOwn(messages, key), ui, locale + ":" + key);
      if (ui) {
        assert.ok(messages[key].message.length, locale + ":" + key);
        if (locale !== "en") {
          assert.equal(Object.hasOwn(messages[key], "description"), false, locale + ":" + key);
        }
        const markers = text => [...text.matchAll(/\{[^}]+\}/g)].map(match => match[0]).sort();
        assert.deepEqual(markers(messages[key].message), markers(english[key].message), locale + ":" + key);
      }
    }
  }
});

test("example labels localize without translating or breaking prompt syntax", () => {
  const html = read("html/variables.html");
  const examples = [...html.matchAll(/<code>(%prompt\([\s\S]*?)<\/code>/g)]
    .map(match => match[1]).filter(code => /__MSG_prompt\.help\.(?:enterTea|selectTea)__/.test(code));
  assert.equal(examples.length, 3);
  for (const { locale, messages } of catalogs) {
    const localize = key => (messages[key] || english[key]).message;
    const parsed = examples.map(code => parsePrompt(code.replace(/<[^>]*>/g, "")
      .replace(/__MSG_(.*?)__/g, (_match, key) => localize(key))));
    assert.equal(parsed[0].explanation, localize("prompt.help.enterTea"), locale);
    assert.equal(parsed[0].defaultValue, "Darjeeling", locale);
    assert.equal(parsed[1].explanation, localize("prompt.help.selectTea"), locale);
    assert.equal(parsed[2].explanation, parsed[1].explanation, locale);
    assert.deepEqual(parsed[1].choices, ["Darjeeling", "Ceylon", "Assam"], locale);
    assert.equal(parsed[2].fromClipboard, true, locale);
    assert.equal(parsed[2].toClipboard, true, locale);
  }
});

class HelpNode {
  constructor(nodeType = 1, text = "") {
    this.nodeType = nodeType;
    this.childNodes = [];
    this.text = text;
  }
  get textContent() {
    return this.nodeType === 3 ? this.text : this.childNodes.map(node => node.textContent).join("");
  }
  set textContent(value) {
    this.childNodes = value ? [new HelpNode(3, value)] : [];
  }
  append(...nodes) {
    for (const node of nodes) {
      if (node.nodeType === 11) {
        this.childNodes.push(...node.childNodes);
      } else {
        this.childNodes.push(node);
      }
    }
  }
  appendChild(node) { this.append(node); }
  querySelector() { return this; }
  addEventListener() {}
}

test("help initialization styles literal parameters separately from SmartTemplates variables", async () => {
  const source = read("html/help-html.js");
  for (const { locale, messages } of catalogs.filter(item => item.messages._l10nstatus.message.includes("UI"))) {
    const targets = ["defaultValue", "toclipboard"].map(name => {
      const element = new HelpNode();
      element.textContent = messages["prompt.help." + name].message;
      return element;
    });
    const dummy = new HelpNode();
    const context = vm.createContext({
      Node: { TEXT_NODE: 3 },
      document: {
        documentElement: { namespaceURI: "http://www.w3.org/1999/xhtml" },
        querySelectorAll: selector => selector === "#prompt-content .promptHelpText" ? [targets[0]] :
          selector === ".localizedFormatting" ? [targets[1]] : [],
        getElementById: id => id === "helpContents" ? null : dummy,
        createDocumentFragment: () => new HelpNode(11),
        createTextNode: text => new HelpNode(3, text),
        createElementNS: () => new HelpNode(),
        createElement: tag => Object.assign(new HelpNode(), { tagName: tag }),
      },
      browser: { storage: { local: { get: async () => ({}) } } },
      i18n: { updateDocument() {} }, findOrigin: () => "test",
      fixClipboardNote() {}, initSearch() {}, console,
    });
    vm.runInContext(source, context);
    await context.initHTML();
    assert.deepEqual(targets[0].childNodes.filter(node => node.className)
      .map(node => [node.textContent, node.className]), [["clipboard", "paramLiteral"], ['""', "paramLiteral"]], locale);
    assert.deepEqual(targets[1].childNodes.filter(node => node.className)
      .map(node => [node.textContent, node.className]), [["%clipboard%", "inline"]], locale);
    assert.equal(targets[1].childNodes.find(node => node.className === "inline").tagName, "code", locale);
    assert.equal(targets[1].textContent.includes("`"), false, locale);
  }
});
