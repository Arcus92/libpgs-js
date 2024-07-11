import {DisplaySet} from "./pgs/displaySet";
import {BigEndianBinaryReader} from "./utils/bigEndianBinaryReader";
import {RunLengthEncoding} from "./utils/runLengthEncoding";
import {CompositionObject} from "./pgs/presentationCompositionSegment";
import {CombinedBinaryReader} from "./utils/combinedBinaryReader";
import {PaletteDefinitionSegment} from "./pgs/paletteDefinitionSegment";
import {ObjectDefinitionSegment} from "./pgs/objectDefinitionSegment";
import {WindowDefinition} from "./pgs/windowDefinitionSegment";
import {Rect} from "./utils/rect";
import {StreamBinaryReader} from "./utils/streamBinaryReader";
import {BinaryReader} from "./utils/binaryReader";
import {ArrayBinaryReader} from "./utils/arrayBinaryReader";

export interface PgsLoadOptions {
    /**
     * Async pgs streams can return partial updates. When invoked, the `displaySets` and `updateTimestamps` are updated
     * to the last available subtitle. There is a minimum threshold of one-second to prevent to many updates.
     */
    onProgress?: () => void;
}

/**
 * This handles the low-level PGS loading and rendering. This renderer can operate inside the web worker without being
 * linked to a video element.
 */
export class PgsRendererInternal {

    // region Subtitle

    /**
     * The currently loaded display sets.
     */
    public displaySets: DisplaySet[] = [];

    /**
     * The PGS timestamps when a display set with the same index is presented.
     */
    public updateTimestamps: number[] = [];

    /**
     * Loads the subtitle file from the given url.
     * @param url The url to the PGS file.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async loadFromUrl(url: string, options?: PgsLoadOptions): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const stream = response.body?.getReader()!;
        const reader = new StreamBinaryReader(stream)

        await this.loadFromReader(reader, options);
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param buffer The PGS data.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async loadFromBuffer(buffer: ArrayBuffer, options?: PgsLoadOptions): Promise<void> {
        await this.loadFromReader(new ArrayBinaryReader(new Uint8Array(buffer)), options);
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param reader The PGS data reader.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async loadFromReader(reader: BinaryReader, options?: PgsLoadOptions): Promise<void> {
        this.displaySets = [];
        this.updateTimestamps = [];

        let lastUpdateTime = performance.now();

        const bigEndianReader = new BigEndianBinaryReader(reader);
        while (!reader.eof) {
            const displaySet = new DisplaySet();
            await displaySet.read(bigEndianReader, true);
            this.displaySets.push(displaySet);
            this.updateTimestamps.push(displaySet.presentationTimestamp);

            // For async loading, we support frequent progress updates. Sending one update for every new display set
            // would be too much. Instead, we use a one-second threshold.
            if (options?.onProgress) {
                let now = performance.now();
                if (now > lastUpdateTime + 1000) {
                    lastUpdateTime = now;
                    options.onProgress();
                }
            }
        }

        // Call final update.
        if (options?.onProgress) {
            options.onProgress();
        }
    }

    // endregion

    // region Rendering

    private canvas?: OffscreenCanvas | HTMLCanvasElement;
    private context?: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

    // We keep track of the dirty area on the canvas. Clearing the whole canvas is slow when only a small area was used.
    private readonly dirtyArea = new Rect();

    /**
     * Sets the canvas to render to.
     * @param canvas The canvas to render to.
     */
    public setCanvas(canvas: OffscreenCanvas | HTMLCanvasElement): void {
        this.canvas = canvas;
        this.context = canvas.getContext('2d')! as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    }

    /**
     * Renders the subtitle at the given timestamp.
     * @param time The timestamp in seconds.
     */
    public renderAtTimestamp(time: number): void {
        time = time * 1000 * 90; // Convert to PGS time

        // All position before and after the available timestamps are invalid (-1).
        let index = -1;
        if (this.updateTimestamps.length > 0 && time < this.updateTimestamps[this.updateTimestamps.length - 1]) {

            // Find the last subtitle index for the given time stamp
            for (const updateTimestamp of this.updateTimestamps) {

                if (updateTimestamp > time) {
                    break;
                }
                index++;
            }
        }

        this.renderAtIndex(index);
    }

    /**
     * Renders the subtitle with the given index.
     * @param index The index of the display set to render.
     */
    public renderAtIndex(index: number): void {
        if (!this.canvas || !this.context) return;
        // Clear the canvas on invalid indices. It is possible to seek to a position before the first subtitle while
        // a later subtile is on screen. This subtitle must be clear, even there is no valid new subtitle data.
        // Ignoring the render would keep the previous subtitle on screen.
        if (!this.dirtyArea.empty) {
            this.context.clearRect(this.dirtyArea.x, this.dirtyArea.y, this.dirtyArea.width, this.dirtyArea.height);
            this.dirtyArea.reset();
        }
        if (index < 0 || index >= this.displaySets.length) {
            return;
        }

        const displaySet = this.displaySets[index];
        if (!displaySet.presentationComposition) return;

        // Resize the canvas if needed.
        if (this.canvas.width != displaySet.presentationComposition.width ||
            this.canvas.height != displaySet.presentationComposition.height) {
            this.canvas.width = displaySet.presentationComposition.width;
            this.canvas.height = displaySet.presentationComposition.height;
        }

        // We need to collect all valid objects and palettes up to this point. PGS can update and reuse elements from
        // previous display sets. The `compositionState` defines if the previous elements should be cleared.
        // If it is `0` previous elements should be kept. Because the user can seek through the file, we can not store
        // previous elements, and we should collect these elements for every new render.
        const ctxObjects: ObjectDefinitionSegment[] = [];
        const ctxPalettes: PaletteDefinitionSegment[] = [];
        const ctxWindows: WindowDefinition[] = [];
        let curIndex = index;
        while (curIndex >= 0) {
            // Because we are moving backwards, we would end up with the inverted array order.
            // We'll use `unshift` to add these elements to the front of the array.
            ctxObjects.unshift(...this.displaySets[curIndex].objectDefinitions);
            ctxPalettes.unshift(...this.displaySets[curIndex].paletteDefinitions);
            ctxWindows.unshift(...this.displaySets[curIndex].windowDefinitions
                .flatMap(w => w.windows));

            // Any other state that `0` frees all previous segments, so we can stop here.
            if (this.displaySets[curIndex].presentationComposition?.compositionState !== 0) {
                break;
            }

            curIndex--;
        }

        // Find the used palette for this composition.
        let palette = ctxPalettes
            .find(w => w.id === displaySet.presentationComposition?.paletteId);
        if (!palette) return;

        for (const compositionObject of displaySet.presentationComposition.compositionObjects) {
            // Find the window to draw on.
            let window = ctxWindows.find(w => w.id === compositionObject.windowId);
            if (!window) continue;

            // Builds the subtitle.
            const pixelData = this.getPixelDataFromComposition(compositionObject, palette, ctxObjects);
            if (pixelData) {
                this.context.drawImage(pixelData, window.horizontalPosition, window.verticalPosition);

                // Mark this area as dirty.
                this.dirtyArea.union(window.horizontalPosition, window.verticalPosition,
                    pixelData.width, pixelData.height);
            }
        }
    }

    private createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
        if (typeof document !== 'undefined') {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            return canvas;
        } else {
            return new OffscreenCanvas(width, height);
        }
    }

    private getPixelDataFromComposition(composition: CompositionObject, palette: PaletteDefinitionSegment,
                                        ctxObjects: ObjectDefinitionSegment[]):
        OffscreenCanvas | HTMLCanvasElement | undefined {

        // Multiple object definition can define a single subtitle image.
        // However, only the first element in sequence hold the image size.
        let width: number = 0;
        let height: number = 0;
        const dataChunks: Uint8Array[] = [];
        for (const ods of ctxObjects) {
            if (ods.id != composition.id) continue;
            if (ods.isFirstInSequence) {
                width = ods.width;
                height = ods.height;
            }

            if (ods.data) {
                dataChunks.push(ods.data);
            }
        }
        if (dataChunks.length == 0) {
            return undefined;
        }

        // Using a combined reader instead of stitching the data together.
        // This hopefully avoids a larger memory allocation.
        const data = new CombinedBinaryReader(dataChunks);

        // Building a canvas element with the subtitle image data.
        const canvas = this.createCanvas(width, height);
        const context = canvas.getContext('2d')! as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
        const imageData = context.createImageData(width, height);
        const imageBuffer = new Uint32Array(imageData.data.buffer);

        // The pixel data is run-length encoded. The decoded value is the palette entry index.
        RunLengthEncoding.decode(data, palette.rgba, imageBuffer);

        context.putImageData(imageData, 0, 0);
        return canvas;
    }

    // endregion
}
