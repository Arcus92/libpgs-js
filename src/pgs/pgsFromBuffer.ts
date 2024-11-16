import {SubtitleSource} from "../subtitleSource";
import {SubtitleSourceType} from "../subtitleSourceType";
import {SubtitleFormat} from "../subtitleFormat";

/**
 * Source class to load a PGS subtitle from a buffer.
 */
export class PgsFromBuffer implements SubtitleSource {

    public constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
    }

    /**
     * The type of this source, used for deserialization.
     */
    public readonly type: SubtitleSourceType = SubtitleSourceType.pgsFromBuffer;

    /**
     * The subtitle format. This is important to create the correct decoder.
     */
    public readonly format: SubtitleFormat = SubtitleFormat.pgs;

    /**
     * The buffer to load the PGS file.
     */
    public readonly buffer: ArrayBuffer;
}
