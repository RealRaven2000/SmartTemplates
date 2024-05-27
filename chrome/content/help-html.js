// find out where I am loaded from?
function findOrigin() {
  const url = new URL(document.URL);
  const scriptParams = Object.fromEntries(url.searchParams)
  // console.log(scriptParams);
  return scriptParams["context"] || null;
}

async function init() {
  console.log("help-html.js init()");
  i18n.updateDocument(); // parent doc must have loaded ../chrome/content/i18n.js
  debugger;
  //  await LoadCSS("skin/settings.css");
  // functions from help.js
  fixClipboardNote(); 
  initSearch();
}



if (findOrigin() == "html") {
  // this was called from settings.html (and not from the XUL dialog)
  init();
}
