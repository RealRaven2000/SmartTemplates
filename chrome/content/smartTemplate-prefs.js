"use strict";
/* 
BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK
*/

SmartTemplate4.Preferences = {
  get isDebug() {
    return this.getBoolPref("debug");
  },

  isDebugOption: function (option) {
    // granular debugging
    if (!this.isDebug) {
      return false;
    }
    try {
      return this.getBoolPref("debug." + option);
    } catch {
      return false;
    }
  },

  isBackgroundParser: function () {
    // switch for [issue 184] - background parsing & composer processing [mx]
    return SmartTemplate4.Preferences.getBoolPref("BackgroundParser");
  },

  getStringPref: function (p) {
    const value = SmartTemplate4.Preferences.cache.getValue(p);
    return value !== undefined ? value : "";
  },

  setStringPref: function setStringPref(p, v) {
    SmartTemplate4.Preferences.cache.setValue(p, v);
    return v;
  },

  getIntPref: function (p) {
    const value = SmartTemplate4.Preferences.cache.getValue(p);
    return value !== undefined ? value : 0;
  },

  setIntPref: function (p, v) {
    SmartTemplate4.Preferences.cache.setValue(p, v);
    return v;
  },

  getBoolPref: function (p) {
    try {
      const value = SmartTemplate4.Preferences.cache.getValue(p);
      return value !== undefined ? value : false;
    } catch (e) {
      let s = "Err:" + e;
      SmartTemplate4.Util.logToConsole("getBoolPref(" + p + ") failed:\n" + s);
      return false;
    }
  },

  setBoolPref: function (p, v) {
    try {
      SmartTemplate4.Preferences.cache.setValue(p, v);
      return v;
    } catch {
      // let s="Err:" +e;
      return false;
    }
  },

  existsCharPref: function (pref) {
    const value = SmartTemplate4.Preferences.cache.getValue(pref);
    return value !== undefined;
  },

  existsBoolPref: function (pref) {
    const value = SmartTemplate4.Preferences.cache.getValue(pref);
    return value !== undefined;
  },

  getBoolPrefSilent: function (pref) {
    try {
      return SmartTemplate4.Preferences.cache.getValue(pref);
    } catch {
      return false;
    }
  },
  ensureReady: async function () {
    // awaitReady is a Promise object
    await SmartTemplate4.Preferences.cache.awaitReady;
  },
};

SmartTemplate4.Preferences.cache = (() => {
  const debugCache = false;
  const logDebug = (...args) => {
    if (!debugCache) {
      return;
    }
    console.log("Preferences Cache:", ...args);
  };
  const cache = {
    _data: {},
    _resolveReady: null,
    awaitReady: null /* init-only gate; NOT a lock for updates */,
    getValue: (k) => cache._data[k],

    setValue: async (k, v) => {
      if (v === undefined) {
        console.error(
          `setValue("${k}", undefined) - Cannot determine type. Missing value argument?`
        );
        throw new Error(`Cannot set preference "${k}" to undefined`);
      }
      cache._data[k] = v;
      try {
        const isDebug = k === "debug" || k.startsWith("debug.");
        // Match account keys: id12.def, common.rsp, etc.
        const accountMatch = k.match(/^(id\d+|common)\.(.+)$/);
        
        if (isDebug) {
          const dataKey = k === "debug" ? "debugActive" : k;
          const current = await SmartTemplate4.Storage.get({ debug: {} });
          current.debug[dataKey] = v;
          await SmartTemplate4.Storage.set(current);
        } else if (accountMatch) {
          const [, accountId, settingKey] = accountMatch;
          const current = await SmartTemplate4.Storage.get({ accounts: {} });
          if (!current.accounts[accountId]) {
            current.accounts[accountId] = {};
          }
          current.accounts[accountId][settingKey] = v;
          await SmartTemplate4.Storage.set(current);
        } else {
          const current = await SmartTemplate4.Storage.get({ settings: {} });
          current.settings[k] = v;
          await SmartTemplate4.Storage.set(current);
        }
      } catch (ex) {
        console.error("Pref sync failed:", k, ex);
      }
    },

    setValueSet: async (prefs) => {
      // optimized function for multiple changes.
      if (!prefs || typeof prefs !== "object") {
        return;
      }
      // 1. update local cache immediately
      Object.assign(cache._data, prefs);
      try {
        const settingsChanges = {};
        const debugChanges = {};
        const accountsChanges = {}; // { id12: { def: true, rsp: "..." }, common: { ... } }
        
        for (const [k, v] of Object.entries(prefs)) {
          if (k === "debug") {
            debugChanges.debugActive = v;
          } else if (k.startsWith("debug.")) {
            debugChanges[k] = v;
          } else {
            // Check for account keys: id12.def, common.rsp
            const accountMatch = k.match(/^(id\d+|common)\.(.+)$/);
            if (accountMatch) {
              const [, accountId, settingKey] = accountMatch;
              if (!accountsChanges[accountId]) {
                accountsChanges[accountId] = {};
              }
              accountsChanges[accountId][settingKey] = v;
            } else {
              settingsChanges[k] = v;
            }
          }
        }
        
        const current = await SmartTemplate4.Storage.get({ settings: {}, debug: {}, accounts: {} });
        if (Object.keys(settingsChanges).length) {
          Object.assign(current.settings, settingsChanges);
        }
        if (Object.keys(debugChanges).length) {
          Object.assign(current.debug, debugChanges);
        }
        if (Object.keys(accountsChanges).length) {
          for (const [accountId, changes] of Object.entries(accountsChanges)) {
            if (!current.accounts[accountId]) {
              current.accounts[accountId] = {};
            }
            Object.assign(current.accounts[accountId], changes);
          }
        }
        await SmartTemplate4.Storage.set(current);
      } catch (ex) {
        console.error("Pref set batch sync failed:", ex);
      }
    },

    init: async () => {
      // create an async blocker.
      cache.awaitReady = new Promise((resolve) => {
        // blocks all external callers until we're done here
        cache._resolveReady = resolve;
      });

      try {
        logDebug(" - SmartTemplate4.Storage:", SmartTemplate4.Storage);
        const data = await SmartTemplate4.Storage.get({
          settings: {},
          debug: {},
          accounts: {},
          model: { folders: [] },
        });

        // merge settings, debug, and accounts into flat cache
        const prefs = { ...data.settings };
        for (const [k, v] of Object.entries(data.debug)) {
          prefs[k === "debugActive" ? "debug" : k] = v;
        }
        // flatten accounts: accounts.id12.def → id12.def
        for (const [accountId, accountData] of Object.entries(data.accounts)) {
          for (const [key, value] of Object.entries(accountData)) {
            prefs[`${accountId}.${key}`] = value;
          }
        }

        logDebug("Received preferences:", prefs);

        // remove all old data
        Object.keys(cache._data).forEach((k) => delete cache._data[k]);
        Object.assign(cache._data, prefs);
      } catch (ex) {
        console.error("Cache init failed:", ex);
      }
      cache._resolveReady();
    },

    updateFromBackend: (data) => {
      // copies all enumerable own properties
      Object.assign(cache._data, data);
    },
  };

  return cache; 	
})();

SmartTemplate4.Preferences.cache.init();
