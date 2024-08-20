import {PgsRendererImpl} from "./pgsRendererImpl";
import {PgsRendererOptions} from "./pgsRendererOptions";

/**
 * The base implementation for a pgs renderer in side a worker.
 */
export abstract class PgsRendererInWorker extends PgsRendererImpl {

    protected constructor(options: PgsRendererOptions) {
        super();

        // Init worker
        const workerUrl = options.workerUrl ?? 'libpgs.worker.js';
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = this.$onWorkerMessage;
    }

    public loadFromUrl(url: string): void {
        this.worker.postMessage({
            op: 'loadFromUrl',
            url: url,
        });
    }

    public loadFromBuffer(buffer: ArrayBuffer): void {
        this.worker.postMessage({
            op: 'loadFromBuffer',
            buffer: buffer,
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
