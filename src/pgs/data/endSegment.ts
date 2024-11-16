import { BigEndianBinaryReader } from "../../utils/bigEndianBinaryReader";
import {Segment} from "./segment";
import {SegmentType} from "./segmentType";

export class EndSegment implements Segment {

    public get segmentType(): number {
        return SegmentType.end;
    }

    public read(reader: BigEndianBinaryReader, length: number): void {
        // No data to read
    }

}
