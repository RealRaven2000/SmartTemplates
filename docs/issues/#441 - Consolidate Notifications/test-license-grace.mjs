import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function fixture(status, savedDate) {
  const values = new Map([["license.gracePeriodDate", savedDate]]);
  const source = fs.readFileSync(new URL("../../../st-background.js", import.meta.url), "utf8");
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ["2026-11-11T12:00:00Z"]));
    }
  }
  const scope = vm.createContext({
    Date: FixedDate,
    currentLicense: { info: { status } },
    Preferences: {
      get: key => values.get(key),
      set: async (key, value) => { values.set(key, value); },
      isDebug: () => false,
    },
  });
  const constants = source.match(/^const (?:GRACEPERIOD_DAYS|EXPIRED_LICENSE_GRACE_DAYS) = \d+;/gm).join("\n");
  const functions = source.slice(source.indexOf("  async function getGraceDate("),
    source.indexOf("  async function openPrefs("));
  vm.runInContext(constants + "\n" + functions, scope);
  return scope;
}

test("new users retain 28 days while expiry grants seven days anchored to expiry", async () => {
  const fresh = fixture("Empty");
  assert.equal(await fresh.getTrialDays(), 28);
  const expired = { status: "Expired", expiryDate: "2026-11-11" };
  assert.equal(await fresh.getTrialDays(expired), 7);
  assert.equal(await fresh.getTrialDays({ ...expired, expiryDate: "2026-11-05" }), 1);
  assert.equal(await fresh.getTrialDays({ ...expired, expiryDate: "2026-11-04" }), 0);
  assert.equal(await fresh.getTrialDays({ ...expired, expiryDate: "2026-11-01" }), -3);
});

test("incoming expired key uses its own status, not the previous valid license", async () => {
  const scope = fixture("Valid", "2026-11-11");
  assert.equal(await scope.getTrialDays({ status: "Expired", expiryDate: "2026-11-05" }), 1);
  const missing = fixture("Empty");
  assert.equal(await missing.getTrialDays({ status: "Expired", expiryDate: "2026-11-01" }), -3);
});
