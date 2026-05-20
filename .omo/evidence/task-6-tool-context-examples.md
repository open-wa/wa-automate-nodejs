# Task 6 ToolContext examples

Result: pass.

Plugin AI examples capture `client` from `init({ client })`, use `context.logger`, `context.sessionId`, and `context.abort`, and do not rely on a non-existent `context.client`.
