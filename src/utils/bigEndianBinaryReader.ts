import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

export class BigEndianBinaryReader {
    /**
     * The base binary reader.
     */
    private readonly reader: BinaryReader;

    public constructor(buffer: BinaryReader | Uint8Array) {
        if (buffer instanceof Uint8Array) {
            this.reader = new ArrayBinaryReader(buffer);
        }
        else {
            this.reader = buffer;
        }
    }

    public get position(): number {
        return this.reader.position;
    }

    public get length(): number {
        return this.reader.length;
    }

    public readUInt8(): number {
        return this.reader.readByte();
    }

    public readUInt16(): number {
        const b1 = this.reader.readByte();
        const b2 = this.reader.readByte();
        return (b1 << 8) + b2;
    }

    public readUInt24(): number {
        const b1 = this.reader.readByte();
        const b2 = this.reader.readByte();
        const b3 = this.reader.readByte();
        return (b1 << 16) + (b2 << 8) + b3;
    }

    public readUInt32(): number {
        const b1 = this.reader.readByte();
        const b2 = this.reader.readByte();
        const b3 = this.reader.readByte();
        const b4 = this.reader.readByte();
        return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4;
    }

    public readBytes(count: number): Uint8Array {
        return this.reader.readBytes(count);
    }
}
