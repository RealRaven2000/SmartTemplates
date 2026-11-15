import assert from "node:assert/strict";
import { test } from "node:test";
import { createBackgroundUsage } from "../scripts/premium/usage-background.mjs";
import { POLICY } from "../scripts/premium/usage-policy.js";
import { createComposeNotifications } from "../html/compose-notifications/controller.mjs";

function fixture(saved = {}) {
  const disk = { ...saved };
  let reads = 0;
  const writes = [];
  const license = { status: "Expired", keyType: 2, trialDays: 0 };
  let date = new Date(2026, 10, 15, 23, 59);
  const store = createBackgroundUsage({
    async getPref(key, fallback) {
      reads++;
      return disk[key] ?? fallback;
    },
    async createPref(key, value) {
      writes.push([key, value]);
      disk[key] = value;
      return "string";
    },
  }, () => license, () => date);
  return { store, disk, writes, license, reads: () => reads, setDate: value => { date = value; } };
}

test("loads counters once and updates the authoritative cache before persistence", async () => {
  const f = fixture();
  await Promise.all([f.store.init(), f.store.init()]);
  assert.equal(f.reads(), Object.keys(POLICY).length);
  const result = f.store.check("prompt", true);
  assert.equal(result.remaining, 11);
  assert.equal(result.then, undefined);
  assert.equal(f.writes.length, 0);
  assert.equal(f.store.check("prompt", true).remaining, 11);
  await f.store.flush();
  assert.equal(f.writes.length, 1);
  assert.deepEqual(JSON.parse(f.disk["extensions.smarttemplates.prompt"]), {
    usage: 1, lastUsedDate: "2026-11-15",
  });
  assert.equal(f.reads(), Object.keys(POLICY).length);
});

test("prepared allowances are detached and session consumption keeps its startup date", async () => {
  const f = fixture();
  await f.store.init();
  const snapshot = f.store.snapshot();
  assert.equal(snapshot.allowances.prompt.remaining, 12);
  snapshot.allowances.prompt.remaining = 0;
  assert.equal(f.store.snapshot().allowances.prompt.remaining, 12);
  assert.equal(f.store.check("prompt", true, snapshot.timestamp).remaining, 11);
  f.setDate(new Date(2026, 10, 16, 0, 1));
  assert.equal(f.store.check("prompt", true, snapshot.timestamp).remaining, 11);
  assert.equal(f.store.check("clipboard", true, snapshot.timestamp).remaining, 11);
  await f.store.flush();
  assert.equal(f.writes.length, 2);
  assert.equal(JSON.parse(f.disk["extensions.smarttemplates.clipboard"]).lastUsedDate, "2026-11-15");
  assert.equal(f.store.check("prompt", true).remaining, 10);
  await f.store.flush();
});

test("preserves legacy counters, last-use allowance, limits and licence tiers", async () => {
  const f = fixture({
    "extensions.smarttemplates.prompt": JSON.stringify({ used: 12, lastUsedDate: "2026-11-15" }),
    "extensions.smarttemplates.clipboard": JSON.stringify({ usage: 12, lastUsedDate: "2026-11-14" }),
  });
  await f.store.init();
  assert.equal(f.store.check("prompt", true).allowed, true);
  assert.equal(f.store.check("clipboard", true).allowed, false);
  await f.store.flush();
  assert.deepEqual(JSON.parse(f.disk["extensions.smarttemplates.prompt"]), {
    usage: 12, lastUsedDate: "2026-11-15",
  });
  f.license.status = "Valid";
  f.license.trialDays = 28;
  assert.equal(f.store.check("dateformat", true).covered, true);
  assert.equal(f.store.check("clipboard", true).allowed, false);
  f.license.keyType = 0;
  assert.equal(f.store.check("clipboard", true).covered, true);
  f.license.status = "Invalid";
  assert.equal(f.store.check("clipboard", true).trial, true);
  assert.equal(f.store.check("unknown", true), null);
  assert.equal(f.writes.length, 1);
});

test("notification registration uses the supplied legacy caller with feature context", async () => {
  let listener;
  const registrations = [];
  // Deliberately no Utilities API: registration must use the existing caller.
  const api = {
    runtime: { onMessage: { addListener(fn) { listener = fn; } } },
    i18n: { getMessage: key => key },
    storage: { local: { get: async () => ({}) } },
    tabs: {
      query: async query => query.windowId ? [{ id: 1 }] : [],
      sendMessage: async () => {},
      onRemoved: { addListener() {} },
    },
    composeScripts: { register: async () => {} },
  };
  const controller = createComposeNotifications(api, {
    showRegistrationDialog: feature => {
      registrations.push(feature);
      return Promise.resolve(true);
    },
  });
  await controller.start();
  await controller.show({ windowId: 1, features: ["prompt"], isProFeature: true });
  await controller.show({ windowId: 1, features: ["dateformat"] });
  assert.equal(listener({ command: "unrelated" }, {}), false);
  assert.equal(await listener({ command: "composeNotifications", action: "buy" }, {
    tab: { id: 1, type: "messageCompose" },
  }), true);
  assert.deepEqual(registrations, ["prompt|dateformat"]);
});
