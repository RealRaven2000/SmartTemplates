import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createComposePrompts } from "../../../scripts/prompt/controller.mjs";

const prompt = { explanation: "Choose tea", defaultValue: "Ceylon", choices: ["Darjeeling", "Ceylon", "Assam"] };
const tick = () => new Promise(resolve => setImmediate(resolve));
const event = () => ({
  listeners: new Set(),
  addListener(fn) { this.listeners.add(fn); },
  removeListener(fn) { this.listeners.delete(fn); },
});
const sender = id => ({ tab: { id, type: "messageCompose" } });

async function fixture(existing = []) {
  const sent = [];
  const registered = [];
  const injected = [];
  const api = {
    runtime: { onMessage: event() },
    i18n: { getMessage: key => key },
    composeScripts: { register: async script => {
      registered.push(script);
      return { unregister: async () => {} };
    } },
    tabs: {
      onRemoved: event(),
      query: async request => request.windowId ? [{ id: request.windowId + 100 }] : existing,
      executeScript: async (id, script) => { injected.push({ id, ...script }); },
      sendMessage: async (id, data) => { sent.push({ id, ...data }); return true; },
    },
  };
  const controller = createComposePrompts(api);
  await controller.start();
  const message = (data, from = sender(112)) => [...api.runtime.onMessage.listeners][0]({ command: "composePrompt", ...data }, from);
  return { api, sent, controller, message, registered, injected };
}

test("answer and cancellation route only to their composer and matching request", async () => {
  const { controller, sent, message } = await fixture();
  const first = controller.show({ windowId: 12, prompt });
  const second = controller.show({ windowId: 13, prompt });
  await tick();
  const a = sent.find(item => item.id === 112).model;
  const b = sent.find(item => item.id === 113).model;
  assert.equal(await message({ action: "complete", id: a.id, answer: "Assam" }, sender(113)), false);
  assert.equal(await message({ action: "complete", id: a.id, answer: "" }), false);
  assert.equal(await message({ action: "complete", id: a.id, answer: "Oolong" }), false);
  assert.equal(await message({ action: "complete", id: a.id, answer: "Assam" }), true);
  assert.equal(await first, "Assam");
  await message({ action: "complete", id: b.id, answer: null }, sender(113));
  assert.equal(await second, null);
  await controller.stop();
});

test("ready handshake retrieves startup requests and stale replies cannot complete the next prompt", async () => {
  const { api, controller, message } = await fixture();
  api.tabs.sendMessage = async () => { throw new Error("not injected yet"); };
  const first = controller.show({ windowId: 12, prompt });
  await tick();
  const model = await message({ action: "ready" });
  assert.equal(model.defaultValue, "Ceylon");
  assert.deepEqual(model.choices, prompt.choices);
  await message({ action: "complete", id: model.id, answer: "Assam" });
  assert.equal(await first, "Assam");
  const second = controller.show({ windowId: 12, prompt });
  await tick();
  assert.equal(await message({ action: "complete", id: model.id, answer: "stale" }), false);
  const next = await message({ action: "ready" });
  await message({ action: "complete", id: next.id, answer: null });
  assert.equal(await second, null);
  await controller.stop();
});

test("composer closure cancels pending requests and overlapping requests are rejected", async () => {
  const { api, controller, message } = await fixture();
  const pending = controller.show({ windowId: 12, prompt });
  await tick();
  await assert.rejects(controller.show({ windowId: 12, prompt }), /already open/);
  for (const listener of api.tabs.onRemoved.listeners) {
    listener(112);
  }
  assert.equal(await pending, null);
  assert.equal(await message({ action: "ready" }), null);
  await controller.stop();
  assert.equal(api.runtime.onMessage.listeners.size, 0);
  assert.equal(api.tabs.onRemoved.listeners.size, 0);
});

test("registration covers existing composers, and stop dismisses outstanding prompts", async () => {
  const { api, controller, message, sent, registered, injected } = await fixture([{ id: 112 }]);
  assert.equal(registered[0].js[0].file, "html/prompt/compose.js");
  assert.deepEqual(injected, [{ id: 112, file: "html/prompt/compose.js" }]);
  assert.equal(message({ action: "ready" }, { tab: { id: 112, type: "mail" } }), false);
  const pending = controller.show({ windowId: 12, prompt });
  await tick();
  await controller.stop();
  assert.equal(await pending, null);
  assert.equal(sent.at(-1).action, "dismiss");
  await assert.rejects(controller.show({ windowId: null, prompt }), /window ID/);
  api.tabs.query = async () => [];
  await assert.rejects(controller.show({ windowId: 12, prompt }), /uniquely identify/);
});

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.events = {}; this.isConnected = false; this.value = ""; }
  append(...children) { this.children.push(...children); for (const child of children) { child.isConnected = true; } }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  setAttribute(key, value) { this[key] = value; }
  removeAttribute(key) { delete this[key]; }
  remove() { this.isConnected = false; }
  addEventListener(key, value) { this.events[key] = value; }
  attachShadow() { this.shadowRoot = new Element("shadow"); return this.shadowRoot; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() { this.focused = true; }
  select() { this.selected = true; }
}

test("renderer isolates UI outside the mail body, restores selection, and ignores stale deliveries", async () => {
  const html = new Element("html");
  const body = new Element("body");
  html.append(body);
  const listeners = [];
  const sent = [];
  const range = { commonAncestorContainer: body, cloneRange() { return this; } };
  const restored = [];
  const selection = { rangeCount: 1, getRangeAt: () => range,
    removeAllRanges() { restored.length = 0; }, addRange: value => restored.push(value) };
  const context = vm.createContext({
    document: { documentElement: html, activeElement: body, getSelection: () => selection,
      getElementById: () => null, createElement: tag => new Element(tag),
      createElementNS: (_namespace, tag) => new Element(tag) },
    browser: { runtime: {
      getURL: path => "moz-extension://test/" + path,
      onMessage: { addListener: fn => listeners.push(fn) },
      sendMessage: async data => { sent.push(data); return null; },
    } }, console,
  });
  const source = readFileSync(new URL("../../../html/prompt/compose.js", import.meta.url), "utf8");
  vm.runInContext(source, context);
  vm.runInContext(source, context);
  assert.equal(listeners.length, 1);
  const model = { ...prompt, choices: [], id: 1, caption: "SmartTemplates · Prompt", accept: "OK", cancel: "Cancel" };
  await listeners[0]({ command: "composePrompt", model });
  const host = html.children.at(-1);
  const dialog = host.shadowRoot.children[1];
  const header = dialog.children[0];
  assert.match(header.children[0].src, /icon32x32.png$/);
  assert.equal(header.children[1].textContent, "SmartTemplates · Prompt");
  assert.equal(header.children[2]["aria-label"], "Cancel");
  assert.equal(header.children[2].children[0].children[0].d, "m5 5 10 10M15 5 5 15");
  const form = dialog.children[1];
  const [label, input, choices, buttons] = form.children;
  assert.equal(body.children.length, 0);
  assert.equal(host.children.length, 0);
  assert.equal(label.textContent, "Choose tea");
  assert.equal(choices.children.length, 0);
  assert.equal(dialog.open, true);
  input.value = "%from% & Oolong";
  input.events.input();
  form.events.submit({ preventDefault() {} });
  await tick();
  assert.equal(sent.at(-1).answer, "%from% & Oolong");
  assert.deepEqual(restored, [range]);
  assert.equal(host.isConnected, false);
  await listeners[0]({ command: "composePrompt", model });
  assert.equal(host.isConnected, false);
  await listeners[0]({ command: "composePrompt", model: { ...model, id: 2, defaultValue: "" } });
  assert.equal(buttons.children[0].disabled, true);
  dialog.events.cancel({ preventDefault() {} });
  await tick();
  assert.equal(sent.at(-1).answer, null);

  // Choice defaults match case-insensitively; the original list spelling is returned.
  await listeners[0]({ command: "composePrompt", model: {
    ...model, choices: prompt.choices, id: 3, defaultValue: "cEyLoN",
  } });
  assert.equal(input.hidden, true);
  assert.equal(input.disabled, true);
  assert.equal(choices.children.length, 3);
  assert.equal(choices.children[1].children[0].checked, true);
  assert.equal(choices.children[1].children[0].focused, true);
  assert.equal(buttons.children[0].disabled, false);
  dialog.events.keydown({ key: "Enter", target: choices.children[1].children[0],
    preventDefault() {}, stopPropagation() {} });
  await tick();
  assert.equal(sent.at(-1).answer, "Ceylon");

  // An unrelated clipboard/default value is ignored until a radio is selected.
  await listeners[0]({ command: "composePrompt", model: {
    ...model, choices: prompt.choices, id: 4, defaultValue: "unrelated clipboard text",
  } });
  assert.equal(choices.children.every(row => !row.children[0].checked), true);
  assert.equal(buttons.children[0].disabled, true);
  const sentBeforeEmptyEnter = sent.length;
  dialog.events.keydown({ key: "Enter", target: choices.children[0].children[0],
    preventDefault() {}, stopPropagation() {} });
  assert.equal(sent.length, sentBeforeEmptyEnter);
  const radio = choices.children[2].children[0];
  radio.checked = true;
  radio.events.change();
  assert.equal(buttons.children[0].disabled, false);
  form.events.submit({ preventDefault() {} });
  await tick();
  assert.equal(sent.at(-1).answer, "Assam");

  await listeners[0]({ command: "composePrompt", model: { ...model, id: 5 } });
  header.children[2].events.click();
  await tick();
  assert.equal(sent.at(-1).answer, null);
  assert.equal(host.isConnected, false);
});
