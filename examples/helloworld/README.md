
# peerfetch Hello World example

This is a minimalistic example of a browser JavaScript app that talks to a REST API on an edge device. The edge device runs a Python FastAPI app.

First, checkout the peerfetch repo including this example directory.

Then prepare the environment.

```
install.sh
```

Next, open two separate terminals to start the peefetch proxy service and the FastAPI app.

```
run-peerfetch-proxy.sh
```

```
run-fastapi-app.sh
```

Look for a `.peerjsrc` file in the `edge_device` sub-directory. It should look something like this:

```
{"peerId": "0ad32ad4-4a7e-4c08-8ec7-2806ac236702"}
```

Copy the value of peerId (`0ad32ad4-4a7e-4c08-8ec7-2806ac236702`).  You will need it in a moment in the browser app.

Serve `index.html` from this example directory via a local web server and open it in a browser.

Paste the `peerID` value that you copied above into the `Remote Peer ID` text field. 

Click `Connect`. 

In a few moments, next to `Remote peer says:`, the label `...waiting...` should be replaced by `{"message":"Hello World!"}`.

# App Code Explained

Let's look at the client side code and the serve side app.

## Browser app client code

The client code is in [index.html](index.html). 

### P2P network setup

There is a peerfetch setup step, which connects peerfetch to a signaling service. That allows peers in the p2p network to find each other by their unique peer IDs. As long as each peer can access the signaling service, they can find other peers and connect directly via end-to-end encrypted [WebRTC datachannel](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels). Peers on the network **do not** need to have a publicly accessible IP address.

```
      const PeerFetch = window.peerfetch.PeerFetch

      // initial setup of PeerFetch on the p2p network
      // first, connect to the signaling server (peer registrar)
      const peerFetch = new PeerFetch({
        host: 'ambianic-pnp.herokuapp.com',
        port: 443,
        secure: true,
      })
      
      peerFetch.connect(remotePeerID).then( () => {...
```

### REST API access

Once a direct p2p connection is established, the client code can use familiar HTTP request methods to access the remote peer REST API.

```
        peerFetch.get('http://localhost:8778/api/hello').then( (response) => {
          const json = peerFetch.jsonify(response.content)
          ...
         })
```

## FastAPI app server code

The server side code is a minimal FastAPI app served on `localhost`. Even though there is no public HTTP(S) route to the app, `peerfetch-proxy` makes it visible to other peers in the p2p network. For any internet node that is no part of the p2p network, this app is not visible.

Here is the gist of the FastAPI app code:

```
class HelloResponse(BaseModel):
  message: str = "Hello World!"
  
@app.get("/api/hello", response_model=HelloResponse)
def get_hello():
    """Returns Hello World!."""
    return HelloResponse()

```

## peerfetch proxy

`peerfetch.proxy` takes care of firewall navigation (NAT) and peer discovery. Python implementation of the peerfetch proxy code is available [here](../../python/src/peerfetch/proxy.py). 
