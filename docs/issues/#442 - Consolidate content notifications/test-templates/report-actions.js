// Optional controlled UI test: run in the multiprocess Browser Console.
// Targets the most recently active Composer, not the console's selected global.
// This reports synthetic issues; it does not intentionally break HTML insertion.
(async () => {
  const composer = Services.wm.getMostRecentWindow("msgcompose");
  if (!composer?.SmartTemplate4?.Util) {
    throw new Error("Open a Composer with SmartTemplates before running this test.");
  }
  const util = composer.SmartTemplate4.Util;
  const first = await util.reportComposeIssue({
    message: "Test HTML insertion failure: inspect details and copy the source.",
    expression: "test-template.html",
    details: "Synthetic diagnostic: insertion failed near the signature.",
    action: { type: "copyTemplateSource", source: "<p>ST442 clipboard verification</p>" },
  });
  const second = await util.reportComposeIssue({
    message: "Second test issue: dismiss either row independently.",
    expression: "%example(another,problem)%",
    details: "This row should survive dismissal of the first row.",
  });
  if (!first || !second) {
    throw new Error("Could not report both test issues; check the SmartTemplates console diagnostics.");
  }
  return { reported: 2, composerTitle: composer.document.title };
})();
