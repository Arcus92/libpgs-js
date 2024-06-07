import {Segment} from "./segment";
import {SegmentType} from "./segmentType";
import {BigEndianBinaryReader} from "../utils/bigEndianBinaryReader";

export class PaletteEntry {
    public y: number = 0;
    public cr: number = 0;
    public cb: number = 0;

    public r: number = 0;
    public g: number = 0;
    public b: number = 0;

    public a: number = 0;
}

export class PaletteDefinitionSegment implements Segment {
    public id: number = 0;
    public versionNumber: number = 0;
    public entries: { [key: number]: PaletteEntry } = {};

    public get segmentType(): number {
        return SegmentType.paletteDefinition;
    }

    public read(reader: BigEndianBinaryReader, length: number): void {
        this.id = reader.readUInt8();
        this.versionNumber = reader.readUInt8();

        const count = (length - 2) / 5;
        this.entries = {};
        for (let i = 0; i < count; i++) {
            const id = reader.readUInt8();
            const entry = new PaletteEntry();

            // Load the YCrCbA value
            entry.y = reader.readUInt8();
            entry.cr = reader.readUInt8();
            entry.cb = reader.readUInt8();
            entry.a = reader.readUInt8();

            // Also store the RGBA value
            const y = entry.y;
            const cb = entry.cb - 128;
            const cr = entry.cr - 128;
            entry.r = PaletteDefinitionSegment.clamp(Math.round(y + 1.40200 * cr), 0, 255);
            entry.g = PaletteDefinitionSegment.clamp(Math.round(y - 0.34414 * cb - 0.71414 * cr), 0, 255);
            entry.b = PaletteDefinitionSegment.clamp(Math.round(y + 1.77200 * cb), 0, 255);

            this.entries[id] = entry;
        }
    }

    private static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }
}
