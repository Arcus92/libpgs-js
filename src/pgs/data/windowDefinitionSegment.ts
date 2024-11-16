import {Segment} from "./segment";
import {SegmentType} from "./segmentType";
import {BigEndianBinaryReader} from "../../utils/bigEndianBinaryReader";

export class WindowDefinition {
    public id: number = 0;
    public horizontalPosition: number = 0;
    public verticalPosition: number = 0;
    public width: number = 0;
    public height: number = 0;
}

export class WindowDefinitionSegment implements Segment {
    public windows: WindowDefinition[] = [];

    public get segmentType(): number {
        return SegmentType.windowDefinition;
    }

    public read(reader: BigEndianBinaryReader, length: number): void {
        const count = reader.readUInt8();
        this.windows = [];
        for (let i = 0; i < count; i++) {
            const window = new WindowDefinition();
            window.id = reader.readUInt8();
            window.horizontalPosition = reader.readUInt16();
            window.verticalPosition = reader.readUInt16();
            window.width = reader.readUInt16();
            window.height = reader.readUInt16();

            this.windows.push(window);
        }
    }

}
