import {Segment} from "./segment";
import {SegmentType} from "./segmentType";
import {BigEndianBinaryReader} from "../../utils/bigEndianBinaryReader";

export class CompositionObject {
    public id: number = 0;
    public windowId: number = 0;
    public croppedFlag: number = 0;
    public horizontalPosition: number = 0;
    public verticalPosition: number = 0;
    public croppingHorizontalPosition: number = 0;
    public croppingVerticalPosition: number = 0;
    public croppingWidth: number = 0;
    public croppingHeight: number = 0;
    public get hasCropping(): boolean {
        return (this.croppedFlag & 0x80) != 0
    }
}

export class PresentationCompositionSegment implements Segment {
    public width: number = 0;
    public height: number = 0;
    public frameRate: number = 0;
    public compositionNumber: number = 0;
    public compositionState: number = 0;
    public paletteUpdateFlag: number = 0;
    public paletteId: number = 0;
    public compositionObjects: CompositionObject[] = [];

    public get segmentType(): number {
        return SegmentType.presentationComposition;
    }

    public read(reader: BigEndianBinaryReader, length: number): void {
        this.width = reader.readUInt16();
        this.height = reader.readUInt16();
        this.frameRate = reader.readUInt8();
        this.compositionNumber = reader.readUInt16();
        this.compositionState = reader.readUInt8();
        this.paletteUpdateFlag = reader.readUInt8();
        this.paletteId = reader.readUInt8();

        const count = reader.readUInt8();
        this.compositionObjects = [];
        for (let i = 0; i < count; i++) {
            const compositionObject = new CompositionObject();
            compositionObject.id = reader.readUInt16();
            compositionObject.windowId = reader.readUInt8();
            compositionObject.croppedFlag = reader.readUInt8();
            compositionObject.horizontalPosition = reader.readUInt16();
            compositionObject.verticalPosition = reader.readUInt16();
            if (compositionObject.hasCropping) {
                compositionObject.croppingHorizontalPosition = reader.readUInt16();
                compositionObject.croppingVerticalPosition = reader.readUInt16();
                compositionObject.croppingWidth = reader.readUInt16();
                compositionObject.croppingHeight = reader.readUInt16();
            }

            this.compositionObjects.push(compositionObject);
        }
    }
}
