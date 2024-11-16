import {RendererImpl} from "./rendererImpl";
import {SubtitleRendererOptions} from "../subtitleRendererOptions";
import {SubtitleSource} from "../subtitleSource";

/**
 * The base implementation for a subtitle renderer inside a worker.
 */
export abstract class RendererInWorker extends RendererImpl {

    protected constructor(options: SubtitleRendererOptions) {
        super();

        // Init worker
        const workerUrl = options.workerUrl ?? 'libpgs.worker.js';
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = this.$onWorkerMessage;
    }

    public load(source: SubtitleSource): void {
        this.worker.postMessage({
            op: 'load',
            source: source,
        });
    }

    /**
     * The background worker.
     */
    protected readonly worker: Worker;

    /**
     * Handles messages from the worker.
     * @param e The event message.
     */
    private readonly $onWorkerMessage = (e: MessageEvent) => {
        this.onWorkerMessage(e);
    };

    /**
     * Handles messages from the worker.
     * @param e The event message.
     */
    protected onWorkerMessage(e: MessageEvent): void {
        switch (e.data.op) {
            // Is called once a subtitle file was loaded.
            case 'updateTimestamps': {
                this.setUpdateTimestamps(e.data.updateTimestamps);
                break;
            }
        }
    }

    /**
     * Disposes the renderer and terminates the worker.
     */
    public dispose(): void {
        this.worker.terminate();
    }
}
