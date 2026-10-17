Improve variable help organization, readability and localization
=============================================================

Tracking issue: #435.

The Variables help window has accumulated unclear category names, mixed content, oversized labels, and broken icon paths. This update reorganizes the help and makes it easier to browse, while preserving the existing variable syntax and behavior.

### Content and organization

- Replace **Fixed variables** with **General**, grouped into **Your identity**, **Commonly used message headers**, **Signatures**, **Files, images and attachments**, and **Composer settings**.
- Explain that an account can have multiple sender identities, how the composer's From field selects one, and how the initial selection works when replying.
- Clarify that `%sig%` overrides signature placement.
- Combine the short “longstring” and “shortstring” chapters into **Date and time examples**, with custom and localized format examples.
- Apply similar content organization to the website, preserving its additional documentation and existing anchors.

### Navigation and presentation

- Add collapsible h3 subsections linked to their content through `aria-controls`.
- Clicking a subsection heading toggles its content; Enter and Space also activate the focused heading.
- Expanding or collapsing a parent h1 also sets its subsections to the same state. Expand All and Collapse All include subsections.
- Keep h3 subsection controls visible when their parent is collapsed, allowing a subsection to be opened independently. Hide h4 labels with their content.
- Add filled triangle indicators to main and subsection headings, and improve vertical alignment and spacing.
- Replace heavy Parameters, Layout presets, and Examples boxes with compact labels.
- Keep the usage table compact on wide windows.

### Assets and localization

- Correct missing search, settings, table-header, and checkmark/cross icon paths, plus the theme stylesheet import.
- Improve the Default format button's normal text and icon contrast.
- Support opt-in `**bold**` and `*italic*` formatting for localized help text, creating DOM elements without parsing HTML. This is a limited subset, without nested formatting.
- Translate the new and revised help entities across all 23 locales, preserving unrelated translations.

### Validation

Source checks cover locale JSON, required entries, duplicate keys, formatting markers, local asset paths, chapter structure, and subsection targets. Focused checks also cover subsection toggling and parent state synchronization.

Remaining UI checks:

- [ ] Verify subsection clicks, keyboard activation, parent toggles, and Expand/Collapse All in Thunderbird.
- [ ] Verify search reveals matches inside collapsed subsections.
- [ ] Review headings, parameter labels, icons, and table spacing in light and dark themes and at narrow and wide window sizes.
- [ ] Review localized layouts, including long labels and non-Latin scripts.
- [ ] Build the website and review the updated content and existing anchor links.
