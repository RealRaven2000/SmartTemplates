> The problem seems to have been resolved, but it isn't listed in the 4.21 release notes. Did the problem resolve itself?

That is interesting. One possible explanation is a change made while investigating the intermittent context-menu problems in #432.

Previously, when inserting sanitized template HTML, we appended the cleaned nodes from a temporary parsed document directly:

`frag.appendChild(sanitized);`

Now we explicitly import a deep copy into the destination compose document:

`frag.appendChild(ownerDoc.importNode(sanitized, true));`

The same change applies to elements inserted into `<head>`. This creates copies in the compose document rather than adopting the original nodes from the privileged DOMParser document.

During the #432 investigation, we recorded context-menu events on some inserted elements failing to reach Thunderbird’s actor handoff. This change could also explain the improvement you’re seeing with LanguageTool, but I haven’t confirmed that connection with a controlled comparison. For now, I would treat this as a possible incidental fix rather than list #424 as a confirmed fix in the release notes.
