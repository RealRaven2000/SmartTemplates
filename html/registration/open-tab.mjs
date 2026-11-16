// Called in the background context, where runtime.getURL yields moz-extension:.
export async function openRegistrationTab(api, { feature = "", intent = "" } = {}) {
  const baseURL = api.runtime.getURL("html/registration/registration.html");
  const destination = new URL(baseURL);
  if (typeof feature === "string" && feature) {
    destination.searchParams.set("feature", feature);
  }
  if (intent === "extend") {
    destination.searchParams.set("intent", intent);
  }
  const url = destination.href;
  const [existing] = await api.tabs.query({ url: baseURL + "*" });
  if (existing) {
    return api.tabs.update(existing.id, { active: true, url });
  }
  return api.tabs.create({ active: true, url });
}

// Run in Settings: retain the source tab if opening registration fails.
export async function openRegistrationFromSettings(api, options = {}) {
  const settingsTab = await api.tabs.getCurrent();
  const registrationTab = await api.runtime.sendMessage({ command: "openRegistrationTab", ...options });
  if (!Number.isInteger(registrationTab?.id)) {
    throw new Error("Registration tab did not open");
  }
  if (Number.isInteger(settingsTab?.id) && settingsTab.id !== registrationTab.id) {
    await api.tabs.remove(settingsTab.id);
  }
  return registrationTab;
}
