import {SubtitleDecoder} from "./subtitleDecoder";
import {PgsDecoder} from "./pgs/pgsDecoder";
import {SubtitleFormat} from "./subtitleFormat";
import {SubtitleSource} from "./subtitleSource";
import {SubtitleSourceType} from "./subtitleSourceType";
import {PgsFromUrl} from "./pgs/pgsFromUrl";
import {PgsFromBuffer} from "./pgs/pgsFromBuffer";

export abstract class SubtitleLoader {

    /**
     * Creates a decoder for the given format. If the current decoder already supports the format it is returned and
     * no new instance is created.
     * @param format The subtitle format.
     * @param currentDecoder The previous decoder.
     */
    public static createDecoder(format: SubtitleFormat, currentDecoder: SubtitleDecoder | undefined = undefined): SubtitleDecoder {
        if (currentDecoder && currentDecoder.format === format) {
            return currentDecoder;
        }

        switch (format) {
            case SubtitleFormat.pgs:
                return new PgsDecoder();

            default:
                throw new Error(`Unsupported format ${format}!`);
        }
    }

    /**
     * Deserializes the subtitle source. Used when the source is read from a worker message.
     * @param data The data object.
     */
    public static deserializeSource(data: any): SubtitleSource {
        const type = data.type as SubtitleSourceType;
        switch (type) {
            case SubtitleSourceType.pgsFromUrl:
                return new PgsFromUrl(data.url as string);
            case SubtitleSourceType.pgsFromBuffer:
                return new PgsFromBuffer(data.buffer as ArrayBuffer);
            default:
                throw new Error(`Unsupported source type ${type}!`);
        }
    }
}
