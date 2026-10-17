// Run from the repository root with node.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function main() {
  const source = fs.readFileSync('chrome/content/api/Utilities/implementation.js', 'utf8');
  const start = source.indexOf('        insertSnippet:');
  const end = source.indexOf('        beforeSend:', start);
  assert.ok(start > 0 && end > start);
  const calls = [];
  let finishInsertion;
  const fileTemplates = {
    insertFileEntryInComposer(entry) {
      assert.equal(this, fileTemplates, 'Preserve the legacy method receiver');
      calls.push(entry);
      return new Promise(resolve => { finishInsertion = resolve; });
    },
  };
  const composeWindow = {
    document: { documentElement: { getAttribute: () => 'msgcompose' } },
    gMsgCompose: { editor: {} },
    SmartTemplate4: { fileTemplates },
  };
  const context = { extension: { tabManager: { get(id) {
    if (id === 10) return { window: composeWindow };
    if (id === 20) return { window: {
      document: { documentElement: { getAttribute: () => 'mail:3pane' } },
    } };
    throw new Error('Tab does not exist');
  } } } };
  const api = vm.runInNewContext('({' + source.slice(start, end) + '})', { context });
  let finished = false;
  const pending = api.insertSnippet(10, { path: 'snippet.html', label: 'Example' })
    .then(() => { finished = true; });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { path: 'snippet.html', label: 'Example', category: '' },
  ]);
  await Promise.resolve();
  assert.equal(finished, false, 'API waits for legacy insertion to complete');
  finishInsertion();
  await pending;
  await assert.rejects(api.insertSnippet(20, {}), /open compose tab/);
  await assert.rejects(api.insertSnippet(99, {}), /Tab does not exist/);
  delete composeWindow.SmartTemplate4;
  await assert.rejects(api.insertSnippet(10, {}), /not ready/);
  composeWindow.SmartTemplate4 = { fileTemplates: {
    async insertFileEntryInComposer() { throw new Error('Insertion failed'); },
  } };
  await assert.rejects(api.insertSnippet(10, {}), /Insertion failed/);
  const schema = JSON.parse(fs.readFileSync('chrome/content/api/Utilities/schema.json', 'utf8'));
  assert.ok(schema[0].functions.some(fn => fn.name === 'insertSnippet' && fn.async));
  console.log('Passed compose targeting, readiness, asynchronous completion, and insertion error checks.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
