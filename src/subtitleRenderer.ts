import {SubtitleRendererOptions} from "./subtitleRendererOptions";
import {RendererImpl} from "./renderer/rendererImpl";
import {RendererInWorkerWithOffscreenCanvas} from "./renderer/rendererInWorkerWithOffscreenCanvas";
import {RendererInMainThread} from "./renderer/rendererInMainThread";
import {RendererInWorkerWithoutOffscreenCanvas} from "./renderer/rendererInWorkerWithoutOffscreenCanvas";
import {SubtitleRendererMode} from "./subtitleRendererMode";
import {BrowserSupport} from "./browserSupport";
import {SubtitleSource} from "./subtitleSource";

/**
 * Renders image-based subtitle on-top of a video element using a canvas element. This also handles timestamp updates
 * if a video element is provided.
 */
export class SubtitleRenderer {
    /**
     * Creates and starts a subtitle render with the given option.
     * @param options The renderer options.
     */
    public constructor(options: SubtitleRendererOptions) {
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


        this.implementation = this.createRendererImplementation(options);
        this.implementation.onTimestampsUpdated = () => {
            // Re-render the current subtitle if the timestamps were updates (e.g. through partial load).
            this.renderAtVideoTimestamp();
        }

        // Load initial settings
        this.$timeOffset = options.timeOffset ?? 0;
        if (options.aspectRatio) {
            this.aspectRatio = options.aspectRatio;
        }
        if (options.source) {
            this.load(options.source);
        }

        this.registerVideoEvents();
    }

    /**
     * Creates the renderer implementation for the given option.
     * @param options The renderer options.
     */
    private createRendererImplementation(options: SubtitleRendererOptions): RendererImpl {
        // Use the mode provided in the settings or detect by browser.
        const mode = options.mode ?? BrowserSupport.getRendererModeByPlatform();
        switch (mode) {
            case SubtitleRendererMode.worker:
                return new RendererInWorkerWithOffscreenCanvas(options, this.canvas);
            case SubtitleRendererMode.workerWithoutOffscreenCanvas:
                return new RendererInWorkerWithoutOffscreenCanvas(options, this.canvas);
            case SubtitleRendererMode.mainThread:
                return new RendererInMainThread(options, this.canvas);
        }
    }

    private implementation: RendererImpl;

    /**
     * Loads the subtitle from the given source.
     * @param source The subtitle source.
     */
    public load(source: SubtitleSource): void {
        this.implementation.load(source);
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
        canvas.style.objectFit = this.$aspectRatio;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        return canvas;
    }

    private destroyCanvasElement() {
        this.canvas.remove();
    }

    private $aspectRatio: 'contain' | 'cover' | 'fill' = 'contain';

    /**
     * Gets the aspect ratio mode of the canvas.
     */
    public get aspectRatio(): 'contain' | 'cover' | 'fill' {
        return this.$aspectRatio;
    }

    /**
     * Sets the aspect ratio mode of the canvas. This should match the `object-fit` property of the video.
     * @param aspectMode The aspect mode.
     */
    public set aspectRatio(aspectMode: 'contain' | 'cover' | 'fill') {
        this.$aspectRatio = aspectMode;

        // Update the canvas
        this.canvas.style.objectFit = this.$aspectRatio;
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
