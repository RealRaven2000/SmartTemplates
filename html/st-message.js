/* 
  BEGIN LICENSE BLOCK

	SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

// Helper to get query parameters
function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

function showButtons(buttonList) {
  const buttons = buttonList.map((s) => s.trim());
  ["ok", "yes", "no", "cancel"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
		el.hidden = !buttons.includes(id);
  });
	if (buttons.includes("licensing")) {
		document.getElementById("btnShowLicenser").hidden = false;
	}
	if (buttons.includes("featurecomp")) {
		document.getElementById("btnFeatureCompare").hidden = false;
	}

}

window.addEventListener("load", async () => {
  const params = getQueryParams();
  const features = (params.features || "ok").split(","); // fallback to "ok"
	const feature = params.addonfeature || null;
  // find all features relating to buttons:
  const buttonsList = features.filter((b) =>
    ["ok", "cancel", "yes", "no", "licensing", "featurecomp"].includes(b)
  );
  let message = "";
  if (params.msgId) {
    // allow multiple ids as a comma separated string of localized message ids
    const ids =
      typeof params.msgId === "string" && params.msgId.includes(",")
        ? params.msgId.split(",").map((s) => s.trim())
        : [params.msgId];

    for (const id of ids) {
      message += messenger.i18n.getMessage(id); // Each returns HTML with <p> or {P1}{P2} as needed
    }
  } else if (params.msg) {
    message = params.msg;
  } else {
    message = messenger.i18n.getMessage("msgPlaceholder");
  }	

  // Set message text
  const messageContainer = document.getElementById("innerMessage");
  // generate HTML markup
  await insertLocalizedMessage(messageContainer, message);
  
  i18n.updateDocument();
  showButtons(buttonsList);

  // Show buttons according to features
  const buttons = {
    ok: document.getElementById("ok"),
    yes: document.getElementById("yes"),
    no: document.getElementById("no"),
    cancel: document.getElementById("cancel"),
    features: document.getElementById("btnFeatureCompare"),
    showLicense: document.getElementById("btnShowLicenser"),
  };

  // Setup button handlers:
  buttons.ok?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ context: "smartTemplate-message", result: "ok" });
  });
  buttons.cancel?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ context: "smartTemplate-message", result: "cancel" });
  });
  buttons.yes?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ context: "smartTemplate-message", result: "yes" });
  });
  buttons.no?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ context: "smartTemplate-message", result: "no" });
  });
	buttons.features?.addEventListener("click", async () => {
		// open url
		const dataUrl = "https://smarttemplates.quickfolders.org/premium.html#featureComparison";
		let found = await messenger.tabs.query({ url: dataUrl });
		if (found.length) {
			let tab = found[0]; // first result
			await messenger.tabs.update(tab.id, { active: true, url: dataUrl });
			return;
		}
		messenger.tabs.create({ active: true, url: dataUrl });
  });
  buttons.showLicense?.addEventListener("click", () => {
		messenger.runtime.sendMessage({ context: "smartTemplate-message", result: "cancel" });
		messenger.runtime.sendMessage({
      command: "showRegistrationDialog",
      feature: feature,
    });
  });	
	

  // Optionally handle ESC key as cancel
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && buttons.cancel && !buttons.cancel.hidden) {
      buttons.cancel.click();
    }
  });
});

