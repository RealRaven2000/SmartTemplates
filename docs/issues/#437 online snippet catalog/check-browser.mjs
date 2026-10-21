import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import path from "node:path";
import { repositoryURL, assetURL, parseCatalog, prepareImport, initSnippetBrowser } from "../../../html/st-snippet-browser.mjs";

const base = "https://smarttemplates.quickfolders.org/repo/snippets/index.json";
assert.equal(repositoryURL(base.replace("/index.json", "")), base);
assert.equal(repositoryURL(base), base);
assert.throws(() => repositoryURL("file:///tmp/index.json"));
for (const path of ["../x", "/x", "img/../../x", "img\\x", "%2e%2e/x", "https://other/x"]) {
  assert.throws(() => assetURL(path, base));
}
const fixture = { version: 1, snippets: [
  { title: "Background", category: "Layout", file: "background.html", description: "Background", assets: ["img/test.png"] },
  { title: "Format", category: "Format", file: "format.html", description: "Format" },
] };
const items = parseCatalog(fixture, base);
assert(items.length >= 2);
assert.throws(() => parseCatalog({ version: 2, snippets: [] }, base));
assert.throws(() => parseCatalog({ version: 1, snippets: [fixture.snippets[0], fixture.snippets[0]] }, base));

const requests = [];
globalThis.fetch = async url => {
  requests.push(url);
  return { ok: true, json: async () => fixture, arrayBuffer: async () => new Uint8Array([0, 128, 255]).buffer };
};
const files = await prepareImport([items[0], items[0]], base);
assert.equal(files.length, new Set([items[0].file, ...items[0].assets]).size);
assert.deepEqual([...Buffer.from(files[0].data, "base64")], [0, 128, 255]);
globalThis.fetch = async () => ({ ok: false, status: 404 });
await assert.rejects(() => prepareImport([items[0]], base), /404/);

class Element {
  style = {};
  children = [];
  dataset = {};
  listeners = {};
  classList = { toggle() {} };
  addEventListener(type, fn) { this.listeners[type] = fn; }
  async fire(type, event = {}) { return this.listeners[type]?.(event); }
  getBoundingClientRect() {
    const left = parseFloat(this.style.left) || 100;
    const top = parseFloat(this.style.top) || 60;
    const width = parseFloat(this.style.width) || 920;
    const height = parseFloat(this.style.height) || 720;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }
  setPointerCapture() {}
  releasePointerCapture() {}
  setAttribute() {}
  removeAttribute() {}
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  querySelector() { return this.children[1]; }
  showModal() { this.open = true; }
  close() { this.open = false; this.listeners.close?.(); }
}
const elements = new Map();
globalThis.window = { innerWidth: 1400, innerHeight: 1000, addEventListener() {} };
globalThis.document = {
  getElementById(id) {
    if (!elements.has(id)) { elements.set(id, new Element()); }
    return elements.get(id);
  },
  createElement() { return new Element(); },
};
globalThis.messenger = {
  Utilities: { selectSnippetFolder: async () => "/chosen" },
  storage: { local: { get: async () => ({ snippetRepositoryURL: base }) } },
  i18n: { getMessage: key => key },
};
globalThis.fetch = async () => ({ ok: true, json: async () => fixture, arrayBuffer: async () => new Uint8Array([1]).buffer });
let imported;
let fail = true;
const open = initSnippetBrowser({ onImport: async (selection, batch, targetFolder) => {
  if (fail) { throw new Error("Install failed"); }
  imported = { selection, batch, targetFolder };
} });
await open();
const get = id => document.getElementById(id);
assert.equal(get("snippetCatalogContextMenu").checked, false);
const pointer = (clientX, clientY) => ({ button: 0, pointerId: 1, clientX, clientY, preventDefault() {} });
const grip = get("snippetBrowserResize");
await grip.fire("pointerdown", pointer(1020, 780));
await grip.fire("pointermove", pointer(1120, 830));
assert.equal(get("snippetBrowser").style.width, "1020px");
assert.equal(get("snippetBrowser").style.height, "770px");
assert.equal(get("snippetBrowser").style.left, "100px");
await grip.fire("pointerup", pointer(1120, 830));
const caption = get("snippetBrowserHeading");
await caption.fire("pointerdown", pointer(100, 60));
await caption.fire("pointermove", pointer(-1000, -1000));
assert.equal(get("snippetBrowser").style.left, "8px");
assert.equal(get("snippetBrowser").style.top, "8px");
await caption.fire("pointerup", pointer(-1000, -1000));
const rows = get("snippetCatalogList").children;
assert.equal(rows[0].children[1].textContent, "Layout » Background");
const first = rows[0].children[0];
const second = rows[1].children[0];
first.checked = true;
await first.fire("change");
get("snippetCatalogTitle").value = "Mon extrait";
await get("snippetCatalogTitle").fire("input");
get("snippetCatalogCategory").value = "Mise en page";
await get("snippetCatalogCategory").fire("input");
assert.equal(rows[0].children[1].textContent, "Mise en page » Mon extrait");
second.checked = true;
await second.fire("change");
assert.equal(get("snippetCatalogFile").textContent, items[1].file);
await rows[0].children[1].fire("click");
assert.equal(get("snippetCatalogTitle").value, "Mon extrait");
assert.equal(get("snippetCatalogCategory").value, "Mise en page");
assert(first.checked && second.checked);
await get("snippetCatalogPreview").fire("error");
assert.equal(get("snippetCatalogPlaceholder").hidden, false);
messenger.Utilities.selectSnippetFolder = async () => "";
await get("snippetCatalogAdd").fire("click");
assert(get("snippetBrowser").open);
assert(first.checked && second.checked);
assert.equal(get("snippetCatalogTitle").value, "Mon extrait");
assert.equal(get("snippetCatalogAdd").disabled, false);
assert.equal(imported, undefined);
messenger.Utilities.selectSnippetFolder = async () => "/chosen";
await get("snippetCatalogAdd").fire("click");
assert(get("snippetBrowser").open);
assert(first.checked && second.checked);
assert.equal(get("snippetCatalogTitle").value, "Mon extrait");
fail = false;
get("snippetCatalogContextMenu").checked = true;
await get("snippetCatalogAdd").fire("click");
assert.equal(imported.selection.length, 2);
assert.equal(imported.targetFolder, "/chosen");
assert.equal(imported.selection[0].label, "Mon extrait");
assert.equal(imported.selection[0].category, "Mise en page");
assert(imported.selection.every(item => item.contextMenu === true));
assert.equal(get("snippetBrowser").open, false);
await open();
assert.equal(get("snippetCatalogContextMenu").checked, false);
await get("snippetBrowserClose").fire("click");
assert.equal(get("snippetBrowser").open, false);
console.log("PASS: catalog validation, paths, binary downloads, deduplication, failure handling, multiselection, edited titles, preview fallback, and close on success.");

const writes = [];
const disk = new Map();
const removed = [];
const debugLog = [];
let remembered = "/remembered";
let pickerResult = 0;
const picker = {
  modeGetFolder: 2,
  init(parent, title, mode) { this.title = title; this.mode = mode; },
  open(callback) { callback(pickerResult); },
  file: { path: "/chosen" },
};
const context = {
  Components: {
    interfaces: { nsIFilePicker: { returnOK: 0 }, nsIFile: {} },
    classes: {
      "@mozilla.org/filepicker;1": { createInstance() { return picker; } },
      "@mozilla.org/file/local;1": { createInstance() { return {
        initWithPath(value) { this.path = value; }, exists() { return true; }, isDirectory() { return true; },
      }; } },
    },
  },
  ChromeUtils: { importESModule() { return {
    ExtensionCommon: { ExtensionAPI: class {} },
    ExtensionUtils: { ExtensionError: class extends Error {} },
  }; } },
  Services: { wm: { getMostRecentWindow() { return {
    atob,
    SmartTemplate4: {
      Util: { logDebugOptional(...args) { debugLog.push(args); }, getFileInitArg() {}, getBundleString() { return "Select target folder"; } },
      Preferences: { getStringPref() { return remembered; }, setStringPref(key, value) { assert.equal(key, "fileTemplates.path"); remembered = value; } },
    },
  }; } }, uuid: { generateUUID() { return "{test-import}"; } } },
  PathUtils: { profileDir: "/profile", join: path.posix.join, parent: path.posix.dirname },
  IOUtils: {
    async exists(path) { return disk.has(path); },
    async read(path) { return disk.get(path); },
    async makeDirectory() {},
    async write(destination, bytes, options) {
      assert.equal(options.mode, "create");
      assert(!disk.has(destination));
      disk.set(destination, bytes);
      writes.push([destination, [...bytes]]);
    },
    async remove(file) { removed.push(file); disk.delete(file); },
  },
  Uint8Array,
};
vm.createContext(context);
vm.runInContext(await readFile(new URL("../../../chrome/content/api/Utilities/implementation.js", import.meta.url), "utf8"), context);
const api = vm.runInContext("new Utilities().getAPI({}).Utilities", context);
assert.equal(await api.selectSnippetFolder(), "/chosen");
assert.equal(picker.title, "Select target folder");
assert.equal(picker.mode, picker.modeGetFolder);
assert.equal(picker.displayDirectory.path, "/remembered");
assert.equal(remembered, "/chosen");
pickerResult = 1;
assert.equal(await api.selectSnippetFolder(), "");
assert.equal(remembered, "/chosen");
const installed = await api.installSnippetFiles([{ path: "img/test.png", data: "AID/" }], "/chosen");
assert.equal(installed[0], "/chosen/img/test.png");
assert.deepEqual(writes[0][1], [0, 128, 255]);
await api.installSnippetFiles([{ path: "img/test.png", data: "AID/" }], "/chosen");
assert.equal(writes.length, 1, "Identical files must be reused");
await assert.rejects(() => api.installSnippetFiles([
  { path: "new.html", data: "AQ==" }, { path: "img/test.png", data: "Ag==" },
], "/chosen"), /A different file already exists/);
assert.equal(writes.length, 1, "Conflicts must be checked before writing any files");
await assert.rejects(() => api.installSnippetFiles([{ path: "../outside", data: "" }], "/chosen"));
const write = context.IOUtils.write;
context.IOUtils.write = async (...args) => {
  if (args[0].endsWith("test.html")) { throw new Error("Disk full"); }
  return write(...args);
};
await assert.rejects(() => api.installSnippetFiles([
  { path: "new.html", data: "AQ==" }, { path: "test.html", data: "" },
], "/chosen"), /Disk full/);
assert.deepEqual(removed, ["/chosen/new.html"]);
assert(disk.has("/chosen/img/test.png"), "Rollback must preserve existing files");
context.IOUtils.makeDirectory = async () => { throw new Error("Access denied"); };
await assert.rejects(() => api.installSnippetFiles([{ path: "test.html", data: "" }], "/chosen"), /Access denied/);
assert(debugLog.every(args => args[0] === "snippets.remote"));
console.log("PASS: profile file installation, binary integrity, traversal rejection, and rollback on write failure.");
