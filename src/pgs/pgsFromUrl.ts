import {SubtitleSource} from "../subtitleSource";
import {SubtitleFormat} from "../subtitleFormat";
import {SubtitleSourceType} from "../subtitleSourceType";

/**
 * Source class to load a PGS subtitle from an url.
 */
export class PgsFromUrl implements SubtitleSource {

    public constructor(url: string) {
        this.url = url;
    }

    /**
     * The type of this source, used for deserialization.
     */
    public readonly type: SubtitleSourceType = SubtitleSourceType.pgsFromUrl;

    /**
     * The subtitle format. This is important to create the correct decoder.
     */
    public readonly format: SubtitleFormat = SubtitleFormat.pgs;

    /**
     * The url to load the PGS file.
     */
    public readonly url: string;


}
