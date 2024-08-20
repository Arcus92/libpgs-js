import {PgsRendererOptions} from "./pgsRendererOptions";
import {PgsRendererImpl} from "./pgsRendererImpl";
import {PgsRendererInWorkerWithOffscreenCanvas} from "./pgsRendererInWorkerWithOffscreenCanvas";
import {PgsRendererInMainThread} from "./pgsRendererInMainThread";

/**
 * Renders PGS subtitle on-top of a video element using a canvas element. This also handles timestamp updates if a
 * video element is provided.
 */
export class PgsRenderer {
    /**
     * Creates and starts a PGS subtitle render with the given option.
     * @param options The PGS renderer options.
     */
    public constructor(options: PgsRendererOptions) {
        if (options.video) {
            this.video = options.video;
        }

        // Init canvas
        if (options.canvas) {
            // Use a canvas provided by the user
            this.canvas = options.canvas;
            this.canvasOwner = false;
        } else if (this.video) {
            // Create a new canvas next to the video element
            this.canvas = this.createCanvasElement();
            this.canvasOwner = true;
            this.video.parentElement!.appendChild(this.canvas);
        } else {
            throw new Error('No canvas or video element was provided!');
        }


        this.implementation = this.createPgsRendererFormPlatform(options);
        this.implementation.onTimestampsUpdated = () => {
            // Re-render the current subtitle if the timestamps were updates (e.g. through partial load).
            this.renderAtVideoTimestamp();
        }

        // Load initial settings
        this.$timeOffset = options.timeOffset ?? 0;
        if (options.subUrl) {
            this.loadFromUrl(options.subUrl);
        }

        this.registerVideoEvents();
    }

    /**
     * Checks if the web worker is supported in the current environment.
     */
    private isWorkerSupported(): boolean {
        return !!window.Worker;
    }

    /**
     * Checks if the offscreen-canvas and `transferControlToOffscreen` are supported in the current environment.
     */
    private isOffscreenCanvasSupported(): boolean {
        return !!HTMLCanvasElement.prototype.transferControlToOffscreen;
    }

    /**
     * Performs a platform check and returns the optimal implementation for subtitle rendering.
     * @param options The PGS renderer options.
     */
    private createPgsRendererFormPlatform(options: PgsRendererOptions): PgsRendererImpl {
        // Jellyfin still supports webOS 1.2 and Tizen 2.3 with real old WebKit and Chromium version.
        // We can run a different fallback implementation if the offscreen canvas is not supported.

        const isWorkerSupported = this.isWorkerSupported();
        const isOffscreenCanvasSupported = this.isOffscreenCanvasSupported();
        console.log(`isWebWorkerSupported: ${isWorkerSupported}, isOffscreenCanvasSupported: ${isOffscreenCanvasSupported}`);

        // FIXME: I would like to use `PgsRendererInWorkerWithoutOffscreenCanvas` if the offscreen canvas is not
        //        available, but even the web worker thread won't start on webOS and I can't figure out why.
        if (isWorkerSupported && isOffscreenCanvasSupported) {
            return new PgsRendererInWorkerWithOffscreenCanvas(options, this.canvas);
        } else {

            return new PgsRendererInMainThread(options, this.canvas);
        }
    }

    private implementation: PgsRendererImpl;

    /**
     * Loads the subtitle file from the given url.
     * @param url The url to the PGS file.
     */
    public loadFromUrl(url: string): void {
        this.implementation.loadFromUrl(url);
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param buffer The PGS data.
     */
    public loadFromBuffer(buffer: ArrayBuffer): void {
        this.implementation.loadFromBuffer(buffer);
    }

    /**
     * Renders the subtitle for the given timestamp.
     * @param time The timestamp in seconds.
     */
    public renderAtTimestamp(time: number): void {
        this.implementation.renderAtTimestamp(time);
    }

    // region Video

    private readonly video?: HTMLVideoElement;

    private $timeOffset: number = 0;

    /**
     * Gets the video-to-subtitle time offset in seconds.
     */
    public get timeOffset(): number {
        return this.$timeOffset;
    }

    /**
     * Sets the video-to-subtitle time offset and re-renders the current subtitle if needed.
     * @param timeOffset The new time offset in seconds.
     */
    public set timeOffset(timeOffset: number) {
        if (this.$timeOffset === timeOffset) return;
        this.$timeOffset = timeOffset;
        this.renderAtVideoTimestamp();
    }

    private registerVideoEvents(): void {
        this.video?.addEventListener('timeupdate', this.onTimeUpdate);
    }

    private unregisterVideoEvents(): void {
        this.video?.removeEventListener('timeupdate', this.onTimeUpdate);
    }

    private onTimeUpdate = (): void => {
        this.renderAtVideoTimestamp();
    }

    private renderAtVideoTimestamp() {
        if (this.video) {
            this.renderAtTimestamp(this.video.currentTime + this.$timeOffset);
        }
    }

    // endregion

    // region Canvas

    private readonly canvas: HTMLCanvasElement;
    private readonly canvasOwner: boolean;

    private createCanvasElement(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.right = '0';
        canvas.style.bottom = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.objectFit = 'contain';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        return canvas;
    }

    private destroyCanvasElement() {
        this.canvas.remove();
    }

    // endregion

    // region Dispose

    /**
     * Destroys the subtitle canvas and removes event listeners.
     */
    public dispose(): void {
        this.implementation.dispose();
        this.unregisterVideoEvents();

        // Do not destroy the canvas if it was provided from an external source.
        if (this.canvasOwner) {
            this.destroyCanvasElement();
        }
    }

    // endregion
}
