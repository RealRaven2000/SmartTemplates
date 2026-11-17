import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

function catalog(locale) {
  const bytes = readFileSync(new URL(`../_locales/${locale}/messages.json`, import.meta.url));
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  assert.equal(text.includes("\uFFFD"), false, `${locale}: replacement character`);
  const topLevelKeys = [...text.matchAll(/^  "([^"\r\n]+)":/gm)].map((match) => match[1]);
  assert.equal(new Set(topLevelKeys).size, topLevelKeys.length, `${locale}: duplicate entity`);
  return JSON.parse(text);
}

function tokens(text) {
  return [...text.matchAll(/\$\d+|\$[a-zA-Z_][\w]*\$|\{[^}]+\}/g)]
    .map((match) => match[0]).sort();
}

const en = catalog("en");
const composeKeys = Object.keys(en).filter((key) => key.startsWith("notification.compose."));
// SPLASH translates licensing/onboarding, not general composer/error controls.
const featureUI = new Set([
  "blocked", "blockedExplanation", "collapse", "copyTemplateSource", "dismiss",
  "dismissIssue", "expand", "issue", "issues",
].map((key) => `notification.compose.${key}`));
const sharedKeys = [
  "notification.licensing", "message.features", "trialDays",
  ...Object.keys(en).filter((key) => key.startsWith("notification.premium.btn.") && !key.endsWith("hotKey")),
];

for (const locale of readdirSync(new URL("../_locales/", import.meta.url))) {
  test(`${locale}: complete notification translations within its declared scope`, () => {
    const localized = catalog(locale);
    const scope = localized._l10nstatus.message;
    assert.ok(["SPLASH+UI", "UI", "SPLASH"].includes(scope), `${locale}: unknown scope`);
    const required = [...composeKeys.filter((key) => scope !== "SPLASH" || !featureUI.has(key)), ...sharedKeys];
    for (const key of required) {
      assert.ok(localized[key]?.message, `${locale}: missing ${key}`);
      assert.deepEqual(tokens(localized[key].message), tokens(en[key].message), `${locale}: ${key}`);
      assert.deepEqual(localized[key].placeholders, en[key].placeholders, `${locale}: ${key}`);
    }
    if (scope === "SPLASH") {
      assert.equal(locale, "vi");
      for (const key of featureUI) {
        assert.equal(localized[key], undefined, `${locale}: retain general UI fallback for ${key}`);
      }
    }
    const actual = Object.keys(localized).filter((key) => key.startsWith("notification.compose."));
    assert.deepEqual(actual, [...actual].sort((a, b) => a.localeCompare(b, "en")), `${locale}: notification entity order`);
  });
}
