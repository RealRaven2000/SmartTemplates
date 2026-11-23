## Prompt cancellation behavior

Canceling a `%prompt()` no longer throws an exception or interrupts the template parser. The canceled prompt resolves to an empty string, and the rest of the template continues to be processed.

When a prompt offered choices, Cancel also adds a notice to the compose warning bubble. The notice identifies the prompt and gives the number of choices, without listing them. For example:

> Prompt “Choose the tea variety” was cancelled; no choice was selected (3 offered).

Prompts without choices still allow free-text answers. Accepting an empty answer also inserts an empty string.

For `%prompt(...,toclipboard)%`, Cancel stages an empty string as the clipboard value. Later `%clipboard%` tokens in the same template use that empty value, and the clipboard is updated to empty when the prompt plan is committed. This prevents old clipboard contents from appearing in the message after Cancel.

The attached test build and screenshot demonstrate cancellation of a three-choice prompt: the prompt replacement is empty, the surrounding template remains intact, and the warning explains which prompt was cancelled and how many choices were offered.
