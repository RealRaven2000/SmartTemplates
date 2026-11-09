// Standard compose-script isolated world, not a legacy chrome-window script.
(() => {
  if (globalThis.SmartTemplatesComposePrompt) {
    return;
  }
  const hostId = "smarttemplates-compose-prompt";
  document.getElementById(hostId)?.remove();
  const host = document.createElement("div");
  host.id = hostId;
  host.contentEditable = "false";
  const root = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = browser.runtime.getURL("html/prompt/prompt.css");
  const dialog = document.createElement("dialog");
  const header = document.createElement("div");
  header.className = "prompt-header";
  const icon = document.createElement("img");
  icon.src = browser.runtime.getURL("chrome/content/skin/icon32x32.png");
  icon.alt = "SmartTemplates";
  const caption = document.createElement("span");
  caption.className = "prompt-caption";
  const close = document.createElement("button");
  close.className = "close";
  close.type = "button";
  const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  closeIcon.setAttribute("viewBox", "0 0 20 20");
  closeIcon.setAttribute("fill", "none");
  closeIcon.setAttribute("aria-hidden", "true");
  const closePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  closePath.setAttribute("d", "m5 5 10 10M15 5 5 15");
  closePath.setAttribute("stroke", "currentColor");
  closePath.setAttribute("stroke-width", "2.4");
  closePath.setAttribute("stroke-linecap", "round");
  closePath.setAttribute("stroke-linejoin", "round");
  closeIcon.append(closePath);
  close.append(closeIcon);
  header.append(icon, caption, close);
  const form = document.createElement("form");
  const explanation = document.createElement("label");
  explanation.id = "explanation";
  explanation.htmlFor = "answer";
  const input = document.createElement("input");
  input.id = "answer";
  input.type = "text";
  input.autocomplete = "off";
  input.required = true;
  const choices = document.createElement("div");
  choices.id = "choices";
  choices.setAttribute("role", "radiogroup");
  choices.setAttribute("aria-labelledby", explanation.id);
  const buttons = document.createElement("div");
  buttons.className = "buttons";
  const cancel = document.createElement("button");
  cancel.type = "button";
  const accept = document.createElement("button");
  accept.type = "submit";
  accept.className = "primary";
  buttons.append(accept, cancel);
  form.append(explanation, input, choices, buttons);
  dialog.setAttribute("aria-labelledby", explanation.id);
  dialog.append(header, form);
  root.append(stylesheet, dialog);
  let currentId = null;
  let latestId = 0;
  let submitted = false;
  let savedFocus;
  let savedRanges = [];
  let choiceMode = false;
  let selectedChoice = null;

  function answer() {
    return choiceMode ? selectedChoice : input.value;
  }

  function validate() {
    accept.disabled = submitted || !answer()?.length;
  }

  function dismiss() {
    if (dialog.open) {
      dialog.close();
    }
    host.remove();
    savedFocus?.focus();
    const selection = document.getSelection();
    if (selection && savedRanges.length) {
      selection.removeAllRanges();
      for (const range of savedRanges) {
        if (range.commonAncestorContainer.isConnected) {
          selection.addRange(range);
        }
      }
    }
    savedRanges = [];
    currentId = null;
  }

  async function complete(answer) {
    if (submitted || currentId === null) {
      return;
    }
    submitted = true;
    const id = currentId;
    // Restore the editor selection before resuming the waiting legacy parser.
    dismiss();
    try {
      await browser.runtime.sendMessage({
        command: "composePrompt",
        action: "complete",
        id,
        answer,
      });
    } catch (error) {
      console.error("[ST443] Could not complete composer prompt", error);
    }
  }

  function render(model) {
    if (!model || model.id <= latestId) {
      return;
    }
    if (currentId !== null) {
      dismiss();
    }
    currentId = model.id;
    latestId = model.id;
    submitted = false;
    savedFocus = document.activeElement;
    const selection = document.getSelection();
    savedRanges = [];
    for (let index = 0; selection && index < selection.rangeCount; index++) {
      savedRanges.push(selection.getRangeAt(index).cloneRange());
    }
    explanation.textContent = model.explanation;
    caption.textContent = model.caption;
    choiceMode = model.choices.length > 0;
    selectedChoice = null;
    input.hidden = choiceMode;
    input.disabled = choiceMode;
    input.value = choiceMode ? "" : model.defaultValue;
    explanation.htmlFor = choiceMode ? "" : input.id;
    choices.hidden = !choiceMode;
    choices.replaceChildren();
    let choiceFocus;
    if (choiceMode) {
      const matchIndex = model.choices.findIndex(
        (choice) => choice.toLowerCase() === model.defaultValue.toLowerCase()
      );
      for (const [index, choice] of model.choices.entries()) {
        const row = document.createElement("label");
        row.className = "choice";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "prompt-choice";
        radio.value = choice;
        radio.required = true;
        radio.checked = index === matchIndex;
        if (radio.checked) {
          selectedChoice = choice;
        }
        if (!choiceFocus || radio.checked) {
          choiceFocus = radio;
        }
        radio.addEventListener("change", () => {
          if (radio.checked) {
            selectedChoice = choice;
            validate();
          }
        });
        const text = document.createElement("span");
        text.textContent = choice;
        row.append(radio, text);
        choices.append(row);
      }
    }
    accept.textContent = model.accept;
    cancel.textContent = model.cancel;
    close.title = model.cancel;
    close.setAttribute("aria-label", model.cancel);
    validate();
    // The host stays outside the message body; the UI cannot become email content.
    document.documentElement.append(host);
    dialog.showModal();
    if (choiceMode) {
      choiceFocus.focus();
    } else {
      input.focus();
      input.select();
    }
  }

  input.addEventListener("input", validate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = answer();
    if (value?.length) {
      void complete(value);
    }
  });
  cancel.addEventListener("click", () => {
    void complete(null);
  });
  close.addEventListener("click", () => {
    void complete(null);
  });
  dialog.addEventListener("keydown", (event) => {
    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.target === cancel ||
      event.target === close
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!accept.disabled) {
      void complete(answer());
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    void complete(null);
  });
  browser.runtime.onMessage.addListener((message) => {
    if (message?.command !== "composePrompt") {
      return false;
    }
    if (message.action === "dismiss") {
      dismiss();
    } else {
      try {
        render(message.model);
      } catch (error) {
        console.error("[ST443] Could not render composer prompt", error);
        void complete(null);
      }
    }
    return Promise.resolve(true);
  });
  globalThis.SmartTemplatesComposePrompt = { render };
  browser.runtime
    .sendMessage({ command: "composePrompt", action: "ready" })
    .then(render)
    .catch((error) => {
      console.error("[ST443] Composer prompt initialization failed", error);
      void complete(null);
    });
})();
