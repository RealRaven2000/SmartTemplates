var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

/*
  this script is necessary for [issue 171] Examples tab needs a browser element
*/

async function onLoad(activatedWhileWindowOpen) {
  const util = window.SmartTemplate4.Util;
  if (util.versionGreaterOrEqual(util.AppverFull, "91")) {
    util.logDebug("Inject Browser element");
    debugger;
    WL.injectElements(`
    <tabpanel flex = "1" id = "templatesFrame">
        <browser id="templatesBrowser"
                type="content"
                flex = "1"
                minheight="300"
                remote="true"
                />
    </tabpanel>
    `);
  }
}
