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

    public loadFromUrl(url: string): Promise<void> {
        this.worker.postMessage({
            op: 'loadFromUrl',
            url: url,
        });
        return new Promise((resolve, reject) => this.pendingLoads.push({resolve: resolve, reject: reject}));
    }

    public loadFromBuffer(buffer: ArrayBuffer): Promise<void> {
        this.worker.postMessage({
            op: 'loadFromBuffer',
            buffer: buffer,
        });
        return new Promise((resolve, reject) => this.pendingLoads.push({resolve: resolve, reject: reject}));
    }

    /**
     * The background worker.
     */
    protected readonly worker: Worker;

    /**
     * The loads the worker still has to answer, in the order it answers them.
     */
    private readonly pendingLoads: { resolve: () => void, reject: (error: Error) => void }[] = [];

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

            // Is called once a subtitle file was fully loaded, or failed to load.
            case 'loaded': {
                const pending = this.pendingLoads.shift();
                if (e.data.error) {
                    pending?.reject(new Error(e.data.error));
                } else {
                    pending?.resolve();
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
        // No answer is coming anymore, and being disposed is not a load failure.
        for (const pending of this.pendingLoads) {
            pending.resolve();
        }
    }
}
