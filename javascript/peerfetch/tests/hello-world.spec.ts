import { PeerFetch } from '../src/index'

describe('PeerFetch class coverage - http over webrtc methods', () => {
  
    beforeAll(() => {
    })
  
    beforeEach(() => {
    })
  
    afterEach(() => {
      jest.resetAllMocks()
    })
  
    test('minimal peerfetch logic', async () => {
      // setup peerfetch instance
      const remotePeerID = '0527fc3d-7e83-4ce5-b133-1089af69b567'
      const peerFetch = new PeerFetch(      {
        host: 'ambianic-pnp.herokuapp.com',
        port: 443,
        secure: true,
      })
      await peerFetch.connect(remotePeerID)

      // ready to use as a regular HTTP client
      const response = await peerFetch.get('http://localhost/status')
      console.debug({ response })
      expect(response).toEqual('Hello World!')
    })
  })
