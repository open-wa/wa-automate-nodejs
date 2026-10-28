---
"@open-wa/client": patch
"@open-wa/schema": patch
"@open-wa/api": patch
"@open-wa/plugin-sdk": patch
"@open-wa/integration-voxtral": patch
---

Validate and normalize booking timestamps with a shared branded Effect codec so Android displays the appointment date and time alongside its location. Preserve Effect decoding, encoding and schema metadata in the serving projection, and describe request inputs separately from normalized outputs in the API reference. Reject invalid dates and ranges that collapse at whole-second precision before sending.
