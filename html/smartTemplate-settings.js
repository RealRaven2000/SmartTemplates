

addEventListener("load", async (event) => {
  const manifest = await messenger.runtime.getManifest(),
        browserInfo = await messenger.runtime.getBrowserInfo(),
        addonVer = manifest.version;

  i18n.updateDocument();

  // this api function can do replacements for us
  //  h1.innerText = messenger.i18n.getMessage('heading-installed', addonName);
});  






