// Background-only controller. Usage is supplied by the explicit Utilities API;
// daily reminder suppression and persistent snooze remain separate work.
export function createComposeNotifications(api, { getFeatureUsage } = {}) {
  const states = new Map();
  const command = "composeNotifications";
  const msg = (key) => api.i18n.getMessage(key);

  function model(state) {
    const featureList = (features, tier) => features.map((name) => {
      const usage = state.usage?.[name];
      const feature = { name };
      feature.blocked = state.blocked?.includes(name) || false;
      if (Number.isInteger(usage?.remaining) && usage.remaining >= 0 &&
          Number.isInteger(usage.maximum) && usage.maximum > 0 && usage.remaining <= usage.maximum) {
        feature.remaining = usage.remaining;
        feature.maximum = usage.maximum;
        feature.explanation = msg("notification.compose.remainingUses")
          .replace("{1}", usage.remaining).replace("{2}", usage.maximum);
        feature.explanation += " " + msg("notification.compose.countingRule");
        if (usage.usedToday) {
          feature.explanation += " " + msg("notification.compose.countedToday");
        }
      }
      if (feature.blocked) {
        feature.explanation = msg(tier === "pro"
          ? "notification.compose.blockedPro" : "notification.compose.blockedStandard")
          + " " + msg("notification.compose.blockedExplanation");
      }
      return feature;
    });
    const proFeatures = featureList(state.pro, "pro");
    const standardFeatures = featureList(state.standard, "standard");
    const blocked = [...proFeatures, ...standardFeatures].some(feature => feature.blocked);
    return {
      revision: state.revision,
      generation: state.generation || 0,
      visible: (state.showTrial && state.trialDays > 0) || !!state.pro.length || !!state.standard.length,
      title: msg("extensionName"),
      blocked,
      allUsed: msg("notification.compose.allUsed"),
      blockedExplanation: blocked ? msg("notification.compose.blockedExplanation") : "",
      compact:
        blocked ? msg("notification.compose.blocked") : state.showTrial && state.trialDays > 0
          ? msg("trialDays").replace("{0}", state.trialDays)
          : msg("notification.compose.details"),
      trial:
        state.showTrial && state.trialDays > 0
          ? msg("trialDays").replace("{0}", state.trialDays)
          : "",
      licenseText: msg("notification.license.text"),
      licensingLabel: msg("notification.licensing"),
      proFeatures,
      standardFeatures,
      proDescription: msg("notification.compose.proFeatures"),
      standardDescription: msg("notification.compose.standardFeatures"),
      proNotes: state.proNotes.join(" "),
      standardNotes: state.standardNotes.join(" "),
      usageHint: [...proFeatures, ...standardFeatures].some(feature => feature.remaining !== undefined)
        ? msg("notification.compose.usageHint") : "",
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
    if (request.reset) {
      const previous = states.get(tabId);
      states.set(tabId, {
        pro: [], standard: [], proNotes: [], standardNotes: [],
        showTrial: false, register: false,
        generation: (previous?.generation || 0) + 1,
        revision: (previous?.revision || 0) + 1,
      });
      await deliver(tabId);
      return true;
    }
    const features = Array.isArray(request.features)
      ? request.features.filter((f) => typeof f === "string" && f)
      : [];
    // The renderer never invents counts. A usage provider can be connected here
    // independently of the parser and of any future enforcement policy.
    const usage = getFeatureUsage && features.length
      ? await getFeatureUsage(features, request) : {};
    const state = states.get(tabId) || {
      pro: [],
      standard: [],
      proNotes: [],
      standardNotes: [],
      showTrial: false,
      register: false,
    };
    state.usage = { ...state.usage, ...usage };
    state.blocked = [...new Set([...(state.blocked || []), ...(request.blockedFeatures || [])])];
    state.blocked = state.blocked.filter(name => state.usage[name]?.allowed !== true);
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
