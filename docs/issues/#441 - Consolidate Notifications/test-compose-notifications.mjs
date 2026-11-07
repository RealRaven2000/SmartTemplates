import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createComposeNotifications } from "../../../html/compose-notifications/controller.mjs";

const catalog = JSON.parse(fs.readFileSync(new URL("../../../_locales/en/messages.json", import.meta.url), "utf8"));
function fixture() {
  let onMessage, onRemoved;
  const deliveries = [], actions = [];
  const api = {
    i18n: { getMessage: key => catalog[key]?.message || key },
    runtime: { onMessage: { addListener: fn => { onMessage = fn; } } },
    tabs: {
      onRemoved: { addListener: fn => { onRemoved = fn; } },
      query: async query => query.windowId ? [{ id: query.windowId * 10, type: "messageCompose" }] : [],
      sendMessage: async (id, data) => { deliveries.push({ id, ...data }); },
      executeScript: async () => {},
    },
    composeScripts: { register: async () => ({}) },
    Utilities: { showComposeLicenseDialog: async (...args) => actions.push(["buy", ...args]) },
    windows: { openDefaultBrowser: async url => actions.push(["browser", url]) },
  };
  const controller = createComposeNotifications(api);
  const request = overrides => ({ windowId: 1, features: [], trialDays: 28,
    buttonKey: "notification.premium.btn.getLicense", isRegister: true, ...overrides });
  const send = (action, id = 10) => onMessage({ command: "composeNotifications", action }, { tab: { id, type: "messageCompose" } });
  return { api, controller, request, send, deliveries, actions, remove: id => onRemoved(id) };
}

test("concurrent legacy reports consolidate without crossing composer windows", async () => {
  const f = fixture();
  await f.controller.start();
  await Promise.all([
    f.controller.show(f.request({ features: ["header.prefix"], isProFeature: true })),
    f.controller.show(f.request({ features: ["file", "style"] })),
    f.controller.show(f.request({})),
    f.controller.show(f.request({ windowId: 2, features: ["attach"], isProFeature: true })),
  ]);
  const one = await f.send("ready"), two = await f.send("ready", 20);
  assert.match(one.proText, /header.prefix/);
  assert.match(one.standardText, /file, style/);
  assert.match(one.trial, /28/);
  assert.doesNotMatch(one.proText, /attach/);
  assert.match(two.proText, /attach/);
  await f.controller.show(f.request({ features: ["header.prefix"], isProFeature: true }));
  assert.equal((await f.send("ready")).proText.match(/header.prefix/g).length, 1);
  assert.equal((await f.send("ready")).revision, 4);
  f.remove(10);
  assert.equal(await f.send("ready"), null);
});

test("pending state survives missing receivers; trial omission and actions remain independent", async () => {
  const f = fixture();
  await f.controller.start();
  f.api.tabs.sendMessage = async () => { throw Error("not ready"); };
  await f.controller.show(f.request({ features: ["file"], trialDays: 0 }));
  const model = await f.send("ready");
  assert.equal(model.trial, "");
  assert.equal(model.compact, "Licensed features used");
  assert.equal(model.proText, "");
  assert.deepEqual(model.buttons.map(b => b.action), ["buy", "compare", "later"]);
  await f.send("buy");
  await f.send("compare");
  await f.send("licensing");
  assert.deepEqual(f.actions[0], ["buy", 10, "file"]);
  assert.match(f.actions[1][1], /premium\.html#featureComparison$/);
  assert.match(f.actions[2][1], /contribute\.html$/);
  await f.send("later");
  assert.deepEqual(await f.send("ready"), model); // No snooze or accounting yet.
  await assert.rejects(f.controller.show(f.request({ windowId: undefined })), /window ID/);
});

test("license validation removes covered sections without discarding unpaid Pro usage", async () => {
  const f = fixture();
  await f.controller.start();
  await f.controller.show(f.request({ features: ["header.prefix"], isProFeature: true }));
  await f.controller.show(f.request({ features: ["file"] }));
  await f.controller.updateLicense({ status: "Valid", keyType: 2, trialDays: 28 });
  const standard = await f.send("ready");
  assert.equal(standard.standardText, "");
  assert.match(standard.proText, /header.prefix/);
  await f.controller.updateLicense({ status: "Valid", keyType: 0, trialDays: 28 });
  assert.equal((await f.send("ready")).visible, false);
});

test("collapsed bubble avoids visible LanguageTool controls and restores its default position", async () => {
  let rect = { left: 950, right: 980, top: 550, bottom: 580, width: 30, height: 30 };
  const toolbar = { getBoundingClientRect: () => rect };
  const emptyWrapper = { getBoundingClientRect: () => ({ width: 0, height: 0 }) };
  const containers = [{ shadowRoot: { querySelectorAll: selector =>
    selector.includes("lt-toolbar *") ? [emptyWrapper, toolbar] : [emptyWrapper] } }];
  const f = rendererFixture(containers);
  await f.listeners[0]({ command: "composeNotifications", model: {
    revision: 1, compact: "Trial", title: "SmartTemplates", buttons: [],
  } });
  const host = f.documentElement.children[1], bubble = host.shadowRoot.children[1];
  const update = () => { f.observers[0].callback(); f.flush(); };
  f.flush();
  assert.equal(host.shadowRoot.children[2].textContent, ":host { --notification-bottom: 60px; }");
  update();
  assert.equal(host.shadowRoot.children[2].textContent, ":host { --notification-bottom: 60px; }");
  toolbar.computedStyle = { display: "none", visibility: "visible", opacity: "1" };
  update();
  assert.equal(host.shadowRoot.children[2].textContent, "");
  delete toolbar.computedStyle;
  rect = { ...rect, left: 10, right: 40 };
  update();
  assert.equal(host.shadowRoot.children[2].textContent, "");
  rect = { ...rect, left: 950, right: 980 };
  update();
  bubble.open = true;
  bubble.events.toggle();
  f.flush();
  assert.equal(host.shadowRoot.children[2].textContent, "");
  bubble.open = false;
  bubble.events.toggle();
  f.flush();
  assert.equal(host.shadowRoot.children[2].textContent, ":host { --notification-bottom: 60px; }");
  containers.length = 0;
  update();
  assert.equal(host.shadowRoot.children[2].textContent, "");
});

// Lightweight DOM harness checks renderer boundaries, not Thunderbird serialization.
class Element {
  constructor(tag) {
    this.tagName = tag; this.children = []; this.events = {}; this.hidden = false; this.isConnected = false;
    this.properties = new Map();
    this.style = { setProperty: (key, value) => this.properties.set(key, value), removeProperty: key => this.properties.delete(key) };
  }
  append(...children) { this.children.push(...children); for (const child of children) if (child && typeof child === "object") child.isConnected = true; }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  setAttribute(name, value) { this[name] = value; }
  toggleAttribute(name, value) { if (value) this[name] = ""; else delete this[name]; }
  addEventListener(name, fn) { this.events[name] = fn; }
  attachShadow() { return this.shadowRoot = new Element("shadow-root"); }
  getBoundingClientRect() { return { left: 550, right: 990, top: 510, bottom: 584, width: 440, height: 74 }; }
}
function rendererFixture(containers = []) {
  const documentElement = new Element("html"), body = new Element("body");
  documentElement.append(body);
  documentElement.clientHeight = 600;
  const listeners = [], sent = [], frames = new Map(), observers = [];
  let nextFrame = 0;
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  const context = vm.createContext({
    document: { documentElement, getElementById: () => null,
      querySelectorAll: () => containers,
      createElement: tag => new Element(tag), createTextNode: text => ({ textContent: text }) },
    window: { innerHeight: 600, addEventListener() {}, removeEventListener() {} },
    ResizeObserver: Observer, MutationObserver: Observer,
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id), setInterval: () => 1, clearInterval() {},
    getComputedStyle: element => element.computedStyle || { display: "block", visibility: "visible", opacity: "1" },
    browser: { runtime: {
      getURL: path => "moz-extension://test/" + path,
      sendMessage: async data => { sent.push(data); return null; },
      onMessage: { addListener: fn => listeners.push(fn) },
    } }, console,
  });
  const source = fs.readFileSync(new URL("../../../html/compose-notifications/compose.js", import.meta.url), "utf8");
  vm.runInContext(source, context);
  vm.runInContext(source, context);
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  return { documentElement, body, listeners, sent, flush, observers };
}

test("compose renderer keeps UI in shadow DOM, omits empty rows, and ignores stale readiness data", async () => {
  const { documentElement, body, listeners, sent } = rendererFixture();
  assert.equal(listeners.length, 1);
  const model = { revision: 2, compact: "Trial", title: "SmartTemplates", learnMore: "More",
    trial: "", proText: "header.prefix", standardText: "", buttons: [{ action: "later", label: "Later" }] };
  await listeners[0]({ command: "composeNotifications", model });
  const host = documentElement.children[1];
  assert.equal(body.children.length, 0);
  assert.equal(host.children.length, 0);
  const bubble = host.shadowRoot.children[1], panel = bubble.children[1];
  assert.equal(panel.children[0].hidden, true);
  assert.equal(panel.children[1].hidden, false);
  assert.equal(panel.children[2].hidden, true);
  bubble.open = true;
  bubble.events.toggle();
  assert.equal(host["data-expanded"], "");
  panel.children[3].children[0].events.click();
  assert.equal(bubble.open, false);
  bubble.events.toggle();
  assert.equal(host["data-expanded"], undefined);
  await listeners[0]({ command: "composeNotifications", model: { ...model, revision: 1, compact: "stale" } });
  assert.equal(bubble.children[0].children[1].children[0].textContent, "Trial");
  assert.equal(sent.at(-1).action, "later");
});
