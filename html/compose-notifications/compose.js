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
  const chevron = make("span", "chevron", "›");
  chevron.setAttribute("aria-hidden", "true");
  summary.append(icon, heading, chevron);
  const panel = make("section", "panel");
  panel.id = "details";
  summary.setAttribute("aria-controls", panel.id);
  const trial = make("div", "row");
  const pro = make("div", "row");
  const standard = make("div", "row");
  const actions = make("div", "actions");
  panel.append(trial, pro, standard, actions);
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

  let revision = -1;
  function render(model) {
    if (!model) {
      return;
    }
    if (model.revision < revision) {
      return;
    }
    revision = model.revision;
    if (model.visible === false) {
      stopPositioning();
      host.remove();
      return;
    }
    compact.textContent = model.compact;
    hint.textContent = model.learnMore;
    title.textContent = model.title;
    const licenseContent = row(trial, "licence", "license", model.trial);
    if (licenseContent) {
      licenseContent.replaceChildren(
        make("strong", "trial", model.trial),
        document.createTextNode(model.licenseText + " ")
      );
      const link = make("a", "", model.licensingLabel);
      link.href = "https://smarttemplates.quickfolders.org/contribute.html";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        act("licensing");
      });
      licenseContent.append(link);
    }
    row(pro, "PRO", "pro", model.proText);
    row(standard, "STD", "standard", model.standardText);
    actions.replaceChildren();
    actions.hidden = !model.buttons?.length;
    for (const item of model.buttons || []) {
      const button = make("button", item.primary ? "primary" : "", item.label);
      button.type = "button";
      button.addEventListener("click", () => {
        if (item.action === "later") {
          bubble.open = false;
        } // Dummy; does not persist a snooze.
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
