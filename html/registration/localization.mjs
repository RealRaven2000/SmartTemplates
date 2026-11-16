/* globals formatAll, parseHTMLFragment */
import { registrationConfig } from "./config.mjs";

export function message(key, substitutions = []) {
  return messenger.i18n.getMessage("registration." + key, substitutions);
}

export function localizePage() {
  document.documentElement.lang = messenger.i18n.getUILanguage();
  i18n.updateDocument();
  document.getElementById("terms-intro").textContent = message("terms.intro", [
    registrationConfig.firstReleaseDate.slice(0, 4),
  ]);
  // Only dedicated rich-text leaves are formatted; controls/links remain intact.
  // data-l10n-id records legacy source entities and has no runtime role.
  for (const element of document.querySelectorAll(".localized-markup")) {
    element.replaceChildren(parseHTMLFragment(formatAll(element.textContent)));
  }
}
