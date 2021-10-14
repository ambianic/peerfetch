
# peerfetch

Peer-to-peer HTTP over WebRTC. Implements an http client wrapper (similar to [HTML fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)) over WebRTC DataChannel. Allows direct secure access from a web browser to a private web server behind a firewall. 

Highlights:
- Executes in a safe application space (no `sudo`)
- End to end encryption
- No custom VPN setup needed
- No cloud middleman for data tunneling
- No dynamic DNS service required
- No custom firewall rules required
- Programming language agnostic. (Currently available in JavaScript and Python)

# Hello World example

See this [README](examples/helloworld/README.md) for a step by step Hello World example.

# How it works

For an in-depth technical discussion and project background, see [this blog post](https://webrtchacks.com/private-home-surveillance-with-the-webrtc-datachannel/).

# Use cases:

- Direct user access from a web app to private home security camera without sharing footage with a cloud provider.
- IoT device mesh with direct p2p communication. 
- Personal web apps can share data directly (files, notes, photos) only with the end user without exposing a public IP address.
- Federated learning - ML models can train on local user data and share learned states directly with each other without a centralized model aggregation server.

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
