import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";
import {AsyncBinaryReader} from "./asyncBinaryReader";

export class BigEndianBinaryReader {
    /**
     * The base binary reader.
     */
    private readonly baseReader: BinaryReader;

    /**
     * Set if `baseReader` is an async reader.
     */
    private readonly asyncReader?: AsyncBinaryReader;

    public constructor(buffer: BinaryReader | Uint8Array) {
        if (buffer instanceof Uint8Array) {
            this.baseReader = new ArrayBinaryReader(buffer);
        }
        else {
            this.baseReader = buffer;
        }

        // Handles async readers
        if ('requestData' in this.baseReader) {
            this.asyncReader = this.baseReader as AsyncBinaryReader;
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

    /**
     * Ensures that the given number of bytes is available to read synchronously.
     * This will wait until the data is ready to read if an underlying async stream is used.
     * @param count The number of bytes requested.
     * @return Returns if the requested number of bytes could be loaded.
     */
    public async requestData(count: number): Promise<boolean> {
        if (this.asyncReader) {
            return await this.asyncReader.requestData(count);
        }

        return this.baseReader.position + count <= this.baseReader.length;
    }
}
