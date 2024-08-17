import {PgsRendererOptions} from "./pgsRendererOptions";
import {PgsRendererImpl} from "./pgsRendererImpl";
import {PgsRendererInWorkerWithOffscreenCanvas} from "./pgsRendererInWorkerWithOffscreenCanvas";
import {PgsRendererInWorkerWithoutOffscreenCanvas} from "./pgsRendererInWorkerWithoutOffscreenCanvas";

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

        // Jellyfin still supports webOS 5 aka Chrome 69. There `transferControlToOffscreen` is not available.
        // In that case we will render the canvas on the main thread.
        // If required we could add a non-worker implementation in the future. Also, we could add an option to force a
        // certain implementation when needed.
        const isOffscreenCanvasSupported = this.isOffscreenCanvasSupported();
        console.log(`isOffscreenCanvasSupported: ${isOffscreenCanvasSupported}`);
        if (isOffscreenCanvasSupported) {
            this.implementation = new PgsRendererInWorkerWithOffscreenCanvas(options, this.canvas);

        } else {
            this.implementation = new PgsRendererInWorkerWithoutOffscreenCanvas(options, this.canvas);
        }

        // Re-render the current subtitle if the timestamps were updates (e.g. through partial load).
        this.implementation.onTimestampsUpdated = () => {
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
     * Checks if the offscreen-canvas and `transferControlToOffscreen` are supported in the current environment.
     */
    private isOffscreenCanvasSupported(): boolean {
        return !!HTMLCanvasElement.prototype.transferControlToOffscreen;
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
