# Type Alias: DataURL

> **DataURL**: `Brand`\<\`data:$\{string\};base64,$\{Base64\}\`, `"DataURL"`\>

Data URLs, URLs prefixed with the data: scheme, allow content creators to embed small files inline in documents. They were formerly known as "data URIs" until that name was retired by the WHATWG.

Data URLs are composed of four parts: a prefix (data:), a MIME type indicating the type of data, an optional base64 token if non-textual, and the data itself:

Example:
`"data:[<mediatype>][;base64],<data>"`

Learn more here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
