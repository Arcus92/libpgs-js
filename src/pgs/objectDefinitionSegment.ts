import {Segment} from "./segment";
import {SegmentType} from "./segmentType";
import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";

export class ObjectDefinitionSegment implements Segment {
    public id: number = 0;
    public versionNumber: number = 0;
    public lastInSequenceFlag: number = 0;
    public width: number = 0;
    public height: number = 0;
    public dataLength: number = 0;
    public data?: Uint8Array;

    public get isFirstInSequence(): boolean {
        return (this.lastInSequenceFlag & 0x80) != 0;
    }

    public get isLastInSequence(): boolean {
        return (this.lastInSequenceFlag & 0x40) != 0;
    }

    public get segmentType(): number {
        return SegmentType.objectDefinition;
    }

    public read(reader: BigEndianBinaryReader, length: number): void {
        this.id = reader.readUInt16();
        this.versionNumber = reader.readUInt8();
        this.lastInSequenceFlag = reader.readUInt8();

        // This is the total data length of ALL segments.
        // We need to add all data segments to encode the image.
        if (this.isFirstInSequence) {
            this.dataLength = reader.readUInt24();
            this.width = reader.readUInt16();
            this.height = reader.readUInt16();
            this.data = reader.readBytes(length - 11);
        } else {
            this.data = reader.readBytes(length - 4);
        }
    }
}
