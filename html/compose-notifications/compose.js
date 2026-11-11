// Compose-script isolated world, not a legacy chrome window script.
(() => {
  const hostId = "smarttemplates-compose-notification";
  // Reinjection in an already open composer must not duplicate listeners/hosts.
  if (globalThis.SmartTemplatesComposeNotifications) {
    return;
  }

  document.getElementById(hostId)?.remove(); // Empty host left by an earlier add-on instance.
  const host = document.createElement("div");
  host.id = hostId;
  host.contentEditable = "false";
  const root = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = browser.runtime.getURL("html/compose-notifications/notification.css");
  root.append(stylesheet);
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  };

  const bubble = make("details", "bubble");
  bubble.addEventListener("toggle", () => {
    // :has() cannot inspect children across a shadow boundary.
    host.toggleAttribute("data-expanded", bubble.open);
    updateToggleLabel();
    schedulePosition();
  });
  
  const summary = make("summary");
  const icon = make("img", "brand");
  icon.src = browser.runtime.getURL("chrome/content/skin/icon32x32.png");
  icon.alt = "";
  const heading = make("span", "heading");
  const compact = make("strong", "compact");
  const hint = make("span", "hint");
  const title = make("strong", "title");
  heading.append(compact, hint, title);
  const drawIcon = (path, strokeWidth) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", path);
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", strokeWidth);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.append(line);
    return svg;
  };
  const chevron = make("span", "chevron header-control");
  chevron.append(drawIcon("m5 7.5 5 5 5-5", "1.8"));
  chevron.setAttribute("aria-hidden", "true");
  const close = make("button", "close header-control");
  close.type = "button";
  close.append(drawIcon("m5 5 10 10M15 5 5 15", "2.4"));
  close.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stopPositioning();
    host.remove();
  });
  function updateToggleLabel() {
    const label = bubble.open ? labels.collapse : labels.expand;
    summary.title = label;
    chevron.title = label;
  }
  let labels = {};
  summary.append(icon, heading, chevron, close);
  const panel = make("section", "panel");
  panel.id = "details";
  summary.setAttribute("aria-controls", panel.id);
  const trial = make("div", "row");
  const usageHint = make("p", "usage-hint");
  const blockedExplanation = make("p", "blocked-explanation");
  const pro = make("div", "row");
  const standard = make("div", "row");
  const actions = make("div", "actions");
  const issues = make("div", "issues");
  const divider = make("hr", "section-divider");
  panel.append(issues, divider, usageHint, trial, pro, standard, actions);
  bubble.append(summary, panel);
  root.append(bubble);
  const positionStyle = document.createElement("style");
  root.append(positionStyle);

  // Optional compatibility with LanguageTool's open shadow toolbar. Never alter
  // another add-on's DOM or styles; only move our own collapsed bubble.
  const foreignRoots = new Map();
  const resizeObserver = new ResizeObserver(() => schedulePosition());
  const documentObserver = new MutationObserver(() => schedulePosition());
  let positioning = false;
  let frame = 0;
  let poll = 0;
  let lastLayoutReport = "";

  function schedulePosition() {
    if (!positioning || frame) {
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = 0;
      updatePosition();
    });
  }

  function updatePosition() {
    const containers = new Set(document.querySelectorAll("lt-container"));
    for (const [container, entry] of foreignRoots) {
      if (!containers.has(container) || container.shadowRoot !== entry.root) {
        entry.observer.disconnect();
        foreignRoots.delete(container);
      }
    }
    for (const container of containers) {
      const foreignRoot = container.shadowRoot;
      if (!foreignRoot || foreignRoots.has(container)) {
        continue;
      }
      const observer = new MutationObserver(() => schedulePosition());
      observer.observe(foreignRoot, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"],
      });
      foreignRoots.set(container, { root: foreignRoot, observer });
    }

    positionStyle.textContent = "";
    if (bubble.open || !host.isConnected) {
      return;
    }
    const own = host.getBoundingClientRect();
    // The compose document may be in quirks mode: root.clientHeight can then
    // describe the full document instead of the visible editor viewport.
    const height = window.innerHeight;
    let bottom = 16;
    const report = {
      containers: containers.size,
      openRoots: foreignRoots.size,
      candidates: 0,
      visible: 0,
      viewportHeight: height,
      bottom: 16,
    };
    // Use our default position on every pass to avoid oscillating after moving up.
    const defaultTop = height - 16 - own.height;
    for (const { root: foreignRoot } of foreignRoots.values()) {
      // A wrapper can have zero dimensions when its controls are positioned.
      // Measure descendants as well, rather than treating an empty wrapper as
      // proof that its visible button has no geometry.
      for (const toolbar of foreignRoot.querySelectorAll(
        "lt-toolbar, lt-toolbar *, .lt-toolbar__wrapper, .lt-toolbar__wrapper *"
      )) {
        report.candidates++;
        const rect = toolbar.getBoundingClientRect();
        const style = getComputedStyle(toolbar);
        if (
          !rect.width ||
          !rect.height ||
          style.visibility === "hidden" ||
          style.display === "none" ||
          Number(style.opacity) === 0
        ) {
          continue;
        }
        report.visible++;
        if (
          rect.right <= own.left ||
          rect.left >= own.right ||
          rect.bottom <= defaultTop - 10 ||
          rect.top >= height
        ) {
          continue;
        }
        bottom = Math.max(bottom, height - rect.top + 10);
      }
    }
    // Keep the bubble within the editor even if a foreign toolbar is unusually tall.
    bottom = Math.min(bottom, Math.max(16, height - own.height - 8));
    if (bottom > 16) {
      positionStyle.textContent = `:host { --notification-bottom: ${bottom}px; }`;
    }
    report.bottom = bottom;
    const serialized = JSON.stringify(report);
    if (serialized !== lastLayoutReport) {
      console.debug("[ST441] Overlay layout", report);
      lastLayoutReport = serialized;
    }
  }

  function startPositioning() {
    if (positioning) {
      return;
    }
    positioning = true;
    documentObserver.observe(document.documentElement, { subtree: true, childList: true });
    resizeObserver.observe(host);
    window.addEventListener("resize", schedulePosition);
    window.addEventListener("scroll", schedulePosition, true);
    // Shadow attachment itself does not emit a document mutation. Also catch
    // layout changes in a foreign component that do not mutate its attributes.
    poll = setInterval(() => {
      if (!bubble.open) {
        schedulePosition();
      }
    }, 1000);
    schedulePosition();
  }

  function stopPositioning() {
    positioning = false;
    documentObserver.disconnect();
    resizeObserver.disconnect();
    for (const { observer } of foreignRoots.values()) {
      observer.disconnect();
    }
    foreignRoots.clear();
    window.removeEventListener("resize", schedulePosition);
    window.removeEventListener("scroll", schedulePosition, true);
    clearInterval(poll);
    cancelAnimationFrame(frame);
    frame = 0;
    positionStyle.textContent = "";
  }
  window.addEventListener("pagehide", stopPositioning, { once: true });

  function act(action) {
    return browser.runtime
      .sendMessage({ command: "composeNotifications", action })
      .catch((error) => console.error("[ST441] Notification action failed", action, error));
  }

  function row(element, label, className, text) {
    element.replaceChildren();
    element.hidden = !text;
    if (!text) {
      return;
    }
    const badge = make("span", "badge " + className, label);
    const content = make("p", "text", text);
    element.append(badge, content);
    return content;
  }

  function featureRow(element, label, className, features, description, notes, allUsed) {
    element.toggleAttribute("data-blocked", !!features?.some(feature => feature.blocked));
    const content = row(element, label, className, features?.length ? " " : "");
    if (!content) {
      return;
    }
    content.replaceChildren();
    [...features].sort((a, b) => Number(!!b.blocked) - Number(!!a.blocked)).forEach((feature, index) => {
      if (index) {
        content.append(document.createTextNode(", "));
      }
      const item = make("span", "feature-item" + (feature.blocked ? " is-blocked" : ""));
      item.append(make("code", "", `%${feature.name}%`));
      if (feature.remaining !== undefined && feature.explanation) {
        const count = make("button", "trial-count", feature.blocked
          ? allUsed : `(${feature.remaining})`);
        count.type = "button";
        count.title = feature.explanation;
        count.setAttribute("aria-label", feature.name + ": " + feature.explanation);
        count.addEventListener("click", () => {
          const variable = make("span", "feature-item" + (feature.blocked ? " is-blocked" : ""));
          variable.append(make("code", "", `%${feature.name}%`));
          explanation.replaceChildren(variable, document.createTextNode(" " + feature.explanation));
          explanation.hidden = false;
          schedulePosition();
        });
        item.append(document.createTextNode(" "), count);
      }
      content.append(item);
    });
    content.append(document.createTextNode(" — " + description));
    if (notes) {
      content.append(document.createTextNode(" " + notes));
    }
  }

  const explanation = make("p", "usage-explanation");
  explanation.setAttribute("role", "status");
  explanation.hidden = true;
  panel.append(explanation);
  panel.append(blockedExplanation);

  // Issue rows are keyed so incremental reports do not replace focused controls.
  const issueRows = new Map();
  function renderIssues(model) {
    const currentIds = new Set((model.issues || []).map(issue => issue.id));
    for (const [id, element] of issueRows) {
      if (!currentIds.has(id) || element.dataset.evaluation !== String(model.evaluationId)) {
        element.remove();
        issueRows.delete(id);
      }
    }
    for (const issue of model.issues || []) {
      if (issueRows.has(issue.id)) {
        continue;
      }
      const element = make("div", "row issue-row");
      element.dataset.evaluation = String(model.evaluationId);
      const content = make("div", "issue-content");
      if (issue.expression) {
        const characters = Array.from(issue.expression);
        const token = make("code", "error-token", characters.length > 45
          ? characters.slice(0, 44).join("") + "…" : issue.expression);
        token.title = issue.expression;
        token.setAttribute("aria-label", issue.expression);
        token.tabIndex = 0;
        content.append(token);
      }
      content.append(make("p", "text issue-message", issue.message));
      if (issue.details) {
        content.append(make("pre", "issue-details", issue.details));
      }
      const send = action => browser.runtime.sendMessage({
        command: "composeNotifications", action,
        issueId: issue.id, evaluationId: model.evaluationId,
      });
      if (issue.action?.type === "copyTemplateSource") {
        const copy = make("button", "issue-copy", model.copyTemplateSource);
        copy.type = "button";
        copy.addEventListener("click", async () => {
          try {
            if (await send("copyTemplateSource")) {
              copy.textContent = model.copyTemplateSource + " ✓";
            }
          } catch (error) {
            content.append(make("pre", "issue-details", error.message));
          }
        });
        content.append(copy);
      }
      const dismiss = make("button", "issue-dismiss", model.dismissIssue);
      dismiss.type = "button";
      dismiss.setAttribute("aria-label", model.dismissIssue + ": " + (issue.expression || issue.message));
      dismiss.addEventListener("click", async () => {
        try {
          const focus = element.nextElementSibling?.querySelector(".issue-dismiss") ||
            element.previousElementSibling?.querySelector(".issue-dismiss") || summary;
          if (await send("dismissIssue")) {
            focus.focus();
          }
        } catch (error) {
          content.append(make("pre", "issue-details", error.message));
        }
      });
      element.append(make("span", "badge issue-badge", model.issueLabel), content, dismiss);
      issues.append(element);
      issueRows.set(issue.id, element);
    }
    issues.hidden = !currentIds.size;
    divider.hidden = !currentIds.size || !model.hasLicensing;
  }

  let revision = -1;
  let generation = 0;
  function render(model) {
    if (!model) {
      return;
    }
    if (model.revision < revision) {
      return;
    }
    revision = model.revision;
    labels = model;
    close.title = model.dismiss;
    close.setAttribute("aria-label", model.dismiss);
    if ((model.generation || 0) !== generation) {
      generation = model.generation || 0;
      bubble.open = false;
      host.removeAttribute("data-expanded");
    }
    updateToggleLabel();
    if (model.visible === false) {
      stopPositioning();
      host.remove();
      return;
    }
    compact.replaceChildren();
    if (model.hasLicensing) {
      compact.append(document.createTextNode(model.compact));
    }
    if (model.issues?.length) {
      if (model.hasLicensing) {
        compact.append(document.createTextNode(" · "));
      }
      compact.append(make("span", "template-issues", model.issuesLabel + " (" + model.issues.length + ")"));
    }
    renderIssues(model);
    hint.textContent = model.learnMore;
    title.textContent = model.title;
    bubble.toggleAttribute("data-blocked", !!model.blocked);
    blockedExplanation.textContent = model.blockedExplanation || "";
    blockedExplanation.hidden = !model.blocked;
    const licenseContent = row(trial, "licence", "license", model.trial);
    if (licenseContent) {
      licenseContent.replaceChildren(
        make("strong", "trial", model.trial),
        document.createTextNode(" ")
      );
      const link = make("a", "", model.licensingLabel);
      link.href = "https://smarttemplates.quickfolders.org/contribute.html";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        act("licensing");
      });
      licenseContent.append(link);
    }
    usageHint.textContent = model.usageHint;
    usageHint.hidden = !model.usageHint;
    explanation.hidden = true;
    explanation.textContent = "";
    featureRow(pro, "PRO", "pro", model.proFeatures, model.proDescription, model.proNotes, model.allUsed);
    featureRow(standard, "STD", "standard", model.standardFeatures, model.standardDescription, model.standardNotes, model.allUsed);
    const firstLicenseRow = [trial, pro, standard].find(element => !element.hidden);
    for (const element of [trial, pro, standard]) {
      element.toggleAttribute("data-section-first", element === firstLicenseRow);
    }
    actions.replaceChildren();
    actions.hidden = !model.hasLicensing || !model.buttons?.length;
    for (const item of model.buttons || []) {
      const button = make("button", item.primary ? "primary" : "", item.label);
      button.type = "button";
      button.addEventListener("click", () => {
        act(item.action);
      });
      actions.append(button);
    }
    // Keep the light DOM empty. All UI/text/styles are in the shadow tree.
    if (!host.isConnected) {
      document.documentElement.append(host);
    }
    startPositioning();
    schedulePosition();
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message?.command !== "composeNotifications") {
      return false;
    }
    render(message.model);
    return Promise.resolve(true);
  });
  globalThis.SmartTemplatesComposeNotifications = { render };
  act("ready").then(render);
})();
