
# peerfetch

Peer-to-peer HTTP over WebRTC. Implements [HTML5 fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) over WebRTC DataChannel. Allows direct secure access from a web browser to edge devices (IoT or servers) hidden behind a firewall. 

- Excuting in safe application space (not `sudo`)
- End to end encryption
- No custom VPN setup. 
- No cloud middleman for data tunneling. 
- No dynamic DNS services. 
- No firewall (re)configuration.

Here is a basic web browser app code to access the REST API hosted on the remote edge device:

```
<!DOCTYPE html>

<html lang="en">
 <head>
  <script src="/javascript/peerfetch/dist/peerfetch.js"></script>
 </head>
 <body>
  <script type="module" async>

      const PeerFetch = window.peerfetch.PeerFetch

      // initial setup of PeerFetch on the p2p network
      // first, connect to the signaling server (peer registrar)
      const peerFetch = new PeerFetch(config)
      peerFetch.connect('aValidRemotePeerID').then( () => {

        // Now use peerfetch as a regular HTTP client.
        // Except the host part in the URL is not publicly accessible. 
        // It is only visible to the remote peerfetch proxy.
        peerFetch.get('http://localhost:8778/api/hello').then( (response) => {
          const json = peerFetch.jsonify(response.content)
          const msg = JSON.stringify(json)
          // show msg response in browser
          alert(msg)
        })
      }).catch((err) => console.error(err))
    }
  </script>
 </body>
</html>

```

See [this blog post](https://webrtchacks.com/private-home-surveillance-with-the-webrtc-datachannel/) for a deeper technical discussion and examples. Works in browser, NodeJS, Python, Go and other runtimes that support WebRTC.

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

# Used by

- [Ambianic UI PWA](https://github.com/ambianic/ambianic-ui)
- [Ambianic Edge](https://github.com/ambianic/ambianic-edge)
