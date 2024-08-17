import {PgsRendererInWorker} from "./pgsRendererInWorker";
import {SubtitleData} from "./subtitleData";
import {PgsRendererOptions} from "./pgsRendererOptions";
import {Renderer} from "./renderer";

/**
 * A subtitle renderer running partially in a web-worker. It loads the subtitles in the web-worker, but rendering is
 * done on the main thread. This still requires web-workers, but skips the requirement of the offscreen-canvas.
 */
export class PgsRendererInWorkerWithoutOffscreenCanvas extends PgsRendererInWorker {

    public constructor(options: PgsRendererOptions, canvas: HTMLCanvasElement) {
        super(options);

        this.renderer = new Renderer(canvas);

        // Initialize the worker without canvas.
        this.worker.postMessage({
            op: 'init'
        });
    }

    /**
     * The subtitle renderer, running in the main thread.
     */
    private readonly renderer: Renderer;

    protected render(index: number): void {
        // Tells the worker to response with the subtitle data for this timestamp index.
        this.worker.postMessage({
            op: 'requestSubtitleData',
            index: index
        });
    }


    protected onWorkerMessage(e: MessageEvent): void {
        switch (e.data.op) {
            // Is called when the requested subtitle data is returned.
            case 'subtitleData': {
                const subtitleData = e.data.subtitleData as SubtitleData;
                if (this.renderer) {
                    this.renderer.draw(subtitleData);
                }
                break;
            }

            default: {
                super.onWorkerMessage(e);
                break;
            }
        }
    }
}
