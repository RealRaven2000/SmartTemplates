"use strict";

// Standalone fixture only: no add-on APIs, real licenses, or checkout effects.
(() => {
  const selection = document.getElementById("selection-panel");
  const terms = document.getElementById("terms-panel");
  const toggle = document.getElementById("toggle-terms");
  const workspace = document.querySelector(".workspace");
  const feedback = document.getElementById("feedback");
  const emailHelpButton = document.getElementById("email-help-button");
  const emailHelp = document.getElementById("email-help");

  function closeEmailHelp(restoreFocus = false) {
    emailHelp.hidden = true;
    emailHelpButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      emailHelpButton.focus();
    }
  }

  emailHelpButton.addEventListener("click", () => {
    const opening = emailHelp.hidden;
    emailHelp.hidden = !opening;
    emailHelpButton.setAttribute("aria-expanded", String(opening));
  });
  document.getElementById("email-help-close").addEventListener("click", () => {
    closeEmailHelp(true);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !emailHelp.hidden) {
      event.preventDefault();
      closeEmailHelp(true);
    }
  });
  document.addEventListener("click", (event) => {
    if (!emailHelp.hidden && !event.target.closest(".email-field")) {
      closeEmailHelp();
    }
  });

  toggle.addEventListener("click", () => {
    closeEmailHelp();
    const showingTerms = terms.hidden;
    terms.hidden = !showingTerms;
    selection.hidden = showingTerms;
    toggle.setAttribute("aria-expanded", String(showingTerms));
    workspace.classList.toggle("terms-open", showingTerms);
    document.getElementById("step-label").textContent = showingTerms ? "LICENSE TERMS" : "LICENSE SELECTION";
    document.getElementById("view-title").textContent = showingTerms ? "Know what you’re choosing." : "A fresh year, your way.";
    toggle.replaceChildren(document.createTextNode(showingTerms ? "🡇 Continue to License Selection 🡇" : "Show license terms 🡇"));
    feedback.hidden = true;
  });

  document.getElementById("identity").addEventListener("change", (event) => {
    document.getElementById("email").value = event.target.value === "work" ? "alex@studio.example" : "alex@example.com";
    document.getElementById("first-name").value = "Alex";
    document.getElementById("last-name").value = "Morgan";
  });

  document.querySelectorAll(".purchase").forEach((button) => {
    button.addEventListener("click", () => {
      feedback.textContent = `Preview: ${button.dataset.plan} for ${document.getElementById("email").value}. Live checkout would receive the contact details and previous license as referrer. No shop was opened.`;
      feedback.hidden = false;
      feedback.scrollIntoView({ behavior: "auto", block: "nearest" });
    });
  });

  document.getElementById("enter-key").addEventListener("click", () => {
    feedback.textContent = "License entry is a placeholder in this prototype. The live page will open the license settings.";
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: "auto", block: "nearest" });
  });
})();
