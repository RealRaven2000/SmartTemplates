"use strict";

// Isolated layout experiment: synthetic states and no real checkout effects.
(() => {
  const scenario = document.getElementById("preview-scenario");
  const plans = [...document.querySelectorAll(".plan")];
  const editions = ["Standard", "Pro", "Domain"];
  const seats = document.createElement("p");
  seats.className = "domain-seats-note";
  const seatsLink = document.createElement("a");
  seatsLink.href = "https://sites.fastspring.com/quickfolders/product/smarttemplate_domainseat";
  seatsLink.target = "_blank";
  seatsLink.rel = "noopener noreferrer";
  seatsLink.textContent = "Add users";
  const seatsIcon = plans[2].querySelector(".external-icon").cloneNode(true);
  seatsLink.appendChild(seatsIcon);
  seats.append("Need more seats? ", seatsLink, " to your existing Domain license.");
  plans[2].querySelector(".plan-bottom").before(seats);
  const expiryWarning = document.createElement("span");
  expiryWarning.className = "expiry-warning";
  expiryWarning.textContent = "License expires in 6 days";
  document.querySelector(".summary-title").appendChild(expiryWarning);
  for (const plan of plans) {
    const note = document.createElement("p");
    note.className = "current-edition-note";
    note.hidden = true;
    plan.querySelector(".plan-bottom").appendChild(note);
  }

  function render() {
    const state = scenario.value;
    const upgrade = state === "upgrade";
    const extending = state.startsWith("extend-");
    const valid = upgrade || extending;
    const pro = state.endsWith("-pro");
    const domain = state.endsWith("-domain");
    seats.hidden = !domain;
    const currentIndex = domain ? 2 : pro ? 1 : 0;
    const buying = state === "buy";
    const summary = document.querySelector(".license-summary");
    summary.classList.toggle("valid-license", valid);
    expiryWarning.hidden = !extending;
    document.getElementById("current-license").textContent = buying
      ? "No license yet" : `${editions[currentIndex]} license`;
    summary.querySelector(".status").textContent = buying ? "Free edition" : valid ? "Valid" : "Expired";
    summary.querySelector("p").textContent = buying
      ? "Choose a license below to get started."
      : upgrade ? "Your license is valid until November 17, 2027."
        : extending ? "Your license is valid until November 23, 2026."
        : "Your license expired on November 11, 2026.";
    document.getElementById("checkout-notice").hidden = true;
    document.getElementById("feedback").hidden = true;

    plans.forEach((plan, index) => {
      plan.hidden = (!buying && index === 0 && currentIndex > 0) || (upgrade && index === 0);
      const button = plan.querySelector(".purchase");
      const primary = index === (domain ? 2 : 1);
      plan.classList.toggle("featured", primary);
      button.classList.toggle("primary", primary);
      button.classList.toggle("secondary", !primary);
      const note = plan.querySelector(".current-edition-note");
      const separatePro = domain && index === 1;
      note.hidden = !separatePro;
      note.classList.toggle("separate-pro-warning", separatePro);
      note.textContent = separatePro
        ? "Pro is a separate personal license, not a Domain renewal. Your Domain license covers you on installations with a mail account using your registered company domain, within your purchased seats. A separate Pro license can cover a home installation where you cannot use that account. To continue your team's coverage, choose Renew Domain."
        : "";
      if (separatePro) {
        button.before(note);
      } else {
        plan.querySelector(".plan-bottom").appendChild(note);
      }
      let label = `Buy ${editions[index]}`;
      if (!buying && !upgrade && index === currentIndex) {
        label = `${extending && !domain ? "Extend" : "Renew"} ${editions[index]}`;
      } else if (!buying && currentIndex === 0 && index === 1) {
        label = "Upgrade to Pro";
      }
      // Retain the SVG and the existing prototype-only click listener.
      button.firstChild.textContent = label + " ";
      button.dataset.plan = label;
    });
    document.querySelector(".plans").style.setProperty("--preview-columns", plans.filter((plan) => !plan.hidden).length);
  }

  scenario.addEventListener("change", render);
  render();
})();
