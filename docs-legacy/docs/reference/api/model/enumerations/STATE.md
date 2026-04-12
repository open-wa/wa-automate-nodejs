# Enumeration: STATE

The state of the WA Web session. You can listen to session state changes using [[onStateChanged]]. Just to be clear, some of these states aren't understood completely.

## Enumeration Members

### CONFLICT

> **CONFLICT**: `"CONFLICT"`

Another WA web session has been opened for this account somewhere else.

***

### CONNECTED

> **CONNECTED**: `"CONNECTED"`

The session is successfully connected and ready to send and receive messages.

***

### DEPRECATED\_VERSION

> **DEPRECATED\_VERSION**: `"DEPRECATED_VERSION"`

WA web updates every fortnight (or so). This state would be emitted then.

***

### DISCONNECTED

> **DISCONNECTED**: `"DISCONNECTED"`

This is fired when the connection between web and the host account primary device is disconnected. This is fired frequently to save battery.

***

### OPENING

> **OPENING**: `"OPENING"`

This probably shows up when reloading an already authenticated session.

***

### PAIRING

> **PAIRING**: `"PAIRING"`

This probably shows up immediately after the QR code is scanned

***

### PROXYBLOCK

> **PROXYBLOCK**: `"PROXYBLOCK"`

This state probably represented a block on the proxy address your app is using.

***

### SMB\_TOS\_BLOCK

> **SMB\_TOS\_BLOCK**: `"SMB_TOS_BLOCK"`

This usually shows up when the session has been blocked by WA due to some issue with the browser/user agent. This is a different version of a Terms of Service Block from what we know. It may also show up when the host account is banned.

***

### SYNCING

> **SYNCING**: `"SYNCING"`

This is fired when the QR code is scanned

***

### TIMEOUT

> **TIMEOUT**: `"TIMEOUT"`

The trigger for this state is as of yet unknown

***

### TOS\_BLOCK

> **TOS\_BLOCK**: `"TOS_BLOCK"`

This usually shows up when the session has been blocked by WA due to some issue with the browser/user agent. It literally stands for Terms of Service Block. It may also show up when the host account is banned.

***

### UNLAUNCHED

> **UNLAUNCHED**: `"UNLAUNCHED"`

The same (probably replacement) for CONFLICT

***

### UNPAIRED

> **UNPAIRED**: `"UNPAIRED"`

When `UNPAIRED` the page is waiting for a QR Code scan. If your state becomes `UNPAIRED` then the session is most likely signed out by the host account.

***

### UNPAIRED\_IDLE

> **UNPAIRED\_IDLE**: `"UNPAIRED_IDLE"`

This state is fired when the QR code has not been scanned for a long time (about 1 minute). On the page it will show "Click to reload QR code"
