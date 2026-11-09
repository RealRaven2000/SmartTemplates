# Repository working agreements

## JavaScript control flow

- Always use braces around `if`, `else if`, and `else` bodies, including single-line bodies and early returns. Do not add unbraced control-flow bodies.
- Follow the same rule for loops; ESLint enforces `curly: ["error", "all"]`.
- Apply this to new and modified code without reformatting unrelated existing code.
