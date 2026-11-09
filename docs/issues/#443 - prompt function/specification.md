# #443 — Prompt function

Status: Proposed

## Purpose

Allow templates and Smart Fragments to request text when inserted. Authors can supply an initial value and a fixed list of choices, and optionally send the answer to the clipboard for reuse through `%clipboard%`.

## Syntax

```text
%prompt(<explanation>[,<default>[,<choices>]][,toclipboard])%
```

- `explanation`: required quoted string displayed above the input.
- `default`: optional quoted string used as the initial value, or the unquoted keyword `clipboard` to read the current clipboard contents as plain text. Defaults to empty. The quoted string `"clipboard"` is literal text.
- `choices`: optional quoted string containing choices separated by commas. When present and nonempty, show all choices as an expanded radio-button list; otherwise show a free-text field. Choice mode accepts only values from the list. Parse the quoted argument before splitting its choices, so these commas do not separate function arguments.
- `toclipboard`: optional unquoted final modifier. Copy the confirmed answer as plain text and insert nothing at the variable position. Without it, insert the answer there.

Use `""` for the default to provide choices without an initial selection. Select the first option that matches the default case-insensitively. If there is no match, ignore the default and leave all options unselected; do not automatically select the first item. Return the selected option exactly as spelled in the choices list.

Within quoted arguments, support `\"` for a quotation mark and `\\` for a backslash. In choices, `\,` represents a literal comma within one suggestion; unescaped commas separate suggestions. Commas in the explanation and default are literal content. Parentheses, pipes, percent signs, and Unicode inside quoted strings are literal content. Reject empty choice entries; omit the list or use `""` for a plain text field. Recognize `toclipboard` only as an unquoted final argument; a quoted value is ordinary text.

## Examples

```text
%prompt("Enter the tea variety")%
%prompt("Enter the tea variety","Darjeeling")%
%prompt("Enter the tea variety",clipboard)%
%prompt("Choose the tea variety","Darjeeling","Darjeeling,Ceylon,Assam")%
%prompt("Choose the tea variety",clipboard,"Darjeeling,Ceylon,Assam",toclipboard)%
%prompt("Choose the tea variety","","Darjeeling,Ceylon,Assam",toclipboard)%
```

To reuse the selected tea variety throughout a fragment, put the clipboard prompt before the text:

```html
%prompt("Enter the tea variety",clipboard,"Darjeeling,Ceylon,Assam",toclipboard)%
<p>Thank you for ordering %clipboard% tea.</p>
<p>We will let you know when your %clipboard% order is ready.</p>
```

## Interaction and processing

- Offer OK, Cancel, and a top-right × cancel button beside the SmartTemplates icon. In free-text mode, select the initial text for easy replacement and disable OK for an empty answer. In choice mode, disable OK until a radio option is selected. Preserve confirmed text without automatic trimming.
- Cancel, Escape, or closing the dialog aborts the current insertion. Leave the existing message and clipboard unchanged, including when a later prompt is cancelled.
- Cancellation returns `null` internally, distinct from a successful text answer. It must not substitute a blank string and continue inserting the template. The × button uses the same cancellation path as Cancel and Escape.
- Process prompts once per insertion, in source order. Ask again on a new insertion; do not persist answers. Internal parsing passes must not reopen dialogs.
- A confirmed clipboard answer must be available to subsequent `%clipboard%` references in the same insertion. Keep intermediate clipboard values local until all prompts are confirmed; if several prompts write to the clipboard, the last value becomes the system clipboard value.
- Resolve a `clipboard` default when its prompt is reached, using the clipboard value in effect at that source position, including any earlier confirmed `toclipboard` prompt. An empty clipboard supplies an empty initial value; a clipboard read failure reports an error and aborts insertion without changing the message or clipboard. Combining `clipboard` and `toclipboard` lets the user edit the clipboard contents before reusing them.
- Treat answers as literal text, never as executable SmartTemplates variables or HTML. Escape inserted answers for their HTML context; preserve plain text for clipboard output.
- Validate prompt syntax before showing dialogs or changing the message or clipboard. Report malformed arguments instead of silently producing incomplete content.
- Prompting is a Pro feature. Apply the existing general trial and per-feature evaluation allowance (12 active days after the trial; at most one use charged per local calendar day). Standard licenses do not cover prompting. Apply the existing clipboard read entitlement rules to a `clipboard` default and the existing clipboard write entitlement rules to `toclipboard`.

## Acceptance checks

- Free-text input works with and without an initial value. Choices appear as an expanded radio-button list; matching defaults select case-insensitively, unmatched defaults are ignored, and confirmation returns the selected list spelling. Custom values are available only when no choices are supplied.
- An unquoted `clipboard` default pre-fills the input from the clipboard; quoted `"clipboard"` remains literal text. Verify empty clipboard contents, read failures, and combining this default with choices and `toclipboard`.
- The example fragment asks once and substitutes the chosen tea variety into every following `%clipboard%` reference, with no prompt token left in the message.
- Cancellation, including cancellation of a later prompt, preserves the original message and system clipboard.
- Multiple prompts execute in order without duplicate dialogs; clipboard references resolve against the value in effect at their source position.
- Commas inside the choices argument separate suggestions without splitting function arguments; escaped commas remain within one suggestion. Commas in other quoted arguments, escaped quotes, backslashes, pipes, Unicode, HTML characters, and text such as `%from%` remain literal data.
- Malformed arguments are reported before insertion; both HTML and plain-text composition are supported.
