---
id: "api_model_errors.AddParticipantErrorStatusCode"
title: "Enumeration: AddParticipantErrorStatusCode"
sidebar_label: "AddParticipantErrorStatusCode"
custom_edit_url: null
---

[api/model/errors](/api/modules/api_model_errors.md).AddParticipantErrorStatusCode

Add Participants Status Code Enum

## Enumeration Members

### ALREADY\_IN\_GROUP

• **ALREADY\_IN\_GROUP** = ``409``

Participant could not be added to group because they are already in the group

___

### GROUP\_FULL

• **GROUP\_FULL** = ``500``

Participant could not be added to group because the group is full

___

### PRIVACY\_SETTINGS

• **PRIVACY\_SETTINGS** = ``403``

Participant could not be added to group because their privacy settings do not allow you to add them.

___

### RECENTLY\_LEFT

• **RECENTLY\_LEFT** = ``408``

Participant could not be added to group because they recently left.
