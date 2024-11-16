import {SubtitleFrame} from "./subtitleFrame";
import {SubtitleDecoderOptions} from "./subtitleDecoderOptions";
import {SubtitleFormat} from "./subtitleFormat";
import {SubtitleSource} from "./subtitleSource";
import {SubtitleDecoderHelper} from "./subtitleDecoderHelper";

export abstract class SubtitleDecoder {

    /**
     * Gets the format of this decoder.
     */
    public abstract get format(): SubtitleFormat;

    /**
     * The timestamps when a display set with the same index is presented.
     */
    public updateTimestamps: number[] = [];

    /**
     * Information about the next compiled subtitle data. This is calculated after the current subtitle is rendered.
     * So by the time the next subtitle change is requested, this should already be completed.
     */
    protected cachedSubtitleData?: { index: number, data: SubtitleFrame | undefined };

    /**
     * Pre-compiles and caches the subtitle data for the given index.
     * This will speed up the next call to `buildSubtitleDataAtIndex` with the same index.
     * @param index The index of the display set to cache.
     */
    public cacheSubtitleAtIndex(index: number) {
        // Pre-calculating the next subtitle, so it is ready whenever the next subtitle change is requested.
        const nextSubtitleData = this.getSubtitleAtIndex(index);
        this.cachedSubtitleData = { index: index, data: nextSubtitleData };
    }

    /**
     * Renders the subtitle at the given timestamp.
     * @param time The timestamp in seconds.
     */
    public getSubtitleAtTimestamp(time: number): SubtitleFrame | undefined {
        const index = SubtitleDecoderHelper.getIndexFromTimestamps(time, this.updateTimestamps);
        return this.getSubtitleAtIndex(index);
    }

    /**
     * Pre-compiles the required subtitle data (windows and pixel data) for the frame at the given index.
     * @param index The index of the display set to render.
     */
    public getSubtitleAtIndex(index: number): SubtitleFrame | undefined {
        // Check if this index was already cached.
        if (this.cachedSubtitleData && this.cachedSubtitleData.index === index) {
            return this.cachedSubtitleData.data;
        }

        return this.buildSubtitleAtIndex(index);
    }

    protected abstract buildSubtitleAtIndex(index: number): SubtitleFrame | undefined

    /**
     * Loads the subtitle from the given source.
     * @param source The source to load the PGS file.
     * @param options Optional loading options. Use `onProgress` as callback for partial update while loading.
     */
    public abstract load(source: SubtitleSource, options?: SubtitleDecoderOptions): Promise<void>;
}
