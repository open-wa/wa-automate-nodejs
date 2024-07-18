---
title: Socket mode
sidebar_position: 4
description:
  Guide showing how to develop your own solutions without needing to wait for session restarts.
---

# Socket mode

Now that you've checked out the EASY API and how to implement wa-automate with your own custom code I'm sure you're wondering if there was a best of both worlds? Yes there is! "Socket mode" allows you to seperate your session from your code and unlocks a number of benefits:

- Your session and your code can be running on different servers
- Rapid development - you no longer have to wait for a session to restart when restarting your custom code
- 1-many - connect multiple socket clients to one session.

How to:

## Step 1 - Start the EASY API in socket mode

