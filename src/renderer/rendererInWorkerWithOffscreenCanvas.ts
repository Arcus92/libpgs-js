import {SubtitleRendererOptions} from "../subtitleRendererOptions";
import {RendererInWorker} from "./rendererInWorker";

/**
 * A subtitle renderer running fully in a web-worker. It loads and renders the subtitles in the web-worker.
 * This requires browser support for web-workers and offscreen-canvas.
 */
export class RendererInWorkerWithOffscreenCanvas extends RendererInWorker {

    public constructor(options: SubtitleRendererOptions, canvas: HTMLCanvasElement) {
        super(options);

        // Initialize the worker with an offscreen-canvas. Rendering will occur in the worker thread.
        const offscreenCanvas = canvas.transferControlToOffscreen();
        this.worker.postMessage({
            op: 'init',
            canvas: offscreenCanvas,
        }, [offscreenCanvas]);
    }


    protected render(index: number): void {
        // Tells the worker to render the subtitle at this timestamp index.
        this.worker.postMessage({
            op: 'render',
            index: index
        });
    }
}
