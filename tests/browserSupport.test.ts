import {BrowserSupport} from "../src/browserSupport";
import {PgsRendererMode} from "../src/pgsRendererMode";

const devices = [
    {
        name: 'WebOS 1.2',
        userAgent: 'Mozilla/5.0 (Web0S; Linux i686) AppleWebKit/537.41 (KHTML, like Gecko) Large Screen WebAppManager Safari/537.41',
        worker: true,
        offscreenCanvas: false,
        expectedMode: PgsRendererMode.mainThread
    },
    {
        name: 'WebOS 5.0',
        userAgent: 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36 WebAppManager',
        worker: true,
        offscreenCanvas: false,
        expectedMode: PgsRendererMode.mainThread
    },
    {
        name: 'Chrome 35',
        userAgent: 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.3319.102 Safari/537.36',
        worker: true,
        offscreenCanvas: false,
        expectedMode: PgsRendererMode.mainThread
    },
    {
        name: 'Chrome 68',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.0.0 Safari/537.36',
        worker: true,
        offscreenCanvas: false,
        expectedMode: PgsRendererMode.workerWithoutOffscreenCanvas
    },
    {
        name: 'Chrome 128',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        worker: true,
        offscreenCanvas: true,
        expectedMode: PgsRendererMode.worker
    },
    {
        name: 'Firefox 24',
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:24.0) Gecko/20100101 Firefox/24.0',
        worker: true,
        offscreenCanvas: false,
        expectedMode: PgsRendererMode.mainThread
    },
    {
        name: 'Firefox 130',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
        worker: true,
        offscreenCanvas: true,
        expectedMode: PgsRendererMode.worker
    }
];

describe.each(devices)('on $name', (device) => {
    beforeEach(() => {
        Object.defineProperty(global, 'navigator', {
            configurable: true,
            value: {
                userAgent: device.userAgent
            }
        });

        Object.defineProperty(global, 'Worker', {
            configurable: true,
            value: device.worker ? {} : undefined,
        });

        Object.defineProperty(global, 'HTMLCanvasElement', {
            configurable: true,
            value: {
                prototype: {
                    transferControlToOffscreen: device.offscreenCanvas ? () => {} : undefined
                }
            }
        });
    });
    afterEach(() => jest.resetAllMocks());

    it(`worker support is ${device.worker}`, () => {
        expect(BrowserSupport.isWorkerSupported()).toBe(device.worker);
    });

    it(`offscreen canvas support is ${device.offscreenCanvas}`, () => {
        expect(BrowserSupport.isOffscreenCanvasSupported()).toBe(device.offscreenCanvas);
    });

    it(`render mode is ${device.expectedMode}`, () => {
        expect(BrowserSupport.getRendererModeByPlatform()).toBe(device.expectedMode);
    });
});
