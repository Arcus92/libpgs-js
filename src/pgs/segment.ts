import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";

export interface Segment {
    /// Gets the segment type
    get segmentType() : number;

    /// Reads the segment from the data stream
    read(reader: BigEndianBinaryReader, length: number): void;
}
