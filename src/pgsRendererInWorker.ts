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

    /**
     * Tells the worker to load the subtitle file from the given url.
     * @param url The url to the PGS file.
     */
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
                // Stores the update timestamps, so we don't need to push the timestamp to the worker on every tick.
                // Instead, we push the timestamp index if it was changed.
                this.updateTimestamps = e.data.updateTimestamps;

                // Notify timestamp updates.
                if (this.onTimestampsUpdated) {
                    this.onTimestampsUpdated();
                }
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
