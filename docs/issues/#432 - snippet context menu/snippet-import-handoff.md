# Issue #432: Support-site snippet import — discussion handoff

Date: 2026-10-20

Intended repository folder:
`E:\Dev\Mozilla\Dev\SmartTemplate\_Github\branches\ESR140\docs\issues\#432 - snippet context menu`

## Instructions for the receiving Codex session

Continue requirements and UI discussion before implementing. The user explicitly requested: “don't code anything yet just discuss the requirements and ui.” This handoff does not authorize implementation.

Inspect the repository and applicable AGENTS.md instructions to ground further recommendations in the existing SmartTemplates implementation. No source checkout was available in the originating chat, so no implementation details below have been verified against code. No code was changed or tests run.

## Background

SmartTemplates recently gained a feature that lets users add selected items from the Snippets button menu to the composer context menu. The next goal is to expose examples hosted on the SmartTemplates support site so users can import them locally and optionally make them available through that existing menu feature.

The user clarified that remote HTML files should be **stored locally**, together with a prompt. The precise meaning and existing representation of that prompt still need confirmation; do not assume it necessarily means AI instructions or text inserted into the composer. Earlier assistant suggestions made that interpretation, but it has not been verified against the add-on.

The user's description of the intended workflow:

> “yes I imagine some assistant workflow with a starting point import Snippets and then it should read from a list that is hosted on the SmartTemplates support site in a json or other file that lists a title, description and path of the html. the ST addon should be able to list the titles and then show description on a selected item without the requiring the user to open a browser. don't code anything yet just discuss the requirements and ui”

Here, “assistant workflow” can mean a guided import wizard/dialog; it does not establish a requirement for an AI service.

## Confirmed requirements

1. Provide an **Import Snippets** starting point within SmartTemplates.
2. Fetch a catalog hosted on the SmartTemplates support site. JSON is an acceptable candidate; the format has not been finalized.
3. Catalog entries include at least a title, description, and path to an HTML file.
4. Display available titles inside the add-on.
5. Selecting an entry displays its description inside the add-on, without requiring the browser.
6. Import the remote HTML and store it locally, associated with a prompt.
7. Integrate with the existing snippets and composer context menu capability.
8. Remain in requirements/UI discussion for now.

## Proposed UI — not yet approved

A single dialog with an available-snippets list on the left and selected-item details on the right was suggested:

```text
Import Snippets

Search examples…                     [Refresh]

Available snippets        Selected example
────────────────────      ─────────────────────────────
Example one               Example one
Example two
Example three             Description of this example
                          and when to use it.

                          [Optional HTML preview]

                          ☐ Add to composer context menu

                                      [Import] [Close]
```

Proposed interaction:

- Opening the dialog loads the catalog and lists titles.
- Selecting a title immediately displays the catalog description; it need not download the HTML yet.
- Import downloads the selected HTML and stores it locally with the associated prompt.
- An optional checkbox adds the imported snippet to the composer context menu through the existing mechanism.
- Keep the dialog open after import so users can import another item, and mark imported entries.
- Start with single-item selection; bulk import can be considered later.

Search, Refresh, the preview, the checkbox default, and whether the dialog stays open are proposals, not confirmed decisions. A separate preview may be unnecessary if descriptions are sufficient. No decision has been made between a one-page dialog and a multi-step wizard.

## Proposed catalog design — not yet approved

Keep the hosted catalog separate from downloadable HTML. A structured catalog avoids scraping support pages and allows browsing descriptions before downloading files.

| Field | Status | Purpose |
| --- | --- | --- |
| title | Required by user | Display name in the catalog |
| description | Required by user | Explanation shown on selection |
| html path | Required by user | Location of downloadable HTML |
| stable ID | Suggested | Recognize an example across renames and repeat imports |
| prompt | Placement unresolved | Store the associated prompt, if it is not already embedded in HTML or supplied during import |
| revision | Suggested | Detect a changed hosted example |
| category / keywords | Optional future enhancement | Filtering and search as the collection grows |

Additional suggestions: a catalog format version and HTML paths resolved relative to the catalog URL. Neither is finalized. The actual support-site catalog URL is not supplied yet.

## Proposed local behavior — not yet approved

- Imported snippets remain available offline and can be edited locally.
- Use the existing snippet storage and menu registration mechanisms where possible.
- Do not silently overwrite a locally edited snippet on repeat import.
- A repeated stable ID could offer “Import another copy” or “Update existing.”
- An explicit refresh/update action could retrieve newer content, rather than making imported snippets depend on the site at use time.
- Present catalog loading, empty-list, and download-error states in the dialog, with retry.
- Show descriptions as plain text. If a rendered HTML preview is included, disable script execution and remote resource loading in that preview. This preview suggestion is separate from how SmartTemplates normally processes an imported snippet.

## Questions to resolve next

1. **Prompt semantics:** What does “with a prompt” mean in the current add-on? Is it embedded in snippet HTML, stored as separate metadata, entered by the user during import, or another existing feature? Clarify before designing a new prompt field or composer behavior.
2. **Entry point:** Where should Import Snippets appear: the Snippets button menu, snippet management/settings UI, or both?
3. **Dialog or wizard:** Is selecting a title, reading its description, and clicking Import enough, or is a second step needed for local name, location, prompt, or menu options?
4. **Local destination:** Does the existing snippet system require a user-selected directory/file path, or is there a managed snippet folder? What filename should be suggested?
5. **Menu integration:** Should context-menu inclusion be optional at import, and should its checkbox be checked by default? How is the menu label determined?
6. **Catalog content:** Are titles/descriptions plain text? Are localization, categories, or minimum add-on version fields needed initially?
7. **HTML dependencies:** Must examples be self-contained, or can they depend on images, stylesheets, or other files? Storing one HTML file does not automatically make external assets available offline.
8. **Duplicates and updates:** What should happen when the same example is imported again or its destination filename already exists? Is catalog revision tracking in scope for the first version?
9. **Preview:** Does the description suffice, or should users inspect the HTML source/rendered example before importing?
10. **Network behavior:** When is the catalog fetched, is a previous catalog cached, and what should users see when the support site cannot be reached?

Do not treat every question as a required first-version feature. Favor the smallest workflow that meets the confirmed requirements and fits existing add-on patterns.

## Suggested next action in VS Code Codex

Read this document and inspect the existing snippet management, local HTML loading, and composer context menu code. Report the existing integration points and propose a concrete UI flow grounded in those findings. Explain which decisions can reuse current behavior and which still need user input. Do not implement until the user asks.
