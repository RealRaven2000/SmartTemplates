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
	if (!buttons.includes("licensing")) {
		document.getElementById("btnShowLicenser").hidden = true;
		document.getElementById("btnFeatureCompare").hidden = true;
	}
}

window.addEventListener("load", async () => {
  const params = getQueryParams();
  const features = (params.features || "ok").split(","); // fallback to "ok"
  // find all features relating to buttons:
  const buttonsList = features.filter((b) => ["ok", "cancel", "yes", "no", "licenser"].includes(b));
  let message = "";
  if (params.msgId) {
    message = messenger.i18n.getMessage(params.msgId);
  } else if (params.msg) {
    message = params.msg;
  } else {
    message = messenger.i18n.getMessage("msgPlaceholder");
  }	

  // Set message text
	try {
		document.getElementById("innerMessage").innerHTML = formatAll(message);
	} catch (ex) {
		document.getElementById("innerMessage").textContent = message;
	}
  
  i18n.updateDocument();
  showButtons(buttonsList);

  // Show buttons according to features
  const buttons = {
    ok: document.getElementById("ok"),
    yes: document.getElementById("yes"),
    no: document.getElementById("no"),
    cancel: document.getElementById("cancel"),
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

  // Optionally handle ESC key as cancel
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && buttons.cancel && !buttons.cancel.hidden) {
      buttons.cancel.click();
    }
  });
});

