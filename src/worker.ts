import {PgsRendererInternal} from "./pgsRendererInternal";

const renderer = new PgsRendererInternal();

// Inform the main process that the subtitle data was loaded and return all update timestamps
const sendLoadedMessage = () => {
    postMessage({
        op: 'loaded',
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
            renderer.loadFromUrlAsync(url).then(() => {
                sendLoadedMessage();
            });
            break;

        case 'loadFromBuffer':
            const buffer: ArrayBuffer = e.data.buffer;
            renderer.loadFromBuffer(buffer);

            sendLoadedMessage();
            break;

        case 'render':
            const index: number = e.data.index;
            renderer.renderAtIndex(index);
            break;
    }
}

