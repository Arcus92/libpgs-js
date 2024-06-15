import {DisplaySet} from "./pgs/displaySet";
import {BigEndianBinaryReader} from "./utils/bigEndianBinaryReader";
import {RunLengthEncoding} from "./utils/runLengthEncoding";
import {CompositionObject} from "./pgs/presentationCompositionSegment";
import {CombinedBinaryReader} from "./utils/combinedBinaryReader";
import {PaletteDefinitionSegment} from "./pgs/paletteDefinitionSegment";
import {ObjectDefinitionSegment} from "./pgs/objectDefinitionSegment";
import {WindowDefinition} from "./pgs/windowDefinitionSegment";

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
     */
    public async loadFromUrlAsync(url: string): Promise<void> {
        const result = await fetch(url);
        const buffer = await result.arrayBuffer();
        this.loadFromBuffer(buffer);
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param buffer The PGS data.
     */
    public loadFromBuffer(buffer: ArrayBuffer): void {
        this.displaySets = [];
        this.updateTimestamps = [];
        const reader = new BigEndianBinaryReader(new Uint8Array(buffer));
        while (reader.position < reader.length) {
            const displaySet = new DisplaySet();
            displaySet.read(reader, true);
            this.displaySets.push(displaySet);
            this.updateTimestamps.push(displaySet.presentationTimestamp);
        }
    }

    // endregion

    // region Rendering

    private canvas?: OffscreenCanvas | HTMLCanvasElement;
    private context?: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

    /**
     * Sets the canvas to render to.
     * @param canvas The canvas to render to.
     */
    public setCanvas(canvas: OffscreenCanvas | HTMLCanvasElement): void {
        this.canvas = canvas;
        this.context = canvas.getContext('2d')! as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
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
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
                this.context?.drawImage(pixelData, window.horizontalPosition, window.verticalPosition);
            }
        }
    }


    private getPixelDataFromComposition(composition: CompositionObject, palette: PaletteDefinitionSegment,
                                        ctxObjects: ObjectDefinitionSegment[]):
        OffscreenCanvas | undefined {

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
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d')!;
        const imageData = context.createImageData(width, height);
        const buffer = imageData.data;

        // The pixel data is run-length encoded. The decoded value is the palette entry index.
        RunLengthEncoding.decode(data, (idx, x, y, value) => {
            const col = palette?.entries[value];
            if (!col) return;

            // Writing the four byte pixel data as RGBA.
            buffer[idx * 4] = col.r;
            buffer[idx * 4 + 1] = col.g;
            buffer[idx * 4 + 2] = col.b;
            buffer[idx * 4 + 3] = col.a;

        });
        context.putImageData(imageData, 0, 0);
        return canvas;
    }

    // endregion
}
