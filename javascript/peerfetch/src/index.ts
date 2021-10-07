/**
 * Implements HTML Fetch API over p2p WebRTC DataChannel.
 * Provides convenience HTTP methods similar to axios.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch fetch}
 * @see {@link https://github.com/axios/axios axious}
 *
*/
export class PeerFetch {
  constructor (dataConnection: RTCData) {
    // the DataConnection that PeerFetch rides on
    this._dataConnection = dataConnection
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
    this._configureDataConnection()
    this._schedulePing()
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
    clearInterval(this._keepAlive)
  }

  /**
    Return the next available ticket number
    for the HTTP request processing queue
    and simultaneously increment the ticket counter.
  */
  _drawNewTicket () {
    const nextAvailable = this._nextAvailableTicket
    this._nextAvailableTicket++
    const nextInLine = this._nextTicketInLine
    console.assert(
      nextInLine <= nextAvailable,
      { nextInLine, nextAvailable }
    )
    return nextAvailable
  }

  /**
    Move on to next pending ticket for the HTTP request queue
  */
  _ticketProcessed (ticket) {
    const errorMsg = 'response received out of order!'
    const nextTicket = this._nextTicketInLine
    console.assert(
      ticket === nextTicket,
      { ticket, nextTicket, errorMsg }
    )
    // remove entry from pending request map
    this._requestMap.delete(ticket)
    this._nextTicketInLine++
    const nextInLine = this._nextTicketInLine
    const nextAvailable = this._nextAvailableTicket
    console.assert(
      nextInLine <= nextAvailable,
      { nextInLine, nextAvailable }
    )
  }

  _configureDataConnection () {
    // Handle incoming data (messages only since this is the signal sender)
    const peerFetch = this
    this._dataConnection.on('data', function (data) {
      console.debug('Remote Peer Data message received (type %s)',
        typeof (data), { data })
      // we expect data to be a response to a previously sent request message
      const ticket = peerFetch._nextTicketInLine
      console.debug(peerFetch, peerFetch._requestMap, ticket, data)
      // update request-response map entry with this response
      const pair = peerFetch._requestMap.get(ticket)
      if (pair) {
        // we expect the remote peer to respond with two consequetive data packates
        // the first one containing the http header info
        // and the second contatning the http body
        if (!pair.response) {
          console.debug('Processing response header', data)
          // this is the first data message from the responses
          const header = peerFetch.jsonify(data)
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
    this._dataConnection.on('open', function () {
      console.debug('Peer connection is now open.')
      peerFetch._schedulePing()
    })
    this._dataConnection.on('close', function () {
      console.debug('Peer connection is now closed.')
      peerFetch._stopPing()
    })
  }

  /**
  * Similar to axios.request(config)
  *
  * @see {@link https://github.com/axios/axios#axiosrequestconfig}
  * @see {@link https://github.com/axios/axios#request-config}
  */
  async request ({ url = '/', method = 'GET', params = {} }) {
    console.debug('PeerFetch.request enter', { url, method, params })
    var esc = encodeURIComponent
    var query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
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
  async get (url = '/', config = {}) {
    config.url = url
    config.method = 'GET'
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
  async put (url, data, config = {}) {
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
  async fetch (input = '/', init = { method: 'GET' }) {
    const config = {}
    config.url = input
    config.method = init.method
    return await this.request(config)
  }

  _enqueueRequest (request) {
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
    console.assert(request != null, { ticket, request })
    const jsonRequest = JSON.stringify(request)
    const requestMap = this._requestMap
    console.debug('PeerFetch: Sending request to remote peer',
      { requestMap, ticket, request })
    try {
      this._dataConnection.send(jsonRequest)
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

  textDecode (arrayBuffer) {
    let decodedString
    if ('TextDecoder' in window) {
      // Decode as UTF-8
      var dataView = new DataView(arrayBuffer)
      var decoder = new TextDecoder('utf8')
      decodedString = decoder.decode(dataView)
    } else {
      // Fallback decode as ASCII
      decodedString = String.fromCharCode.apply(null,
        new Uint8Array(arrayBuffer))
    }
    console.debug({ decodedString })
    return decodedString
  }

  jsonify (data) {
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

  _checkResponseReady (ticket) {
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

  async _receiveResponse (ticket) {
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

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
