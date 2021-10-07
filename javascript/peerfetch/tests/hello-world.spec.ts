import { PeerFetch } from '../src/index'

describe('PeerFetch class coverage - p2p communication layer', () => {
  
    beforeAll(() => {
    })
  
    beforeEach(() => {
    })
  
    afterEach(() => {
      jest.resetAllMocks()
    })
  
    test('minimal peerfetch logic', () => {
      const msg = 'Hello World'
      const peerFetch = new PeerFetch(msg)
      const greet = jest.spyOn(PeerFetch.prototype, 'greet')
      expect(greet).toHaveBeenCalledTimes(0)
      console.debug(greet.mock.results)
      const result = peerFetch.greet()
      console.debug({ result })
      expect(greet).toHaveBeenCalledTimes(1)
      console.debug(greet.mock.results)
      expect(result).toEqual(msg)
      expect(greet).toHaveReturnedWith(msg)
      const meet =  jest.spyOn(peerFetch, 'meet')
      const mresult = peerFetch.meet()
      console.debug(mresult)
      expect(mresult).toEqual(123)
      expect(meet).toHaveBeenCalledTimes(1)
      expect(meet).toHaveReturnedWith(123)
    })
  })
  