import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";
import {PresentationCompositionSegment} from "./presentationCompositionSegment";
import {PaletteDefinitionSegment} from "./paletteDefinitionSegment";
import {ObjectDefinitionSegment} from "./objectDefinitionSegment";
import {WindowDefinitionSegment} from "./windowDefinitionSegment";
import {SegmentType} from "./segmentType";
import {PgsRendererResult} from "../pgsRendererResult";

/**
 * The PGS display set holds all data for the current subtitle update at a given timestamp.
 */
export class DisplaySet {
    public presentationTimestamp: number = 0;
    public decodingTimestamp: number = 0;
    public presentationComposition?: PresentationCompositionSegment;
    public paletteDefinitions: PaletteDefinitionSegment[] = [];
    public objectDefinitions: ObjectDefinitionSegment[] = [];
    public windowDefinitions: WindowDefinitionSegment[] = [];

    /**
     * Reads a display set from the given binary reader. The current data is cleared.
     * @param reader The binary reader to read from.
     * @param includeHeader If true, the magic-number and timestamps are read. If false, reading starts at the first
     * segment.
     */
    public async read(reader: BigEndianBinaryReader, includeHeader: boolean): Promise<PgsRendererResult> {

        // Clear
        this.presentationTimestamp = 0;
        this.decodingTimestamp = 0;
        this.presentationComposition = undefined;
        this.paletteDefinitions = [];
        this.objectDefinitions = [];
        this.windowDefinitions = [];

        while (true)
        {
            let presentationTimestamp: number = 0;
            let decodingTimestamp: number = 0;

            // The header is included before every segment. Even for the end segment.
            if (includeHeader)
            {
                if (!await reader.requestData(10)) {
                    console.error(`[libpgs] Unexpected end of stream at 0x${reader.position.toString(16)}`);
                    return PgsRendererResult.ErrUnexpectedEndOfStream;
                }
                const magicNumber = reader.readUInt16();
                if (magicNumber != 0x5047) {
                    console.error(`[libpgs] Invalid magic number: Expected: 0x5047 - Given: 0x${magicNumber.toString(16)}`);
                    return PgsRendererResult.ErrInvalidMagicNumber;
                }

                presentationTimestamp = reader.readUInt32();
                decodingTimestamp = reader.readUInt32();
            }

            if (!await reader.requestData(3)) {
                console.error(`[libpgs] Unexpected end of stream at 0x${reader.position.toString(16)}`);
                return PgsRendererResult.ErrUnexpectedEndOfStream;
            }
            const segmentType = reader.readUInt8();
            const segmentSize = reader.readUInt16();
            const segmentStart = reader.position;

            if (!await reader.requestData(segmentSize)) {
                console.error(`[libpgs] Unexpected end of stream at 0x${reader.position.toString(16)}`);
                return PgsRendererResult.ErrUnexpectedEndOfStream;
            }
            switch (segmentType) {
                case SegmentType.paletteDefinition:
                    const pds = new PaletteDefinitionSegment();
                    pds.read(reader, segmentSize);
                    this.paletteDefinitions.push(pds);
                    break;
                case SegmentType.objectDefinition:
                    const ods = new ObjectDefinitionSegment();
                    ods.read(reader, segmentSize);
                    this.objectDefinitions.push(ods);
                    break;
                case SegmentType.presentationComposition:
                    const pcs = new PresentationCompositionSegment();
                    pcs.read(reader, segmentSize);
                    this.presentationComposition = pcs;

                    // SubtitleEdit only writes the relevant timestamp to the PCS.
                    this.presentationTimestamp = presentationTimestamp;
                    this.decodingTimestamp = decodingTimestamp;
                    break;
                case SegmentType.windowDefinition:
                    const wds = new WindowDefinitionSegment();
                    wds.read(reader, segmentSize);
                    this.windowDefinitions.push(wds);
                    break;
                case SegmentType.end:
                    return PgsRendererResult.Success;
                default:
                    console.error(`[libpgs] Unknown segment type: 0x${segmentType.toString(16)}`);
                    return PgsRendererResult.ErrUnknownSegment;
            }

            // Validates the current stream position
            const expectedPosition = segmentStart + segmentSize;
            if (reader.position !== expectedPosition) {
                console.error(`[libpgs] Invalid stream position after segment. Expected: 0x${expectedPosition.toString(16)} - Given: 0x${reader.position.toString(16)}`);
                return PgsRendererResult.ErrStreamPositionMismatch;
            }
        }
    }
}
