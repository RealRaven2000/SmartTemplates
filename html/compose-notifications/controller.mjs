// Background-only controller. Usage is supplied by the explicit Utilities API;
// daily reminder suppression and persistent snooze remain separate work.
export function createComposeNotifications(api, {
  getFeatureUsage, copyText = text => navigator.clipboard.writeText(text),
} = {}) {
  const states = new Map();
  const command = "composeNotifications";
  const msg = (key) => api.i18n.getMessage(key);

  function expressionPreview(expression) {
    // Bound tooltip/accessibility text before sending it to the compose script.
    // Stop early: an expression can contain megabytes of inline image data.
    const characters = [];
    for (const character of expression) {
      if (characters.length === 250) {
        characters[249] = "…";
        return characters.join("");
      }
      characters.push(character);
    }
    return expression;
  }

  function emptyState() {
    return {
      pro: [], standard: [], proNotes: [], standardNotes: [],
      showTrial: false, register: false, issues: [], nextIssueId: 0,
      evaluationId: 0, generation: 0, revision: 0,
    };
  }

  async function composeTab(windowId) {
    if (!Number.isInteger(windowId)) {
      throw new Error("Missing composer window ID");
    }
    const tabs = await api.tabs.query({ windowId, type: "messageCompose" });
    if (tabs.length !== 1) {
      throw new Error("Could not uniquely identify the notification composer");
    }
    return tabs[0].id;
  }

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
          .replace("{1}", usage.remaining);
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
      visible: !!state.issues.length || (state.showTrial && state.trialDays > 0) || !!state.pro.length || !!state.standard.length,
      evaluationId: state.evaluationId,
      issues: state.issues.map(({ id, expression, message, details, action }) => ({
        id, expression: expressionPreview(expression), message, details,
        action: action ? { type: action.type } : null,
      })),
      issueLabel: msg("notification.compose.issue"),
      issuesLabel: msg("notification.compose.issues"),
      dismissIssue: msg("notification.compose.dismissIssue"),
      copyTemplateSource: msg("notification.compose.copyTemplateSource"),
      hasLicensing: !!state.pro.length || !!state.standard.length || (state.showTrial && state.trialDays > 0),
      title: msg("extensionName"),
      blocked,
      allUsed: msg("notification.compose.allUsed"),
      expand: msg("notification.compose.expand"),
      collapse: msg("notification.compose.collapse"),
      dismiss: msg("notification.compose.dismiss"),
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
    const tabId = await composeTab(request.windowId);
    if (request.reset) {
      const previous = states.get(tabId);
      const clearIssues = request.clearIssues === true;
      if (request.evaluationId !== undefined && previous &&
          request.evaluationId < previous.evaluationId) {
        return false;
      }
      states.set(tabId, {
        ...emptyState(),
        // Feature accounting restarts for snippets; retained issues do not.
        issues: clearIssues ? [] : previous?.issues || [],
        nextIssueId: clearIssues ? 0 : previous?.nextIssueId || 0,
        evaluationId: request.evaluationId ??
          (previous?.evaluationId || 0) + (clearIssues || !previous ? 1 : 0),
        generation: (previous?.generation || 0) + (clearIssues || !previous ? 1 : 0),
        revision: (previous?.revision || 0) + 1,
      });
      await deliver(tabId);
      return true;
    }
    const state = states.get(tabId) || emptyState();
    states.set(tabId, state);
    const features = Array.isArray(request.features)
      ? request.features.filter((f) => typeof f === "string" && f)
      : [];
    // The renderer never invents counts. A usage provider can be connected here
    // independently of the parser and of any future enforcement policy.
    const usage = getFeatureUsage && features.length
      ? await getFeatureUsage(features, request) : {};
    // A reset during the asynchronous usage lookup supersedes this report.
    if (states.get(tabId) !== state) {
      return false;
    }
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

  async function reportIssue(request) {
    const tabId = await composeTab(request.windowId);
    const state = states.get(tabId) || emptyState();
    if (request.evaluationId !== state.evaluationId) {
      return false;
    }
    if (typeof request.message !== "string" || !request.message.trim()) {
      throw new Error("Missing Composer issue message");
    }
    const action = request.action;
    if (action != null && (action.type !== "copyTemplateSource" || typeof action.source !== "string")) {
      throw new Error("Unsupported Composer issue action");
    }
    state.issues.push({
      id: ++state.nextIssueId,
      expression: typeof request.expression === "string" ? request.expression : "",
      message: request.message,
      details: typeof request.details === "string" ? request.details : "",
      action: action ? { type: action.type, source: action.source } : null,
    });
    state.revision++;
    states.set(tabId, state);
    await deliver(tabId);
    return true;
  }

  async function issueAction(tabId, data) {
    const state = states.get(tabId);
    if (data.evaluationId !== state.evaluationId) {
      return false;
    }
    const issue = state.issues.find(item => item.id === data.issueId);
    if (!issue) {
      return false;
    }
    if (data.action === "dismissIssue") {
      state.issues = state.issues.filter(item => item.id !== issue.id);
      state.revision++;
      await deliver(tabId);
      return true;
    }
    if (issue.action?.type === "copyTemplateSource") {
      await copyText(issue.action.source);
      return true;
    }
    return false;
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
      case "dismissIssue":
      case "copyTemplateSource":
        return issueAction(tabId, data);
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
    reportIssue,
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
