// Background-only controller. Trial accounting and daily suppression are unchanged.
export function createComposeNotifications(api) {
  const states = new Map();
  const command = "composeNotifications";
  const msg = (key) => api.i18n.getMessage(key);

  function model(state) {
    const describe = (features, tier) =>
      features.length
        ? msg(`notification.${tier}.text${features.length > 1 ? ".plural" : ""}`).replace(
            "{1}",
            `'${features.join(", ")}'`
          )
        : "";
    return {
      revision: state.revision,
      visible: state.showTrial || !!state.pro.length || !!state.standard.length,
      title: msg("extensionName"),
      compact:
        state.trialDays > 0
          ? msg("trialDays").replace("{0}", state.trialDays)
          : msg("notification.compose.details"),
      trial:
        state.showTrial && state.trialDays > 0
          ? msg("trialDays").replace("{0}", state.trialDays)
          : "",
      licenseText: msg("notification.license.text"),
      licensingLabel: msg("notification.licensing"),
      proText: [describe(state.pro, "premium"), ...state.proNotes].filter(Boolean).join(" "),
      standardText: [describe(state.standard, "standard"), ...state.standardNotes]
        .filter(Boolean)
        .join(" "),
      buttons: [
        ...(state.register ? [{ action: "buy", label: msg(state.buttonKey), primary: true }] : []),
        ...(state.pro.length || state.standard.length
          ? [{ action: "compare", label: msg("message.features") }]
          : []),
        { action: "later", label: msg("notification.compose.remindLater") },
      ],
      learnMore: msg("notification.compose.learnMore"),
    };
  }

  async function deliver(tabId) {
    const state = states.get(tabId);
    if (!state) { return; }
    try {
      await api.tabs.sendMessage(tabId, { command, model: model(state) });
    } catch (error) {
      // Startup can precede compose-script injection. The ready request pulls state.
      console.debug("[ST441] Composer notification pending", tabId, error.message);
    }
  }

  async function show(request) {
    if (!Number.isInteger(request.windowId)) {
      throw new Error("Missing composer window ID");
    }
    const tabs = await api.tabs.query({ windowId: request.windowId, type: "messageCompose" });
    if (tabs.length !== 1) {
      throw new Error("Could not uniquely identify the notification composer");
    }
    const tabId = tabs[0].id;
    const state = states.get(tabId) || {
      pro: [],
      standard: [],
      proNotes: [],
      standardNotes: [],
      showTrial: false,
      register: false,
    };
    const features = Array.isArray(request.features)
      ? request.features.filter((f) => typeof f === "string" && f)
      : [];
    const tier = request.isProFeature ? "pro" : "standard";
    state[tier] = [...new Set([...state[tier], ...features])];
    if (request.additionalText) {
      state[tier + "Notes"] = [...new Set([...state[tier + "Notes"], request.additionalText])];
    }
    state.showTrial ||= !features.length;
    state.trialDays = request.trialDays;
    state.register ||= !!request.isRegister;
    state.buttonKey = request.buttonKey;
    state.revision = (state.revision || 0) + 1;
    states.set(tabId, state);
    await deliver(tabId);
    return true;
  }

  function onMessage(data, sender) {
    if (data?.command !== command || sender.tab?.type !== "messageCompose") {
      return false;
    }
    const tabId = sender.tab.id;
    if (data.action === "ready") {
      return Promise.resolve(states.has(tabId) ? model(states.get(tabId)) : null);
    }
    if (!states.has(tabId)) {
      return false;
    }
    switch (data.action) {
      case "buy":
        return api.Utilities.showComposeLicenseDialog(
          tabId,
          [...states.get(tabId).pro, ...states.get(tabId).standard].join("|")
        );
      case "licensing":
        return api.windows.openDefaultBrowser(
          "https://smarttemplates.quickfolders.org/contribute.html"
        );
      case "compare":
        return api.windows.openDefaultBrowser(
          "https://smarttemplates.quickfolders.org/premium.html#featureComparison"
        );
      // Prototype only: no persistent snooze, trial changes, or daily suppression.
      case "later":
        return Promise.resolve(true);
      default:
        return false;
    }
  }

  return {
    show,
    async updateLicense(info) {
      if (info.status !== "Valid") {
        return;
      }
      for (const [tabId, state] of states) {
        state.showTrial = false;
        state.standard = [];
        state.standardNotes = [];
        if (info.keyType !== 2) {
          state.pro = [];
          state.proNotes = [];
        }
        state.trialDays = info.trialDays;
        state.buttonKey = "notification.premium.btn.upgrade";
        state.revision++;
        await deliver(tabId);
      }
    },
    async start() {
      api.runtime.onMessage.addListener(onMessage);
      api.tabs.onRemoved.addListener((tabId) => states.delete(tabId));
      await api.composeScripts.register({
        js: [{ file: "html/compose-notifications/compose.js" }],
      });
      for (const tab of await api.tabs.query({ type: "messageCompose" })) {
        try {
          await api.tabs.executeScript(tab.id, { file: "html/compose-notifications/compose.js" });
        } catch (error) {
          console.warn("[ST441] Could not initialize open composer", tab.id, error);
        }
      }
    },
  };
}
