export const Preferences = {
  CURRENT_VERSION: 0.3,
  Defaults: {
    // Core functionality
    sandbox: false,
    firstRun: true,
    "deferred.autoUpdate": true,
    hasNews: false,
    version: "?",
    breaksAtTop: 0,
    forceParagraph: true,
    showStatusIcon: true,
    statusIconLabelMode: 2, // 0 - no label; 1 - autohide; 2 - always show
    "font.size": 9,
    parseSignature: false,
    firstLastSwap: true,
    "firstLastSwap.name": false,
    "header.inject": true,
    "sanitizeStyles.removeDuplicatesInHead": true,
    "sanitizeStyles.removeDuplicatesInFragments": false,
    "sanitizeStyles.removeDuplicatesInTemplate": false,
    defaultCharset: "UTF-8",
    // Signature settings
    "signature.encoding": "UTF-8",
    "signature.insertDashes.plaintext": false,
    "signature.insertDashes.html": false,
    "signature.removeBlockQuotedSig.onFail": false,
    "signature.replaceLF.plaintext.br": true,
    // Cursor and insertion
    "cursor.insertSpace": true,
    // Address book integration
    "mime.resolveAB.CardBook": false,
    "mime.resolveAB.CardBook.fallback": false,
    "mime.resolveAB": true,
    "mime.resolveAB.removeEmail": true,
    "mime.resolveAB.preferNick": false,
    "mime.resolveAB.displayName": false,
    "mime.defaultFormat": "name,bracketMail(angle)",
    // Identities and UI
    "identities.showAccountName": false,
    "identities.showIdKey": false,
    "toolbar.hideLabel": false,
    // Name formatting
    "names.delimiter": ",",
    "names.capitalize": true,
    "names.quoteIfComma": false,
    "names.guessFromMail": true,
    "names.extractNameFromParentheses": false,
    // Mail handling
    "mail.suppressLink": false,
    "plainText.preserveTextNodes": false,
    "forwardInlineImg.delay": 200,
    xtodaylegacy: false,
    "cleanDeferredButton.installer": false,
    "files.path": "",
    // Template settings
    defaultTemplateMethod: 1, // 1 - use account template; 2 - use last template
    "defaultTemplate.useLastNotify": true,
    "vars.file.fileTemplateMethod": false,
    // File templates
    "fileTemplates.editor.path": "",
    "fileTemplates.menus.delayMessagePane": 8000,
    "fileTemplates.path": "",
    "fileTemplates.jsonPath.export": "",
    "fileTemplates.jsonPath.import": "",
    "fileTemplates.instantPath": "",
    "fileTemplates.sendTimeout": 200,
    // Most recently used templates
    "fileTemplates.mru.new": "",
    "fileTemplates.mru.rsp": "",
    "fileTemplates.mru.rsp.all": "",
    "fileTemplates.mru.rsp.list": "",
    "fileTemplates.mru.fwd": "",
    "fileTemplates.mru.max": 10,
    // Date formatting
    "dateformat.hour": "numeric", // "2-digit" for forcing 2digit hours
    "dateformat.day": "numeric", // "2-digit" for forcing 2digit day
    "dateformat.month": "numeric", // "2-digit" for forcing 2digit month
    "dateformat.year": "numeric", // "2-digit" for forcing 2digit year
    allowScripts: false,
    removeSigOnIdChangeAfterEdits: false,
    // Header handling
    "headers.unescape.quotes": true,
    expandSettings: false,
    BackgroundParser: false,
    // Button installation
    "changeTemplate.button.install": true,
    "insertSnippet.button.install": true,
    lastUpdateMessage: "0",
    spellcheckDelay: 2500,
    // License
    "license.gracePeriodDate": "",
    "licenser.forceSecondaryIdentity": false,
    licenseType: 0,
    LicenseKey: "",
    silentUpdate: true,
    "news.minimal": true,
  },
  DebugDefaults: {
    debugActive: false,
    "debug.default": true,
    "debug.events": false,
    "debug.functions": false,
    "debug.functions.delReplyHeader": false,
    "debug.functions.delForwardHeader": false,
    "debug.functions.insertTemplate": false,
    "debug.functions.extractSignature": false,
    "debug.functions.getProcessedText": false,
    "debug.adressbook": false,
    "debug.API.menus": false,
    "debug.replaceReservedWords": false,
    "debug.deleteNodes": false,
    "debug.composer": false,
    "debug.composer.breakpoint": false,
    "debug.composer.cursor": false,
    "debug.images": false,
    "debug.headerPane": false,
    "debug.settings": false,
    "debug.settings.prefs": false,
    "debug.signatures": false,
    "debug.regularize": false,
    "debug.tokens": false,
    "debug.tokens.deferred": false,
    "debug.transformStrings": false,
    "debug.mime": false,
    "debug.mime.split": false,
    "debug.msg": false,
    "debug.parseModifier": false,
    "debug.fileTemplates": false,
    "debug.fileTemplates.menus": false,
    "debug.firstRun": false,
    "debug.test.update": false,
    "debug.identities": false,
    "debug.css.styleSheets": false,
    "debug.css.detailed": false,
    "debug.css.AddRule": false,
    "debug.timeZones": false,
    "debug.timeStrings": false,
    "debug.headers": false,
    "debug.sandbox": false,
    "debug.snippets": false,
    "debug.notifications": false,
    "debug.notifications.menus": false,
    "debug.premium.licenser": false,
    "debug.premium.rsa": false,
    "debug.premium.testNotification": false,
    "debug.ui.statusbar": false,
    "debug.ui.mainbutton": false,
    "debug.variables.search": false,
    "debug.saleDate": "",
  },

  _data: {},
  _debugData: {},
  _accountsData: {}, // account-specific templates (common, id1, id2, etc.)
  _ready: false,
  async _seedMissingDefaultsToStorage(settings, debug) {
    let hasSettingsSeed = false;
    let hasDebugSeed = false;

    for (const [key, value] of Object.entries(Preferences.Defaults)) {
      if (typeof settings[key] === "undefined") {
        settings[key] = value;
        hasSettingsSeed = true;
      }
    }

    for (const [key, value] of Object.entries(Preferences.DebugDefaults)) {
      if (typeof debug[key] === "undefined") {
        debug[key] = value;
        hasDebugSeed = true;
      }
    }

    if (hasSettingsSeed || hasDebugSeed) {
      const sortedSettings = Object.fromEntries(
        Object.entries(settings).sort(([a], [b]) => a.localeCompare(b))
      );
      const sortedDebug = Object.fromEntries(
        Object.entries(debug).sort(([a], [b]) => a.localeCompare(b))
      );

      await browser.storage.local.set({
        settings: sortedSettings,
        debug: sortedDebug,
      });

      // Keep in-memory objects aligned with persisted sorted order.
      Object.assign(settings, sortedSettings);
      Object.assign(debug, sortedDebug);
    }
  },
  async init() {
    // Load all storage domains: settings, debug, and accounts
    let {
      settings = {},
      debug = {},
      accounts = {},
    } = await browser.storage.local.get({
      settings: {},
      debug: {},
      accounts: {},
    });
    const version = settings.settingsVersion ?? 0;

    if (version < Preferences.CURRENT_VERSION) {
      const {
        settings: mOptions,
        debug: mDebug,
        accounts: mAccounts,
      } = await Preferences._migrateLegacyPrefs();

      // avoid overwriting newer backup with older one:
      if (settings["LicenseKey.backup"] !== undefined) {
        mOptions["LicenseKey.backup"] = settings["LicenseKey.backup"];
      }

      settings = {
        ...mOptions,
        settingsVersion: Preferences.CURRENT_VERSION,
      };

      debug = { ...mDebug };
      accounts = { ...mAccounts };

      // store migrated data from Legacy Prefs
      await browser.storage.local.set({
        settings,
        debug,
        accounts,
      });
    }

    // Seed missing defaults into persisted storage even when no legacy migration runs.
    // This ensures new keys appear in storage editors and can be toggled directly.
    await Preferences._seedMissingDefaultsToStorage(settings, debug);

    Preferences._data = {
      ...Preferences.Defaults,
      ...settings,
    };
    Preferences._debugData = {
      ...Preferences.DebugDefaults,
      ...debug,
    };
    Preferences._accountsData = accounts;

    Preferences._ready = true;

    function applyChanges(target, changesObj, updates, defaults) {
      // the structure is changes.settings.oldValue.key  [changes.debug.oldValue.key]
      // and              changes.settings.newValue.key  [changes.debug.newValue.key]
      const oldV = changesObj.oldValue || {};
      const newV = changesObj.newValue || {};

      for (const [key, val] of Object.entries(oldV)) {
        if (newV[key] === undefined) {
          delete target[key];
          if (Object.prototype.hasOwnProperty.call(defaults, key)) {
            updates[key] = defaults[key];
          } else {
            delete updates[key];
          }
          continue;
        }

        if (newV[key] === val) {
          continue;
        }

        // change value and record updates
        target[key] = newV[key];
        updates[key] = newV[key];
      }
    }

    // live sync all changes to cache. do not include model / folders
    messenger.storage.onChanged.addListener((changes, area) => {
      try {
        console.log("Preferences onChanged:", changes);
        if (area !== "local") {
          return;
        }
        if (!changes.settings && !changes.debug && !changes.accounts) {
          return;
        }
        const updates = {};
        if (changes.settings) {
          applyChanges(Preferences._data, changes.settings, updates, Preferences.Defaults);
        }
        if (changes.debug) {
          applyChanges(Preferences._debugData, changes.debug, updates, Preferences.DebugDefaults);
          // remap debugActive → "debug" for frontend cache key compatibility
          if ("debugActive" in updates) {
            updates["debug"] = updates["debugActive"];
            delete updates["debugActive"];
          }
        }
        if (changes.accounts) {
          // Update in-memory accounts data
          Preferences._accountsData = changes.accounts.newValue || {};
          console.log("Accounts data updated:", Preferences._accountsData);
        }
        if (!Object.keys(updates).length) {
          return;
        }

        console.log("Preferences updates:", updates);
        messenger.Utilities.updatePreferencesCache(updates);
      } catch (e) {
        console.error("storage.onChanged crashed:", e);
      }
    });
  },

  _ensureReady(info) {
    if (!Preferences._ready) {
      const err = new Error("Preferences not initialized");
      err.info = info;
      throw err;
    }
  },

  get(name) {
    Preferences._ensureReady({ reason: "get", key: name });
    if (name === "debug") {
      return Preferences._debugData.debugActive ?? false;
    }
    if (name.startsWith("debug")) {
      return Preferences._debugData[name] ?? Preferences.DebugDefaults[name];
    }
    return Preferences._data[name] ?? Preferences.Defaults[name];
  },

  isDebug(key) {
    Preferences._ensureReady({ reason: "isDebug", key });
    // global switch
    if (!key) {
      return Preferences._debugData.debugActive ?? false;
    }
    // specific flag
    return (
      Preferences._debugData[`debug.${key}`] ?? Preferences.DebugDefaults[`debug.${key}`] ?? false
    );
  },

  async setMultiple(prefs) {
    if (!prefs || typeof prefs !== "object") {
      return;
    }
    const settingsPatch = {};
    for (const [name, value] of Object.entries(prefs)) {
      if (name.startsWith("debug")) {
        console.error("setMultiple: debug key rejected", name);
        continue;
      }
      if (this._data[name] === value) {
        continue;
      }
      this._data[name] = value;
      settingsPatch[name] = value;
    }

    const keys = Object.keys(settingsPatch);
    if (!keys.length) {
      return;
    }

    await browser.storage.local.set({
      settings: {
        ...this._data,
        ...settingsPatch,
      },
    });
  },

  async set(name, value) {
    Preferences._ensureReady({ reason: "set", key: name });

    if (value === undefined) {
      const defaultValue = Preferences.Defaults[name] ?? Preferences.DebugDefaults[name];
      if (defaultValue !== undefined) {
        console.warn(`Preferences.set("${name}", undefined) - using default value. Missing value argument?`);
        value = defaultValue;
      } else {
        console.error(`Preferences.set("${name}", undefined) - no default found. Rejecting.`);
        throw new Error(`Cannot set preference "${name}" to undefined`);
      }
    }

    if (name.startsWith("debug")) {
      // frontend "debug" maps to the storage key "debugActive" in _debugData
      const storageKey = name === "debug" ? "debugActive" : name;
      if (Preferences._debugData[storageKey] === value) {
        return;
      }
      Preferences._debugData[storageKey] = value;
      const { debug } = await browser.storage.local.get({ debug: {} });
      debug[storageKey] = value;
      await browser.storage.local.set({ debug });
      return;
    }

    if (Preferences._data[name] === value) {
      return;
    }
    Preferences._data[name] = value;
    const { settings } = await browser.storage.local.get({ settings: {} });
    settings[name] = value;
    await browser.storage.local.set({ settings });
  },

  getBool(name) {
    return !!this.get(name);
  },

  getInt(name) {
    return parseInt(this.get(name), 10) || 0;
  },

  // Get account-specific setting (e.g., "id1", "new.html")
  getAccountPref(accountId, key) {
    Preferences._ensureReady({ reason: "getAccountPref", accountId, key });
    return Preferences._accountsData[accountId]?.[key];
  },

  // Set account-specific setting
  async setAccountPref(accountId, key, value) {
    Preferences._ensureReady({ reason: "setAccountPref", accountId, key });
    
    if (!Preferences._accountsData[accountId]) {
      Preferences._accountsData[accountId] = {};
    }
    
    Preferences._accountsData[accountId][key] = value;
    
    const { accounts = {} } = await browser.storage.local.get({ accounts: {} });
    if (!accounts[accountId]) {
      accounts[accountId] = {};
    }
    accounts[accountId][key] = value;
    await browser.storage.local.set({ accounts });
  },

  // Get all settings for a specific account
  getAccountSettings(accountId) {
    Preferences._ensureReady({ reason: "getAccountSettings", accountId });
    return { ...Preferences._accountsData[accountId] };
  },

  // Export all account settings
  exportAccountSettings() {
    Preferences._ensureReady({ reason: "exportAccountSettings" });
    return JSON.parse(JSON.stringify(Preferences._accountsData));
  },

  // Import account settings (for restore functionality)
  async importAccountSettings(accountsData) {
    Preferences._ensureReady({ reason: "importAccountSettings" });
    Preferences._accountsData = { ...accountsData };
    await browser.storage.local.set({ accounts: accountsData });
  },

  _normalizeType(key, value) {
    const def = this.Defaults[key] ?? this.DebugDefaults[key];

    if (typeof def === "boolean") {
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1") {
          return true;
        }
        if (normalized === "false" || normalized === "0") {
          return false;
        }
      }
      return def;
    }

    if (typeof def === "number") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return def;
      }
      return numeric;
    }

    return value; // string fallback
  },

  async _migrateLegacyPrefs() {
    const legacy_root = "extensions.smartTemplate4.";

    const migratedOptions = {};
    const migratedDebug = {};
    const migratedAccounts = {}; // separate storage for account-specific settings
    const prefsWithoutDefaults = []; // track dynamic prefs

    // Known account-specific settings (same for common and all identities)
    const ACCOUNT_SETTINGS = [
      "def", 
      "fwd", "fwdhead", "fwdheader", "fwdhtml", "fwdmsg", "fwdnbr",
      "new", "newhtml", "newmsg", "newnbr",
      "rsp", "rsphead", "rspheader", "rsphtml", "rspmsg", "rspnbr",
    ];

    // Collect account IDs that have at least one setting stored
    const accountIds = ["common"]; // always check common
    try {
      const accounts = await messenger.accounts.list();
      for (const account of accounts) {
        for (const identity of account.identities) {
          // identity.id is already in "id1", "id2" format (not a plain number)
          accountIds.push(identity.id);
        }
      }
    } catch (ex) {
      console.warn("Could not query accounts, only migrating common settings:", ex);
    }

    // First pass: determine which account IDs actually have stored settings
    const accountIdsWithSettings = [];
    for (const accountId of accountIds) {
      // Check if any setting exists for this account
      let hasAnySetting = false;
      for (const setting of ACCOUNT_SETTINGS) {
        const testKey = `${legacy_root}${accountId}.${setting}`;
        try {
          const value = await messenger.LegacyPrefs.getPref(testKey);
          if (value !== undefined) {
            hasAnySetting = true;
            break; // Found at least one setting, no need to check more
          }
        } catch {
          // Setting doesn't exist, continue
        }
      }
      if (hasAnySetting) {
        accountIdsWithSettings.push(accountId);
      }
    }

    // Build migration keys: general settings + debug + account settings (only for accounts with data)
    const migrationKeys = [
      ...Object.keys(this.Defaults),
      ...Object.keys(this.DebugDefaults),
      "LicenseKey.backup", // special case
      ...accountIdsWithSettings.flatMap(accountId =>
        ACCOUNT_SETTINGS.map(setting => `${accountId}.${setting}`)
      ),
    ].sort();

    console.log(`Migrating ${migrationKeys.length} SmartTemplate4 preferences...`);

    for (const key of migrationKeys) {
      const legacyKey = legacy_root + key;

      try {
        const value = await messenger.LegacyPrefs.getPref(legacyKey);

        if (value === undefined) {
          continue;
        }

        const normalized = this._normalizeType(key, value);

        // ---- ACCOUNT-SPECIFIC SETTINGS ----
        // Pattern: common.*, id1.*, id2.*, etc.
        const accountMatch = key.match(/^(common|id\d+)\.(.+)$/);
        if (accountMatch) {
          const [, accountId, setting] = accountMatch;
          if (!migratedAccounts[accountId]) {
            migratedAccounts[accountId] = {};
          }
          migratedAccounts[accountId][setting] = normalized;
          continue;
        }

        // ---- DEBUG SPLIT ----
        // Legacy pref named "debug" becomes debugActive in the new debug object.
        if (key === "debug" || key === "debugActive") {
          migratedDebug.debugActive = normalized;
          continue;
        }

        if (key.startsWith("debug.")) {
          migratedDebug[key] = normalized;
          continue;
        }

        // ---- GENERAL SETTINGS ----
        // Log prefs without defaults (excluding known special cases)
        const hasDefault = (key in this.Defaults) || (key in this.DebugDefaults);
        const isKnownSpecial = key === "LicenseKey.backup";
        if (!hasDefault && !isKnownSpecial) {
          prefsWithoutDefaults.push(key);
        }

        migratedOptions[key] = normalized;
      } catch {
        console.warn(`Preference ${legacyKey} not found during migration.`);
      }
    }

    // regular Migration log
    console.log(`Account-specific settings migrated:`, Object.keys(migratedAccounts));

    // Log any prefs without defaults after loop completes
    if (prefsWithoutDefaults.length > 0) {
      console.warn(
        `⚠️ Found ${prefsWithoutDefaults.length} preference(s) without defaults (excluding accounts):`,
        prefsWithoutDefaults
      );
      console.warn("Consider adding these to Defaults or documenting as dynamic prefs.");
    }

    return {
      settings: {
        ...migratedOptions,
        settingsVersion: Preferences.CURRENT_VERSION,
      },
      debug: migratedDebug,
      accounts: migratedAccounts,
    };
  },
};
