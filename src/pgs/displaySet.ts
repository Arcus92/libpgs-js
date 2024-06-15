import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";
import {PresentationCompositionSegment} from "./presentationCompositionSegment";
import {PaletteDefinitionSegment} from "./paletteDefinitionSegment";
import {ObjectDefinitionSegment} from "./objectDefinitionSegment";
import {WindowDefinitionSegment} from "./windowDefinitionSegment";
import {SegmentType} from "./segmentType";

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
    public read(reader: BigEndianBinaryReader, includeHeader: boolean) {

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
                const magicNumber = reader.readUInt16();
                if (magicNumber != 0x5047) {
                    throw new Error("Invalid magic number!");
                }

                presentationTimestamp = reader.readUInt32();
                decodingTimestamp = reader.readUInt32();
            }

            const type = reader.readUInt8();
            const size = reader.readUInt16()
            switch (type) {
                case SegmentType.paletteDefinition:
                    const pds = new PaletteDefinitionSegment();
                    pds.read(reader, size);
                    this.paletteDefinitions.push(pds);
                    break;
                case SegmentType.objectDefinition:
                    const ods = new ObjectDefinitionSegment();
                    ods.read(reader, size);
                    this.objectDefinitions.push(ods);
                    break;
                case SegmentType.presentationComposition:
                    const pcs = new PresentationCompositionSegment();
                    pcs.read(reader, size);
                    this.presentationComposition = pcs;

                    // SubtitleEdit only writes the relevant timestamp to the PCS.
                    this.presentationTimestamp = presentationTimestamp;
                    this.decodingTimestamp = decodingTimestamp;
                    break;
                case SegmentType.windowDefinition:
                    const wds = new WindowDefinitionSegment();
                    wds.read(reader, size);
                    this.windowDefinitions.push(wds);
                    break;
                case SegmentType.end:
                    return;
                default:
                    throw new Error(`Unsupported segment type ${type}`);
            }
        }
    }
}
