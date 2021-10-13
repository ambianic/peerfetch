
import Peer from 'peerjs'

enum ConnectionStatus {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR,
}

/**
 * Implements HTML Fetch API over p2p WebRTC DataChannel.
 * Adds a few convenience methods for common HTTP ops.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch fetch}
 *
*/
export class PeerFetch {

  /**
   * A PeerJS instance that provides lower layer p2p connectivity API
   */
  private _peer?: Peer

  /**
   * Configuration parameters for the p2p network connection.
   */
  private _config: Peer.PeerJSOption

  /**
   * An identifier of this PeerJS instance that is unique within the p2p network that it participates.
   * It is assigned by the signaling server. Similar to an http session ID.
   */
  private _myPeerId: string = 'UKNOWN'

  /**
   * Peer ID of the remote node that will proxy http requests
   */
  private _remotePeerID: string = 'UNKNOWN'

  /**
   * Tracks current status of the connection to the signaling server
   */
  private _signalingConnectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED

  /**
   * Tracks current status of the connection to the remote peer
   */
  private _peerConnectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED

  /**
   * The current peer data connection that http requests ride on.
   * Currently a single peer data connection is managed per PeerFetch instance.
   */
  private _dataConnection?: Peer.DataConnection

  /**
   * Map of pending HTTP requests
   */
  private _requestMap: Map<number, any> = new Map()

  /**
   * Refernce to a timer that runs keepalive pings to the remote peer.
   */
  private _keepAlive?: ReturnType<typeof setTimeout>

  /**
   * Ticketing enforces a strict order or processing for pending http requests and corresponding responses.
   * Each async request from client code draws a new ticket.
   * Tickets are processed in the sequential monotonic order that they are drawn. 
   * Once a request is fully processed, its ticket is burned and the next ticket is processed.
   * A request ticket is not fully processed until the corresponding final HTTP response is received.
   *
   * /
    
  /** 
   * Incrementing monotonic counter pointing to the next available(unused) ticket number.
   */
  private _nextAvailableTicket = 0

  /**
   * Points to the next ticket assigned to a pending request
   * Requests are processed in FIFO order.
   */
  private _nextTicketInLine = 0

  /**
   * 
   * @param config: PeerOptions provide information such as signaling server host and port.
   */
  constructor (config: Peer.PeerJSOption) {
    this._signalingConnectionStatus = ConnectionStatus.CONNECTING
    this._config = config
  }

  /**
   * 
   * Setup connection to a remote peer.
   * 
   * @param remotePeerID valid remote peer ID in the p2p network.
   * @returns Promise that either resolves when a connection is established
   *  or throws and exception if connectiion attempt fails.
   */
  async connect(remotePeerID: string) {
    this._signalingConnectionStatus = ConnectionStatus.CONNECTING
    this._remotePeerID = remotePeerID
    let newPeer = new Peer(this._config)
    this._peer = newPeer
    // return a promise that will be resolved when the peer connection is ready.
    const setupReady = new Promise((connectionSetupResolve, connectionSetupReject) => {
      this._setSignalingServiceConnectionHandlers(newPeer, connectionSetupResolve, connectionSetupReject)
    })
    return setupReady
  }

  /**
   * Tead down connections to remote peer and signaling server.
   */
  async disconnect() {
    if (this._peer) {
      this._peer.destroy()
    }
  }

  private _setSignalingServiceConnectionHandlers (peer: Peer, setupResolve: Function, setupReject: Function) {
    // isSetupResolved indicates whether the setupReady promise has been resolved or rejected
    // to ensure that we resolve/reject the promise only once.
    let isSetupResolved = false

    peer.on('open', (id: string) => {
      // signaling server connection established
      if (!peer.id && this._myPeerId) {
        // Workaround for peer.reconnect deleting previous id
        console.log('Received null id from peer open.')
        peer.id = this._myPeerId
      } else {
        if (this._myPeerId !== peer.id) {
          console.log(
            'Signaling server returned new peerID. ',
            'Old PeerID:', this._myPeerId, 
            'New PeerID: ', peer.id
          )
        }
      }
      this._signalingConnectionStatus = ConnectionStatus.CONNECTED
      console.debug('Connected to signaling server; myPeerId: ', peer.id)
      isSetupResolved = true // only as far as signaling is concerned
      // The final setup resolution or rejection now depends on the next step: peer connection setup.
      const peerConnection = peer.connect(this._remotePeerID, {
        label: 'http-proxy', reliable: true, serialization: 'raw'
      })
      this._setPeerConnectionHandlers(peerConnection, setupResolve, setupReject)
    })

    peer.on('disconnected', () => {
      this._signalingConnectionStatus = ConnectionStatus.DISCONNECTED
      const msg = 'Disconnected from signaling server.'
      console.debug(msg)
      // if PeerFetch setup() promise has not been resolved yet,
      // then throw an exception to notify any app code awaiting resolution.
      if (!isSetupResolved) {
        isSetupResolved = true
        setupReject(new Error(msg))
      }
    })

    peer.on('close', () => {
      this._signalingConnectionStatus = ConnectionStatus.DISCONNECTED
      const msg = 'Socket connection to signaling server closed.'
      console.debug(msg)
      if (!isSetupResolved) {
        isSetupResolved = true
        setupReject(new Error(msg))
      }
    })

    peer.on('error', (err) => {
      this._signalingConnectionStatus = ConnectionStatus.ERROR
      const msg = 'Error in signaling server connection: ' + err.message
      console.debug(msg)
      if (!isSetupResolved) {
        isSetupResolved = true
        setupReject(new Error(msg))
      }
    })

    // remote peer tries to initiate connection
    peer.on('connection', (peerConnection) => {
      console.debug('Remote peer trying to initiate a connection')
      isSetupResolved = true // only as far as signaling is concerned
      // The final setup resolution or rejection now depends on the next step: peer connection setup.
      this._setPeerConnectionHandlers(peerConnection, setupResolve, setupReject)
    })
  }
  
  private _setPeerConnectionHandlers (peerConnection: Peer.DataConnection, setupResolve: Function, setupReject: Function) {
    // isSetupResolved indicates whether the setupReady promise has been resolved or rejected
    // to ensure that we resolve/reject the promise only once.
    let isSetupResolved = false    

    // setup connection progress callbacks
    peerConnection.on('open', () => {
      this._peerConnectionStatus = ConnectionStatus.CONNECTED
      this._dataConnection = peerConnection
      // Map of pending requests awaiting responses
      this._requestMap = new Map()
      // incrementing counter to the next available
      // unused ticket number
      // Each request is assigned a ticket
      // which can be used to claim the response
      this._nextAvailableTicket = 0
      // points to the next ticket assigned to a pending request
      // Requests are processed in FIFO order.
      this._nextTicketInLine = 0
      console.debug('Peer DataConnection is now open.')
      // Now that a peer connection is established,
      // we can resolve the PeerFetch setup() promise
      isSetupResolved = true
      setupResolve()
      // schedule keepalive pings to prevent 
      // routers from closing the NAT holes during persiod of inactivity
      // between peerfetch requests.
      this._schedulePing()
    })
  
    peerConnection.on('close', () => {
      this._peerConnectionStatus = ConnectionStatus.DISCONNECTED
      const msg = 'Peer DataConnection closed.'
      console.debug(msg)
      // if PeerFetch setup() promise has not been resolved yet,
      // then throw an exception to notify any app code awaiting resolution.
      if (!isSetupResolved) {
        isSetupResolved = true
        setupReject(new Error(msg))
      }
      console.debug('Peer connection is now closed.')
      this._stopPing()      
    })
  
    peerConnection.on('error', (err) => {
      this._peerConnectionStatus = ConnectionStatus.ERROR
      const msg = 'Error in connection to remote peer ID: ' + peerConnection.peer
      console.debug(msg)
      if (!isSetupResolved) {
        isSetupResolved = true
        setupReject(new Error(msg))
      }
    })
  
    peerConnection.on('data', (data) => {
      console.debug('Remote Peer Data message received (type %s)',
        typeof (data), { data })
      // we expect data to be a response to a previously sent request message
      // or a server side initiated keepalive ping message
      const ticket = this._nextTicketInLine
      const requestMap = this._requestMap
      console.debug({ requestMap, ticket, data })
      // update request-response map entry with this response
      const pair = this._requestMap.get(ticket)
      if (pair) {
        // we expect the remote peer to respond with two consequetive data packates
        // the first one containing the http header info
        // and the second contatning the http body
        if (!pair.response) {
          console.debug('Processing response header', data)
          // this is the first data message from the responses
          const header = this.jsonify(data)
          let receivedAll = false
          let content
          switch (header.status) {
            case 202:
              console.debug('Received keepalive ping')
              // server accepted the request but still working
              // ignore and keep waiting until result or timeout
              break
            case 204:
              // Successfully processed request, no response content.
              //  Normally returned in response to PUT requests.
              console.debug('Received HTTP 204 response: Success. No content.')
              // return 204 header and no response content
              receivedAll = true
              content = undefined
              pair.response = { header, content, receivedAll }
              break
            case undefined:
              console.warn('Expected http header packet with status attribute.', { ticket, header })
              console.warn('Remote peer may not be using a compatible protocol.')
              break
            default:
              console.debug('Received web server final response header',
                { header })
              // save header part of the response
              // and wait for the p2p data messages with the content body
              receivedAll = false
              pair.response = { header, receivedAll }
          }
        } else {
          console.debug('Processing response content')
          // response content body arrived
          pair.response.content = data
          // assume for now that all response content can fit
          // in a single 64KB data message
          pair.response.receivedAll = true
        }
      } else {
        console.error('Data received as response for ticket but no entry found in pending request map',
          { ticket, data })
      }
    })

    console.debug('peerConnection.on(event) handlers all set.')
  }
  

  /**
   * Schedule periodic pings to keep the datachannel alive.
   * Some routers and firewalls close open ports within seconds
   * without data packets flowing through.
   */
  _schedulePing () {
    this._keepAlive = setInterval(
      async () => {
        // check if there are any pending requests
        // no ping needed as long as there is traffic on the channel
        if (!this._pendingRequests()) {
          try {
            // request pong to keep the webrtc datachannel connection alive
            await this.get('ping')
          } catch (err) {
            console.warn('ping request timed out while waiting for pong from remote peer.')
          }
        }
      },
      1000 // every second
    )
    console.debug('Pings scheduled.')
  }

  /**
  * Stop keepalive pings.
  */
  _stopPing () {
    if (this._keepAlive) {
      clearInterval(this._keepAlive)
    }
  }

  /**
    Return the next available ticket number
    for the HTTP request processing queue
    and simultaneously increment the ticket counter.
  */
  _drawNewTicket (): number {
    const nextAvailable = this._nextAvailableTicket
    this._nextAvailableTicket++
    const nextInLine = this._nextTicketInLine
    console.assert(
      nextInLine <= nextAvailable,
      'nextInLine has to be less or equal to nextAvailable',
      { nextInLine , nextAvailable }
    )
    return nextAvailable
  }

  /**
    Move on to next pending ticket for the HTTP request queue
  */
  _ticketProcessed (ticket: number): void {
    const errorMsg = 'response received out of order!'
    const nextTicket = this._nextTicketInLine
    console.assert(
      ticket === nextTicket, 
      'ticket parameter has to equal nextTicket',
      { ticket, nextTicket, errorMsg }
    )
    // remove entry from pending request map
    this._requestMap.delete(ticket)
    this._nextTicketInLine++
    const nextInLine = this._nextTicketInLine
    const nextAvailable = this._nextAvailableTicket
    console.assert(
      nextInLine <= nextAvailable,
      'nextInLine has to be less or equal than nextAvailable',
      { nextInLine, nextAvailable }
    )
  }

  /**
  * Convenience method for developers familiar with axios.request(config)
  *
  * @see {@link https://github.com/axios/axios#axiosrequestconfig}
  * @see {@link https://github.com/axios/axios#request-config}
  */
  async request ({ url = '/', method = 'GET', params = new Map<string, any>() }): Promise<any> {
    console.debug('PeerFetch.request enter', { url, method, params })
    var esc = encodeURIComponent
    var query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params.get(k)))
      .join('&')
    url += '?' + query
    console.debug('PeerFetch.request', { url, method, query })
    const request = {
      url,
      method
    }
    // get a ticket that matches the request
    // and use it to claim the corresponding
    // response when available
    const ticket = this._enqueueRequest(request)
    const response = await this._receiveResponse(ticket)
    return response
  }

  /**
   *
   * Similar to axious get(url,[config])
   *
   * @see {@link https://github.com/axios/axios#axiosgeturl-config}
   *
   * @param {*} url resource to GET
   * @param {*} config request header options
   */
  async get (url = '/') {
    const config = { url: url, method: 'GET' }
    return await this.request(config)
  }

  /**
   *
   * Similar to axious get(url,[config])
   *
   * @see {@link https://github.com/axios/axios#axiosputurl-data-config}
   * @see {@link https://masteringjs.io/tutorials/axios/put}
   *
   * @param {*} url resource URL for the PUT request
   * @param {*} data data payload for the PUT request
   * @param {*} config request header options
   */
  async put (url: string, data: any, config: any) {
    config.url = url
    config.method = 'PUT'
    config.data = data
    await this.request(config)
  }

  /**
   *
   * Similar to HTML fetch()
   *
   * @see {@link https://fetch.spec.whatwg.org/#dom-global-fetch}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters}
   *
   * @param {*} input resource URL to fetch
   * @param {*} init request header options
   */
  async fetch (input = '/', init: { method: 'GET' }) {
    const config = { url: input, method: init.method }
    return await this.request(config)
  }

  _enqueueRequest (request: {}): number {
    const ticket = this._drawNewTicket()
    const requestMap = this._requestMap
    console.debug('_enqueueRequest: ', { requestMap })
    this._requestMap.set(ticket, { request })
    if (this._requestMap.size === 1) {
      // there are no other pending requests
      // let's send this one on the wire
      this._sendNextRequest()
    }
    return ticket
  }

  /**
    Send next pending request to remote peer.
    Requests are sent one at a time.
    Only when a previous request response arrives
    is the next request sent across the wire.

    In the future we can look at handling multiple requests
    and responses in parallel over the same data connection or
    even a pool of connections.
  */
  _sendNextRequest () {
    const ticket = this._nextTicketInLine
    let { request, requestSent } = this._requestMap.get(ticket)
    if (requestSent) {
      // A request was sent and is waiting its response.
      // Wait for the full respones before sending another request.
      return
    } else {
      requestSent = true
      this._requestMap.set(ticket, { request, requestSent })
    }
    console.assert(request, 'request cannot be null or empty', { ticket, request })
    const jsonRequest = JSON.stringify(request)
    const requestMap = this._requestMap
    console.debug('PeerFetch: Sending request to remote peer',
      { requestMap, ticket, request })
    try {
      if (this._dataConnection) {
        this._dataConnection.send(jsonRequest)
      } else throw new Error('no _dataConnection available')
      console.debug('PeerFetch: Request sent to remote peer: ', jsonRequest)
    } catch (error) {
      console.error('PeerFetch: Error sending message via Peer DataConnection', { error })
    }
  }

  _processNextTicketInLine () {
    // check if there is a pending ticket
    // and process it
    if (this._pendingRequests()) {
      this._sendNextRequest()
    }
  }

  /**
  * Check if there are any pending requests waiting in line.
  */
  _pendingRequests () {
    if (this._requestMap.size > 0) {
      return true
    }
  }

  textDecode (arrayBuffer: any) {
    let decodedString: string = ""
    if ('TextDecoder' in window) {
      // Decode as UTF-8
      var dataView = new DataView(arrayBuffer)
      var decoder = new TextDecoder('utf8')
      decodedString = decoder.decode(dataView)
    } else {
      // Fallback decode as ASCII
      let jsonKey: string = "";
      (new Uint8Array(arrayBuffer)).forEach(function (byte: number) {
        decodedString += String.fromCharCode(byte);
      })  
    }
    console.debug({ decodedString })
    return decodedString
  }

  jsonify (data: any) {
    let decodedString
    console.debug('jsonify', data)
    if (!data) {
      decodedString = '{}'
    } else if (typeof data === 'string') {
      decodedString = data
    } else {
      decodedString = this.textDecode(data)
    }
    const response = JSON.parse(decodedString)
    return response
  }

  _checkResponseReady (ticket: number) {
    let request = null
    let response = null;
    ({ request, response } = this._requestMap.get(ticket))
    if (response && response.receivedAll) {
      this._ticketProcessed(ticket)
      console.debug('Received full response', { ticket, request, response })
      // schedule processing of next request shortly
      setTimeout(() => this._processNextTicketInLine(), 50)
      return response
    } else {
      // console.debug('Waiting for response...', { ticket, request })
      return null
    }
  }

  async _receiveResponse (ticket: number) {
    const timeout = 20 * 1000 // 10 seconds
    const timerStart = Date.now()
    let timeElapsed = 0
    let response = null
    do {
      response = this._checkResponseReady(ticket)
      timeElapsed = Date.now() - timerStart
      await sleep(200)
      // console.debug('Response time elapsed:', { ticket, timeElapsed })
    } while (!response && timeElapsed < timeout)
    if (!response) {
      // check if response came in after the last sleep
      // before timeout.
      response = this._checkResponseReady(ticket)
    }
    if (response) {
      console.debug('Returning full response', { response })
      return response
    } else {
      throw Error('PeerFetch Timeout while waiting for response.')
    }
  }
}

function sleep (ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
