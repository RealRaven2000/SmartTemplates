To do: add a readme or wiki, just dumping some notes here:

SmartTemplates Template Flow (Simplified)

User Action: Reply / ReplyAll / ReplyToList / Forward / New
│
├─> Menu Click: "Reply with Template" / "Insert Template"
│    armedEntry set via fileTemplateInstance.armEntry()
│    ├─ numSelected for multi-message support
│    └─ timeStamp for deferred processing
│
├─> MRU Key Determination (gMsgCompose.type → Ci.nsIMsgCompType)
│    ├─ New / NewsPost / MailToUrl → "new"
│    ├─ Reply → "rsp"
│    ├─ ReplyAll → "rsp.all"
│    ├─ ReplyToList → "rsp.list"
│    ├─ ReplyToSender / ReplyToGroup / ReplyToSenderAndGroup → "rsp"
│    ├─ ForwardAsAttachment / ForwardInline → "fwd"
│    └─ Draft / EditAsNew / EditTemplate → skipped
│
├─> insertTemplate()
│    ├─ Compose case mapping (setComposeCase):
│    │    composeCase / st4composeType set based on gMsgCompose.type
│    ├─ Template Activation Check
│    │    isActiveOnAccount = pref.isTemplateActive(idKey, st4composeType)
│    │    Drafts skipped at startup
│    ├─ Template Loading:
│    │    ├─ File Template → fileTemplateSource
│    │    ├─ Thunderbird Template → editor.innerHTML
│    │    └─ Regular Template → pref.getTemplate(idKey, st4composeType)
│    ├─ Signature Extraction:
│    │    extractSignature(theIdentity, sigType, st4composeType)
│    ├─ Quote/Header Handling:
│    │    ├─ Reply: delReplyHeader() depending on flags
│    │    └─ Forward: delForwardHeader() depending on flags
│    └─ Template Processing: getProcessedText()
│
└─> Post-Insert MRU Update
     ├─ normalizeForMRU(entry) → strip unnecessary props
     ├─ storePreviousTemplate(composeType, entry)
     │    ├─ JSON.stringify(lastTemplate) → save to prefs
     │    └─ Notify background for menu update (if requested)
     └─ armedEntry.messageCount decremented if >1 (multi-message)
