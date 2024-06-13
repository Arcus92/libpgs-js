import {PgsRendererOptions} from "./pgsRendererOptions";

/**
 * Renders PGS subtitle on-top of a video element using a canvas element. This also handles timestamp updates if a
 * video element is provided.
 *
 * The actual rendering is done by {@link PgsRendererInternal} inside a web-worker so optimize performance.
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


        // Init worker
        const offscreenCanvas = this.canvas.transferControlToOffscreen();
        const workerUrl = options.workerUrl ?? 'libpgs.worker.js';
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = this.onWorkerMessage;
        this.worker.postMessage({
            op: 'init',
            canvas: offscreenCanvas,
        }, [offscreenCanvas])

        // Load initial settings
        this.$timeOffset = options.timeOffset ?? 0;
        if (options.subUrl) {
            this.loadFromUrl(options.subUrl);
        }

        this.registerVideoEvents();
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
        if (this.video) {
            this.video.addEventListener('timeupdate', this.onTimeUpdate);
        }
    }

    private unregisterVideoEvents(): void {
        if (this.video) {
            this.video.removeEventListener('timeupdate', this.onTimeUpdate);
        }
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

    // region Rendering

    private updateTimestamps: number[] = [];
    private previousTimestampIndex: number = 0;

    /**
     * Renders the subtitle for the given timestamp.
     * @param time The timestamp in seconds.
     */
    public renderAtTimestamp(time: number): void {
        time = time * 1000 * 90; // Convert to PGS time

        // Find the last subtitle index for the given time stamp
        let index = -1;
        for (const updateTimestamp of this.updateTimestamps) {

            if (updateTimestamp > time) {
                break;
            }
            index++;
        }
        // Only tell the worker, if the subtitle index was changed!
        if (this.previousTimestampIndex == index) return;
        this.previousTimestampIndex = index;

        // Tell the worker to render.
        this.worker.postMessage({
            op: 'render',
            index: index
        });
    }

    // endregion

    // region Worker

    private readonly worker: Worker;

    private onWorkerMessage = (e: MessageEvent) => {
        switch (e.data.op) {
            // Is called once a subtitle file was loaded.
            case 'loaded':
                // Stores the update timestamps, so we don't need to push the timestamp to the worker on every tick.
                // Instead, we push the timestamp index if it was changed.
                this.updateTimestamps = e.data.updateTimestamps;

                // Skip to the current timestamp
                this.renderAtVideoTimestamp();
                break;
        }
    }

    /**
     * Loads the subtitle file from the given url.
     * @param url The url to the PGS file.
     */
    public loadFromUrl(url: string): void {
        this.worker.postMessage({
            op: 'loadFromUrl',
            url: url,
        })
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param buffer The PGS data.
     */
    public loadFromBuffer(buffer: ArrayBuffer): void {
        this.worker.postMessage({
            op: 'loadFromBuffer',
            buffer: buffer,
        })
    }

    // endregion

    // region Dispose

    /**
     * Destroys the subtitle canvas and removes event listeners.
     */
    public dispose(): void {
        this.worker.terminate();
        this.unregisterVideoEvents();

        // Do not destroy the canvas if it was provided from an external source.
        if (this.canvasOwner) {
            this.destroyCanvasElement();
        }
    }

    // endregion
}
