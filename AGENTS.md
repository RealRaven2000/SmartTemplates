# Repository working agreements

## Template insertion and test fixtures

- SmartTemplates injects template content into the Composer document's existing body. Thunderbird strips template `<body>` tags; do not assume a template replaces the entire document.
- When the corresponding option is enabled, SmartTemplates attempts to insert template `<head>` content and `<style>` sections into the Composer document's existing `<head>`.
- Write template test fixtures as content fragments without doctype or `<body>` wrappers, unless explicitly testing how those wrappers are handled.

## JavaScript control flow

- Always use braces around `if`, `else if`, and `else` bodies, including single-line bodies and early returns. Do not add unbraced control-flow bodies.
- Follow the same rule for loops; ESLint enforces `curly: ["error", "all"]`.
- Apply this to new and modified code without reformatting unrelated existing code.
