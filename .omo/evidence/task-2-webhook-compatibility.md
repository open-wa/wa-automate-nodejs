# Task 2 webhook compatibility

Result: pass.

No source-backed second envelope was found in the v5 webhook plugin. The docs therefore standardize on the current v5 `payload` envelope and warn against mixing older `data` examples.
