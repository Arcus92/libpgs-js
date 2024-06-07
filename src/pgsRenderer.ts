import {DisplaySet} from "./pgs/displaySet";
import {BigEndianBinaryReader} from "./utils/bigEndianBinaryReader";
import {runLengthEncoding} from "./utils/runLengthEncoding";
import {CompositionObject} from "./pgs/presentationCompositionSegment";
import {PgsRendererOptions} from "./pgsRendererOptions";

/**
 * Renders PGS subtitle on-top of a video element.
 */
export class PgsRenderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly canvasOwner: boolean;
    private readonly context: CanvasRenderingContext2D;
    private readonly video?: HTMLVideoElement;
    private displaySets: DisplaySet[] = [];
    private currentIndex: number = -1;

    public constructor(options: PgsRendererOptions) {
        if (options.video) {
            this.video = options.video;
        }

        if (options.canvas) {
            this.canvas = options.canvas;
            this.canvasOwner = false;
        } else if (this.video) {
            this.canvas = this.createCanvasElement();
            this.canvasOwner = true;
            this.video.parentElement!.appendChild(this.canvas);
        } else {
            throw new Error('No canvas or video element was provided!');
        }

        this.context = this.canvas.getContext('2d')!;

        this.registerEvents();

        // Load the initial subtitle file
        if (options.fileUrl) {
            this.loadFromUrlAsync(options.fileUrl).then();
        }
    }

    private createCanvasElement(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.right = '0';
        canvas.style.bottom = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.objectFit = 'contain';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        return canvas;
    }

    private destroyCanvasElement() {
        this.canvas.remove();
    }

    private registerEvents(): void {
        if (this.video) {
            this.video.addEventListener('timeupdate', this.onTimeUpdate);
        }
    }

    private unregisterEvents(): void {
        if (this.video) {
            this.video.removeEventListener('timeupdate', this.onTimeUpdate);
        }
    }

    private onTimeUpdate = (e: Event): void => {
        if (this.video) {
            this.renderAtTimestamp(this.video.currentTime);
        }
    }

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
        const reader = new BigEndianBinaryReader(new Uint8Array(buffer));
        while (reader.position < reader.length) {
            const displaySet = new DisplaySet();
            displaySet.read(reader, true);
            this.displaySets.push(displaySet);
        }
    }

    /**
     * Renders the subtitle for the given timestamp.
     * @param time The timestamp in seconds.
     */
    public renderAtTimestamp(time: number): void {
        let index = -1;
        time = time * 1000 * 90; // Convert to PGS time
        for (const displaySet of this.displaySets) {

            if (displaySet.presentationTimestamp > time) {
                break;
            }
            index++;
        }
        if (this.currentIndex == index) return;
        this.currentIndex = index;

        if (index < 0) return;
        const displaySet= this.displaySets[index];
        this.renderDisplaySet(displaySet);
    }

    private renderDisplaySet(displaySet: DisplaySet) {
        if (!displaySet.presentationComposition) return;

        // Setting the width and height will also clear the canvas
        this.canvas.width = displaySet.presentationComposition.width;
        this.canvas.height = displaySet.presentationComposition.height;

        for (const composition of displaySet.presentationComposition.compositionObjects) {
            this.renderComposition(displaySet, composition);
        }
    }

    private renderComposition(displaySet: DisplaySet, composition: CompositionObject): void {
        if (!displaySet.presentationComposition) return;
        let window = displaySet.windowDefinitions
            .flatMap(w => w.windows).find(w => w.id === composition.windowId);
        if (!window) return;

        const pixelData = this.getPixelDataFromComposition(displaySet, composition);
        if (pixelData) {
            this.context.drawImage(pixelData, window.horizontalPosition, window.verticalPosition);
        }
    }

    private getPixelDataFromComposition(displaySet: DisplaySet, composition: CompositionObject): HTMLCanvasElement | undefined {
        if (!displaySet.presentationComposition) return undefined;
        let palette = displaySet.paletteDefinitions
            .find(p => p.id === displaySet.presentationComposition?.paletteId);
        if (!palette) return undefined;

        // Collect meta data
        let width: number = 0;
        let height: number = 0;
        let dataLength: number = 0;
        const dataChunks: Uint8Array[] = [];
        for (const ods of displaySet.objectDefinitions) {
            if (ods.id != composition.id) continue;
            if (ods.isFirstInSequence) {
                width = ods.width;
                height = ods.height;
            }

            if (ods.data) {
                dataLength += ods.data.length;
                dataChunks.push(ods.data);
            }
        }
        if (dataLength == 0) {
            return undefined;
        }

        // Merge the data into one binary blob.
        // TODO: Make this more memory efficient...
        const runLengthData = new Uint8Array(dataLength);
        let offset: number = 0;
        for (const dataChunk of dataChunks) {
            runLengthData.set(dataChunk, offset);
            offset += dataChunk.length;
        }

        // Building the subtitle image.
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = width;
        canvas.height = height;
        const imageData = context.createImageData(width, height);
        const buffer = imageData.data;

        // The pixel data is run-length encoded. The value is the palette entry index.
        runLengthEncoding(runLengthData, (idx, x, y, value) => {
            const col = palette?.entries[value];
            if (!col) return;
            buffer[idx * 4] = col.r;
            buffer[idx * 4 + 1] = col.g;
            buffer[idx * 4 + 2] = col.b;
            buffer[idx * 4 + 3] = col.a;

        });
        context.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Destroys the subtitle canvas and removes event listeners.
     */
    public dispose(): void {
        this.unregisterEvents();

        // Do not destroy the canvas if it was provided from an external source.
        if (this.canvasOwner) {
            this.destroyCanvasElement();
        }

        // Clear memory
        this.displaySets = [];
    }
}
