import { POLICY } from "./usage-policy.js";

export function createStore(prefs, now = () => new Date()) {
  return function check(feature, license, consume = false) {
    if (!Object.hasOwn(POLICY, feature)) {
      return null;
    }
    const policy = POLICY[feature];
    const covered = license.status === "Valid" &&
      (policy.tier === "standard" || license.keyType !== 2);
    // A valid Standard license refreshes the legacy grace date indefinitely;
    // that must not grant an unlimited Pro evaluation alongside it.
    const trial = license.status !== "Valid" && license.trialDays > 0;
    if (covered || trial) {
      return { feature, tier: policy.tier, maximum: policy.maximum,
        remaining: policy.maximum, usedToday: false, allowed: true, covered, trial };
    }
    const key = "extensions.smarttemplates." + feature;
    const saved = JSON.parse(prefs.getStringPref(key, "{}"));
    const savedUsage = saved.usage ?? saved.used;
    const previousUsage = Number.isInteger(savedUsage) && savedUsage > 0 ? savedUsage : 0;
    const date = now();
    const today = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")].join("-");
    const usedToday = previousUsage > 0 && saved.lastUsedDate === today;
    const allowed = covered || trial || usedToday || previousUsage < policy.maximum;
    let count = previousUsage;
    if (consume && allowed && !covered && !trial && !usedToday) {
      count++;
      // The adapter updates its in-memory cache synchronously before persisting.
      prefs.setStringPref(key, JSON.stringify({ usage: count, lastUsedDate: today }));
    } else if (consume && Object.hasOwn(saved, "used")) {
      // Preserve counters created during testing without charging another use.
      prefs.setStringPref(key, JSON.stringify({ usage: count, lastUsedDate: saved.lastUsedDate }));
    }
    return { feature, tier: policy.tier, maximum: policy.maximum,
      remaining: Math.max(0, policy.maximum - count),
      usedToday: usedToday || count > previousUsage, allowed, covered, trial };
  };
}
