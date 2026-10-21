# Expand deleteQuotedTags() and replaceQuotedTags() scopes

## Problem

`deleteQuotedTags()` and `replaceQuotedTags()` currently search only within the message editor's body. Their numeric quote-level parameter can include unquoted body content, but cannot reach elements in the document head.

This limits cleanup snippets such as removing unwanted `<style>` blocks from a message: styles in the head remain active even after matching blocks in the body have been removed. This requirement arose while curating downloadable example snippets for #432.

## Proposed syntax

Allow the existing quote-level parameter to accept the unquoted literals `head`, `body`, and `all`, in addition to numeric values.

```text
%deleteQuotedTags("style",head)%
%deleteQuotedTags("style",body)%
%deleteQuotedTags("style",all)%

%replaceQuotedTags("style","<style>body { color: black; }</style>",head)%
%replaceQuotedTags("img","<span>Image removed</span>",body)%
%replaceQuotedTags("style","<style>body { color: black; }</style>",all)%
```

The replacement examples illustrate scope selection; replacements must still be valid for their destination. For removing style blocks, prefer `deleteQuotedTags()` rather than inserting placeholder elements into the head.

| Scope / quote-level value | Behavior |
| --- | --- |
| Omitted | Preserve the current default: quote level 1 and deeper within the body. |
| Nonnegative integer | Preserve existing minimum quote-level behavior and inline-forward handling. |
| `head` | Search only the message editor document's head. |
| `body` | Search the entire message body, including unquoted content and content outside an inline-forward container. |
| `all` | Search both head and body of the message editor document. |
| `-1` | Numeric alias for `all`. |

Explicit scope literals do not apply a quote-depth filter. Existing optional minimum-size parameters retain their positions and meaning:

```text
%deleteQuotedTags(selector[,quoteLevelOrScope][,minSize])%
%replaceQuotedTags(selector,replacementHTML[,quoteLevelOrScope][,minSize])%
```

## Compatibility

- Keep both existing command names. Their default behavior remains quote-oriented, while the new scopes are explicit opt-ins.
- Do not change the omitted default from 1 to 0.
- Preserve numeric `0` behavior, including its existing restriction to the forward container for inline forwards. Explicit `body` deliberately searches the entire body instead.
- Currently, `-1` already includes all quote levels in the body and bypasses the numeric-0 forward-container restriction. Giving it document scope extends that behavior to the head.
- Reject unknown scope literals and unsupported negative values with a clear diagnostic and no changes for the affected command. Do not let failed numeric parsing silently broaden the search.

## Intended cleanup example

```text
%deleteQuotedTags("style",all)%
```

Remove matching `<style>` elements throughout the message. Inline `style="…"` attributes remain unchanged. This is element cleanup, not a general reset of all formatting.

## Implementation considerations

- Scope applies exclusively to the compose editor's message document, never the surrounding Thunderbird window.
- Check whether head styles include editor-owned elements that require protection before finalizing document-wide deletion behavior.
- Both commands should interpret scopes consistently and preserve their existing selector and minimum-size behavior.
- Replacement parsing and insertion must support the selected destination, including valid head elements. Avoid changing the selected scope during insertion.
- Handle missing head/body elements without throwing.
- Update command help and examples with the new literals, the `-1` alias, and the distinction between explicit `body` and numeric `0` for inline forwards.

## Acceptance checks

- Verify `head`, `body`, and `all` against a message containing matching elements in the head, unquoted body, first-level quote, and nested quote.
- Verify deletion and replacement independently, including replacement of a head style block with another style block.
- Verify omitted scope, numeric `0`, and positive quote levels retain existing behavior in replies and inline forwards.
- Verify `-1` is equivalent to `all`.
- Verify minimum-size filtering still works with numeric levels and literal scopes.
- Verify invalid scope values leave the affected command's targets unchanged and report a diagnostic.
- Verify the style cleanup example leaves inline formatting intact and does not affect Thunderbird UI elements.

## Separate existing issue

The current replacement helper expects an element and does not support a comment-only replacement such as `"<!--style block removed-->"`. That can fail before removing the matched element. Track or address this separately from scope expansion; the cleanup example can use deletion directly.

## Implementation and validation

Implemented for #436 in `chrome/content/smartTemplate-overlay.js`. The scope resolver is local to the existing parser function; no global bindings were added. Other replacement commands retain their existing parameter parsing.

Run from the repository root:

```text
node "docs/issues/#436 replace quote tags scope/check-scopes.cjs"
node --check chrome/content/smartTemplate-overlay.js
```

The automated checks execute the production parameter parser, scope resolver, and deletion/replacement loops against a mock editor DOM. They cover literal scopes, numeric levels, inline forwards, invalid inputs, minimum sizes, and a missing head. They do not validate Thunderbird's HTML parsing or sanitizer behavior.

Thunderbird verification remains pending: test head/body style cleanup and head style replacement, confirm inline formatting remains intact, and compare numeric `0` with explicit `body` in an inline forward. Review any editor-owned head styles during that test. Command help and release-note updates can follow during release preparation.
