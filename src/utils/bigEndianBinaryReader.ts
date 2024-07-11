import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

export class BigEndianBinaryReader {
    /**
     * The base binary reader.
     */
    public readonly baseReader: BinaryReader;

    public constructor(buffer: BinaryReader | Uint8Array) {
        if (buffer instanceof Uint8Array) {
            this.baseReader = new ArrayBinaryReader(buffer);
        }
        else {
            this.baseReader = buffer;
        }
    }

    public get position(): number {
        return this.baseReader.position;
    }

    public get length(): number {
        return this.baseReader.length;
    }

    public get eof(): boolean {
        return this.baseReader.eof;
    }

    public readUInt8(): number {
        return this.baseReader.readByte();
    }

    public readUInt16(): number {
        const b1 = this.baseReader.readByte();
        const b2 = this.baseReader.readByte();
        return (b1 << 8) + b2;
    }

    public readUInt24(): number {
        const b1 = this.baseReader.readByte();
        const b2 = this.baseReader.readByte();
        const b3 = this.baseReader.readByte();
        return (b1 << 16) + (b2 << 8) + b3;
    }

    public readUInt32(): number {
        const b1 = this.baseReader.readByte();
        const b2 = this.baseReader.readByte();
        const b3 = this.baseReader.readByte();
        const b4 = this.baseReader.readByte();
        return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4;
    }

    public readBytes(count: number): Uint8Array {
        return this.baseReader.readBytes(count);
    }
}
