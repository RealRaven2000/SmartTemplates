# Release planning

The localized `whats-new-list` is a short popup: always keep entries to summary information. Use brief Enhancements and Bug Fixes sections; leave detailed explanations and examples for `version.html`. Use the approved release-planning draft when available.

All localized text must remain native UTF-8 without BOM throughout editing and generation. Never pass translations through a shell pipe with an unspecified encoding. Use UTF-8 files directly and verify the saved messages against the source text, including non-ASCII characters; valid JSON alone does not prove the text survived correctly.
