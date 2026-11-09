# #443 — Implementation and verification

The implementation uses a module-local parser and a standard composer content script, registered with `composeScripts.register()` like the license warnings. The UI lives in `html/prompt/compose.js` and `html/prompt/prompt.css`; its background controller lives in `scripts/prompt/controller.mjs` and is imported normally by the background page. An HTML dialog appears directly inside the originating composer. Prompts with choices show an expanded radio-button list; prompts without choices show a text field. A matching default selects the first case-insensitive match, while an unmatched default is ignored and requires an explicit selection. Confirmation returns the choice's original spelling. OK and Cancel reuse existing localized messages; the explanation comes from the template author. The top-right header contains the SmartTemplates icon and an accessible × cancel button.

The legacy parser awaits a `templatePrompt` request through the existing NotifyTools background listener. The background controller identifies the compose tab from its window ID and communicates with the compose script through standard runtime/tab messages. No prompt-specific experimental API or privileged controller import is required. The three popup-related Utilities methods and the separate popup page have been removed.

The renderer keeps its UI in a shadow root on a host outside the message body, following the license-warning pattern. Prompt text is assigned as text, not parsed as HTML. Before returning an answer it restores the editor focus and selection so insertion resumes at the original position. Cancel and Escape return null; closing the composer cancels the background request. Different composers have independent requests; overlapping prompts in the same composer are rejected. A readiness handshake handles compose startup before content-script injection, and request IDs reject stale answers or deliveries.

Prompt arguments are validated before opening dialogs. Answers and following plain `%clipboard%` references are protected through the template processing passes and restored as escaped text afterwards. Clipboard writes are staged until all prompts in the source have been confirmed. Main template and custom quote-header prompts are prepared together before removing the existing template. Signature prompts are resolved before signature removal.

Prompting is registered as a Pro feature with the existing general trial and a separate 12-active-day evaluation allowance. Valid Pro licenses do not consume the allowance; Standard licenses use the limited Pro evaluation. Repeated prompts on the same local calendar day consume only one use. Clipboard reads and writes retain their existing respective feature allowances. A blocked prompt aborts insertion before displaying a dialog or reading/writing the clipboard; the existing composer licensing notification explains its allowance or blocked status.

## Automated verification

The approved prototype header is shared with the live prompt: a left-aligned icon, centered localized caption, and the #441 SVG close icon centered in a button inset 1em from the top and right. The caption uses the content font size. OK appears before Cancel and uses the system accent color. Below 480px viewport width or 420px height, the prompt uses tighter vertical spacing and a 15px font instead of 16px. The dialog scrolls within the available height and action buttons can wrap. Both static prototypes use the same stylesheet, with the light version forcing the light color scheme.

Run from the repository root:

```powershell
node --test 'docs/issues/#443 - prompt function/test-prompt.mjs'
node --test 'docs/issues/#443 - prompt function/test-compose-prompts.mjs'
node --test 'docs/issues/#443 - prompt function/test-prompt-help.mjs'
```

Tests cover argument parsing, escaping, list choices, quoted keywords, malformed input, sequential clipboard values, cancellation, clipboard failures and feature blocking, custom answers, the compose text-processing entry point, composer routing, startup readiness, stale answers, content-script reinjection, UI isolation, and editor selection restoration. The DOM harness does not replace actual Thunderbird testing.

## Thunderbird verification still required

1. Copy `Ceylon` and insert `test-fragment.html` as a Smart Fragment. Check that Ceylon is initially shown, select Darjeeling, and confirm that both paragraphs use Darjeeling and the clipboard contains Darjeeling.
2. Copy `cEyLoN` and verify that Ceylon is selected case-insensitively. Copy unrelated text and verify all choices remain unselected and OK is disabled until a choice is selected. Verify the same behavior in HTML and plain-text composition.
3. Cancel with Cancel, ×, and Escape. Verify the selection, message contents, and clipboard remain unchanged. Cancellation returns null and aborts insertion; it does not insert an empty answer.
4. Test free text with `%prompt("Enter the tea variety")%`, and an explicit default with `%prompt("Enter the tea variety","Darjeeling")%`.
5. Test two clipboard prompts in one fragment; confirm the first and cancel the second. The clipboard and message must remain unchanged.
6. Test insertion at compose startup, replacing a template, a custom quote header, and a parsed signature. Verify keyboard navigation, radio choices, focus return, and dialog sizing on supported Thunderbird versions.
7. Close the originating composer while its prompt is open. Verify its request is cancelled. Open prompts in two composers and verify each answer reaches the correct message.

## Scope requiring further integration work

Prompt preparation operates on each directly processed source. Prompts discovered later inside nested `%file()%` content or sandbox-generated text are not preflighted with their containing source. Cancellation across those boundaries is not yet a complete insertion transaction. Mixed clipboard-writing variables other than `%prompt()%`, and flavored clipboard references such as `%clipboard(html)%`, still follow the legacy parser's clipboard handling; the staged source-order behavior currently covers prompt writes and plain `%clipboard%` references.

These cases need integration work before claiming transactional cancellation and clipboard ordering for every combination of template features.
