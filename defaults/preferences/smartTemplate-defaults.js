/* specify locale descriptions for addon-manager */
pref("extensions.smarttemplate4@thunderbird.extension.description", "chrome://smartTemplate4/locale/settings.properties");

/* global settings */
pref("extensions.smartTemplate4.firstRun", true);
pref("extensions.smartTemplate4.version", "?");
pref("extensions.smartTemplate4.breaksAtTop", 1);
pref("extensions.smartTemplate4.showStatusIcon", true);
pref("extensions.smartTemplate4.statusIconLabelMode", 1); /* 0 - no label; 1 - autohide; 2 - always show */
pref("extensions.smartTemplate4.font.size", 9); /* 8pt .templateBox font size */
pref("extensions.smartTemplate4.parseSignature", false);
pref("extensions.smartTemplate4.insertSigDashes.plaintext", false);
pref("extensions.smartTemplate4.insertSigDashes.html", false);
pref("extensions.smartTemplate4.firstLastSwap", true);
pref("extensions.smartTemplate4.defaultCharset", "ISO-8859-1");
pref("extensions.smartTemplate4.signature.charset", "UTF-8");
/* this is a convenience function - if I change from after or during composing, delete sig */
pref("extensions.smartTemplate4.removeSigOnIdChangeAfterEdits", false);

pref("extensions.smartTemplate4.stationery.supported", false); /* experimental */
pref("extensions.smartTemplate4.stationery.test.disableST4notification", false); /* notifications when Stationery events happen */

/* debug settings */
pref("extensions.smartTemplate4.debug", false);
pref("extensions.smartTemplate4.debug.events", false);
pref("extensions.smartTemplate4.debug.functions", false);
pref("extensions.smartTemplate4.debug.functions.delReplyHeader", false);
pref("extensions.smartTemplate4.debug.functions.delForwardHeader", false);
pref("extensions.smartTemplate4.debug.functions.insertTemplate", false);
pref("extensions.smartTemplate4.debug.functions.extractSignature", false);
pref("extensions.smartTemplate4.debug.functions.getProcessedTemplate", false);
pref("extensions.smartTemplate4.debug.replaceReservedWords", false);
pref("extensions.smartTemplate4.debug.deleteNodes", false);
pref("extensions.smartTemplate4.debug.settings", false);
pref("extensions.smartTemplate4.debug.regularize", false);
pref("extensions.smartTemplate4.debug.mime", false);
pref("extensions.smartTemplate4.debug.firstRun", false);
pref("extensions.smartTemplate4.debug.test.update", false);
pref("extensions.smartTemplate4.debug.identities", false);
pref("extensions.smartTemplate4.debug.css.styleSheets", false);
pref("extensions.smartTemplate4.debug.css.detailed", false);
pref("extensions.smartTemplate4.debug.css.AddRule", false);
