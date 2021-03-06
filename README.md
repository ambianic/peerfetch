
# peerfetch

Peer-to-peer HTTP over WebRTC. Implements an http client wrapper (similar to [HTML fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)) and a corresponding server side HTTP proxy over WebRTC DataChannel. Allows direct secure access from a web browser to edge devices (IoT or servers) hidden behind a firewall. 

Highlights:
- Excutes in safe application space (no `sudo`)
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

# Hands-on Workshop

[Here is the recording](https://www.youtube.com/watch?v=LFKYtL1_RjQ) of a `peerfetch` workshop hosted by [Python Austin](https://github.com/Jacob-Barhak/EveningOfPythonCoding).

# Use cases:

- Direct user access from a web app to private home security camera without sharing footage with a cloud provider.
- IoT device mesh with direct p2p communication. 
- Personal web apps can share data directly (files, notes, photos) only with the end user without exposing a public IP address.
- Federated learning - ML models can train on local user data and share learned states directly with each other without a centralized model aggregation server.

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
