import {SubtitleDecoderHelper} from "../subtitleDecoderHelper";
import {SubtitleSource} from "../subtitleSource";

/**
 * The base for handling subtitle loading and rendering. There are different ways to render a subtitle file.
 * Modern browser support a more efficient asynchrone method using a web-worker.
 * But if this isn't working for the current browser a more compatible implementation can be used.
 */
export abstract class RendererImpl {

    private updateTimestamps: number[] = [];
    private previousTimestampIndex: number = 0;

    /**
     * Is called when the timestamps were updated.
     */
    public onTimestampsUpdated?: () => void;

    /**
     * Sets the update timestamps and invokes an update event.
     * @param updateTimestamps The new array of update timestamps.
     */
    protected setUpdateTimestamps(updateTimestamps: number[]): void {
        // Stores the update timestamps, so we don't need to push the timestamp to the worker on every tick.
        // Instead, we push the timestamp index if it was changed.
        this.updateTimestamps = updateTimestamps;

        // Notify timestamp updates.
        if (this.onTimestampsUpdated) {
            this.onTimestampsUpdated();
        }
    }

    /**
     * Renders the subtitle for the given timestamp.
     * @param time The timestamp in seconds.
     */
    public renderAtTimestamp(time: number): void {
        const index = SubtitleDecoderHelper.getIndexFromTimestamps(time, this.updateTimestamps);
        this.renderAtIndex(index);
    }

    /**
     * Renders the subtitle at the given timestamp index.
     * @param index The timestamp index.
     */
    public renderAtIndex(index: number): void {
        // Only render if the subtitle index was changed!
        if (this.previousTimestampIndex === index) return;
        this.previousTimestampIndex = index;

        this.render(index);
    }

    /**
     * Renders the subtitle at the given timestamp index. Internal render method to overwrite.
     * @param index The timestamp index.
     */
    protected abstract render(index: number): void;

    /**
     * Loads the subtitle from the given source.
     * @param source The subtitle source.
     */
    public abstract load(source: SubtitleSource): void;

    /**
     * Disposes the renderer.
     */
    public abstract dispose(): void;
}
