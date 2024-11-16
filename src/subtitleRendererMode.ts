export enum SubtitleRendererMode {
    /**
     * A worker thread is used to load, build and render the subtitles. This requires OffscreenCanvas support.
     */
    worker = 'worker',

    /**
     * A worker thread is used to load and build the subtitles. They are rendered in the main thread.
     */
    workerWithoutOffscreenCanvas = 'workerWithoutOffscreenCanvas',

    /**
     * The subtitles are loaded, built and rendered in the main thread.
     */
    mainThread = 'mainThread',
}
