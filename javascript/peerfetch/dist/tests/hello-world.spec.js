var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PeerFetch } from '../src/index';
describe('PeerFetch class coverage - http over webrtc methods', () => {
    beforeAll(() => {
    });
    beforeEach(() => {
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('minimal peerfetch logic', () => __awaiter(void 0, void 0, void 0, function* () {
        // setup peerfetch instance
        const remotePeerID = '0527fc3d-7e83-4ce5-b133-1089af69b567';
        const peerFetch = new PeerFetch({
            host: 'ambianic-pnp.herokuapp.com',
            port: 443,
            secure: true,
        });
        yield peerFetch.connect(remotePeerID);
        // ready to use as a regular HTTP client
        const response = yield peerFetch.get('http://localhost/status');
        console.debug({ response });
        expect(response).toEqual('Hello World!');
    }));
});
//# sourceMappingURL=hello-world.spec.js.map