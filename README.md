# peerfetch
[HTML5 fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) implementation over WebRTC datachannel. Allows access directly from a web browser to IoT REST APIs behind firewall. No custom VPN setup and no cloud data tunneling. See [this blog post](https://webrtchacks.com/private-home-surveillance-with-the-webrtc-datachannel/) for a technical discussion and examples.

From a web app's perspective, this is the code to access the REST API hosted on the remote edge device:

```
const response = await peerFetch.get(request)
```

There are a few lines needed when the web app starts to register with a signaling server and establish a handshake with the `peerfetch` proxy running on the remote edge device. [Here is an example](https://github.com/ambianic/ambianic-ui/blob/cc29e6f4e972d69b17c00b43077a81952be8208e/src/store/pnp.js#L268) how that works. A more detailed step by step guide is in the works.

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


:warning: :construction: **MIGRATING CODE TO THIS REPO IN PROGRESS** :construction: :warning: 

This library has been used as [integral part of the `ambianic-ui`](https://github.com/ambianic/ambianic-ui/blob/master/src/remote/peer-fetch.js) project for several years. It has reached a reasonable state of stability that we consider ready for a standalone package. We are in the process of extracting it to this repo as a standalong library.

# Related Repos

- `peerfetch`: Browser client library in JavaScript. Allows browser apps to directly access IoT device REST APIs. For example accessing your home smart camera directly from your desktop or mobile phone without any footage going through cloud servers.
- `peerfetch-proxy`: WebRTC to REST API proxy deployed on IoT devices. Distributed as a python package and a docker image. Allows remote web browser apps to securely access device local REST APIs. Builds on top of the [`peerjs-python`](https://github.com/ambianic/peerjs-python) package.
- [`ambianic-pnp`](https://github.com/ambianic/ambianic-pnp): Plug-and-play signaling server with minimal emphimeral state. Allows browser clients to find IoT devices in order to establish direct data connection. No persisted storage. Clients regularly re-register and update state. In case of a server crash, state is restored within seconds of restart. A Node.js package.

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
