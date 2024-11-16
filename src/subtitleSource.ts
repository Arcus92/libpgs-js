import {SubtitleSourceType} from "./subtitleSourceType";
import {SubtitleFormat} from "./subtitleFormat";

export interface SubtitleSource {
    /**
     * Gets the type of this source for serialization.
     */
    get type(): SubtitleSourceType;

    /**
     * Gets the subtitle format for this source.
     */
    get format(): SubtitleFormat;
}
