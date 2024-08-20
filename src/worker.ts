import {Renderer} from "./renderer";
import {Pgs} from "./pgs";

const pgs = new Pgs();
let renderer: Renderer | undefined = undefined;

// Inform the main process that the subtitle data was loaded and return all update timestamps
const submitTimestamps = () => {
    postMessage({
        op: 'updateTimestamps',
        updateTimestamps: pgs.updateTimestamps
    })
}

// Handles messages from the main thread.
onmessage = (e: MessageEvent) => {
    switch (e.data.op) {

        // Initialized the worker thread and receives the canvas (if supported).
        case 'init': {
            const canvas: OffscreenCanvas = e.data.canvas;

            // The canvas is optional. If provided, the web-worker can use it to render the subtitles.
            if (canvas) {
                renderer = new Renderer(canvas);
            }
            break;
        }

        // Tells the worker to load a subtitle file from an url.
        case 'loadFromUrl': {
            const url: string = e.data.url;
            pgs.loadFromUrl(url, {
                onProgress: () => {
                    submitTimestamps();
                }
            }).then(() => {
                submitTimestamps();
            });
            break;
        }

        // Tells the worker to load a subtitle file from the given buffer.
        case 'loadFromBuffer': {
            const buffer: ArrayBuffer = e.data.buffer;
            pgs.loadFromBuffer(buffer).then(() => {
                submitTimestamps();
            });

            break;
        }

        // Renders the subtitle at the given index inside the worker.
        // This is only supported if a canvas was provided to the worker.
        case 'render': {
            const index: number = e.data.index;
            const subtitleData = pgs.getSubtitleAtIndex(index);
            requestAnimationFrame(() => {
                renderer?.draw(subtitleData);
            });
            pgs.cacheSubtitleAtIndex(index + 1);
            break;
        }

        // Requests to build the subtitle pixel data.
        case 'requestSubtitleData': {
            const index: number = e.data.index;
            const subtitleData = pgs.getSubtitleAtIndex(index);

            // Returns the data to the main thread.
            postMessage({
                op: 'subtitleData',
                index: index,
                subtitleData: subtitleData
            })

            pgs.cacheSubtitleAtIndex(index + 1);
            break;
        }
    }
}

