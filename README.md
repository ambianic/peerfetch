
:warning: :construction: **MIGRATING CODE TO THIS REPO IN PROGRESS** :construction: :warning: 

The `peerfetch` library has been used as integral part of [`ambianic-ui`](https://github.com/ambianic/ambianic-ui/blob/master/src/remote/peer-fetch.js) and [ambianic-edge](https://github.com/ambianic/peerjs-python/blob/master/src/peerjs/ext/http_proxy.py) since 2019. It has reached a reasonable state of stability that we consider ready for a standalone package. We are in the process of extracting and migrating its code to this repo with the intention of packaging and releasing it independently. You can watch this repo for release notifications.

# peerfetch

[HTML5 fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) implementation over WebRTC datachannel. Allows direct secure access from a web browser to edge devices (IoT or servers) hidden behind layers of firewalls. 

- Excuting in safe application space (not `sudo`)
- End to end encryption
- No custom VPN setup. 
- No cloud middleman for data tunneling. 
- No dynamic DNS services. 
- No firewall (re)configuration.

See [this blog post](https://webrtchacks.com/private-home-surveillance-with-the-webrtc-datachannel/) for a technical discussion and examples. Works in browser, NodeJS, Python, Go and other runtimes that support WebRTC.

From a web app's perspective, this is the code to access the REST API hosted on the remote edge device:

```
const response = await peerFetch.get(request)
```

There is a simple boilerplate connection setup procedure on web app load. It registers with a signaling server which helps locate the `peerfetch` proxy running on the remote edge device. From that point on all communication between web app and edge device are direct over IP with end to end encryption. [Here is an example](https://github.com/ambianic/ambianic-ui/blob/cc29e6f4e972d69b17c00b43077a81952be8208e/src/store/pnp.js#L268) how that works. A more detailed step by step guide is in the works.

Web view components use `peerfetch` to grab and render data as they would with a regular `fetch()` call. [Here is an example](https://github.com/ambianic/ambianic-ui/blob/cc29e6f4e972d69b17c00b43077a81952be8208e/src/views/Timeline.vue#L27) of a VueJS page that uses `peerfetch` to call the REST API on a remote edge device (smart cam) and then render a timeline of detection events from the JSON API response. It also pulls static images referenced in the JSON response from the remote edge device.

```vue
          <v-list-item
            ref="timeline-data"
            data-cy="timelinedata"
            v-for="(sample, index) in timeline"
            :key="index"
            class="pa-0 ma-0"
          >
            <v-list-item-content
              class="pa-0 ma-0"
            >
              <v-img
                v-if="sample.args.thumbnail_file_name"
                :src="imageURL[sample.args.id]"
                class="white--text align-start"
                alt="Detection Event"
                contain
                @load="setImageLoaded(index)"
                lazy-src="/img/lazy-load-bg.gif"
              >
...              

```

# Project background

It appears to be a foregone conclusion nowadays that all data should be stored in the cloud and all web services should be served by public cloud APIs. This works well for a great deal of applications, but not all. The cloud-in-the-middle approach leads sometimes to disturbing violations of user data privacy. Not to mention increased risks of cyber security attacks and recurring costs for cloud services.

There are widely publicised security and privacy breaches in [big tech cloud services](https://blog.storagecraft.com/7-infamous-cloud-security-breaches/), [consumer security cameras](https://www.safewise.com/blog/latest-home-security-breaches-and-responses/) and even [enterprise grade systems](https://www.bloomberg.com/news/articles/2021-03-09/hackers-expose-tesla-jails-in-breach-of-150-000-security-cams).

Fortunately peer-to-peer web standards (WebRTC in particular) have evolved sufficiently to solve a big chunk of these issues. It is no longer mandatory to use a cloud service in the middle of data transfer and data storage. It is not even necessary to setup clunky custom VPN services in order to secure end to end connectivity between end points.

WebRTC has been in the works since early 2000's and it finally reached widespread browser adoption in 2020 with its official 1.0 release. There are now independent WebRTC implementations for Python, Go, C++, NodeJS and other language platforms.

While WebRTC is already widely used for video calls and meetings, there is also a less popular WebRTC API for data transfer which also works very well and is [supported by all modern major browsers](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel#browser_compatibility). 

`peerfetch` uses WebRTC DataChannel to emulate p2p HTTP. It allows both ends of a connection to act as REST clients and REST servers. Both end points can be behind different firewalls. Neither end point has to know ahead of time the exact host name or IP address of the other one in order to establish an http connection. 

`peerfetch` builds on the code and lessons learned from previous projects such as [PeerJS](https://peerjs.com/) and [simple-peer](https://github.com/feross/simple-peer). It also leverages the growing ecosystem of standalone open source WebRTC implementations such as [aiortc for Python](https://github.com/aiortc/aiortc) and [pion for Go](https://github.com/pion/webrtc).


# Use cases:

- Mobile / web app access to security camera footage stored on-device.
- Kiosk apps that run in retail stores can run autonomously and managed directly.
- IoT devices can talk to each other without data flowing through cloud services. 
- Web apps can share data directly (files, notes, photos) without flowing it through cloud servers.
- Federated learning - ML models can train on local user data and share learned states directly with each other.

# Related Repos

- `peerfetch-client`: Browser client library in JavaScript. Allows browser apps to directly access IoT device REST APIs. For example accessing your home smart camera directly from your desktop or mobile phone without any footage going through cloud servers.
- `peerfetch-proxy`: WebRTC to HTTP proxy deployed on edge devices. Distributed as a python package and a docker image. Allows remote web browser apps to securely access device local REST APIs. Builds on top of the [`peerjs-python`](https://github.com/ambianic/peerjs-python) package.
- [`ambianic-pnp`](https://github.com/ambianic/ambianic-pnp): Plug-and-play signaling server with minimal emphimeral state. Allows browser clients to find IoT devices in order to establish direct data connection. No persisted storage. Clients regularly re-register and update state. In case of a server crash, state is restored within seconds of restart. A Node.js package.

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
