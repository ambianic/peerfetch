# peerfetch
[HTML 5 fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) over WebRTC datachannel. Access directly IoT REST APIs from browser apps without cloud data tunneling. See [this blog post](https://webrtchacks.com/private-home-surveillance-with-the-webrtc-datachannel/) for a technical discussion and examples.

:warning: :construction: **WORK IN PROGRESS** :construction: :warning: 

This library has been used as [integral part of the `ambianic-ui`](https://github.com/ambianic/ambianic-ui/blob/master/src/remote/peer-fetch.js) project for several years. It has reached a reasonable state of stability that we consider ready for a standalone package. We are in the process of extracting it to this repo as a standalong library.

# Related Repos

- `peerfetch`: Browser client library in JavaScript. Allows browser apps to directly access IoT device REST APIs. For example accessing your home smart camera directly from your desktop or mobile phone without any footage going through cloud servers.
- `peerfetch-proxy`: WebRTC to REST API proxy deployed on IoT devices. Distributed as a python package and a docker image. Allows remote web browser apps to securely access device local REST APIs. Builds on top of the [`peerjs-python`](https://github.com/ambianic/peerjs-python) package.
- [`ambianic-pnp`](https://github.com/ambianic/ambianic-pnp): Plug-and-play signaling server with minimal emphimeral state. Allows browser clients to find IoT devices in order to establish direct data connection. No persisted storage. Clients regularly re-register and update state. In case of a server crash, state is restored within seconds of restart. A Node.js package.

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
