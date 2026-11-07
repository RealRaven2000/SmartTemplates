/* global SmartTemplatesUsage */
(function (usage) {
  const standard = ["file", "style", "dateformat"];
  const pro = ["preheader", "snippetSelection", "clipboard", "toclipboard", "tags",
    "deleteForwardedBody", "attach", "conditionalText", "X:=calculated", "X:=timezone",
    "matchTextFromSubject", "matchTextFromBody", "deleteText", "replaceText",
    "deleteQuotedText", "replaceQuotedText", "deleteQuotedTags", "replaceQuotedTags",
    "header.set", "header.append", "header.prefix", "header.delete", "header.deleteFromSubject"];
  usage.POLICY = Object.freeze(Object.fromEntries([
    ...standard.map(name => [name, Object.freeze({ maximum: 12, tier: "standard" })]),
    ...pro.map(name => [name, Object.freeze({ maximum: 12, tier: "pro" })]),
  ]));
})(SmartTemplatesUsage);
