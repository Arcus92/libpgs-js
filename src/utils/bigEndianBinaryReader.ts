export class BigEndianBinaryReader {
    private readonly buffer: Uint8Array;

    private current: number = 0;

    public constructor(buffer: Uint8Array) {
        this.buffer = buffer;
    }

    public get position(): number {
        return this.current;
    }

    public get length(): number {
        return this.buffer.length;
    }

    public readUInt8(): number {
        return this.buffer[this.current++];
    }

    public readUInt16(): number {
        const b1 = this.readUInt8();
        const b2 = this.readUInt8();
        return (b1 << 8) + b2;
    }

    public readUInt24(): number {
        const b1 = this.readUInt8();
        const b2 = this.readUInt8();
        const b3 = this.readUInt8();
        return (b1 << 16) + (b2 << 8) + b3;
    }

    public readUInt32(): number {
        const b1 = this.readUInt8();
        const b2 = this.readUInt8();
        const b3 = this.readUInt8();
        const b4 = this.readUInt8();
        return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4;
    }

    public readBytes(count: number): Uint8Array {
        const data = this.buffer.slice(this.current, this.current + count);
        this.current += count;
        return data;
    }
}
