// Run from the repository root with node. Exercises production parser sections.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('chrome/content/smartTemplate-overlay.js', 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Find ${start}`);
  return source.slice(a, b);
}
const helpers = section('  function parseParams(', '  function htmlToElement(');
const commands = section('  /* Remove quoted tags */', '  return msg;');
class Element {
  constructor(tag, parent, id = '') {
    this.tagName = tag; this.id = id; this.children = []; this.parentNode = parent;
    this.outerHTML = `<${tag}>example</${tag}>`;
    this.classList = { contains: () => false };
    if (parent) { parent.children.push(this); this.ownerDocument = parent.ownerDocument; }
  }
  getAttribute() { return null; }
  querySelectorAll(selector) {
    const result = [];
    const visit = node => {
      for (const child of node.children) {
        if (child.tagName === selector ||
            (selector === 'div.moz-forward-container' && child.id === 'forward')) result.push(child);
        visit(child);
      }
    };
    visit(this); result.item = i => result[i]; return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  insertBefore(node, before) {
    node.parentNode = this;
    this.children.splice(this.children.indexOf(before), 0, node);
  }
  remove() {
    this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }
}
function run(command, scope, forward = false, minSize = 0, missingHead = false) {
  const doc = {};
  const html = new Element('html'); html.ownerDocument = doc; doc.documentElement = html;
  doc.head = missingHead ? null : new Element('head', html);
  doc.body = new Element('body', html);
  if (doc.head) new Element('style', doc.head, 'head');
  new Element('style', doc.body, 'body');
  const container = new Element('div', doc.body, 'forward');
  new Element('style', container, 'forward');
  const quote = new Element('blockquote', container);
  new Element('style', quote, 'quote');
  new Element('style', new Element('blockquote', quote), 'nested');
  const original = html.querySelectorAll('style');
  const diagnostics = [];
  const util = {
    extractParameters: cmd => cmd.slice(cmd.indexOf('(') + 1, -2).split(','),
    unquotedRegex: value => value.slice(1, -1),
    isComposeTypeIsForwardInline: () => forward,
    logToConsole: text => diagnostics.push(text),
    logDebug() {}, addUsedPremiumFunction() {},
    logException: (text, error) => { throw error; },
  };
  const args = ['"style"'];
  if (command === 'replaceQuotedTags') args.push('"<style>replacement</style>"');
  if (scope !== undefined) args.push(String(scope));
  if (minSize) args.push(String(minSize));
  const cmd = `%${command}(${args.join(',')})%`;
  const context = {
    util, SmartTemplate4: { Util: util, composer: { body: doc.body } },
    gMsgCompose: { editor: { document: doc } },
    htmlToElement: () => new Element('style'), displayTag: node => node.tagName,
    msg: cmd, MIN_QUOTELEVEL: 1,
    quoteTags: command === 'deleteQuotedTags' ? [cmd] : null,
    quoteTagsR: command === 'replaceQuotedTags' ? [cmd] : null,
  };
  vm.runInNewContext(helpers + commands, context);
  return { changed: original.filter(node => !node.parentNode).map(node => node.id), diagnostics };
}
let checks = 0;
for (const command of ['deleteQuotedTags', 'replaceQuotedTags']) {
  for (const forward of [false, true]) {
    for (const [scope, expected] of [
      [undefined, ['quote', 'nested']], [1, ['quote', 'nested']], [2, ['nested']],
      [0, forward ? ['forward', 'quote', 'nested'] : ['body', 'forward', 'quote', 'nested']],
      ['head', ['head']], ['body', ['body', 'forward', 'quote', 'nested']],
      ['all', ['head', 'body', 'forward', 'quote', 'nested']],
      [-1, ['head', 'body', 'forward', 'quote', 'nested']], [' head ', ['head']],
    ]) {
      const result = run(command, scope, forward);
      assert.deepEqual(result.changed, expected, `${command}: ${scope}, forward=${forward}`);
      assert.equal(result.diagnostics.length, 0);
      checks++;
    }
    for (const invalid of ['bogus', -2, '1junk', 'selection', '"all"']) {
      const result = run(command, invalid, forward);
      assert.deepEqual(result.changed, []);
      assert.equal(result.diagnostics.length, 1);
      checks++;
    }
    for (const scope of ['head', 'body', 'all', -1, 0, 1]) {
      assert.deepEqual(run(command, scope, forward, 100).changed, [], 'Respect minimum size');
      checks++;
    }
  }
  assert.deepEqual(run(command, 'head', false, 0, true).changed, []);
  assert.deepEqual(run(command, 'all', false, 0, true).changed, ['body', 'forward', 'quote', 'nested']);
  checks += 2;
}
console.log(`Passed ${checks} quoted-tag scope checks (mock editor DOM).`);
