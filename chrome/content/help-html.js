/* load help.js first */

async function initHTML() {
  console.log("help-html.js init()");
  i18n.updateDocument(); // parent doc must have loaded ../chrome/content/i18n.js
  // functions from help.js
  fixClipboardNote(); 
  initSearch();
}



if (findOrigin() == "html") {
  // this was called from settings.html (and not from the XUL dialog)
  initHTML();
}
