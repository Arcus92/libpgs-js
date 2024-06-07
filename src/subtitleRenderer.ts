import {DisplaySet} from "./pgs/displaySet";
import {BigEndianBinaryReader} from "./utils/bigEndianBinaryReader";
import {runLengthEncoding} from "./utils/runLengthEncoding";
import {CompositionObject} from "./pgs/presentationCompositionSegment";

export class SubtitleRenderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly video: HTMLVideoElement;
    private displaySets: DisplaySet[] = [];
    private currentIndex: number = -1;

    public constructor(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
        this.canvas = canvas;
        this.video = video;
        this.context = canvas.getContext('2d')!;

        this.video.addEventListener('timeupdate', (e) => this.onTimeUpdate(e));
    }

    private onTimeUpdate(e: Event) {
        this.renderDisplaySetAt(this.video.currentTime);
    }

    public async loadFromUrlAsync(url: string) {
        const result = await fetch(url);
        const buffer = await result.arrayBuffer();
        this.loadFromBuffer(buffer);
    }

    public loadFromBuffer(buffer: ArrayBuffer) {
        this.displaySets = [];
        const reader = new BigEndianBinaryReader(new Uint8Array(buffer));
        while (reader.position < reader.length) {
            const displaySet = new DisplaySet();
            displaySet.read(reader, true);
            this.displaySets.push(displaySet);
        }
    }

    public renderDisplaySetAt(time: number): void {
        let index = -1;
        time = time * 1000 * 90;
        for (const displaySet of this.displaySets) {

            if (displaySet.presentationTimestamp > time) {
                break;
            }
            index++;
        }
        if (this.currentIndex == index) return;
        this.currentIndex = index;

        console.log('Subtitle update!');

        if (index < 0) return;
        const displaySet= this.displaySets[index];
        this.renderDisplaySet(displaySet);
    }

    private renderDisplaySet(displaySet: DisplaySet) {
        if (!displaySet.presentationComposition) return;

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
}
