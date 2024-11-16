import {BigEndianBinaryReader} from "../../utils/bigEndianBinaryReader";

export interface Segment {
    /**
     * Gets the {@link SegmentType} identifier byte.
     */
    get segmentType() : number;

    /**
     * Reads the segment from the data stream.
     * @param reader The binary reader to read from.
     * @param length The length of the segment in bytes.
     */
    read(reader: BigEndianBinaryReader, length: number): void;
}
