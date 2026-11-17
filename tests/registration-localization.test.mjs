import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function catalog(locale) {
  const bytes = readFileSync(new URL(`../_locales/${locale}/messages.json`, import.meta.url));
  // Fail on invalid UTF-8 instead of silently replacing damaged characters.
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  assert.equal(text.includes("\uFFFD"), false, `${locale}: replacement character`);
  return JSON.parse(text);
}

function tokens(text) {
  return [...text.matchAll(/\$\d+|\$[a-zA-Z_][\w]*\$|\{[^}]+\}/g)]
    .map((match) => match[0]).sort();
}

for (const locale of readdirSync(new URL("../_locales/", import.meta.url))) {
  test(`${locale}: registration scope, substitutions and release-news markup`, () => {
    const en = catalog("en");
    const localized = catalog(locale);
    const registrationKeys = Object.keys(en).filter((key) => key.startsWith("registration."));
    if (localized._l10nstatus.message === "SPLASH") {
      // Vietnamese intentionally uses default-English registration/shop UI.
      assert.equal(locale, "vi");
      assert.deepEqual(Object.keys(localized).filter((key) => key.startsWith("registration.")), []);
    } else {
      assert.ok(["SPLASH+UI", "UI"].includes(localized._l10nstatus.message), `${locale}: unknown scope`);
      for (const key of registrationKeys) {
        assert.ok(localized[key]?.message, `${locale}: missing ${key}`);
        assert.deepEqual(tokens(localized[key].message), tokens(en[key].message), `${locale}: ${key}`);
        assert.deepEqual(localized[key].placeholders, en[key].placeholders, `${locale}: ${key}`);
      }
      const actualOrder = Object.keys(localized).filter((key) => key.startsWith("registration."));
      assert.deepEqual(actualOrder, [...registrationKeys].sort((a, b) => a.localeCompare(b, "en")));
      if (locale !== "en") {
        for (const key of ["registration.domain.proWarning", "registration.renewal.personal", "registration.renewal.upgrade"]) {
          assert.notEqual(localized[key].message, en[key].message, `${locale}: untranslated ${key}`);
        }
      }
    }
    const news = localized["whats-new-list"].message;
    assert.deepEqual(tokens(news), tokens(en["whats-new-list"].message), `${locale}: news parser tokens`);
    assert.deepEqual([...news.matchAll(/\[issue \d+\]/g)].map((match) => match[0]),
      [...en["whats-new-list"].message.matchAll(/\[issue \d+\]/g)].map((match) => match[0]),
      `${locale}: issue references and section order`);
    assert.equal(news.match(/\[issue 445\]/g).length, 2);
  });
}

test("German registration covers the final English keys and preserves substitutions and markup", () => {
  const en = catalog("en");
  const de = catalog("de");
  assert.equal(de._l10nstatus.message, "SPLASH+UI");
  for (const key of Object.keys(en).filter((key) => key.startsWith("registration."))) {
    assert.ok(de[key]?.message, `Missing German translation: ${key}`);
    assert.deepEqual(tokens(de[key].message), tokens(en[key].message), key);
    assert.deepEqual(de[key].placeholders, en[key].placeholders, key);
  }
  assert.match(de["registration.action.extend"].message, /verlängern/);
  assert.match(de["registration.renewal.personal"].message, /Zahlung/);
  assert.match(de["registration.renewal.upgrade"].message, /Zahlung/);
  assert.equal(de["registration.terms.hide"].message.match(/🡇/gu).length, 2);
  assert.match(de["registration.enterKey"].message, /…$/u);
  assert.equal(de["registration.edition.domain"].message, "Domäne");
  assert.equal(de["registration.license.domain"].message, "Domänenlizenz");
  assert.equal(de["registration.action.buyDomain"].message, "Domänenlizenz erwerben");
});

test("German rich-text formatting retains Unicode and resolves the add-on name", () => {
  const de = catalog("de");
  const context = {
    messenger: { i18n: { getMessage: (id) => id === "extensionName" ? "SmartTemplates" : "" } },
    console,
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../html/localized-format.js", import.meta.url), "utf8"), context);
  const formatted = context.formatAll(de["registration.renewal.personal"].message);
  assert.match(formatted, /<b>Persönliche Lizenzen<\/b><br\s*\/?>/u);
  assert.match(formatted, /Verlängerung/u);
  assert.match(formatted, /hinaus – je nachdem/u);
  const intro = context.formatAll(de["registration.terms.intro"].message.replace("$1", "2011"));
  assert.match(intro, /SmartTemplates hält seit 2011/u);
  assert.equal(intro.includes("{+extensionName}"), false);
});
