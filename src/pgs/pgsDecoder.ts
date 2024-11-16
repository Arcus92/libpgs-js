import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";
import {DisplaySet} from "./data/displaySet";
import {BinaryReader} from "../utils/binaryReader";
import {ArrayBinaryReader} from "../utils/arrayBinaryReader";
import {SubtitleFrameElement, SubtitleFrame} from "../subtitleFrame";
import {CompositionObject} from "./data/presentationCompositionSegment";
import {PaletteDefinitionSegment} from "./data/paletteDefinitionSegment";
import {ObjectDefinitionSegment} from "./data/objectDefinitionSegment";
import {CombinedBinaryReader} from "../utils/combinedBinaryReader";
import {RunLengthEncoding} from "../utils/runLengthEncoding";
import {WindowDefinition} from "./data/windowDefinitionSegment";
import {SubtitleDecoderOptions} from "../subtitleDecoderOptions";
import {SubtitleDecoder} from "../subtitleDecoder";
import {SubtitleFormat} from "../subtitleFormat";
import {SubtitleSource} from "../subtitleSource";
import {PgsFromUrl} from "./pgsFromUrl";
import {PgsFromBuffer} from "./pgsFromBuffer";
import {Reader} from "../utils/reader";

/**
 * The PGS subtitle decoder class. This can load and cache sup files from a buffer or url.
 * It can also build image data for a given timestamp or timestamp index.
 */
export class PgsDecoder extends SubtitleDecoder {

    /**
     * The decoder format.
     */
    public format: SubtitleFormat = SubtitleFormat.pgs;

    /**
     * The currently loaded display sets.
     */
    public displaySets: DisplaySet[] = [];

    /**
     * Loads the subtitle from the given source.
     * @param source The source to load the PGS file.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async load(source: SubtitleSource, options?: SubtitleDecoderOptions): Promise<void> {
        if (source instanceof PgsFromUrl) {
            await this.loadFromUrl(source.url, options);
        } else if (source instanceof PgsFromBuffer) {
            await this.loadFromBuffer(source.buffer, options);
        } else {
            throw new Error(`Unsupported source '${source.type}' for PgsDecoder!`);
        }
    }

    /**
     * Loads the subtitle file from the given url.
     * @param url The url to the PGS file.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async loadFromUrl(url: string, options?: SubtitleDecoderOptions): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = await Reader.fromResponse(response);

        await this.loadFromReader(reader, options);
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param buffer The PGS data.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async loadFromBuffer(buffer: ArrayBuffer, options?: SubtitleDecoderOptions): Promise<void> {
        await this.loadFromReader(new ArrayBinaryReader(new Uint8Array(buffer)), options);
    }

    /**
     * Loads the subtitle file from the given buffer.
     * @param reader The PGS data reader.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public async loadFromReader(reader: BinaryReader, options?: SubtitleDecoderOptions): Promise<void> {
        this.displaySets = [];
        this.updateTimestamps = [];
        this.cachedSubtitleData = undefined;

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

    /**
     * Pre-compiles the required subtitle data (windows and pixel data) for the frame at the given index.
     * @param index The index of the display set to render.
     */
    public buildSubtitleAtIndex(index: number): SubtitleFrame | undefined {
        if (index < 0 || index >= this.displaySets.length) {
            return;
        }

        const displaySet = this.displaySets[index];
        if (!displaySet.presentationComposition) return;

        // We need to collect all valid objects and palettes up to this point. PGS can update and reuse elements from
        // previous display sets. The `compositionState` defines if the previous elements should be cleared.
        // If it is `0` previous elements should be kept. Because the user can seek through the file, we can not store
        // previous elements, and we should collect these elements for every new render.
        const ctxObjects: ObjectDefinitionSegment[] = [];
        const ctxPalettes: PaletteDefinitionSegment[] = [];
        const ctxWindows: WindowDefinition[] = [];
        let curIndex = index;
        while (curIndex >= 0) {
            const displaySet = this.displaySets[curIndex];
            // Because we are moving backwards, we would end up with the inverted array order.
            // We'll use `unshift` to add these elements to the front of the array.
            ctxObjects.unshift(...displaySet.objectDefinitions);
            ctxPalettes.unshift(...displaySet.paletteDefinitions);
            // `flatMap` is available since Chrome 69.
            for (const windowDefinition of displaySet.windowDefinitions) {
                ctxWindows.unshift(...windowDefinition.windows);
            }

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

        const compositionData: SubtitleFrameElement[] = [];
        for (const compositionObject of displaySet.presentationComposition.compositionObjects) {
            // Find the window to draw on.
            let window = ctxWindows.find(w => w.id === compositionObject.windowId);
            if (!window) continue;

            // Builds the subtitle.
            const pixelData = this.getPixelDataFromComposition(compositionObject, palette, ctxObjects);
            if (pixelData) {
                compositionData.push(new SubtitleFrameElement(pixelData,
                    compositionObject.horizontalPosition, compositionObject.verticalPosition,
                    compositionObject.hasCropping,
                    compositionObject.croppingHorizontalPosition, compositionObject.croppingVerticalPosition,
                    compositionObject.croppingWidth, compositionObject.croppingHeight));
            }
        }

        if (compositionData.length === 0) return;

        return new SubtitleFrame(displaySet.presentationComposition.width, displaySet.presentationComposition.height,
            compositionData);
    }


    private getPixelDataFromComposition(composition: CompositionObject, palette: PaletteDefinitionSegment,
                                        ctxObjects: ObjectDefinitionSegment[]): ImageData | undefined {
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

        // Detect if we are running in a web-worker or in main browser
        if (typeof document !== 'undefined') {
            // We have to use the canvas api to create image data.
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;
            const imageData = context.createImageData(width, height);
            const imageBuffer = new Uint32Array(imageData.data.buffer);

            // The pixel data is run-length encoded. The decoded value is the palette entry index.
            RunLengthEncoding.decode(data, palette.rgba, imageBuffer);

            return imageData;
        } else {
            // Building a canvas element with the subtitle image data.
            const imageBuffer = new Uint32Array(width * height);

            // The pixel data is run-length encoded. The decoded value is the palette entry index.
            RunLengthEncoding.decode(data, palette.rgba, imageBuffer);

            // We can use the image data constructor in web-workers.
            return new ImageData(new Uint8ClampedArray(imageBuffer.buffer), width, height);
        }
    }

}
