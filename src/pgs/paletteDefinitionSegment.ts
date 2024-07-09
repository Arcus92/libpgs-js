import {Segment} from "./segment";
import {SegmentType} from "./segmentType";
import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";

export class PaletteDefinitionSegment implements Segment {
    public id: number = 0;
    public versionNumber: number = 0;
    public rgba: number[] = [];

    public get segmentType(): number {
        return SegmentType.paletteDefinition;
    }

    public read(reader: BigEndianBinaryReader, length: number): void {
        this.id = reader.readUInt8();
        this.versionNumber = reader.readUInt8();

        const count = (length - 2) / 5;

        // Creates a buffer to store the mapping as the 4 byte color data.
        const data32 = new Uint32Array(1);
        const data8 = new Uint8Array(data32.buffer);

        this.rgba = [];
        for (let i = 0; i < count; i++) {
            const id = reader.readUInt8();

            // Load the YCrCbA value
            const y = reader.readUInt8();
            const cr = reader.readUInt8() - 128;
            const cb = reader.readUInt8() - 128;
            const a = reader.readUInt8();

            // Convert to rgba
            const r = PaletteDefinitionSegment.clamp(Math.round(y + 1.40200 * cr), 0, 255);
            const g = PaletteDefinitionSegment.clamp(Math.round(y - 0.34414 * cb - 0.71414 * cr), 0, 255);
            const b = PaletteDefinitionSegment.clamp(Math.round(y + 1.77200 * cb), 0, 255);

            // Convert to 32bit number for faster copy in the image decode.
            // We cannot use the bit-shifting here. The buffers will keep the systems endianness. The same endianness
            // must be used to write the rgba values to the pixel buffer to even out.
            data8[0] = r;
            data8[1] = g;
            data8[2] = b;
            data8[3] = a;
            this.rgba[id] = data32[0];
        }
    }

    private static clamp(value: number, min: number, max: number): number {
        return value < min ? min : value > max ? max : value;
    }
}
