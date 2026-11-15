import { POLICY } from "./usage-policy.js";
import { createStore } from "./usage-store.js";

// Background-owned source of truth. LegacyPrefs is only read at startup;
// all subsequent decisions use the cache, with writes persisted in order.
export function createBackgroundUsage(prefs, getLicense, now = () => new Date()) {
  const values = {};
  let pendingWrites = Promise.resolve();
  const adapter = {
    getStringPref: (key, fallback) => values[key] ?? fallback,
    setStringPref(key, value) {
      values[key] = value;
      pendingWrites = pendingWrites.then(async () => {
        if (await prefs.createPref(key, value) !== "string") {
          throw new Error(`Could not persist feature usage: ${key}`);
        }
      }).catch(error => console.error("SmartTemplates feature usage persistence failed", error));
    },
  };
  let ready;

  return {
    init() {
      ready ||= Promise.all(Object.keys(POLICY).map(async feature => {
        const key = "extensions.smarttemplates." + feature;
        values[key] = await prefs.getPref(key, "{}");
      }));
      return ready;
    },
    snapshot() {
      const timestamp = now().getTime();
      const sessionCheck = createStore(adapter, () => new Date(timestamp));
      // Supply raw evaluation allowances independently of the current licence;
      // the legacy window can then react to licence updates without reloading.
      const license = { status: "Invalid", trialDays: 0 };
      return {
        timestamp,
        allowances: Object.fromEntries(Object.keys(POLICY).map(feature =>
          [feature, sessionCheck(feature, license)])),
      };
    },
    check(feature, consume = false, timestamp = now().getTime()) {
      // A composer keeps its startup date for the whole composition session.
      if (!Number.isFinite(timestamp)) {
        throw new Error("Invalid feature usage session date");
      }
      return createStore(adapter, () => new Date(timestamp))(feature, getLicense(), consume);
    },
    flush: () => pendingWrites,
  };
}
