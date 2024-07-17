import {PgsRendererInternal} from "./pgsRendererInternal";
import {PgsRendererResult} from "./pgsRendererResult";

const renderer = new PgsRendererInternal();

// Inform the main process about the renderer status update.
const sendProgressUpdate = (result: PgsRendererResult) => {
    postMessage({
        op: 'progress',
        result: result,
        updateTimestamps: renderer.updateTimestamps
    })
}

// Handles messages from the main thread.
onmessage = (e: MessageEvent) => {
    switch (e.data.op) {
        case 'init':
            const canvas: OffscreenCanvas = e.data.canvas;
            renderer.setCanvas(canvas);
            break;

        case 'loadFromUrl':
            const url: string = e.data.url;
            renderer.loadFromUrl(url, {
                onProgress: () => {
                    sendProgressUpdate(PgsRendererResult.Pending);
                }
            }).then((result) => {
                sendProgressUpdate(result);
            });
            break;

        case 'loadFromBuffer':
            const buffer: ArrayBuffer = e.data.buffer;
            renderer.loadFromBuffer(buffer).then((result) => {
                sendProgressUpdate(result);
            });

            break;

        case 'render':
            const index: number = e.data.index;
            requestAnimationFrame(() => {
                renderer.renderAtIndex(index);
            });
            break;
    }
}

