# Enumeration: PREPROCESSORS

A set of easy to use, built-in message processors.

[Check out the processor code here](https://github.com/open-wa/wa-automate-nodejs/blob/master/src/structures/preProcessors.ts)

## Enumeration Members

### AUTO\_DECRYPT

> **AUTO\_DECRYPT**: `"AUTO_DECRYPT"`

Replaces the media thumbnail base64 in `body` with the actual file's DataURL.

***

### AUTO\_DECRYPT\_SAVE

> **AUTO\_DECRYPT\_SAVE**: `"AUTO_DECRYPT_SAVE"`

Automatically saves the file in a folder named `/media` relative to the process working directory.

PLEASE NOTE, YOU WILL NEED TO MANUALLY CLEAR THIS FOLDER!!!

***

### BODY\_ONLY

> **BODY\_ONLY**: `"BODY_ONLY"`

A preprocessor that limits the amount of base64 data is present in the message object by removing duplication of `body` in `content` by replacing `content` with `""`.

***

### SCRUB

> **SCRUB**: `"SCRUB"`

This preprocessor scrubs `body` and `content` from media messages.
This would be useful if you want to reduce the message object size because neither of these values represent the actual file, only the thumbnail.

***

### UPLOAD\_CLOUD

> **UPLOAD\_CLOUD**: `"UPLOAD_CLOUD"`

Uploads file to a cloud storage provider (GCP/AWS for now).

If this preprocessor is set then you have to also set [`cloudUploadOptions`](https://docs.openwa.dev/docs/reference/api/model/config/interfaces/ConfigObject#clouduploadoptions) in the config.
