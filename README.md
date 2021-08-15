# peerfetch
HTML fetch() over WebRTC datachannel. Access directly IoT REST APIs from browser apps without cloud data tunneling.

# Modules

- `peerfetch-client`: Browser client library in JavaScript
- `peerfetch-proxy`: WebRTC to REST API proxy deployed on IoT devices. Distributed as a python package and a docker image. Allows remote web browser apps to securely access device local REST APIs.
- `pnp-signaling-server`: Plug-and-play signaling server with minimal emphimeral state. Allows browser clients to find IoT devices in order to establish direct data connection. No persisted storage. Clients regularly re-register and update state. In case of a server crash, state is restored within seconds of restart. A Node.js package.

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
