// Run from the repository root: node "docs/issues/#432 - snippet context menu/check-menu-refresh.cjs"
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function testMenuRefresh() {
  const source = fs.readFileSync('st-background.js', 'utf8');
  const start = source.indexOf('  // [issue 432] Rebuild only');
  const end = source.indexOf('  startupDoneResolve();', start);
  assert.ok(start > 0 && end > start);
  const items = new Map([['unrelated-menu', { title: 'Keep me' }]]);
  const listeners = [];
  const clicks = [];
  const insertions = [];
  const errors = [];
  let failNextCreation = false;
  let debugEnabled = false;
  let removals = 0;
  const browser = {
    Utilities: { async insertSnippet(tabId, entry) { insertions.push({ tabId, entry }); } },
    i18n: { getMessage: (key) => {
      assert.equal(key, 'snippets.head');
      return 'Smart Snippets';
    } },
    runtime: { getManifest: () => ({ name: 'SmartTemplates' }) },
    menus: {
      create(properties, callback) {
        setTimeout(() => {
          if (failNextCreation) {
            failNextCreation = false;
            browser.runtime.lastError = { message: 'Test creation failure' };
          } else {
            assert.ok(!items.has(properties.id), 'No duplicate menu IDs');
            if (properties.parentId) assert.ok(items.has(properties.parentId));
            items.set(properties.id, properties);
          }
          callback();
          delete browser.runtime.lastError;
        }, 0);
        return properties.id;
      },
      async remove(id) {
        removals++;
        await Promise.resolve();
        assert.ok(items.has(id));
        assert.ok(![...items.values()].some(item => item.parentId === id), 'Children removed first');
        items.delete(id);
      },
      onClicked: { addListener: listener => listeners.push(listener) },
      onShown: { addListener() {} },
      onHidden: { addListener() {} },
    },
  };
  const context = vm.createContext({
    browser, Preferences: { isDebug: () => debugEnabled },
    console: { log: (...args) => clicks.push(args), error: (...args) => errors.push(args) },
  });
  vm.runInContext(source.slice(start, end) + '\nthis.refresh = refreshSnippetContextMenu;', context);
  const snippet = (label, category = '', contextMenu = true) => ({
    label, category, contextMenu, path: label + '.html',
  });
  await context.refresh({ snippets: [
    snippet('Root'), snippet('A1', 'A'), snippet('B1', 'B'), snippet('A2', 'A'),
    snippet('Disabled', 'Unused', false), { label: 'Legacy', path: 'old.html' },
  ] });
  assert.deepEqual([...items.values()].map(item => item.title), ['Keep me', 'Smart Snippets', 'Root', 'A', 'A1', 'B', 'B1', 'A2']);
  assert.equal(clicks.length, 0, 'Diagnostics are silent with debug disabled');
  debugEnabled = true;
  await listeners[0]({ menuItemId: 'smart_snippet_3' }, { id: 1 });
  assert.equal(clicks.at(-1)[1].path, 'A2.html');
  assert.equal(insertions.at(-1).tabId, 1);
  assert.equal(insertions.at(-1).entry.path, 'A2.html');

  // Rename, reorder, move category, delete, and enable a formerly excluded item.
  await context.refresh({ snippets: [snippet('Renamed', 'B'), snippet('Root'), snippet('Enabled')] });
  assert.deepEqual([...items.values()].map(item => item.title), ['Keep me', 'Smart Snippets', 'B', 'Renamed', 'Root', 'Enabled']);
  const before = clicks.length;
  await listeners[0]({ menuItemId: 'smart_snippet_3' }, {});
  assert.equal(clicks.length, before, 'Removed item has no click mapping');
  await listeners[0]({ menuItemId: 'smart_snippet_0' }, { id: 2 });
  assert.equal(clicks.at(-1)[1].path, 'Renamed.html');
  assert.equal(insertions.at(-1).entry.path, 'Renamed.html');
  assert.equal(insertions.at(-1).tabId, 2);
  const insertionCount = insertions.length;
  await listeners[0]({ menuItemId: 'smart_snippet_root' }, { id: 2 });
  await listeners[0]({ menuItemId: 'smart_snippet_0' }, {});
  assert.equal(insertions.length, insertionCount, 'Parent clicks and missing tabs cannot insert');
  assert.equal(errors.length, 1, 'Invalid target is reported');

  const first = context.refresh({ snippets: [snippet('Earlier')] });
  const latest = { snippets: [snippet('Latest')] };
  const second = context.refresh(latest);
  latest.snippets[0].label = 'Mutated after queueing';
  await Promise.all([first, second]);
  assert.equal(items.get('smart_snippet_0').title, 'Latest', 'Queued updates use snapshots');
  assert.equal(listeners.length, 1, 'Listener registered only once');

  failNextCreation = true;
  await assert.rejects(context.refresh({ snippets: [snippet('Failure', 'Category')] }));
  await context.refresh({ snippets: [snippet('Recovered')] });
  assert.equal(items.get('smart_snippet_0').title, 'Recovered');
  assert.equal(items.get('smart_snippet_0').parentId, 'smart_snippet_root');
  const previousRemovals = removals;
  const root = items.get('smart_snippet_root');
  await context.refresh({ snippets: [{ ...snippet('Recovered'), _sortId: 99 }] });
  assert.equal(removals, previousRemovals, 'Unchanged menus are not torn down');
  assert.equal(items.get('smart_snippet_root'), root);
  await context.refresh({ snippets: [snippet('Single category child', 'Layout')] });
  assert.equal(items.get('smart_snippet_root').title, 'Layout');
  assert.equal(items.get('smart_snippet_0').parentId, 'smart_snippet_root');
  assert.equal(items.has('smart_snippet_cat_0'), false);
  await context.refresh({ snippets: [snippet('First', 'Layout'), snippet('Second', 'Layout')] });
  assert.deepEqual([...items.values()].map(item => item.title), ['Keep me', 'Layout', 'First', 'Second']);
  await context.refresh({ snippets: [snippet('First', 'Layout'), snippet('Other', 'Code')] });
  assert.equal(items.get('smart_snippet_root').title, 'Smart Snippets');
  assert.equal(items.get('smart_snippet_cat_0').parentId, 'smart_snippet_root');
  assert.equal(items.get('smart_snippet_cat_1').parentId, 'smart_snippet_root');
  await context.refresh({ snippets: [] });
  assert.deepEqual([...items.keys()], ['unrelated-menu']);
}

async function testCheckboxes() {
  const source = fs.readFileSync('html/smartTemplate-settings.js', 'utf8');
  const start = source.indexOf('var fileTemplates = {');
  const end = source.indexOf('}; // copy of recent and configured file templates', start);
  assert.ok(start > 0 && end > start);
  let scheduled;
  let changed;
  let resized;
  const saved = [];
  const controls = [];
  const events = {};
  const options = [
    { dataset: { sortId: '1' }, label: 'First', getBoundingClientRect: () => ({ top: 102, bottom: 122, height: 20 }) },
    { dataset: { sortId: '2' }, label: 'Second', getBoundingClientRect: () => ({ top: 122, bottom: 142, height: 20 }) },
  ];
  const column = { appendChild: node => controls.push(node) };
  const select = {
    options, selectedIndex: -1,
    parentElement: { querySelector: () => column },
    getBoundingClientRect: () => ({ top: 100, bottom: 140, height: 40 }),
    addEventListener: (name, fn) => { events[name] = fn; },
  };
  const context = vm.createContext({
    console,
    document: {
      getElementById: () => select,
      createElement: () => ({
        dataset: {}, style: {},
        setAttribute(name, value) { this[name] = value; },
        addEventListener(name, fn) { this[name] = fn; },
        remove() { controls.splice(controls.indexOf(this), 1); },
      }),
    },
    SmartTemplates: { Util: { getBundleString: () => 'Show in context menu' } },
    messenger: { Utilities: { updateTemplates: async entries => saved.push(entries) } },
    requestAnimationFrame: fn => { scheduled = fn; return 1; },
    MutationObserver: class { constructor(fn) { changed = fn; } observe() {} },
    ResizeObserver: class { constructor(fn) { resized = fn; } observe() {} },
  });
  vm.runInContext(source.slice(start, end + 2), context);
  const manager = context.fileTemplates;
  manager.onSelect = () => {};
  manager.Entries.snippets = [
    { _sortId: 1, path: 'first.html', label: 'First', contextMenu: true },
    { _sortId: 2, path: 'second.html', label: 'Second' },
  ];
  manager.initSnippetContextChecks();
  scheduled();
  assert.equal(controls.length, 2);
  assert.equal(controls[0].checked, true);
  assert.equal(controls[1].checked, false);
  assert.equal(controls[0].style.top, '12px');
  controls[1].checked = true;
  await controls[1].change();
  assert.equal(select.selectedIndex, 1);
  assert.equal(saved.at(-1).snippets[1].contextMenu, true);
  assert.equal(Object.hasOwn(saved.at(-1).snippets[1], '_sortId'), false);
  controls[0].checked = false;
  await controls[0].change();
  assert.equal(saved.at(-1).snippets[0].contextMenu, false);

  // Reordering moves checkbox positions without losing flags or focused controls.
  options.reverse();
  manager.Entries.snippets.reverse();
  changed(); scheduled();
  assert.equal(controls[0].checked, false);
  assert.equal(controls[1].checked, true);
  options.pop();
  manager.Entries.snippets.pop();
  changed(); scheduled();
  assert.equal(controls.length, 1);
  events.scroll(); scheduled();
  resized(); scheduled();
}

async function testSettingsEdits() {
  const source = fs.readFileSync('html/smartTemplate-settings.js', 'utf8');
  const start = source.indexOf('var fileTemplates = {');
  const end = source.indexOf('}; // copy of recent and configured file templates', start);
  const saves = [];
  const fields = {};
  const context = vm.createContext({
    console: { log() {} },
    document: { getElementById: id => fields[id] ||= { value: '' } },
    messenger: { Utilities: {
      updateTemplates: async entries => saves.push(JSON.parse(JSON.stringify(entries))),
      openTemplateList: async () => ({ path: 'import.json', data: [
        { path: 'imported.html', label: 'Imported', category: 'New', contextMenu: true },
      ] }),
    } },
    SmartTemplates: {
      Settings: { logDebug() {}, currentListType: 'snippets' },
      Preferences: { isDebug: async () => false },
    },
    array_move(array, from, to) { array.splice(to, 0, array.splice(from, 1)[0]); },
  });
  vm.runInContext(source.slice(start, end + 2), context);
  const manager = context.fileTemplates;
  const list = { selectedIndex: 0, options: [], remove(index) { this.options.splice(index, 1); } };
  Object.defineProperty(list, 'length', { get: () => list.options.length });
  Object.defineProperty(list, 'selectedOptions', { get: () => list.options[list.selectedIndex] ? [list.options[list.selectedIndex]] : [] });
  Object.defineProperty(manager, 'activeFileList', { get: () => list });
  Object.defineProperty(manager, 'CurrentEntries', { get: () => manager.Entries.snippets });
  manager.repopulate = () => {
    list.options = manager.Entries.snippets.map(entry => ({
      label: entry.label, value: JSON.stringify({ path: entry.path }),
      dataset: { sortId: String(entry._sortId) }, classList: { remove() {} },
    }));
  };
  manager.Entries.snippets = [
    { _sortId: 1, path: 'a.html', label: 'A', category: 'A', contextMenu: true },
    { _sortId: 2, path: 'b.html', label: 'B', category: 'B', contextMenu: false },
  ];
  manager.repopulate();
  await manager.updateEntry(false, { path: 'renamed.html', label: 'Renamed', category: 'Changed' });
  assert.equal(saves.at(-1).snippets[0].label, 'Renamed');
  assert.equal(saves.at(-1).snippets[0].contextMenu, true);
  await manager.moveEntryDown();
  assert.equal(saves.at(-1).snippets[1].path, 'renamed.html');
  await manager.moveEntryUp();
  assert.equal(saves.at(-1).snippets[0].path, 'renamed.html');
  await manager.onDrop({
    target: list.options[1],
    dataTransfer: { getData: () => JSON.stringify({ sortId: 1 }) },
  });
  assert.equal(saves.at(-1).snippets[1].path, 'renamed.html');
  assert.equal(saves.at(-1).snippets[1].contextMenu, true);
  await manager.removeEntry();
  assert.equal(saves.at(-1).snippets.length, 1);
  await manager.importTemplates();
  assert.equal(saves.at(-1).snippets.at(-1).label, 'Imported');
  assert.equal(saves.at(-1).snippets.at(-1).contextMenu, true);
}

(async () => {
  await testMenuRefresh();
  await testCheckboxes();
  await testSettingsEdits();
  console.log('Passed menu lifecycle, ordering, click mappings, queued refreshes, recovery, checkbox persistence, rename, move, drag/drop, deletion, and import checks.');
})().catch(error => { console.error(error); process.exitCode = 1; });
