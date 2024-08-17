/* load help.js first */

async function initHTML() {
  console.log("help-html.js init()");
  isDebugLegacyOption = async function () {
    const isDebug =  await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.variables.search")
    return isDebug;
  }

  i18n.updateDocument(); // parent doc must have loaded ../chrome/content/i18n.js
  // functions from help.js
  fixClipboardNote(); 
  initSearch();
  const expander = document.getElementById("allexpander");
  const collapser = document.getElementById("collapseAll");
  expander.addEventListener("click", evt => {
    expandAll(evt);
    collapser.classList.remove('collapsed');
    expander.classList.add('collapsed');

  });
  collapser.addEventListener("click", evt => {
    collapseAll(evt);
    collapser.classList.add('collapsed');
    expander.classList.remove('collapsed');
  });
  
}


if (findOrigin() == "html") {
  // this was called from settings.html (and not from the XUL dialog)
  initHTML();
}

