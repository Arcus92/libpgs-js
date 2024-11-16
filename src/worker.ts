// Polyfills
import "core-js/stable/array/find";
import "core-js/stable/promise";
import "whatwg-fetch";

import {Renderer} from "./renderer/renderer";
import {SubtitleLoader} from "./subtitleLoader";
import {SubtitleDecoder} from "./subtitleDecoder";

let decoder: SubtitleDecoder | undefined = undefined;
let renderer: Renderer | undefined = undefined;

// Inform the main process that the subtitle data was loaded and return all update timestamps
const submitTimestamps = () => {
    if (!decoder) return;
    postMessage({
        op: 'updateTimestamps',
        updateTimestamps: decoder.updateTimestamps
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

        // Tells the worker to load a subtitle file from a source.
        case 'load': {
            const source = SubtitleLoader.deserializeSource(e.data.source);
            decoder = SubtitleLoader.createDecoder(source.format, decoder);
            decoder.load(source, {
                onProgress: () => {
                    submitTimestamps();
                }
            }).then(() => {
                submitTimestamps();
            });
            break;
        }

        // Renders the subtitle at the given index inside the worker.
        // This is only supported if a canvas was provided to the worker.
        case 'render': {
            if (!decoder) return;
            const index: number = e.data.index;
            const subtitleData = decoder.getSubtitleAtIndex(index);
            requestAnimationFrame(() => {
                renderer?.draw(subtitleData);
            });
            decoder.cacheSubtitleAtIndex(index + 1);
            break;
        }

        // Requests to build the subtitle pixel data.
        case 'requestSubtitleData': {
            if (!decoder) return;
            const index: number = e.data.index;
            const subtitleData = decoder.getSubtitleAtIndex(index);

            // Returns the data to the main thread.
            postMessage({
                op: 'subtitleData',
                index: index,
                subtitleData: subtitleData
            })

            decoder.cacheSubtitleAtIndex(index + 1);
            break;
        }
    }
}

