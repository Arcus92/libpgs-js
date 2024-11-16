import {SubtitleRendererMode} from "./subtitleRendererMode";

export class BrowserSupport {
    /**
     * Checks if the web worker is supported in the current environment.
     */
    public static isWorkerSupported(): boolean {
        return !!Worker;
    }

    /**
     * Checks if the offscreen-canvas and `transferControlToOffscreen` are supported in the current environment.
     */
    public static isOffscreenCanvasSupported(): boolean {
        return !!HTMLCanvasElement.prototype.transferControlToOffscreen;
    }

    /**
     * Returns the optimal PGS renderer mode for the current platform.
     */
    public static getRendererModeByPlatform(): SubtitleRendererMode {
        // Handle browser specific edge cases. This list is not complete!
        // If you find any more compatible issues with legacy browsers, please report them on the issue tracker.
        const userAgent = navigator.userAgent;

        // Detect Chrome
        const chrome = /Chrome\/(\d+)/.exec(userAgent);
        const chromeVersion = chrome ? parseInt(chrome[1]) : undefined;

        // Detect Firefox
        const firefox = /Firefox\/(\d+)/.exec(userAgent);
        const firefoxVersion = firefox ? parseInt(firefox[1]) : undefined;

        // Detect WebOS
        const webOS = navigator.userAgent.indexOf('Web0S') >= 0;


        // ImageData in workers is supported since Chrome 36
        if (chromeVersion && chromeVersion < 36) {
            return SubtitleRendererMode.mainThread;
        }

        // ImageData in workers is supported since Firefox 25
        if (firefoxVersion && firefoxVersion < 25) {
            return SubtitleRendererMode.mainThread;
        }

        // Older version of WebOS are based on WebKit and don't support ImageData in Workers.
        if (webOS && chromeVersion === undefined) {
            return SubtitleRendererMode.mainThread;
        }
        // WebOS 5 / Chrome 68 should support workers, but they do not load nor respond to messages.
        if (webOS && chromeVersion && chromeVersion <= 68) {
            return SubtitleRendererMode.mainThread;
        }


        // Detect by features
        const isWorkerSupported = this.isWorkerSupported();
        const isOffscreenCanvasSupported = this.isOffscreenCanvasSupported();
        if (isWorkerSupported) {
            if (isOffscreenCanvasSupported) {
                return SubtitleRendererMode.worker;
            } else {
                return SubtitleRendererMode.workerWithoutOffscreenCanvas;
            }
        } else {
            return SubtitleRendererMode.mainThread;
        }
    }
}
