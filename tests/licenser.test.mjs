import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Exercise the production validator with a synthetic RSA result, never a real key.
const source = readFileSync(new URL("../scripts/Licenser.mjs.js", import.meta.url), "utf8")
  .replace(/^import .*;\r?\n/gm, "")
  .replace(/export /g, "");

function fixture(prefix = "ST", expiry = "2099-11-22") {
  let accountReads = 0;
  const context = vm.createContext({
    crypto: {
      getKeyType: () => ({ ST: 0, S1: 2, STD: 1 })[prefix],
      getDecryption_key: () => "synthetic",
      getModulus: () => "synthetic",
      getKeyLength: () => 256,
      getMaxDigits: () => 35,
    },
    RSA: {
      initialise() {},
      RSAKeyPair: function () {},
      decryptedString: () => `${prefix}-alex@example.com:${expiry}`,
    },
    log() {},
    messenger: {
      accounts: { async list() { accountReads++; return [{ id: "test" }]; } },
      identities: { async getDefault() { return { email: "alex@example.com" }; } },
    },
  });
  const Licenser = vm.runInContext(source + "\nLicenser;", context);
  return {
    create: (date = expiry, email = "alex@example.com", visiblePrefix = prefix) =>
      new Licenser(`${visiblePrefix}-${email}:${date};synthetic-ciphertext`),
    accountReads: () => accountReads,
  };
}

test("date edits are rejected before account matching for every edition", async () => {
  for (const prefix of ["ST", "S1", "STD"]) {
    for (const date of ["2099-12-22", "2099-10-22", "", "invalid-date"]) {
      const f = fixture(prefix);
      const license = f.create(date);
      await license.validate();
      assert.equal(license.info.status, "Invalid", `${prefix}: ${date}`);
      assert.equal(license.info.isValid, false);
      assert.equal(license.info.licensedDaysLeft, 0);
      assert.equal(f.accountReads(), 0);
    }
  }
});

test("matching dates retain valid and expired states", async () => {
  for (const [date, status] of [["2099-11-22", "Valid"], ["2000-11-22", "Expired"]]) {
    const license = fixture("ST", date).create();
    await license.validate();
    assert.equal(license.info.status, status);
  }
});

test("email mismatches retain the existing MailDifferent error", async () => {
  const license = fixture().create("2099-11-22", "other@example.com");
  await license.validate();
  assert.equal(license.info.status, "MailDifferent");
});

test("foreign, malformed, and substituted edition prefixes are invalid", async () => {
  for (const visiblePrefix of ["QF", "QI", "Q2", "", "STX", "S1", "STD"]) {
    const f = fixture("ST");
    const license = f.create("2099-11-22", "alex@example.com", visiblePrefix);
    await license.validate();
    assert.equal(license.info.status, "Invalid", visiblePrefix);
    assert.equal(f.accountReads(), 0);
  }
  const license = fixture("S1").create("2099-11-22", "alex@example.com", "ST");
  await license.validate();
  assert.equal(license.info.status, "Invalid");
});
