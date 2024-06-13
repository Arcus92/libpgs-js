import {DisplaySet} from "./pgs/displaySet";
import {BigEndianBinaryReader} from "./utils/bigEndianBinaryReader";
import {RunLengthEncoding} from "./utils/runLengthEncoding";
import {CompositionObject} from "./pgs/presentationCompositionSegment";
import {CombinedBinaryReader} from "./utils/combinedBinaryReader";

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
        if (index < 0 || index >= this.displaySets.length) return;
        this.renderDisplaySet(this.displaySets[index]);
    }

    private renderDisplaySet(displaySet: DisplaySet): void {
        if (!this.canvas) return;
        if (!displaySet.presentationComposition) return;

        // Setting the width and height will also clear the canvas.
        this.canvas.width = displaySet.presentationComposition.width;
        this.canvas.height = displaySet.presentationComposition.height;

        for (const composition of displaySet.presentationComposition.compositionObjects) {
            this.renderDisplaySetComposition(displaySet, composition);
        }
    }

    private renderDisplaySetComposition(displaySet: DisplaySet, composition: CompositionObject): void {
        if (!this.context) return;
        if (!displaySet.presentationComposition) return;
        let window = displaySet.windowDefinitions
            .flatMap(w => w.windows)
            .find(w => w.id === composition.windowId);
        if (!window) return;

        const pixelData = this.getPixelDataFromDisplaySetComposition(displaySet, composition);
        if (pixelData) {
            this.context.drawImage(pixelData, window.horizontalPosition, window.verticalPosition);
        }
    }

    private getPixelDataFromDisplaySetComposition(displaySet: DisplaySet, composition: CompositionObject):
        OffscreenCanvas | undefined {
        if (!displaySet.presentationComposition) return undefined;
        let palette = displaySet.paletteDefinitions
            .find(p => p.id === displaySet.presentationComposition?.paletteId);
        if (!palette) return undefined;

        // Multiple object definition can define a single subtitle image.
        // However, only the first element in sequence hold the image size.
        let width: number = 0;
        let height: number = 0;
        const dataChunks: Uint8Array[] = [];
        for (const ods of displaySet.objectDefinitions) {
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
