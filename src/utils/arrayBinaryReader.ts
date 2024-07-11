import {BinaryReader} from "./binaryReader";

/**
 * A binary reader based on a {@link Uint8Array}.
 */
export class ArrayBinaryReader implements BinaryReader {
    private readonly array: Uint8Array;

    private $position: number = 0;

    public constructor(array: Uint8Array) {
        this.array = array;
    }

    public get position(): number {
        return this.$position;
    }

    public get length(): number {
        return this.array.length;
    }

    public get eof(): boolean {
        return this.position >= this.length;
    }

    public readByte(): number {
        return this.array[this.$position++];
    }

    public readBytes(count: number): Uint8Array {
        const data = this.array.slice(this.$position, this.$position + count);
        this.$position += count;
        return data;
    }
}
