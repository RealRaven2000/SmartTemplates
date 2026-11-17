import { selectIdentities } from "./model.mjs";

export async function loadRegistrationData() {
  const [license, accounts, forceSecondaryIdentity] = await Promise.all([
    messenger.runtime.sendMessage({ command: "getLicenseInfo" }),
    messenger.accounts.list(false),
    messenger.LegacyPrefs.getPref(
      "extensions.smartTemplate4.licenser.forceSecondaryIdentity",
      false
    ).catch(() => false),
  ]);
  if (!license || typeof license.status !== "string") {
    throw new Error("License information unavailable");
  }
  const defaults = Object.fromEntries(
    await Promise.all(
      accounts.map(async (account) => [
        account.id,
        await messenger.identities.getDefault(account.id),
      ])
    )
  );
  return {
    license,
    identities: selectIdentities(accounts, defaults, license, forceSecondaryIdentity),
  };
}

export async function openLicenseSettings() {
  const registrationTab = await messenger.tabs.getCurrent();
  const settingsTab = await messenger.runtime.sendMessage({ command: "openPrefs", page: "licenseKey" });
  if (!Number.isInteger(settingsTab?.id)) {
    throw new Error("License settings did not open");
  }
  if (Number.isInteger(registrationTab?.id) && registrationTab.id !== settingsTab.id) {
    await messenger.tabs.remove(registrationTab.id);
  }
  return settingsTab;
}
