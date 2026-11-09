The external editor launcher now uses `nsIProcess.runw()` instead of `run()`. This passes the template path as UTF-16, preserving Cyrillic and other Unicode characters that could be corrupted by the previous narrow-string argument conversion.

Please check whether **Edit** now opens your template correctly from its original Cyrillic folder path.
