export interface PgsRendererOptions {
    /**
     * The video element to sync the subtitle to.
     * Optional, if you provide a custom canvas and use `renderAtTimestamp` to manually update the timestamp.
     */
    video?: HTMLVideoElement;

    /**
     * The initial canvas element to draw the subtitles to.
     * If not provided, the renderer creates its own canvas next to the video element.
     */
    canvas?: HTMLCanvasElement;

    /**
     * The initial subtitle file url to load from.
     */
    subUrl?: string;
}
